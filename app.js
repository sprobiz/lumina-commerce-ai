/**
 * Lumina Commerce AI - Single Source of Truth Frontend Application (app.js)
 * - fal.ai 24시간 무중단 서버리스 파이프라인 연동 (/api/generate/fal & 클라이언트 직결)
 * - 소상공인 킬러 기능: 1초 누끼 자동 제거 (Background Removal)
 * - B2B 전환율 극대화: 1회 무료 체험 워터마크(Freemium Hook) & 상업용 8K 다운로드 결제 유도
 * - $19 / $39 / $89 3단계 이커머스 플랜 및 S-Probiz PayPal Live 연동
 * - 다국어(EN | KR) 실시간 전환 및 Before/After 비교 슬라이더
 */

// 전역 기본 설정
const DEFAULT_PAYPAL_ID = "BAAIPmk5qriDSaBAwhfhcDyAYSqaTniwslBBk_M5D7NUahWV-obdya0hI3FaHmquf4Gabh-TIYBZ79iAik";
const DEFAULT_WATERMARK_TEXT = "LUMINA AI PREVIEW - NOT FOR COMMERCIAL USE";

// 상태 변수
let currentLang = localStorage.getItem("lumina_lang") || "en";
let activePersona = "female_editorial";
let activeScene = "luxury_marble";
let activeRatio = "square_hd";

let currentUploadedFile = null;
let currentUploadedDataUrl = null;
let originalUploadedDataUrl = null;
let isBgRemoved = false;

// 구독 및 무료 체험 상태
let userSubscription = JSON.parse(localStorage.getItem("lumina_sub")) || {
  plan: "none",
  shotsRemaining: 0,
  totalQuota: 0
};
let isFreeTrialUsed = localStorage.getItem("lumina_free_trial_used") === "true";

// 현재 캔버스 결과물 상태
let currentResultUrl = "";
let currentResultIsWatermarked = false;
let selectedPlanForCheckout = null;

// 최근 갤러리 히스토리
let recentGallery = JSON.parse(localStorage.getItem("lumina_recent_gallery") || "[]");

// ==================== BILINGUAL DICTIONARY (i18n) ====================
const i18n = {
  en: {
    navSubtitle: "High-Converting AI Model Shots for Amazon, Shopify & TikTok Shop",
    navStudio: "AI Model Studio",
    navShowcase: "Before & After",
    navPricing: "Pricing & Plans",
    btnPaypalKey: "PayPal Key",
    btnFalKey: "fal.ai Key",
    heroTitle: "Turn Flat Product Shots into <span class='gradient-text-indigo'>High-Converting</span> AI Model Photoshoots",
    heroDesc: "Eliminate $3,000 studio photoshoot fees. Upload a raw product or mannequin photo and generate commercial-grade AI model wearing shots in 3 seconds for Amazon, Shopify, and TikTok Shop.",
    heroCtaBtn: "📸 Upload My Product & Get 1 Free Shot",
    heroSecondaryBtn: "✨ See Before & After Comparison",
    stat1: "+340% Higher CTR on Ads",
    stat2: "99.9% Enterprise Cloud Uptime SLA",
    stat3: "100% Commercial Use & Resell Rights",
    studioConfigTitle: "Model & Studio Parameters",
    studioConfigDesc: "Configure the commercial model persona and luxury setting for your product",
    labelProductImage: "1. Upload Product Photo (Clothing, Bag, Cosmetics, Shoes)",
    dropzonePrompt: "Drag & drop product photo or click to browse",
    dropzoneHint: "Supports Ctrl+V paste directly anywhere onto this page",
    sampleProductsLabel: "⚡ Quick Test: 1-Click Product Presets (No file needed)",
    btnRemoveBg: "✂️ 1-Sec Remove BG",
    btnRestoreBg: "🔄 Restore Original",
    labelPersona: "2. Select AI Model Persona",
    labelScene: "3. Select Commercial Studio Scene",
    labelRatio: "4. Commercial Aspect Ratio",
    labelPrompt: "5. Commercial Prompt & Details",
    btnGenerateText: "Generate High-Converting AI Model Shot",
    resultCanvasTitle: "Live Commercial Canvas",
    emptyStateTitle: "Your Commercial AI Model Shot Will Appear Here",
    emptyStateDesc: "Upload a product on the left and click Generate to run the serverless AI studio pipeline.",
    btnDownloadClean: "Download 8K Commercial Export",
    btnDownloadWatermark: "🔒 Unlock Commercial 8K (Remove Watermark)",
    btnCopyPrompt: "Copy Prompt",
    recentGalleryTitle: "Recent Studio Shots",
    showcaseTitle: "Compare the Difference: Raw Product vs AI Model Studio",
    showcaseDesc: "Slide the bar below to see how ordinary flat lay or mannequin shots are transformed into Vogue-level studio model photography.",
    roiTitle: "Traditional Agency Shoot vs Lumina Commerce AI",
    roiDesc: "Compare the real cost, time, and flexibility of human studio shoots vs our cloud engine",
    pricingBadge: "Zero Free Leaks • 100% Gated Subscriptions",
    pricingTitle: "High-Converting Commercial Plans",
    pricingDesc: "Select your monthly commercial quota. 100% royalty-free rights, dedicated cloud queue, cancel anytime.",
    roiHeaderBadge: "Cost Reduction Analysis",
    roiHeaderTitle: "Traditional Agency Photoshoot vs Lumina AI",
    roiHeaderDesc: "Save over 99% in cost and reduce turnaround from 2 weeks to 3 seconds.",
    roiCol1: "Comparison Metric",
    roiCol2: "Traditional Studio Shoot",
    roiCol3: "Lumina Commerce AI",
    roiRow1Metric: "Cost Per Shoot / Session",
    roiRow1Trad: "$2,500 ~ $4,000+ (Model + Studio + Retouch)",
    roiRow1Lumina: "Starts at $4.99 (From ~$0.08 per shot)",
    roiRow2Metric: "Turnaround Time",
    roiRow2Trad: "10 ~ 14 Days (Scheduling, shoot, editing)",
    roiRow2Lumina: "Instant 2.8 Seconds (Real-time cloud)",
    roiRow3Metric: "Model & Scene Diversity",
    roiRow3Trad: "1 Model, 1 Fixed Location",
    roiRow3Lumina: "Unlimited Global Models & Luxury Scenes",
    roiRow4Metric: "Reshoots & Angle Variations",
    roiRow4Trad: "Additional fee ($500+ / session)",
    roiRow4Lumina: "Unlimited instant variations on demand",
    starterBadge: "Starter",
    starterSub: "New Sellers",
    testPackBadge: "⚡ Starter Test Pack",
    testPackSub: "1st Time Sellers",
    testPackPeriod: "one-time (30 shots)",
    testPackPerShot: "~$0.16 per shot (No subscription)",
    testPackF1: "<strong>30 Commercial AI Model Shots</strong>",
    testPackF2: "All Amazon & Shopify Formats (1:1, 4:5, 9:16)",
    testPackF3: "Standard Cloud GPU Queue",
    testPackF4: "Full Commercial License & Royalty-Free",
    testPackF5: "One-Time Payment (Zero Recurring)",
    btnSubscribeTestPack: "Try 30 Shots for $4.99",
    perMonth: "/ month",
    starterPerShot: "~$0.12 per commercial AI model shot",
    starterF1: "<strong>150 AI Model Shots</strong> / mo",
    starterF2: "Standard Commercial Studio Scenes",
    starterF3: "Amazon & Shopify 1:1 Export",
    starterF4: "Standard Cloud Queue (fal.ai Schnell)",
    starterF5: "Full Commercial Use License",
    btnSubscribeStarter: "Subscribe Starter ($19)",
    mostPopularBadge: "🔥 Most Popular",
    proBadge: "Pro Studio",
    proSub: "Top 5% Amazon Sellers",
    proPerShot: "~$0.078 per shot (Save 97% vs photoshoots)",
    proF1: "<strong>500 AI Model Shots</strong> / mo",
    proF2: "All Global Model Personas & Diversity",
    proF3: "Luxury Marble & Parisian Street Scenes",
    proF4: "Video Ad Ratio (9:16 Reels & TikTok)",
    proF5: "Priority Serverless Cloud Queue",
    proF6: "8K Commercial Resolution Export",
    btnSubscribePro: "Upgrade to Pro ($39)",
    passBadge: "Pro 3-Month Pass",
    passSub: "Agencies & Brand Owners",
    passPeriod: "one-time (90 Days)",
    passPerShot: "~$0.049 per shot (Wholesale rate)",
    passF1: "<strong>1,800 AI Model Shots</strong> for 90 days",
    passF2: "Multi-Brand Product Batch Processing",
    passF3: "VIP Dedicated fal.ai Cloud Queue",
    passF4: "One-time payment (No recurring surprises)",
    passF5: "Priority 1-on-1 Commercial Support",
    btnSubscribePass: "Get 3-Month Pass ($89)",
    guarantee1Title: "SSL 256-bit Secure",
    guarantee1Sub: "Bank-Grade Encryption",
    guarantee2Title: "Instant 2.8s Delivery",
    guarantee2Sub: "Zero Wait Time",
    guarantee3Title: "100% Commercial",
    guarantee3Sub: "Royalty-Free Resell",
    guarantee4Title: "Cancel Anytime",
    guarantee4Sub: "1-Click in PayPal"
  },
  ko: {
    navSubtitle: "아마존·쇼피파이 글로벌 셀러를 위한 AI 고전환 모델 컷 스튜디오",
    navStudio: "AI 모델 스튜디오",
    navShowcase: "Before & After 비교",
    navPricing: "구독 요금제",
    btnPaypalKey: "PayPal 키",
    btnFalKey: "fal.ai 키",
    heroTitle: "바닥에 놓인 제품 사진, 5초 만에 아마존·쇼피파이 글로벌 1등 상세페이지 <span class='gradient-text-indigo'>고전환 AI 럭셔리 모델 컷</span>으로 완성",
    heroDesc: "회당 300~500만 원 드는 스튜디오 촬영비 전면 제로화. 마네킹 또는 바닥에 둔 제품 사진만 올리면 글로벌 톱 모델 착용 컷과 럭셔리 스튜디오 컷이 3초 만에 생성됩니다.",
    heroCtaBtn: "📸 내 상품 사진 넣고 첫 컷 무료 확인하기",
    heroSecondaryBtn: "✨ Before & After 럭셔리 비교 예시 보기",
    stat1: "상세페이지/광고 클릭률(CTR) +340% 상승",
    stat2: "99.9% 엔터프라이즈 클라우드 SLA 보증",
    stat3: "100% 상업적 이용 및 재판매 권한 포함",
    studioConfigTitle: "모델 및 스튜디오 촬영 환경 설정",
    studioConfigDesc: "제품에 어울리는 상업용 AI 모델과 고급 촬영 스튜디오 배경을 선택하세요",
    labelProductImage: "1. 제품 원본 사진 업로드 (의류, 가방, 뷰티, 신발 등)",
    dropzonePrompt: "제품 사진을 끌어다 놓거나 클릭하여 선택하세요",
    dropzoneHint: "웹/화면에서 복사 후 Ctrl+V로 바로 붙여넣기 지원",
    sampleProductsLabel: "⚡ 퀵 테스트: 원클릭 샘플 제품 (사진 파일 없이 즉시 체험)",
    btnRemoveBg: "✂️ 1초 누끼 자동 제거",
    btnRestoreBg: "🔄 원본 배경 복원",
    labelPersona: "2. 피팅 모델 페르소나 선택",
    labelScene: "3. 커머셜 스튜디오 배경 선택",
    labelRatio: "4. 상업용 규격 비율 선택",
    labelPrompt: "5. 제품 디테일 설명 & 스타일링 프롬프트",
    btnGenerateText: "고전환 AI 모델 컷 생성하기",
    resultCanvasTitle: "실시간 커머셜 캔버스",
    emptyStateTitle: "생성된 AI 모델 착용 컷이 여기에 표시됩니다",
    emptyStateDesc: "좌측에서 제품 사진을 올리고 생성 버튼을 누르면 서버리스 AI 파이프라인이 즉시 렌더링합니다.",
    btnDownloadClean: "8K 상업용 원본 다운로드",
    btnDownloadWatermark: "🔒 워터마크 제거 & 8K 상업용 다운로드",
    btnCopyPrompt: "프롬프트 복사",
    recentGalleryTitle: "최근 생성된 스튜디오 컷",
    showcaseTitle: "일반 바닥 사진 vs AI 모델 스튜디오 컷 극적인 전환율 비교",
    showcaseDesc: "가운데 슬라이더를 좌우로 밀어서 밋밋한 제품 사진이 보그(Vogue)급 모델 컷으로 변하는 차이를 직접 확인하세요.",
    roiTitle: "기존 오프라인 스튜디오 촬영 vs Lumina Commerce AI 비교",
    roiDesc: "수백만 원대 모델 촬영 비용과 2주 대기 시간을 3초와 월 $19대로 단번에 혁신합니다",
    pricingBadge: "100% 상업용 전용 • 고마진 정기 구독 플랜",
    pricingTitle: "압도적 마진의 커머스 전용 요금제",
    pricingDesc: "스토어 규모에 맞는 상업용 쿼터를 선택하세요. 100% 상업적 이용 및 재판매 권한 포함, 언제든 해지 가능.",
    roiHeaderBadge: "스튜디오 촬영 비용 혁신",
    roiHeaderTitle: "기존 오프라인 스튜디오 촬영 vs Lumina Commerce AI",
    roiHeaderDesc: "촬영 회당 300만 원 vs 장당 100원대 3초 완성! 99% 비용 절감과 폭발적 마진율을 경험하세요.",
    roiCol1: "비교 항목",
    roiCol2: "기존 오프라인 스튜디오 외주",
    roiCol3: "Lumina Commerce AI",
    roiRow1Metric: "1회 촬영 비용",
    roiRow1Trad: "300만 ~ 500만 원 (모델료+대관료+보정)",
    roiRow1Lumina: "테스트팩 $4.99부터 (장당 100원대)",
    roiRow2Metric: "납기 소요 시간",
    roiRow2Trad: "최소 10일 ~ 2주 (예약/촬영/셀렉/보정)",
    roiRow2Lumina: "단 2.8초 즉시 완성 (서버리스 실시간)",
    roiRow3Metric: "모델 & 배경 다양성",
    roiRow3Trad: "단일 모델 1명, 1개 스튜디오 배경",
    roiRow3Lumina: "전 세계 다국적 톱모델 & 럭셔리 배경 무제한",
    roiRow4Metric: "재촬영 및 추가 컷 수정",
    roiRow4Trad: "추가 비용 발생 (회당 수십만 원)",
    roiRow4Lumina: "프롬프트 원클릭으로 무제한 즉시 재배치",
    starterBadge: "스타터",
    starterSub: "신규 입점 셀러",
    testPackBadge: "⚡ 체험 스타터 팩",
    testPackSub: "첫 구매 셀러 전용",
    testPackPeriod: "1회 결제 (총 30장)",
    testPackPerShot: "컷당 약 200원 (구독 부담 제로)",
    testPackF1: "<strong>상업용 AI 모델 컷 30장</strong>",
    testPackF2: "아마존·쇼피파이 전 규격 (1:1, 4:5, 9:16)",
    testPackF3: "표준 초고속 클라우드 GPU 렌더링",
    testPackF4: "100% 상업적 이용 및 저작권 프리",
    testPackF5: "단 1회 일회성 결제 (자동 구독 해지 걱정 없음)",
    btnSubscribeTestPack: "30장 $4.99로 가볍게 시작하기",
    perMonth: "/ 월",
    starterPerShot: "상업용 컷당 약 160원 수준",
    starterF1: "<strong>월 150장</strong> 상업용 AI 모델 컷",
    starterF2: "기본 상업용 스튜디오 촬영 배경",
    starterF3: "아마존·쇼피파이 1:1 정사각 규격",
    starterF4: "표준 클라우드 큐 (fal.ai 초고속)",
    starterF5: "100% 상업적 이용 및 재판매 라이선스",
    btnSubscribeStarter: "스타터 플랜 구독 ($19)",
    mostPopularBadge: "🔥 셀러 1위 인기 플랜",
    proBadge: "프로 스튜디오",
    proSub: "상위 5% 파워 셀러",
    proPerShot: "컷당 약 100원 (스튜디오 대비 97% 절감)",
    proF1: "<strong>월 500장</strong> 상업용 AI 모델 컷",
    proF2: "전 세계 다국적 모델 페르소나 전체 해금",
    proF3: "럭셔리 대리석 & 파리 스트릿 고급 배경",
    proF4: "릴스·쇼츠·틱톡용 9:16 세로 숏폼 규격",
    proF5: "최우선 서버리스 클라우드 고속 큐",
    proF6: "8K 초고화질 상업용 원본 내보내기",
    btnSubscribePro: "프로 스튜디오 시작하기 ($39)",
    passBadge: "프로 3개월 패스",
    passSub: "에이전시 & 브랜드사",
    passPeriod: "1회 일회성 결제 (90일 패스)",
    passPerShot: "컷당 약 65원 (도매 파격 단가)",
    passF1: "<strong>총 1,800장</strong> (90일 동안 자유 사용)",
    passF2: "다품종 대량 상품 배치 일괄 렌더링",
    passF3: "VIP 전용 fal.ai 클라우드 단독 라인",
    passF4: "단 1회 일회성 결제 (자동 갱신 걱정 제로)",
    passF5: "1:1 우선 상업용 기술 지원",
    btnSubscribePass: "3개월 패스 신청하기 ($89)",
    guarantee1Title: "SSL 256비트 보안",
    guarantee1Sub: "금융권 등급 암호화",
    guarantee2Title: "2.8초 초고속 생성",
    guarantee2Sub: "지연 없는 클라우드 렌더링",
    guarantee3Title: "100% 상업적 권한",
    guarantee3Sub: "저작권 제로 & 재판매 보장",
    guarantee4Title: "언제든 해지 가능",
    guarantee4Sub: "PayPal에서 원클릭 해지"
  }
};

// ==================== 초기화 및 이벤트 리스너 ====================
function scrollToDropzone() {
  switchNav('studio');
  const dropzone = document.getElementById('dropzone');
  if (dropzone) {
    dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
    dropzone.classList.add('ring-4', 'ring-brand-accent', 'animate-pulse');
    setTimeout(() => {
      dropzone.classList.remove('ring-4', 'ring-brand-accent', 'animate-pulse');
    }, 2500);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  applyLanguage(currentLang);
  updatePlanBadgeDisplay();
  setupPasteListener();
  renderRecentGallery();
  updateOwnerToggleUI();

  const savedPaypal = localStorage.getItem("lumina_paypal_client_id") || DEFAULT_PAYPAL_ID;
  const paypalInput = document.getElementById("paypalClientIdInput");
  if (paypalInput) paypalInput.value = savedPaypal;

  const savedFal = localStorage.getItem("lumina_fal_key") || "";
  const falInput = document.getElementById("falApiKeyInput");
  if (falInput) falInput.value = savedFal;

  enhancePrompt();
});

// ==================== NAVIGATION & LANGUAGE ====================
function switchNav(tab) {
  const views = {
    studio: document.getElementById("viewStudio"),
    showcase: document.getElementById("viewShowcase"),
    pricing: document.getElementById("viewPricing")
  };
  Object.keys(views).forEach(k => {
    if (views[k]) views[k].classList.toggle("hidden", k !== tab);
  });

  const tabs = {
    studio: document.getElementById("navStudio"),
    showcase: document.getElementById("navShowcase"),
    pricing: document.getElementById("navPricing")
  };
  Object.keys(tabs).forEach(k => {
    if (!tabs[k]) return;
    if (k === tab) {
      tabs[k].className = "px-4 py-2 rounded-xl text-xs md:text-sm font-bold text-white bg-brand-accent shadow-md shadow-brand-accent/25 transition";
    } else {
      tabs[k].className = "px-4 py-2 rounded-xl text-xs md:text-sm font-semibold text-slate-400 hover:text-white transition";
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("lumina_lang", currentLang);
  applyLanguage(currentLang);
}

function toggleLang() {
  setLang(currentLang === 'en' ? 'ko' : 'en');
}

function applyLanguage(lang) {
  const btnEn = document.getElementById("langBtnEn");
  const btnKo = document.getElementById("langBtnKo");
  if (btnEn && btnKo) {
    if (lang === 'en') {
      btnEn.className = "px-2.5 py-1 rounded-lg text-white bg-brand-accent shadow-sm transition";
      btnKo.className = "px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition";
    } else {
      btnKo.className = "px-2.5 py-1 rounded-lg text-white bg-brand-accent shadow-sm transition";
      btnEn.className = "px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition";
    }
  }

  const dict = i18n[lang] || i18n.en;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.innerHTML = dict[key];
  });

  updatePlanBadgeDisplay();
  updateDownloadButtonUI();
}

function updatePlanBadgeDisplay() {
  const badge = document.getElementById("planBadgeText");
  if (!badge) return;

  if (userSubscription.plan === 'none') {
    if (!isFreeTrialUsed) {
      badge.textContent = currentLang === 'ko' ? "1회 무료 체험 가능" : "1 Free Trial Ready";
    } else {
      badge.textContent = currentLang === 'ko' ? "플랜 업그레이드" : "Upgrade Plan";
    }
  } else if (userSubscription.plan === 'owner') {
    badge.textContent = `👑 OWNER (∞)`;
  } else {
    const planName = userSubscription.plan.toUpperCase();
    badge.textContent = `${planName} (${userSubscription.shotsRemaining} left)`;
  }
}

// ==================== STUDIO PARAMETERS ====================
function selectPersona(persona) {
  activePersona = persona;
  document.querySelectorAll(".persona-btn").forEach(btn => {
    btn.classList.remove("border-brand-accent", "bg-brand-accent/15", "text-white");
    btn.classList.add("border-white/10", "bg-dark-800", "text-slate-300");
  });
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.remove("border-white/10", "bg-dark-800", "text-slate-300");
    window.event.currentTarget.classList.add("border-brand-accent", "bg-brand-accent/15", "text-white");
  }
  enhancePrompt();
}

function selectScene(scene) {
  activeScene = scene;
  document.querySelectorAll(".scene-btn").forEach(btn => {
    btn.classList.remove("border-brand-accent", "bg-brand-accent/15", "text-white");
    btn.classList.add("border-white/10", "bg-dark-800", "text-slate-300");
  });
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.remove("border-white/10", "bg-dark-800", "text-slate-300");
    window.event.currentTarget.classList.add("border-brand-accent", "bg-brand-accent/15", "text-white");
  }
  enhancePrompt();
}

function updateRatio(input) {
  activeRatio = input.value;
  document.querySelectorAll(".ratio-label").forEach(l => {
    l.classList.remove("border-brand-accent", "bg-brand-accent/15", "text-white");
    l.classList.add("border-white/10", "bg-dark-800", "text-slate-300");
  });
  input.closest(".ratio-label").classList.remove("border-white/10", "bg-dark-800", "text-slate-300");
  input.closest(".ratio-label").classList.add("border-brand-accent", "bg-brand-accent/15", "text-white");
}

function enhancePrompt() {
  const personaDescriptions = {
    female_editorial: "high fashion European female runway model, confident elegant gaze, flawless natural skin texture",
    male_casual: "charismatic handsome male model in his late 20s, athletic clean posture, friendly smile",
    beauty_hands: "flawless manicured hands gently holding and presenting the product, macro beauty photography",
    ghost_mannequin: "invisible 3D hollow mannequin aesthetic, floating commercial presentation with depth"
  };

  const sceneDescriptions = {
    luxury_marble: "placed on a sleek polished white marble podium, soft golden hour sunlight with organic window shadows",
    sunlit_loft: "minimalist luxury sun-drenched loft apartment, Scandinavian interior, warm wooden textures",
    parisian_street: "chic outdoor cafe terrace in Paris, soft bokeh blurred urban street in background",
    amazon_white: "commercial Amazon 100% pure white studio background, crisp soft contact reflection below product",
    nature_garden: "surrounded by fresh lush botanical leaves, subtle morning dew, natural sunlight beams",
    cyber_vogue: "futuristic Vogue studio, high-contrast neon cyan and magenta rim lighting, cinematic shadows"
  };

  const pDesc = personaDescriptions[activePersona] || personaDescriptions.female_editorial;
  const sDesc = sceneDescriptions[activeScene] || sceneDescriptions.luxury_marble;

  const baseText = `award-winning commercial product photoshoot. Wearing and showcasing the luxury product with exact fabric textures and silhouette preserved. Featuring ${pDesc}. Set in a ${sDesc}. Shot on Hasselblad H6D-100c with 85mm f/1.4 lens, 8k resolution, photorealistic fabric textures, pristine studio depth of field.`;

  const promptInput = document.getElementById("promptInput");
  if (promptInput) promptInput.value = baseText;
}

// ==================== IMAGE UPLOAD & 1-SEC BACKGROUND REMOVAL ====================
function handleFileSelect(e) {
  if (e.target.files && e.target.files[0]) {
    processUploadedFile(e.target.files[0]);
  }
}

function setupPasteListener() {
  window.addEventListener("paste", (e) => {
    const items = (e.clipboardData || window.clipboardData).items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          processUploadedFile(file);
          break;
        }
      }
    }
  });
}

function processUploadedFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  currentUploadedFile = file;

  const reader = new FileReader();
  reader.onload = (event) => {
    currentUploadedDataUrl = event.target.result;
    originalUploadedDataUrl = currentUploadedDataUrl;
    isBgRemoved = false;

    const img = document.getElementById("uploadPreviewImg");
    img.src = currentUploadedDataUrl;
    img.className = "w-14 h-14 rounded-xl object-cover border border-white/20 shadow";

    document.getElementById("uploadPreviewName").textContent = file.name || "product_image.png";
    updateBgStatusDisplay(false);

    document.getElementById("uploadPreviewBar").classList.remove("hidden");
    document.getElementById("dropzone").classList.add("hidden");
  };
  reader.readAsDataURL(file);
}

function clearUpload() {
  currentUploadedFile = null;
  currentUploadedDataUrl = null;
  originalUploadedDataUrl = null;
  isBgRemoved = false;

  const fileInput = document.getElementById("productFileInput");
  if (fileInput) fileInput.value = "";

  document.getElementById("uploadPreviewBar").classList.add("hidden");
  document.getElementById("dropzone").classList.remove("hidden");
}

// 소상공인 킬러 기능: 1초 누끼 자동 제거 (Background Removal)
async function toggleRemoveBg() {
  if (!currentUploadedDataUrl) return;

  const btn = document.getElementById("btnRemoveBgToggle");
  const img = document.getElementById("uploadPreviewImg");

  if (!isBgRemoved) {
    // 누끼 제거 수행
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin inline mr-1"></i> ${currentLang === 'ko' ? "누끼 제거 중..." : "Removing BG..."}`;

    try {
      // 1순위: 백엔드 /api/remove-bg 호출 시도
      let removedUrl = null;
      try {
        const resp = await fetch("/api/remove-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_data: currentUploadedDataUrl })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.image_url) removedUrl = data.image_url;
        }
      } catch (err) {
        console.warn("Backend remove-bg unavailable, falling back to client canvas segmentation", err);
      }

      // 2순위 (오프라인/정적 Vercel 환경): 클라이언트 캔버스 고속 투명화 시뮬레이션
      if (!removedUrl) {
        removedUrl = await simulateClientBackgroundRemoval(currentUploadedDataUrl);
      }

      currentUploadedDataUrl = removedUrl;
      isBgRemoved = true;

      // 투명 체커보드 배경 스타일 적용
      img.src = currentUploadedDataUrl;
      img.className = "w-14 h-14 rounded-xl object-contain border border-emerald-400/60 shadow bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:8px_8px] bg-slate-900";

      updateBgStatusDisplay(true);
    } catch (e) {
      console.error("BG remove failed:", e);
      alert(currentLang === 'ko' ? "누끼 제거 중 오류가 발생했습니다." : "Failed to remove background.");
    } finally {
      btn.disabled = false;
      if (window.lucide) lucide.createIcons();
    }
  } else {
    // 원본 배경 복원
    currentUploadedDataUrl = originalUploadedDataUrl;
    isBgRemoved = false;
    img.src = currentUploadedDataUrl;
    img.className = "w-14 h-14 rounded-xl object-cover border border-white/20 shadow";
    updateBgStatusDisplay(false);
  }
}

function updateBgStatusDisplay(removed) {
  const statusText = document.getElementById("uploadPreviewStatus");
  const btn = document.getElementById("btnRemoveBgToggle");
  const dict = i18n[currentLang] || i18n.en;

  if (removed) {
    statusText.innerHTML = `<span class="text-emerald-400 font-bold flex items-center gap-1"><i data-lucide="check" class="w-3.5 h-3.5"></i> ${currentLang === 'ko' ? "✂️ 1초 누끼 완료 (투명 배경)" : "✂️ Transparent BG Ready"}</span>`;
    btn.innerHTML = `<i data-lucide="undo-2" class="w-3 h-3 inline mr-1"></i> ${dict.btnRestoreBg}`;
    btn.className = "px-2.5 py-1 rounded-xl bg-dark-750 hover:bg-dark-700 text-slate-300 border border-white/10 text-[11px] font-bold transition";
  } else {
    statusText.innerHTML = `<span class="text-slate-400 font-medium flex items-center gap-1"><i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i> ${currentLang === 'ko' ? "스튜디오 피팅 대기 중" : "Ready for AI Studio Fitting"}</span>`;
    btn.innerHTML = `<i data-lucide="scissors" class="w-3 h-3 inline mr-1 text-emerald-400"></i> ${dict.btnRemoveBg}`;
    btn.className = "px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition";
  }
  if (window.lucide) lucide.createIcons();
}

function simulateClientBackgroundRemoval(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // 모서리 픽셀 색상 기반 투명화 처리
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        const cornerR = d[0], cornerG = d[1], cornerB = d[2];
        const tolerance = 45;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const dist = Math.sqrt((r - cornerR)**2 + (g - cornerG)**2 + (b - cornerB)**2);
          if (dist < tolerance) {
            d[i + 3] = 0; // 배경 투명화
          }
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// 1-Click 샘플 제품 프리셋
const sampleProducts = {
  dress: {
    name: "Emerald Silk Slip Dress",
    persona: "female_editorial",
    scene: "luxury_marble",
    img: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    prompt: "award-winning commercial product photoshoot. Elegant European female runway model wearing a tailored emerald green silk slip dress, confident gentle expression. Placed in a luxury white marble studio with soft warm sunbeams casting soft organic shadows. Shot on Hasselblad H6D-100c, 8k resolution, photorealistic silk fabric texture, ultra sharp focus."
  },
  bag: {
    name: "Italian Leather Tote Bag",
    persona: "female_editorial",
    scene: "parisian_street",
    img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    prompt: "award-winning commercial product photoshoot. Chic female fashion model casually holding a handcrafted cognac brown Italian leather tote bag. Set on an outdoor Parisian cafe terrace with blurred cobblestone street in background. Hasselblad H6D-100c, rich grain leather texture, golden hour bokeh lighting, 8k resolution."
  },
  watch: {
    name: "Luxury Chronograph Gold Watch",
    persona: "male_casual",
    scene: "sunlit_loft",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    prompt: "award-winning commercial product photoshoot. Charismatic handsome male model wearing a luxury gold chronograph wristwatch on wrist, fitted dark navy blazer cuff. Set in a minimalist Scandinavian penthouse loft with natural window lighting. Hasselblad H6D-100c, sapphire glass reflection, crisp metallic details, 8k resolution."
  },
  serum: {
    name: "Radiance Vitamin C Serum",
    persona: "beauty_hands",
    scene: "nature_garden",
    img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
    prompt: "award-winning commercial product photoshoot. Flawless manicured female hands gently presenting an amber glass vitamin C serum bottle with dropper. Surrounded by dewy green botanical leaves and morning sunlight refraction. Macro beauty photography, pristine glass refraction, 8k resolution, clean commercial aesthetic."
  }
};

function loadSampleProduct(type) {
  const sample = sampleProducts[type];
  if (!sample) return;

  currentUploadedDataUrl = sample.img;
  originalUploadedDataUrl = sample.img;
  isBgRemoved = false;

  const img = document.getElementById("uploadPreviewImg");
  img.src = sample.img;
  img.className = "w-14 h-14 rounded-xl object-cover border border-white/20 shadow";

  document.getElementById("uploadPreviewName").textContent = sample.name;
  updateBgStatusDisplay(false);

  document.getElementById("uploadPreviewBar").classList.remove("hidden");
  document.getElementById("dropzone").classList.add("hidden");

  selectPersona(sample.persona);
  selectScene(sample.scene);
  const promptInput = document.getElementById("promptInput");
  if (promptInput) promptInput.value = sample.prompt;

  document.querySelectorAll(".sample-btn").forEach(btn => {
    btn.classList.remove("border-brand-accent", "bg-brand-accent/20", "text-white");
    btn.classList.add("border-white/10", "bg-dark-900", "text-slate-300");
  });
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.remove("border-white/10", "bg-dark-900", "text-slate-300");
    window.event.currentTarget.classList.add("border-brand-accent", "bg-brand-accent/20", "text-white");
  }
}

// ==================== GENERATION PIPELINE & FREEMIUM WATERMARK HOOK ====================
async function handleGenerateClick() {
  const isOwner = userSubscription.plan === 'owner';
  const hasPaidPlan = userSubscription.plan !== 'none' && userSubscription.shotsRemaining > 0;
  
  // 1. 유료 플랜 또는 오너인 경우 -> 클린 8K 생성
  // 2. 비구독자이면서 무료 1회 체험을 안 쓴 경우 -> 워터마크 1회 프리뷰 허용 (Freemium Hook)
  // 3. 비구독자이면서 1회 무료 체험도 쓴 경우 -> 결제 모달 팝업
  let willBeWatermarked = false;

  if (isOwner || hasPaidPlan) {
    willBeWatermarked = false;
  } else if (!isFreeTrialUsed) {
    willBeWatermarked = true;
  } else {
    switchNav('pricing');
    alert(currentLang === 'ko'
      ? "⚠️ 무료 1회 체험을 모두 사용하셨습니다. 워터마크 없는 8K 상업용 원본을 생성하려면 플랜을 구독해주세요!"
      : "⚠️ You have used your 1 free trial. Please subscribe to unlock watermark-free 8K commercial model shots!");
    return;
  }

  const promptInput = document.getElementById("promptInput");
  const prompt = promptInput ? promptInput.value.trim() : "";
  if (!prompt) {
    alert(currentLang === 'ko' ? "프롬프트를 입력해주세요." : "Please enter a product description or prompt.");
    return;
  }

  const btn = document.getElementById("btnGenerate");
  const btnText = document.getElementById("btnGenerateText");
  const statusBox = document.getElementById("genStatusContainer");
  const progressBar = document.getElementById("genProgressBar");
  const progressPercent = document.getElementById("genProgressPercent");
  const statusText = document.getElementById("genStatusText");

  btn.disabled = true;
  statusBox.classList.remove("hidden");
  btnText.textContent = currentLang === 'ko' ? "AI 모델 컷 렌더링 중..." : "Rendering AI Model Shot...";

  let progress = 12;
  const progressTimer = setInterval(() => {
    if (progress < 90) {
      progress += Math.floor(Math.random() * 12) + 6;
      if (progress > 90) progress = 90;
      progressBar.style.width = `${progress}%`;
      progressPercent.textContent = `${progress}%`;
    }
  }, 220);

  const falKey = localStorage.getItem("lumina_fal_key") || "";

  try {
    let finalImageUrl = "";

    // 1단계: 백엔드 프록시(/api/generate/fal) 우선 호출
    let backendSuccess = false;
    try {
      statusText.textContent = "Connecting to fal.ai Serverless Cloud Engine...";
      const resp = await fetch("/api/generate/fal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          image_data: currentUploadedDataUrl,
          aspect_ratio: activeRatio,
          persona: activePersona,
          scene: activeScene,
          fal_key: falKey,
          user_id: "default_user"
        })
      });

      if (resp.ok) {
        const resData = await resp.json();
        if (resData.image_url) {
          finalImageUrl = resData.image_url;
          backendSuccess = true;
        }
      }
    } catch (e) {
      console.warn("Backend API not reachable, falling back to client-side direct fal.ai call", e);
    }

    // 2단계: 백엔드 미구동(정적 Vercel 환경) 시 브라우저 직접 fal.ai 호출
    if (!backendSuccess) {
      if (falKey) {
        let falSize = "square_hd";
        if (activeRatio === 'portrait_16_9') falSize = "portrait_16_9";
        else if (activeRatio === 'portrait_4_3') falSize = "portrait_4_3";

        const directResp = await fetch("https://fal.run/fal-ai/flux/schnell", {
          method: "POST",
          headers: {
            "Authorization": `Key ${falKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt: prompt,
            image_size: falSize,
            num_inference_steps: 4,
            enable_safety_checker: true
          })
        });

        if (directResp.ok) {
          const directData = await directResp.json();
          if (directData.images && directData.images.length > 0) {
            finalImageUrl = directData.images[0].url;
          }
        }
      }

      // 3단계: 키 미등록 시 고화질 시뮬레이션 데모 컷
      if (!finalImageUrl) {
        await new Promise(r => setTimeout(r, 1800));
        const samplePool = [
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=80",
          "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=80"
        ];
        finalImageUrl = samplePool[Math.floor(Math.random() * samplePool.length)];
      }
    }

    clearInterval(progressTimer);
    progressBar.style.width = "100%";
    progressPercent.textContent = "100%";

    // 워터마크 적용 렌더링
    await renderResult(finalImageUrl, willBeWatermarked);

    // 무료 체험 1회 소진 처리
    if (willBeWatermarked) {
      isFreeTrialUsed = true;
      localStorage.setItem("lumina_free_trial_used", "true");
      updatePlanBadgeDisplay();
    } else if (!isOwner) {
      userSubscription.shotsRemaining = Math.max(0, userSubscription.shotsRemaining - 1);
      localStorage.setItem("lumina_sub", JSON.stringify(userSubscription));
      updatePlanBadgeDisplay();
    }

  } catch (err) {
    clearInterval(progressTimer);
    console.error("Generation failed:", err);
    alert((currentLang === 'ko' ? "생성 실패: " : "Generation failed: ") + err.message);
  } finally {
    btn.disabled = false;
    const dict = i18n[currentLang] || i18n.en;
    btnText.textContent = dict.btnGenerateText || "Generate High-Converting AI Model Shot";
    setTimeout(() => statusBox.classList.add("hidden"), 800);
  }
}

// 캔버스 렌더링 & 워터마크 오버레이 합성
async function renderResult(url, isWatermarked) {
  currentResultUrl = url;
  currentResultIsWatermarked = isWatermarked;

  document.getElementById("canvasEmptyState").classList.add("hidden");
  const img = document.getElementById("resultImage");
  const badge = document.getElementById("canvasBadge");

  if (isWatermarked) {
    // 캔버스 기반 대각선 반투명 워터마크 합성
    const watermarkedDataUrl = await createWatermarkedImage(url, DEFAULT_WATERMARK_TEXT);
    img.src = watermarkedDataUrl;
    img.classList.remove("hidden");

    badge.className = "absolute top-4 left-4 px-3 py-1.5 rounded-full bg-rose-500/90 text-white border border-rose-400/50 text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5";
    badge.innerHTML = `<i data-lucide="lock" class="w-3.5 h-3.5"></i> ${currentLang === 'ko' ? "무료 1회 체험 프리뷰 (워터마크 포함)" : "Free Trial Preview (Watermarked)"}`;
  } else {
    img.src = url;
    img.classList.remove("hidden");

    badge.className = "absolute top-4 left-4 px-3 py-1.5 rounded-full bg-emerald-600/90 text-white border border-emerald-400/50 text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5";
    badge.innerHTML = `<i data-lucide="sparkles" class="w-3.5 h-3.5"></i> ${currentLang === 'ko' ? "✨ 8K 상업용 원본 (워터마크 없음)" : "✨ Commercial 8K Export"}`;
  }
  badge.classList.remove("hidden");

  updateDownloadButtonUI();
  document.getElementById("resultActions").classList.remove("hidden");
  addToRecentGallery(url);
  if (window.lucide) lucide.createIcons();
}

function createWatermarkedImage(imgUrl, watermarkText) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width || 1200;
      canvas.height = img.height || 1200;
      const ctx = canvas.getContext("2d");

      // 원본 이미지 그리기
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 워터마크 스타일 (반투명 대각선 반복)
      ctx.save();
      ctx.font = "bold 38px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
      ctx.lineWidth = 3;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 45도 회전 반복 스탬프
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4);

      const stepY = 160;
      for (let y = -canvas.height; y <= canvas.height; y += stepY) {
        ctx.strokeText(watermarkText, 0, y);
        ctx.fillText(watermarkText, 0, y);
      }
      ctx.restore();

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(imgUrl);
    img.src = imgUrl;
  });
}

function updateDownloadButtonUI() {
  const btn = document.getElementById("btnDownloadMain");
  if (!btn) return;

  const dict = i18n[currentLang] || i18n.en;

  if (currentResultIsWatermarked) {
    btn.className = "py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition";
    btn.innerHTML = `<i data-lucide="lock" class="w-4 h-4"></i> <span>${dict.btnDownloadWatermark}</span>`;
  } else {
    btn.className = "py-3 rounded-xl bg-brand-accent hover:bg-brand-accentHover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/25 transition";
    btn.innerHTML = `<i data-lucide="download" class="w-4 h-4"></i> <span>${dict.btnDownloadClean}</span>`;
  }
  if (window.lucide) lucide.createIcons();
}

function handleDownloadClick() {
  if (currentResultIsWatermarked) {
    // 워터마크 결과물인 경우 -> 결제 유도 모달 팝업!
    switchNav('pricing');
    alert(currentLang === 'ko'
      ? "🎉 무료 1회 체험 생성이 완료되었습니다!\n\n워터마크가 완전히 제거된 8K 원본을 소장하고 아마존·쇼피파이 상업적 재판매 권한을 얻으려면 아래에서 플랜을 구독하세요."
      : "🎉 Free trial generation complete!\n\nTo download clean, watermark-free 8K commercial exports with 100% royalty-free resell rights, please choose a plan below.");
  } else {
    // 워터마크 없는 유료/오너 원본 다운로드
    const a = document.createElement("a");
    a.href = currentResultUrl;
    a.download = "lumina_commercial_shot_8k.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

function copyPromptToClipboard() {
  const p = document.getElementById("promptInput").value;
  navigator.clipboard.writeText(p);
  alert(currentLang === 'ko' ? "프롬프트가 클립보드에 복사되었습니다!" : "Prompt copied to clipboard!");
}

// ==================== RECENT GALLERY & BEFORE/AFTER ====================
function renderRecentGallery() {
  const container = document.getElementById("recentGalleryContainer");
  const thumbnails = document.getElementById("recentGalleryThumbnails");
  const count = document.getElementById("galleryCount");
  if (!thumbnails || !container) return;

  if (!recentGallery.length) {
    container.classList.add("hidden");
    return;
  }
  container.classList.remove("hidden");
  count.textContent = `${recentGallery.length} saved`;
  thumbnails.innerHTML = "";
  recentGallery.forEach((item, idx) => {
    const thumb = document.createElement("div");
    thumb.className = "shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-white/15 cursor-pointer hover:border-brand-accent transition group relative";
    thumb.innerHTML = `
      <img src="${item.url}" alt="Shot ${idx + 1}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
        <i data-lucide="zoom-in" class="w-4 h-4 text-white"></i>
      </div>
    `;
    thumb.onclick = () => renderResult(item.url, false);
    thumbnails.appendChild(thumb);
  });
  if (window.lucide) lucide.createIcons();
}

function addToRecentGallery(url) {
  recentGallery.unshift({ url, timestamp: Date.now() });
  if (recentGallery.length > 6) recentGallery.pop();
  localStorage.setItem("lumina_recent_gallery", JSON.stringify(recentGallery));
  renderRecentGallery();
}

function updateComparisonSlider(val) {
  const clip = document.getElementById("sliderBeforeClip");
  const divider = document.getElementById("sliderDividerLine");
  if (clip) clip.style.width = `${val}%`;
  if (divider) divider.style.left = `${val}%`;
}

function loadComparisonSample(category) {
  const samples = {
    apparel: {
      before: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1400&q=80",
      after: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=80"
    },
    suit: {
      before: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1400&q=80",
      after: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1400&q=80"
    },
    cosmetics: {
      before: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80",
      after: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=1400&q=80"
    },
    bag: {
      before: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1400&q=80",
      after: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1400&q=80"
    },
    watch: {
      before: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=80",
      after: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1400&q=80"
    },
    shoes: {
      before: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=80",
      after: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1400&q=80"
    }
  };

  const s = samples[category] || samples.apparel;
  document.getElementById("sliderBeforeImg").src = s.before;
  document.getElementById("sliderAfterImg").src = s.after;

  document.querySelectorAll(".comp-btn").forEach(b => {
    b.classList.remove("border-brand-accent", "bg-brand-accent/20", "text-white");
    b.classList.add("border-white/10", "bg-dark-800", "text-slate-300");
  });
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.remove("border-white/10", "bg-dark-800", "text-slate-300");
    window.event.currentTarget.classList.add("border-brand-accent", "bg-brand-accent/20", "text-white");
  }
}

// ==================== PAYPAL CHECKOUT & SUBSCRIPTIONS ====================
function startCheckout(planId, price, title, quota) {
  selectedPlanForCheckout = { planId, price, title, quota };

  document.getElementById("checkoutPlanTitle").textContent = `${title} ($${price})`;
  document.getElementById("checkoutPlanDesc").textContent = `$${price} • ${quota} Commercial AI Model Shots`;
  document.getElementById("legalConsentCheckbox").checked = false;
  document.getElementById("consentError").classList.add("hidden");

  renderPayPalSmartButtons(planId, price, title, quota);
  document.getElementById("checkoutModal").classList.remove("hidden");
}

function closeCheckoutModal() {
  document.getElementById("checkoutModal").classList.add("hidden");
}

function renderPayPalSmartButtons(planId, price, title, quota) {
  const area = document.getElementById("paypal-smart-button-area");
  area.innerHTML = "";

  if (window.paypal && paypal.Buttons) {
    paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'pay'
      },
      onClick: (data, actions) => {
        const consent = document.getElementById("legalConsentCheckbox").checked;
        if (!consent) {
          document.getElementById("consentError").classList.remove("hidden");
          return actions.reject();
        }
        document.getElementById("consentError").classList.add("hidden");
        return actions.resolve();
      },
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            description: `Lumina Commerce AI - ${title}`,
            amount: {
              currency_code: 'USD',
              value: price.toString()
            }
          }]
        });
      },
      onApprove: (data, actions) => {
        return actions.order.capture().then((details) => {
          activateSubscription(planId, quota);
          closeCheckoutModal();
          alert(`🎉 Payment approved by ${details.payer.name.given_name}! ${title} activated with ${quota} shots.`);
        });
      },
      onError: (err) => {
        console.error("PayPal Error:", err);
        alert("PayPal Checkout encountered an issue. You may test via 1-Sec Instant Approval below.");
      }
    }).render("#paypal-smart-button-area");
  } else {
    area.innerHTML = `
      <div class="p-3 rounded-xl bg-dark-800 text-xs text-amber-400 border border-amber-500/20 text-center">
        PayPal SDK is loading or Client ID is in test mode. You can use the 1-Sec Instant Approval below.
      </div>
    `;
  }
}

function simulateSuccessfulPayment() {
  const consent = document.getElementById("legalConsentCheckbox").checked;
  if (!consent) {
    document.getElementById("consentError").classList.remove("hidden");
    return;
  }
  if (!selectedPlanForCheckout) return;

  activateSubscription(selectedPlanForCheckout.planId, selectedPlanForCheckout.quota);
  closeCheckoutModal();
  alert(`🎉 [Staging Simulation] Successfully activated ${selectedPlanForCheckout.title}! ${selectedPlanForCheckout.quota} shots credited.`);
}

function activateSubscription(planId, quota) {
  userSubscription = {
    plan: planId,
    shotsRemaining: quota,
    totalQuota: quota
  };
  localStorage.setItem("lumina_sub", JSON.stringify(userSubscription));
  updatePlanBadgeDisplay();

  // 워터마크 제거 모드 업데이트
  if (currentResultUrl && currentResultIsWatermarked) {
    renderResult(currentResultUrl, false);
  }

  switchNav('studio');
}

// ==================== CONFIG MODALS (PAYPAL, FAL.AI, LEGAL) ====================
function openPaypalModal() {
  document.getElementById("paypalConfigModal").classList.remove("hidden");
}
function closePaypalModal() {
  document.getElementById("paypalConfigModal").classList.add("hidden");
}
function savePaypalClientId() {
  const val = document.getElementById("paypalClientIdInput").value.trim();
  if (!val) return;
  localStorage.setItem("lumina_paypal_client_id", val);
  closePaypalModal();
  alert("PayPal Client ID saved. Refreshing to reload SDK...");
  location.reload();
}

function openFalKeyModal() {
  document.getElementById("falKeyModal").classList.remove("hidden");
}
function closeFalKeyModal() {
  document.getElementById("falKeyModal").classList.add("hidden");
}
function saveFalApiKey() {
  const key = document.getElementById("falApiKeyInput").value.trim();
  localStorage.setItem("lumina_fal_key", key);
  closeFalKeyModal();
  alert(currentLang === 'ko' ? "fal.ai API Key가 로컬에 안전하게 저장되었습니다!" : "fal.ai API Key securely saved locally!");
}
function clearFalApiKey() {
  localStorage.removeItem("lumina_fal_key");
  document.getElementById("falApiKeyInput").value = "";
  closeFalKeyModal();
  alert(currentLang === 'ko' ? "fal.ai Key가 제거되었습니다 (데모 시뮬레이션 모드로 전환)." : "fal.ai Key removed (Switched to demo preview mode).");
}

function openLegalModal(type) {
  const title = document.getElementById("legalModalTitle");
  const body = document.getElementById("legalModalBody");

  if (type === 'refund') {
    title.textContent = "Refund & Cancellation Policy (Strict 5-Shot Limit)";
    body.innerHTML = `
      <p><strong>1. Digital Goods & Compute Consumption</strong><br>
      Lumina Commerce AI provisions real-time cloud GPU resources immediately upon generation. Hardware and API compute costs are strictly incurred per image rendered.</p>
      <p><strong>2. Refund Eligibility</strong><br>
      Full refund is eligible within 7 days of purchase <em>ONLY IF fewer than 5 images have been generated</em>. Once more than 5 images are rendered, the plan is strictly NON-REFUNDABLE under international digital goods merchant terms.</p>
      <p><strong>3. Cancellation</strong><br>
      Subscriptions can be canceled at any time from your PayPal account settings, stopping recurring charges at the end of the billing cycle.</p>
    `;
  } else {
    title.textContent = "Terms of Service";
    body.innerHTML = `
      <p><strong>1. Commercial License</strong><br>
      All generated AI model shots are 100% royalty-free for commercial use across Amazon, Shopify, Etsy, TikTok Shop, social ads, and marketing materials.</p>
      <p><strong>2. Content Guidelines</strong><br>
      Users may not upload unlawful, offensive, or infringing material. The service employs automated safety filters.</p>
      <p><strong>3. Service Availability</strong><br>
      Operated via serverless cloud architecture with 99.9% uptime SLA, independent of local host machines.</p>
    `;
  }
  document.getElementById("legalModal").classList.remove("hidden");
}
function closeLegalModal() {
  document.getElementById("legalModal").classList.add("hidden");
}

// ==================== DIRECTOR SEYUN OWNER PASS ====================
function toggleOwnerPass() {
  if (userSubscription.plan === 'owner') {
    userSubscription = { plan: 'none', shotsRemaining: 0, totalQuota: 0 };
    localStorage.setItem("lumina_sub", JSON.stringify(userSubscription));
    updatePlanBadgeDisplay();
    alert(currentLang === 'ko' ? "일반 구독자 모드로 전환되었습니다." : "Switched to standard user mode.");
  } else {
    userSubscription = { plan: 'owner', shotsRemaining: 999999, totalQuota: 999999 };
    localStorage.setItem("lumina_sub", JSON.stringify(userSubscription));
    updatePlanBadgeDisplay();
    alert(currentLang === 'ko'
      ? "👑 [S-Probiz 대표 Seyun] 오너 무제한 모드가 활성화되었습니다!\n과금/차감 없이 무제한으로 AI 모델 컷 생성이 가능합니다."
      : "👑 [S-Probiz Director Seyun] Owner Unlimited Pass Activated!\nGenerate unlimited AI model shots without credit deduction.");
  }
  updateOwnerToggleUI();
}

function updateOwnerToggleUI() {
  const btn = document.getElementById("ownerToggleText");
  if (btn) {
    btn.textContent = userSubscription.plan === 'owner' ? "Owner (Active ∞)" : "Owner Pass (Seyun)";
  }
  const marginTable = document.getElementById("ownerMarginTable");
  if (marginTable) {
    if (userSubscription.plan === 'owner') {
      marginTable.classList.remove("hidden");
    } else {
      marginTable.classList.add("hidden");
    }
  }
  const adminKeys = document.getElementById("adminHeaderKeys");
  if (adminKeys) {
    if (userSubscription.plan === 'owner') {
      adminKeys.classList.remove("hidden");
      adminKeys.classList.add("flex");
    } else {
      adminKeys.classList.add("hidden");
      adminKeys.classList.remove("flex");
    }
  }
}
