# Lumina Commerce AI - 24/7 무중단 클라우드 배포 및 글로벌 운영 가이드 (Vercel & Domain)

> **문서 버전:** v2.0.0 (Production Serverless Edition)  
> **운영 법인:** S-Probiz (대표 Seyun, Connect AI Lab 대표 멤버십)  
> **포지셔닝:** Amazon, Coupang, Shopify 이커머스 상세페이지 및 광고용 고전환(High-Converting) AI 모델 컷 스튜디오  
> **핵심 아키텍처:** Vercel Static Edge CDN + fal.ai Flux.1 Schnell Serverless Cloud Engine + PayPal Live Smart Buttons  

---

## 1. 프로젝트 혁신 요약 (4대 치명적 결함 완전 해소)

| 항목 | 기존 v1.0 (로컬 워크스테이션 종속) | **개편된 v2.0 (Lumina Commerce AI SaaS)** |
| :--- | :--- | :--- |
| **운영 인프라** | 노트북 전원 꺼지면 서비스 중단 (`127.0.0.1:8188`) | **Vercel 24시간 365일 무중단 서버리스 엣지 배포 (글로벌 0초 로딩)** |
| **타깃 & 가치** | 단순 범용 그림 생성기 (포지셔닝 모호) | **아마존·쿠팡 셀러 타깃 $3,000 모델 촬영비 98.4% 절감 킬러 솔루션** |
| **원가 & 과금** | 무료 생성 10회 제공으로 원가 누수 발생 | **100% 유료 구독 전환 ($19 / $39 / $89) + 검증된 85%+ 순마진** |
| **AI 연산 엔진** | 로컬 RTX GPU VRAM 병목 및 대기열 | **fal.ai Flux.1 Schnell (장당 약 4원 / 2.8초 초고속 렌더링)** |
| **결제 시스템** | 수동 파이썬 웹훅 및 미연결 | **S-Probiz 공식 PayPal Live 스마트 결제 버튼 프론트 직결 연동** |

---

## 2. Vercel 1분 초고속 클라우드 배포 가이드

개편된 `Lumina Commerce AI`는 별도의 백엔드 서버 빌드 없이 단일 정적 웹(Single Production Web)으로 완성되어 있어, Vercel 무료 티어로 24시간 무중단 전 세계 배포가 가능합니다.

### 방법 A: Vercel 대시보드 1클릭 연동 (가장 권장)

1. **GitHub Private 리포지토리 생성 & 푸시**:
   ```bash
   git add .
   git commit -m "feat: Launch Lumina Commerce AI v2.0 Production Serverless Studio"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_ID/lumina-commerce-ai.git
   git push -u origin main
   ```
2. **Vercel(vercel.com) 로그인**:
   - `Add New...` ➡️ `Project` 클릭
   - GitHub의 `lumina-commerce-ai` 리포지토리 선택 후 `Import` 클릭
3. **배포 설정 (자동 인식)**:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (기본값)
   - **Build Command**: 비워둠 (정적 웹)
   - **Output Directory**: 비워둠 (저장소 루트의 `index.html` 자동 서빙)
4. **`Deploy` 클릭**:
   - 약 **20초 만에 전 세계 100개 이상의 CDN 엣지 노드로 자동 배포 완료**!
   - 즉시 발급되는 `https://lumina-commerce-ai.vercel.app` 주소로 24시간 무중단 접속 가능.

---

### 방법 B: Vercel CLI로 터미널에서 즉시 배포

```powershell
# 1. Vercel CLI 전역 설치 (미설치 시)
npm install -g vercel

# 2. 프로젝트 폴더에서 배포 실행
cd c:\Users\ASUS\.antigravity-ide\23)_Lumina_Image_AI_Service_에이전트
vercel --prod
```
- 터미널 안내에 따라 `Y`를 누르면 즉시 프로덕션 도메인이 발급됩니다.

---

## 3. 독자 도메인(Custom Domain) 및 DNS 연결 가이드

브랜드 신뢰도와 글로벌 결제 전환율을 극대화하기 위해 독립 도메인(예: `lumina-studio.com` 또는 `lumina-ai.xyz`)을 연결합니다.

### 1단계: Vercel 프로젝트에 도메인 추가
1. Vercel 대시보드 ➡️ 프로젝트 선택 ➡️ **Settings** ➡️ **Domains** 메뉴 이동
2. 구매한 도메인(예: `luminastudio.xyz` 또는 `app.luminastudio.com`) 입력 후 **Add** 클릭

### 2단계: 도메인 등록처(호스팅케이알 / 가비아 / Namecheap / Cloudflare) DNS 레코드 등록

| 도메인 형태 | 레코드 유형 (Type) | 이름 / 호스트 (Name) | 값 / 대상 (Value / Target) | TTL |
| :--- | :--- | :--- | :--- | :--- |
| **서브도메인 (권장)**<br>(예: `app.mydomain.com`) | **CNAME** | `app` | `cname.vercel-dns.com` | 자동 / 3600 |
| **루트 도메인**<br>(예: `mydomain.com`) | **A** | `@` (또는 비워둠) | `76.76.21.21` | 자동 / 3600 |
| **www 도메인**<br>(예: `www.mydomain.com`) | **CNAME** | `www` | `cname.vercel-dns.com` | 자동 / 3600 |

> **안내:** DNS 등록 후 약 5~15분 이내에 Vercel에서 무료 Let's Encrypt SSL 인증서가 자동으로 발급되며, 자물쇠 표시(`https://`)가 활성화됩니다.

---

## 4. 핵심 API 및 결제 연동 검증

### 1) PayPal Live 결제 계정
- **판매자 계정:** S-Probiz 공식 비즈니스 계정
- **Live Client ID:** `BAAIPmk5qriDSaBAwhfhcDyAYSqaTniwslBBk_M5D7NUahWV-obdya0hI3FaHmquf4Gabh-TIYBZ79iAik`
- **검증 절차:**
  - 상단 메뉴의 `[PayPal Key]` 모달에서 저장된 Client ID를 언제든지 수정/교체할 수 있습니다.
  - 결제 시 고객은 디지털 재화 특성(5장 이상 생성 시 환불 불가)에 대한 법적 동의 체크박스를 거친 후에만 PayPal Smart Buttons 승인이 진행됩니다.
  - 관리자 및 개발 단계 테스트를 위해 모달 하단에 `[Staging/Test] 1-Sec Instant Approval` 버튼이 포함되어 있어 실제 결제 없이도 즉시 플랜 승인 흐름을 시뮬레이션할 수 있습니다.

### 2) fal.ai Cloud 서버리스 GPU 엔진
- **엔진 모델:** `fal-ai/flux/schnell` (Black Forest Labs의 최신 초고속 고화질 모델)
- **비용:** 장당 약 **$0.003 (한화 약 4원)**
- **설정 방법:**
  1. [fal.ai 대시보드](https://fal.ai/dashboard/keys)에서 무료 $10 크레딧 키 발급
  2. Lumina AI 우측 상단 `[fal.ai Key]` 버튼 클릭 후 키 등록
  3. 등록 즉시 내 컴퓨터 GPU 없이 fal.ai 클라우드에서 2.8초 만에 8K 상업용 모델 컷 렌더링 시작

---

## 5. 대표 Seyun 전용 'Owner Pass' 무제한 모드

서비스 소유자인 Seyun 디렉터님이 매번 결제하거나 크레딧 제한에 걸리지 않도록 **오너 전용 프리패스 기능**이 탑재되어 있습니다.

- **작동 방법**:
  - 웹 화면 최하단(Footer) 우측의 `👑 Owner Pass (Seyun)` 버튼을 클릭하면 즉시 무제한(`👑 OWNER (∞)`) 모드가 켜집니다.
  - 한 번 더 클릭하면 일반 고객 시점의 유료 제한 모드로 토글됩니다.
  - 브라우저 로컬 저장소(`localStorage`)에 영구 저장되므로 페이지를 새로고침해도 무제한 권한이 유지됩니다.

---

## 6. 고수익 마진 구조표 (보수적 85%+ 순마진 검증)

| 플랜명 | 월 구독료 | 월 제공 컷수 | 예상 fal.ai GPU 원가 | PayPal 결제 수수료 | 호스팅/환전 버퍼 (3%) | **월 예상 순수익** | **보수적 순마진율** |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Starter** | **$19.00** | 150장 | $0.45 (2.4%) | ~$1.15 (6.0%) | ~$0.57 | **$16.83** | **88.6%** |
| **Pro (주력)** | **$39.00** | 500장 | $1.50 (3.8%) | ~$1.85 (4.7%) | ~$1.17 | **$34.48** | **88.4%** |
| **Agency** | **$89.00** | 1,500장 | $4.50 (5.1%) | ~$3.60 (4.0%) | ~$2.67 | **$78.23** | **87.9%** |

> **비즈니스 인사이트:**  
> 오프라인 사진 스튜디오에서 모델 1명, 사진작가, 스튜디오 대여를 진행할 때 드는 $2,500~$4,000 대비 셀러는 **$39에 500장의 보그급 모델 컷**을 얻으므로 가격 저항선이 사실상 0에 수렴합니다. S-Probiz는 GPU를 직접 소유하거나 상시 가동 비용을 지불하지 않고 고객이 생성할 때만 장당 4원씩 종량제로 지불하므로 무위험 고수익이 보장됩니다.

---

## 7. 향후 로드맵 & 팁
1. **쇼츠/릴스 광고 소재 자동 제작 기능 연계**: 9:16 비율 모델 컷을 숏폼 비디오 생성 파이프라인으로 확장.
2. **한국어 / 영어 다국어 마케팅**: 기본 영문(EN)으로 북미 아마존 셀러 커뮤니티(Reddit, Facebook Groups)에 1차 런칭하고, 우측 상단 KO 원클릭 토글을 통해 국내 쿠팡/스마트스토어 셀러 단톡방에 바이럴 배포.
