"""
server.py - Lumina Commerce AI 백엔드 메인 서버 (aiohttp)
- fal.ai 24시간 무중단 클라우드 서버리스 엔진 연동 (로컬 ComfyUI 의존성 제로)
- 가상 피팅(Virtual Try-on) 및 1초 누끼 자동 제거(/api/remove-bg)
- 1회 무료 체험 워터마크(Freemium Hook) 및 B2B 유료 구독 전환 ($19 / $39 / $89)
- PayPal Live 스마트 결제 및 분쟁 방지 필수 동의 연동
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
from fal_service import FalService
from paypal_service import PayPalService

# 설정 파일 로드
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    config = json.load(f)

# DB 초기화 (신규 유저 1회 무료 체험 기본값)
init_db(initial_credits=config["service"].get("initial_free_credits", 1))

# fal.ai 서버리스 클라우드 서비스 인스턴스 초기화
fal_config = config.get("fal_ai", {})
fal_service = FalService(
    api_key=os.environ.get("FAL_KEY") or fal_config.get("api_key", ""),
    model_endpoint=fal_config.get("model_endpoint", "fal-ai/flux/schnell"),
    tryon_endpoint=fal_config.get("tryon_endpoint", "fal-ai/fashn-tryon"),
    biremove_endpoint=fal_config.get("biremove_endpoint", "fal-ai/bria/background/remove"),
    timeout_seconds=fal_config.get("timeout_seconds", 60)
)

# PayPal 결제 서비스 인스턴스 초기화
paypal_service = PayPalService(
    mode=config["paypal"].get("mode", "live"),
    client_id=config["paypal"].get("client_id", ""),
    client_secret=config["paypal"].get("client_secret", ""),
    plans=config["paypal"].get("plans", [])
)

routes = web.RouteTableDef()

REFUND_POLICY_TEXT = """
LUMINA COMMERCE AI - TERMS & REFUND POLICY (STRICT 5-SHOT LIMIT)

1. Digital Goods & Compute Consumption Notice
Lumina Commerce AI provisions real-time cloud GPU resources immediately upon generation via dedicated serverless infrastructure. Because hardware computing power is strictly incurred per image rendered, completed generations cannot be revoked.

2. Eligibility for Refund
- Full refund is eligible within 7 days of purchase ONLY IF fewer than 5 images have been generated.
- Once more than 5 images are rendered, the purchase is strictly NON-REFUNDABLE under international digital goods merchant terms.
- 3-Month Pass ($89): After 7 days or upon generating more than 5 images, no pro-rated refunds will be issued for remaining days.

3. Commercial License
Subscribers receive 100% royalty-free commercial rights to use, modify, and resell all generated model shots across Amazon, Shopify, Etsy, TikTok Shop, and global advertising channels.

4. Subscription Cancellation
You may cancel recurring monthly billing at any time directly through your PayPal account dashboard, preventing future charges at the end of the current billing cycle.
""".strip()

@routes.get("/api/status")
async def handle_status(request):
    """서버 및 fal.ai / PayPal 연동 상태 확인"""
    return web.json_response({
        "status": "online",
        "service": "Lumina Commerce AI v2.0",
        "fal_ai": {
            "configured": fal_service.is_configured(),
            "model": fal_service.model_endpoint,
            "tryon_endpoint": fal_service.tryon_endpoint,
            "biremove_endpoint": fal_service.biremove_endpoint,
            "mode": "live_cloud" if fal_service.is_configured() else "demo_preview"
        },
        "paypal": {
            "configured": paypal_service.is_configured(),
            "mode": paypal_service.mode,
            "client_id": paypal_service.client_id if paypal_service.is_configured() else None
        }
    })

@routes.get("/api/user")
async def handle_get_user(request):
    """현재 사용자 정보 및 쿼터 반환"""
    user_id = request.query.get("user_id", "default_user")
    user = get_user(user_id)
    return web.json_response(user)

@routes.get("/api/plans")
async def handle_get_plans(request):
    """3단계 이커머스 플랜 ($19/$39/$89) 및 환불 정책 반환"""
    return web.json_response({
        "plans": config["paypal"].get("plans", []),
        "paypal_client_id": paypal_service.client_id if paypal_service.is_configured() else "BAAIPmk5qriDSaBAwhfhcDyAYSqaTniwslBBk_M5D7NUahWV-obdya0hI3FaHmquf4Gabh-TIYBZ79iAik",
        "refund_policy": REFUND_POLICY_TEXT
    })

@routes.get("/api/refund-policy")
async def handle_refund_policy(request):
    return web.Response(text=REFUND_POLICY_TEXT, content_type="text/plain; charset=utf-8")

@routes.post("/api/remove-bg")
async def handle_remove_bg(request):
    """
    1초 누끼 자동 제거 (Background Removal) 엔드포인트
    - 원본 제품 사진에서 배경을 투명화하여 가상 피팅 정밀도 향상
    """
    try:
        data = await request.json()
        image_data = data.get("image_data")
        if not image_data:
            return web.json_response({"error": "이미지 데이터가 필요합니다."}, status=400)

        result = await fal_service.remove_background(image_data)
        return web.json_response(result)
    except Exception as e:
        return web.json_response({"error": f"누끼 제거 실패: {str(e)}"}, status=500)

@routes.post("/api/generate/fal")
@routes.post("/api/generate")
async def handle_generate_fal(request):
    """
    fal.ai 서버리스 AI 모델 컷 생성 엔드포인트
    - 1회 무료 체험자에게는 워터마크(Freemium Hook) 합성 지침 전달
    - 유료 구독자 및 Owner에게는 깨끗한 8K 상업용 원본 제공
    """
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "잘못된 JSON 요청입니다."}, status=400)

    user_id = data.get("user_id", "default_user")
    prompt = data.get("prompt", "").strip()
    image_data = data.get("image_data")
    aspect_ratio = data.get("aspect_ratio", "square_hd")
    persona = data.get("persona", "female_editorial")
    scene = data.get("scene", "luxury_marble")
    seed = data.get("seed")

    # 클라이언트가 브라우저에서 직접 입력한 fal_key가 있을 경우 우선 적용
    client_fal_key = data.get("fal_key", "").strip()
    if client_fal_key:
        fal_service.set_api_key(client_fal_key)

    if not prompt:
        return web.json_response({"error": "프롬프트를 입력해주세요."}, status=400)

    # 1. 생성 가능 여부 확인
    allowed, reason_or_type = can_generate(user_id)
    if not allowed:
        return web.json_response({
            "error": reason_or_type,
            "requires_upgrade": True
        }, status=402)

    gen_type = reason_or_type
    is_watermarked = (gen_type == "free_trial")

    try:
        # 2. fal.ai 클라우드 렌더링
        result = await fal_service.generate_image(
            prompt=prompt,
            image_data=image_data,
            aspect_ratio=aspect_ratio,
            persona=persona,
            scene=scene,
            seed=seed
        )

        result["is_watermarked"] = is_watermarked
        result["watermark_text"] = config["service"].get("watermark_text", "LUMINA AI PREVIEW - NOT FOR COMMERCIAL USE")
        result["gen_type"] = gen_type

        # 3. 사용량 차감 및 DB 기록
        record_generation_use(user_id, gen_type)

        record_generation(
            gen_id=result["id"],
            user_id=user_id,
            prompt=prompt,
            negative_prompt=data.get("negative_prompt", ""),
            width=1024,
            height=1024,
            seed=result["seed"],
            image_url=result["image_url"],
            is_watermarked=is_watermarked
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
            "error": "이용약관 및 환불 정책(디지털 재화 5회 제한 고지)에 동의해야 결제를 진행할 수 있습니다."
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

            # 거래 기록 저장
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
                "message": f"🎉 {plan['name']}이 활성화되었습니다! 워터마크 없는 8K 상업용 생성이 제공됩니다."
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
    response = web.FileResponse(os.path.join(public_dir, "index.html"))
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

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
    
    if request.path.endswith((".html", ".js", ".css")) or request.path == "/":
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"

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
    print(f"[Lumina Commerce AI] Serverless backend running at http://localhost:{port}")
    web.run_app(app, host=host, port=port)
