"""
database.py - SQLite 기반 크레딧, 구독 플랜, 거래내역, 분쟁 방지 로그 관리 모듈
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

def init_db(initial_credits: int = 10):
    """데이터베이스 테이블 초기화"""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # 유저 테이블 (일일 쿼터 및 구독 정보 포함)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT,
                credits INTEGER NOT NULL DEFAULT 10,
                plan_id TEXT DEFAULT 'free',
                plan_type TEXT DEFAULT 'free',
                plan_expires_at REAL DEFAULT 0,
                daily_quota INTEGER DEFAULT 10,
                today_used INTEGER DEFAULT 0,
                last_reset_date TEXT DEFAULT '',
                total_generated_after_purchase INTEGER DEFAULT 0,
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
            "daily_quota": "INTEGER DEFAULT 10",
            "today_used": "INTEGER DEFAULT 0",
            "last_reset_date": "TEXT DEFAULT ''",
            "total_generated_after_purchase": "INTEGER DEFAULT 0"
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
                created_at REAL NOT NULL
            )
        """)
        
        # 기본 유저 생성
        today = get_today_utc_str()
        cursor.execute("SELECT id FROM users WHERE id = 'default_user'")
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO users 
                (id, email, credits, plan_id, plan_type, plan_expires_at, daily_quota, today_used, last_reset_date, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, ("default_user", "creator@example.com", initial_credits, "free", "free", 0, 10, 0, today, time.time()))
        conn.commit()

def get_user(user_id: str = "default_user") -> Dict[str, Any]:
    today = get_today_utc_str()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            init_db()
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
        daily_quota = user.get("daily_quota") or 10
        today_used = user.get("today_used") or 0
        user["daily_quota"] = daily_quota
        user["today_used"] = today_used
        user["remaining_today"] = max(0, daily_quota - today_used)
        return user

def apply_plan_to_user(user_id: str, plan: Dict[str, Any]):
    """결제 완료 시 플랜 적용"""
    now = time.time()
    plan_id = plan["id"]
    plan_type = plan.get("type", "subscription")
    daily_quota = plan.get("daily_generations", 40)
    
    # 3-Month Pass인 경우 90일, 월간인 경우 31일 설정
    duration_days = plan.get("duration_days", 31)
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
                total_generated_after_purchase = 0
            WHERE id = ?
        """, (plan_id, plan_type, expires_at, daily_quota, user_id))
        conn.commit()

def can_generate(user_id: str = "default_user") -> (bool, str):
    """생성 가능 여부 검사 (플랜 일일 한도 또는 크레딧 확인)"""
    user = get_user(user_id)
    now = time.time()

    # 활성화된 플랜이 있는 경우
    if user["plan_id"] != "free" and user["plan_expires_at"] > now:
        if user["today_used"] < user["daily_quota"]:
            return True, "plan"
        else:
            return False, "오늘의 플랜 생성 한도를 모두 소진했습니다. (UTC 00:00에 리셋됩니다)"
    
    # 무료 또는 플랜 만료인 경우 기본 크레딧 차감
    if user["credits"] > 0:
        return True, "credit"

    return False, "크레딧이 부족하거나 오늘의 플랜 한도를 소진했습니다. 플랜을 업그레이드해주세요!"

def record_generation_use(user_id: str, gen_type: str):
    """생성 1회 소비 기록"""
    with get_connection() as conn:
        cursor = conn.cursor()
        if gen_type == "plan":
            cursor.execute("""
                UPDATE users SET 
                    today_used = today_used + 1,
                    total_generated_after_purchase = total_generated_after_purchase + 1
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

def record_generation(gen_id: str, user_id: str, prompt: str, negative_prompt: str, width: int, height: int, seed: int, image_url: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO generations 
            (id, user_id, prompt, negative_prompt, width, height, seed, image_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (gen_id, user_id, prompt, negative_prompt, width, height, seed, image_url, time.time()))
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
