/**
 * Strategy for handling signed URLs
 */
function SignedUrlStrategy() {
  return {
    async resolveUrls(attachments) {
      const resolvedAttachments = [];

      for (const attachment of attachments) {
        try {
          const signedUrl = await this.getSignedUrl(attachment.url);
          resolvedAttachments.push({
            ...attachment,
            url: signedUrl,
            originalUrl: attachment.url,
          });
        } catch (error) {
          console.error("Failed to resolve signed URL:", error);
          resolvedAttachments.push({
            ...attachment,
            error: true,
            errorMessage: "Failed to load image",
          });
        }
      }

      return resolvedAttachments;
    },

    getSignedUrl(attachmentUrl) {
      return new Promise((resolve, reject) => {
        makeApiCall({
          url: `${STUDENT_END_POINT}/attachment?url=${attachmentUrl}`,
          method: "GET",
          isApiKey: true,
          successCallback: (response) => resolve(response.data),
          errorCallback: (error) => reject(error),
        });
      });
    },
  };
}

/**
 * Strategy for handling direct URLs (no signing required)
 */
function DirectUrlStrategy() {
  return {
    async resolveUrls(attachments) {
      return attachments.map((attachment) => ({
        ...attachment,
        originalUrl: attachment.url,
      }));
    },
  };
}

/**
 * Handles zoom functionality
 */
function ZoomHandler(slider) {
  return {
    handle(event, context) {
      const { type } = context;

      switch (type) {
        case "zoom-in":
          slider.zoomIn();
          break;
        case "zoom-out":
          slider.zoomOut();
          break;
        case "zoom-reset":
          slider.resetZoom();
          break;
        case "wheel":
          event.preventDefault();
          if (event.originalEvent.deltaY < 0) {
            slider.zoomIn();
          } else {
            slider.zoomOut();
          }
          break;
      }
    },
  };
}

/**
 * Handles navigation functionality
 */
function NavigationHandler(slider) {
  return {
    handle(event, context) {
      const { type } = context;

      switch (type) {
        case "previous":
          slider.previousImage();
          break;
        case "next":
          slider.nextImage();
          break;
        case "goto":
          slider.goToImage(context.index);
          break;
      }
    },
  };
}

/**
 * Handles keyboard interactions
 */
function KeyboardHandler(slider) {
  return {
    handle(event, context) {
      if (!slider.isOpen) return;

      switch (event.key) {
        case "ArrowLeft":
          slider.previousImage();
          break;
        case "ArrowRight":
          slider.nextImage();
          break;
        case "Escape":
          slider.close();
          break;
        case "+":
        case "=":
          slider.zoomIn();
          break;
        case "-":
          slider.zoomOut();
          break;
        case "0":
          slider.resetZoom();
          break;
      }
    },
  };
}

/**
 * Handles drag functionality for zoomed images
 */
function DragHandler(slider) {
  const state = {
    isDragging: false,
    startX: 0,
    startY: 0,
  };

  return {
    handle(event, context) {
      const { type } = context;

      switch (type) {
        case "mousedown":
        case "touchstart":
          this.startDrag(event);
          break;
        case "mousemove":
        case "touchmove":
          this.updateDrag(event);
          break;
        case "mouseup":
        case "touchend":
          this.endDrag();
          break;
      }
    },

    startDrag(event) {
      if (slider.zoomLevel <= 1) return;

      state.isDragging = true;
      const clientX =
        event.clientX || event.originalEvent?.touches?.[0]?.clientX;
      const clientY =
        event.clientY || event.originalEvent?.touches?.[0]?.clientY;

      state.startX = clientX - slider.translateX;
      state.startY = clientY - slider.translateY;

      event.preventDefault();
    },

    updateDrag(event) {
      if (!state.isDragging || slider.zoomLevel <= 1) return;

      const clientX =
        event.clientX || event.originalEvent?.touches?.[0]?.clientX;
      const clientY =
        event.clientY || event.originalEvent?.touches?.[0]?.clientY;

      slider.translateX = clientX - state.startX;
      slider.translateY = clientY - state.startY;
      slider.updateImageTransform();
    },

    endDrag() {
      state.isDragging = false;
    },
  };
}

/**
 * Main Image Slider object implementing the component
 */
function ImageSlider(config) {
  config = config || {};

  // Default configuration
  const defaultConfig = {
    maxZoom: 3,
    minZoom: 0.5,
    zoomStep: 0.2,
    enableKeyboard: true,
    enableTouch: true,
    enableWheel: true,
    useSignedUrls: false,
    onOpen: null,
    onClose: null,
    onImageChange: null,
    onZoomChange: null,
  };

  // Merge configurations
  const finalConfig = Object.assign({}, defaultConfig, config);

  // State variables
  const state = {
    attachments: [],
    currentIndex: 0,
    zoomLevel: 1,
    translateX: 0,
    translateY: 0,
    isOpen: false,
    $modal: null,
  };

  // URL Strategy
  const urlStrategy = finalConfig.useSignedUrls
    ? SignedUrlStrategy()
    : DirectUrlStrategy();

  // Event Handlers
  let zoomHandler, navigationHandler, keyboardHandler, dragHandler;

  // Public API
  const slider = {
    // Getters for handlers to access state
    get zoomLevel() {
      return state.zoomLevel;
    },
    set zoomLevel(value) {
      state.zoomLevel = value;
    },
    get translateX() {
      return state.translateX;
    },
    set translateX(value) {
      state.translateX = value;
    },
    get translateY() {
      return state.translateY;
    },
    set translateY(value) {
      state.translateY = value;
    },
    get isOpen() {
      return state.isOpen;
    },
    get currentIndex() {
      return state.currentIndex;
    },
    get attachments() {
      return state.attachments;
    },

    /**
     * Open the slider with attachments
     */
    async open(attachments, startIndex) {
      startIndex = startIndex || 0;

      if (!attachments || attachments.length === 0) {
        console.warn("No attachments provided to slider");
        return;
      }

      state.currentIndex = Math.max(
        0,
        Math.min(startIndex, attachments.length - 1)
      );

      // Show loading state
      this.showModal();
      this.showLoading();

      try {
        // Resolve URLs using strategy
        state.attachments = await urlStrategy.resolveUrls(attachments);
        state.isOpen = true;

        // Initialize handlers after state is ready
        zoomHandler = ZoomHandler(this);
        navigationHandler = NavigationHandler(this);
        keyboardHandler = KeyboardHandler(this);
        dragHandler = DragHandler(this);

        // Render the slider
        this.render();
        this.bindEvents();

        // Callback
        if (finalConfig.onOpen) {
          finalConfig.onOpen(state.currentIndex, state.attachments);
        }
      } catch (error) {
        console.error("Failed to open slider:", error);
        this.showError("Failed to load images");
      }
    },

    /**
     * Close the slider
     */
    close() {
      if (!state.isOpen) return;

      state.isOpen = false;
      this.unbindEvents();

      if (state.$modal) {
        state.$modal.remove();
        state.$modal = null;
      }

      // Callback
      if (finalConfig.onClose) {
        finalConfig.onClose();
      }
    },

    /**
     * Navigate to previous image
     */
    previousImage() {
      if (state.attachments.length <= 1) return;

      state.currentIndex =
        (state.currentIndex - 1 + state.attachments.length) %
        state.attachments.length;
      this.updateImage();
    },

    /**
     * Navigate to next image
     */
    nextImage() {
      if (state.attachments.length <= 1) return;

      state.currentIndex = (state.currentIndex + 1) % state.attachments.length;
      this.updateImage();
    },

    /**
     * Go to specific image
     */
    goToImage(index) {
      if (index < 0 || index >= state.attachments.length) return;

      state.currentIndex = index;
      this.updateImage();
    },

    /**
     * Zoom in
     */
    zoomIn() {
      if (state.zoomLevel >= finalConfig.maxZoom) return;

      state.zoomLevel = Math.min(
        finalConfig.maxZoom,
        state.zoomLevel + finalConfig.zoomStep
      );
      this.updateImageTransform();
      this.updateZoomControls();
    },

    /**
     * Zoom out
     */
    zoomOut() {
      if (state.zoomLevel <= finalConfig.minZoom) return;

      state.zoomLevel = Math.max(
        finalConfig.minZoom,
        state.zoomLevel - finalConfig.zoomStep
      );

      // Reset translation if zoom level is 1 or less
      if (state.zoomLevel <= 1) {
        state.translateX = 0;
        state.translateY = 0;
      }

      this.updateImageTransform();
      this.updateZoomControls();
    },

    /**
     * Reset zoom to 100%
     */
    resetZoom() {
      state.zoomLevel = 1;
      state.translateX = 0;
      state.translateY = 0;
      this.updateImageTransform();
      this.updateZoomControls();
    },

    /**
     * Show the modal container
     */
    showModal() {
      const modalHtml = `
        <div class="image-slider-modal">
          <div class="slider-overlay"></div>
          <div class="slider-container">
            <button class="slider-close-btn">&times;</button>
            <div class="slider-zoom-controls">
              <button class="slider-zoom-btn slider-zoom-in-btn" title="Zoom In">
                <i class="fas fa-plus"></i>
              </button>
              <button class="slider-zoom-btn slider-zoom-out-btn" title="Zoom Out">
                <i class="fas fa-minus"></i>
              </button>
              <button class="slider-zoom-btn slider-zoom-reset-btn" title="Reset Zoom">
                <i class="fas fa-expand-arrows-alt"></i>
              </button>
            </div>
            <div class="slider-zoom-level">100%</div>
            <div class="slider-content"></div>
            <button class="slider-nav-btn slider-prev-btn" title="Previous Image">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button class="slider-nav-btn slider-next-btn" title="Next Image">
              <i class="fas fa-chevron-right"></i>
            </button>
            <div class="slider-counter"></div>
          </div>
        </div>
      `;

      $("body").append(modalHtml);
      state.$modal = $(".image-slider-modal").last();
    },

    /**
     * Show loading state
     */
    showLoading() {
      const loadingHtml = `
        <div class="slider-loading">
          <i class="fas fa-spinner fa-spin"></i>
          Loading images...
        </div>
      `;
      state.$modal.find(".slider-content").html(loadingHtml);
    },

    /**
     * Show error state
     */
    showError(message) {
      const errorHtml = `
        <div class="slider-error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>${message}</p>
        </div>
      `;
      state.$modal.find(".slider-content").html(errorHtml);
    },

    /**
     * Render the current image
     */
    render() {
      if (!state.attachments.length) return;

      const currentAttachment = state.attachments[state.currentIndex];

      if (currentAttachment.error) {
        this.showError(
          currentAttachment.errorMessage || "Failed to load image"
        );
        return;
      }
      let imageHtml = ""
      if(currentAttachment?.type === "audio" || currentAttachment?.meta?.type){
      imageHtml = `<audio controls src="${currentAttachment.url}" preload="metadata" ${
              state.currentIndex + 1
          }" ></audio>`
      }else{
        imageHtml=`<img src="${currentAttachment.url}" alt="Image ${
        state.currentIndex + 1
      }" />`;
      }
      state.$modal.find(".slider-content").html(imageHtml);

      this.updateCounter();
      this.updateNavigationButtons();
      this.resetZoom();
    },

    /**
     * Update to current image
     */
    updateImage() {
      this.render();

      if (finalConfig.onImageChange) {
        finalConfig.onImageChange(
          state.currentIndex,
          state.attachments[state.currentIndex]
        );
      }
    },

    /**
     * Update image transform for zoom and pan
     */
    updateImageTransform() {
      const $img = state.$modal.find(".slider-content img");

      $img.css(
        "transform",
        `scale(${state.zoomLevel}) translate(${state.translateX}px, ${state.translateY}px)`
      );

      if (state.zoomLevel > 1) {
        $img.addClass("zoomed");
      } else {
        $img.removeClass("zoomed");
      }

      if (finalConfig.onZoomChange) {
        finalConfig.onZoomChange(state.zoomLevel);
      }
    },

    /**
     * Update zoom controls state
     */
    updateZoomControls() {
      state.$modal
        .find(".slider-zoom-level")
        .text(`${Math.round(state.zoomLevel * 100)}%`);

      // Update button states
      state.$modal
        .find(".slider-zoom-in-btn")
        .prop("disabled", state.zoomLevel >= finalConfig.maxZoom);
      state.$modal
        .find(".slider-zoom-out-btn")
        .prop("disabled", state.zoomLevel <= finalConfig.minZoom);
    },

    /**
     * Update navigation buttons state
     */
    updateNavigationButtons() {
      const hasMultipleImages = state.attachments.length > 1;

      state.$modal.find(".slider-prev-btn").toggle(hasMultipleImages);
      state.$modal.find(".slider-next-btn").toggle(hasMultipleImages);
    },

    /**
     * Update counter display
     */
    updateCounter() {
      state.$modal
        .find(".slider-counter")
        .text(`${state.currentIndex + 1} / ${state.attachments.length}`);
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
      // Close events
      state.$modal
        .find(".slider-close-btn, .slider-overlay")
        .on("click", () => this.close());

      // Zoom events
      state.$modal
        .find(".slider-zoom-in-btn")
        .on("click", () => zoomHandler.handle(null, { type: "zoom-in" }));
      state.$modal
        .find(".slider-zoom-out-btn")
        .on("click", () => zoomHandler.handle(null, { type: "zoom-out" }));
      state.$modal
        .find(".slider-zoom-reset-btn")
        .on("click", () => zoomHandler.handle(null, { type: "zoom-reset" }));

      // Navigation events
      state.$modal
        .find(".slider-prev-btn")
        .on("click", () =>
          navigationHandler.handle(null, { type: "previous" })
        );
      state.$modal
        .find(".slider-next-btn")
        .on("click", () => navigationHandler.handle(null, { type: "next" }));

      // Keyboard events
      if (finalConfig.enableKeyboard) {
        $(document).on("keydown.imageSlider", (e) =>
          keyboardHandler.handle(e, {})
        );
      }

      // Mouse wheel zoom
      if (finalConfig.enableWheel) {
        state.$modal
          .find(".slider-content")
          .on("wheel", (e) => zoomHandler.handle(e, { type: "wheel" }));
      }

      // Drag events for zoomed images
      state.$modal
        .find(".slider-content")
        .on("mousedown", "img", (e) =>
          dragHandler.handle(e, { type: "mousedown" })
        );
      $(document).on("mousemove.imageSlider", (e) =>
        dragHandler.handle(e, { type: "mousemove" })
      );
      $(document).on("mouseup.imageSlider", (e) =>
        dragHandler.handle(e, { type: "mouseup" })
      );

      // Touch events
      if (finalConfig.enableTouch) {
        state.$modal
          .find(".slider-content")
          .on("touchstart", "img", (e) =>
            dragHandler.handle(e, { type: "touchstart" })
          );
        $(document).on("touchmove.imageSlider", (e) =>
          dragHandler.handle(e, { type: "touchmove" })
        );
        $(document).on("touchend.imageSlider", (e) =>
          dragHandler.handle(e, { type: "touchend" })
        );
      }
    },

    /**
     * Unbind event listeners
     */
    unbindEvents() {
      $(document).off(".imageSlider");
    },
  };

  return slider;
}

/**
 * Global function to open image slider
 */
function openImageSlider(attachments, startIndex, config) {
  startIndex = startIndex || 0;
  config = config || {};

  const slider = ImageSlider(config);
  slider.open(attachments, startIndex);
  return slider;
}

/**
 * Shortcut for opening with signed URLs
 */
function openImageSliderWithSignedUrls(attachments, startIndex, config) {
  startIndex = startIndex || 0;
  config = config || {};

  return openImageSlider(attachments, startIndex, {
    useSignedUrls: true,
    ...config,
  });
}

/**
 * Shortcut for opening with direct URLs
 */
function openImageSliderWithDirectUrls(attachments, startIndex, config) {
  startIndex = startIndex || 0;
  config = config || {};

  return openImageSlider(attachments, startIndex, {
    useSignedUrls: false,
    ...config,
  });
}
