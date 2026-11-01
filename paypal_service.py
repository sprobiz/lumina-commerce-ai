"""
paypal_service.py - PayPal Subscriptions 및 Orders v2 결제 연동 모듈
분쟁 방지용 법적 동의 기록 및 안전 장치 포함
"""

import aiohttp
import json
import base64
import time
from typing import Dict, Any, Optional

class PayPalService:
    def __init__(self, mode: str = "sandbox", client_id: str = "", client_secret: str = "", plans: list = None):
        self.mode = mode.lower()
        self.client_id = client_id
        self.client_secret = client_secret
        self.plans = {p["id"]: p for p in (plans or [])}
        
        if self.mode == "live":
            self.api_url = "https://api-m.paypal.com"
        else:
            self.api_url = "https://api-m.sandbox.paypal.com"

        self._cached_token = None
        self._token_expires_at = 0

    def is_configured(self) -> bool:
        """PayPal API 인증키 유효성 검사"""
        return (
            bool(self.client_id) 
            and bool(self.client_secret) 
            and "YOUR_PAYPAL" not in self.client_id
        )

    async def get_access_token(self) -> Optional[str]:
        """OAuth2 Access Token 발급 및 캐싱"""
        if not self.is_configured():
            return None

        if self._cached_token and time.time() < self._token_expires_at - 60:
            return self._cached_token

        auth_header = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {"grant_type": "client_credentials"}

        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.api_url}/v1/oauth2/token", headers=headers, data=data) as resp:
                if resp.status == 200:
                    res_json = await resp.json()
                    self._cached_token = res_json.get("access_token")
                    expires_in = res_json.get("expires_in", 3600)
                    self._token_expires_at = time.time() + expires_in
                    return self._cached_token
                else:
                    text = await resp.text()
                    raise RuntimeError(f"PayPal 토큰 발급 실패 ({resp.status}): {text}")

    async def create_checkout(self, plan_id: str, user_id: str = "default_user", agreement_accepted: bool = False) -> Dict[str, Any]:
        """주문/구독 체크아웃 생성 (사전 동의 검증 필수)"""
        if not agreement_accepted:
            raise ValueError("이용약관 및 환불 불가 정책에 반드시 동의해야 결제를 진행할 수 있습니다.")

        plan = self.plans.get(plan_id)
        if not plan:
            raise ValueError(f"유효하지 않은 플랜 ID: {plan_id}")

        # 키 미설정 시 개발용 Mock 결제 지원
        if not self.is_configured():
            mock_id = f"MOCK-PAYPAL-{plan['type'].upper()}-{int(time.time())}"
            return {
                "order_id": mock_id,
                "status": "CREATED",
                "plan": plan,
                "is_mock": True,
                "agreement_accepted": True,
                "message": "PayPal Developer 키 미설정으로 인한 시뮬레이션 모드"
            }

        token = await self.get_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        description = f"Lumina AI - {plan['name']} ({plan['price_display']})"
        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": f"{plan_id}_{user_id}",
                    "description": description,
                    "amount": {
                        "currency_code": "USD",
                        "value": plan["price"]
                    },
                    "custom_id": f"user={user_id}|plan={plan_id}|agreed=true"
                }
            ],
            "application_context": {
                "brand_name": "Lumina AI",
                "landing_page": "NO_PREFERENCE",
                "user_action": "PAY_NOW",
                "shipping_preference": "NO_SHIPPING"
            }
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.api_url}/v2/checkout/orders", headers=headers, json=payload) as resp:
                if resp.status in (200, 201):
                    res_json = await resp.json()
                    return {
                        "order_id": res_json.get("id"),
                        "status": res_json.get("status"),
                        "plan": plan,
                        "raw": res_json,
                        "is_mock": False
                    }
                else:
                    text = await resp.text()
                    raise RuntimeError(f"PayPal 주문 생성 실패 ({resp.status}): {text}")

    async def capture_payment(self, order_id: str, plan_id: str) -> Dict[str, Any]:
        """결제 승인 및 캡처 (Capture Order)"""
        plan = self.plans.get(plan_id)
        if not plan:
            raise ValueError(f"유효하지 않은 플랜 ID: {plan_id}")

        if order_id.startswith("MOCK-PAYPAL-") or not self.is_configured():
            return {
                "success": True,
                "order_id": order_id,
                "plan": plan,
                "status": "COMPLETED",
                "is_mock": True
            }

        token = await self.get_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.api_url}/v2/checkout/orders/{order_id}/capture", headers=headers, json={}) as resp:
                if resp.status in (200, 201):
                    res_json = await resp.json()
                    status = res_json.get("status")
                    if status == "COMPLETED":
                        return {
                            "success": True,
                            "order_id": order_id,
                            "plan": plan,
                            "status": status,
                            "raw": res_json,
                            "is_mock": False
                        }
                    else:
                        return {
                            "success": False,
                            "order_id": order_id,
                            "status": status,
                            "raw": res_json
                        }
                else:
                    text = await resp.text()
                    raise RuntimeError(f"PayPal 결제 캡처 실패 ({resp.status}): {text}")
