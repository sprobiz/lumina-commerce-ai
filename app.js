// 🎨 Lumina AI SaaS 프론트엔드 - 글로벌(EN) / 한국어(KO) 다국어 지원 & PayPal 결제 & 환불 정책
document.addEventListener("DOMContentLoaded", () => {
  // 상태 변수
  let currentUserId = "default_user";
  let currentUser = null;
  let plansData = [];
  let selectedPlan = null;
  let paypalSdkLoaded = false;
  let isGenerating = false;

  // 다국어 언어 설정 (localStorage 우선, 없으면 브라우저 언어 기반 - 글로벌 기본은 en)
  let currentLang = localStorage.getItem("lumina_lang") || (navigator.language.startsWith("ko") ? "ko" : "en");

  // --- 다국어 사본 딕셔너리 (i18n Dictionary) ---
  const i18n = {
    en: {
      doc_title: "Lumina AI - Ultra-Fast AI Image Generation SaaS",
      quota_label: "Daily Remaining",
      quota_unit: "runs",
      btn_upgrade: "Upgrade Plan",
      mode_tab_txt2img: "Text to Image",
      mode_tab_img2img: "Image to Image",
      btn_attach_image: "Attach Image",
      toolbar_hint: "or paste (Ctrl+V) / drag & drop",
      drop_overlay_text: "Drop image here to attach",
      attachment_tag: "🖼️ Image-to-Image Active",
      denoise_label: "Strength:",
      prompt_label: "Prompt",
      prompt_chars: "chars",
      prompt_placeholder: "Enter your prompt (or drag & drop / Ctrl+V to attach reference image)...",
      tag_masterpiece: "🌟 Ultra HD",
      tag_photo: "📷 Photorealistic",
      tag_anime: "🎨 Anime Art",
      tag_cyberpunk: "🌃 Cyberpunk",
      tag_fantasy: "🏰 Epic Fantasy",
      neg_prompt_label: "Negative Prompt (Exclude)",
      neg_prompt_placeholder: "Keywords to avoid (e.g. ugly, blurry)",
      aspect_ratio_label: "Aspect Ratio",
      advanced_options: "Advanced Options (Seed)",
      btn_random: "🎲 Random",
      btn_generate: "✨ Generate Image",
      progress_preparing: "Preparing GPU pipeline...",
      progress_denoising: "Denoising diffusion steps...",
      progress_done: "Render complete!",
      preview_empty_title: "Your generated artwork will appear here",
      preview_empty_desc: "Enter a prompt on the left and click Generate to start AI rendering.",
      btn_download: "Download HD",
      btn_copy_prompt: "Copy Prompt",
      gallery_title: "Recent Creations",
      gallery_count: "items",
      gallery_empty: "No images created yet. Create your first masterpiece!",
      footer_refund: "Refund & Cancellation Policy",
      footer_terms: "Terms of Service",
      pricing_title: "Choose Your Plan",
      pricing_subtitle: "Select the plan that fits your creative workflow. Instant GPU queue priority.",
      selected_plan_label: "Selected Plan:",
      consent_text_html: 'I agree to the <a href="#" id="view-terms-link" class="legal-link">Terms of Service</a> and understand the <a href="#" id="view-refund-link" class="legal-link">Refund Policy</a> (Credits and GPU compute consumed are non-refundable).',
      consent_error: "⚠️ You must agree to the Terms of Service and Refund Policy to proceed.",
      btn_mock_checkout: "⚡ [Test Mode] 1-Sec Instant Approval Simulation",
      mock_processing: "⏳ Processing instant approval...",
      digital_goods_notice: "Digital Goods Notice: Subscriptions grant instant access to dedicated GPU computing resources. Subscriptions can be canceled at any time from your account settings or PayPal dashboard.",
      btn_close_refund: "I Understand (Close)",
      refund_modal_title: "REFUND & CANCELLATION POLICY",
      alert_empty_prompt: "Please enter an image description in the prompt box!",
      alert_copied: "Prompt copied to clipboard!",
      alert_quota_exceeded: "You have reached your daily generation limit.\n\nWould you like to upgrade your plan now?",
      alert_gen_failed: "Generation failed: ",
      alert_pay_success: "🎉 Payment completed successfully! Your plan is now active.",
      alert_mock_success: "🎉 [Test Payment Success] Plan has been activated!",
      alert_pay_failed: "Payment processing failed: ",
      alert_pay_error: "An error occurred during payment processing.",
      plan_starter_name: "Starter Plan",
      plan_starter_target: "Casual creators & hobbyists",
      plan_starter_badge: "Standard",
      plan_starter_cta: "Get Started ($15/mo)",
      plan_starter_features: [
        "40 image generations per day (resets daily at 00:00 UTC)",
        "Standard resolution (up to 1024x1024)",
        "Standard quality rendering (25 steps)",
        "Single generation per click (Batch size: 1)",
        "Standard GPU generation queue"
      ],
      plan_pro_name: "Pro Monthly Plan",
      plan_pro_target: "Power users, designers, content creators",
      plan_pro_badge: "Most Popular",
      plan_pro_cta: "Upgrade to Pro ($30/mo)",
      plan_pro_features: [
        "150 image generations per day (resets daily at 00:00 UTC)",
        "High resolution & HD Upscaling support",
        "Dedicated high-speed GPU priority queue",
        "Multi-batch generation (up to 4 images at once)",
        "Full commercial usage rights & priority support"
      ],
      plan_pass_name: "Pro 3-Month Pass",
      plan_pass_target: "Committed creators seeking maximum savings",
      plan_pass_badge: "Best Value (18% OFF)",
      plan_pass_cta: "Get 3-Month Pass ($74)",
      plan_pass_features: [
        "All Pro benefits unlocked for full 90 days",
        "150 generations per day (Total 13,500 generations)",
        "One-time payment - no recurring monthly billing",
        "Saves $16 compared to monthly billing (~18% discount)",
        "Priority GPU queue & VIP support included"
      ]
    },
    ko: {
      doc_title: "Lumina AI - 초고화질 AI 이미지 생성 SaaS",
      quota_label: "오늘 남은 생성",
      quota_unit: "회",
      btn_upgrade: "플랜 업그레이드",
      mode_tab_txt2img: "텍스트로 생성 (Txt2Img)",
      mode_tab_img2img: "이미지 참조 생성 (Img2Img)",
      btn_attach_image: "이미지 첨부",
      toolbar_hint: "붙여넣기(Ctrl+V) 또는 드래그 지원",
      drop_overlay_text: "이미지를 여기에 놓으면 바로 첨부됩니다",
      attachment_tag: "🖼️ 이미지 참조(Img2Img) 활성",
      denoise_label: "변형 강도:",
      prompt_label: "프롬프트 (Prompt)",
      prompt_chars: "자",
      prompt_placeholder: "프롬프트를 입력하세요 (이미지를 끌어다 놓거나 Ctrl+V로 붙여넣으면 즉시 첨부됩니다)...",
      tag_masterpiece: "🌟 초고화질",
      tag_photo: "📷 극실사",
      tag_anime: "🎨 애니·일러스트",
      tag_cyberpunk: "🌃 사이버펑크",
      tag_fantasy: "🏰 에픽 판타지",
      neg_prompt_label: "네거티브 프롬프트 (제외할 키워드)",
      neg_prompt_placeholder: "제외할 키워드 (예: ugly, blurry, deformed)",
      aspect_ratio_label: "화면 비율",
      advanced_options: "고급 옵션 (Seed 설정)",
      btn_random: "🎲 랜덤",
      btn_generate: "✨ 이미지 생성하기",
      progress_preparing: "ComfyUI GPU 작업 큐 등록 중...",
      progress_denoising: "디노이징 샘플링 렌더링 중...",
      progress_done: "생성 완료!",
      preview_empty_title: "생성된 이미지가 여기에 표시됩니다",
      preview_empty_desc: "좌측에서 프롬프트를 입력하고 생성 버튼을 누르면 AI가 작품을 렌더링합니다.",
      btn_download: "원본 다운로드",
      btn_copy_prompt: "프롬프트 복사",
      gallery_title: "최근 생성 갤러리",
      gallery_count: "개 항목",
      gallery_empty: "아직 생성된 이미지가 없습니다. 첫 작품을 생성해보세요!",
      footer_refund: "환불 및 취소 정책 (Refund Policy)",
      footer_terms: "서비스 이용약관 (Terms of Service)",
      pricing_title: "플랜 선택 & 업그레이드",
      pricing_subtitle: "필요에 맞는 요금제를 선택하고 고성능 GPU 전용 큐에서 즉시 생성하세요.",
      selected_plan_label: "선택된 플랜:",
      consent_text_html: '서비스 <a href="#" id="view-terms-link" class="legal-link">이용약관</a>에 동의하며 <a href="#" id="view-refund-link" class="legal-link">환불 정책</a>(사용된 크레딧 및 GPU 연산 비용은 환불 불가)을 확인하고 동의합니다.',
      consent_error: "⚠️ 결제를 진행하려면 이용약관 및 환불 불가 정책에 반드시 동의해야 합니다.",
      btn_mock_checkout: "⚡ [테스트 모드] 1초 결제 승인 시뮬레이션",
      mock_processing: "⏳ 결제 승인 처리 중...",
      digital_goods_notice: "디지털 상품 고지: 구독 및 패스 구매 시 전용 GPU 연산 자원이 즉시 할당됩니다. 구독은 계정 설정 또는 페이팔 대시보드에서 언제든지 해지하실 수 있습니다.",
      btn_close_refund: "이해했습니다 (닫기)",
      refund_modal_title: "환불 및 취소 규정 (REFUND & CANCELLATION POLICY)",
      alert_empty_prompt: "이미지 설명을 프롬프트에 입력해주세요!",
      alert_copied: "프롬프트가 클립보드에 복사되었습니다!",
      alert_quota_exceeded: "오늘 일일 생성 할당량을 모두 소진했습니다.\n\n지금 플랜을 업그레이드하시겠습니까?",
      alert_gen_failed: "생성 실패: ",
      alert_pay_success: "🎉 결제가 성공적으로 완료되었습니다! 플랜이 즉시 활성화되었습니다.",
      alert_mock_success: "🎉 [테스트 결제 완료] 플랜이 성공적으로 활성화되었습니다!",
      alert_pay_failed: "결제 승인 처리 실패: ",
      alert_pay_error: "결제 진행 중 오류가 발생했습니다.",
      plan_starter_name: "스타터 플랜 (Starter)",
      plan_starter_target: "취미 크리에이터 및 일상 창작자",
      plan_starter_badge: "기본형",
      plan_starter_cta: "시작하기 (월 $15)",
      plan_starter_features: [
        "매일 40장 이미지 생성 (매일 00:00 UTC 자동 리셋)",
        "표준 해상도 (최대 1024x1024)",
        "표준 품질 렌더링 스텝 (25스텝)",
        "1회 클릭당 1장 생성 (배치: 1)",
        "표준 GPU 렌더링 대기열"
      ],
      plan_pro_name: "프로 월간 플랜 (Pro)",
      plan_pro_target: "파워 유저, 디자이너, 전문 크리에이터",
      plan_pro_badge: "인기 최고",
      plan_pro_cta: "프로로 업그레이드 (월 $30)",
      plan_pro_features: [
        "매일 150장 이미지 생성 (매일 00:00 UTC 자동 리셋)",
        "고해상도 및 HD 업스케일링 지원",
        "초고속 전용 GPU 최우선 큐 배정",
        "동시 4장 생성 멀티배치 지원",
        "완전 상업적 이용 권한 & 우선 고객지원"
      ],
      plan_pass_name: "프로 3개월 패스 (3-Month Pass)",
      plan_pass_target: "최대 할인을 원하는 전문 크리에이터",
      plan_pass_badge: "최고의 가치 (18% 특별 할인)",
      plan_pass_cta: "3개월 패스 구매 ($74)",
      plan_pass_features: [
        "90일간 모든 프로(Pro) 혜택 동일 적용",
        "매일 150장 생성 (90일 총 13,500장 한도)",
        "단 1회 결제 - 매월 자동 청구 없는 깔끔한 정산",
        "월간 결제 대비 $16 절약 (~18% 할인 혜택)",
        "VIP 전용 우선 GPU 큐 및 우선 기술 지원"
      ]
    }
  };

  // 환불 정책 본문 (EN / KO)
  const refundPolicyContent = {
    en: `
      <div class="policy-section">
        <h4>1. Digital Goods & GPU Consumption Notice</h4>
        <p>Our service provides real-time AI image generation powered by dedicated GPU cloud resources. Because computing power and server costs are incurred immediately upon image generation, completed generations cannot be revoked.</p>
      </div>
      <div class="policy-section">
        <h4>2. Eligibility for Refund</h4>
        <p>• <strong>Full Refund:</strong> Eligible within 7 days of purchase ONLY IF the user has generated fewer than 5 images (or consumed less than 5% of their daily quota).</p>
        <p>• Once more than 5 images have been generated, the purchase is strictly <strong>NON-REFUNDABLE</strong>.</p>
        <p>• <strong>3-Month Pass ($74):</strong> After 7 days from purchase or upon generating more than 5 images, no pro-rated refunds will be issued for the remaining days.</p>
      </div>
      <div class="policy-section">
        <h4>3. Results & Quality Disclaimer</h4>
        <p>Variations in artistic preference, prompt interpretation by the AI model, or subjective dissatisfaction with generated artwork do not qualify for a refund. We recommend reviewing sample outputs prior to subscribing.</p>
      </div>
      <div class="policy-section">
        <h4>4. Service Errors & Downtime</h4>
        <p>In the event of failed generations due to server or ComfyUI pipeline errors, consumed credits will be automatically replenished to your daily balance. Cash refunds are not provided for temporary server interruptions.</p>
      </div>
      <div class="policy-section">
        <h4>5. Subscription Cancellation</h4>
        <p>You may cancel your monthly subscription at any time via your account dashboard or through your PayPal account. Upon cancellation, your plan will remain active until the end of the current billing cycle, with no further recurring charges.</p>
      </div>
    `,
    ko: `
      <div class="policy-section">
        <h4>1. 디지털 상품 및 GPU 연산 비용 고지</h4>
        <p>본 서비스는 클라우드 전용 GPU 자원을 실시간으로 배정받아 이미지를 렌더링하는 디지털 서비스입니다. 생성 시작 즉시 하드웨어 연산 비용이 즉각 소모되므로 완료된 작업은 회수할 수 없습니다.</p>
      </div>
      <div class="policy-section">
        <h4>2. 환불 자격 요건</h4>
        <p>• <strong>전액 환불:</strong> 결제일로부터 7일 이내이며, 생성한 이미지가 총 5장 미만(일일 할당량의 5% 미만 소모)인 경우에 한하여 전액 환불 가능합니다.</p>
        <p>• 5장 이상의 이미지를 생성한 이후에는 디지털 상품 특성상 <strong>환불이 절대 불가</strong>합니다.</p>
        <p>• <strong>프로 3개월 패스 ($74):</strong> 결제 후 7일이 경과하거나 5장 이상 생성한 이후에는 잔여 기간에 대한 일할 환불이 제공되지 않습니다.</p>
      </div>
      <div class="policy-section">
        <h4>3. 생성 품질 및 주관적 만족도 면책</h4>
        <p>AI 모델의 프롬프트 해석, 주관적인 화풍 선호도 차이, 예술적 불만족 등은 환불 사유에 해당하지 않습니다. 결제 전 기본 무료 크레딧을 통해 품질을 충분히 확인하시기를 권장합니다.</p>
      </div>
      <div class="policy-section">
        <h4>4. 시스템 오류 및 서비스 중단 보상</h4>
        <p>서버 또는 ComfyUI 파이프라인 오류로 인해 이미지 생성이 실패한 경우, 소모된 생성 횟수는 사용자 일일 잔여량으로 즉시 자동 환원됩니다. 일시적 네트워크 장애에 대한 현금 환불은 제공되지 않습니다.</p>
      </div>
      <div class="policy-section">
        <h4>5. 구독 취소 및 해지</h4>
        <p>월간 구독은 사용자 계정 대시보드 또는 페이팔 계정에서 언제든지 자유롭게 해지할 수 있습니다. 해지 시에도 이미 결제된 해당 청구 주기가 종료될 때까지 프로 혜택을 온전히 이용하실 수 있습니다.</p>
      </div>
    `
  };

  // DOM 요소 선택
  const langBtnEn = document.getElementById("lang-btn-en");
  const langBtnKo = document.getElementById("lang-btn-ko");
  const comfyStatusBadge = document.getElementById("comfy-status-badge");
  const comfyStatusText = document.getElementById("comfy-status-text");
  const headerPlanBadge = document.getElementById("header-plan-badge");
  const todayRemainingEl = document.getElementById("today-remaining");
  const todayQuotaEl = document.getElementById("today-quota");
  const openPricingBtn = document.getElementById("open-pricing-btn");
  const closePricingBtn = document.getElementById("close-pricing-btn");
  const pricingModal = document.getElementById("pricing-modal");
  const plansContainer = document.getElementById("plans-container");
  
  // 환불 모달 관련
  const refundModal = document.getElementById("refund-modal");
  const refundModalTitle = document.getElementById("refund-modal-title");
  const policyBodyContent = document.getElementById("policy-body-content");
  const closeRefundBtn = document.getElementById("close-refund-btn");
  const ackRefundBtn = document.getElementById("ack-refund-btn");
  const footerRefundLink = document.getElementById("footer-refund-link");
  const footerTermsLink = document.getElementById("footer-terms-link");

  // 체크아웃 & 동의 관련
  const agreementCheckbox = document.getElementById("agreement-checkbox");
  const consentErrorMsg = document.getElementById("consent-error-msg");
  const consentTextContainer = document.getElementById("consent-text-container");
  const selectedPlanTitle = document.getElementById("selected-plan-title");
  const selectedPlanPriceTag = document.getElementById("selected-plan-price-tag");
  const selectedPlanTarget = document.getElementById("selected-plan-target");
  const mockCheckoutBtn = document.getElementById("mock-checkout-btn");

  // 첨부 이미지 상태
  let uploadedComfyFilename = null;

  // 생성 모드 탭 & 프롬프트 카드 DOM
  const modeTabTxt2Img = document.getElementById("mode-tab-txt2img");
  const modeTabImg2Img = document.getElementById("mode-tab-img2img");
  const img2imgActiveIndicator = document.getElementById("img2img-active-indicator");
  const geminiPromptCard = document.getElementById("gemini-prompt-card");
  const dropOverlay = document.getElementById("drop-overlay");

  // 제미나이 스타일 이미지 첨부 DOM
  const btnQuickAttach = document.getElementById("btn-quick-attach");
  const refImageInput = document.getElementById("ref-image-input");
  const geminiAttachmentBar = document.getElementById("gemini-attachment-bar");
  const attachedThumb = document.getElementById("attached-thumb");
  const attachedName = document.getElementById("attached-name");
  const removeAttachedBtn = document.getElementById("remove-attached-btn");
  const denoiseSlider = document.getElementById("denoise-slider");
  const denoiseValDisplay = document.getElementById("denoise-val-display");

  // 생성 제어
  const promptInput = document.getElementById("prompt-input");
  const promptLen = document.getElementById("prompt-len");
  const negPromptInput = document.getElementById("neg-prompt-input");
  const seedInput = document.getElementById("seed-input");
  const randomizeSeedBtn = document.getElementById("randomize-seed-btn");
  const generateBtn = document.getElementById("generate-btn");
  const genSpinner = document.getElementById("gen-spinner");
  const generateBtnText = document.getElementById("generate-btn-text");
  const progressContainer = document.getElementById("progress-container");
  const progressBarFill = document.getElementById("progress-bar-fill");
  const progressStatusText = document.getElementById("progress-status-text");
  const progressPercent = document.getElementById("progress-percent");

  // 프리뷰 & 메타
  const previewPlaceholder = document.getElementById("preview-placeholder");
  const previewImgContainer = document.getElementById("preview-img-container");
  const mainPreviewImg = document.getElementById("main-preview-img");
  const downloadBtn = document.getElementById("download-btn");
  const copyPromptBtn = document.getElementById("copy-prompt-btn");
  const resultMeta = document.getElementById("result-meta");
  const metaSeed = document.getElementById("meta-seed");
  const metaSize = document.getElementById("meta-size");
  const metaEngine = document.getElementById("meta-engine");

  const historyGrid = document.getElementById("history-grid");
  const historyCount = document.getElementById("history-count");

  // --- 언어 전환 함수 ---
  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("lumina_lang", lang);
    document.documentElement.lang = lang;

    // 언어 버튼 활성화 UI
    if (lang === "ko") {
      langBtnKo.classList.add("active");
      langBtnEn.classList.remove("active");
    } else {
      langBtnEn.classList.add("active");
      langBtnKo.classList.remove("active");
    }

    const dict = i18n[lang] || i18n.en;
    document.title = dict.doc_title;

    // [data-i18n] 속성 엘리먼트 텍스트 갱신
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // [data-i18n-placeholder] 플레이스홀더 갱신
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });

    // 글자 수 단위 갱신
    if (promptInput) {
      promptLen.textContent = `${promptInput.value.length} ${dict.prompt_chars}`;
    }

    // 사전 동의 문구 및 링크 재바인딩
    if (consentTextContainer) {
      consentTextContainer.innerHTML = dict.consent_text_html;
      bindLegalLinks();
    }

    // 환불 모달 제목 및 본문 갱신
    if (refundModalTitle) refundModalTitle.textContent = dict.refund_modal_title;
    if (policyBodyContent) policyBodyContent.innerHTML = refundPolicyContent[lang] || refundPolicyContent.en;

    // 플랜 카드 재렌더링
    if (plansData.length > 0) {
      renderPlans(plansData);
    }
  }

  // 법적 약관 모달 링크 이벤트 바인딩
  function bindLegalLinks() {
    const viewTermsLink = document.getElementById("view-terms-link");
    const viewRefundLink = document.getElementById("view-refund-link");
    if (viewTermsLink) viewTermsLink.addEventListener("click", openRefundModal);
    if (viewRefundLink) viewRefundLink.addEventListener("click", openRefundModal);
  }

  // --- 1. 초기화 ---
  async function init() {
    setLanguage(currentLang);
    bindLegalLinks();

    // 언어 전환 버튼 클릭 리스너
    langBtnEn.addEventListener("click", () => setLanguage("en"));
    langBtnKo.addEventListener("click", () => setLanguage("ko"));

    await checkServerStatus();
    await loadUserProfile();
    await loadPlans();
    await loadHistory();

    setInterval(checkServerStatus, 20000);
  }

  // 서버 상태 점검
  async function checkServerStatus() {
    const dict = i18n[currentLang] || i18n.en;
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (data.comfyui.online) {
        comfyStatusBadge.className = "status-pill status-online";
        comfyStatusText.textContent = dict.comfy_online;
      } else {
        comfyStatusBadge.className = "status-pill status-offline";
        comfyStatusText.textContent = dict.comfy_offline;
      }
    } catch (e) {
      comfyStatusBadge.className = "status-pill status-offline";
      comfyStatusText.textContent = dict.comfy_waiting;
    }
  }

  // 사용자 프로필 및 일일 쿼터 로드
  async function loadUserProfile() {
    try {
      const res = await fetch(`/api/user?user_id=${currentUserId}`);
      currentUser = await res.json();

      // 헤더 플랜 뱃지 갱신
      headerPlanBadge.textContent = (currentUser.plan_id || "FREE").toUpperCase();
      todayRemainingEl.textContent = currentUser.remaining_today ?? currentUser.credits;
      todayQuotaEl.textContent = currentUser.daily_quota ?? 10;
    } catch (e) {
      console.error("사용자 정보 로드 실패:", e);
    }
  }

  // 요금제 플랜 로드
  async function loadPlans() {
    try {
      const res = await fetch("/api/plans");
      const data = await res.json();
      plansData = data.plans || [];
      renderPlans(plansData);

      // PayPal SDK 비동기 로드
      if (data.paypal_client_id && data.paypal_client_id !== "sb" && !paypalSdkLoaded) {
        loadPayPalSdk(data.paypal_client_id);
      }
    } catch (e) {
      console.error("플랜 로드 실패:", e);
    }
  }

  // 3가지 플랜 카드 렌더링 (다국어 매핑 적용)
  function renderPlans(plans) {
    plansContainer.innerHTML = "";
    const dict = i18n[currentLang] || i18n.en;

    plans.forEach(plan => {
      const card = document.createElement("div");
      const isFeatured = plan.featured || plan.badge === "Most Popular";
      const isValue = plan.badge === "Best Value";
      
      let badgeClass = "badge-standard";
      if (isFeatured) badgeClass = "badge-popular";
      else if (isValue) badgeClass = "badge-value";

      // 다국어 명칭 및 특징 매핑
      let planTitle = plan.name;
      let planTarget = plan.target || "";
      let planBadge = plan.badge;
      let planCta = plan.cta_text || "Select";
      let featureList = plan.features || [];

      if (plan.id === "starter_monthly") {
        planTitle = dict.plan_starter_name;
        planTarget = dict.plan_starter_target;
        planBadge = dict.plan_starter_badge;
        planCta = dict.plan_starter_cta;
        featureList = dict.plan_starter_features;
      } else if (plan.id === "pro_monthly") {
        planTitle = dict.plan_pro_name;
        planTarget = dict.plan_pro_target;
        planBadge = dict.plan_pro_badge;
        planCta = dict.plan_pro_cta;
        featureList = dict.plan_pro_features;
      } else if (plan.id === "pro_3month_pass") {
        planTitle = dict.plan_pass_name;
        planTarget = dict.plan_pass_target;
        planBadge = dict.plan_pass_badge;
        planCta = dict.plan_pass_cta;
        featureList = dict.plan_pass_features;
      }

      card.className = `pricing-card ${isFeatured ? "featured" : ""}`;
      card.dataset.planId = plan.id;

      const featureListHtml = featureList.map(f => `
        <li class="feature-item">
          <span class="check-icon">✓</span>
          <span>${f}</span>
        </li>
      `).join("");

      card.innerHTML = `
        <div class="plan-top-badge ${badgeClass}">${planBadge}</div>
        <div class="card-header">
          <h3 class="card-title">${planTitle}</h3>
          <p class="card-target">${planTarget}</p>
        </div>
        <div class="card-price-box">
          <div class="card-price">${plan.price_display}</div>
          ${plan.subtitle ? `<div class="card-price-sub">${plan.subtitle}</div>` : ""}
        </div>
        <ul class="card-features">
          ${featureListHtml}
        </ul>
        <button type="button" class="btn ${isFeatured ? "btn-primary glow" : "btn-secondary"} btn-block card-cta-btn">
          ${planCta}
        </button>
      `;

      card.addEventListener("click", () => selectPlan(plan, card, planTitle, planTarget));
      plansContainer.appendChild(card);

      // 기본 선택: Most Popular
      if (isFeatured && (!selectedPlan || selectedPlan.id === plan.id)) {
        selectPlan(plan, card, planTitle, planTarget);
      }
    });
  }

  // 플랜 선택
  function selectPlan(plan, cardEl, translatedTitle, translatedTarget) {
    selectedPlan = plan;
    document.querySelectorAll(".pricing-card").forEach(c => c.classList.remove("selected"));
    cardEl.classList.add("selected");

    selectedPlanTitle.textContent = translatedTitle || plan.name;
    selectedPlanPriceTag.textContent = plan.price_display;
    selectedPlanTarget.textContent = translatedTarget || plan.target || plan.subtitle || "";

    renderPayPalButtons(plan);
  }

  // 동의 체크박스 상태 변경 시 에러 메시지 숨김
  agreementCheckbox.addEventListener("change", () => {
    if (agreementCheckbox.checked) {
      consentErrorMsg.classList.add("hidden");
    }
  });

  // PayPal SDK 로드
  function loadPayPalSdk(clientId) {
    if (document.getElementById("paypal-sdk-script")) return;
    const script = document.createElement("script");
    script.id = "paypal-sdk-script";
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.onload = () => {
      paypalSdkLoaded = true;
      if (selectedPlan) renderPayPalButtons(selectedPlan);
    };
    document.head.appendChild(script);
  }

  // PayPal 스마트 버튼 렌더링
  function renderPayPalButtons(plan) {
    const container = document.getElementById("paypal-button-container");
    container.innerHTML = "";
    const dict = i18n[currentLang] || i18n.en;

    if (window.paypal && paypal.Buttons) {
      paypal.Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "pay"
        },
        onClick: (data, actions) => {
          // 동의 체크박스 검증
          if (!agreementCheckbox.checked) {
            consentErrorMsg.classList.remove("hidden");
            agreementCheckbox.focus();
            return actions.reject();
          }
          consentErrorMsg.classList.add("hidden");
          return actions.resolve();
        },
        createOrder: async () => {
          const res = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan_id: plan.id,
              user_id: currentUserId,
              agreement_accepted: agreementCheckbox.checked
            })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          return data.order_id;
        },
        onApprove: async (data) => {
          const res = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: data.orderID,
              plan_id: plan.id,
              user_id: currentUserId,
              agreement_accepted: agreementCheckbox.checked
            })
          });
          const result = await res.json();
          if (result.success) {
            alert(result.message || dict.alert_pay_success);
            pricingModal.classList.add("hidden");
            await loadUserProfile();
          } else {
            alert(dict.alert_pay_failed + (result.error || ""));
          }
        },
        onError: (err) => {
          console.error("PayPal Error:", err);
          alert(dict.alert_pay_error);
        }
      }).render("#paypal-button-container");
    }
  }

  // 모의 결제 (빠른 테스트)
  mockCheckoutBtn.addEventListener("click", async () => {
    if (!selectedPlan) return;
    const dict = i18n[currentLang] || i18n.en;

    if (!agreementCheckbox.checked) {
      consentErrorMsg.classList.remove("hidden");
      agreementCheckbox.focus();
      return;
    }
    consentErrorMsg.classList.add("hidden");

    try {
      mockCheckoutBtn.disabled = true;
      mockCheckoutBtn.textContent = dict.mock_processing;

      const createRes = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          user_id: currentUserId,
          agreement_accepted: true
        })
      });
      const order = await createRes.json();
      if (order.error) throw new Error(order.error);

      const capRes = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.order_id,
          plan_id: selectedPlan.id,
          user_id: currentUserId,
          agreement_accepted: true
        })
      });
      const capResult = await capRes.json();

      if (capResult.success) {
        alert(capResult.message || dict.alert_mock_success);
        pricingModal.classList.add("hidden");
        await loadUserProfile();
      } else {
        alert(dict.alert_pay_failed + capResult.error);
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      mockCheckoutBtn.disabled = false;
      mockCheckoutBtn.textContent = dict.btn_mock_checkout;
    }
  });

  // --- 2. 환불 정책 모달 토글 ---
  function openRefundModal(e) {
    if (e) e.preventDefault();
    const dict = i18n[currentLang] || i18n.en;
    refundModalTitle.textContent = dict.refund_modal_title;
    policyBodyContent.innerHTML = refundPolicyContent[currentLang] || refundPolicyContent.en;
    refundModal.classList.remove("hidden");
  }

  function closeRefundModal() {
    refundModal.classList.add("hidden");
  }

  footerRefundLink.addEventListener("click", openRefundModal);
  footerTermsLink.addEventListener("click", openRefundModal);
  closeRefundBtn.addEventListener("click", closeRefundModal);
  ackRefundBtn.addEventListener("click", closeRefundModal);
  refundModal.addEventListener("click", (e) => {
    if (e.target === refundModal) closeRefundModal();
  });

  // --- 생성 모드 선택 탭 제어 (Text-to-Image / Image-to-Image) ---
  if (modeTabTxt2Img && modeTabImg2Img) {
    modeTabTxt2Img.addEventListener("click", () => {
      clearAttachedImage();
      modeTabTxt2Img.classList.add("active");
      modeTabImg2Img.classList.remove("active");
    });

    modeTabImg2Img.addEventListener("click", () => {
      modeTabImg2Img.classList.add("active");
      modeTabTxt2Img.classList.remove("active");
      if (!uploadedComfyFilename && refImageInput) {
        refImageInput.click();
      }
    });
  }

  // --- 제미나이 스타일 스마트 이미지 첨부 (클릭, 카드 드래그&드롭, Ctrl+V 붙여넣기) ---
  if (btnQuickAttach && refImageInput) {
    btnQuickAttach.addEventListener("click", () => {
      refImageInput.click();
    });

    refImageInput.addEventListener("change", () => {
      if (refImageInput.files && refImageInput.files.length > 0) {
        handleImageUpload(refImageInput.files[0]);
      }
    });
  }

  // 1. 프롬프트 카드 전체 드래그 앤 드롭 (Gemini 오버레이 UX)
  if (geminiPromptCard) {
    let dragCounter = 0;

    geminiPromptCard.addEventListener("dragenter", (e) => {
      e.preventDefault();
      dragCounter++;
      geminiPromptCard.classList.add("drag-active");
      if (dropOverlay) dropOverlay.classList.remove("hidden");
    });

    geminiPromptCard.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    geminiPromptCard.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        geminiPromptCard.classList.remove("drag-active");
        if (dropOverlay) dropOverlay.classList.add("hidden");
      }
    });

    geminiPromptCard.addEventListener("drop", (e) => {
      e.preventDefault();
      dragCounter = 0;
      geminiPromptCard.classList.remove("drag-active");
      if (dropOverlay) dropOverlay.classList.add("hidden");
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleImageUpload(e.dataTransfer.files[0]);
      }
    });
  }

  // 2. 프롬프트 입력창 어디서나 클립보드 이미지 직접 붙여넣기 (Ctrl + V)
  if (promptInput) {
    promptInput.addEventListener("paste", (e) => {
      const items = (e.clipboardData || window.clipboardData).items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type && items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              handleImageUpload(blob);
              break;
            }
          }
        }
      }
    });
  }

  // 첨부 이미지 제거 버튼
  if (removeAttachedBtn) {
    removeAttachedBtn.addEventListener("click", () => {
      clearAttachedImage();
    });
  }

  function clearAttachedImage() {
    uploadedComfyFilename = null;
    if (refImageInput) refImageInput.value = "";
    if (attachedThumb) attachedThumb.src = "";
    if (geminiAttachmentBar) geminiAttachmentBar.classList.add("hidden");
    if (modeTabTxt2Img && modeTabImg2Img) {
      modeTabTxt2Img.classList.add("active");
      modeTabImg2Img.classList.remove("active");
    }
    if (img2imgActiveIndicator) img2imgActiveIndicator.classList.add("hidden");
  }

  async function handleImageUpload(file) {
    if (!file || !file.type.startsWith("image/")) {
      alert(currentLang === "ko" ? "PNG, JPG, WEBP 형식의 이미지 파일만 지원됩니다." : "Only PNG, JPG, WEBP images are supported.");
      return;
    }

    const fileName = file.name || "attached_image.png";

    // 1. 즉시 로컬 미리보기 칩 노출 & 모드 탭 자동 전환 (제미나이 UX)
    const reader = new FileReader();
    reader.onload = (e) => {
      if (attachedThumb) attachedThumb.src = e.target.result;
      if (attachedName) attachedName.textContent = fileName;
      if (geminiAttachmentBar) geminiAttachmentBar.classList.remove("hidden");
      if (modeTabImg2Img && modeTabTxt2Img) {
        modeTabImg2Img.classList.add("active");
        modeTabTxt2Img.classList.remove("active");
      }
      if (img2imgActiveIndicator) img2imgActiveIndicator.classList.remove("hidden");
    };
    reader.readAsDataURL(file);

    // 2. ComfyUI input 서버로 즉시 업로드
    const formData = new FormData();
    formData.append("image", file, fileName);

    try {
      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success && data.filename) {
        uploadedComfyFilename = data.filename;
      } else {
        throw new Error(data.error || "업로드 실패");
      }
    } catch (e) {
      console.error("이미지 업로드 실패:", e);
      alert((currentLang === "ko" ? "이미지 업로드 실패: " : "Image upload failed: ") + e.message);
      clearAttachedImage();
    }
  }

  if (denoiseSlider && denoiseValDisplay) {
    denoiseSlider.addEventListener("input", () => {
      denoiseValDisplay.textContent = denoiseSlider.value;
    });
  }

  // --- 3. 이미지 생성 실행 ---
  promptInput.addEventListener("input", () => {
    const dict = i18n[currentLang] || i18n.en;
    promptLen.textContent = `${promptInput.value.length} ${dict.prompt_chars}`;
  });

  // 추천 태그 클릭
  document.querySelectorAll(".tag-pill").forEach(tag => {
    tag.addEventListener("click", () => {
      const appendText = tag.getAttribute("data-tag");
      const current = promptInput.value.trim();
      promptInput.value = current ? `${current}, ${appendText}` : appendText;
      const dict = i18n[currentLang] || i18n.en;
      promptLen.textContent = `${promptInput.value.length} ${dict.prompt_chars}`;
      promptInput.focus();
    });
  });

  // 비율 선택 버튼
  document.querySelectorAll(".ratio-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".ratio-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  randomizeSeedBtn.addEventListener("click", () => {
    seedInput.value = Math.floor(Math.random() * 1000000000);
  });

  generateBtn.addEventListener("click", async () => {
    const dict = i18n[currentLang] || i18n.en;
    const prompt = promptInput.value.trim();
    if (!prompt) {
      alert(dict.alert_empty_prompt);
      promptInput.focus();
      return;
    }

    // 모드가 Image-to-Image인데 이미지가 첨부되지 않은 경우 안내
    if (modeTabImg2Img && modeTabImg2Img.classList.contains("active") && !uploadedComfyFilename) {
      alert(currentLang === "ko" 
        ? "이미지 참조 모드(Img2Img)가 선택되었습니다. 참조할 이미지를 먼저 첨부하거나 [텍스트로 생성] 탭을 눌러주세요." 
        : "Image-to-Image mode is active. Please attach a reference image or switch to [Text to Image].");
      if (refImageInput) refImageInput.click();
      return;
    }

    // 이미지가 첨부되어 있으면 자동으로 Image-to-Image 모드, 없으면 Text-to-Image 모드로 작동
    const isImg2Img = Boolean(uploadedComfyFilename);
    const denoiseVal = isImg2Img && denoiseSlider ? parseFloat(denoiseSlider.value) : 1.0;

    const selectedRatio = document.querySelector('input[name="aspect-ratio"]:checked').value;
    const [width, height] = selectedRatio.split("x").map(Number);
    const negativePrompt = negPromptInput.value.trim();
    const seed = parseInt(seedInput.value) || -1;

    generateBtn.disabled = true;
    genSpinner.classList.remove("hidden");
    progressContainer.classList.remove("hidden");
    progressBarFill.style.width = "10%";
    progressPercent.textContent = "10%";
    progressStatusText.textContent = dict.progress_preparing;

    let currentP = 10;
    const progressTimer = setInterval(() => {
      if (currentP < 90) {
        currentP += Math.floor(Math.random() * 8) + 4;
        if (currentP > 90) currentP = 90;
        progressBarFill.style.width = `${currentP}%`;
        progressPercent.textContent = `${currentP}%`;
        progressStatusText.textContent = `${dict.progress_denoising} (${currentP}%)`;
      }
    }, 350);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          mode: isImg2Img ? "img2img" : "txt2img",
          prompt: prompt,
          negative_prompt: negativePrompt,
          width: width,
          height: height,
          seed: seed,
          image_filename: isImg2Img ? uploadedComfyFilename : null,
          denoise: denoiseVal
        })
      });

      clearInterval(progressTimer);

      if (!res.ok) {
        let errMsg = "Generation error";
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {
          const txt = await res.text();
          errMsg = txt || errMsg;
        }
        if (res.status === 402) {
          if (confirm(dict.alert_quota_exceeded)) {
            pricingModal.classList.remove("hidden");
          }
          return;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();

      progressBarFill.style.width = "100%";
      progressPercent.textContent = "100%";
      progressStatusText.textContent = dict.progress_done;

      setTimeout(() => {
        progressContainer.classList.add("hidden");
      }, 700);

      // 사용자 쿼터 갱신
      if (data.user) {
        currentUser = data.user;
        todayRemainingEl.textContent = currentUser.remaining_today;
        todayQuotaEl.textContent = currentUser.daily_quota;
      }

      showPreview(data);
      loadHistory();

    } catch (e) {
      clearInterval(progressTimer);
      progressContainer.classList.add("hidden");
      alert(dict.alert_gen_failed + e.message);
    } finally {
      generateBtn.disabled = false;
      genSpinner.classList.add("hidden");
    }
  });

  function showPreview(data) {
    const dict = i18n[currentLang] || i18n.en;
    previewPlaceholder.classList.add("hidden");
    previewImgContainer.classList.remove("hidden");
    resultMeta.classList.remove("hidden");

    mainPreviewImg.src = data.image_url;
    downloadBtn.href = data.image_url;
    downloadBtn.download = `lumina_${data.id}.png`;

    metaSeed.textContent = data.seed;
    metaSize.textContent = `${data.width}x${data.height}`;
    metaEngine.textContent = data.mode === "comfyui_live" ? "ComfyUI GPU (Live)" : "Demo Simulation";

    copyPromptBtn.onclick = () => {
      navigator.clipboard.writeText(data.prompt);
      alert(dict.alert_copied);
    };
  }

  // 히스토리 로드
  async function loadHistory() {
    const dict = i18n[currentLang] || i18n.en;
    try {
      const res = await fetch(`/api/history?user_id=${currentUserId}`);
      const data = await res.json();
      const list = data.history || [];

      historyCount.textContent = `${list.length} ${dict.gallery_count}`;

      if (list.length === 0) {
        historyGrid.innerHTML = `<div class="empty-history">${dict.gallery_empty}</div>`;
        return;
      }

      historyGrid.innerHTML = "";
      list.forEach(item => {
        const itemEl = document.createElement("div");
        itemEl.className = "history-item";
        itemEl.innerHTML = `<img src="${item.image_url}" alt="AI artwork" loading="lazy">`;
        
        itemEl.addEventListener("click", () => {
          showPreview({
            id: item.id,
            image_url: item.image_url,
            prompt: item.prompt,
            seed: item.seed,
            width: item.width,
            height: item.height,
            mode: "history"
          });
          promptInput.value = item.prompt;
          promptLen.textContent = `${item.prompt.length} ${dict.prompt_chars}`;
          window.scrollTo({ top: 0, behavior: "smooth" });
        });

        historyGrid.appendChild(itemEl);
      });
    } catch (e) {
      console.error("히스토리 로드 실패:", e);
    }
  }

  // 모달 제어
  openPricingBtn.addEventListener("click", () => {
    pricingModal.classList.remove("hidden");
  });

  closePricingBtn.addEventListener("click", () => {
    pricingModal.classList.add("hidden");
  });

  pricingModal.addEventListener("click", (e) => {
    if (e.target === pricingModal) {
      pricingModal.classList.add("hidden");
    }
  });

  // 시작
  init();
});
