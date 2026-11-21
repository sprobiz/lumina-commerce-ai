"""
database.py - SQLite 기반 크레딧, 구독 플랜, 거래내역, 분쟁 방지 로그 관리 모듈
- 1회 무료 체험 (Freemium Hook & Watermark) 트래킹 지원
- $19 / $39 / $89 신규 3단계 이커머스 요금제 쿼터 완벽 동기화
"""

import sqlite3
import os
import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "service.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def get_today_utc_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")

def init_db(initial_credits: int = 1):
    """데이터베이스 테이블 초기화 및 스키마 마이그레이션"""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # 유저 테이블 (일일 쿼터, 구독 정보, 1회 무료 체험 트래킹)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT,
                credits INTEGER NOT NULL DEFAULT 1,
                plan_id TEXT DEFAULT 'free',
                plan_type TEXT DEFAULT 'free',
                plan_expires_at REAL DEFAULT 0,
                daily_quota INTEGER DEFAULT 1,
                today_used INTEGER DEFAULT 0,
                last_reset_date TEXT DEFAULT '',
                total_generated_after_purchase INTEGER DEFAULT 0,
                free_trial_used INTEGER DEFAULT 0,
                created_at REAL NOT NULL
            )
        """)

        # 기존 DB 스키마 자동 마이그레이션 (컬럼 누락 방지)
        cursor.execute("PRAGMA table_info(users)")
        existing_cols = {r[1] for r in cursor.fetchall()}
        required_cols = {
            "plan_id": "TEXT DEFAULT 'free'",
            "plan_type": "TEXT DEFAULT 'free'",
            "plan_expires_at": "REAL DEFAULT 0",
            "daily_quota": "INTEGER DEFAULT 1",
            "today_used": "INTEGER DEFAULT 0",
            "last_reset_date": "TEXT DEFAULT ''",
            "total_generated_after_purchase": "INTEGER DEFAULT 0",
            "free_trial_used": "INTEGER DEFAULT 0"
        }
        for col, col_type in required_cols.items():
            if col not in existing_cols:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
        
        # 결제 거래 내역 테이블 (PayPal)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                order_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                plan_id TEXT,
                plan_type TEXT,
                amount TEXT NOT NULL,
                currency TEXT NOT NULL,
                status TEXT NOT NULL,
                paypal_response TEXT,
                agreement_accepted INTEGER NOT NULL DEFAULT 1,
                created_at REAL NOT NULL
            )
        """)
        
        # 생성된 이미지 히스토리 테이블
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS generations (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                prompt TEXT NOT NULL,
                negative_prompt TEXT,
                width INTEGER NOT NULL,
                height INTEGER NOT NULL,
                seed INTEGER,
                image_url TEXT NOT NULL,
                is_watermarked INTEGER DEFAULT 0,
                created_at REAL NOT NULL
            )
        """)

        # generations 테이블 마이그레이션
        cursor.execute("PRAGMA table_info(generations)")
        gen_cols = {r[1] for r in cursor.fetchall()}
        if "is_watermarked" not in gen_cols:
            cursor.execute("ALTER TABLE generations ADD COLUMN is_watermarked INTEGER DEFAULT 0")
        
        # 기본 유저 생성 (로컬 개발자 / 서비스 오너를 위한 영구 무제한 VIP 권한)
        today = get_today_utc_str()
        cursor.execute("SELECT id FROM users WHERE id = 'default_user'")
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO users 
                (id, email, credits, plan_id, plan_type, plan_expires_at, daily_quota, today_used, last_reset_date, free_trial_used, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, ("default_user", "owner@lumina.ai", 999999, "owner", "unlimited", 9999999999.0, 999999, 0, today, 0, time.time()))
        else:
            # 기존 default_user도 마스터 오너 무제한 유지
            cursor.execute("""
                UPDATE users SET 
                    plan_id = 'owner', 
                    plan_type = 'unlimited', 
                    plan_expires_at = 9999999999.0, 
                    daily_quota = 999999, 
                    credits = 999999,
                    today_used = 0
                WHERE id = 'default_user'
            """)
        conn.commit()

def get_user(user_id: str = "default_user") -> Dict[str, Any]:
    today = get_today_utc_str()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            # 신규 방문자/사용자 자동 등록 (1회 무료 체험 부여)
            now = time.time()
            cursor.execute("""
                INSERT OR IGNORE INTO users 
                (id, email, credits, plan_id, plan_type, daily_quota, today_used, last_reset_date, total_generated_after_purchase, free_trial_used, created_at)
                VALUES (?, ?, ?, 'free', 'free_trial', 1, 0, ?, 0, 0, ?)
            """, (user_id, f"{user_id}@guest.com", 1, today, now))
            conn.commit()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()

        user = dict(row)
        # UTC 00:00 일일 쿼터 리셋 점검
        last_reset = user.get("last_reset_date", "")
        if last_reset != today:
            cursor.execute("""
                UPDATE users SET today_used = 0, last_reset_date = ? WHERE id = ?
            """, (today, user_id))
            conn.commit()
            user["today_used"] = 0
            user["last_reset_date"] = today

        # 일일 남은 횟수 계산
        daily_quota = user.get("daily_quota") or 1
        today_used = user.get("today_used") or 0
        user["daily_quota"] = daily_quota
        user["today_used"] = today_used
        user["remaining_today"] = max(0, daily_quota - today_used)
        return user

def apply_plan_to_user(user_id: str, plan: Dict[str, Any]):
    """결제 완료 시 신규 3단계 플랜 적용"""
    now = time.time()
    plan_id = plan.get("id", "starter_monthly")
    plan_type = plan.get("type", "subscription")
    
    # 쿼터 매핑 ($19: 150장, $39: 500장, $89: 1800장)
    quota_mapping = {
        "starter_monthly": (150, 5, 31),
        "pro_monthly": (500, 17, 31),
        "pro_pass_3m": (1800, 20, 90)
    }
    total_quota, daily_quota, duration_days = quota_mapping.get(plan_id, (150, 5, 31))
    
    if "duration_days" in plan:
        duration_days = plan["duration_days"]
    if "daily_generations" in plan:
        daily_quota = plan["daily_generations"]

    expires_at = now + (duration_days * 86400)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users SET 
                plan_id = ?,
                plan_type = ?,
                plan_expires_at = ?,
                daily_quota = ?,
                today_used = 0,
                credits = ?,
                total_generated_after_purchase = 0
            WHERE id = ?
        """, (plan_id, plan_type, expires_at, daily_quota, total_quota, user_id))
        conn.commit()

def can_generate(user_id: str = "default_user") -> (bool, str):
    """
    생성 가능 여부 검사
    - 1순위: 오너 / 무제한 계정 (워터마크 없음)
    - 2순위: 활성 유료 플랜 계정 (워터마크 없음)
    - 3순위: 신규 미결제 유저의 1회 무료 체험 (워터마크 포함)
    """
    user = get_user(user_id)
    now = time.time()

    # 1. 서비스 오너 / 개발자 영구 무제한 패스
    if user["plan_id"] in ("owner", "master", "unlimited") or user["plan_type"] == "unlimited":
        return True, "unlimited"

    # 2. 활성화된 유료 플랜이 있는 경우
    if user["plan_id"] != "free" and user["plan_expires_at"] > now:
        if user["today_used"] < user["daily_quota"] or user["credits"] > 0:
            return True, "plan"
        else:
            return False, "오늘의 플랜 생성 한도를 모두 소진했습니다. (UTC 00:00에 리셋됩니다)"
    
    # 3. 비구독자 1회 무료 체험 (Freemium Hook)
    if user.get("free_trial_used", 0) == 0:
        return True, "free_trial"

    return False, "무료 체험 1회를 모두 사용하셨습니다. 상업용 8K 생성을 위해 플랜을 구독해주세요!"

def record_generation_use(user_id: str, gen_type: str):
    """생성 1회 소비 기록"""
    if gen_type == "unlimited":
        return

    with get_connection() as conn:
        cursor = conn.cursor()
        if gen_type == "plan":
            cursor.execute("""
                UPDATE users SET 
                    today_used = today_used + 1,
                    credits = MAX(0, credits - 1),
                    total_generated_after_purchase = total_generated_after_purchase + 1
                WHERE id = ?
            """, (user_id,))
        elif gen_type == "free_trial":
            cursor.execute("""
                UPDATE users SET 
                    free_trial_used = 1,
                    credits = 0
                WHERE id = ?
            """, (user_id,))
        else:
            cursor.execute("""
                UPDATE users SET 
                    credits = MAX(0, credits - 1),
                    total_generated_after_purchase = total_generated_after_purchase + 1
                WHERE id = ?
            """, (user_id,))
        conn.commit()

def record_transaction(order_id: str, user_id: str, plan_id: str, plan_type: str, amount: str, currency: str, status: str, paypal_response: dict, agreement_accepted: bool = True):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO transactions 
            (order_id, user_id, plan_id, plan_type, amount, currency, status, paypal_response, agreement_accepted, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            order_id,
            user_id,
            plan_id,
            plan_type,
            amount,
            currency,
            status,
            json.dumps(paypal_response),
            1 if agreement_accepted else 0,
            time.time()
        ))
        conn.commit()

def record_generation(gen_id: str, user_id: str, prompt: str, negative_prompt: str, width: int, height: int, seed: int, image_url: str, is_watermarked: bool = False):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO generations 
            (id, user_id, prompt, negative_prompt, width, height, seed, image_url, is_watermarked, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (gen_id, user_id, prompt, negative_prompt, width, height, seed, image_url, 1 if is_watermarked else 0, time.time()))
        conn.commit()

def get_generation_history(user_id: str = "default_user", limit: int = 30) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM generations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
