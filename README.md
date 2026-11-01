# ✨ Lumina AI - ComfyUI 기반 이미지 생성 SaaS 웹 서비스

Lumina AI는 **ComfyUI GPU 렌더링 파이프라인**, **PayPal 월간 구독/일회성 결제**, **분쟁(Dispute) 방지 사전 동의 플로우**, 그리고 **법적 환불 정책(Refund Policy)**을 완벽하게 내장한 독립형 AI 이미지 생성 SaaS 웹 플랫폼입니다.

---

## 🌟 주요 기능 및 구조

1. **🎨 ComfyUI 연동 엔진 (`comfy_service.py`)**
   - ComfyUI API (`/prompt`, `/history`, `/view`) 기반 표준 Text-to-Image 파이프라인
   - ComfyUI 오프라인 상태에서도 UI와 결제 파이프라인을 테스트할 수 있는 **데모 시뮬레이션 Fallback 모드** 내장

2. **💳 PayPal 고전환율 요금제 & 분쟁 방지 (`paypal_service.py`)**
   - **Starter Plan**: $15/월 (일일 40장, 1024x1024)
   - **Pro Monthly Plan**: $30/월 (일일 150장, HD Upscale, 4장 동시 생성, GPU 우선 큐)
   - **Pro 3-Month Pass**: $74 일회성 결제 (~18% 할인, 90일간 Pro 혜택)
   - **사전 동의 검증**: 이용약관 및 환불 불가 정책 체크박스 미동의 시 결제 진입 차단
   - **법적 환불 정책 (Refund Policy)** 전용 모달 내장 (5장 초과 생성 시 환불 불가 등 규정)

3. **🗄️ SQLite 데이터베이스 (`database.py`)**
   - 사용자 계정 및 플랜 관리
   - 매일 UTC 00:00 일일 할당량(Daily Quota) 자동 리셋
   - 거래 내역 및 분쟁 대응용 법적 동의 플래그(`agreement_accepted = 1`) 영구 보관
   - 생성 이미지 메타데이터 및 히스토리 관리

---

## 🚀 빠른 시작 (Quick Start)

### 1. 서비스 실행
```bash
python server.py
```
- 브라우저 접속: **`http://localhost:8000`**

### 2. ComfyUI 연동 (실제 이미지 렌더링 시)
- 로컬 PC 또는 클라우드 GPU에서 ComfyUI 실행 (`http://127.0.0.1:8188`)
- 모델 체크포인트(`v1-5-pruned-emaonly.safetensors` 또는 SDXL 모델)를 ComfyUI `models/checkpoints/`에 배치

### 3. PayPal Live 연동 설정
- `config.json`의 `paypal` 항목에 Developer 키 입력:
  ```json
  "paypal": {
    "mode": "live",
    "client_id": "실제_PAYPAL_LIVE_CLIENT_ID",
    "client_secret": "실제_PAYPAL_LIVE_CLIENT_SECRET"
  }
  ```

---

## 📂 프로젝트 파일 구조

```
23)_이미지생성_Comfy_에이전트/
├── index.html           # Lumina AI 모던 프론트엔드 UI
├── style.css            # 다크 테마 & 요금제 CSS 스타일시트
├── app.js               # 프론트엔드 비즈니스 로직 & 결제 SDK 연동
├── server.py            # 메인 aiohttp 비동기 웹/API 서버
├── comfy_service.py     # ComfyUI API 통신 및 워크플로우 제어
├── paypal_service.py    # PayPal Orders/Subscriptions REST v2 연동
├── database.py          # SQLite 유저, 쿼터, 결제내역 DB 모듈
├── config.json          # 서버 포트, ComfyUI 주소, 요금제 설정
├── service.db           # SQLite 로컬 데이터베이스
├── outputs/             # 생성된 이미지 저장 디렉터리
├── requirements.txt     # 파이썬 핵심 의존성 목록
└── package.json         # 프로젝트 메타데이터
```
