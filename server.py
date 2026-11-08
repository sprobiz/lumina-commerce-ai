"""
server.py - ComfyStudio AI 이미지 SaaS 백엔드 메인 서버 (aiohttp)
- 3가지 SaaS 요금제 (Starter $15, Pro $30, Pro 3-Month $74)
- PayPal 결제 및 분쟁 방지 필수 동의 로직
- 일일 할당량(Daily Quota) 관리
"""

import os
import json
import asyncio
from aiohttp import web

from database import (
    init_db,
    get_user,
    can_generate,
    record_generation_use,
    apply_plan_to_user,
    record_transaction,
    record_generation,
    get_generation_history
)
from comfy_service import ComfyService
from paypal_service import PayPalService

# 설정 파일 로드
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    config = json.load(f)

# DB 초기화
init_db(initial_credits=config["service"].get("initial_free_credits", 10))

# 서비스 인스턴스 초기화
comfy_service = ComfyService(
    base_url=config["comfyui"].get("base_url", "http://127.0.0.1:8188"),
    output_dir=config["service"].get("output_dir", "./outputs")
)

paypal_service = PayPalService(
    mode=config["paypal"].get("mode", "sandbox"),
    client_id=config["paypal"].get("client_id", ""),
    client_secret=config["paypal"].get("client_secret", ""),
    plans=config["paypal"].get("plans", [])
)

routes = web.RouteTableDef()

REFUND_POLICY_TEXT = """
REFUND & CANCELLATION POLICY

1. Digital Goods & GPU Consumption Notice
Our service provides real-time AI image generation powered by dedicated GPU cloud resources. Because computing power and server costs are incurred immediately upon image generation, completed generations cannot be revoked.

2. Eligibility for Refund
- Full Refund: Eligible within 7 days of purchase ONLY IF the user has generated fewer than 5 images (or consumed less than 5% of their daily quota).
- Once more than 5 images have been generated, the purchase is strictly NON-REFUNDABLE.
- 3-Month Pass ($74): After 7 days from purchase or upon generating more than 5 images, no pro-rated refunds will be issued for the remaining days.

3. Results & Quality Disclaimer
Variations in artistic preference, prompt interpretation by the AI model, or subjective dissatisfaction with generated artwork do not qualify for a refund. We recommend reviewing sample outputs prior to subscribing.

4. Service Errors & Downtime
In the event of failed generations due to server or ComfyUI pipeline errors, consumed credits will be automatically replenished to your daily balance. Cash refunds are not provided for temporary server interruptions.

5. Subscription Cancellation
You may cancel your monthly subscription at any time via your account dashboard or through your PayPal account. Upon cancellation, your plan will remain active until the end of the current billing cycle, with no further recurring charges.
""".strip()

@routes.get("/api/status")
async def handle_status(request):
    """서버 및 연동 컴포넌트 상태 확인"""
    is_comfy = await comfy_service.is_comfy_online()
    paypal_ready = paypal_service.is_configured()
    return web.json_response({
        "status": "online",
        "comfyui": {
            "online": is_comfy,
            "url": comfy_service.base_url,
            "mode": "live" if is_comfy else "fallback_demo"
        },
        "paypal": {
            "configured": paypal_ready,
            "mode": paypal_service.mode,
            "client_id": paypal_service.client_id if paypal_ready else None
        }
    })

@routes.get("/api/user")
async def handle_get_user(request):
    """현재 사용자 정보 및 플랜/할당량 반환"""
    user_id = request.query.get("user_id", "default_user")
    user = get_user(user_id)
    return web.json_response(user)

@routes.get("/api/plans")
async def handle_get_plans(request):
    """요금제 플랜 및 환불 정책 반환"""
    return web.json_response({
        "plans": config["paypal"].get("plans", []),
        "paypal_client_id": paypal_service.client_id if paypal_service.is_configured() else "sb",
        "refund_policy": REFUND_POLICY_TEXT
    })

@routes.get("/api/refund-policy")
async def handle_refund_policy(request):
    return web.Response(text=REFUND_POLICY_TEXT, content_type="text/plain; charset=utf-8")

@routes.post("/api/upload-image")
async def handle_upload_image(request):
    """Image-to-Image 용 참조 이미지 업로드 및 ComfyUI 전달"""
    try:
        reader = await request.multipart()
        field = await reader.next()
        if not field:
            return web.json_response({"error": "업로드할 이미지가 없습니다."}, status=400)

        filename = field.filename or "upload.png"
        content = await field.read()

        comfy_filename = await comfy_service.upload_image(content, filename)
        return web.json_response({
            "success": True,
            "filename": comfy_filename
        })
    except Exception as e:
        return web.json_response({"error": f"이미지 업로드 실패: {str(e)}"}, status=500)

@routes.post("/api/generate")
async def handle_generate(request):
    """이미지 생성 요청"""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "잘못된 JSON 요청입니다."}, status=400)

    user_id = data.get("user_id", "default_user")
    prompt = data.get("prompt", "").strip()
    negative_prompt = data.get("negative_prompt", "").strip()
    width = int(data.get("width", 512))
    height = int(data.get("height", 512))
    seed = data.get("seed")
    image_filename = data.get("image_filename")
    denoise = float(data.get("denoise", 0.85)) if data.get("denoise") is not None else 1.0

    if not prompt:
        return web.json_response({"error": "프롬프트를 입력해주세요."}, status=400)

    # 1. 생성 가능 여부 확인 (플랜 쿼터 또는 기본 크레딧)
    allowed, reason_or_type = can_generate(user_id)
    if not allowed:
        return web.json_response({"error": reason_or_type}, status=402)

    gen_type = reason_or_type

    try:
        # 2. 이미지 생성
        result = await comfy_service.generate_image(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            seed=seed,
            image_filename=image_filename,
            denoise=denoise
        )

        # 3. 사용량 차감 및 DB 기록
        record_generation_use(user_id, gen_type)

        record_generation(
            gen_id=result["id"],
            user_id=user_id,
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            seed=result["seed"],
            image_url=result["image_url"]
        )

        user_info = get_user(user_id)
        result["user"] = user_info
        return web.json_response(result)

    except Exception as e:
        return web.json_response({"error": f"이미지 생성 중 오류가 발생했습니다: {str(e)}"}, status=500)

@routes.post("/api/paypal/create-order")
async def handle_paypal_create_order(request):
    """페이팔 주문 생성 (약관 및 환불정책 동의 필수)"""
    data = await request.json()
    plan_id = data.get("plan_id")
    user_id = data.get("user_id", "default_user")
    agreement_accepted = bool(data.get("agreement_accepted", False))

    if not agreement_accepted:
        return web.json_response({
            "error": "이용약관 및 환불 정책(GPU 자원 소모성 상품 고지)에 동의해야 결제를 진행할 수 있습니다."
        }, status=400)

    if not plan_id:
        return web.json_response({"error": "플랜 ID가 필요합니다."}, status=400)

    try:
        order_info = await paypal_service.create_checkout(plan_id, user_id, agreement_accepted)
        return web.json_response(order_info)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

@routes.post("/api/paypal/capture-order")
async def handle_paypal_capture_order(request):
    """페이팔 결제 승인 및 플랜 활성화"""
    data = await request.json()
    order_id = data.get("order_id")
    plan_id = data.get("plan_id")
    user_id = data.get("user_id", "default_user")
    agreement_accepted = bool(data.get("agreement_accepted", True))

    if not order_id or not plan_id:
        return web.json_response({"error": "order_id와 plan_id는 필수입니다."}, status=400)

    try:
        capture_result = await paypal_service.capture_payment(order_id, plan_id)
        if capture_result.get("success"):
            plan = capture_result.get("plan", {})
            
            # 유저 플랜 적용
            apply_plan_to_user(user_id, plan)

            # 거래 기록 저장 (분쟁 방지용 법적 동의 플래그 1 기록)
            record_transaction(
                order_id=order_id,
                user_id=user_id,
                plan_id=plan_id,
                plan_type=plan.get("type", "subscription"),
                amount=plan.get("price", "0.00"),
                currency=config["paypal"].get("currency", "USD"),
                status="COMPLETED",
                paypal_response=capture_result.get("raw", {}),
                agreement_accepted=agreement_accepted
            )

            updated_user = get_user(user_id)
            return web.json_response({
                "success": True,
                "plan": plan,
                "user": updated_user,
                "message": f"🎉 {plan['name']}이 활성화되었습니다! 매일 {plan.get('daily_generations', 40)}회 생성이 제공됩니다."
            })
        else:
            return web.json_response({"error": "결제 승인에 실패했습니다."}, status=400)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

@routes.get("/api/history")
async def handle_get_history(request):
    """생성 히스토리 조회"""
    user_id = request.query.get("user_id", "default_user")
    history = get_generation_history(user_id=user_id, limit=30)
    return web.json_response({"history": history})

@routes.get("/")
async def handle_index(request):
    """메인 프론트엔드 웹페이지 서빙"""
    public_dir = os.path.abspath(os.path.dirname(__file__))
    return web.FileResponse(os.path.join(public_dir, "index.html"))

@routes.get("/manual")
async def handle_manual(request):
    """상용 배포 인터랙티브 대시보드 서빙"""
    public_dir = os.path.abspath(os.path.dirname(__file__))
    return web.FileResponse(os.path.join(public_dir, "DEPLOYMENT_DASHBOARD.html"))

@web.middleware
async def cors_middleware(request, handler):
    if request.method == "OPTIONS":
        response = web.Response(status=200)
    else:
        try:
            response = await handler(request)
        except web.HTTPException as ex:
            response = ex
        except Exception as ex:
            response = web.json_response({"error": str(ex)}, status=500)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

def create_app():
    app = web.Application(middlewares=[cors_middleware], client_max_size=50 * 1024 * 1024)
    app.add_routes(routes)

    output_dir = os.path.abspath(config["service"].get("output_dir", "./outputs"))
    os.makedirs(output_dir, exist_ok=True)
    app.router.add_static("/outputs", path=output_dir, name="outputs")

    public_dir = os.path.abspath(os.path.dirname(__file__))
    app.router.add_static("/", path=public_dir, name="static")

    return app

if __name__ == "__main__":
    app = create_app()
    port = config["server"].get("port", 8000)
    host = config["server"].get("host", "0.0.0.0")
    print(f"[Lumina AI] Server running at http://localhost:{port}")
    web.run_app(app, host=host, port=port)
