// 🎨 Lumina AI SaaS 프론트엔드 - 플랜 구독 & 페이팔 결제 & 환불 정책 연동
document.addEventListener("DOMContentLoaded", () => {
  // 상태 변수
  let currentUserId = "default_user";
  let currentUser = null;
  let plansData = [];
  let selectedPlan = null;
  let paypalSdkLoaded = false;

  // DOM 요소
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
  const closeRefundBtn = document.getElementById("close-refund-btn");
  const ackRefundBtn = document.getElementById("ack-refund-btn");
  const viewRefundLink = document.getElementById("view-refund-link");
  const viewTermsLink = document.getElementById("view-terms-link");
  const footerRefundLink = document.getElementById("footer-refund-link");
  const footerTermsLink = document.getElementById("footer-terms-link");

  // 체크아웃 & 동의 관련
  const agreementCheckbox = document.getElementById("agreement-checkbox");
  const consentErrorMsg = document.getElementById("consent-error-msg");
  const selectedPlanTitle = document.getElementById("selected-plan-title");
  const selectedPlanPriceTag = document.getElementById("selected-plan-price-tag");
  const selectedPlanTarget = document.getElementById("selected-plan-target");
  const mockCheckoutBtn = document.getElementById("mock-checkout-btn");

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

  // --- 1. 초기화 ---
  async function init() {
    await checkServerStatus();
    await loadUserProfile();
    await loadPlans();
    await loadHistory();

    setInterval(checkServerStatus, 20000);
  }

  // 서버 상태 점검
  async function checkServerStatus() {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (data.comfyui.online) {
        comfyStatusBadge.className = "status-pill status-online";
        comfyStatusText.textContent = "ComfyUI GPU 온라인 (Live)";
      } else {
        comfyStatusBadge.className = "status-pill status-offline";
        comfyStatusText.textContent = "ComfyUI 오프라인 (데모 모드)";
      }
    } catch (e) {
      comfyStatusBadge.className = "status-pill status-offline";
      comfyStatusText.textContent = "서버 연결 대기 중";
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

  // 3가지 플랜 카드 렌더링
  function renderPlans(plans) {
    plansContainer.innerHTML = "";

    plans.forEach(plan => {
      const card = document.createElement("div");
      const isFeatured = plan.featured || plan.badge === "Most Popular";
      const isValue = plan.badge === "Best Value";
      
      let badgeClass = "badge-standard";
      if (isFeatured) badgeClass = "badge-popular";
      else if (isValue) badgeClass = "badge-value";

      card.className = `pricing-card ${isFeatured ? "featured" : ""}`;
      card.dataset.planId = plan.id;

      const featureListHtml = plan.features.map(f => `
        <li class="feature-item">
          <span class="check-icon">✓</span>
          <span>${f}</span>
        </li>
      `).join("");

      card.innerHTML = `
        <div class="plan-top-badge ${badgeClass}">${plan.badge}</div>
        <div class="card-header">
          <h3 class="card-title">${plan.name}</h3>
          <p class="card-target">${plan.target || ""}</p>
        </div>
        <div class="card-price-box">
          <div class="card-price">${plan.price_display}</div>
          ${plan.subtitle ? `<div class="card-price-sub">${plan.subtitle}</div>` : ""}
        </div>
        <ul class="card-features">
          ${featureListHtml}
        </ul>
        <button type="button" class="btn ${isFeatured ? "btn-primary glow" : "btn-secondary"} btn-block card-cta-btn">
          ${plan.cta_text || "선택하기"}
        </button>
      `;

      card.addEventListener("click", () => selectPlan(plan, card));
      plansContainer.appendChild(card);

      // 기본 선택: Most Popular
      if (isFeatured && !selectedPlan) {
        selectPlan(plan, card);
      }
    });
  }

  // 플랜 선택
  function selectPlan(plan, cardEl) {
    selectedPlan = plan;
    document.querySelectorAll(".pricing-card").forEach(c => c.classList.remove("selected"));
    cardEl.classList.add("selected");

    selectedPlanTitle.textContent = plan.name;
    selectedPlanPriceTag.textContent = plan.price_display;
    selectedPlanTarget.textContent = plan.target || plan.subtitle || "";

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
            alert(result.message || "🎉 결제가 완료되었습니다!");
            pricingModal.classList.add("hidden");
            await loadUserProfile();
          } else {
            alert("결제 승인 처리 실패: " + (result.error || ""));
          }
        },
        onError: (err) => {
          console.error("PayPal Error:", err);
          alert("결제 진행 중 오류가 발생했습니다.");
        }
      }).render("#paypal-button-container");
    }
  }

  // 모의 결제 (빠른 테스트)
  mockCheckoutBtn.addEventListener("click", async () => {
    if (!selectedPlan) return;

    if (!agreementCheckbox.checked) {
      consentErrorMsg.classList.remove("hidden");
      agreementCheckbox.focus();
      return;
    }
    consentErrorMsg.classList.add("hidden");

    try {
      mockCheckoutBtn.disabled = true;
      mockCheckoutBtn.textContent = "⏳ 결제 승인 처리 중...";

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
        alert(capResult.message || "🎉 [테스트 결제 완료] 플랜이 성공적으로 활성화되었습니다!");
        pricingModal.classList.add("hidden");
        await loadUserProfile();
      } else {
        alert("결제 실패: " + capResult.error);
      }
    } catch (e) {
      alert("오류 발생: " + e.message);
    } finally {
      mockCheckoutBtn.disabled = false;
      mockCheckoutBtn.textContent = "⚡ [테스트 모드] 1초 결제 승인 시뮬레이션";
    }
  });

  // --- 2. 환불 정책 모달 토글 ---
  function openRefundModal(e) {
    if (e) e.preventDefault();
    refundModal.classList.remove("hidden");
  }

  function closeRefundModal() {
    refundModal.classList.add("hidden");
  }

  viewRefundLink.addEventListener("click", openRefundModal);
  viewTermsLink.addEventListener("click", openRefundModal);
  footerRefundLink.addEventListener("click", openRefundModal);
  footerTermsLink.addEventListener("click", openRefundModal);
  closeRefundBtn.addEventListener("click", closeRefundModal);
  ackRefundBtn.addEventListener("click", closeRefundModal);
  refundModal.addEventListener("click", (e) => {
    if (e.target === refundModal) closeRefundModal();
  });

  // --- 3. 이미지 생성 실행 ---
  promptInput.addEventListener("input", () => {
    promptLen.textContent = `${promptInput.value.length} 자`;
  });

  // 추천 태그 클릭
  document.querySelectorAll(".tag-pill").forEach(tag => {
    tag.addEventListener("click", () => {
      const appendText = tag.getAttribute("data-tag");
      const current = promptInput.value.trim();
      promptInput.value = current ? `${current}, ${appendText}` : appendText;
      promptLen.textContent = `${promptInput.value.length} 자`;
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
    const prompt = promptInput.value.trim();
    if (!prompt) {
      alert("이미지 설명을 프롬프트에 입력해주세요!");
      promptInput.focus();
      return;
    }

    const selectedRatio = document.querySelector('input[name="aspect-ratio"]:checked').value;
    const [width, height] = selectedRatio.split("x").map(Number);
    const negativePrompt = negPromptInput.value.trim();
    const seed = parseInt(seedInput.value) || -1;

    generateBtn.disabled = true;
    genSpinner.classList.remove("hidden");
    progressContainer.classList.remove("hidden");
    progressBarFill.style.width = "10%";
    progressPercent.textContent = "10%";
    progressStatusText.textContent = "ComfyUI GPU 작업 큐 등록 중...";

    let currentP = 10;
    const progressTimer = setInterval(() => {
      if (currentP < 90) {
        currentP += Math.floor(Math.random() * 8) + 4;
        if (currentP > 90) currentP = 90;
        progressBarFill.style.width = `${currentP}%`;
        progressPercent.textContent = `${currentP}%`;
        progressStatusText.textContent = `디노이징 샘플링 중... (${currentP}%)`;
      }
    }, 350);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          prompt: prompt,
          negative_prompt: negativePrompt,
          width: width,
          height: height,
          seed: seed
        })
      });

      clearInterval(progressTimer);

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 402) {
          if (confirm(`${err.error}\n\n지금 플랜을 업그레이드하시겠습니까?`)) {
            pricingModal.classList.remove("hidden");
          }
          return;
        }
        throw new Error(err.error || "생성 실패");
      }

      const data = await res.json();

      progressBarFill.style.width = "100%";
      progressPercent.textContent = "100%";
      progressStatusText.textContent = "완료!";

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
      alert("생성 실패: " + e.message);
    } finally {
      generateBtn.disabled = false;
      genSpinner.classList.add("hidden");
    }
  });

  function showPreview(data) {
    previewPlaceholder.classList.add("hidden");
    previewImgContainer.classList.remove("hidden");
    resultMeta.classList.remove("hidden");

    mainPreviewImg.src = data.image_url;
    downloadBtn.href = data.image_url;
    downloadBtn.download = `comfy_${data.id}.png`;

    metaSeed.textContent = data.seed;
    metaSize.textContent = `${data.width}x${data.height}`;
    metaEngine.textContent = data.mode === "comfyui_live" ? "ComfyUI GPU (Live)" : "Demo Simulation";

    copyPromptBtn.onclick = () => {
      navigator.clipboard.writeText(data.prompt);
      alert("프롬프트가 클립보드에 복사되었습니다!");
    };
  }

  // 히스토리 로드
  async function loadHistory() {
    try {
      const res = await fetch(`/api/history?user_id=${currentUserId}`);
      const data = await res.json();
      const list = data.history || [];

      historyCount.textContent = `${list.length}개 항목`;

      if (list.length === 0) {
        historyGrid.innerHTML = `<div class="empty-history">아직 생성된 이미지가 없습니다. 첫 작품을 생성해보세요!</div>`;
        return;
      }

      historyGrid.innerHTML = "";
      list.forEach(item => {
        const itemEl = document.createElement("div");
        itemEl.className = "history-item";
        itemEl.innerHTML = `<img src="${item.image_url}" alt="생성 이미지" loading="lazy">`;
        
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
          promptLen.textContent = `${item.prompt.length} 자`;
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
