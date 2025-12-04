const isAdmin = true;
let certUrl;
let blobArray = [];
let timestamp = Date.now();
let cleanedObjects;
let Blobfile;
let zoom = 1;
let gridVisible = false;
let currentOrientation = "landscape";
const stateStack = [];
let snapToGrid = true;
const gridSize = 20;
let stateIndex = -1;
let isRestoring = false;
let isDragging = false;
let lastX = 0;
let lastY = 0;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 1.45;
let isDragOperation = false;
let isPanning = false;
let lastPanPosition = { x: 0, y: 0 };
let canvasOffset = { x: 0, y: 0 };
let zoomLevel = 1;
const ZOOM_SPEED = 0.2;
let isCurrentlyDragging = false;
let spaceKeyPressed = false;
let pageBorder = null;
let clipboardObject = null;
const urlParams = new URLSearchParams(window.location.search);
const certId = urlParams.get("id");
const attenderId = urlParams.get("attenderId");
let certificates;
let imageCounter = 1;
const miniMapCanvas = $("#miniMapCanvas")[0];
const miniMapCtx = miniMapCanvas.getContext("2d");
const miniMapViewport = $(".mini-map-viewport");
const zoomInBtn = $("#zoomInBtn");
const zoomOutBtn = $("#zoomOutBtn");
const resetZoomBtn = $("#resetZoomBtn");
const zoomDisplayElement = $("#zoomDisplay");
const canvasWrapper = $(".canvas-wrapper");
const zoomDisplay = $(".zoom-display");
let accountId;

const borderImages = [
  "../../fullscreenexam/certificate-editor/borders/border1.jpg",
  "../../fullscreenexam/certificate-editor/borders/border7.jpg",
  "../../fullscreenexam/certificate-editor/borders/border3.png",
];

const EditorUIfunctions = {
  preview() {
    const originalZoom = canvas.getZoom();
    const originalVpt = [...canvas.viewportTransform];

    // Reset zoom/transform
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.setZoom(1);
    canvas.renderAll();

    try {
      const dataURL = canvas.toDataURL({ format: "jpg", quality: 1 });
      const orientation = currentOrientation || "landscape";

      // Open preview window
      const previewUrl = new URL(
        "../fullscreenexam/certificate-editor/preview.html",
        window.location.origin
      );
      const previewWindow = window.open(previewUrl.toString(), "_blank");

      // Use postMessage once window is ready
      const interval = setInterval(() => {
        if (previewWindow && previewWindow.postMessage) {
          previewWindow.postMessage(
            { certificateImage: dataURL, orientation },
            "*"
          );
          clearInterval(interval);
        }
      }, 100); // retry until the new window is ready
    } catch (error) {
      alert(
        "Preview failed due to cross-origin image. Make sure all images are signed and CORS-enabled."
      );
      console.error("Preview Error:", error);
    }

    // Restore zoom
    canvas.setViewportTransform(originalVpt);
    canvas.setZoom(originalZoom);
    canvas.renderAll();
  },

  syncCanvasBackgroundUI() {
    const bg = canvas.backgroundColor;
    const bgImg = canvas.backgroundImage;

    // ✅ Sync solid background color
    if (typeof bg === "string") {
      $("#bgColorPicker").val(bg);
      $("#gradientType").val("");
      $("#gradientColor1").val("#ff0000");
      $("#gradientColor2").val("#0000ff");
    }

    // ✅ Sync background gradient
    if (bg?.type === "linear" || bg?.type === "radial") {
      $("#gradientType").val(bg.type);
      $("#gradientColor1").val(bg.colorStops[0]?.color || "#ff0000");
      $("#gradientColor2").val(bg.colorStops[1]?.color || "#0000ff");
    }

    // ✅ Sync background image
    if (bgImg && bgImg.src) {
      $("#bgPreview").attr("src", bgImg.src).show();
      $("#uploadBtn").hide();
    } else {
      $("#bgPreview").hide().attr("src", "");
      $("#uploadBtn").show();
    }
  },

  handleObjectSelection(e) {
    const obj = e.target;
    // Hide all property panels initially
    $(".panel-section").addClass("d-none");
    $(".dynamic-placeholders-section").removeClass("d-none");

    if (obj) {
      if (obj.type === "textbox" || obj.type === "i-text") {
        $(".text-properties-panel").removeClass("d-none");
        EditorUIfunctions.updateMiniMap();

        // 🟢 Sync UI controls with selected text object
        $("#fontSizeInput").val(obj.fontSize || 20);
        $("#fontColorPicker").val(obj.fill || "#000000");
        $("#textBgColorPicker").val(obj.backgroundColor || "#ffffff");
        $("#fontFamilySelect").val(obj.fontFamily || "Arial");

        $("#strokeWidth").val(obj.strokeWidth || 0);
        $("#textShadowColorPicker").val(obj.shadow?.color || "#000000");
        $("#textStrokeColorPicker").val(obj.stroke || "#000000");
        $("#letterSpacingInput").val(
          obj.charSpacing ? obj.charSpacing / 100 : 0
        );
        $("#lineHeightInput").val(obj.lineHeight || 1.2);
        $("#textShadowInput").val(obj.shadow?.blur || 0);
      } else if (
        [
          "rect",
          "circle",
          "triangle",
          "polygon",
          "line",
          "path",
          "image",
        ].includes(obj.type)
      ) {
        $(".shape-properties-panel").removeClass("d-none");
        EditorUIfunctions.updateMiniMap();

        // 🟢 Sync shape controls
        $("#shapeStrokeColor").val(obj.stroke || "#000000");
        $("#shapeStrokeWidth").val(obj.strokeWidth || 1);
        $("#shapeFillColor").val(obj.fill || "#000000");
      }
    }
  },

  handleObjectDeselection() {
    // Hide all property panels
    $(".panel-section").addClass("d-none");
    // Show dynamic placeholders section when nothing is selected
    $(".dynamic-placeholders-section").removeClass("d-none");
    EditorUIfunctions.updateMiniMap();
  },

  uploadBgImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (f) {
      const imgURL = f.target.result;

      // Show preview
      const preview = $("#bgPreview");
      const previewWrapper = $("#bgPreviewWrapper");
      preview.attr("src", imgURL);
      previewWrapper.removeClass("d-none");

      // Set as Fabric background
      fabric.Image.fromURL(
        imgURL,
        function (img) {
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
            scaleX: canvas.width / img.width,
            scaleY: canvas.height / img.height,
          });
        },
        { crossOrigin: "anonymous" }
      );
    };
    reader.readAsDataURL(file);
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  applyGradient() {
    const type = $("#gradientType").val();
    const color1 = $("#gradientColor1").val();
    const color2 = $("#gradientColor2").val();

    if (!type || !color1 || !color2) return;

    const gradient = new fabric.Gradient({
      type: type === "linear" ? "linear" : "radial",
      gradientUnits: "pixels",
      coords:
        type === "linear"
          ? { x1: 0, y1: 0, x2: canvas.width, y2: canvas.height }
          : {
              x1: canvas.width / 2,
              y1: canvas.height / 2,
              r1: 0,
              x2: canvas.width / 2,
              y2: canvas.height / 2,
              r2: Math.max(canvas.width, canvas.height) / 2,
            },
      colorStops: [
        { offset: 0, color: color1 },
        { offset: 1, color: color2 },
      ],
    });

    canvas.setBackgroundColor(gradient, canvas.renderAll.bind(canvas));
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  }, // Reset view

  resetView() {
    currentZoom = 1;
    centerCanvas();
    EditorUIfunctions.updateZoomDisplay();
  },
  updateZoomDisplay() {
    if (zoomDisplayElement) {
      const zoomPercent = Math.round(zoom * 100);
      zoomDisplayElement.text(`${zoomPercent}%`);
    }
  },
  updateZoomDisplay1() {
    if (zoomDisplayElement) {
      const zoomPercent = Math.round(1 * 100);
      zoomDisplayElement.text(`${zoomPercent}%`);
    }
  },
  cloneObject() {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    obj.clone((cloned) => {
      cloned.set({ left: obj.left + 20, top: obj.top + 20 });
      canvas.add(cloned);
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    });
  },

  deleteSelected() {
    canvas.getActiveObjects().forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject().requestRenderAll();
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },
  // Prevents keyboard shortcuts while typing
  isTypingInInput() {
    const $el = $(document.activeElement);
    return (
      $el.length &&
      ($el.is("input") ||
        $el.is("textarea") ||
        $el.prop("contentEditable") === "true")
    );
  },
  copy() {
    const active = canvas.getActiveObject();
    if (!active) return;

    active.clone(function (cloned) {
      clipboardObject = cloned;
    });
  },

  cut() {
    const active = canvas.getActiveObject();
    if (!active) return;

    active.clone(function (cloned) {
      clipboardObject = cloned;
      canvas.remove(active);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      EditorUIfunctions.saveState();
    });
  },

  paste() {
    if (!clipboardObject) return;

    clipboardObject.clone(function (clonedObj) {
      clonedObj.set({
        left: clonedObj.left + 20,
        top: clonedObj.top + 20,
        evented: true,
      });
      canvas.add(clonedObj);
      canvas.setActiveObject(clonedObj);
      canvas.requestRenderAll();
      EditorUIfunctions.saveState();
    });
  },
  // Duplicate function
  duplicateSelected() {
    const activeObject = canvas.getActiveObject();

    if (activeObject) {
      activeObject.clone(function (clone) {
        canvas.discardActiveObject();

        clone.set({
          left: activeObject.left + 20,
          top: activeObject.top + 20,
          evented: true,
        });

        canvas.add(clone);
        canvas.setActiveObject(clone);
        canvas.requestRenderAll();
        EditorUIfunctions.updateMiniMap();
        EditorUIfunctions.saveState();
      });
    }
  },
  generateQRCode(attenderId) {
    const url =
      window.location.origin +
      `/index.html?&attenderId=${encodeURIComponent(
        attenderId ? attenderId : ""
      )}`;

    // Create a temporary QR container off-screen
    const tempContainer = $("<div></div>");
    tempContainer.css({
      position: "absolute",
      left: "-9999px",
    });
    $("body").append(tempContainer);

    const qr = new QRCode(tempContainer[0], {
      // Pass native DOM element
      text: url,
      width: 150,
      height: 150,
      correctLevel: QRCode.CorrectLevel.H,
    });

    // Wait a moment for QR to render
    setTimeout(() => {
      const img = tempContainer.find("img")[0];
      if (img) {
        fabric.Image.fromURL(
          img.src,
          function (image) {
            image.set({
              left: 100,
              top: 100,
              hasControls: true,
              selectable: true,
              lockScalingX: false,
              lockScalingY: false,
            });
            canvas.add(image).setActiveObject(image);
            canvas.requestRenderAll();
          },
          { crossOrigin: "anonymous" }
        );
      }
      // Clean up
      tempContainer.remove();
    }, 300);
    EditorUIfunctions.saveState();
  },
  changeFontFamily() {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === "textbox") {
      obj.set("fontFamily", $("#fontFamilySelect").val());
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },
  addText() {
    const text = new fabric.Textbox("Start here", {
      left: 400,
      top: 100,
      fontSize: 15,
      fill: "#000",
      fontFamily: "Arial",
    });
    canvas.add(text).setActiveObject(text);
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },
  toggleBold() {
    const obj = canvas.getActiveObject();
    if (obj?.type === "textbox") {
      obj.set("fontWeight", obj.fontWeight === "bold" ? "normal" : "bold");
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  toggleItalic() {
    const obj = canvas.getActiveObject();
    if (obj?.type === "textbox") {
      obj.set("fontStyle", obj.fontStyle === "italic" ? "normal" : "italic");
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  toggleUnderline() {
    const obj = canvas.getActiveObject();
    if (obj?.type === "textbox") {
      obj.set("underline", !obj.underline);
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  changeFontSize() {
    const obj = canvas.getActiveObject();
    const size = parseInt($("#fontSizeInput").val(), 10);
    if (obj?.type === "textbox") {
      obj.set("fontSize", size);
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  changeFontColor() {
    const obj = canvas.getActiveObject();
    const color = $("#fontColorPicker").val();
    if (obj?.type === "textbox") {
      obj.set("fill", color); // sets font color
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  setTextBgColor(color) {
    const obj = canvas.getActiveObject();
    if (obj?.type === "textbox") {
      obj.set("backgroundColor", color); // sets background color
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  bringForward() {
    const obj = canvas.getActiveObject();
    if (obj) canvas.bringForward(obj);
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  sendBackward() {
    const obj = canvas.getActiveObject();
    if (obj) canvas.sendBackwards(obj);
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  flipX() {
    const obj = canvas.getActiveObject();
    if (obj) obj.set("flipX", !obj.flipX);
    canvas.requestRenderAll();
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  flipY() {
    const obj = canvas.getActiveObject();
    if (obj) obj.set("flipY", !obj.flipY);
    canvas.requestRenderAll();
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  lockUnlock() {
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    const toggleLock = (obj) => {
      const isLocked = obj.lockMovementX && obj.lockMovementY;
      obj.set({
        lockMovementX: !isLocked,
        lockMovementY: !isLocked,
      });
    };

    if (activeObj.type === "activeSelection") {
      // Multiple selected objects
      activeObj._objects.forEach(toggleLock);
    } else if (activeObj.type === "group") {
      // A grouped object
      activeObj._objects.forEach(toggleLock);
    } else {
      // Single object
      toggleLock(activeObj);
    }

    canvas.requestRenderAll();
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  alignText(align) {
    const obj = canvas.getActiveObject();
    if (obj?.type === "textbox") {
      obj.set("textAlign", align);
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  centerObject() {
    const obj = canvas.getActiveObject();
    if (obj) {
      obj.viewportCenter();
      obj.setCoords();
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  toggleOpacity() {
    const obj = canvas.getActiveObject();
    if (obj) {
      obj.set("opacity", obj.opacity === 1 ? 0.5 : 1);
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  textToCapitalize() {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === "textbox") {
      const capitalized = obj.text.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
      });
      obj.set("text", capitalized);
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  clearCanvas() {
    // Remove any existing modal if present
    $("#clearCanvasModal").remove();

    // Create the modal HTML
    const modalHTML = `
          <div class="modal fade" id="clearCanvasModal" tabindex="-1" aria-labelledby="clearCanvasLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content">
                <div class="modal-header bg-danger text-white">
                  <h5 class="modal-title" id="clearCanvasLabel">Confirm Clear Canvas</h5>
                  <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  Do you really want to clear the canvas?
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                  <button type="button" class="btn btn-danger" id="confirmClearCanvasBtn">Yes, Clear</button>
                </div>
              </div>
            </div>
          </div>
        `;

    // Append modal to body
    $("body").append(modalHTML);

    // Show the modal
    const modal = new bootstrap.Modal($("#clearCanvasModal"));
    modal.show();

    // Handle confirm click
    $("#confirmClearCanvasBtn")
      .off("click")
      .on("click", function () {
        // Clear canvas and reset background color
        canvas.clear();
        canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));

        // Clear local storage
        localStorage.removeItem("canvasJSON");
        // Close modal
        modal.hide();

        // Optional toast
        displayToast("Canvas cleared successfully", "success");
      });
  },
  clearBgColor() {
    canvas.setBackgroundColor(null, canvas.renderAll.bind(canvas));
    $("#bgColorPicker").val("#ffffff"); // ✅ correct syntax
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },
  clearBgImage() {
    canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));

    $("#bgPreview").hide().attr("src", "");
    $("#uploadBtn").show();
    $("#bgUpload").val("");
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  clearBgGradient() {
    // Clear the gradient by setting background color to null
    canvas.setBackgroundColor(null, canvas.renderAll.bind(canvas));
    $("#gradientType").val("");
    $("#gradientColor1").val("#ff0000");
    $("#gradientColor2").val("#0000ff");
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  toggleGrid() {
    gridVisible = !gridVisible;
    const step = 50;
    if (gridVisible) {
      for (let i = 0; i < canvas.width; i += step) {
        canvas.add(
          new fabric.Line([i, 0, i, canvas.height], {
            stroke: "#fbdcac",
            selectable: false,
          })
        );
      }
      for (let i = 0; i < canvas.height; i += step) {
        canvas.add(
          new fabric.Line([0, i, canvas.width, i], {
            stroke: "#fbdcac",
            selectable: false,
          })
        );
      }
    } else {
      canvas.getObjects("line").forEach((line) => canvas.remove(line));
    }
    canvas.requestRenderAll();
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  toggleShadow() {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    obj.set("shadow", obj.shadow ? null : "2px 2px 5px rgba(0,0,0,0.5)");
    canvas.requestRenderAll();
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  changeShadowColor(color) {
    const obj = canvas.getActiveObject();
    if (obj) {
      obj.set(
        "shadow",
        new fabric.Shadow({ color, blur: 5, offsetX: 2, offsetY: 2 })
      );
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },
  changeStrokeWidth() {
    const obj = canvas.getActiveObject();
    const w = parseFloat($("#strokeWidth").val());
    if (obj) {
      obj.set("strokeWidth", w);
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  changeStrokeColor(color) {
    const obj = canvas.getActiveObject();
    if (obj) {
      obj.set("stroke", color);
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  setOpacity(value) {
    const obj = canvas.getActiveObject();
    if (obj && !isNaN(value)) {
      obj.set("opacity", parseFloat(value));
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap?.();
      EditorUIfunctions.saveState?.();
    }
  },

  rotateCW() {
    const obj = canvas.getActiveObject();
    if (obj) {
      obj.rotate(obj.angle + 15).setCoords();
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  rotateCCW() {
    const obj = canvas.getActiveObject();
    if (obj) {
      obj.rotate(obj.angle - 15).setCoords();
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  setPortrait() {
    currentOrientation = "portrait";
    EditorUIfunctions.resizeCanvas(500, 600); // A4 Portrait
  },

  setLandscape() {
    currentOrientation = "landscape";
    EditorUIfunctions.resizeCanvas(1000, 600); // A4 Landscape
  },

  resizeCanvas(width, height) {
    const htmlCanvas = $("#canvas")[0]; // native DOM element
    htmlCanvas.width = width;
    htmlCanvas.height = height;

    canvas.setWidth(width);
    canvas.setHeight(height);
    canvas.setZoom(1);

    // Fit inside parent while keeping ratio
    htmlCanvas.style.width = "100%";
    htmlCanvas.style.height = "auto";

    canvas.renderAll();
  },

  addBgText() {
    const text = new fabric.Textbox("Background Text", {
      left: 300,
      top: 100,
      fontSize: 40,
      fill: "#ccc",
      fontWeight: "bold",
      selectable: true,
      evented: false,
    });
    canvas.add(text);
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  textToUpper() {
    const obj = canvas.getActiveObject();
    if (obj?.type === "textbox") {
      obj.set("text", obj.text.toUpperCase());
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  textToLower() {
    const obj = canvas.getActiveObject();
    if (obj?.type === "textbox") {
      obj.set("text", obj.text.toLowerCase());
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  setCanvasSize() {
    const width = prompt("Enter canvas width:", canvas.width);
    const height = prompt("Enter canvas height:", canvas.height);
    if (width && height) {
      canvas.setWidth(parseInt(width));
      canvas.setHeight(parseInt(height));
      canvas.renderAll();
    }
  },

  loadClone() {
    if (savedClone) {
      savedClone.clone((clone) => {
        clone.set({ left: 100, top: 100 });
        canvas.add(clone).setActiveObject(clone);
      });
    }
  },

  setAngle() {
    const angle = parseFloat($("#angleInput").val());
    const obj = canvas.getActiveObject();
    if (obj) {
      obj.rotate(angle).setCoords();
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  alignTop() {
    const obj = canvas.getActiveObject();
    if (obj) {
      obj.set({ top: 0 });
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  alignBottom() {
    const obj = canvas.getActiveObject();
    if (obj) {
      obj.set({ top: canvas.height - obj.height });
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  alignLeft() {
    const obj = canvas.getActiveObject();
    if (obj) {
      obj.set({ left: 0 });
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  alignRight() {
    const obj = canvas.getActiveObject();
    if (obj) {
      obj.set({ left: canvas.width - obj.width });
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },
  // setLetterSpacing(obj, spacing) {
  //     obj.charSpacing = spacing * 50; // 10 = 1px
  //     canvas.renderAll();
  // }
  setLetterSpacing(obj, spacing) {
    if (obj && obj.type === "textbox") {
      obj.set("charSpacing", spacing);
      canvas.renderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },
  // === 7. Line Height ===
  setLineHeight(obj, height) {
    // Add this check to ensure 'obj' is not undefined or null, and is a text object
    if (obj && (obj.type === "textbox" || obj.type === "i-text")) {
      obj.set("lineHeight", height); // Use obj.set() as it's generally recommended for Fabric.js properties
      canvas.renderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  setTextShadow(obj, shadowOptions) {
    // Add this check to ensure 'obj' is not undefined or null, and is a text object
    if (obj && (obj.type === "textbox" || obj.type === "i-text")) {
      obj.set("shadow", shadowOptions);
      canvas.renderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },

  // === 9. Inline Styling ===
  applyInlineStyle(obj, start, end, style) {
    for (let i = start; i < end; i++) {
      obj.setSelectionStyles(style, i, i + 1);
    }
    canvas.renderAll();
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  // === 11. Blur Effect ===
  applyBlur(obj, value) {
    obj.filters.push(new fabric.Image.filters.Blur({ blur: value }));
    obj.applyFilters();
    canvas.renderAll();
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  // === 12. Gradient Fill ===
  setGradientFill(obj) {
    const gradient = new fabric.Gradient({
      type: "linear",
      gradientUnits: "pixels",
      coords: { x1: 0, y1: 0, x2: obj.width, y2: 0 },
      colorStops: [
        { offset: 0, color: "red" },
        { offset: 1, color: "blue" },
      ],
    });
    obj.set("fill", gradient);
    canvas.renderAll();
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  // === 13. Pattern Fill ===
  setPatternFill(obj, imgUrl) {
    fabric.Image.fromURL(imgUrl, function (img) {
      obj.set(
        "fill",
        new fabric.Pattern({ source: img.getElement(), repeat: "repeat" })
      );
      canvas.renderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    });
  },
  // === 14. Page Border ===
  addOrUpdatePageBorder() {
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    const inset = 20;
    const strokeW = parseInt($("#shapeStrokeWidth").val()) || 2;
    const strokeColor = $("#shapeStrokeColor").val() || "#000";
    const halfStroke = strokeW / 2;

    const borderProps = {
      left: inset + halfStroke,
      top: inset + halfStroke,
      width: canvasWidth - 2 * inset - strokeW,
      height: canvasHeight - 2 * inset - strokeW,
      stroke: strokeColor,
      strokeWidth: strokeW,
      fill: "transparent", // ✅ transparent
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
      hoverCursor: "default",
      objectCaching: false,
      transparentCorners: false,
      perPixelTargetFind: true, // ✅ key to fix false click detection
    };

    if (pageBorder) {
      canvas.remove(pageBorder);
    }

    pageBorder = new fabric.Rect({
      ...borderProps,
      id: "page-border",
    });

    // ✅ Move to back after being selected so it doesn't block other selections
    pageBorder.on("selected", function () {
      canvas.sendToBack(pageBorder);
    });

    canvas.add(pageBorder);
    canvas.sendToBack(pageBorder);

    EditorUIfunctions.saveState();
    canvas.requestRenderAll();
    EditorUIfunctions.updateMiniMap();
  },
  // === 15. Text Stroke ===
  setTextStroke(obj, color, width) {
    obj.stroke = color;
    obj.strokeWidth = width;
    canvas.renderAll();
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },
  // 🔁 Undo/Redo
  saveState() {
    if (isRestoring) return; // Don't record state during undo/redo

    if (stateIndex < stateStack.length - 1) {
      stateStack.splice(stateIndex + 1); // Remove future states
    }

    stateStack.push(JSON.stringify(canvas));
    stateIndex++;
  },
  undo() {
    if (stateIndex > 0) {
      isRestoring = true;
      canvas.loadFromJSON(stateStack[--stateIndex], () => {
        canvas.renderAll();
        isRestoring = false;
      });
    }
  },

  redo() {
    if (stateIndex < stateStack.length - 1) {
      isRestoring = true;
      canvas.loadFromJSON(stateStack[++stateIndex], () => {
        canvas.renderAll();
        isRestoring = false;
      });
    }
  },
  lockSelected(type) {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    obj[`lock${type}`] = !obj[`lock${type}`];
    canvas.renderAll();
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },
  groupSelected() {
    const activeObjects = canvas.getActiveObjects();

    if (activeObjects.length > 1) {
      // Clone the array because grouping mutates the selection
      const objectsToGroup = activeObjects.slice();

      // Deselect all first
      canvas.discardActiveObject();

      // Remove all selected objects from canvas
      objectsToGroup.forEach((obj) => canvas.remove(obj));

      // Create group from the selected objects
      const group = new fabric.Group(objectsToGroup);

      // Add group to canvas and set it active
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      EditorUIfunctions.updateMiniMap();
      EditorUIfunctions.saveState();
    }
  },
  ungroupSelected() {
    const activeObject = canvas.getActiveObject();

    if (!activeObject || activeObject.type !== "group") return;
    const items = activeObject._objects;
    activeObject._restoreObjectsState();
    canvas.remove(activeObject);

    items.forEach((obj) => {
      obj.setCoords(); // ensure bounding box is accurate
      canvas.add(obj);
    });

    // Optionally reselect all ungrouped items
    const selection = new fabric.ActiveSelection(items, { canvas });
    canvas.setActiveObject(selection);

    canvas.requestRenderAll();

    EditorUIfunctions.saveState();
    EditorUIfunctions.updateMiniMap();
  },
  handleDrop(e) {
    if (!e.originalEvent.dataTransfer) return;

    const data = e.originalEvent.dataTransfer.getData("text/plain");
    if (!data || canvas.getObjects().some((obj) => obj.placeholderKey === data))
      return; // Avoid duplicate

    const pointer = canvas.getPointer(e.e);
    const text = new fabric.Textbox(`{{${data}}}`, {
      left: pointer.x,
      top: pointer.y,
      fontSize: 18,
      fill: "#000",
      placeholderKey: data, // for checking later
    });

    canvas.add(text).setActiveObject(text);
    canvas.requestRenderAll();
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },
  getDefaultShapeStyle() {
    return {
      fill: "transparent",
      stroke: "#000000",
      strokeWidth: 2,
      borderColor: "#228be6",
      cornerColor: "#228be6",
      cornerSize: 8,
      transparentCorners: false,
      cornerStyle: "circle",
    };
  },

  // Utility to read color from picker
  getShapeFillColor() {
    return $("#shapeFillColor")?.val();
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },
  getShapeStrokeColor() {
    return $("#shapeStrokeColor").val() || "#FF0000";
  },

  getShapeStrokeWidth() {
    return $("#shapeStrokeWidth").val() || 2;
  },

  // Add shape   ,s — default fill is gray
  addRectangle() {
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 60,

      ...EditorUIfunctions.getDefaultShapeStyle(),
    });
    canvas.add(rect).setActiveObject(rect);
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  addCircle() {
    const circle = new fabric.Circle({
      left: 120,
      top: 120,
      radius: 20,
      ...EditorUIfunctions.getDefaultShapeStyle(),
    });
    canvas.add(circle).setActiveObject(circle);
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  addTriangle() {
    const triangle = new fabric.Triangle({
      left: 140,
      top: 140,
      width: 80,
      height: 80,
      ...EditorUIfunctions.getDefaultShapeStyle(),
    });
    canvas.add(triangle).setActiveObject(triangle);
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  addPolygon() {
    const polygon = new fabric.Polygon(
      [
        { x: 30, y: 0 },
        { x: 60, y: 30 },
        { x: 60, y: 60 },
        { x: 0, y: 60 },
        { x: 0, y: 30 },
      ],
      {
        left: 160,
        top: 160,
        ...EditorUIfunctions.getDefaultShapeStyle(),
      }
    );
    canvas.add(polygon).setActiveObject(polygon);
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  addLine() {
    const line = new fabric.Line([50, 100, 200, 100], {
      left: 100,
      top: 100, // Use stroke, not fill
      ...EditorUIfunctions.getDefaultShapeStyle(),
    });
    canvas.add(line).setActiveObject(line);
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },
  updateColorPicker(e) {
    const obj = e.selected[0];
    if (!obj) return;

    const color = obj.fill || obj.stroke;
    if (!color) return;

    // Convert RGB to HEX if needed
    const hexColor = rgbToHex(color);
    $("#shapeFillColor").value = hexColor;
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  rgbToHex(rgb) {
    if (rgb.startsWith("#")) return rgb; // already hex

    const result = rgb.match(/\d+/g);
    if (!result || result.length < 3) return "#000000";

    const r = parseInt(result[0]).toString(16).padStart(2, "0");
    const g = parseInt(result[1]).toString(16).padStart(2, "0");
    const b = parseInt(result[2]).toString(16).padStart(2, "0");

    return `#${r}${g}${b}`;
  },
  applyShapeColor(color) {
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    if (activeObj.type === "line") {
      activeObj.set("stroke", color);
    } else {
      // Apply to both fill and stroke when available
      if ("fill" in activeObj) activeObj.set("fill", color);
      if ("stroke" in activeObj) activeObj.set("stroke", color);
    }
    canvas.requestRenderAll();
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },
  updateZoom(newZoom) {
    zoomLevel = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);
    zoom = zoomLevel; // ✅ Ensure zoom percent display updates correctly
    EditorUIfunctions.updateCanvasPosition();
    EditorUIfunctions.updateZoomDisplay();
    EditorUIfunctions.updateMiniMap();
  },
  updateMiniMap() {
    const mainCanvas = $("#canvas")[0];
    const miniMapScale = 0.2; // Scale factor for mini map

    miniMapCanvas.width = mainCanvas.width * miniMapScale;
    miniMapCanvas.height = mainCanvas.height * miniMapScale;
    // Draw main canvas content scaled down
    miniMapCtx.drawImage(
      mainCanvas,
      0,
      0,
      miniMapCanvas.width,
      miniMapCanvas.height
    );

    // Update viewport indicator
    const viewportWidth = miniMapCanvas.width / zoomLevel;
    const viewportHeight = miniMapCanvas.height / zoomLevel;
    const viewportX = -canvasOffset.x * miniMapScale;
    const viewportY = -canvasOffset.y * miniMapScale;

    miniMapViewport.css({
      width: `${viewportWidth}px`,
      height: `${viewportHeight}px`,
      transform: `translate(${viewportX}px, ${viewportY}px)`,
    });
  },

  zoomIn() {
    EditorUIfunctions.updateZoom(zoomLevel + ZOOM_SPEED);
  },

  zoomOut() {
    EditorUIfunctions.updateZoom(zoomLevel - ZOOM_SPEED);
  },

  resetZoom() {
    zoomLevel = 1;
    canvasOffset = { x: 0, y: 0 };
    EditorUIfunctions.updateCanvasPosition();
    EditorUIfunctions.updateZoomDisplay1();
    EditorUIfunctions.updateMiniMap();
  },

  updateCanvasPosition() {
    canvasWrapper.css(
      "transform",
      `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoomLevel})`
    );
  },
  // Initialize the canvas with center position
  centerCanvas() {
    const canvasArea = $(".canvas-area");
    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform;

    // Reset the zoom and position
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.setZoom(1);

    // Center the canvas
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const areaWidth = canvasArea.offsetWidth;
    const areaHeight = canvasArea.offsetHeight;

    const left = (areaWidth - canvasWidth) / 2;
    const top = (areaHeight - canvasHeight) / 2;

    canvas.absolutePan({ x: -left, y: -top });
    canvas.renderAll();
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },
  updateInspector() {
    const obj = canvas.getActiveObject();
    if (!obj) return;
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.saveState();
  },

  renderBorderGallery() {
    const container = $("#borderGalleryList");
    container.empty();
    borderImages.forEach((src) => {
      const img = $("<img>").attr("src", src);
      img.on("click", () => EditorUIfunctions.applyBorderBackground(src));
      container.append(img);
    });
  },
  applyBorderBackground(url) {
    fabric.Image.fromURL(
      url,
      function (img) {
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
          scaleX: canvas.width / img.width,
          scaleY: canvas.height / img.height,
        });

        EditorUIfunctions.saveState();
      },
      { crossOrigin: "anonymous" }
    );
  },
  clearBorderBackground() {
    canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
    EditorUIfunctions.saveState();
  },
};

const EditorController = {
  init() {
    accountId = localStorage.getItem("accountId");
    this.loadCertificateDatabyId();
    this.initCanvas();
    this.disableUIIfNeeded();
    this.loadFonts();
    EditorUIfunctions.saveState();
    this.initPlaceholders();
    setInterval(EditorServices.saveToLocal, 5000);
    EditorUIfunctions.updateMiniMap();
    EditorUIfunctions.renderBorderGallery();
    $("[title]").tooltip();
    // EditorServices.loadFromLocal();
    setTimeout(() => {
      const $canvasElement = $("#canvas");
      if ($canvasElement.length) {
        $canvasElement.on("contextmenu", function (e) {
          e.preventDefault();
          const $menu = $("#contextMenu");
          if ($menu.length) {
            $menu
              .css({
                top: e.pageY + "px",
                left: e.pageX + "px",
                display: "block",
                visibility: "visible",
                opacity: "1",
                position: "fixed",
                zIndex: 2147483647,
              })
              .addClass("show");
          }
        });
      }
    }, 1000);
  },
  async loadCertificateDatabyId() {
    showLoader(true);

    if (!certId) {
      displayToast("Invalid certificate ID", "error");
      showLoader(false);
      return;
    }
    makeApiCall({
      url: `${CERTIFICATE_END_POINT}?certificateId=${certId}&withCertificate=true`,
      method: "GET",
      successCallback: async (response) => {
        certificates = response.data;
        // 🟡 Fix background image URL
        const bgImg = certificates.certificate?.backgroundImage;
        if (bgImg?.src && !bgImg?.src.startsWith("https://")) {
          try {
            const signedUrl = await this.GetSignedUrlForImageUpload(
              bgImg.src,
              certificates._id
            );
            bgImg._originalSrc = bgImg.src;
            bgImg.src = signedUrl;
          } catch (err) {
            console.warn(
              "Failed to sign background image URL:",
              bgImg.src,
              err
            );
          }
        }

        // 🟡 Fix image objects
        const objects = certificates.certificate?.objects || [];
        for (const obj of objects) {
          if (
            obj.type === "image" &&
            obj.src &&
            !obj.src.startsWith("https://")
          ) {
            try {
              const signedUrl = await this.GetSignedUrlForImageUpload(
                obj.src,
                certificates._id
              );
              obj._originalSrc = obj.src;
              obj.src = signedUrl;
            } catch (err) {
              console.warn("Failed to sign object image URL:", obj.src, err);
            }
          }
        }
        // ✅ Build Fabric-compatible JSON
        const fabricJSON = {
          background: certificates.certificate?.background,
          backgroundImage: certificates.certificate?.backgroundImage,
          objects: certificates.certificate?.objects,
        };

        localStorage.setItem("canvasJSON", JSON.stringify(fabricJSON));
        EditorServices.loadFromLocal();
        showLoader(false);
      },
      errorCallback: (error) => {
        console.error("Error fetching certificate:", error);
        displayToast("Failed to fetch certificate", "error");
        showLoader(false);
      },
    });
  },
  GetSignedUrlForImageUpload(originalUrl, certificateId) {
    return new Promise((resolve, reject) => {
      if (!originalUrl || !certificateId) {
        console.error("Missing image URL or certificate ID", {
          originalUrl,
          certificateId,
        });
        return reject("Missing image URL or certificate ID");
      }

      const parts = originalUrl.split("/");

      const mongoId = parts[2];
      const fileName = parts[3].split(".")[0]; // "image.png?versionId=abc123"
      const fileType = parts[3].split(".")[1];

      const signedUrlAPI =
        `${AWS_BASE_URL}/upload/signed-url` +
        `?id=${mongoId}` +
        `&fileName=${fileName}` +
        `&fileType=${fileType}` +
        `&bucket=${CONFIG.BUCKET}` +
        `&folderName=${CONFIG.FOLDERNAME}` +
        `&cloudStorageProvider=${CONFIG.CLOUD_SERVICE}`;

      makeApiCall({
        url: signedUrlAPI,
        method: "PUT",
        successCallback: (response) => {
          if (response?.data) {
            resolve(response.data.url);
          } else {
            reject("No signed URL returned");
          }
        },
        errorCallback: (error) => {
          console.error("Error getting signed URL:", error);
          reject(error);
        },
      });
    });
  },
  initCanvas() {
    canvas = new fabric.Canvas("canvas", {
      backgroundColor: "#fff",
      selection: true,
      width: 1000,
      height: 600,
    });
    canvas.renderAll();

    canvas.on("mouse:down", function (opt) {
      if (
        opt.target &&
        opt.target.type !== "textbox" &&
        opt.target.type !== "i-text"
      ) {
        $(canvas.getElement()).css("cursor", "grabbing");
      }
    });

    canvas.on("mouse:down", function (e) {
      if (e.target) {
        EditorUIfunctions.handleObjectSelection({ target: e.target });
      } else {
        EditorUIfunctions.handleObjectDeselection();
      }
    });

    canvas.on("mouse:move", function (opt) {
      if (isDragging) {
        const evt = opt.e;
        const vpt = canvas.viewportTransform;

        vpt[4] += evt.clientX - lastPosX;
        vpt[5] += evt.clientY - lastPosY;

        canvas.requestRenderAll();

        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
      }
    });

    canvas.on("mouse:up", function () {
      isDragging = false;
      canvas.selection = true;
      $(canvas.getElement()).css("cursor", "default");
    });

    canvas.on("mouse:up", function (opt) {
      $(canvas.getElement()).css("cursor", "default");
    });
    canvas.on("object:moving", function (e) {
      if (!snapToGrid) return;
      e.target.set({
        left: Math.round(e.target.left / gridSize) * gridSize,
        top: Math.round(e.target.top / gridSize) * gridSize,
      });
    });

    canvas.on("object:moving", function (e) {
      const obj = e.target;
      obj.setCoords();
      const bound = obj.getBoundingRect();

      if (bound.left < 0) obj.left -= bound.left;
      if (bound.top < 0) obj.top -= bound.top;
      if (bound.left + bound.width > canvas.getWidth())
        obj.left -= bound.left + bound.width - canvas.getWidth();
      if (bound.top + bound.height > canvas.getHeight())
        obj.top -= bound.top + bound.height - canvas.getHeight();
    });
    // 🔁 Snap Rotate
    canvas.on("object:rotating", (e) => {
      const angle = e.target.angle;
      const snapped = Math.round(angle / 15) * 15;
      e.target.angle = snapped;
    });

    //canvas outside scrolling
    canvas.on("mouse:wheel", function (opt) {
      opt.e.preventDefault();
      opt.e.stopPropagation();

      const delta = opt.e.deltaY;
      const pointer = canvas.getPointer(opt.e);
      const newZoom = zoomLevel * 0.999 ** delta;

      EditorUIfunctions.updateZoom(newZoom);
    });

    canvas.on("mouse:over", function (e) {
      if (e.target) {
        if (e.target.type === "textbox" || e.target.type === "i-text") {
          e.target.hoverCursor = "text"; // Changed to 'text' for text objects
        } else {
          e.target.hoverCursor = "grab"; // Changed to 'grab' for shapes and images
        }
      }
    });
    // Pan functionality
    canvasWrapper.on("mousedown", (e) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        // Middle mouse or Alt + Left click
        isPanning = true;
        canvasWrapper.addClass("panning");
        lastPanPosition = { x: e.clientX, y: e.clientY };
      }
    });

    canvas.on("object:added", function (e) {
      EditorController.applyDefaultCursorStyle(e.target);
    });
    canvas.renderAll();

    $("#shapeFillColor")
      .off("input change")
      .on("input change", function () {
        EditorUIfunctions.applyShapeColor(this.value);
      });
    // ✅ Insert these directly below
    $("#shapeStrokeColor").on("input change", function () {
      const color = this.value;
      const obj = canvas.getActiveObject();

      if (obj) {
        obj.set("stroke", color);
        canvas.renderAll();
        EditorUIfunctions.saveState?.();
        EditorUIfunctions.updateMiniMap?.();
      }

      // ✅ Also update page border if it exists
      if (pageBorder) {
        pageBorder.set("stroke", color);
        canvas.renderAll();
      }
    });

    $("#shapeStrokeWidth").on("input change", function () {
      const width = parseInt(this.value, 10);
      const obj = canvas.getActiveObject();

      if (obj) {
        obj.set("strokeWidth", width);
        canvas.renderAll();
        EditorUIfunctions.saveState?.();
        EditorUIfunctions.updateMiniMap?.();
      }

      // ✅ Also update page border if it exists
      if (pageBorder) {
        pageBorder.set({
          strokeWidth: width,
          left: width / 2,
          top: width / 2,
          width: canvas.getWidth() - width,
          height: canvas.getHeight() - width,
        });
        canvas.renderAll();
      }
    });

    // Unified right-click context menu handler using event delegation
    $(document).on(
      "contextmenu",
      "#canvasWrapper, .canvas-container, #canvas",
      function (e) {
        e.preventDefault(); // prevent default browser context menu
        e.stopPropagation();

        const $menu = $("#contextMenu");

        // Ensure menu exists
        if (!$menu.length) {
          console.error("Context menu element not found");
          return;
        }

        // Hide any previously shown menu
        $menu.removeClass("show").css({
          display: "none",
          visibility: "hidden",
          opacity: "0",
        });

        // Show menu first to calculate dimensions
        $menu.css({
          display: "block",
          visibility: "hidden",
          position: "fixed",
        });

        const menuHeight = $menu.outerHeight() || 300;
        const menuWidth = $menu.outerWidth() || 240;
        const windowHeight = $(window).height();
        const windowWidth = $(window).width();

        let top = e.pageY;
        let left = e.pageX;

        // Adjust vertically if menu would overflow bottom
        if (top + menuHeight > windowHeight) {
          top = Math.max(10, e.pageY - menuHeight);
        }

        // Adjust horizontally if menu would overflow right
        if (left + menuWidth > windowWidth) {
          left = Math.max(10, e.pageX - menuWidth);
        }

        // Apply final positioning and show menu
        $menu
          .css({
            top: top + "px",
            left: left + "px",
            display: "block",
            visibility: "visible",
            opacity: "1",
            zIndex: 2147483647,
          })
          .addClass("show");
      }
    );

    // Upload image
    $("#imgUpload").on("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (f) {
        fabric.Image.fromURL(
          f.target.result,
          function (img) {
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();

            // Calculate scale to fit canvas but do not upscale
            const scaleX = canvasWidth / img.width;
            const scaleY = canvasHeight / img.height;
            const scale = Math.min(scaleX, scaleY, 1);

            img.set({
              left: canvasWidth / 2,
              top: canvasHeight / 2,
              originX: "center",
              originY: "center",
              scaleX: scale,
              scaleY: scale,
              selectable: true,
              hasControls: true,
              lockScalingX: false,
              lockScalingY: false,
            });

            canvas.add(img).setActiveObject(img);
            canvas.requestRenderAll();

            // Clear the input value to allow uploading the same file again if needed
            e.target.value = "";
          },
          { crossOrigin: "anonymous" }
        );
      };
      reader.readAsDataURL(file);
    });

    // Upload background image and scale to fit canvas
    $("#bgUpload").on("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (f) {
        // Set the image as Fabric canvas background
        fabric.Image.fromURL(
          f.target.result,
          function (img) {
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
              scaleX: canvas.width / img.width,
              scaleY: canvas.height / img.height,
            });
          },
          { crossOrigin: "anonymous" }
        );

        // Show preview
        $("#bgPreview").attr("src", f.target.result).show();

        // Hide upload button
        $("#uploadBtn").hide();

        // Clear input for repeat uploads
        e.target.value = "";
      };
      reader.readAsDataURL(file);
    });

    // Set background color
    $("#bgColorPicker").on("input", function (e) {
      const color = e.target.value;
      canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));
    });

    $(document).on("mousedown", function (e) {
      const $target = $(e.target);

      const isInsideEditorUI = $target.closest(
        ".canvas-container, .property-group, .contextmenu, .text-controls, .text-toolbar, .dropdown-menu"
      ).length;

      if (!isInsideEditorUI) {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      }
    });

    $(document).on("keydown", function (e) {
      const obj = canvas.getActiveObject();
      if (!obj && !(e.ctrlKey && e.key === "v")) return; // Allow paste even if nothing is selected
      if (EditorUIfunctions.isTypingInInput()) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlOrCmd = e.ctrlKey || (isMac && e.metaKey);

      // DELETE
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        EditorUIfunctions.deleteSelected();
        return;
      }

      // DUPLICATE with +, =, NumpadAdd
      if (e.key === "+" || e.key === "=" || e.code === "NumpadAdd") {
        e.preventDefault();
        EditorUIfunctions.duplicateSelected();
        return;
      }

      // SPACE key: enable grab cursor
      if (e.code === "Space") {
        spaceKeyPressed = true;
        $("body").css("cursor", "grab");
        return;
      }

      // CTRL/CMD + Zoom Controls
      if (ctrlOrCmd) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          $("#zoomInBtn").trigger("click");
          return;
        } else if (e.key === "-") {
          e.preventDefault();
          $("#zoomOutBtn").trigger("click");
          return;
        } else if (e.key === "0") {
          e.preventDefault();
          $("#resetZoomBtn").trigger("click");
          return;
        }
      }

      // Arrow key movement
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          obj.top -= 1;
          break;
        case "ArrowDown":
          e.preventDefault();
          obj.top += 1;
          break;
        case "ArrowLeft":
          e.preventDefault();
          obj.left -= 1;
          break;
        case "ArrowRight":
          e.preventDefault();
          obj.left += 1;
          break;
      }

      // COPY (Ctrl + C)
      if (ctrlOrCmd && e.key === "c") {
        e.preventDefault();
        if (obj) {
          obj.clone((cloned) => {
            canvas.clipboard = cloned;
          });
        }
      }

      // PASTE (Ctrl + V)
      if (ctrlOrCmd && e.key === "v" && canvas.clipboard) {
        e.preventDefault();
        canvas.clipboard.clone((cloned) => {
          cloned.set({
            left: cloned.left + 10,
            top: cloned.top + 10,
            evented: true,
          });

          if (cloned.type === "activeSelection") {
            cloned.canvas = canvas;
            cloned.forEachObject((o) => canvas.add(o));
            cloned.setCoords();
          } else {
            canvas.add(cloned);
          }

          canvas.setActiveObject(cloned);
          canvas.requestRenderAll();

          EditorUIfunctions.saveState?.();
          EditorUIfunctions.updateMiniMap?.();
        });
      }

      canvas.requestRenderAll(); // Reflect updates visually
    });

    $(document).on("keyup", (e) => {
      if (e.code === "Space") {
        spaceKeyPressed = false;
        $("body").css("cursor", "default");
      }
    });
    $(document).on("mousemove", (e) => {
      if (isPanning) {
        const deltaX = e.clientX - lastPanPosition.x;
        const deltaY = e.clientY - lastPanPosition.y;

        canvasOffset.x += deltaX;
        canvasOffset.y += deltaY;

        EditorUIfunctions.updateCanvasPosition();
        lastPanPosition = { x: e.clientX, y: e.clientY };
      }
    });

    $(document).on("mouseup", () => {
      isPanning = false;
      canvasWrapper.removeClass("panning");
    });

    // Hide menu on click anywhere
    $(document).on("click", function (e) {
      const $menu = $("#contextMenu");
      if (!$menu.is(e.target) && !$menu.has(e.target).length) {
        $menu.removeClass("show").css({
          display: "none",
          visibility: "hidden",
          opacity: "0",
        });
      }
    });

    // Trigger original buttons by matching data-action to button ID
    $("#contextMenu a").on("click", function (e) {
      e.preventDefault();
      const btnId = $(this).data("action");
      $(`#${btnId}`).trigger("click");
      $("#contextMenu").hide();
    });

    $(
      ".text-properties-panel, .shape-properties-panel,.bordergallery-properties-panel, .background-properties-panel"
    ).addClass("d-none");
    // Ensure dynamic-placeholders-section is visible by default
    $(".dynamic-placeholders-section").removeClass("d-none");

    // === TEXT FUNCTIONALITY FIX ===
    $("#addTextBtn").on("click", EditorUIfunctions.addText);
    $("#fontFamilySelect").on("change", EditorUIfunctions.changeFontFamily);
    $("#fontSizeInput").on("input change", EditorUIfunctions.changeFontSize);
    $("#fontColorPicker").on("input", EditorUIfunctions.changeFontColor);

    $("#letterSpacingInput").on("input change", function () {
      EditorUIfunctions.setLetterSpacing(
        canvas.getActiveObject(),
        parseFloat(this.value) * 50
      );
    });
    $("#lineHeightInput").on("input change", function () {
      EditorUIfunctions.setLineHeight(
        canvas.getActiveObject(),
        parseFloat(this.value)
      );
    });
    $("#bgUpload").on("change", EditorUIfunctions.uploadBgImage);

    $("#textShadowColorPicker").on("input", function () {
      EditorUIfunctions.changeShadowColor(this.value);
    });
    $("#textBgColorPicker").on("input change", function () {
      EditorUIfunctions.setTextBgColor(this.value);
    });
    $("#textStrokeColorPicker").on("input change", function () {
      EditorUIfunctions.changeStrokeColor(this.value);
    });
    $("#textShadowInput").on("input change", function () {
      const obj = canvas.getActiveObject();
      if (obj) {
        EditorUIfunctions.setTextShadow(obj, {
          color: $("#textShadowColorPicker").val(),
          blur: parseFloat(this.value),
          offsetX: 2,
          offsetY: 2,
        });
      }
    });

    $("#zoomInBtn").on("click", EditorUIfunctions.zoomIn);
    $("#zoomOutBtn").on("click", EditorUIfunctions.zoomOut);
    $("#resetZoomBtn").on("click", EditorUIfunctions.resetZoom);
    $("#strokeWidth").on("input change", EditorUIfunctions.changeStrokeWidth);
    $("#undoBtn").on("click", EditorUIfunctions.undo);
    $("#redoBtn").on("click", EditorUIfunctions.redo);
    $("#clearbtn").on("click", EditorUIfunctions.clearCanvas);
    $("#previewBtn").on("click", EditorUIfunctions.preview);
    $("#setportraitbtn").on("click", EditorUIfunctions.setPortrait);
    $("#setlandscapebtn").on("click", EditorUIfunctions.setLandscape);
    $(".text-bold").on("click", EditorUIfunctions.toggleBold);
    $(".text-italic").on("click", EditorUIfunctions.toggleItalic);
    $(".text-underline").on("click", EditorUIfunctions.toggleUnderline);
    $("#textTransformUppercase").on("click", EditorUIfunctions.textToUpper);
    $("#textTransformLowercase").on("click", EditorUIfunctions.textToLower);
    $("#textTransformCapitalize").on(
      "click",
      EditorUIfunctions.textToCapitalize
    );
    $("#addQRCodeBtn").on("click", () =>
      EditorUIfunctions.generateQRCode(attenderId)
    );
    $("#gradientColor1").on("input change", EditorUIfunctions.applyGradient);
    $("#gradientColor2").on("input change", EditorUIfunctions.applyGradient);
    $("#clearBGgradient").on("click", EditorUIfunctions.clearBgGradient);
    $("#clearBgcolor").on("click", EditorUIfunctions.clearBgColor);
    $("#clearbgImage").on("click", EditorUIfunctions.clearBgImage);
    $("#btnForward").on("click", EditorUIfunctions.bringForward);
    $("#btnBackward").on("click", EditorUIfunctions.sendBackward);
    $("#btnGroup").on("click", EditorUIfunctions.groupSelected);
    $("#btnUngroup").on("click", EditorUIfunctions.ungroupSelected);
    $("#addPageBorderBtn").on("click", EditorUIfunctions.addOrUpdatePageBorder);
    $("#copyBtn").on("click", EditorUIfunctions.copy);
    $("#pasteBtn").on("click", EditorUIfunctions.paste);
    $("#cutBtn").on("click", EditorUIfunctions.cut);
    $("#deleteBtn").on("click", EditorUIfunctions.deleteSelected);
    $("#hideBorderGalleryPanel").on(
      "click",
      EditorUIfunctions.clearBorderBackground
    );
    $("#saveBtn").on("click", function () {
      EditorController.confirmpopup(); // Or your own function to handle saving
    });
    $("#addToggleGridBtn").on("click", EditorUIfunctions.toggleGrid);

    $("#deselect").on("click", function (e) {
      e.preventDefault(); // optional, prevents jumping on anchor click
      canvas.discardActiveObject();
      canvas.requestRenderAll(); // refreshes UI
    });

    $("#opacityRange").on("input change", function () {
      const value = parseFloat(this.value);
      EditorUIfunctions.setOpacity(value);
    });

    $("#rotateCW").on("click", EditorUIfunctions.rotateCW);
    $("#rotateACW").on("click", EditorUIfunctions.rotateCCW);
    $("#flipX").on("click", EditorUIfunctions.flipX);
    $("#flipY").on("click", EditorUIfunctions.flipY);
    $("#lockUnlock").on("click", EditorUIfunctions.lockUnlock);
    $('[data-action="align-left"]').on("click", () =>
      EditorUIfunctions.alignText("left")
    );
    $('[data-action="align-center"]').on("click", () =>
      EditorUIfunctions.alignText("center")
    );
    $('[data-action="align-right"]').on("click", () =>
      EditorUIfunctions.alignText("right")
    );

    $('[data-action^="add-"]').on("click", function () {
      const action = $(this).data("action");

      switch (action) {
        case "add-rectangle":
          EditorUIfunctions.addRectangle();
          break;
        case "add-circle":
          EditorUIfunctions.addCircle();
          break;
        case "add-triangle":
          EditorUIfunctions.addTriangle();
          break;
        case "add-polygon":
          EditorUIfunctions.addPolygon();
          break;
        case "add-line":
          EditorUIfunctions.addLine();
          break;
      }
    });

    // Panel switching for sidetoolbar buttons
    $(".tool-btn").on("click", function () {
      const btn = $(this);
      // Hide all property panels
      $(".right-panel .panel-section").addClass("d-none");
      // Always show dynamic placeholders section
      $(".dynamic-placeholders-section").removeClass("d-none");

      if (btn.hasClass("shape")) {
        $(".shape-properties-panel").removeClass("d-none");
      } else if (btn.hasClass("background")) {
        $(".background-properties-panel").removeClass("d-none");
      } else if (btn.hasClass("borders")) {
        $(".bordergallery-properties-panel").removeClass("d-none");
      } else if (btn.hasClass("text")) {
        $(".text-properties-panel").removeClass("d-none");
      }
    });
  },
  disableUIIfNeeded() {
    if (!isAdmin) {
      $(
        ".text-properties-panel, .shape-properties-panel, .background-properties-panel, .sidetoolbar, .right-panel,.bordergallery-properties-panel"
      ).addClass("d-none");
      canvas.selection = false;
      canvas.getObjects().forEach((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
    }
  },
  loadFonts() {
    const fonts = [
      "Arial",
      "Georgia",
      "Verdana",
      "Pacifico",
      "Lobster",
      "Open Sans",
      "Montserrat",
      "Poppins",
      "Raleway",
      "Merriweather",
      "Lato",
      "Oswald",
      "PT Sans",
      "Ubuntu",
      "Nunito",
      "Rubik",
      "Fira Sans",
      "Dancing Script",
      "Playfair Display",
      "Anton",
      "Bebas Neue",
      "Amatic SC",
      "Bangers",
      "Caveat",
      "Cinzel",
      "Courgette",
      "Gloria Hallelujah",
      "Great Vibes",
      "Indie Flower",
      "Josefin Sans",
      "Kalam",
      "Quicksand",
      "Righteous",
      "Satisfy",
      "Shadows Into Light",
      "Signika",
      "Tangerine",
      "Yanone Kaffeesatz",
    ];
    const fontSelect = $("#fontFamilySelect");
    fonts.forEach((font) => {
      const $link = $("<link>", {
        href: `https://fonts.googleapis.com/css2?family=${font.replace(
          / /g,
          "+"
        )}&display=swap`,
        rel: "stylesheet",
      });
      $("head").append($link);
      const option = $("<option>").val(font).text(font).css("fontFamily", font);
      fontSelect.append(option);
    });
  },
  isPlaceholderTrue() {
    fabric.Textbox.prototype.toObject = (function (toObject) {
      return function (propertiesToInclude) {
        return fabric.util.object.extend(
          toObject.call(this, propertiesToInclude),
          {
            isPlaceholder: this.isPlaceholder || false,
          }
        );
      };
    })(fabric.Textbox.prototype.toObject);
  },
  bindCanvasEvents() {
    canvas.on("after:render", EditorUIfunctions.updateMiniMap);
    canvas.on("canvas:cleared", this.initPlaceholders);
    canvas.on("canvas:loaded", this.initPlaceholders);
    canvas.on("selection:created", EditorUIfunctions.handleObjectSelection);
    canvas.on("selection:updated", EditorUIfunctions.handleObjectSelection);
    canvas.on("selection:cleared", EditorUIfunctions.handleObjectDeselection);
    canvas.on("selection:created", EditorUIfunctions.updateColorPicker);
    canvas.on("selection:updated", EditorUIfunctions.updateColorPicker);
    canvas.on("selection:updated", EditorUIfunctions.updateInspector);
    canvas.on("selection:created", EditorUIfunctions.updateInspector);
    canvas.on("object:added", EditorUIfunctions.saveState);
    canvas.on("object:modified", EditorUIfunctions.saveState);
    canvas.on("object:skewing", EditorUIfunctions.saveState);
    canvas.on("object:removed", EditorUIfunctions.saveState);
    canvas.on("object:scaling", () => EditorUIfunctions.saveState());
    canvas.on("object:rotating", () => EditorUIfunctions.saveState());
    canvas.on("object:moving", () => EditorUIfunctions.saveState());
    canvas.on("object:added", EditorUIfunctions.updateMiniMap);
    canvas.on("object:modified", EditorUIfunctions.updateMiniMap);
    canvas.on("object:removed", EditorUIfunctions.updateMiniMap);
    canvas.on("text:changed", EditorUIfunctions.updateMiniMap);
    canvas.on("object:scaling", EditorUIfunctions.updateMiniMap);
    canvas.on("object:moving", EditorUIfunctions.updateMiniMap);
    canvas.on("object:rotating", EditorUIfunctions.updateMiniMap);

    canvas.on("text:changed", EditorUIfunctions.saveState); // For typing
    canvas.on("selection:cleared", EditorUIfunctions.saveState); // Optional
  },
  initPlaceholders() {
    const placeholders = $(".placeholder-item");

    placeholders.each(function () {
      const placeholder = $(this);

      // Make draggable
      placeholder.attr("draggable", true);

      // Handle drag events
      placeholder.on("dragstart", function (e) {
        isDragOperation = true;
        e.originalEvent.dataTransfer.setData(
          "text/plain",
          $(this).data("placeholder")
        );
        $(this).addClass("dragging");
      });

      placeholder.on("dragend", function () {
        $(this).removeClass("dragging");
        setTimeout(() => {
          isDragOperation = false; // Reset after a short delay
        }, 50);
      });

      placeholder.on("click", function (e) {
        // Only add on click if it was NOT part of a drag operation
        if (!isDragOperation) {
          const text = $(this).data("placeholder");
          if (text) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            EditorController.addPlaceholderToCanvas(text, centerX, centerY);
          }
        }
      });
    });

    // Handle canvas drop zone
    const canvasWrapper = $(".canvas-container");
    if (!canvasWrapper.length) return; // Check if element exists using .length

    canvasWrapper.on("dragover", function (e) {
      e.preventDefault();
      e.originalEvent.dataTransfer.dropEffect = "copy";
      $(this).addClass("dragover");
    });

    canvasWrapper.on("dragleave", function (e) {
      e.preventDefault();
      $(this).removeClass("dragover");
    });

    canvasWrapper.on("drop", function (e) {
      e.preventDefault();
      $(this).removeClass("dragover");

      const text = e.originalEvent.dataTransfer.getData("text/plain");
      if (text) {
        const pointer = canvas.getPointer(e.originalEvent);
        EditorController.addPlaceholderToCanvas(text, pointer.x, pointer.y);
      }

      isDragOperation = false;
    });
  },
  addPlaceholderToCanvas(text, x, y) {
    const textbox = new fabric.IText(`{{${text}}}`, {
      left: x,
      top: y,
      fontSize: 20,
      fill: "#228be6",
      fontFamily: "Arial",
      originX: "center",
      originY: "center",
      padding: 10,
      textAlign: "center",
    });

    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
    EditorUIfunctions.saveState();
    EditorUIfunctions.updateMiniMap();
  },
  applyDefaultCursorStyle(obj) {
    if (!obj) return;

    obj.set({
      hoverCursor:
        obj.type === "textbox" || obj.type === "i-text" ? "text" : "grab",
      moveCursor: "crosshair",
      cornerStyle: "circle",
      transparentCorners: false,
      borderColor: "#228be6",
      cornerColor: "#228be6",
      cornerSize: 8,
    });
  },
  confirmpopup() {
    const storedTitle = certificates?.title || "";
    const storedDesc = certificates?.description || "";
    const templateSource = $("#save-template-modal-template").html();
    const template = Handlebars.compile(templateSource);

    const modalHtml = template({ title: storedTitle, description: storedDesc });

    $("#saveTemplateModal").remove(); // Remove old modal if any
    $("body").append(modalHtml); // Add new modal HTML

    const $modal = $("#saveTemplateModal");
    const modal = new bootstrap.Modal($modal[0]);
    modal.show();

    $("#confirmSaveTemplate")
      .off("click")
      .on("click", async function () {
        const title = $("#templateTitle").val().trim();
        const description = $("#templateDescription").val().trim();

        if (!title) {
          displayToast("Please enter a title.", "error");
          return;
        }

        modal.hide();

        try {
          await EditorServices.saveJSON(title, description);
        } catch (err) {
          console.error("Save failed:", err);
          displayToast("Save failed", "error");
        }
      });
  },
};

const EditorServices = {
  saveAndUpdateCertificateAPI(accountId, structuredData) {
    // Include required fields: title, description, canvasData, status, etc.
    const payload = {
      accountId,
      ...structuredData,
    };

    // Check if we're editing an existing certificate (PUT)
    const urlParams = new URLSearchParams(window.location.search);
    const certificateId = urlParams.get("id");
    const method = certificateId ? "PUT" : "POST";
    const url = certificateId
      ? `${CERTIFICATE_END_POINT}?certificateId=${certificateId}`
      : CERTIFICATE_END_POINT;
    makeApiCall({
      url,
      method,
      data: JSON.stringify(payload),
      successCallback: (response) => {
        const message = certificateId
          ? "Certificate updated successfully"
          : "Certificate saved successfully";
        displayToast(message, "success");
      },
      errorCallback: (error) => {
        console.error("Error saving certificate:", error);
        displayToast("Failed to save certificate", "error");
      },
    });
  },
  // certificate save process

  async saveJSON(title, description) {
    const rawCanvasJSON = JSON.parse(localStorage.getItem("canvasJSON"));
    if (!rawCanvasJSON || !Array.isArray(rawCanvasJSON.objects)) {
      console.warn("No valid canvas objects found.");
      return;
    }

    const uploadPromises = [];
    let cleanedBackgroundImage = null;

    const certCanvasObjects = certificates?.certificate?.objects || [];

    // === Process canvas objects ===
    const cleanedObjects = await Promise.all(
      rawCanvasJSON.objects.map(async (obj, index) => {
        if (!obj || obj.type === "line") return null;

        const updatedObj = { ...obj };
        const originalObj = certCanvasObjects[index];
        const isBase64 = obj.src?.startsWith("data:image");
        const isCloud = obj.src?.startsWith("https");

        if (obj.type === "image") {
          if (isCloud && !isBase64 && originalObj?._originalSrc) {
            updatedObj.src = originalObj._originalSrc;
            delete updatedObj._originalSrc;
          } else if (isBase64) {
            const blob = this.base64ToBlob(obj.src);
            const extension = blob.type.split("/")[1] || "png";
            const fileName = `image_${timestamp}_${imageCounter++}.${extension}`;
            const fileObj = new File([blob], fileName, { type: blob.type });

            updatedObj.filename = fileName.split(".")[0];
            updatedObj.filetype = extension;
            uploadPromises.push(
              uploadFileForQuestion(accountId, { file: fileObj })
            );
          }
        }

        if (obj?.type === "i-text") {
          EditorController.isPlaceholderTrue();
        }

        return EditorServices.cleanObject(updatedObj);
      })
    );

    const finalObjects = cleanedObjects.filter(Boolean);

    // === Handle background image ===
    const bgImg = rawCanvasJSON.backgroundImage;
    if (bgImg?.src) {
      const isBase64 = bgImg.src.startsWith("data:image");
      const isCloud = bgImg.src.startsWith("https://");

      try {
        let fileObj, extension, fileName;
        const originalBg = certificates?.certificate?.backgroundImage;
        const originalSrc = originalBg?._originalSrc;

        if (isCloud && !isBase64 && originalSrc) {
          cleanedBackgroundImage = EditorServices.cleanObject({
            ...bgImg,
            src: originalSrc,
          });
          delete cleanedBackgroundImage._originalSrc;
        } else if (isBase64) {
          const blob = this.base64ToBlob(bgImg.src);
          extension = blob.type.split("/")[1] || "png";
          fileName = `background_${timestamp}_${imageCounter++}.${extension}`;
          fileObj = new File([blob], fileName, { type: blob.type });
        } else if (!isBase64) {
          const response = await fetch(bgImg.src);
          const blob = await response.blob();
          extension = blob.type.split("/")[1] || "png";
          fileName = `backgroundlocal_border_${timestamp}_${imageCounter++}.${extension}`;
          fileObj = new File([blob], fileName, { type: blob.type });
        }

        if (fileObj) {
          const baseName = fileName.split(".")[0];
          cleanedBackgroundImage = EditorServices.cleanObject({
            ...bgImg,
            filename: baseName,
            filetype: extension,
          });

          uploadPromises.push(
            uploadFileForQuestion(accountId, { file: fileObj })
          );
        }
      } catch (err) {
        console.error("Error processing background image:", err);
        cleanedBackgroundImage = EditorServices.cleanObject(bgImg);
      }
    }

    // === Wait for uploads ===
    await Promise.all(uploadPromises);

    // === Final certificate structure ===
    const canvasData = {
      background: rawCanvasJSON.background,
      orientation: currentOrientation,
      objects: finalObjects,
    };

    if (cleanedBackgroundImage) {
      canvasData.backgroundImage = cleanedBackgroundImage;
    }

    const structuredData = {
      title: title || "My Design",
      description: description || "New design certificate",
      certificate: canvasData,
      status: "DRAFT",
    };

    EditorServices.saveAndUpdateCertificateAPI(accountId, structuredData);
  },
  // Ensure cleanObject function is defined as it's used above
  cleanObject(obj) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([key, val]) => {
          // Exclude null, "", false, undefined, 0
          if (
            val === null ||
            val === false ||
            val === undefined ||
            (key !== "text" && val === "") ||
            (key !== "text" && val === 0)
          ) {
            return false;
          }

          // Exclude key named "version"
          if (key === "version") {
            return false;
          }

          // Exclude "src" if the object is an image AND it's a base64 string
          // We're already handling the upload for base64 images and replacing 'src' with 'filename'/'filetype'
          if (
            obj.type === "image" &&
            key === "src" &&
            obj.src.startsWith("data:image") &&
            typeof val === "string"
          ) {
            return false;
          }

          // Remove empty arrays
          if (Array.isArray(val) && val.length === 0 && key !== "styles") {
            return false;
          }

          // Remove empty objects
          if (
            typeof val === "object" &&
            !Array.isArray(val) &&
            Object.keys(val).length === 0
          ) {
            return false;
          }

          return true;
        })
        .map(([key, val]) => {
          if (typeof val === "object" && !Array.isArray(val)) {
            return [key, EditorServices.cleanObject(val)];
          }
          return [key, val];
        })
    );
  },
  // Convert base64 image to Blob for upload
  base64ToBlob(base64) {
    const byteString = atob(base64.split(",")[1]);
    const mimeType = base64.split(",")[0].match(/:(.*?);/)[1];
    const arraybuffer = new ArrayBuffer(byteString.length);
    const iterationArray = new Uint8Array(arraybuffer);
    for (let i = 0; i < byteString.length; i++) {
      iterationArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([arraybuffer], { type: mimeType });
  },
  loadJSON() {
    const data = localStorage.getItem("canvasData");
    if (data) {
      canvas.loadFromJSON(data, canvas.renderAll.bind(canvas));
    }
  }, // 💾 Auto-save to localStorage
  saveToLocal() {
    localStorage.setItem("canvasJSON", JSON.stringify(canvas.toJSON()));
  },
  loadFromLocal() {
    const json = localStorage.getItem("canvasJSON");
    const orient = localStorage.getItem("canvasOrientation");

    if (orient === "portrait") {
      EditorUIfunctions.setPortrait();
    } else {
      EditorUIfunctions.setLandscape();
    }

    if (json) {
      canvas.loadFromJSON(JSON.parse(json), function () {
        // 🔁 Collect promises for images to wait on
        const imageLoadPromises = [];

        // ✅ Handle canvas backgroundImage
        if (
          canvas.backgroundImage &&
          canvas.backgroundImage.url &&
          !canvas.backgroundImage.src
        ) {
          imageLoadPromises.push(
            new Promise((resolve) => {
              canvas.backgroundImage.setSrc(
                canvas.backgroundImage.url,
                resolve
              );
            })
          );
        }

        // ✅ Patch and load image objects
        canvas.getObjects().forEach((obj) => {
          if (obj.type === "image" && obj.url) {
            imageLoadPromises.push(
              new Promise((resolve) => {
                obj.setSrc(obj.url, resolve); // async load
              })
            );
          }
        });

        // ✅ After all images load, then render canvas
        Promise.all(imageLoadPromises).then(() => {
          canvas.renderAll();
          EditorUIfunctions.syncCanvasBackgroundUI();
          EditorUIfunctions.updateMiniMap?.();
        });
      });
    }
  },
};

$(document).ready(() => {
  EditorController.init();

  // Context Menu Functions
  const $contextMenu = $("#contextMenu");
  const $opacitySlider = $("#opacityRange");
  const $opacityValue = $(".opacity-value");

  // Update opacity display when slider changes
  if ($opacitySlider.length && $opacityValue.length) {
    $opacitySlider.on("input", function () {
      const percentage = Math.round(this.value * 100);
      $opacityValue.text(percentage + "%");
    });

    // Initialize the display
    const initialPercentage = Math.round($opacitySlider.val() * 100);
    $opacityValue.text(initialPercentage + "%");
  }

  // Context Menu Positioning Handler
  if ($contextMenu.length) {
    // Function to hide context menu
    window.hideContextMenu = function () {
      if ($contextMenu.length) {
        $contextMenu.removeClass("show");
        $contextMenu.css({
          display: "none",
          visibility: "hidden",
          opacity: "0",
        });
        $("body").removeClass("context-menu-open");
      }
    };

    // Context menu is now handled by the unified handler above

    // Hide context menu when clicking outside
    $(document).on("click", function (e) {
      if (!$contextMenu.is(e.target) && !$contextMenu.has(e.target).length) {
        hideContextMenu();
      }
    });

    // Hide context menu on scroll
    $(document).on("scroll", hideContextMenu);

    // Hide context menu on window resize
    $(window).on("resize", hideContextMenu);

    // Prevent context menu from closing when clicking inside it
    $contextMenu.on("click", function (e) {
      e.stopPropagation();
    });
  }
});
