let mediaRecorder = null;
let mediaStream = null;
let screenRecording;
let webCamRecording;
let chunkNumber = 1;
let lastChunkTime = Date.now();
let lastChunkFlagged = false;
let healthCheckInterval = null;
const HEALTH_CHECK_TIMEOUT = 180000; // 3 minutes
let uploadChunkError = 0;
let chunkFetchFlag = {
  lastChunkPending: false,
  lastChunkTime: null
};

let currentAttenderId = null;
const defaultQuality = "720p";

const QUALITY_PRESETS = {
  "1080p": {
    name: "1080p",
    width: 1920,
    height: 1080,
    frameRate: 12,
    videoBitrate: 1200000,
    screenConstraints: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 12, max: 15 },
    },
  },
  "720p": {
    name: "720p",
    width: 1280,
    height: 720,
    frameRate: 10,
    videoBitrate: 700000,
    screenConstraints: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 10, max: 12 },
    },
  },
  "480p": {
    name: "480p",
    width: 854,
    height: 480,
    frameRate: 8,
    videoBitrate: 300000,
    screenConstraints: {
      width: { ideal: 854 },
      height: { ideal: 480 },
      frameRate: { ideal: 8, max: 10 },
    },
  },
};

// Function to check if requested quality is supported
async function checkQualitySupport(stream, requestedQuality) {
  const track = stream.getVideoTracks()[0];
  const capabilities = track.getCapabilities();

  const quality = QUALITY_PRESETS[requestedQuality];

  if (!quality) {
    return QUALITY_PRESETS["480p"];
  }

  // Check if requested quality is supported
  if (
    (capabilities.width && capabilities.width.max < quality.width) ||
    (capabilities.height && capabilities.height.max < quality.height) ||
    (capabilities.frameRate && capabilities.frameRate.max < quality.frameRate)
  ) {
    // Find the highest supported quality
    const supportedQualities = Object.values(QUALITY_PRESETS)
      .filter(
        (q) =>
          (!capabilities.width || q.width <= capabilities.width.max) &&
          (!capabilities.height || q.height <= capabilities.height.max) &&
          (!capabilities.frameRate || q.frameRate <= capabilities.frameRate.max)
      )
      .sort((a, b) => b.height - a.height);

    return supportedQualities[0] || QUALITY_PRESETS["480p"];
  }

  return quality;
}

// Add this new function to check existing upload
async function getGcpReusableUrl(attenderId) {
  return new Promise((resolve) => {
    makeApiCall({
      url: `${EXAM_ATTENDER_END_POINT}/upload?id=${attenderId}`,
      method: "GET",
      isApiKey: true,
      successCallback: (response) => resolve(response.data),
      errorCallback: () => resolve(null),
    });
  });
}

// Utility function to check for MP4 recording support
function getSupportedMimeType(format = 'mp4') {
  const mimeTypes = {
      mp4: [
          'video/mp4;codecs=h264',
          'video/mp4;codecs=avc1',
          'video/mp4'
      ],
      webm: [
          'video/webm;codecs=vp8',
          'video/webm;codecs=vp9',
          'video/webm;codecs=h264',
          'video/webm'
      ]
  };

  const supportedTypes = mimeTypes[format] || [];
  const supportedType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type));

  if (!supportedType) {
      console.warn(`No supported ${format} mime type found.`);
      return null;
  }

  return supportedType;
}

function renderWebcamAndScreenRecording(webcamStream, screenStream) {
  async function startRecording(webcamStream, screenStream) {
    try {
      // Get audio settings from window object set in check-access.js
      const audioPermissionGranted = window.audioPermissionGranted || false;
      const audioSource = window.audioSource || null;
      const canEnableAudio = window.canEnableAudio || false;
      
      videoUploadLog("Recording initialization started", 'recording');
      
      // Log audio status only if it was requested
      if (canEnableAudio) {
        if (audioPermissionGranted && audioSource) {
          videoUploadLog(`Audio recording enabled from ${audioSource}`, 'recording');
        } else {
          videoUploadLog("Audio recording requested but not available - continuing without audio", 'recording');
        }
      }
      
      if (!webCamRecording && !screenRecording) {
        videoUploadLog("No recording sources enabled", 'recording');
        throw new Error("No recording sources enabled");
      }

      let screenQuality, webcamQuality;
      const tracks = [];

      if (screenRecording) {
        screenQuality = await checkQualitySupport(screenStream, defaultQuality);
        await screenStream
          .getVideoTracks()[0]
          .applyConstraints(screenQuality.screenConstraints);
        
        tracks.push(...screenStream.getTracks());
      }

      if (webCamRecording) {
        webcamQuality = QUALITY_PRESETS["480p"];
        await webcamStream
          .getVideoTracks()[0]
          .applyConstraints(webcamQuality.screenConstraints);
        
        tracks.push(...webcamStream.getTracks());
      }

      // Create canvas and video elements for compositing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const screenVideo = document.createElement('video');
      let webcamVideo;

      // Set up video elements
      if (screenRecording) {
        screenVideo.srcObject = screenStream;
        screenVideo.play().catch(err => console.error('Screen video error:', err));
      }
      if (webCamRecording) {
        webcamVideo = document.getElementById('webcam-video');
        webcamVideo.play().catch(err => console.error('Webcam video error:', err));
      }

      // Set canvas dimensions for 50-50 split (adjust as needed)
      canvas.width = 1280;  // Total width
      canvas.height = 720;  // Common height

      // Drawing function for compositing
      function drawComposite() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw screen recording on left half
        if (screenRecording && screenVideo.readyState >= 2) {
          const screenAspect = screenVideo.videoWidth / screenVideo.videoHeight;
          const targetWidth = canvas.width / 2;
          const targetHeight = canvas.height;
          const scaledHeight = targetWidth / screenAspect;
          
          if (scaledHeight > targetHeight) {
            const scaledWidth = targetHeight * screenAspect;
            ctx.drawImage(screenVideo, 0, 0, scaledWidth, targetHeight);
          } else {
            const y = (targetHeight - scaledHeight) / 2;
            ctx.drawImage(screenVideo, 0, y, targetWidth, scaledHeight);
          }
        }

        // Draw webcam on right half
        if (webCamRecording && webcamVideo.readyState >= 2) {
          const webcamAspect = webcamVideo.videoWidth / webcamVideo.videoHeight;
          const targetWidth = canvas.width / 2;
          const targetHeight = canvas.height;
          const scaledHeight = targetWidth / webcamAspect;
          
          if (scaledHeight > targetHeight) {
            const scaledWidth = targetHeight * webcamAspect;
            ctx.drawImage(webcamVideo, targetWidth, 0, scaledWidth, targetHeight);
          } else {
            const y = (targetHeight - scaledHeight) / 2;
            ctx.drawImage(webcamVideo, targetWidth, y, targetWidth, scaledHeight);
          }
        }

        requestAnimationFrame(drawComposite);
      }

      // Start compositing
      drawComposite();

      // Create media stream from canvas
      const canvasStream = canvas.captureStream(30);
      
      if (canEnableAudio && audioPermissionGranted && audioSource) {
        const sourceStream = audioSource === 'webcam' ? webcamStream : screenStream;
        
        if (sourceStream?.getAudioTracks().length > 0) {
          try {
            canvasStream.addTrack(sourceStream.getAudioTracks()[0]);
            videoUploadLog(`Added ${audioSource} audio track to recording`, 'recording');
          } catch (audioErr) {
            videoUploadLog(`Failed to add audio track: ${audioErr.message}`, 'error');
            audioPermissionGranted = false;
          }
        } else {
          videoUploadLog(`No audio tracks available from ${audioSource}`, 'recording');
          audioPermissionGranted = false;
        }
      }
      
      mediaStream = canvasStream;

      // Use the combined stream for recording
      const totalBitrate = 
        (screenQuality?.videoBitrate || 0) + (webcamQuality?.videoBitrate || 0);

      currentAttenderId = new URLSearchParams(window.location.search).get(
        "attender_id"
      );

      // Check for MP4 recording support
      const supportedMimeType = getSupportedMimeType('webm');
      if (!supportedMimeType) {
        console.error("WebM recording is not supported in this browser");
        alert("WebM recording is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge that supports WebM recording.");
        videoUploadLog("WebM recording is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge that supports WebM recording.", 'error');
        throw new Error("WebM recording is not supported in this browser");
      }

      // Check if we have any audio tracks in the final stream
      const hasAudioTracks = mediaStream.getAudioTracks().length > 0;

      mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: "video/webm;codecs=vp8",
        videoBitsPerSecond: totalBitrate,
        audioBitsPerSecond: hasAudioTracks ? 128000 : 0,
      });

      // Simplified logging
      videoUploadLog(`Recording started: ${supportedMimeType}, video bitrate: ${totalBitrate}${hasAudioTracks ? ', with audio' : ', without audio'}`, 'recording');
            
      mediaRecorder.onerror = (event) => {
        videoUploadLog(`MediaRecorder error: ${event.error?.message || "Unknown error"}`, 'error');
        console.error("MediaRecorder error:", event.error);
        alert(`Recording error: ${event.error.message || "Unknown error"}. Please try again.`);
        showRecordingFailed()
      };

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) { 
          lastChunkFlagged = true;           // mark chunk as received
          lastChunkTime = Date.now();        // update time
          try {
            await handleRecorderChunk(event.data);
          } catch (err) {
            videoUploadLog(`Error processing chunk: ${err.message}`, 'error');
            console.error("Error processing chunk:", err);
          }
        }
      };

      mediaRecorder.start(5000);
      videoUploadLog("Recording started (5s intervals)...", 'recording');

      if (webCamRecording) {
        const isRtl = localStorage.getItem('lang') === 'ar';
        const $container = $("#webcam-container");
        
        // Set initial position and make container draggable
        $container.css({
          position: 'fixed',
          cursor: 'move',
          opacity: 0.9
        });

        // Set initial position based on RTL
        if (isRtl) {
          $container.css({
            right: '20px',
            left: 'auto'
          });
        } else {
          $container.css({
            left: '20px',
            right: 'auto'
          });
        }

        // Create draggable instance
        const draggableInstance = $container.draggable({
          containment: "body",
          start: function(event, ui) {
            if (isRtl) {
              const windowWidth = $(window).width();
              const containerWidth = $(this).width();
              ui.position.left = windowWidth - containerWidth - ui.position.left;
            }
          }
        }).data("ui-draggable");

        // Override the _mouseDrag method for RTL
        if (isRtl && draggableInstance) {
          const originalMouseDrag = draggableInstance._mouseDrag;
          draggableInstance._mouseDrag = function(event) {
            const result = originalMouseDrag.call(this, event);
            if (result !== false) {
              const windowWidth = $(window).width();
              const containerWidth = $(this.element).width();
              const currentLeft = parseInt($(this.element).css('left')) || 0;
              $(this.element).css({
                left: (windowWidth - containerWidth - currentLeft) + 'px'
              });
            }
            return result;
          };
        }
      }
    } catch (err) {
      videoUploadLog(`Recording error: ${err.message}`, 'error');
      console.error("Recording error:", err);
      if (err.name === "NotAllowedError") {
        toastr.error("Permissions required. Please allow access and refresh.");
        setTimeout(() => {
          window.location.href = `message.html?status=permission-denied${cid ? `&cid=${cid}` : ""}`;
        }, 3000);
      }
    }
  }

  startRecording(webcamStream, screenStream);
}

function stopRecording() {
  return new Promise((resolve) => {
    videoUploadLog("Stop recording requested", 'recording');
    
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      const originalOnStop = mediaRecorder.onstop;
      
      mediaRecorder.onstop = async () => {
        videoUploadLog("MediaRecorder stopped due to stopRecording call", 'recording');
        try {
          await new Promise(stopResolve => setTimeout(stopResolve, 500));
      
          if (bufferForPartial.length > 0) {
            
            if (bufferForPartial.length < CHUNK_SIZE) {
              videoUploadLog(`Buffer size (${bufferForPartial.length} bytes) is less than 1MB, waiting...`, 'recording');
              
              await new Promise((waitResolve) => {
                const checkInterval = setInterval(() => {
                  if (bufferForPartial.length >= CHUNK_SIZE) {
                    clearInterval(checkInterval);
                    waitResolve();
                  }
                }, 500);
                
                setTimeout(() => {
                  clearInterval(checkInterval);
                  videoUploadLog("Timeout reached while waiting for 1MB, padding buffer with dummy data", 'recording');
                  
                  const bytesNeeded = CHUNK_SIZE - bufferForPartial.length;
                  
                  if (bytesNeeded > 0) {
                    const paddedBuffer = new Uint8Array(CHUNK_SIZE);
                    paddedBuffer.set(bufferForPartial);
                    bufferForPartial = paddedBuffer;
                    
                    videoUploadLog(`Added ${bytesNeeded} bytes of dummy data to reach 1MB`, 'recording');
                  }
                  
                  waitResolve();
                }, 10000);
              });
            }
            await handleRecorderChunk(new Blob([bufferForPartial]));
            bufferForPartial = new Uint8Array(0);
          }

          if (pendingUploads) {
            await pendingUploads;
          }

          resolve(true);
      
        } catch (err) {
          videoUploadLog(`Error during final upload: ${err.message}`, 'error');
          console.error("Error finalizing upload:", err);
          resolve(false);
        } finally {
          mediaStream?.getTracks().forEach(track => track.stop());
          videoUploadLog("All media tracks stopped", 'recording');
          $("#webcam-container").remove();
          hideUploadAnimation();
          
          if (mediaRecorder) {
            mediaRecorder.onstop = originalOnStop;
          }
        }
      };
      
      mediaRecorder.requestData();
      mediaRecorder.stop();
    } else {
      videoUploadLog("No active recording to stop", 'recording');
      resolve(true);
    }
  });
}

function showUploadAnimation() {
  const isEnglish = localStorage.getItem("lang") === "en";
  const uploadAnimationHtml = `
        <div id="upload-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0, 0, 0, 0.7); z-index: 9999; display: flex; justify-content: center; align-items: center;">
            <div id="upload-animation" style="background: white; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 0 30px rgba(0,0,0,0.3); min-width: 300px;">
                <div class="upload-progress">
                    <div class="server-animation">
                        <div class="server">
                            <div class="server-lights"></div>
                        </div>
                        <div class="upload-path">
                            <div class="upload-packets"></div>
                            <div class="upload-packets"></div>
                            <div class="upload-packets"></div>
                        </div>
                    </div>
                    <svg class="circular-progress" width="120" height="120" viewBox="0 0 120 120">
                        <circle class="progress-background" cx="60" cy="60" r="50" stroke="#e9ecef" stroke-width="8" fill="none"/>
                        <circle class="progress-bar" cx="60" cy="60" r="50" stroke="#007bff" stroke-width="8" fill="none"/>
                    </svg>
                </div>
                <div style="margin-top: 25px; color: #333; font-size: 18px; font-weight: 500;">${
                  !isEnglish ? "تحميل التسجيل" : "Uploading Recording"
                }</div>
                <div class="upload-status" style="margin-top: 8px; color: #666; font-size: 14px;">${
                  !isEnglish
                    ? "جاري الاتصال بالخادم..."
                    : "Connecting to server..."
                }</div>
                <div class="progress-text" style="margin-top: 15px; color: #007bff; font-size: 14px; font-weight: 500;"></div>
                <div class="network-warning text-wrap" style="margin-top: 15px; color: #dc3545; font-size: 14px; font-weight: 600;">${
                  !isEnglish
                    ? "يتم حاليًا رفع الفيديو الخاص بك. يرجى الانتظار لبضع دقائق حتى يكتمل الرفع. لا تقم بإغلاق أو تحديث هذه الصفحة أثناء العملية."
                    : "<div>Your video is currently uploading.</div> <div>Please wait a few minutes until the upload is complete.</div> <div>Do not close or refresh this page during the process.</div>"
                }</div>
            </div>
        </div>
    `;

  const styleSheet = `
        <style>
            @keyframes fadeOut {
                to {
                    opacity: 0;
                }
            }
            
            .upload-progress {
                position: relative;
                width: 120px;
                height: 120px;
                margin: 0 auto;
            }
            
            .server-animation {
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
            }
            
            .server {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 40px;
                height: 50px;
                background: #2d3748;
                border-radius: 5px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .server-lights {
                position: absolute;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                width: 6px;
                height: 6px;
                background: #48bb78;
                border-radius: 50%;
                animation: blink 1s ease infinite;
            }
            
            .server-lights::before,
            .server-lights::after {
                content: '';
                position: absolute;
                width: 6px;
                height: 6px;
                background: #48bb78;
                border-radius: 50%;
                animation: blink 1s ease infinite;
            }
            
            .server-lights::before {
                top: 12px;
            }
            
            .server-lights::after {
                top: 24px;
            }
            
            .upload-path {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 120px;
                height: 2px;
            }
            
            .upload-packets {
                position: absolute;
                width: 8px;
                height: 8px;
                background: #007bff;
                border-radius: 50%;
                animation: movePackets 2s linear infinite;
            }
            
            .upload-packets:nth-child(2) {
                animation-delay: 0.6s;
            }
            
            .upload-packets:nth-child(3) {
                animation-delay: 1.2s;
            }
            
            @keyframes movePackets {
                0% {
                    transform: translate(-40px, -50%) scale(0);
                    opacity: 0;
                }
                50% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(-60px, -50%) scale(0);
                    opacity: 0;
                }
            }
            
            @keyframes blink {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
            }
            
            .circular-progress {
                transform: rotate(-90deg);
                transform-origin: 50% 50%;
            }
            
            .progress-background {
                stroke-dasharray: 314.16;
                stroke-dashoffset: 0;
            }
            
            .progress-bar {
                stroke-dasharray: 314.16;
                stroke-dashoffset: 314.16;
                animation: progress 2s linear infinite;
            }
            
            @keyframes progress {
                0% {
                    stroke-dashoffset: 314.16;
                }
                100% {
                    stroke-dashoffset: 0;
                }
            }
            
            #upload-overlay {
                opacity: 0;
                animation: fadeIn 0.3s ease forwards;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            #upload-animation {
                transform: translateY(20px);
                opacity: 0;
                animation: slideUp 0.3s ease 0.2s forwards;
            }
            
            @keyframes slideUp {
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .upload-status {
                animation: statusChange 6s linear infinite;
            }
            
            @keyframes statusChange {
                0% { content: "Connecting to server..."; }
                33% { content: "Processing recording..."; }
                66% { content: "Uploading to cloud..."; }
                100% { content: "Connecting to server..."; }
            }
        </style>
    `;

  $("head").append(styleSheet);
  $("body").append(uploadAnimationHtml);

  // Prevent background scrolling
  $("body").css("overflow", "hidden");

  // Animate the status text
  const statusMessages = [
    "Connecting to server...",
    "Processing recording...",
    "Uploading to cloud...",
    "Securing data...",
  ];

  let messageIndex = 0;
  setInterval(() => {
    $(".upload-status").text(statusMessages[messageIndex]);
    messageIndex = (messageIndex + 1) % statusMessages.length;
  }, 2000);
}

// Helper function to format timestamp
function formatTimestamp(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

function startHealthCheck() {
  if (healthCheckInterval) clearInterval(healthCheckInterval);

  healthCheckInterval = setInterval(async () => {
    const now = Date.now();
    if (!lastChunkFlagged && now - lastChunkTime > HEALTH_CHECK_TIMEOUT) {
      videoUploadLog("⚠️ MediaRecorder stalled, restarting recording...", 'error');
      showToast("⚠️ MediaRecorder stalled, restarting recording...", 'error');
      showRecordingFailed();
      } 

    if (uploadChunkError > 3) {
      videoUploadLog("⚠️ Upload chunk error, terminating recording...", 'error');
      showToast("⚠️ Upload chunk error, terminating recording...", 'error');
      showRecordingFailed();
      uploadChunkError = 0;
    }

    if (chunkFetchFlag.lastChunkPending && now - chunkFetchFlag.lastChunkTime > HEALTH_CHECK_TIMEOUT) {
      videoUploadLog("⚠️ Chunk fetch flag is true and internet issue detected, terminating recording...", 'error');
      showToast("⚠️ Internet issue detected , terminating recording...", 'error');
      showInternetFailed();
    }
    
    lastChunkFlagged = false;
  }, 60000);
}