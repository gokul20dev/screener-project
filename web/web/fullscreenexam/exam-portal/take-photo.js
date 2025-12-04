const CameraService = {
  stream: null,

  async start() {
    if (this.stream) {
      this.stop();
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    this.stream = stream;
    return stream;
  },

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  },

  async capture(videoElement) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    // Wait for the video to be ready
    if (!videoElement || videoElement.readyState < 2) {
      // HAVE_CURRENT_DATA
      await new Promise((resolve) => {
        videoElement.onloadeddata = () => resolve();
      });
    }

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );
    if (!blob) {
      throw new Error("Failed to capture image blob.");
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `camera-capture_${timestamp}.jpg`;
    const file = new File([blob], fileName, { type: "jpg" });

    return { file, fileName };
  },
};

const PhotoUI = {
  getElements(index) {
    return {
      video: document.getElementById(`camera-preview-${index}`),
      container: document.getElementById(`camera-container-${index}`),
      canvas: document.getElementById(`camera-canvas-${index}`),
      accordionContainer: document.querySelector(
        `#question-${index} .accordion`
      ),
    };
  },

  createBackdrop(onClick) {
    const backdrop = document.createElement("div");
    backdrop.className = "camera-backdrop";
    backdrop.style.display = "block";
    backdrop.onclick = onClick;
    document.body.appendChild(backdrop);
    return backdrop;
  },

  removeBackdrop() {
    const backdrop = document.querySelector(".camera-backdrop");
    if (backdrop) {
      backdrop.parentNode.removeChild(backdrop);
    }
  },

  showCameraView(index, stream) {
    const { video, container } = this.getElements(index);
    if (video && container) {
      video.srcObject = stream;
      video.style.display = "block";
      container.style.display = "block";
    }
  },

  hideCameraView(index) {
    const { video, container } = this.getElements(index);
    if (video) {
      video.srcObject = null;
      video.style.display = "none";
    }
    if (container) {
      container.style.display = "none";
    }
  },

  addAccordionItem(index, imageUrl, fileName) {
    const { accordionContainer } = this.getElements(index);
    if (!accordionContainer) return;

    const accordionIndex = accordionContainer.children.length;

    const newAccordionItem = `
      <div class="accordion-item">
        <div class="accordion-header" id="hdr-${index}-${accordionIndex}" onclick="initAccordion(${index}, ${accordionIndex})">
          Image ${accordionIndex + 1} - Camera Capture
          <span class="arrow"></span>
        </div>
        <div class="accordion-content">
          <div class="loading">Loading image...</div>
          <img 
            id="image-${index}-${accordionIndex}" 
            alt="Captured Image ${accordionIndex + 1}" 
            class="preview-image"
            style="max-width: 100%; height: auto; display: none;"
            data-original-src="${imageUrl}"
            data-file-name="${fileName}"
          />
        </div>
      </div>
    `;
    accordionContainer.insertAdjacentHTML("beforeend", newAccordionItem);
  },

  updateQuestionState(index) {
    const button = document.querySelector(
      `.filter-numbers button[data-index='${index}']`
    );
    if (button) {
      button.classList.add("selected");
      button.setAttribute("data-answer-saved", "false");
    }
  },
};

const PhotoController = {
  async startIRCamera(index) {
    try {
      const stream = await CameraService.start();
      PhotoUI.createBackdrop(() => this.stopIRCamera(index));
      PhotoUI.showCameraView(index, stream);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert(
        "Unable to access camera. Please ensure you have granted camera permissions."
      );
      this.stopIRCamera(index); // Cleanup on error
    }
  },

  async captureIRPhoto(index) {
    const { video } = PhotoUI.getElements(index);
    if (!video) return;

    try {
      const { file, fileName } = await CameraService.capture(video);

      const fileObj = { file, fileName };
      // Assumes uploadFileForQuestion, studentId, CONFIG, answers, isAnswerChanged, saveResponse are available in the global scope.
      await uploadFileForQuestion(studentId, fileObj);

      const completeUrl = `${CONFIG.BUCKET}/${CONFIG.FOLDERNAME}/${studentId}/${fileName}`;

      if (!answers[index] || typeof answers[index] !== "object") {
        answers[index] = { attachments: [] };
      }
      answers[index].attachments = answers[index].attachments || [];
      answers[index].attachments.push({
        fileType: "jpg",
        fileName: fileName.split(".")[0],
      });

      PhotoUI.addAccordionItem(index, completeUrl, "Camera Capture");
      PhotoUI.updateQuestionState(index);

      isAnswerChanged = true;
      this.stopIRCamera(index);
      saveResponse();
    } catch (error) {
      console.error("Error capturing or uploading photo:", error);
      alert("Failed to capture image. Please try again.");
      this.stopIRCamera(index);
    }
  },

  stopIRCamera(index) {
    CameraService.stop();
    PhotoUI.removeBackdrop();
    PhotoUI.hideCameraView(index);
  },
};

function startIRCamera(index) {
  PhotoController.startIRCamera(index);
}

function captureIRPhoto(index, buttonElement) {
  PhotoController.captureIRPhoto(index);
}

function stopIRCamera(index) {
  PhotoController.stopIRCamera(index);
}
