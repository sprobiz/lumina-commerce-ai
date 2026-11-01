# 🚀 Lumina AI 24시간 클라우드 상용 배포 완벽 매뉴얼 (B방식)

내 PC를 켜둘 필요 없이, **내 컴퓨터를 꺼도 1년 365일 24시간 전 세계 고객이 접속해서 결제하고 이미지를 생성할 수 있는 완전 자동화 클라우드 아키텍처**입니다.

---

## 💰 예상 운영 비용 (초가성비 구성)

| 항목 | 서비스 | 예상 비용 | 특징 |
| :--- | :--- | :--- | :--- |
| **도메인** | **호스팅케이알 (Hosting.kr)** | 연 약 10,000원 ~ 15,000원 (약 $10) | 1년 단위 계약, 한국어 지원 편리 |
| **DNS / SSL** | **Cloudflare (클라우드플레어)** | **$0 (완전 무료)** | 글로벌 DDoS 방어 + 무료 HTTPS 자물쇠 |
| **웹/결제 서버** | **Render / Vercel** 또는 **월 $5 VPS** | **월 $0 ~ $5** (부담 제로) | 내 PC 꺼도 24시간 웹사이트 & 결제 작동 |
| **GPU 엔진** | **RunPod (런팟) Serverless** | **장당 약 4원 ($0.003)** (종량제) | 고객이 이미지를 만들 때만 초당 과금 |

> [!NOTE]
> 고객에게 월 $15 (40장), 월 $30 (150장)를 받고, 실제 GPU 원가는 한 장당 4원 수준이므로 **마진율이 90% 이상** 유지되는 매우 안전한 수익 구조입니다.

---

## 📅 B방식 5일 실행 로드맵 (Checklist)

- [ ] **Day 1: 호스팅케이알에서 도메인 구매 & Cloudflare 네임서버 등록 (15분)**
- [ ] **Day 2: 24시간 웹 서버 배포 (Render / Vercel에 코드 업로드, 15분)**
- [ ] **Day 3: RunPod 클라우드 GPU에 ComfyUI 연결 (15분)**
- [ ] **Day 4: PayPal Live 실결제 키 등록 & config.json 연동 (10분)**
- [ ] **Day 5: 1회 실결제 테스트 & 런칭 홍보 시작! (30분)**

---

## 🏷️ Day 1. 호스팅케이알 도메인 구매 & Cloudflare 연결

### 1-1. 호스팅케이알(Hosting.kr)에서 도메인 구매
1. [호스팅케이알](https://www.hosting.kr/) 접속 및 로그인
2. 도메인 검색창에 원하는 도메인 검색:
   - `lumina-ai.com` (또는 `lumina-art.com`, `uselumina.com` 등)
3. 1년 단위로 결제합니다. (약 10,000원 ~ 15,000원)

### 1-2. Cloudflare 무료 네임서버 등록
1. [Cloudflare.com](https://dash.cloudflare.com/sign-up) 무료 가입
2. 메인 대시보드에서 **[+ 사이트 추가]** 클릭 -> 구매한 도메인(예: `lumina-ai.com`) 입력
3. 플랜 선택에서 맨 아래 **Free ($0)** 선택
4. Cloudflare가 제공하는 2개의 네임서버 주소 복사:
   - 예: `aria.ns.cloudflare.com`, `bob.ns.cloudflare.com`
5. **호스팅케이알 사이트 접속**:
   - `[나의 도메인]` -> 도메인 관리 -> **[네임서버 변경]** 클릭
   - 1차, 2차 네임서버에 Cloudflare 주소를 입력하고 저장 (10분~30분 내 자동 연결 완료)

---

## ☁️ Day 2. 24시간 웹 서버 배포 (Render / Vercel, 월 $0~$5)

> 내 컴퓨터를 꺼도 1년 365일 24시간 사이트가 열려 있고 결제가 동작하는 웹 서버입니다.

1. **GitHub에 코드 올리기**:
   - 현재 작업한 Lumina AI 폴더 코드를 본인 깃허브 비공개(Private) 저장소에 푸시합니다.
2. **Render.com (또는 월 $5짜리 가벼운 리눅스 VPS)** 가입:
   - [Render.com](https://render.com/) 가입 후 **[New Web Service]** 클릭
   - 깃허브 저장소 연결
   - Start Command: `python server.py`
   - 요금제: Free 또는 Starter ($7/월)
3. **커스텀 도메인 연결**:
   - Render 대시보드 `Custom Domains`에 `lumina-ai.com` 입력
   - Cloudflare DNS에 CNAME 레코드 한 줄만 추가하면 즉시 `https://lumina-ai.com`으로 24시간 접속 가능!

---

## ⚡ Day 3. Qwen-Image 2.1 Turbo (4비트) 모델 3종 세팅

> 공유해주신 **공식 8노드 초고속 파이프라인**을 위한 3개 모델 파일 배치 안내입니다.

1. **Diffusion 모델 (Unet)**:
   - 폴더: `ComfyUI/models/diffusion_models/` (또는 `unet/`)
   - 파일: `qwen-image-2.1-turbo-Q4_K_M.gguf`
   - [다운로드 링크](https://huggingface.co/unsloth/Qwen-Image-2.1-Turbo-GGUF/resolve/main/qwen-image-2.1-turbo-Q4_K_M.gguf)
2. **텍스트 인코더 (CLIP)**:
   - 폴더: `ComfyUI/models/text_encoders/`
   - 파일: `qwen3vl_8b_w4a8.safetensors`
   - [다운로드 링크](https://huggingface.co/Comfy-Org/Qwen-Image-2.1/resolve/main/text_encoders/qwen3vl_8b_w4a8.safetensors)
3. **VAE 모델**:
   - 폴더: `ComfyUI/models/vae/`
   - 파일: `qwen_image_2.1_vae_bf16.safetensors`
   - [다운로드 링크](https://huggingface.co/Comfy-Org/Qwen-Image-2.1/resolve/main/vae/qwen_image_2.1_vae_bf16.safetensors)

> **💡 장점**: 1024×1024 고화질을 **단 8스텝(cfg 1.0, euler, simple)**으로 2~4초 만에 완성합니다.

---

## 💳 Day 4. PayPal Live (실제 결제) 연동

1. [PayPal Developer Dashboard](https://developer.paypal.com/) 로그인
2. 상단 토글을 **Sandbox**에서 **Live**로 변경
3. **[Apps & Credentials]** -> **[Create App]** (`Lumina AI`)
4. 발급된 **Live Client ID**와 **Live Secret Key**를 `config.json`에 입력:
   ```json
   "paypal": {
     "mode": "live",
     "client_id": "실제_LIVE_CLIENT_ID",
     "client_secret": "실제_LIVE_SECRET_KEY",
     "currency": "USD"
   }
   ```
5. 고객이 Starter($15), Pro($30), 3-Month Pass($74) 결제 시 내 페이팔 비즈니스 계좌로 즉시 대금이 입금됩니다.

---

## 📣 Day 5. 런칭 테스트 & 바이럴 마케팅

1. **1회 실결제 테스트**:
   - 스마트폰으로 `https://내도메인.com`에 접속하여 직접 $15 결제 진행
   - 페이팔 계좌 입금 확인 및 오늘 생성 횟수 40회 충전 확인
2. **SNS 쇼츠/릴스/틱톡 영상 홍보**:
   - "이 고화질 AI 사진, 프롬프트 한 줄로 5초 만에 제작! 무료 체험 링크 프로필에 있어요 👉 `lumina-ai.com`"
3. **X(트위터) & 커뮤니티**:
   - 고화질 AI 결과물 4장 + 사용 프롬프트 첨부하여 글로벌 홍보

---

## 📂 핵심 파일 바로가기
- [웹 프론트엔드 UI (`index.html`)](file:///c:/Users/ASUS/.antigravity-ide/23\)_이미지생성_Comfy_에이전트/index.html)
- [다크 테마 & 요금제 CSS (`style.css`)](file:///c:/Users/ASUS/.antigravity-ide/23\)_이미지생성_Comfy_에이전트/style.css)
- [메인 API 서버 (`server.py`)](file:///c:/Users/ASUS/.antigravity-ide/23\)_이미지생성_Comfy_에이전트/server.py)
- [환경설정 파일 (`config.json`)](file:///c:/Users/ASUS/.antigravity-ide/23\)_이미지생성_Comfy_에이전트/config.json)
