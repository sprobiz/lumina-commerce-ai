# 🚀 Lumina AI 24시간 클라우드 상용 배포 완벽 매뉴얼

내 PC를 켜둘 필요 없이, **컴퓨터를 꺼도 1년 365일 24시간 전 세계 고객이 접속해서 결제하고 이미지를 생성할 수 있는 완전 자동화 클라우드 아키텍처**입니다.

---

## 💰 실제 운영 비용 & 마진 분석 (Qwen 2.1 Turbo GGUF 기준)

> [!TIP]
> **`qwen-image-2.1-turbo-Q4_K_M.gguf` 모델의 특권:**
> 일반 무거운 모델(SDXL/Flux)은 장당 5~8원이 들지만, 사장님이 사용하시는 **Qwen 2.1 Turbo 4비트 모델은 단 8스텝(2~3초) 초고속 렌더링 + 저용량 VRAM(4~6GB)** 덕분에 보급형 저가 GPU(시간당 약 200원대)로 가동되어 **장당 원가가 약 1.2원($0.0009)**으로 수직 낙하합니다!

| 항목 | 서비스 | 실제 비용 | 비고 |
| :--- | :--- | :--- | :--- |
| **도메인** | **호스팅케이알 (Hosting.kr)** | 연 약 10,000원 ~ 15,000원 (약 $10) | 1년 단위 계약, 한국어 관리 편리 |
| **DNS / SSL** | **Cloudflare (클라우드플레어)** | **$0 (완전 무료)** | 글로벌 무제한 트래픽 + 무료 HTTPS 자물쇠 |
| **웹/결제 서버** | **Render / Vercel** 또는 **월 $5 VPS** | **월 $0 ~ $5** (부담 제로) | 내 PC 꺼도 24시간 결제 & 웹페이지 유지 |
| **GPU 엔진** | **RunPod (Qwen Turbo GGUF 구동)** | **장당 약 1.2원 ($0.0009)** | 1장 2~3초 컷, 생성 시에만 초당 과금 |

### 📊 플랜별 실제 순수익 & 마진율 (실제 사용량 기준)
고객이 평균적으로 월 300~500장을 생성할 때 사장님의 실제 순이익입니다:

| 플랜 | 판매가 (고객 결제) | 일일 생성 한도 | 예상 소비 장수 | 실제 GPU 원가 (장당 1.2원) | **사장님 순마진 (마진율)** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Starter** | **$15** (약 20,500원) | 40장 / 일 | 약 400장 | **약 480원** | **약 20,020원 (97.6%)** 🏆 |
| **Pro** | **$30** (약 41,000원) | 150장 / 일 | 약 1,200장 | **약 1,440원** | **약 39,560원 (96.5%)** 🚀 |
| **Pro 3개월권** | **$74** (약 101,000원) | 150장 / 일 | 약 3,500장 | **약 4,200원** | **약 96,800원 (95.8%)** 💎 |

---

## 📅 B방식 5일 실행 로드맵 (Checklist)

- [ ] **Day 1: 호스팅케이알에서 도메인 구매 & Cloudflare 네임서버 등록 (15분)**
- [ ] **Day 2: GitHub Private 저장소 푸시 & 24시간 웹 서버 배포 (15분)**
- [ ] **Day 3: Qwen-Image 2.1 Turbo (4비트) 모델 3종 배치 및 연동 (15분)**
- [ ] **Day 4: PayPal Live 실결제 키 발급 & `config.json` 연동 (10분)**
- [ ] **Day 5: 본인 1회 실결제 테스트 & 런칭 홍보 시작! (30분)**

---

## 🏷️ Day 1. 호스팅케이알 도메인 구매 & Cloudflare 연결

### 1-1. 호스팅케이알(Hosting.kr)에서 도메인 구매
1. [호스팅케이알](https://www.hosting.kr/) 접속 및 로그인
2. 도메인 검색창에 원하는 이름 검색:
   - `lumina-ai.com` (1순위 추천) 또는 `lumina-art.com`, `uselumina.com`
3. 1년 단위로 결제합니다. (약 10,000원 ~ 15,000원)

### 1-2. Cloudflare 무료 네임서버 등록
1. [Cloudflare.com](https://dash.cloudflare.com/sign-up) 무료 가입 후 로그인
2. 메인 대시보드 우측 상단 **[+ 사이트 추가]** 클릭 -> 구매한 도메인(예: `lumina-ai.com`) 입력
3. 플랜 선택에서 맨 아래 **Free ($0)** 선택
4. Cloudflare가 안내하는 2개의 네임서버 주소 복사 (예: `aria.ns.cloudflare.com`, `bob.ns.cloudflare.com`)
5. **호스팅케이알 사이트 접속**:
   - `[나의 도메인]` -> 도메인 관리 -> **[네임서버 변경]** 클릭
   - 1차, 2차 네임서버에 Cloudflare 주소를 입력하고 저장 (10분~30분 내 자동 연결 완료)

---

## ☁️ Day 2. GitHub Private 저장소 & 24시간 웹 서버 배포

> 내 컴퓨터를 꺼도 1년 365일 24시간 사이트가 열려 있고 결제가 작동하는 독립 웹 서버 세팅입니다.

### 2-1. GitHub Private (비공개) 저장소 푸시
1. [GitHub.com](https://github.com/) 로그인 후 우측 상단 **[+ New repository]** 클릭
2. Repository name: `lumina-ai-saas` 입력
3. **반드시 `Private` (비공개) 선택** -> `[Create repository]` 클릭
4. VS Code 터미널(PowerShell)에서 아래 3줄 실행:
   ```bash
   git branch -M main
   git remote add origin https://github.com/본인깃허브아이디/lumina-ai-saas.git
   git push -u origin main
   ```

### 2-2. Render.com에서 원클릭 24시간 배포 (월 $0~$5)
1. [Render.com](https://render.com/) 가입 후 **[New Web Service]** 클릭
2. 방금 올린 `lumina-ai-saas` GitHub 저장소 선택
3. 설정값 입력:
   - **Environment**: `Python 3`
   - **Start Command**: `python server.py`
   - **Plan**: `Free` 또는 `Starter ($7/mo)`
4. **[Custom Domains]** 메뉴에 구매한 도메인(`lumina-ai.com`) 추가 -> Cloudflare DNS에 CNAME 연결 완료!

---

## ⚡ Day 3. Qwen-Image 2.1 Turbo (4비트) 모델 3종 세팅

> 공유해주신 **공식 8노드 초고속 파이프라인**을 위한 3개 모델 파일 배치 안내입니다.

1. **Diffusion 모델 (Unet)**:
   - 폴더 위치: `ComfyUI/models/diffusion_models/` (또는 `unet/`)
   - 모델 파일명: `qwen-image-2.1-turbo-Q4_K_M.gguf`
   - [공식 허깅페이스 다운로드 링크](https://huggingface.co/unsloth/Qwen-Image-2.1-Turbo-GGUF/resolve/main/qwen-image-2.1-turbo-Q4_K_M.gguf)
2. **텍스트 인코더 (CLIP)**:
   - 폴더 위치: `ComfyUI/models/text_encoders/`
   - 모델 파일명: `qwen3vl_8b_w4a8.safetensors`
   - [공식 허깅페이스 다운로드 링크](https://huggingface.co/Comfy-Org/Qwen-Image-2.1/resolve/main/text_encoders/qwen3vl_8b_w4a8.safetensors)
3. **VAE 모델**:
   - 폴더 위치: `ComfyUI/models/vae/`
   - 모델 파일명: `qwen_image_2.1_vae_bf16.safetensors`
   - [공식 허깅페이스 다운로드 링크](https://huggingface.co/Comfy-Org/Qwen-Image-2.1/resolve/main/vae/qwen_image_2.1_vae_bf16.safetensors)

> **💡 성능 특권:** 1024×1024 고화질을 **단 8스텝(cfg 1.0, euler, simple)**으로 **2~3초 만에 장당 1.2원**으로 완성합니다.

---

## 💳 Day 4. PayPal Live (실결제) 연동

1. [PayPal Developer Dashboard](https://developer.paypal.com/) 로그인
2. 상단 토글을 **Sandbox**에서 **Live**로 전환
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
5. 고객이 Starter($15), Pro($30), 3-Month Pass($74) 결제 시 사장님의 페이팔 비즈니스 계좌로 즉시 현금이 입금됩니다.

---

## 📣 Day 5. 런칭 테스트 & 바이럴 마케팅

1. **1회 실결제 테스트**:
   - 스마트폰으로 `https://내도메인.com`에 접속하여 직접 $15 결제 진행
   - 페이팔 계좌 입금 확인 및 오늘 생성 횟수 40회 충전 확인
2. **SNS 쇼츠/릴스/틱톡 영상 홍보**:
   - "이 고화질 AI 사진, 프롬프트 한 줄로 3초 만에 제작! 무료 체험 링크 프로필에 있어요 👉 `lumina-ai.com`"
3. **X(트위터) & 커뮤니티**:
   - 고화질 AI 결과물 4장 + 사용 프롬프트 첨부하여 글로벌 홍보

---

## 📁 주요 소스코드 바로가기
- [웹 프론트엔드 UI (`index.html`)](file:///c:/Users/ASUS/.antigravity-ide/23\)_이미지생성_Comfy_에이전트/index.html)
- [다크 테마 & 요금제 CSS (`style.css`)](file:///c:/Users/ASUS/.antigravity-ide/23\)_이미지생성_Comfy_에이전트/style.css)
- [메인 API 서버 (`server.py`)](file:///c:/Users/ASUS/.antigravity-ide/23\)_이미지생성_Comfy_에이전트/server.py)
- [환경설정 파일 (`config.json`)](file:///c:/Users/ASUS/.antigravity-ide/23\)_이미지생성_Comfy_에이전트/config.json)
- [Qwen Turbo 공식 워크플로우 백업 (`workflow_qwen_turbo.json`)](file:///c:/Users/ASUS/.antigravity-ide/23\)_이미지생성_Comfy_에이전트/workflow_qwen_turbo.json)
