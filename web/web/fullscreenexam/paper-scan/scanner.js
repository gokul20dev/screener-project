// Document Scanner - Manual Capture Mode

// --- Functions to be executed after DOM is loaded ---
function initializeScanner() {
  // --- Global State and Configuration ---
  let mainContainer,
    cameraContainer,
    previewContainer,
    confirmationContainer,
    finalContainer,
    editToolsPanel;
  let video, canvas, previewCanvas, previewCtx, capturedCanvas, finalCanvas;
  let scaleX = 1,
    scaleY = 1;
  let cropRect = { x: 0, y: 0, width: 0, height: 0 };
  let isEditing = false;
  let currentFilters = { brightness: 100, contrast: 100, grayscale: false };

  const CAPTURE_WIDTH = 1920;
  const CAPTURE_HEIGHT = 1080;

  let currentLanguage = "en";
  const translations = {
    en: {
      // Titles & Instructions
      cameraTitle: "1. Scan Your Answer Sheet",
      cameraInstructions:
        "Position your answer sheet in the frame and hold steady.",
      previewTitle: "2. Preview & Edit",
      previewInstructions:
        "Happy with the scan? Upload it directly or use 'Edit' for adjustments.",
      confirmationTitle: "3. Confirm Your Final Image",
      confirmationInstructions:
        "This is the final image that will be uploaded. Press 'Confirm & Upload' to submit.",
      finalTitle: "Upload Successful!",
      finalInstructions:
        "Click on refresh icon in your exam portal to view uploaded answer sheets.",
      editPanelTitle: "Editing Tools",
      cropInstruction: "Drag the corners to adjust the crop area.",
      howToUse: "How to Use",
      helpTitle: "Scanning Guide",
      helpStep1:
        "<strong>Step 1: Scan</strong><p>Place your answer sheet on a flat, well-lit surface. Align it within the frame and press 'Scan Answer Sheet'.</p>",
      helpStep2:
        "<strong>Step 2: Preview & Upload</strong><p>Review the scanned image. If it's clear, press 'Upload'.</p>",
      helpStep3:
        "<strong>Step 3: Edit (Optional)</strong><p>If needed, press 'Edit' to open the tools. You can crop the image or adjust brightness and contrast.</p>",
      helpStep4:
        "<strong>Step 4: Save & Finish</strong><p>After editing, press 'Save & Upload'. You can then scan another page or finish.</p>",
  

      brightness:"Brightness",
      contrast:"Contrast",
      grayscale:"grayscale",
      // Buttons
      capture: "Scan Answer Sheet",
      upload: "Direct upload",
      edit: "Edit and upload",
      saveAndUpload: "Save",
      confirmAndUpload: "Confirm & Upload",
      goBackAndEdit: "Go Back & Edit",
      cancel: "Cancel",
      retake: "Retake",
      uploadAnother: "Scan Another Page",
      finish: "Finish",

      // Toasts & Errors
      cameraReady: "Camera is ready!",
      camAccessDenied: "Camera access is required.",
      camAccessTrying: "Could not access back camera, trying another...",
      invalidCrop: "Invalid crop area.",
      invalidImage: "Scanned image is invalid.",
      attenderIdMissing: "Attender ID not found in URL.",
      uploading: "Uploading answer sheet...",
      uploadSuccess: "Answer sheet uploaded!",
      uploadFailed: "Upload failed:",
      saveFailed: "Failed to save details:",
      missingIds: "Missing required IDs.",
      fileCreationError: "Could not create image file.",
    },
    ar: {
      // Titles & Instructions
      cameraTitle: "١. مسح ورقة الإجابة",
      cameraInstructions: "ضع ورقة إجابتك في الإطار وثبّت يدك.",
      previewTitle: "٢. معاينة وتعديل",
      previewInstructions:
        "هل أنت راضٍ عن الصورة؟ ارفعها مباشرة أو استخدم 'تعديل' لإجراء التعديلات.",
      confirmationTitle: "٣. تأكيد الصورة النهائية",
      confirmationInstructions:
        "هذه هي الصورة النهائية التي سيتم رفعها. اضغط على 'تأكيد ورفع' للإرسال.",
      finalTitle: "تم الرفع بنجاح!",
      finalInstructions:
        "انقر على أيقونة التحديث في بوابة الامتحان لعرض أوراق الإجابة التي تم رفعها.",
      editPanelTitle: "أدوات التعديل",
      cropInstruction: "اسحب الزوايا لضبط منطقة القص.",
      howToUse: "كيفية الاستخدام",
      helpTitle: "دليل المسح الضوئي",
      helpStep1:
        "<strong>الخطوة ١: المسح</strong><p>ضع ورقة إجابتك على سطح مستوٍ ومضاء جيدًا. قم بمحاذاتها داخل الإطار واضغط على 'مسح ورقة الإجابة'.</p>",
      helpStep2:
        "<strong>الخطوة ٢: المعاينة والرفع</strong><p>راجع الصورة الممسوحة ضوئيًا. إذا كانت واضحة، اضغط على 'رفع'.</p>",
      helpStep3:
        "<strong>الخطوة ٣: التعديل (اختياري)</strong><p>إذا لزم الأمر، اضغط على 'تعديل' لفتح الأدوات. يمكنك قص الصورة أو ضبط السطوع والتباين.</p>",
      helpStep4:
        "<strong>الخطوة ٤: الحفظ والإنهاء</strong><p>بعد التعديل، اضغط على 'حفظ ورفع'. يمكنك بعد ذلك مسح صفحة أخرى أو إنهاء العملية.</p>",



      brightness: "السطوع",
      contrast: "التباين",
      grayscale: "تدرج الرمادي",

      // Buttons
      capture: "مسح ورقة الإجابة",
      upload: "رفع مباشر",
      edit: "تعديل ورفع",
      saveAndUpload: "حفظ",
      confirmAndUpload: "تأكيد ورفع",
      goBackAndEdit: "العودة والتعديل",
      cancel: "إلغاء",
      retake: "إعادة التقاط",
      uploadAnother: "مسح صفحة أخرى",
      finish: "إنهاء",

      // Toasts & Errors
      cameraReady: "الكاميرا جاهزة!",
      camAccessDenied: "الوصول إلى الكاميرا مطلوب.",
      camAccessTrying: "تعذر الوصول للكاميرا الخلفية، جاري تجربة أخرى...",
      invalidCrop: "منطقة قص غير صالحة.",
      invalidImage: "الصورة الممسوحة غير صالحة.",
      attenderIdMissing: "معرّف الحاضر غير موجود.",
      uploading: "جاري رفع ورقة الإجابة...",
      uploadSuccess: "تم رفع ورقة الإجابة!",
      uploadFailed: "فشل الرفع:",
      saveFailed: "فشل حفظ التفاصيل:",
      missingIds: "المعرفات المطلوبة غير موجودة.",
      fileCreationError: "تعذر إنشاء ملف الصورة.",
    },
  };

  function T(key) {
    return translations[currentLanguage][key] || key;
  }

  function setLanguage(lang) {
    currentLanguage = lang;
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.body.dir = dir;

    document.getElementById("camera-title").textContent = T("cameraTitle");
    document.getElementById("camera-instructions").textContent =
      T("cameraInstructions");
    document.getElementById("preview-title").textContent = T("previewTitle");
    document.getElementById("preview-instructions").textContent = T(
      "previewInstructions"
    );
    document.getElementById("confirmation-title").textContent =
      T("confirmationTitle");
    document.getElementById("confirmation-instructions").textContent = T(
      "confirmationInstructions"
    );
    document.getElementById("final-title").textContent = T("finalTitle");
    document.getElementById("final-instructions").textContent =
      T("finalInstructions");
    document.getElementById("edit-panel-title").textContent =
      T("editPanelTitle");
    document.getElementById("cropping-edit-instructions").textContent =
      T("cropInstruction");
    document.getElementById("how-to-use-text").textContent = T("howToUse");
    buildHelpPanelContent(); // Re-build help panel on language change
    document.querySelectorAll("[data-key]").forEach(el => {
    el.textContent = T(el.dataset.key);
    });


if (cameraContainer.classList.contains("active")) {
  const controls = document.getElementById("camera-controls");
  controls.innerHTML = "";
  const captureBtn = createButton(T("capture"), captureImage, ["primary"]);
  controls.appendChild(captureBtn);
} else if (previewContainer.classList.contains("active")) {
  buildPreviewUI(capturedCanvas);
} else if (confirmationContainer.classList.contains("active")) {
  buildConfirmationUI();
} else if (finalContainer.classList.contains("active")) {
    // manually rebuild final controls
    const controls = document.getElementById("final-controls");
    controls.innerHTML = "";
    const anotherBtn = createButton(T("uploadAnother"), resetForNewCapture, ["primary"]);
    const isApp = getQueryParam("a");
    const finishBtn = createButton(T("finish"), () => {
      if (isApp === "1") {
        window.parent.postMessage("closeIframe", "*");
      } else {
        window.location.href = "qr-scanner.html";
      }
    }, ["success"]);
    controls.appendChild(finishBtn);
    controls.append(anotherBtn);
}

  }

  function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // --- UI Initialization & Management ---
  function setupUI() {
    mainContainer = document.getElementById("scanner-main-content");
    if (!mainContainer) {
      console.error("Fatal Error: Main scanner container not found.");
      return;
    }

    cameraContainer = document.getElementById("camera-screen");
    previewContainer = document.getElementById("preview-screen");
    confirmationContainer = document.getElementById("confirmation-screen");
    finalContainer = document.getElementById("final-screen");
    editToolsPanel = document.getElementById("edit-tools-panel");

    video = document.createElement("video");
    Object.assign(video.style, {
      width: "100%",
      borderRadius: "12px",
      backgroundColor: "#000",
    });
    video.setAttribute("playsinline", "");
    document.getElementById("video-container").appendChild(video);

    const captureBtn = createButton(T("capture"), captureImage, ["primary"]);
    document.getElementById("camera-controls").appendChild(captureBtn);

    canvas = document.createElement("canvas");

    const langLabelEn = document.getElementById("lang-label-en");
    const langLabelAr = document.getElementById("lang-label-ar");
    langLabelEn.addEventListener("click", () => {
      setLanguage("en");
      langLabelEn.classList.add("active");
      langLabelAr.classList.remove("active");
    });
    langLabelAr.addEventListener("click", () => {
      setLanguage("ar");
      langLabelAr.classList.add("active");
      langLabelEn.classList.remove("active");
    });
    setLanguage("en");

    // Add a pulsing effect to the main capture button to draw attention
    const style = document.createElement("style");
    style.innerHTML = `
            #camera-controls .scanner-button.primary {
                animation: pulse-primary 2s infinite;
            }

            @keyframes pulse-primary {
                0% {
                    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
                }
                70% {
                    box-shadow: 0 0 0 15px rgba(0, 123, 255, 0);
                }
                100% {
                    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
                }
            }
        `;
    document.head.appendChild(style);
  }

  function showScreen(screenName) {
    [
      cameraContainer,
      previewContainer,
      confirmationContainer,
      finalContainer,
    ].forEach((screen) => {
      screen.classList.toggle("active", screen.id === screenName);
    });
  }

  function createButton(text, onClick, styleClasses = []) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.onclick = onClick;
    btn.className = "scanner-button " + styleClasses.join(" ");
    return btn;
  }

  function setupHelpPanel() {
    const overlay = document.getElementById("help-panel-overlay");
    const panel = document.getElementById("help-panel");
    const openBtn = document.getElementById("how-to-use-btn");
    const closeBtn = document.getElementById("help-panel-close-btn");

    function openPanel() {
      panel.classList.add("visible");
      overlay.classList.add("visible");
    }
    function closePanel() {
      panel.classList.remove("visible");
      overlay.classList.remove("visible");
    }

    openBtn.addEventListener("click", openPanel);
    closeBtn.addEventListener("click", closePanel);
    overlay.addEventListener("click", closePanel);
  }

  function buildHelpPanelContent() {
    const container = document.getElementById("help-panel-content");
    const title = document.getElementById("help-panel-title");
    container.innerHTML = "";
    title.textContent = T("helpTitle");

    const steps = [
      { icon: "fa-camera", text: T("helpStep1") },
      { icon: "fa-eye", text: T("helpStep2") },
      { icon: "fa-edit", text: T("helpStep3") },
      { icon: "fa-check", text: T("helpStep4") },
    ];

    const list = document.createElement("ul");
    steps.forEach((step) => {
      const li = document.createElement("li");
      const icon = document.createElement("i");
      icon.className = `fas ${step.icon} help-icon`;

      const textDiv = document.createElement("div");
      textDiv.innerHTML = step.text;

      li.append(icon, textDiv);
      list.appendChild(li);
    });
    container.appendChild(list);
  }

  function resetForNewCapture() {
    capturedCanvas = null;
    isEditing = false;
    editToolsPanel.classList.remove("visible");
    document.getElementById("preview-canvas-container").innerHTML = "";
    document.getElementById("quality-sliders").innerHTML = "";
    document.getElementById("preview-controls").innerHTML = "";
    document.getElementById("confirmation-canvas-container").innerHTML = "";
    document.getElementById("confirmation-controls").innerHTML = "";
    document.getElementById("final-controls").innerHTML = "";

    showScreen("camera-screen");
    initializeCamera();
  }

  // --- Camera Logic ---
  async function initializeCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: CAPTURE_WIDTH },
          height: { ideal: CAPTURE_HEIGHT },
        },
      });
      handleCameraSuccess(stream);
    } catch (err) {
      showToast(T("camAccessTrying"), "warning");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        handleCameraSuccess(stream);
      } catch (error) {
        showToast(T("camAccessDenied"), "error");
      }
    }
  }

  function handleCameraSuccess(stream) {
    video.srcObject = stream;
    video.play();
    showToast(T("cameraReady"), "success");
  }

  function captureImage() {
    capturedCanvas = document.createElement("canvas");
    capturedCanvas.width = video.videoWidth;
    capturedCanvas.height = video.videoHeight;
    capturedCanvas.getContext("2d").drawImage(video, 0, 0);
    video.srcObject.getTracks().forEach((track) => track.stop());
    showScreen("preview-screen");
    buildPreviewUI(capturedCanvas);

    // Scroll to the controls to make them visible after capture
    setTimeout(() => {
      const controls = document.getElementById("preview-controls");
      if (controls) {
        controls.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100); // Delay to ensure UI is rendered before scrolling
  }

  // --- Preview & Edit Logic ---
  function buildPreviewUI(imageCanvas) {
    const container = document.getElementById("preview-canvas-container");
    const controls = document.getElementById("preview-controls");
    container.innerHTML = "";
    controls.innerHTML = "";

    previewCanvas = document.createElement("canvas");
    previewCtx = previewCanvas.getContext("2d");

    const maxDisplayWidth = Math.min(600, window.innerWidth - 40);
    const aspectRatio = imageCanvas.width / imageCanvas.height;
    previewCanvas.width = imageCanvas.width;
    previewCanvas.height = imageCanvas.height;
    Object.assign(previewCanvas.style, {
      width: `${maxDisplayWidth}px`,
      height: `${maxDisplayWidth / aspectRatio}px`,
      display: "block",
      margin: "0 auto",
      cursor: "default",
    });

    previewCtx.drawImage(imageCanvas, 0, 0);
    container.appendChild(previewCanvas);

    cropRect = {
      x: 0,
      y: 0,
      width: imageCanvas.width,
      height: imageCanvas.height,
    };

    const primaryActions = document.createElement("div");
    primaryActions.className = "primary-actions";
    const uploadBtn = createButton(T("upload"), () => processAndUpload(), [
      "success",
    ]);
    const editBtn = createButton(T("edit"), () => toggleEditMode(true), [
      "primary",
    ]);
    primaryActions.append(editBtn, uploadBtn);

    const secondaryActions = document.createElement("div");
    secondaryActions.className = "secondary-actions";
    const retakeBtn = createButton(T("retake"), () => location.reload(), [
      "danger",
    ]);
    secondaryActions.appendChild(retakeBtn);

    controls.append(secondaryActions, primaryActions);
  }

  function toggleEditMode(enable) {
    isEditing = enable;
    const controls = document.getElementById("preview-controls");
    controls.innerHTML = "";

    if (enable) {
      editToolsPanel.classList.add("visible");
      document
        .getElementById("cropping-edit-instructions")
        .classList.add("visible");
      buildEditTools();
      drawCropOverlay();
      addCroppingEventListeners();

      const saveBtn = createButton(
        T("saveAndUpload"),
        () => buildConfirmationUI(),
        ["success"]
      );

      const secondaryActions = document.createElement("div");
      secondaryActions.className = "secondary-actions";
      const retakeBtn = createButton(T("retake"), () => location.reload(), [
        "danger",
      ]);
      const cancelBtn = createButton(T("cancel"), () => toggleEditMode(false), [
        "warning",
      ]);
      secondaryActions.append(retakeBtn, cancelBtn);

      controls.append(secondaryActions, saveBtn);
    } else {
      editToolsPanel.classList.remove("visible");
      document
        .getElementById("cropping-edit-instructions")
        .classList.remove("visible");
      removeCroppingEventListeners();
      previewCtx.drawImage(capturedCanvas, 0, 0); // Redraw without overlay
      const uploadBtn = createButton(T("upload"), () => processAndUpload(), [
        "success",
      ]);
      const editBtn = createButton(T("edit"), () => toggleEditMode(true), [
        "primary",
      ]);
      controls.append(editBtn, uploadBtn);
    }
  }

  function buildEditTools() {
    const slidersContainer = document.getElementById("quality-sliders");
    slidersContainer.innerHTML = "";

    function createSlider(key, min, max, value) {
      const container = document.createElement("div");
      container.className = "quality-slider-group";
      const label = document.createElement("label");
      label.textContent = T(key);
      label.dataset.key = key; 
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = min;
      slider.max = max;
      slider.value = value;
      container.append(label, slider);
      return [container, slider];
    }

    const [brightnessGroup, brightnessSlider] = createSlider(
      "brightness",
      50,
      150,
      currentFilters.brightness
    );
    const [contrastGroup, contrastSlider] = createSlider(
      "contrast",
      50,
      150,
      currentFilters.contrast
    );

    function createToggle(labelText) {
      const container = document.createElement("div");
      container.className = "quality-toggle-group";
      const label = document.createElement("label");
      label.textContent = labelText;
      const toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.checked = currentFilters.grayscale;
      container.append(label, toggle);
      return [container, toggle];
    }

    const [grayscaleGroup, grayscaleToggle] = createToggle(T("grayscale"));
    grayscaleGroup.querySelector("label").dataset.key = "grayscale"; 

    function updateAll() {
      currentFilters.brightness = brightnessSlider.value;
      currentFilters.contrast = contrastSlider.value;
      currentFilters.grayscale = grayscaleToggle.checked;
      drawCropOverlay(); // Redraw overlay on top
    }

    brightnessSlider.addEventListener("input", updateAll);
    contrastSlider.addEventListener("input", updateAll);
    grayscaleToggle.addEventListener("change", updateAll);

    slidersContainer.append(brightnessGroup, contrastGroup, grayscaleGroup);
  }

  function buildConfirmationUI() {
    showScreen("confirmation-screen");
    const container = document.getElementById("confirmation-canvas-container");
    const controls = document.getElementById("confirmation-controls");
    container.innerHTML = "";
    controls.innerHTML = "";

    finalCanvas = document.createElement("canvas");
    finalCanvas.width = cropRect.width;
    finalCanvas.height = cropRect.height;

    const tempFilteredCanvas = document.createElement("canvas");
    tempFilteredCanvas.width = capturedCanvas.width;
    tempFilteredCanvas.height = capturedCanvas.height;
    applyFilters(
      tempFilteredCanvas.getContext("2d"),
      capturedCanvas,
      currentFilters
    );

    finalCanvas
      .getContext("2d")
      .drawImage(
        tempFilteredCanvas,
        cropRect.x,
        cropRect.y,
        cropRect.width,
        cropRect.height,
        0,
        0,
        cropRect.width,
        cropRect.height
      );

    Object.assign(finalCanvas.style, {
      width: "100%",
      maxWidth: "500px",
      display: "block",
      margin: "10px auto",
      borderRadius: "8px",
      border: "1px solid #ddd",
    });

    container.appendChild(finalCanvas);

    const confirmBtn = createButton(
      T("confirmAndUpload"),
      () => processAndUpload(finalCanvas),
      ["success"]
    );

    const secondaryActions = document.createElement("div");
    secondaryActions.className = "secondary-actions";
    const backBtn = createButton(
      T("goBackAndEdit"),
      () => showScreen("preview-screen"),
      ["primary"]
    );
    secondaryActions.appendChild(backBtn);

    controls.append(secondaryActions, confirmBtn);
  }

  function drawCropOverlay() {
    if (!isEditing) return;

    // Clear canvas before drawing
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    // Save context state before applying filter
    previewCtx.save();

    // Apply filters and draw the image
    let filterString = "";
    if (currentFilters.brightness)
      filterString += `brightness(${currentFilters.brightness}%) `;
    if (currentFilters.contrast)
      filterString += `contrast(${currentFilters.contrast}%) `;
    if (currentFilters.grayscale) filterString += `grayscale(100%) `;
    previewCtx.filter = filterString.trim();

    previewCtx.drawImage(capturedCanvas, 0, 0);

    // Restore context to remove filter for subsequent drawings
    previewCtx.restore();

    // Draw the cropping UI on top of the filtered image
    previewCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
    const { x, y, width, height } = cropRect;
    previewCtx.fillRect(0, 0, previewCanvas.width, y);
    previewCtx.fillRect(
      0,
      y + height,
      previewCanvas.width,
      previewCanvas.height - (y + height)
    );
    previewCtx.fillRect(0, y, x, height);
    previewCtx.fillRect(
      x + width,
      y,
      previewCanvas.width - (x + width),
      height
    );
    previewCtx.strokeStyle = "#007bff";
    previewCtx.lineWidth = 5; // Increased line width
    previewCtx.strokeRect(x, y, width, height);
    previewCtx.fillStyle = "#007bff";
    const handleSize = 28; // Increased handle size
    const halfHandle = handleSize / 2;
    const handles = [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: x, y: y + height },
      { x: x + width, y: y + height },
    ];
    handles.forEach((handle) =>
      previewCtx.fillRect(
        handle.x - halfHandle,
        handle.y - halfHandle,
        handleSize,
        handleSize
      )
    );
  }

  let activeHandle = null;
  function addCroppingEventListeners() {
    previewCanvas.addEventListener("mousedown", onInteractionStart);
    previewCanvas.addEventListener("touchstart", onInteractionStart, {
      passive: false,
    });
    previewCanvas.addEventListener("mousemove", onMouseMove);
  }
  function removeCroppingEventListeners() {
    previewCanvas.removeEventListener("mousedown", onInteractionStart);
    previewCanvas.removeEventListener("touchstart", onInteractionStart);
    previewCanvas.removeEventListener("mousemove", onMouseMove);
  }

  function onMouseMove(e) {
    if (activeHandle || !isEditing) return;
    const pos = getEventPos(e);
    const handle = getHandleUnderMouse(pos);
    const cursorMap = {
      tl: "nwse-resize",
      tr: "nesw-resize",
      bl: "nesw-resize",
      br: "nwse-resize",
      move: "move",
    };
    previewCanvas.style.cursor = cursorMap[handle] || "default";
  }

  function getHandleUnderMouse(pos) {
    const { x, y, width, height } = cropRect;
    const handleSize = 32; // Increased touch/click area
    const halfHandle = handleSize / 2;
    if (
      pos.x > x + width - halfHandle &&
      pos.x < x + width + halfHandle &&
      pos.y > y + height - halfHandle &&
      pos.y < y + height + halfHandle
    )
      return "br";
    if (
      pos.x > x - halfHandle &&
      pos.x < x + halfHandle &&
      pos.y > y + height - halfHandle &&
      pos.y < y + height + halfHandle
    )
      return "bl";
    if (
      pos.x > x + width - halfHandle &&
      pos.x < x + width + halfHandle &&
      pos.y > y - halfHandle &&
      pos.y < y + halfHandle
    )
      return "tr";
    if (
      pos.x > x - halfHandle &&
      pos.x < x + halfHandle &&
      pos.y > y - halfHandle &&
      pos.y < y + halfHandle
    )
      return "tl";
    if (pos.x > x && pos.x < x + width && pos.y > y && pos.y < y + height)
      return "move";
    return null;
  }

  function getEventPos(e) {
    const rect = previewCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    scaleX = previewCanvas.width / rect.width;
    scaleY = previewCanvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function onInteractionStart(e) {
    if (!isEditing) return;
    const pos = getEventPos(e);
    activeHandle = getHandleUnderMouse(pos);
    if (activeHandle) {
      e.preventDefault();
      const { x, y, width, height } = cropRect;
      const startX = pos.x,
        startY = pos.y;
      const startRectX = x,
        startRectY = y,
        startWidth = width,
        startHeight = height;

      const onInteractionMove = (e) => {
        const pos = getEventPos(e);
        const dx = pos.x - startX,
          dy = pos.y - startY;
        switch (activeHandle) {
          case "tl":
            cropRect.x = Math.min(
              startRectX + dx,
              startRectX + startWidth - 20
            );
            cropRect.y = Math.min(
              startRectY + dy,
              startRectY + startHeight - 20
            );
            cropRect.width = Math.max(
              20,
              startWidth - (cropRect.x - startRectX)
            );
            cropRect.height = Math.max(
              20,
              startHeight - (cropRect.y - startRectY)
            );
            break;
          case "tr":
            cropRect.y = Math.min(
              startRectY + dy,
              startRectY + startHeight - 20
            );
            cropRect.width = Math.max(20, startWidth + dx);
            cropRect.height = Math.max(
              20,
              startHeight - (cropRect.y - startRectY)
            );
            break;
          case "bl":
            cropRect.x = Math.min(
              startRectX + dx,
              startRectX + startWidth - 20
            );
            cropRect.width = Math.max(
              20,
              startWidth - (cropRect.x - startRectX)
            );
            cropRect.height = Math.max(20, startHeight + dy);
            break;
          case "br":
            cropRect.width = Math.max(20, startWidth + dx);
            cropRect.height = Math.max(20, startHeight + dy);
            break;
          case "move":
            cropRect.x = startRectX + dx;
            cropRect.y = startRectY + dy;
            break;
        }
        drawCropOverlay();
      };

      const onInteractionEnd = () => {
        activeHandle = null;
        document.removeEventListener("mousemove", onInteractionMove);
        document.removeEventListener("touchmove", onInteractionMove);
        document.removeEventListener("mouseup", onInteractionEnd);
        document.removeEventListener("touchend", onInteractionEnd);
      };

      document.addEventListener("mousemove", onInteractionMove);
      document.addEventListener("touchmove", onInteractionMove, {
        passive: false,
      });
      document.addEventListener("mouseup", onInteractionEnd);
      document.addEventListener("touchend", onInteractionEnd);
    }
  }

  // --- Upload Logic ---
  function processAndUpload(finalImageCanvas) {
    const attenderId = getQueryParam("attender_id");
    if (!attenderId) {
      showToast(T("attenderIdMissing"), "error");
      return;
    }

    if (!finalImageCanvas) {
      // If coming from direct upload, generate the canvas now
      finalImageCanvas = document.createElement("canvas");
      finalImageCanvas.width = capturedCanvas.width;
      finalImageCanvas.height = capturedCanvas.height;
      finalImageCanvas.getContext("2d").drawImage(capturedCanvas, 0, 0);
    }

    finalImageCanvas.toBlob(
      (blob) => {
        if (!blob) {
          showToast(T("fileCreationError"), "error");
          return;
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `scan-${attenderId}-${timestamp}.jpg`;
        const imageFile = new File([blob], fileName, { type: "image/jpeg" });

        showToast(T("uploading"), "info");
        uploadFileForQuestion(attenderId, { file: imageFile })
          .then(() => {
            const examId = getQueryParam("examid"),
              studentId = getQueryParam("attender_id"),
              questionId = getQueryParam("qid");
            if (!examId || !studentId || !questionId) {
              showToast(T("missingIds"), "error");
              return;
            }
            const filePath = `${CONFIG.BUCKET}/${CONFIG.FOLDERNAME}/${attenderId}/${fileName}`;
            const payload = {
              capturedResponses: [{ meta: { name: fileName }, url: filePath }],
            };
            makeApiCall({
              url: `${STUDENT_END_POINT}/captured-response?examId=${examId}&studentId=${studentId}&questionId=${questionId}`,
              method: "POST",
              data: JSON.stringify(payload),
              isApiKey: true,
              successCallback: () => {
                showToast(T("uploadSuccess"), "success");
                showScreen("final-screen");
                const controls = document.getElementById("final-controls");
                controls.innerHTML = "";
                const anotherBtn = createButton(
                  T("uploadAnother"),
                  resetForNewCapture,
                  ["primary"]
                );
                const isApp = getQueryParam("a");
                const finishBtn = createButton(
                  T("finish"),
                  () => {
                    if (isApp === "1") {
                      // If not in app mode, close the iframe by messaging the parent
                      window.parent.postMessage("closeIframe", "*");
                    } else {
                      window.location.href = "qr-scanner.html";
                    }
                  },
                  ["success"]
                );
                controls.appendChild(finishBtn);
                controls.append(anotherBtn);
              },
              errorCallback: (error) =>
                showToast(`${T("saveFailed")} ${error}`, "error"),
            });
          })
          .catch((error) =>
            showToast(`${T("uploadFailed")} ${error}`, "error")
          );
      },
      "image/jpeg",
      0.92
    );
  }

  function applyFilters(targetCtx, sourceCanvas, filters) {
    let filterString = "";
    if (filters.brightness)
      filterString += `brightness(${filters.brightness}%) `;
    if (filters.contrast) filterString += `contrast(${filters.contrast}%) `;
    if (filters.grayscale) filterString += `grayscale(100%) `;
    targetCtx.filter = filterString.trim();
    targetCtx.drawImage(
      sourceCanvas,
      0,
      0,
      sourceCanvas.width,
      sourceCanvas.height
    );
  }

  // --- Utility Functions ---
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.textContent = message;
    Object.assign(toast.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "10px 20px",
      borderRadius: "20px",
      color: "white",
      zIndex: 200,
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
    });
    const colors = { success: "#28a745", error: "#dc3545", warning: "#ffc107" };
    toast.style.backgroundColor = colors[type] || "#007bff";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // --- Start ---
  setupUI();
  setupHelpPanel();
  showScreen("camera-screen");
  initializeCamera();
}

// --- Wait for the DOM to be fully loaded before initializing the scanner ---
document.addEventListener("DOMContentLoaded", initializeScanner);
