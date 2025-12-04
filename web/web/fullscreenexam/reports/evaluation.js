// Utility functions following Single Responsibility Principle
const EvaluationUtils = {
  isImageAttachment(url) {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
    return imageExtensions.some((ext) => url.toLowerCase().includes(ext));
  },

  getDocumentDisplayName(url, index) {
    const urlParts = url.split("/");
    const filename = urlParts[urlParts.length - 1];
    const cleanFilename = filename.replace(
      /_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/g,
      ""
    );
    return cleanFilename && cleanFilename.length > 0
      ? cleanFilename
      : `Document ${index + 1}`;
  },

  getDocumentType(url) {
    const typeMap = {
      ".pdf": "pdf",
      wordprocessingml: "docx",
      ".docx": "docx",
      ".doc": "doc",
      ".xlsx": "xlsx",
      ".pptx": "pptx",
    };

    const foundType = Object.keys(typeMap).find((key) => url.includes(key));
    return foundType ? typeMap[foundType] : "file";
  },

  getDocumentIcon(fileType) {
    const iconMap = {
      pdf: "bx-file-pdf",
      docx: "bx-file-doc",
      doc: "bx-file-doc",
      xlsx: "bx-spreadsheet",
      pptx: "bx-file-presentation",
      file: "bx-file",
    };
    return iconMap[fileType] || "bx-file";
  },

  // Array utilities
  filterArrayByType(attachments, filterFn) {
    return attachments.filter(filterFn);
  },

  // String utilities
  generateAttachmentUrls(attachments) {
    return attachments.map((attachment) => attachment.url).join(",");
  },

  // DOM utilities
  createLoadingToast(message) {
    return $(`
      <div class="loading-toast">
        <i class="bx bx-loader-alt bx-spin"></i>
        <span>${message}</span>
      </div>
    `);
  },
};

// Event handling following Single Responsibility Principle
const EvaluationEvents = {
  init() {
    this.setupFilterEvents();
    this.setupMarksEvents();
    this.setupAttachmentEvents();
    this.setupModalEvents();
    this.setupGalleryEvents();
    this.setupCaptureEvents();
  },

  setupFilterEvents() {
    $(".filter-tab").on("click", this.handleFilterClick.bind(this));
  },

  setupMarksEvents() {
    $(document).on("input", ".marks-input", this.handleMarksInput.bind(this));
  },

  setupAttachmentEvents() {
    $(document).on(
      "click",
      ".attachment-thumbnail-image",
      this.handleAttachmentImageClick.bind(this)
    );
    $(document).on(
      "click",
      ".question-attachment-link",
      this.handleQuestionAttachment.bind(this)
    );
    $(document).on(
      "click",
      ".document-item, .view-document-btn, .attachment-thumbnail-doc",
      this.handleDocumentView.bind(this)
    );
    $(document).on(
      "click",
      ".document-item-inline, .view-document-btn-inline",
      this.handleDocumentView.bind(this)
    );
    $(document).on(
      "click",
      ".view-digital-writing-btn",
      this.handleViewDigitalWriting.bind(this)
    );
  },

  setupModalEvents() {
    $(document).on(
      "click",
      "#attachment-modal, .modal-close",
      this.handleModalClose.bind(this)
    );
    $(document).on("keydown", this.handleKeyboardEvents.bind(this));
  },

  setupGalleryEvents() {
    $(document).on("click", ".prev-btn", this.handleGalleryPrevious.bind(this));
    $(document).on("click", ".next-btn", this.handleGalleryNext.bind(this));
    $(document).on("click", ".thumbnail", this.handleThumbnailClick.bind(this));
  },

  setupCaptureEvents() {
    $(document).on(
      "click",
      ".capture-thumbnail",
      this.handleCaptureThumbnailClick.bind(this)
    );
  },

  handleFilterClick(e) {
    const filter = $(e.currentTarget).data("filter");
    EvaluationController.handleFilterChange(filter);
  },

  handleMarksInput(e) {
    const studentId = $(e.target).data("student-id");
    const marks = $(e.target).val();

    clearTimeout($(e.target).data("timeout"));
    $(e.target).data(
      "timeout",
      setTimeout(() => {
        if (marks && marks.trim() !== "") {
          EvaluationController.handleSaveMarks(studentId, marks);
        }
      }, 500)
    );
  },

  handleQuestionAttachment(e) {
    const $element = $(e.currentTarget);
    const url = $element.data("url");
    const name = $element.data("name");
    const type = $element.data("type");
    EvaluationUI.openAttachmentModal(url, name, type);
  },

  handleDocumentView(e) {
    e.stopPropagation();
    const $item = $(e.currentTarget).closest(
      ".document-item, .document-item-inline, .attachment-thumbnail-doc"
    );
    const url = $item.data("url");
    const name = $item.data("name");
    const type = $item.data("type");
    EvaluationUI.openDocumentInNewTab(url, name, type);
  },

  handleViewDigitalWriting(e) {
    const studentId = $(e.currentTarget).data("student-id");
    const digitalInk = EvaluationUI.digitalInkStore.get(studentId);
    EvaluationUI.showDigitalWritingPopup(digitalInk);
  },

  handleModalClose(event) {
    if (
      $(event.target).is("#attachment-modal") ||
      $(event.target).is(".modal-close")
    ) {
      EvaluationUI.closeModal();
    }
  },

  handleKeyboardEvents(event) {
    if (event.key === "Escape") {
      EvaluationUI.closeModal();
    }

    if ($("#attachment-modal").hasClass("show")) {
      const galleryState = EvaluationUI.getGalleryState();
      if (galleryState) {
        if (event.key === "ArrowLeft" && galleryState.currentIndex > 0) {
          EvaluationUI.updateGalleryImage(
            galleryState.currentIndex - 1,
            galleryState.urls
          );
        } else if (
          event.key === "ArrowRight" &&
          galleryState.currentIndex < galleryState.urls.length - 1
        ) {
          EvaluationUI.updateGalleryImage(
            galleryState.currentIndex + 1,
            galleryState.urls
          );
        }
      }
    }
  },

  handleGalleryPrevious() {
    const galleryState = EvaluationUI.getGalleryState();
    if (galleryState && galleryState.currentIndex > 0) {
      EvaluationUI.updateGalleryImage(
        galleryState.currentIndex - 1,
        galleryState.urls
      );
    }
  },

  handleGalleryNext() {
    const galleryState = EvaluationUI.getGalleryState();
    if (
      galleryState &&
      galleryState.currentIndex < galleryState.urls.length - 1
    ) {
      EvaluationUI.updateGalleryImage(
        galleryState.currentIndex + 1,
        galleryState.urls
      );
    }
  },

  handleThumbnailClick(e) {
    const index = parseInt($(e.currentTarget).data("index"));
    const galleryState = EvaluationUI.getGalleryState();
    if (galleryState) {
      EvaluationUI.updateGalleryImage(index, galleryState.urls);
    }
  },

  handleAttachmentImageClick(e) {
    const $thumb = $(e.currentTarget);
    const studentId = $thumb.data("student-id");
    const $container = $(`#attachments-${studentId}`);
    const attachments = $container.data("attachments");
    const clickedAttachmentUrl = $thumb.data("url");

    if (attachments && attachments.length > 0) {
      const imageUrls = attachments
        .filter((a) => EvaluationUtils.isImageAttachment(a.url))
        .map((a) => a.url);

      const startIndex = imageUrls.indexOf(clickedAttachmentUrl);

      // Use centralized image slider with signed URLs
      const attachmentsForSlider = imageUrls.map((url) => ({ url }));
      openImageSliderWithSignedUrls(
        attachmentsForSlider,
        startIndex >= 0 ? startIndex : 0
      );
    }
  },

  handleCaptureThumbnailClick(e) {
    const $thumb = $(e.currentTarget);
    // Skip if this is an audio capture
    if ($thumb.hasClass("audio-capture")) {
      return;
    }

    const studentId = $thumb.data("student-id");
    const startIndex = $thumb.data("index");
    const $container = $(`#captures-${studentId}`);
    const captures = $container.data("captures");

    if (captures && captures.length > 0) {
      // Filter out audio captures for the image slider
      const urls = captures
        .filter((c) => c.meta?.type !== "audio")
        .map((c) => c.url);
      // Use centralized image slider with signed URLs
      const attachmentsForSlider = urls.map((url) => ({ url }));
      openImageSliderWithSignedUrls(attachmentsForSlider, startIndex);
    }
  },
};

// UI Layer - Handles all DOM manipulation and rendering
const EvaluationUI = {
  galleryState: {
    currentIndex: 0,
    urls: [],
  },
  digitalInkStore: new Map(), // Store digital writing data by student ID
  signedUrlCache: new Map(), // Cache signed URLs to prevent repeated API calls
  loadedThumbnails: new Set(), // Track which thumbnails have been loaded

  init() {
    EvaluationEvents.init();
  },

  // Gallery state management
  getGalleryState() {
    return this.galleryState;
  },

  setGalleryState(index, urls) {
    this.galleryState.currentIndex = index;
    this.galleryState.urls = urls;
  },

openAttachmentModal(attachmentUrl, attachmentName, attachmentType) {
  const $modal = $("#attachment-modal");
  const $modalTitle = $("#attachment-modal-title");
  const $attachmentContent = $("#attachment-content");

  $modal.addClass("show");
  $modalTitle.text(attachmentName);
  $attachmentContent.empty();

  if (attachmentType === "application") {
    // Add cache busting to initial URL as well
    $attachmentContent.html(
      `<object data="${attachmentUrl}" class="pdf" type="application/pdf" onerror="handleImageError(this)"></object>`
    );
  } else if(attachmentType === "audio") {
    $attachmentContent.html(
      `<audio controls src="${attachmentUrl}" onerror="handleImageError(this)">Your browser does not support the audio element.</audio>`
    );
  } else {
    $attachmentContent.html(
      this.createImageViewHtml(attachmentUrl, attachmentName)
    );
  }
},

  closeModal() {
    $("#attachment-modal").removeClass("show");
    $("#attachment-content").empty();
    $(document).off("keydown.gallery");
  },

  openDocumentInNewTab(url, name, type) {
    const $loadingToast = EvaluationUtils.createLoadingToast(
      `Opening ${name}...`
    );
    $("body").append($loadingToast);

    getSignedUrl(url, null, {
      appendPDF: (signedUrl) => {
        $loadingToast.remove();
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      },
      onError: () => {
        $loadingToast.remove();
        toastr.error(`Failed to load ${name}. Please try again.`);
      },
    });
  },

  // Document operations
  renderDocumentList(documentUrls, $container) {
    const documentItems = documentUrls
      .map((url, index) => {
        const fileName = EvaluationUtils.getDocumentDisplayName(url, index);
        const fileType = EvaluationUtils.getDocumentType(url);

        return this.createDocumentItemHtml(url, fileName, fileType);
      })
      .join("");

    $container.html(this.createDocumentListHtml(documentItems));
  },

  // Gallery operations
  loadGalleryImages(imageUrls, $container, startIndex = 0) {
    if (imageUrls.length === 0) return;

    const signedUrls = [];
    let loadedCount = 0;

    imageUrls.forEach((url, index) => {
      const $img = $("<img>").hide();
      const $mockContainer = $("<div>").append($img);

      getSignedUrl(url, $img, $mockContainer);

      $img.on("load error", () => {
        signedUrls[index] = $img.on("load") ? $img.attr("src") : null;
        loadedCount++;
        if (loadedCount === imageUrls.length) {
          this.renderImageGallery(signedUrls, $container, startIndex);
        }
      });
    });
  },

  renderImageGallery(signedUrls, $container, startIndex = 0) {
    const validUrls = signedUrls.filter((url) => url !== null);

    if (validUrls.length === 0) {
      $container.html(this.createErrorHtml("No images to display"));
      return;
    }

    this.setGalleryState(startIndex, validUrls);
    $container.html(this.createGalleryHtml(validUrls, startIndex));
  },

  updateGalleryImage(index, urls) {
    this.setGalleryState(index, urls);

    const $container = $("#attachment-content");
    const $mainImage = $container.find(".gallery-main-image");
    const $currentCounter = $container.find(".current-image");
    const $prevBtn = $container.find(".prev-btn");
    const $nextBtn = $container.find(".next-btn");
    const $thumbnails = $container.find(".thumbnail");

    $mainImage.attr("src", urls[index]).attr("alt", `Attachment ${index + 1}`);
    $currentCounter.text(index + 1);
    $prevBtn.prop("disabled", index === 0);
    $nextBtn.prop("disabled", index === urls.length - 1);
    $thumbnails.removeClass("active").eq(index).addClass("active");
  },

  // Question and student response rendering
  renderQuestionDetails(data) {
    this.updateQuestionBadge(data.type);
    this.updateQuestionInfo(data);
    this.renderQuestionAttachments(data.attachments);
  },

  updateQuestionBadge(type) {
    const $badge = $("#question-type-badge");
    $badge.text(type).removeClass("saq ftb mcq").addClass(type.toLowerCase());
  },

  updateQuestionInfo(data) {
    $("#marks-info").text(`Marks: ${data.marks}`);
    $("#max-marks").text(data.marks);
    $("#question-text").html(data.question);

    if (data.answerKey) {
      $("#answer-key-section").show();
      $("#answer-key-content").html(data.answerKey);
    }
  },

  renderQuestionAttachments(attachments) {
    if (attachments && attachments.length > 0) {
      $("#question-attachments").show();
      this.renderAttachmentsList(attachments);
    }
  },

  renderAttachmentsList(attachments) {
    const $attachmentsList = $("#attachments-list");
    $attachmentsList.empty();

    attachments.forEach((attachment, index) => {
      const displayName = `Attachment ${index + 1}`;
      const $attachmentDiv = $(
        this.createAttachmentItemHtml(
          attachment.url,
          displayName,
          attachment.type
        )
      );
      $attachmentsList.append($attachmentDiv);
    });
  },

  renderStudentResponses(responses, isMarksUpdate = false) {
    const questionType = EvaluationController.state.questionData?.type;
    const $studentsList = $("#students-list");

    if (responses.length === 0) {
      $studentsList.html(this.createNoDataHtml());
      return;
    }

    const html = responses
      .map((response) => this.createStudentRowHtml(response,questionType))
      .join("");
    $studentsList.html(html);

    // Only load thumbnails if this is NOT a marks update
    if (!isMarksUpdate) {
      responses.forEach((response) => {
        if (response.studentsAttachments && response.studentsAttachments.length > 0) {
          this.loadAttachmentThumbnails(response._id);
        }
        if (response.captures && response.captures.length > 0) {
          this.loadCaptureThumbnails(response._id);
        }
      });
    } else {
      // For marks updates, restore cached signed URLs
      this.restoreCachedThumbnails(responses);
    }
  },

  loadAttachmentThumbnails(studentId) {
    // Check if already loaded
    if (this.loadedThumbnails.has(`attachments-${studentId}`)) {
      return;
    }

    const $container = $(`#attachments-${studentId}`);
    if (!$container.length) return;

    const $thumbnails = $container.find(".attachment-thumbnail-image");

    $thumbnails.each((index, element) => {
      const $thumb = $(element);
      const $img = $thumb.find("img");
      const $loader = $thumb.find(".attachment-thumbnail-loader");
      const url = $img.data("src");
      const cacheKey = `attachment-${studentId}-${index}-${url}`;

      // Check cache first
      if (this.signedUrlCache.has(cacheKey)) {
        const signedUrl = this.signedUrlCache.get(cacheKey);
        $img.attr("src", signedUrl);
        $loader.remove();
        return;
      }

      // Load and cache
      getSignedUrl(url, null, {
        appendPDF: (signedUrl) => {
          this.signedUrlCache.set(cacheKey, signedUrl);
          $img.attr("src", signedUrl);
          $loader.remove();
        },
        onError: () => {
          $loader.html('<i class="bx bx-error-alt"></i>');
        },
      });
    });

    // Mark as loaded
    this.loadedThumbnails.add(`attachments-${studentId}`);
  },

  loadCaptureThumbnails(studentId) {
    // Check if already loaded
    if (this.loadedThumbnails.has(`captures-${studentId}`)) {
      return;
    }

    const $container = $(`#captures-${studentId}`);
    if (!$container.length) return;

    const $thumbnails = $container.find(".capture-thumbnail");

    $thumbnails.each((index, element) => {
      const $thumb = $(element);
      const isAudio = $thumb.hasClass("audio-capture");
      const $media = isAudio ? $thumb.find("audio") : $thumb.find("img");
      const $loader = $thumb.find(".capture-thumbnail-loader");
      const url = $media.data("src");
      const cacheKey = `capture-${studentId}-${index}-${url}`;

      // Check cache first
      if (this.signedUrlCache.has(cacheKey)) {
        const signedUrl = this.signedUrlCache.get(cacheKey);
        $media.attr("src", signedUrl);
        $loader.remove();
        return;
      }

      // Load and cache
      getSignedUrl(url, null, {
        appendPDF: (signedUrl) => {
          this.signedUrlCache.set(cacheKey, signedUrl);
          $media.attr("src", signedUrl);
          $loader.remove();
        },
        onError: () => {
          $loader.html('<i class="bx bx-error-alt"></i>');
        },
      });
    });

    // Mark as loaded
    this.loadedThumbnails.add(`captures-${studentId}`);
  },

  restoreCachedThumbnails(responses) {
    responses.forEach((response) => {
      // Restore attachment thumbnails
      if (response.studentsAttachments && response.studentsAttachments.length > 0) {
        const $container = $(`#attachments-${response._id}`);
        const $thumbnails = $container.find(".attachment-thumbnail-image");
        
        $thumbnails.each((index, element) => {
          const $thumb = $(element);
          const $img = $thumb.find("img");
          const $loader = $thumb.find(".attachment-thumbnail-loader");
          const url = $img.data("src");
          const cacheKey = `attachment-${response._id}-${index}-${url}`;

          if (this.signedUrlCache.has(cacheKey)) {
            const signedUrl = this.signedUrlCache.get(cacheKey);
            $img.attr("src", signedUrl);
            $loader.remove();
          }
        });
      }

      // Restore capture thumbnails
      if (response.captures && response.captures.length > 0) {
        const $container = $(`#captures-${response._id}`);
        const $thumbnails = $container.find(".capture-thumbnail");
        
        $thumbnails.each((index, element) => {
          const $thumb = $(element);
          const isAudio = $thumb.hasClass("audio-capture");
          const $media = isAudio ? $thumb.find("audio") : $thumb.find("img");
          const $loader = $thumb.find(".capture-thumbnail-loader");
          const url = $media.data("src");
          const cacheKey = `capture-${response._id}-${index}-${url}`;

          if (this.signedUrlCache.has(cacheKey)) {
            const signedUrl = this.signedUrlCache.get(cacheKey);
            $media.attr("src", signedUrl);
            $loader.remove();
          }
        });
      }
    });
  },

  // Method to update only marks without re-rendering everything
  updateStudentMarks(studentId, marks, evaluationStatus) {
    const $row = $(`tr[data-student-id="${studentId}"]`);
    if ($row.length) {
      // Update marks input
      const $marksInput = $row.find('.marks-input');
      $marksInput.val(marks);

      // Update status badge
      const $statusBadge = $row.find('.status-badge-inline');
      $statusBadge.removeClass('pending evaluated').addClass(evaluationStatus);
      $statusBadge.text(evaluationStatus === 'evaluated' ? 'Evaluated' : 'Pending');
    }
  },

  // Clear cache when needed (optional)
  clearSignedUrlCache() {
    this.signedUrlCache.clear();
    this.loadedThumbnails.clear();
  },

  createStudentRowHtml(response,questionType) {
    const isEvaluated = response.evaluationStatus === "evaluated";
    const marksValue = response.marks !== null ? response.marks : "";
    const statusBadge = isEvaluated ? "evaluated" : "pending";
    const statusText = isEvaluated ? "Evaluated" : "Pending";
    const studentAttachmentsHtml = this.generateStudentAttachmentsHtml(
      response.studentsAttachments,
      response._id
    );
    const studentCapturesHtml = this.generateStudentCapturesHtml(
      response.captures,
      response._id
    );
    // Store digital writing data for later retrieval
    if (response.digitalInk && response.digitalInk.length > 0) {
      EvaluationUI.digitalInkStore.set(response._id, response.digitalInk);
    }
const programmingResponse= escapeHtml(response.response || response.responses || "");
    return `
      <tr data-student-id="${response._id}">
        <td class="student-id-cell">
          <div class="student-id">Anonymous</div>
          <span class="status-badge-inline ${statusBadge}">${statusText}</span>
        </td>
        <td class="student-response-cell">
          ${
            response.digitalInk && response.digitalInk.length > 0
              ? `<button class="view-digital-writing-btn" data-student-id="${response._id}">View Digital Writing</button>`
              : `<div class="response-text">
    ${
          questionType === "PRQ"
          ? `<pre><code>${programmingResponse}</code></pre>`
          : `${response.response || response.responses || ""}`
           }
         </div>`
          }
          ${studentAttachmentsHtml}
          ${studentCapturesHtml}
        </td>
        <td class="marks-cell">
          <div class="marks-input-inline">
            <input type="number" class="marks-input" min="0" 
                   value="${marksValue}" placeholder="0" data-student-id="${
      response._id
    }"/>
          </div>
        </td>
      </tr>
    `;
  },

  generateStudentAttachmentsHtml(attachments, studentId) {
    if (!attachments || attachments.length === 0) {
      return "";
    }

    const thumbnailsHtml = attachments
      .map((attachment, index) => {
        const url = attachment.url;
        if (EvaluationUtils.isImageAttachment(url)) {
          return `
            <div class="attachment-thumbnail-image" data-student-id="${studentId}" data-url="${url}">
                <img src="" data-src="${url}" alt="Attachment ${index + 1}">
                <div class="attachment-thumbnail-loader">
                    <i class='bx bx-loader-alt bx-spin'></i>
                </div>
            </div>
          `;
        } else {
          const fileType = EvaluationUtils.getDocumentType(url);
          const fileName = EvaluationUtils.getDocumentDisplayName(url, index);
          const iconClass = EvaluationUtils.getDocumentIcon(fileType);
          return `
            <div class="attachment-thumbnail-doc" data-url="${url}" data-name="${fileName}" data-type="${fileType}">
                <i class="bx ${iconClass}"></i>
                <span class="attachment-doc-name">${
                  fileName.length > 15
                    ? fileName.substring(0, 15) + "..."
                    : fileName
                }</span>
            </div>
          `;
        }
      })
      .join("");

    return `
        <div class="student-attachments-container" id="attachments-${studentId}" data-attachments='${JSON.stringify(
      attachments
    )}'>
            <div class="attachments-grid">${thumbnailsHtml}</div>
        </div>
    `;
  },

  generateStudentCapturesHtml(captures, studentId) {
    if (!captures || captures.length === 0) {
      return "";
    }

    const thumbnailsHtml = captures
      .map((capture, index) => {
        const isAudio = capture.meta?.type === "audio";

        if (isAudio) {
          return `
            <div class="capture-thumbnail audio-capture">
                <audio controls src="" data-src="${capture.url}" class="audio-player"></audio>
                <div class="capture-thumbnail-loader">
                    <i class='bx bx-loader-alt bx-spin'></i>
                </div>
            </div>
          `;
        }

        return `
            <div class="capture-thumbnail" data-student-id="${studentId}" data-index="${index}">
<img src="" data-src="${capture.url}" alt="Capture ${index + 1}">
                <div class="capture-thumbnail-loader">
                    <i class='bx bx-loader-alt bx-spin'></i>
                </div>
            </div>
        `;
      })
      .join("");

    return `
        <div class="student-captures-container" id="captures-${studentId}" data-captures='${JSON.stringify(
      captures
    )}'>
            <div class="captures-grid">${thumbnailsHtml}</div>
        </div>
    `;
  },

  // HTML template creators
  createGalleryLoadingHtml() {
    return `
      <div class="image-gallery">
        <div class="gallery-loading">
          <i class="bx bx-loader-alt bx-spin"></i>
          <p>Loading attachments...</p>
        </div>
      </div>
    `;
  },

  createDocumentListHtml(documentItems) {
    return `
      <div class="document-list">
        <div class="document-list-header">
          <i class="bx bx-file-blank"></i>
          <h3>Documents & Files</h3>
        </div>
        <div class="document-items">${documentItems}</div>
      </div>
    `;
  },

  createDocumentItemHtml(url, fileName, fileType) {
    return `
      <div class="document-item" data-url="${url}" data-name="${fileName}" data-type="${fileType}">
        <div class="document-info">
          <i class="bx ${EvaluationUtils.getDocumentIcon(fileType)}"></i>
          <div class="document-details">
            <span class="document-name">${fileName}</span>
            <span class="document-type">${fileType.toUpperCase()}</span>
          </div>
        </div>
        <div class="document-actions">
          <button class="view-document-btn">
            <i class="bx bx-show"></i>
            View
          </button>
        </div>
      </div>
    `;
  },

  createGalleryHtml(validUrls, startIndex = 0) {
    const thumbnailsHtml = validUrls
      .map(
        (url, index) =>
          `<div class="thumbnail ${
            index === startIndex ? "active" : ""
          }" data-index="${index}">
        <img src="${url}" alt="Thumbnail ${index + 1}">
      </div>`
      )
      .join("");

    return `
      <div class="image-gallery">
        <div class="gallery-main">
          <div class="gallery-navigation">
            <button class="nav-btn prev-btn" ${
              startIndex === 0 ? "disabled" : ""
            }>
              <i class="bx bx-chevron-left"></i>
            </button>
            <div class="gallery-image-container">
              <img src="${validUrls[startIndex]}" alt="Attachment ${
      startIndex + 1
    }" class="gallery-main-image">
            </div>
            <button class="nav-btn next-btn" ${
              startIndex >= validUrls.length - 1 ? "disabled" : ""
            }>
              <i class="bx bx-chevron-right"></i>
            </button>
          </div>
          <div class="gallery-counter">
            <span class="current-image">${
              startIndex + 1
            }</span> / <span class="total-images">${validUrls.length}</span>
          </div>
        </div>
        <div class="gallery-thumbnails">${thumbnailsHtml}</div>
      </div>
    `;
  },

  createImageViewHtml(url, name) {
    return `
      <img src="${url}" alt="${name}" onerror="handleImageError(this)"/>
      <div class="error-fallback">
        <i class="bx bx-image-alt"></i>
        <p>Unable to load image</p>
      </div>
    `;
  },

  createAttachmentItemHtml(url, displayName, type) {
    return `
      <div class="attachment-item question-attachment-link" data-url="${url}" data-name="${displayName}" data-type="${type}">
        <div class="attachment-info">
          <i class="bx bx-file"></i>
          <span class="attachment-name">${displayName}</span>
        </div>
        <div class="attachment-actions">
          <i class="bx bx-show eye-icon" title="View Attachment"></i>
        </div>
      </div>
    `;
  },

  createErrorHtml(message) {
    return `
      <div class="error">
        <i class="bx bx-error-circle"></i>
        <p>${message}</p>
      </div>
    `;
  },

  createNoDataHtml() {
    return `
      <tr class="no-data-row">
        <td colspan="3" class="no-data-state">
          <i class="bx bx-user-x"></i>
          <h3>No student responses found</h3>
          <p>No students match the current filter criteria.</p>
        </td>
      </tr>
    `;
  },

  // UI state management
  updateFilterCounts(all, pending, evaluated) {
    $("#all-count").text(all);
    $("#pending-count").text(pending);
    $("#evaluated-count").text(evaluated);
  },

  setActiveFilter(filter) {
    $(".filter-tab").removeClass("active");
    $(`.filter-tab[data-filter="${filter}"]`).addClass("active");
  },

  showQuestionLoading() {
    $("#question-text").html("Loading question details...");
  },

  showStudentResponsesLoading() {
    $("#students-list").html(`
      <tr class="loading-row">
        <td colspan="3" class="loading-state">
          <p>Loading student responses...</p>
        </td>
      </tr>
    `);
  },

  // Marks UI feedback
  showMarksSaving(studentId) {
    const $input = $(`[data-student-id="${studentId}"]`);
    if ($input.length) {
      const originalBorder = $input.css("border-color");
      $input.css("border-color", "#f59e0b");
      return originalBorder;
    }
  },

  showMarksSaved(studentId, originalBorder) {
    const $input = $(`[data-student-id="${studentId}"]`);
    if ($input.length) {
      $input.css("border-color", "#10b981");
      setTimeout(() => $input.css("border-color", originalBorder), 2000);
    }
  },

  showMarksError(studentId, originalBorder) {
    const $input = $(`[data-student-id="${studentId}"]`);
    if ($input.length) {
      $input.css("border-color", "#ef4444");
      setTimeout(() => $input.css("border-color", originalBorder), 2000);
    }
  },

showDigitalWritingPopup(digitalInk) {
    const $modal = $("#attachment-modal");
    const $modalTitle = $("#attachment-modal-title");
    const $attachmentContent = $("#attachment-content");

    // Show modal first
    $modal.addClass("show");
    $modalTitle.text("Digital Writing");

    // Create container
    $attachmentContent.html(`
      <div class='digital-writing-container' style='
        width: 100%;
        min-height: 500px;
        position: relative;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
        background: #fcfcfa;
      '>
        <div style='position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.1); padding: 5px; border-radius: 3px; font-size: 12px; z-index: 1000;'>
          Loading SketchWidget...
        </div>
      </div>
    `);

    // Helper to calculate height from strokes
    function getDrawingHeight(digitalInkData) {
        let maxY = 0;
        digitalInkData.forEach(stroke => {
            if (stroke.points && Array.isArray(stroke.points)) {
                stroke.points.forEach(point => {
                    if (point.y > maxY) maxY = point.y;
                });
            }
        });
        return maxY;
    }

    // Wait for modal to fully render
    setTimeout(() => {
        const containerElement = document.querySelector(".digital-writing-container");
        if (!containerElement) {
            $attachmentContent.html(
                '<div class="alert alert-danger">Digital writing container not found in DOM.</div>'
            );
            return;
        }

        try {
            if (typeof SketchWidget === "undefined") {
                console.error("SketchWidget is not loaded. Make sure sketch.js is included.");
                return;
            }

            // Default height
            let requiredHeight = 500;

            // If we have strokes, set height based on drawing
            if (Array.isArray(digitalInk) && digitalInk.length > 0) {
                const drawingHeight = getDrawingHeight(digitalInk) + 50; // add padding
                if (drawingHeight > requiredHeight) {
                    requiredHeight = drawingHeight;
                }
            }

            // Apply height
            containerElement.style.height = requiredHeight + "px";

            // Create widget with correct height
            let widget = new SketchWidget(containerElement, {
                width: "100%",
                height: requiredHeight + "px",
                tools: ["pencil", "pen", "marker", "eraser", "lasso", "ruler"],
                colors: ["#000000", "#FF3B30", "#007AFF", "#34C759", "#FF9500", "#FFCC00"],
                exportFormat: "json",
                showToolbar: true,
                toolbarPosition: "bottom",
                toolbarOrientation: "horizontal",
                toolbarDraggable: false,
                toolbarCollapsible: true,
                toolbarCollapsed: false,
                editable: false,
                readOnly: true,
            });

            widget.waitForReady().then(() => {
                // Remove loading indicator
                const loadingIndicator = containerElement.querySelector(
                    'div[style*="Loading SketchWidget"]'
                );
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }

                // Load strokes if available
                if (Array.isArray(digitalInk) && digitalInk.length > 0) {
                    widget.loadStrokes(digitalInk);
                } else {
                    const messageDiv = document.createElement("div");
                    messageDiv.style.cssText =
                        "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #666; font-size: 16px; text-align: center; background: rgba(255,255,255,0.9); padding: 20px; border-radius: 8px; border: 1px solid #ddd;";
                    messageDiv.innerHTML =
                        '<i class="fas fa-info-circle" style="margin-right: 8px;"></i>No digital writing data available';
                    containerElement.appendChild(messageDiv);
                }
            });

        } catch (error) {
            $attachmentContent.html(
                '<div class="alert alert-danger">Error creating digital writing widget: ' +
                error.message +
                "</div>"
            );
        }
    }, 500);
},
};

// Service layer following Single Responsibility Principle
const EvaluationService = {
  fetchEvaluationData(questionId, examId, successCallback, errorCallback) {
    makeApiCall({
      url: `${QUESTIONS_END_POINT}/response?questionId=${questionId}&entranceExamId=${examId}`,
      method: "GET",
      successCallback: function (response) {
        if (response.message === "Retrieved successfully") {
          const rawResponses = response.data.responses || [];
          let questionData = null;

          if (rawResponses.length > 0) {
            questionData = rawResponses[0].question;
          }

          const transformedResponses = rawResponses.map((item) => {
            const marks =
              item.awardedMarks !== undefined ? item.awardedMarks : null;
            const captures = item.captures || [];
            return {
              _id: item.student._id,
              email: item.attender.mail,
              response: item.studentResponse || "No response provided",
              digitalInk: item?.digitalInk || [],
              marks: marks,
              evaluationStatus: marks !== null ? "evaluated" : "pending",
              studentsAttachments: item.attachments || [],
              responses: item.responses || [],
              captures: captures,
            };
          });
          successCallback({
            question: questionData,
            responses: transformedResponses,
          });
        }
      },
      errorCallback: function (error) {
        console.error("Error fetching evaluation data:", error);
        errorCallback(error);
      },
    });
  },

  saveStudentMarks(
    questionId,
    examId,
    studentId,
    marks,
    successCallback,
    errorCallback
  ) {
    makeApiCall({
      url: `${STUDENT_END_POINT}/marks?studentId=${studentId}&questionId=${questionId}&entranceExamId=${examId}`,
      method: "PATCH",
      data: JSON.stringify({
        awardedMarks: marks,
      }),
      successCallback: function (response) {
        successCallback(response);
      },
      errorCallback: function (error) {
        errorCallback(error);
      },
    });
  },
};

// Controller layer following Single Responsibility Principle
const EvaluationController = {
  state: {
    currentQuestionId: null,
    currentExamId: null,
    questionData: null,
    studentResponses: [],
    filteredResponses: [],
    currentFilter: "all",
    maxMarks: 0,
  },

  init() {
    if (!this.validateInitialParams()) return;

    EvaluationUI.init();
    this.loadEvaluationData();
  },

  validateInitialParams() {
    const urlParams = new URLSearchParams(window.location.search);
    this.state.currentQuestionId = urlParams.get("questionId");
    this.state.currentExamId = urlParams.get("examId");

    if (!this.state.currentQuestionId || !this.state.currentExamId) {
      toastr.error("Missing required parameters");
      return false;
    }
    return true;
  },

  loadEvaluationData() {
    showLoader(true);
    EvaluationUI.showQuestionLoading();
    EvaluationUI.showStudentResponsesLoading();

    EvaluationService.fetchEvaluationData(
      this.state.currentQuestionId,
      this.state.currentExamId,
      (data) => this.handleEvaluationDataSuccess(data),
      (error) => this.handleEvaluationDataError(error)
    );
  },

  handleEvaluationDataSuccess(data) {
    const { question, responses } = data;

    if (question) {
      this.state.questionData = question;
      EvaluationUI.renderQuestionDetails(question);
    }

    this.state.studentResponses = responses;
    this.applyFilters(false); // Initial load - load thumbnails
    this.updateFilterCounts();
    showLoader(false);
  },

  handleEvaluationDataError(error) {
    toastr.error(error);
    showLoader(false);
  },

  handleFilterChange(filter) {
    this.state.currentFilter = filter;
    EvaluationUI.setActiveFilter(filter);
    this.applyFilters(false); // Filter change - load thumbnails for new results
  },

  applyFilters(isMarksUpdate = false) {
    this.state.filteredResponses = this.filterResponsesByStatus(
      this.state.currentFilter
    );
    EvaluationUI.renderStudentResponses(this.state.filteredResponses, isMarksUpdate);
  },

  filterResponsesByStatus(status) {
    if (status === "pending") {
      return this.state.studentResponses.filter(
        (response) => response.evaluationStatus === "pending"
      );
    } else if (status === "evaluated") {
      return this.state.studentResponses.filter(
        (response) => response.evaluationStatus === "evaluated"
      );
    }
    return this.state.studentResponses;
  },

  updateFilterCounts() {
    const counts = this.calculateFilterCounts();
    EvaluationUI.updateFilterCounts(
      counts.all,
      counts.pending,
      counts.evaluated
    );
  },

  calculateFilterCounts() {
    const allCount = this.state.studentResponses.length;
    const pendingCount = this.state.studentResponses.filter(
      (r) => r.evaluationStatus === "pending"
    ).length;
    const evaluatedCount = this.state.studentResponses.filter(
      (r) => r.evaluationStatus === "evaluated"
    ).length;

    return { all: allCount, pending: pendingCount, evaluated: evaluatedCount };
  },

  handleSaveMarks(studentId, marks) {
    const originalBorder = EvaluationUI.showMarksSaving(studentId);

    EvaluationService.saveStudentMarks(
      this.state.currentQuestionId,
      this.state.currentExamId,
      studentId,
      marks,
      () => this.handleMarksSaveSuccess(studentId, marks, originalBorder),
      (error) => this.handleMarksSaveError(studentId, originalBorder, error)
    );
  },

  handleMarksSaveSuccess(studentId, marks, originalBorder) {
    this.updateStudentMarksInState(studentId, marks);
    EvaluationUI.showMarksSaved(studentId, originalBorder);
    toastr.success(`Marks saved successfully`);
    this.refreshUIAfterMarksSave();
  },

  handleMarksSaveError(studentId, originalBorder, error) {
    EvaluationUI.showMarksError(studentId, originalBorder);
    toastr.error(error);
  },

  updateStudentMarksInState(studentId, marks) {
    const studentIndex = this.state.studentResponses.findIndex(
      (r) => r._id === studentId
    );
    if (studentIndex !== -1) {
      const newEvaluationStatus = "evaluated";
      this.state.studentResponses[studentIndex].marks = parseInt(marks);
      this.state.studentResponses[studentIndex].evaluationStatus = newEvaluationStatus;
      
      // Update UI directly without re-rendering everything
      EvaluationUI.updateStudentMarks(studentId, marks, newEvaluationStatus);
    }
  },

  refreshUIAfterMarksSave() {
    // Only update counts and apply filters if necessary
    this.updateFilterCounts();
    
    // Check if current filter needs to be updated
    // Only re-render if the student might move between filter categories
    const needsFilterRefresh = this.state.currentFilter !== "all";
    
    if (needsFilterRefresh) {
      this.applyFilters(true); // Pass true to indicate this is a marks update
    }
  },
};

// Application initialization
$(document).ready(() => {
  EvaluationController.init();
});
