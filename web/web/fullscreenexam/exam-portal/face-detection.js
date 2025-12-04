// Face detection with MediaPipe
let faceMesh;
let lastFaceDetectionTime = Date.now();
let faceDetectionInterval;
let isFaceDetectionActive = false;
let detectionCanvas;
let detectionVideo;
let ctx;
let faceValidationWarningShown = false;
let consecutiveNoFaceFrames = 0;
let consecutiveMultiFaceFrames = 0;
const VIOLATION_THRESHOLD = 2; // Number of consecutive frames to count as violation
let modelsLoaded = false; // Track if models are loaded
let lowBandwidthMode = false; // Track if we're in low bandwidth mode
let detectionIntervalTime = 1000; // Default check interval (1 second)

// Function to display toast notifications for face detection violations
function displayFaceDetectionToast(message, type = 'warning') {
  // Check if toastr is available (it should be included in the main HTML)
  if (typeof toastr !== 'undefined') {
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-middle-center",
        timeOut: "5000",
    };
    
    switch(type) {
      case 'warning':
        showToast(message, 'warning');
        break;
      case 'error':
        showToast(message, 'error');
        break;
      case 'success':
        showToast(message, 'success');
        break;
      default:
        showToast(message, 'info');
    }
  } else {
    // Fallback to alert if toastr is not available
    alert(message);
  }
}

// Detect connection speed
async function checkConnectionSpeed() {
  const startTime = Date.now();
  const testImageUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/tiny_model.tflite'; // Small file from MediaPipe CDN
  
  try {
    const response = await fetch(testImageUrl, { method: 'HEAD' });
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // If fetch takes more than 500ms, consider it a slow connection
    if (duration > 500) {
      console.log(`Slow connection detected: ${duration}ms to fetch headers`);
      lowBandwidthMode = true;
      detectionIntervalTime = 2000; // Increase interval to 2 seconds for slow connections
      return false;
    } else {
      console.log(`Fast connection detected: ${duration}ms to fetch headers`);
      lowBandwidthMode = false;
      return true;
    }
  } catch (error) {
    console.error('Error checking connection speed:', error);
    lowBandwidthMode = true;
    detectionIntervalTime = 2000; // Increase interval to 2 seconds for slow connections
    return false;
  }
}

// Cache the model files
async function preloadAndCacheModels() {
  if ('caches' in window) {
    const cacheName = 'mediapipe-models-v1';
    
    try {
      // List of important MediaPipe files to cache
      const urlsToCache = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh_solution_packed_assets.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh_solution_simd_wasm_bin.js'
      ];
      
      // Check if we already have a cache
      const cache = await caches.open(cacheName);
      const cachedUrls = await Promise.all(
        urlsToCache.map(async url => {
          const match = await cache.match(url);
          return { url, cached: !!match };
        })
      );
      
      // Cache any missing files
      const urlsToFetch = cachedUrls
        .filter(item => !item.cached)
        .map(item => item.url);
      
      if (urlsToFetch.length > 0) {
        console.log(`Caching ${urlsToFetch.length} MediaPipe files...`);
        
        // Add files to cache
        await Promise.all(
          urlsToFetch.map(async url => {
            try {
              const response = await fetch(url, { cache: 'no-cache' });
              if (response.ok) {
                await cache.put(url, response);
                console.log(`Cached: ${url}`);
              }
            } catch (error) {
              console.error(`Failed to cache ${url}:`, error);
            }
          })
        );
      } else {
        console.log('All MediaPipe files already cached');
      }
      
      return true;
    } catch (error) {
      console.error('Error caching MediaPipe models:', error);
      return false;
    }
  } else {
    console.log('Cache API not supported, skipping model caching');
    return false;
  }
}

// Initialize face detection
async function initFaceDetection() {
  if (!detectionVideo) {
    detectionVideo = document.createElement('video');
    detectionVideo.setAttribute('playsinline', '');
    detectionVideo.style.display = 'none';
    document.body.appendChild(detectionVideo);
    
    detectionCanvas = document.createElement('canvas');
    detectionCanvas.style.display = 'none';
    document.body.appendChild(detectionCanvas);
    ctx = detectionCanvas.getContext('2d');
  }
  const isEnglish = localStorage.getItem("lang") === "en"
  try {
    // Check connection speed first
    await checkConnectionSpeed();
    
    // Try to preload and cache models
    await preloadAndCacheModels();
    
    // Display loading indicator
    const loadingToast = showToast(isEnglish?'Loading face detection...':"جارٍ تحميل الكشف عن الوجه...", 'info');
    
    // Load the MediaPipe Face Mesh model
    faceMesh = new window.FaceMesh({
      locateFile: (file) => {
        // Attempt to use cached version first
        if ('caches' in window) {
          caches.match(`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`)
            .then(response => {
              if (response) {
                console.log(`Using cached version of ${file}`);
                return response.url;
              }
              return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            })
            .catch(() => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            });
        }
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });
    
    // Adjust options based on connection speed
    faceMesh.setOptions({
      maxNumFaces: lowBandwidthMode ? 2 : 3, // Detect fewer faces in low bandwidth mode
      refineLandmarks: false, // Always disable for performance
      minDetectionConfidence: lowBandwidthMode ? 0.6 : 0.5, // Higher threshold = less frequent detections
      minTrackingConfidence: lowBandwidthMode ? 0.6 : 0.5, // Higher threshold = less frequent tracking updates
    });
    
    faceMesh.onResults(onFaceDetectionResults);
    
    // Wait for model to load
    await faceMesh.initialize();
    modelsLoaded = true;
    
    // Hide loading indicator
    if (loadingToast && typeof loadingToast.remove === 'function') {
      loadingToast.remove();
    }
    
    
    // Request camera permission and start
    if (isBrowserOk && (urlParams.get('webCamRecording') === 'true' || urlParams.get('screenRecording') === 'true')){
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        showToast(isEnglish?'Face detection ready':"الكشف عن الوجه جاهز", 'success');
        await startFaceDetection();
        return true;
      } else {
        console.error('getUserMedia not supported in this browser');
        return false;
      }
    }
  } catch (error) {
    console.error('Error initializing face detection:', error);
    showToast(isEnglish?'Failed to initialize face detection. Please reload the page.':"فشل في تهيئة الكشف عن الوجه. يرجى إعادة تحميل الصفحة.", 'error');
    return false;
  }
}

// Start face detection
async function startFaceDetection() {
  if (isFaceDetectionActive) return;
  
  try {
    // Use lower resolution for video in low bandwidth mode
    const videoConstraints = {
      width: lowBandwidthMode ? 320 : 640,
      height: lowBandwidthMode ? 240 : 480,
      facingMode: 'user'
    };
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints
    });
    
    detectionVideo.srcObject = stream;
    await detectionVideo.play();
    
    // Set canvas size to match video
    detectionCanvas.width = detectionVideo.videoWidth;
    detectionCanvas.height = detectionVideo.videoHeight;
    
    // Start detection loop
    isFaceDetectionActive = true;
    faceDetectionInterval = setInterval(detectFace, detectionIntervalTime); // Use dynamic interval
    
    return true;
  } catch (error) {
    console.error('Error accessing webcam for face detection:', error);
    return false;
  }
}

// Stop face detection
function stopFaceDetection() {
  if (!isFaceDetectionActive) return;
  
  clearInterval(faceDetectionInterval);
  
  if (detectionVideo && detectionVideo.srcObject) {
    const tracks = detectionVideo.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    detectionVideo.srcObject = null;
  }
  
  isFaceDetectionActive = false;
}

// Process a single frame for face detection
async function detectFace() {
  if (!isFaceDetectionActive || !faceMesh || !detectionVideo.readyState) return;
  
  try {
    lastFaceDetectionTime = Date.now();
    
    // Skip drawing to canvas and getting imageData if not needed
    // This was causing unnecessary processing
    
    await faceMesh.send({image: detectionVideo});
  } catch (error) {
    console.error('Error in face detection:', error);
  }
}

// Process face detection results
function onFaceDetectionResults(results) {
  const faces = results.multiFaceLandmarks || [];
  const isEnglish = localStorage.getItem('lang') === "en"
  if (faces.length === 0) {
    // No face detected
    consecutiveNoFaceFrames++;
    consecutiveMultiFaceFrames = 0;
    faceNotVisibleCount++;
    
    if (consecutiveNoFaceFrames >= VIOLATION_THRESHOLD && !faceValidationWarningShown) {
      displayFaceDetectionToast(isEnglish?'Warning: Your face is not visible. Please position yourself in front of the camera.':"تحذير: وجهك غير مرئي. يرجى وضع نفسك أمام الكاميرا.", 'warning');
      // Use the global handleCheatDetected function from the main script
      if (typeof window.handleCheatDetected === 'function') {
        window.handleCheatDetected('Face not visible in webcam',false);
      }
      faceValidationWarningShown = true;
      setTimeout(() => { faceValidationWarningShown = false; }, 10000); // Reset warning flag after 10 seconds
    }
  } else if (faces.length > 1) {
    // Multiple faces detected
    consecutiveMultiFaceFrames++;
    consecutiveNoFaceFrames = 0;
    
    if (consecutiveMultiFaceFrames >= VIOLATION_THRESHOLD && !faceValidationWarningShown) {
      displayFaceDetectionToast(isEnglish?'Warning: Multiple faces detected. Only the candidate should be visible.':"تحذير: تم اكتشاف وجوه متعددة. يجب أن يكون المرشح فقط هو المرئي.", 'warning');
      // Use the global handleCheatDetected function from the main script
      if (typeof window.handleCheatDetected === 'function') {
        window.handleCheatDetected('Multiple faces detected in webcam',false);
      }
      faceValidationWarningShown = true;
      setTimeout(() => { faceValidationWarningShown = false; }, 10000); // Reset warning flag after 10 seconds
    }
  } else {
    // One face detected - all good
    consecutiveNoFaceFrames = 0;
    consecutiveMultiFaceFrames = 0;
  }
}

// Monitor connection and adjust settings dynamically
function monitorConnection() {
  if ('connection' in navigator && 'onchange' in navigator.connection) {
    navigator.connection.onchange = function() {
      const type = navigator.connection.effectiveType;
      
      console.log(`Connection type changed to ${type}`);
      
      // Adjust settings based on connection type
      if (type === '2g' || type === 'slow-2g') {
        if (!lowBandwidthMode) {
          lowBandwidthMode = true;
          detectionIntervalTime = 3000; // 3 seconds for very slow connections
          
          // Update detection interval if active
          if (isFaceDetectionActive) {
            clearInterval(faceDetectionInterval);
            faceDetectionInterval = setInterval(detectFace, detectionIntervalTime);
          }
          
          console.log('Switched to low bandwidth mode');
        }
      } else if (type === '4g' && lowBandwidthMode) {
        lowBandwidthMode = false;
        detectionIntervalTime = 1000; // Back to 1 second for fast connections
        
        // Update detection interval if active
        if (isFaceDetectionActive) {
          clearInterval(faceDetectionInterval);
          faceDetectionInterval = setInterval(detectFace, detectionIntervalTime);
        }
        
        console.log('Switched to high bandwidth mode');
      }
    };
  }
}

// Initialize the face detection when the document is ready
$(document).ready(function() {
  // monitorConnection();
});

// Stop face detection before page unload
$(window).on('beforeunload', function() {
  stopFaceDetection();
}); 