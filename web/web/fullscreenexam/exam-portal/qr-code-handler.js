/**
 * Generates a QR code inside a specified container element.
 * This script relies on the qrcode.js library, which must be included in the HTML.
 *
 * @param {HTMLElement} container - The DOM element where the QR code will be placed.
 * @param {string} url - The URL that the QR code should encode.
 */
function generateQRCode(container, url) {
  if (!container || !url) {
    console.error(
      "QR Code Generation Error: The container element or URL is missing."
    );
    return;
  }

  try {
    // Use the QRCode.js library to create the QR code
    new QRCode(container, {
      text: url,
      width: 180,
      height: 180,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.L, // Using lowest error correction
      version: 40, // Using maximum version for highest capacity
    });
  } catch (error) {
    console.error(
      "Failed to generate QR code. Ensure the qrcode.js library is loaded.",
      error
    );
    container.textContent = "Error generating QR code.";
  }
}

class QRCodeCameraService {
  constructor() {
    this.stream = null;
    this.videoElement = null;
  }

  async start(videoElement) {
    if (this.stream) {
      this.stop(); // Stop any existing stream
    }
    this.videoElement = videoElement;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      videoElement.srcObject = this.stream;
      return true;
    } catch (error) {
      console.error("Error starting camera for QR code:", error);
      return false;
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
      this.videoElement = null;
    }
  }

  capture(canvasElement) {
    if (!this.stream || !this.videoElement) {
      console.error("QR Code camera not started.");
      return null;
    }
    const context = canvasElement.getContext("2d");
    canvasElement.width = this.videoElement.videoWidth;
    canvasElement.height = this.videoElement.videoHeight;
    context.drawImage(this.videoElement, 0, 0);
    return canvasElement.toDataURL("image/jpeg");
  }
}

const qrCodeCameraService = new QRCodeCameraService();

function startCamera(questionIndex) {
  const cameraContainer = document.getElementById(
    `camera-container-${questionIndex}`
  );
  const video = document.getElementById(`camera-preview-${questionIndex}`);
  if (cameraContainer && video) {
    cameraContainer.style.display = "block";
    qrCodeCameraService.start(video);
  }
}

function stopCamera(questionIndex) {
  const cameraContainer = document.getElementById(
    `camera-container-${questionIndex}`
  );
  if (cameraContainer) {
    cameraContainer.style.display = "none";
    qrCodeCameraService.stop();
  }
}

function capturePhoto(questionIndex, button) {
  const canvas = document.getElementById(`camera-canvas-${questionIndex}`);
  const questionData = JSON.parse(button.getAttribute("data-question"));

  const imageDataUrl = qrCodeCameraService.capture(canvas);
  if (imageDataUrl) {
    // Here you would typically handle the upload of the captured image data
    console.log(
      "Captured image data for question " + questionIndex,
      imageDataUrl
    );
    alert("Photo captured! Upload functionality would be here.");
    stopCamera(questionIndex);
  }
}
