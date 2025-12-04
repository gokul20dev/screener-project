import * as S from "./dist/human.esm.js";
let urlExamId = null;

const humanConfig = {
  cacheSensitivity: 0.05,
  modelBasePath: "./models",
  filter: {
    enabled: true,
    equalization: true,
    brightness: 0.1,
    contrast: 0.1,
    sharpness: 0.3,
    blur: 0,
  },
  debug: false,
  face: {
    enabled: true,
    detector: {
      rotation: true,
      return: 5,
      mask: false,
      maxDetected: 5,
      skipFrames: 1, // Reduced from 2 for 10fps videos - skip 1 frame, process every 2nd frame
      minConfidence: 0.15,
      minSize: 20,
      iouThreshold: 0.1,
      scale: 1.5,
    },
    description: {
      enabled: true,
      skipFrames: 5, // Reduced from 10 for 10fps videos - process face description every 5 frames
      minConfidence: 0.1,
    },
    iris: {
      enabled: true,
      scale: 2.5,
    },
    emotion: { enabled: false },
    antispoof: {
      enabled: true,
      skipFrames: 15, // Reduced from 30 for 10fps videos - check every 1.5 seconds
    },
    liveness: {
      enabled: true,
      skipFrames: 15, // Reduced from 30 for 10fps videos - check every 1.5 seconds
    },
    mesh: {
      enabled: true,
      keepInvalid: true,
    },
  },
  body: { enabled: false },
  hand: {
    enabled: true,
    detector: {
      maxDetected: 2,
      skipFrames: 3, // Reduced from 5 for 10fps videos - check hands more frequently
    },
  },
  object: {
    enabled: true,
    model: "yolox",
    minConfidence: 0.1,
    maxDetected: 25,
    skipFrames: 2, // Reduced from 3 for 10fps videos - check objects more frequently
  },
  gesture: { enabled: true },
};

const matchConfig = {
  order: 1,
  multiplier: 25,
  min: 0.2,
  max: 0.8,
};

const detectionOptions = {
  minConfidence: 0.5,
  minSize: 200,
  maxTime: 3000000000,
  blinkMin: 10,
  blinkMax: 800,
  threshold: 0.4,
  distanceMin: 0.35,
  distanceMax: 1.2,
  mask: humanConfig.face.detector.mask,
  rotation: humanConfig.face.detector.rotation,
  ...matchConfig,
};

const status = {
  faceCount: { status: false, val: 0 },
  faceConfidence: { status: false, val: 0 },
  facingCenter: { status: false, val: 0 },
  lookingCenter: { status: false, val: 0 },
  blinkDetected: { status: false, val: 0 },
  faceSize: { status: false, val: 0 },
  antispoofCheck: { status: false, val: 0 },
  livenessCheck: { status: false, val: 0 },
  distance: { status: false, val: 0 },
  age: { status: false, val: 0 },
  gender: { status: false, val: 0 },
  timeout: { status: true, val: 0 },
  descriptor: { status: false, val: 0 },
  elapsedMs: { status: undefined, val: 0 },
  detectFPS: { status: undefined, val: 0 },
  drawFPS: { status: undefined, val: 0 },
  phoneDetected: { status: false, val: 0 },
  headphoneDetected: { status: false, val: 0 },
  noiseDetected: { status: false, val: 0 }, // Add noise detection status
};

const currentFace = { face: null, record: null };
const blinkTime = { start: 0, end: 0, time: 0 };
const human = new S.Human(humanConfig);

// Add a global variable to track face similarity
let globalFaceSimilarity = 0;

// Add a flag to track if the model has been loaded
let isModelLoaded = false;

// Add variables to track list fetching and processing count
let cachedUserList = [];
let processedCount = 0;
// Remove refetchThreshold as we'll fetch after every video

// Add privacy mode flag
let isPrivacyModeEnabled = false;

// Login credentials with salting
const CORRECT_PASSWORD =
  "9a740f2743e127201c4b3d543d4268564b8e8aed5bba0764be505ba3d2ca93c4";
const PASSWORD_SALT = "digval_video_processing_salt_2024";
const HASH_ITERATIONS = 1000;

// Add debug mode functionality
let isDebugMode = false;

// Function to hash a password with salt using Web Crypto API
async function hashPassword(password, salt) {
  // Convert password and salt to ArrayBuffer
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password + salt);

  // Hash using SHA-256
  let hash = await crypto.subtle.digest("SHA-256", passwordData);

  // Apply iterations for stronger security
  for (let i = 1; i < HASH_ITERATIONS; i++) {
    hash = await crypto.subtle.digest("SHA-256", hash);
  }

  // Convert to hex string
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Function to verify a password against the stored hash
async function verifyPassword(inputPassword) {
  const inputHash = await hashPassword(inputPassword, PASSWORD_SALT);

  return inputHash === CORRECT_PASSWORD;
}

// Login functionality
async function setupLogin() {
  const urlParams = new URLSearchParams(window.location.search);
  const authKey = urlParams.get("authKey");
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (authKey) {
    const isValid = await verifyPassword(authKey);
    if (isValid) {
      localStorage.setItem("isLoggedIn", "true");
      hideLoginOverlay();
      processAllVideos();
    }
  }

  // Check if user is already logged in
  if (isLoggedIn === "true") {
    hideLoginOverlay();
    return;
  }

  // Show the login overlay
  const loginOverlay = document.getElementById("loginOverlay");
  if (loginOverlay) {
    loginOverlay.style.display = "flex";
  }

  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const passwordInput = document.getElementById("passwordInput");
    const password = passwordInput.value;

    try {
      // Show loading indicator during verification
      const loginButton = loginForm.querySelector(".login-btn");
      if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = "Verifying...";
      }

      // Verify password against stored hash
      const isValid = await verifyPassword(password);

      if (isValid) {
        // Store login state
        localStorage.setItem("isLoggedIn", "true");
        hideLoginOverlay();
      } else {
        // Show error
        const loginError = document.getElementById("loginError");
        if (loginError) {
          loginError.style.display = "block";

          // Clear the error after 3 seconds
          setTimeout(() => {
            loginError.style.display = "none";
          }, 3000);
        }
      }

      // Restore button state
      if (loginButton) {
        loginButton.disabled = false;
        loginButton.textContent = "Login";
      }

      // Clear the password field
      passwordInput.value = "";
      passwordInput.focus();
    } catch (error) {
      console.error("Error during password verification:", error);

      // Show error message
      const loginError = document.getElementById("loginError");
      if (loginError) {
        loginError.textContent = "Authentication error. Please try again.";
        loginError.style.display = "block";

        setTimeout(() => {
          loginError.style.display = "none";
          loginError.textContent = "Incorrect password. Please try again.";
        }, 3000);
      }

      // Restore button state
      const loginButton = loginForm.querySelector(".login-btn");
      if (loginButton) {
        loginButton.disabled = false;
        loginButton.textContent = "Login";
      }
    }
  });
}

// Function to hide the login overlay
function hideLoginOverlay() {
  const loginOverlay = document.getElementById("loginOverlay");
  if (loginOverlay) {
    loginOverlay.style.display = "none";
  }
}

// Add logout functionality
function addLogoutButton() {
  const logoutButton = document.getElementById("logoutButton");
  // Add click handler
  logoutButton.addEventListener("click", function () {
    // Clear login state
    localStorage.removeItem("isLoggedIn");

    // Show login overlay
    const loginOverlay = document.getElementById("loginOverlay");
    if (loginOverlay) {
      loginOverlay.style.display = "flex";
    }

    // Clear password field
    const passwordInput = document.getElementById("passwordInput");
    if (passwordInput) {
      passwordInput.value = "";
    }
  });

}

// Function to show loading state
function showLoading(message = "Loading model and processing video...") {
  const loadingIndicators = document.querySelectorAll("#loadingIndicator");
  const loadingTexts = document.querySelectorAll("#loadingText");

  loadingIndicators.forEach((indicator) => {
    if (indicator && indicator.parentElement.style.display !== "none") {
      indicator.style.display = "block";
    }
  });

  loadingTexts.forEach((text) => {
    if (text && text.parentElement.style.display !== "none") {
      text.textContent = message;
      text.style.display = "block";
    }
  });

  // Disable Process All button while loading
  if (elements.startEvaluation) {
    elements.startEvaluation.disabled = true;
  }

  // Disable user list items while loading
  const userItems = document.querySelectorAll(".user-item");
  userItems.forEach((item) => {
    item.style.pointerEvents = "none";
    item.style.opacity = "0.6";
  });
}

// Function to hide loading state
function hideLoading() {
  const loadingIndicators = document.querySelectorAll("#loadingIndicator");
  const loadingTexts = document.querySelectorAll("#loadingText");

  loadingIndicators.forEach((indicator) => {
    if (indicator) {
      indicator.style.display = "none";
    }
  });

  loadingTexts.forEach((text) => {
    if (text) {
      text.style.display = "none";
    }
  });

  // Enable Process All button
  if (elements.startEvaluation) {
    elements.startEvaluation.disabled = false;
  }

  // Enable user list items
  const userItems = document.querySelectorAll(".user-item");
  userItems.forEach((item) => {
    item.style.pointerEvents = "auto";
    item.style.opacity = "1";
  });
}

// Function to update model status in UI
function updateModelStatus() {
  const modelStatus = document.getElementById("modelStatus");
  if (modelStatus) {
    if (isModelLoaded) {
      modelStatus.textContent = "Model: Loaded";
      modelStatus.classList.remove("not-loaded");
      modelStatus.classList.add("loaded");
    } else {
      modelStatus.textContent = "Model: Not Loaded";
      modelStatus.classList.remove("loaded");
      modelStatus.classList.add("not-loaded");
    }
  }
}

// Function to ensure the model is properly reloaded after resource cleanup
async function reinitializeModelAfterCleanup() {
  try {
    logAnomalyProcess("Reinitializing Human.js model after resource cleanup...");

    // Mark model as not loaded to force reinitialization
    isModelLoaded = false;
    updateModelStatus();
    
    // Add a small delay to allow GPU resources to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Force reload the model
    await ensureModelLoaded();

    logAnomalyProcess("Model reinitialized successfully");
    return true;
  } catch (error) {
    console.error("Error reinitializing model:", error);
    return false;
  }
}

// Function to ensure the model is loaded if not already loaded
async function ensureModelLoaded() {
  if (!isModelLoaded) {
    showLoading("Loading AI model...");
    logAnomalyProcess("Loading Human model...");

    try {
      // Reinitialize human instance if needed after cleanup
      if (!human || typeof human.load !== 'function') {
        logAnomalyProcess("Recreating Human instance...");
        human = new S.Human(humanConfig);
      }
      
      await human.load();
      await human.warmup();
      isModelLoaded = true;
      updateModelStatus();
      logAnomalyProcess("Human model loaded and warmed up");
    } catch (error) {
      console.error("Error loading Human model:", error);
      isModelLoaded = false;
      updateModelStatus();
      throw error;
    }
  }
  return true;
}

const elements = {
  video: document.getElementById("video"),
  canvas: document.getElementById("canvas"),
  videoUpload: document.getElementById("videoUpload"),
  startEvaluation: document.getElementById("startEvaluation"),
  cropToggle:
    document.getElementById("cropToggle") || document.createElement("button"),
  cropControls:
    document.getElementById("cropControls") || document.createElement("div"),
  webcamToggle:
    document.getElementById("webcamToggle") || document.createElement("button"),
  cameraSelect: null,
};
const fpsTimes = { detect: 0, draw: 0 };
human.env.perfadd = false;
human.draw.options.font = 'small-caps 18px "Lato"';
human.draw.options.lineHeight = 20;

let results = [];
let processData = {};
let violationCount = 0;
let isProcessing = false;

const cropConfig = {
  enabled: true,
  x: 640,
  y: 180,
  width: 640,
  height: 360,
  originalWidth: 0,
  originalHeight: 0,
};

// Add a utility function for converting images to black and white
function convertToGrayscale(canvas) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale using luminance formula
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray; // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
    // Alpha remains unchanged
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// Add a function to enhance image contrast
function enhanceContrast(canvas) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Find min and max values for auto-contrast
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const val = data[i]; // Since it's grayscale, all RGB values are the same
    if (val < min) min = val;
    if (val > max) max = val;
  }

  // Avoid division by zero
  if (max === min) {
    return canvas;
  }

  // Apply contrast stretching
  const range = max - min;
  for (let i = 0; i < data.length; i += 4) {
    // Apply auto-contrast to stretch values from 0-255
    const adjustedVal = Math.round(((data[i] - min) / range) * 255);
    data[i] = adjustedVal; // R
    data[i + 1] = adjustedVal; // G
    data[i + 2] = adjustedVal; // B
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// Function to update the progress indicators in the UI
function updateProgressIndicators() {
  const processedCountElement = document.getElementById("processedCount");
  const totalCountElement = document.getElementById("totalCount");
  const progressBarFill = document.getElementById("progressBarFill");
  const listInfo = document.getElementById("listInfo");

  if (processedCountElement && totalCountElement && progressBarFill) {
    const processedUsers = cachedUserList.filter(
      (user) => user.anomalyStatus === "PROCESSED"
    ).length;
    const totalUsers = cachedUserList.length;

    processedCountElement.textContent = processedUsers;
    totalCountElement.textContent = totalUsers;

    const progressPercent =
      totalUsers > 0 ? (processedUsers / totalUsers) * 100 : 0;
    progressBarFill.style.width = `${progressPercent}%`;
  }

  if (listInfo) {
    const lastFetchTime = new Date().toLocaleTimeString();
    listInfo.innerHTML = `
      Last updated: ${lastFetchTime} 
      <button id="refreshList" class="btn" style="padding: 2px 8px; font-size: 12px; margin-left: 8px;">Refresh</button>
    `;

    // Add click handler for refresh button
    const refreshButton = document.getElementById("refreshList");
    if (refreshButton) {
      refreshButton.addEventListener("click", async () => {
        // Show loading state in list info
        listInfo.textContent = "Refreshing list...";

        // Force refetch the list
        await fetchList(true);
      });
    }
  }
}

// Function to get URL parameters
function getUrlParameter(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  const regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  const results = regex.exec(location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// Function to fetch a single attendee by ID
async function fetchAttendeeById(attenderId) {
  if (!attenderId) return null;

  // Show loading UI
  showLoading("Loading specific attendee data...");
  
  // Show status in header
  updateHeaderStatus("Loading specific attendee data...", true);

  try {
    console.log("Fetching specific attendee with ID:", attenderId);
    // Use query parameter instead of path parameter
    const apiUrl = `${ATTENDER_END_POINT}/anomaly?attenderId=${attenderId}`;

    const response = await fetch(apiUrl, {
      headers: apiHeaders,
    });

    if (!response.ok) {
      console.error(`API request failed with status ${response.status}`);
      updateHeaderStatus("Error loading attendee data", false);
      setTimeout(() => updateHeaderStatus(), 3000);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    // The endpoint returns a list, but we're only interested in the first (and only) item
    const attendees = responseData?.data || [];
    const attendee = attendees.length > 0 ? attendees[0] : null;

    if (attendee) {
      // Store in our cached list so other functions work properly
      cachedUserList = [attendee];
      processedCount = 0;

      // Update UI
      updateUserList([attendee]);
      updateProgressIndicators();
      
      // Update header with attendee info
      const userName = attendee.mail || attendee._id || 'user';
      updateHeaderStatus(`Attendee loaded: ${userName}`, false);

      // Hide loading UI
      hideLoading();

      return attendee;
    } else {
      console.error("No attendee data found for ID:", attenderId);
      updateHeaderStatus("Attendee not found", false);
      setTimeout(() => updateHeaderStatus(), 3000);
      hideLoading();
      return null;
    }
  } catch (error) {
    console.error("Error fetching attendee:", error);
    updateHeaderStatus("Error loading attendee data", false);
    setTimeout(() => updateHeaderStatus(), 3000);
    hideLoading();
    return null;
  }
}

async function fetchList(forceRefetch = false) {
  // If we have a specific attenderId in the URL, we don't need the full list
  const urlAttenderId = getUrlParameter("attenderId");
  if (urlAttenderId) {
    console.log("URL contains attenderId, skipping full list fetch");
    return cachedUserList;
  }

  // If we have cached users and not forcing a refetch, use the cached list
  if (cachedUserList.length > 0 && !forceRefetch) {
    console.log("Using cached user list with", cachedUserList.length, "users");
    updateUserList(cachedUserList);
    updateProgressIndicators();
    return cachedUserList;
  }

  const apiUrl = `${ATTENDER_END_POINT}/anomaly` + (urlExamId ? `?examId=${urlExamId}` : "");
  try {
    logAnomalyProcess("Fetching new user list from API...");
    const response = await fetch(apiUrl, {
      headers: apiHeaders,
    });

    if (!response.ok) {
      console.error(`API request failed with status ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const filteredResponse = await response.json();
    const users = filteredResponse?.data || [];

    // Cache the fetched user list
    cachedUserList = users;
    processedCount = 0;

    updateUserList(users);
    updateProgressIndicators();
    return users;
  } catch (error) {
    console.error("API request failed:", error);
    return [];
  }
}

function updateUserList(users) {
  const userList = document.getElementById("userList");
  if (!userList) return;

  // Store the original users list for filtering
  userList.originalUsers = users;

  // Get the current search term
  const searchInput = document.getElementById("userSearch");
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

  // Filter users based on search term if there is one
  const filteredUsers = searchTerm
    ? users.filter(
        (user) =>
          (user.mail && user.mail.toLowerCase().includes(searchTerm)) ||
          (user._id && user._id.toLowerCase().includes(searchTerm)) ||
          (user.anomalyStatus &&
            user.anomalyStatus.toLowerCase().includes(searchTerm))
      )
    : users;

  userList.innerHTML = "";

  if (filteredUsers.length === 0) {
    const noResults = document.createElement("div");
    noResults.className = "no-results";
    noResults.textContent = "No users match your search.";
    noResults.style.textAlign = "center";
    noResults.style.padding = "20px";
    noResults.style.color = "#666";
    userList.appendChild(noResults);
    return;
  }

  filteredUsers.forEach((user, index) => {
    const li = document.createElement("li");
    li.className = "user-item";
    if (processData?._id === user._id) {
      li.classList.add("active");
    }

    const status = user.anomalyStatus || "PENDING";
    const statusClass = status.toLowerCase();

    li.innerHTML = `
      <div class="user-email">${user.mail || "No email"}</div>
      <div class="user-status">
        <span class="status-indicator status-${statusClass}"></span>
        ${status}
      </div>
      <div class="user-details">
        <small>ID: ${user._id}</small>
        <div class="action-buttons">
          <a href="?attenderId=${user._id}" class="open-new-tab" title="Open in new tab" target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
              <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
            </svg>
          </a>
        </div>
      </div>
    `;

    // Add click handler to the entire list item
    li.addEventListener("click", async (e) => {
      // Don't trigger if clicking the open in new tab button
      if (e.target.closest('.open-new-tab')) {
        return;
      }

      document.querySelectorAll(".user-item").forEach((item) => item.classList.remove("active"));
      li.classList.add("active");

      // Set the user data and immediately start processing
      processData = user;

      // Show loading state
      showLoading("Loading model and processing video...");

      // Ensure model is loaded before processing
      await ensureModelLoaded();

      // Now start processing
      initializeProcessing(true);
    });

    userList.appendChild(li);
  });
}

// Add a new function to update canvas with user info
function updateCanvasWithUserInfo(user) {
  const canvas = elements.canvas;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#333";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";

  const email = user.email || "Unknown User";
  const status = user.anomalyStatus || "PENDING";

  ctx.fillText(`Selected: ${email}`, canvas.width / 2, canvas.height / 2 - 20);

  ctx.fillText(`Status: ${status}`, canvas.width / 2, canvas.height / 2 + 20);

  ctx.font = "16px Arial";
  ctx.fillText(
    "Click 'Process' to start analyzing video",
    canvas.width / 2,
    canvas.height / 2 + 60
  );
}

async function fetchSignedUrl(attenderId) {
  const url = `${EXAM_ATTENDER_END_POINT}/signed-url?attenderId=${attenderId}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: apiHeaders,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const signedUrlData = await response.json();
    return signedUrlData?.data;
  } catch (error) {
    console.error("Error fetching signed url:", error);
  }
}

async function updateAnomalyStatus(status = "PROCESSING") {
  const url = `${ATTENDER_END_POINT}/anomaly-status?attenderId=${processData._id}`;
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": ApiKey,
  };
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify({ anomalyStatus: status }),
    });
  } catch (error) {
    console.error("Error during PUT request:", error);
  }
}

function resetApplicationState(reinitialize = true) {
  // Always make sure header status is cleared
  updateHeaderStatus();
  
  results = [];
  violationCount = 0;
  isProcessing = false;
  processData = {};
  
  // Add GPU resource cleanup to prevent WebGL context loss
  try {
    // Dispose of human.js resources properly
    if (human && typeof human.dispose === 'function') {
      console.log("Disposing human.js resources...");
      human.dispose();
    }
    
    // Clear any WebGL contexts by disposing canvas contexts
    const canvas = elements.canvas;
    if (canvas) {
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2') || canvas.getContext('experimental-webgl');
      if (gl) {
        console.log("Cleaning up WebGL context...");
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
      }
      
      // Force garbage collection of canvas by recreating the 2D context
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    // Force garbage collection hint
    if (window.gc) {
      window.gc();
    }
    
    console.log("GPU resources cleaned up");
  } catch (error) {
    console.error("Error cleaning up GPU resources:", error);
  }
  
  // Reset audio context and analyser
  if (audioContext) {
    try {
      // Disconnect any existing connections
      if (audioSource) {
        try {
          audioSource.disconnect();
        } catch (e) {
          console.log("Error disconnecting audio source:", e);
        }
        audioSource = null;
      }
      
      if (audioAnalyser) {
        try {
          audioAnalyser.disconnect();
        } catch (e) {
          console.log("Error disconnecting audio analyser:", e);
        }
        audioAnalyser = null;
      }
      
      // Suspend the audio context (don't close it as we might reuse it)
      audioContext.suspend().catch(e => {
        console.error("Error suspending audio context:", e);
      });
      
      audioDataArray = null;
      
      console.log("Audio resources cleaned up");
    } catch (e) {
      console.error("Error cleaning up audio resources:", e);
    }
  }

  Object.keys(status).forEach((key) => {
    if (key !== "timeout") {
      status[key].status = false;
      status[key].val = 0;
    }
  });

  if (elements.video.srcObject) {
    stopWebcam();
  }
  elements.video.src = "";
  elements.video.srcObject = null;

  const canvas = elements.canvas;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#333";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "Select a user from the list to start processing",
    canvas.width / 2,
    canvas.height / 2
  );

  const resultsDisplay = document.getElementById("liveResults");
  if (resultsDisplay) {
    resultsDisplay.style.display = "none";
  }

  const refFaceDisplay = document.getElementById("refFaceDisplay");
  if (refFaceDisplay) {
    refFaceDisplay.style.display = "none";
  }

  globalFaceSimilarity = 0;

  // Only reinitialize if requested
  if (reinitialize) {
    initializeProcessing();
  }
}

// Add a function to update the header status message
function updateHeaderStatus(message = '', isProcessing = false) {
  const headerLeftElement = document.querySelector('.header-controls');
  
  // Remove any existing status message
  const existingStatus = document.getElementById('headerStatusMessage');
  if (existingStatus) {
    existingStatus.remove();
  }
  
  // If we have a message, add it to the header
  if (message && headerLeftElement) {
    const statusElement = document.createElement('span');
    statusElement.id = 'headerStatusMessage';
    statusElement.className = isProcessing ? 'header-status processing' : 'header-status';
    statusElement.textContent = message;
    
    // Insert after the title
    headerLeftElement.insertAdjacentElement('afterend', statusElement);
  }
}

// Add function to toggle privacy mode
function togglePrivacyMode() {
  isPrivacyModeEnabled = !isPrivacyModeEnabled;
  
  const privacyButton = document.getElementById('privacyMode');
  if (privacyButton) {
    privacyButton.classList.toggle('active', isPrivacyModeEnabled);
    privacyButton.textContent = isPrivacyModeEnabled ? 'Disable Privacy Mode' : 'Enable Privacy Mode';
  }
  
  const videoContainer = document.getElementById('videoContainer');
  if (videoContainer) {
    videoContainer.classList.toggle('privacy-mode', isPrivacyModeEnabled);
  }
  
  // Show/hide the canvas overlay based on privacy mode
  if (elements.canvas) {
    if (isPrivacyModeEnabled) {
      // Make sure canvas is visible and positioned over the video
      elements.canvas.style.display = 'block';
      elements.canvas.style.position = 'absolute';
      elements.canvas.style.top = '0';
      elements.canvas.style.left = '0';
      elements.canvas.style.zIndex = '10';
      
      // If we have a video container, make sure it has position relative
      if (videoContainer) {
        videoContainer.style.position = 'relative';
      }
    } else {
      // Hide canvas overlay in normal mode (unless we're in debug mode)
      if (!isDebugMode) {
        elements.canvas.style.position = '';
        elements.canvas.style.top = '';
        elements.canvas.style.left = '';
        elements.canvas.style.zIndex = '';
      }
    }
  }
  
  // Update message to user
  updateHeaderStatus(
    isPrivacyModeEnabled ? 'Privacy mode enabled - video is hidden' : 'Privacy mode disabled', 
    false
  );
  
  // After 3 seconds, clear the message
  setTimeout(() => {
    updateHeaderStatus();
  }, 3000);
}

async function callStop(attenderId) {
  try { 
    await fetch(`${SERVICE_BASE_URL}/api/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        attenderId: attenderId,
      }),
    });
  } catch (e) {
    console.warn("Stop call failed:", e);
  }
}

function generateFinalReport() {
  (async () => {
    if (!processData || !processData._id) return;

    const urlParams = new URLSearchParams(window.location.search);
    const isAutoProcess = urlParams.get("isAutoProcess");

    // Clear header status when completed
    updateHeaderStatus('Processing complete', false);
    
    const url = `${base_url}/attender/anomaly?attenderId=${processData._id}`;
    const finalReport = {
      anomaly: results,
      anomalyStatus: "PROCESSED",
      totalDuration: processData.video_duration,
      violationCount: violationCount,
    };

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ApiKey,
        },
        body: JSON.stringify(finalReport),
      });

      if (response.ok) {
        // Update the status in the cached user list
        const processedUser = cachedUserList.find(
          (user) => user._id === processData._id
        );
        if (processedUser) {
          processedUser.anomalyStatus = "PROCESSED";
        }

        // Increment the processed count
        processedCount++;

        // Update the UI with the updated cached list
        updateUserList(cachedUserList);
        updateProgressIndicators();

        if (isAutoProcess === "true") {
          await callStop(processData._id);
        }

        // Reset application state without reinitializing
        resetApplicationState(false);

        // Always fetch a new list after processing each video
        console.log("Fetching fresh user list after processing video");
        
        // Force refetch the list
        await fetchList(true);

        // After fetching new list, automatically continue processing without user clicking "Process All"
        await continueProcessingAfterRefetch();
      }
    } catch (error) {
      console.error("Error during PUT request:", error);
    }
  })();
}

// Function to find the next unprocessed user
function findNextUnprocessedUser() {
  return cachedUserList.find(
    (user) => user.anomalyStatus !== "PROCESSED" && user._id !== processData._id
  );
}

function stopWebcam() {
  if (elements.video.srcObject) {
    const tracks = elements.video.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
    elements.video.srcObject = null;
    elements.webcamToggle.textContent = "Start Webcam";
    elements.webcamToggle.style.backgroundColor = "#2196F3";
  }
}

async function loadReferenceFace(faceUrl) {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = faceUrl;

    await Promise.race([
      new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Image load timeout")), 10000)
      ),
    ]);

    if (img.width === 0 || img.height === 0) {
      throw new Error("Image loaded but has zero width or height");
    }

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    convertToGrayscale(canvas);
    enhanceContrast(canvas);

    let result = await human.detect(canvas);
    let referenceFace = result.face[0];

    if (!referenceFace?.embedding || referenceFace.faceScore < 0.5) {
      const tempConfig = { ...humanConfig };
      human.configure({
        face: {
          detector: {
            minConfidence: 0.1,
            return: true,
            rotation: true,
            skipFrames: 0,
          },
          description: {
            minConfidence: 0.1,
            skipFrames: 0,
          },
        },
      });

      result = await human.detect(canvas);
      referenceFace = result.face[0];
      human.configure(tempConfig);
    }

    if (!referenceFace?.embedding) {
      throw new Error("No valid face embedding found");
    }

    return referenceFace.embedding;
  } catch (error) {
    throw error;
  }
}

async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: true // Add audio capture for noise detection
    });
    elements.video.srcObject = stream;
    elements.video.muted = false; // Ensure audio is enabled
    await elements.video.play();
    
    // Set up audio analysis for webcam
    try {
      setupAudioAnalysis();
    } catch (e) {
      console.error("Could not setup audio analysis for webcam:", e);
    }
    
    return true;
  } catch (error) {
    console.error('Error accessing webcam:', error);
    return false;
  }
}

// Add debug mode handler
document.addEventListener('DOMContentLoaded', function() {
  const debugButton = document.getElementById('debugMode');
  const debugSection = document.getElementById('debugSection');
  
  if (debugButton) {
    debugButton.addEventListener('click', async function() {
      isDebugMode = !isDebugMode;
      debugButton.classList.toggle('active');
      
      // Toggle debug section visibility
      if (debugSection) {
        debugSection.classList.toggle('active', isDebugMode);
      }

      if (isDebugMode) {
        // Stop any current video processing
        if (isProcessing) {
          isProcessing = false;
        }

        // Reset the video source
        elements.video.src = '';
        elements.video.srcObject = null;

        // Show loading state
        showLoading('Starting webcam...');

        // Make canvas visible and set proper size
        elements.canvas.style.display = 'block';
        elements.canvas.width = 1280;
        elements.canvas.height = 720;

        // Ensure model is loaded
        await ensureModelLoaded();

        // Start webcam
        const webcamStarted = await startWebcam();
        if (webcamStarted) {
          // Create a dummy user for debug mode
          processData = {
            _id: 'debug-mode',
            mail: 'Debug Mode',
            anomalyStatus: 'PROCESSING'
          };

          // Start processing the webcam feed
          hideLoading();
          await processVideo();
        } else {
          alert('Failed to access webcam. Please ensure you have granted camera permissions.');
          isDebugMode = false;
          debugButton.classList.remove('active');
          debugSection.classList.remove('active');
          hideLoading();
        }
      } else {
        // Stop webcam and processing
        stopWebcam();
        isProcessing = false;

        // Reset the video element
        elements.video.src = '';
        elements.video.srcObject = null;

        // Reset results
        results = [];
        violationCount = 0;
        processData = {};

        // Clear and hide the canvas
        const ctx = elements.canvas.getContext('2d');
        ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

        // Hide results
        const resultsDisplay = document.getElementById('liveResults');
        if (resultsDisplay) {
          resultsDisplay.style.display = 'none';
        }
      }
    });
  }
});

// Modify processVideo function to handle privacy mode
async function processVideo() {
  try {
    // Ensure model is loaded before processing
    await ensureModelLoaded();

    // Add status message to header
    updateHeaderStatus('Processing video please wait', true);

    isProcessing = true;
    let lastLogTime = 0;
    let detectedViolations = [];
    let processingStartTime = Date.now() / 1000;
    let faceSimilarityScore = 0;
    
    // Reset frame skip counter
    frameSkipCounter = 0;

    // Apply video optimizations if fast mode is enabled
    if (optimizationConfig.enableFastMode && !isDebugMode) {
      console.log("Fast mode enabled - applying 10fps video optimizations with adaptive frame sampling");
      
      // Set video playback speed for faster processing
      elements.video.playbackRate = optimizationConfig.videoPlaybackSpeed;
      console.log(`Video playback speed set to ${optimizationConfig.videoPlaybackSpeed}x (optimized for 10fps sources)`);
      
      // Display current optimization settings
      display10fpsOptimizations();
      
      // Note: No processing timeout - will process full video regardless of length
      console.log("Full video processing mode - no time limits or early exits");
    } else {
      // Normal speed for debug mode or when optimizations are disabled
      elements.video.playbackRate = 1.0;
    }

    // Make sure video is not muted
    elements.video.muted = false;

    // Setup audio analysis with user interaction
    if (!elements.video.muted) {
      try {
        // We need to wait for a user gesture to create AudioContext in many browsers
        const setupAudio = async () => {
          console.log("Setting up audio analysis with user interaction");
          const success = setupAudioAnalysis();
          
          if (success && audioContext) {
            console.log("Audio context created, state:", audioContext.state);
            
            // Ensure the context is running
            if (audioContext.state !== 'running') {
              try {
                console.log("Resuming audio context...");
                await audioContext.resume();
                console.log("Audio context resumed:", audioContext.state);
              } catch (err) {
                console.error("Error resuming AudioContext:", err);
              }
            }
          } else {
            console.warn("Failed to set up audio analysis");
          }
        };
        
        // Call setupAudio immediately (might work if already have permission)
        await setupAudio();
        
        // Also add a click handler to the document to resume on user interaction
        const handleUserInteraction = async () => {
          console.log("User interaction detected, ensuring audio context is running");
          if (audioContext && audioContext.state !== 'running') {
            await audioContext.resume();
          }
          // Remove event listeners after first interaction
          document.removeEventListener('click', handleUserInteraction);
          document.removeEventListener('keydown', handleUserInteraction);
        };
        
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('keydown', handleUserInteraction);
      } catch (e) {
        console.error("Could not setup audio analysis:", e);
      }
    }

    // Show the results container in debug mode
    if (isDebugMode) {
      const resultsDisplay = document.getElementById('liveResults');
      if (resultsDisplay) {
        resultsDisplay.style.display = 'flex';
      }
    }

    // Add variables to track video pause state
    let videoPausedTime = 0;
    let videoPauseTimeout = null;
    const MAX_PAUSE_DURATION = 600000; // 10 minutes in milliseconds

    if (cropConfig.originalWidth === 0) {
      setFixedCropValues();
    }

    if (elements.video.paused) {
      try {
        await elements.video.play();
      } catch (e) {
        console.error("Error playing video:", e);
        throw e; // Will be caught by the outer try-catch
      }
    }

    // Set up pause listener
    const handleVideoPause = () => {
      // Skip setting up pause timer if the video has ended
      if (elements.video.ended) {
        console.log("Video ended, not starting pause timer");
        return;
      }

      videoPausedTime = Date.now();
      console.log("Video paused, starting pause timer");

      // Clear any existing timeout
      if (videoPauseTimeout) {
        clearTimeout(videoPauseTimeout);
      }

      // Set timeout to skip video if paused too long
      videoPauseTimeout = setTimeout(async () => {
        console.error(
          "Video paused for more than 10 minutes, skipping to next video"
        );
        isProcessing = false;
        await moveToNextVideo();
      }, MAX_PAUSE_DURATION);
    };

    const handleVideoPlay = () => {
      // Clear the timeout when video starts playing again
      if (videoPauseTimeout) {
        clearTimeout(videoPauseTimeout);
        videoPauseTimeout = null;
      }
      videoPausedTime = 0;
    };

    // Add event for video ending
    const handleVideoEnded = () => {
      // Clear the pause timeout if it exists
      if (videoPauseTimeout) {
        clearTimeout(videoPauseTimeout);
        videoPauseTimeout = null;
      }
      console.log("Video ended naturally");
    };

    // Add event listeners for pause/play/ended
    elements.video.addEventListener("pause", handleVideoPause);
    elements.video.addEventListener("play", handleVideoPlay);
    elements.video.addEventListener("ended", handleVideoEnded);

    // Make sure the canvas is properly set up even though it's hidden
    elements.canvas.width = elements.video.videoWidth;
    elements.canvas.height = elements.video.videoHeight;

    const isWebcam = elements.video.srcObject !== null;

    Object.keys(status).forEach((key) => {
      if (key !== "timeout") {
        status[key].status = false;
        status[key].val = 0;
      }
    });

    if (isWebcam) {
      results = [];
      violationCount = 0;
    }

    await human.warmup();

    // Video is now playing, hide loading indicator
    hideLoading();

    const processingTimeout = setTimeout(() => {
      console.error("Processing timeout for user:", processData._id);
      isProcessing = false;
      throw new Error("Processing timeout");
    }, 7200000); // 2 hour timeout

    try {
      while ((!elements.video.paused && !elements.video.ended) || (isDebugMode && elements.video.srcObject)) {
        if (!isProcessing) break;

        if (isWebcam && !elements.video.srcObject) {
          break;
        }

        if (elements.video.paused) {
          try {
            await elements.video.play();
          } catch (e) {
            break;
          }
        }

        // Frame skipping optimization for fast mode
        if (optimizationConfig.enableFastMode && !isDebugMode) {
          frameSkipCounter++;
          
          // Adaptive frame skipping for 10fps videos
          let currentSkipRate = optimizationConfig.frameSkipRate;
          
          if (optimizationConfig.tenFpsOptimizations.enabled && optimizationConfig.tenFpsOptimizations.adaptiveSkipping) {
            // Check recent violations to determine skip rate
            const recentResults = results.slice(-5); // Check last 5 results
            const recentViolations = recentResults.filter(r => r.detection.length > 0).length;
            
            if (recentViolations >= 3) {
              // High violation activity - process more frames
              currentSkipRate = optimizationConfig.tenFpsOptimizations.highActivitySkipRate;
            } else if (recentViolations === 0) {
              // No recent violations - can skip more frames
              currentSkipRate = optimizationConfig.tenFpsOptimizations.lowActivitySkipRate;
            }
            // else use default frameSkipRate for moderate activity
          }
          
          // Skip frames based on adaptive skip rate
          if (frameSkipCounter % currentSkipRate !== 0) {
            await new Promise((resolve) => setTimeout(resolve, 5)); // Small delay
            continue;
          }
          
          // Note: Removed early exit logic - will process full video regardless of violation count
          // This ensures complete video analysis as requested
        }

        detectedViolations = [];

        let inputElement = elements.video;

        if (cropConfig.enabled) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = cropConfig.width;
          tempCanvas.height = cropConfig.height;
          const tempCtx = tempCanvas.getContext("2d");
          tempCtx.drawImage(
            elements.video,
            cropConfig.x,
            cropConfig.y,
            cropConfig.width,
            cropConfig.height,
            0,
            0,
            cropConfig.width,
            cropConfig.height
          );
          inputElement = tempCanvas;
        }

        try {
          const enhancementCanvas = document.createElement("canvas");
          enhancementCanvas.width = inputElement.width;
          enhancementCanvas.height = inputElement.height;
          const enhancementCtx = enhancementCanvas.getContext("2d");
          enhancementCtx.drawImage(inputElement, 0, 0);
          convertToGrayscale(enhancementCanvas);
          enhanceContrast(enhancementCanvas);
          inputElement = enhancementCanvas;
        } catch (error) {
          console.error("Error in image enhancement:", error);
          // Continue processing even if enhancement fails
        }

        try {
          await human.detect(inputElement);
          const now = human.now();
          status.detectFPS.val =
            Math.round(10000 / (now - fpsTimes.detect)) / 10;
          fpsTimes.detect = now;

          // Privacy mode - draw on canvas differently based on mode
          const ctx = elements.canvas.getContext('2d');
          ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
          
          if (isPrivacyModeEnabled || isDebugMode) {
            // For privacy mode or debug mode, draw anonymized version
            
            // Fill with neutral background
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);
            
            // Draw crop region if enabled
            if (cropConfig.enabled) {
              ctx.strokeStyle = '#00ff00';
              ctx.lineWidth = 2;
              ctx.strokeRect(
                cropConfig.x, 
                cropConfig.y, 
                cropConfig.width, 
                cropConfig.height
              );
            }
            
            // Draw face detection boxes and details
            if (human.result.face && human.result.face.length > 0) {
              human.result.face.forEach((face, index) => {
                const box = face.box;
                ctx.strokeStyle = '#1877F2';
                ctx.lineWidth = 2;
                ctx.strokeRect(box[0], box[1], box[2], box[3]);
                
                // Add detection details
                ctx.fillStyle = '#1877F2';
                ctx.font = '14px Arial';
                const confidence = Math.round(face.faceScore * 100);
                ctx.fillText(`Face ${index + 1} | Conf: ${confidence}%`, 
                  box[0], box[1] - 10);
                
                // Draw basic face landmarks (eyes, nose, mouth) instead of actual face
                if (face.mesh && face.mesh.length > 0) {
                  // Eyes
                  const leftEye = face.mesh[468];
                  const rightEye = face.mesh[473];
                  if (leftEye && rightEye) {
                    ctx.fillStyle = '#1877F2';
                    ctx.beginPath();
                    ctx.arc(leftEye[0], leftEye[1], 5, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(rightEye[0], rightEye[1], 5, 0, 2 * Math.PI);
                    ctx.fill();
                  }
                  
                  // Mouth
                  const mouth = face.mesh[0];
                  if (mouth) {
                    ctx.beginPath();
                    ctx.arc(mouth[0], mouth[1], 5, 0, 2 * Math.PI);
                    ctx.fill();
                  }
                }
              });
            }
            
            // Draw detected objects (phones, headphones)
            if (human.result.object && human.result.object.length > 0) {
              human.result.object.forEach(obj => {
                if (obj.score >= 0.15) {
                  ctx.strokeStyle = '#ff0000';
                  ctx.lineWidth = 2;
                  ctx.strokeRect(obj.box[0], obj.box[1], obj.box[2], obj.box[3]);
                  
                  // Add object details
                  ctx.fillStyle = '#ff0000';
                  ctx.font = '14px Arial';
                  const score = Math.round(obj.score * 100);
                  ctx.fillText(`${obj.label} | ${score}%`, obj.box[0], obj.box[1] - 5);
                }
              });
            }
            
            // Draw noise level indicator if available
            if (status.noiseDetected.val > 0) {
              const noiseLevel = status.noiseDetected.val;
              const isHighNoise = status.noiseDetected.status;
              
              // Draw noise meter
              const meterWidth = 200;
              const meterHeight = 20;
              const meterX = 20;
              const meterY = elements.canvas.height - meterHeight - 20;
              
              ctx.fillStyle = '#333';
              ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
              
              const levelWidth = noiseLevel * meterWidth;
              ctx.fillStyle = isHighNoise ? '#ff0000' : '#00ff00';
              ctx.fillRect(meterX, meterY, levelWidth, meterHeight);
              
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 2;
              ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
              
              ctx.fillStyle = '#fff';
              ctx.font = '14px Arial';
              ctx.fillText(
                `Noise: ${Math.round(noiseLevel * 100)}%`, 
                meterX, meterY - 5
              );
            }
            
            // Add privacy notice
            if (isPrivacyModeEnabled && !isDebugMode) {
              ctx.fillStyle = 'rgba(0,0,0,0.5)';
              ctx.fillRect(0, 0, elements.canvas.width, 40);
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 16px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(
                'PRIVACY MODE ENABLED - Video content hidden', 
                elements.canvas.width / 2, 
                25
              );
              ctx.textAlign = 'left';
            }
          } else if (!isDebugMode) {
            // Normal mode - just hide canvas and show video
            elements.canvas.style.display = 'none';
          }

          fpsTimes.draw = human.now();
          status.drawFPS.val = Math.round(10000 / (fpsTimes.draw - now)) / 10;

          const currentTime = isWebcam
            ? Math.floor(Date.now() / 1000 - processingStartTime)
            : Math.floor(elements.video.currentTime);

          const validFaces = human.result.face.filter((face) => {
            const faceWidth = face.box[2];
            const faceHeight = face.box[3];
            return Math.min(faceWidth, faceHeight) >= detectionOptions.minSize;
          });

          status.faceCount.val = validFaces.length;
          status.faceCount.status = status.faceCount.val === 1;

          if (status.faceCount.status) {
            const face = validFaces[0];
            const gestures = Object.values(human.result.gesture).map(
              (gesture) => gesture.gesture
            );

            if (
              gestures.includes("blink left eye") ||
              gestures.includes("blink right eye")
            ) {
              blinkTime.start = human.now();
            }

            if (
              blinkTime.start > 0 &&
              !gestures.includes("blink left eye") &&
              !gestures.includes("blink right eye")
            ) {
              blinkTime.end = human.now();
            }

            status.blinkDetected.status =
              status.blinkDetected.status ||
              (Math.abs(blinkTime.end - blinkTime.start) >
                detectionOptions.blinkMin &&
                Math.abs(blinkTime.end - blinkTime.start) <
                  detectionOptions.blinkMax);
            if (status.blinkDetected.status && blinkTime.time === 0) {
              blinkTime.time = Math.trunc(blinkTime.end - blinkTime.start);
            }

            status.facingCenter.status = gestures.includes("facing center");
            status.lookingCenter.status = gestures.includes("looking center");
            status.faceConfidence.val = face.faceScore || face.boxScore || 0;
            status.faceConfidence.status =
              status.faceConfidence.val >= detectionOptions.minConfidence;
            status.antispoofCheck.val = face.real || 0;
            status.antispoofCheck.status =
              status.antispoofCheck.val >= detectionOptions.minConfidence;
            status.livenessCheck.val = face.live || 0;
            status.livenessCheck.status =
              status.livenessCheck.val >= detectionOptions.minConfidence;
            status.faceSize.val = Math.min(face.box[2], face.box[3]);
            status.faceSize.status =
              status.faceSize.val >= detectionOptions.minSize;
            status.distance.val = face.distance || 0;
            status.distance.status =
              status.distance.val >= detectionOptions.distanceMin &&
              status.distance.val <= detectionOptions.distanceMax;
            status.descriptor.val = face.embedding?.length || 0;
            status.descriptor.status = status.descriptor.val > 0;
            status.age.val = face.age || 0;
            status.age.status = status.age.val > 0;
            status.gender.val = face.genderScore || 0;
            status.gender.status =
              status.gender.val >= detectionOptions.minConfidence;

            if (processData?.referenceEmbedding && face.embedding) {
              try {
                const videoFaceEmbedding = face.embedding;

                if (
                  videoFaceEmbedding.length !==
                  processData.referenceEmbedding.length
                ) {
                  console.error(
                    "Embedding length mismatch:",
                    videoFaceEmbedding.length,
                    "vs",
                    processData.referenceEmbedding.length
                  );
                }

                let finalSimilarity = 0;

                try {
                  const similarity1 = human.match.similarity(
                    videoFaceEmbedding,
                    processData.referenceEmbedding,
                    matchConfig
                  );

                  finalSimilarity = Math.max(0.001, similarity1);

                  let manualSimilarity = 0;
                  if (
                    videoFaceEmbedding.length ===
                    processData.referenceEmbedding.length
                  ) {
                    let dotProduct = 0;
                    let normA = 0;
                    let normB = 0;
                    for (let i = 0; i < videoFaceEmbedding.length; i++) {
                      dotProduct +=
                        videoFaceEmbedding[i] *
                        processData.referenceEmbedding[i];
                      normA += videoFaceEmbedding[i] * videoFaceEmbedding[i];
                      normB +=
                        processData.referenceEmbedding[i] *
                        processData.referenceEmbedding[i];
                    }

                    if (normA > 0 && normB > 0) {
                      manualSimilarity =
                        dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
                      manualSimilarity = (manualSimilarity + 1) / 2;

                      if (similarity1 < 0.1 && manualSimilarity > 0.3) {
                        finalSimilarity = (similarity1 + manualSimilarity) / 2;
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error calculating similarity:", error);
                  finalSimilarity = 0.1;
                }

                finalSimilarity = Math.max(0, Math.min(1, finalSimilarity));
                faceSimilarityScore = finalSimilarity;
                globalFaceSimilarity = finalSimilarity;

                if (finalSimilarity < detectionOptions.threshold) {
                  detectedViolations.push("faceMismatch");
                }
              } catch (error) {
                console.error("Error in face comparison:", error);
                // Continue processing even if face comparison fails
              }
            }
          }

          const phoneDetections = human.result.object.filter(
            (obj) =>
              [
                "cell phone",
                "mobile phone",
                "phone",
                "smartphone",
                "cellphone",
                "telephone",
              ].includes(obj.label.toLowerCase()) &&
              obj.score >= 0.15 &&
              obj.box[2] > 10
          );

          const headphoneResult = detectHeadphones();
          status.headphoneDetected.status = headphoneResult.detected;
          status.headphoneDetected.val = headphoneResult.confidence;

          if (headphoneResult.detected) {
            console.log(headphoneResult);
          }

          status.phoneDetected.status =
            phoneDetections.length > 0 ;
          status.phoneDetected.val = phoneDetections.length;

          // Check for high noise levels
          if (!elements.video.muted) {
            detectNoise();
          }

          if (!status.faceCount.status) {
            detectedViolations.push("userNotDetected");
          }

          if (!status.facingCenter.status) {
            detectedViolations.push("NotFacingScreen");
          }

          if (!status.lookingCenter.status) {
            detectedViolations.push("NotLookingAtScreen");
          }

          if (status.faceCount.val > 1) {
            detectedViolations.push("multipleFaces");
          }

          if (status.phoneDetected.status) {
            detectedViolations.push("phoneDetected");
          }

          if (status.headphoneDetected.status) {
            detectedViolations.push("headphoneDetected");
          }

          // Add noise detection violation
          if (status.noiseDetected.status) {
            detectedViolations.push("noiseDetected");
          }

          // Update the live results display even though canvas is hidden
          if (Math.floor(currentTime) > lastLogTime) {
            const roundedTime = Math.floor(currentTime) + 1;
            lastLogTime = roundedTime;

            results.push({
              time: roundedTime,
              detection: detectedViolations,
            });

            if (detectedViolations.length > 0) {
              violationCount += 1;
            }

            processData.video_duration = roundedTime;
            displayLiveResults(detectedViolations, faceSimilarityScore);
          }
        } catch (frameError) {
          console.error("Error processing frame:", frameError);
          // Continue processing next frame
        }

        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } finally {
      // Clean up event listeners and timeouts
      elements.video.removeEventListener("pause", handleVideoPause);
      elements.video.removeEventListener("play", handleVideoPlay);
      elements.video.removeEventListener("ended", handleVideoEnded);

      if (videoPauseTimeout) {
        clearTimeout(videoPauseTimeout);
        videoPauseTimeout = null;
      }

      clearTimeout(processingTimeout);
    }

    isProcessing = false;

    // Don't generate final report in debug mode
    if (!isDebugMode && elements.video.ended) {
      processData.video_duration = Math.round(lastLogTime);
      processData.violations = violationCount;
      generateFinalReport();
    } else {
      // Clear header status if we're not generating final report
      updateHeaderStatus();
    }
  } catch (error) {
    console.error("Error in video processing:", error);
    isProcessing = false;
    
    // Clear header status on error
    updateHeaderStatus();

    if (!isDebugMode) {
      await moveToNextVideo();
    }
  }
}

async function initializeProcessing(startProcessing = false) {
  // If video is already playing and we're not forcing a restart, return
  if (elements.video.srcObject && !startProcessing) {
    return;
  }

  // Clear existing video and canvas if we're starting a new process
  if (startProcessing) {
    // Update header with status
    const userName = processData && processData.mail ? processData.mail : 'user';
    updateHeaderStatus(`Initializing processing for ${userName}...`, true);
    
    if (elements.video.srcObject) {
      stopWebcam();
    }
    elements.video.src = "";
    elements.video.srcObject = null;

    // Ensure the liveResults container is visible
    const resultsDisplay = document.getElementById("liveResults");
    if (resultsDisplay) {
      resultsDisplay.style.display = "block";
    }
  }

  try {
    // If we don't have processData._id (user selected), fetch the first user
    if (!processData || !processData._id) {
      const videoData = await fetchList();
      if (videoData.length > 0) {
        processData = videoData[0];
        updateCanvasWithUserInfo(processData);

        // If not explicitly starting, just show the user info and return
        if (!startProcessing) {
          return;
        }
      } else {
        // No videos to process
        return;
      }
    }

    // Only continue if we're explicitly starting processing
    if (!startProcessing) {
      return;
    }

    const signedUrlData = await fetchSignedUrl(processData._id);
    if (!signedUrlData) {
      console.error("Failed to fetch signed URL for user:", processData._id);
      updateHeaderStatus(); // Clear header status on error
      await moveToNextVideo();
      return;
    }

    const url = signedUrlData?.signedUrl;
    const faceUrl = signedUrlData?.faceSignedUrl;

    if (!faceUrl) {
      console.error("No face URL provided in video item");
    }

    await updateAnomalyStatus();

    try {
      processData.referenceEmbedding = await loadReferenceFace(faceUrl);
    } catch (error) {
      console.error("Error loading reference face:", error);
      // Continue even without face reference
    }

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      console.error("Invalid video URL:", url);
      updateHeaderStatus(); // Clear header status on error
      await moveToNextVideo();
      return;
    }

    elements.video.srcObject = null;
    elements.video.crossOrigin = "anonymous";
    elements.video.muted = false; // Set to false to enable audio analysis
    elements.video.autoplay = true;
    elements.video.src = url;

    let videoLoaded = false;
    elements.video.onerror = async () => {
      if (!videoLoaded) {
        console.error("Error loading video for user:", processData._id);
        await moveToNextVideo();
      }
    };

    try {
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Video load timeout"));
        }, 30000); // 30 second timeout

        elements.video.onloadeddata = () => {
          clearTimeout(timeoutId);
          resolve();
        };
        elements.video.onerror = (e) => {
          clearTimeout(timeoutId);
          reject(e);
        };
        elements.video.play().catch((e) => {
          clearTimeout(timeoutId);
          reject(e);
        });
      });

      videoLoaded = true;
      await processVideo();
    } catch (error) {
      console.error("Error loading or processing video:", error);
      updateHeaderStatus(); // Clear header status on error
      await moveToNextVideo();
    }
  } catch (error) {
    console.error("Error in initializeProcessing:", error);
    updateHeaderStatus(); // Clear header status on error
    await moveToNextVideo();
  }
}

// Function to handle moving to the next video
async function moveToNextVideo() {
  try {
    // Clear header status when moving to next video
    updateHeaderStatus();
    
    // Only update the status in the backend if there are results (successful processing)
    // Skip the update if processing failed, leaving it as "PROCESSING" in the backend
    if (processData && processData._id && results.length > 0) {
      const url = `${base_url}/attender/anomaly?attenderId=${processData._id}`;
      const finalReport = {
        anomaly: results,
        anomalyStatus: "PROCESSED",
        totalDuration: processData.video_duration || 0,
        violationCount: violationCount || 0,
      };

      await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ApiKey,
        },
        body: JSON.stringify(finalReport),
      });

      // Update the cached list only for successfully processed videos
      const processedUser = cachedUserList.find(
        (user) => user._id === processData._id
      );
      if (processedUser) {
        processedUser.anomalyStatus = "PROCESSED";
      }

      // Increment processed count only for successful ones
      processedCount++;
    } else if (processData && processData._id) {
      console.log(
        `Skipping backend update for failed video: ${processData._id}, leaving in PROCESSING state`
      );
      const processedUser = cachedUserList.find(
        (user) => user._id === processData._id
      );

      if (processData.anomalyStatus == "PROCESSING")
        updateAnomalyStatus("PROCESSED");

      if (processedUser) {
        processedUser.anomalyStatus =
          processData.anomalyStatus === "PROCESSING"
            ? "PROCESSED"
            : "PROCESSING";
      }
      processedCount++;
    }
  } catch (error) {
    console.error("Error updating status for video:", error);
  }

  // Update UI with the current state
  updateUserList(cachedUserList);
  updateProgressIndicators();

  // Reset application state without reinitializing
  resetApplicationState(false);

  // Add a delay between videos to allow GPU resources to stabilize
  console.log("Waiting for GPU resources to stabilize before next video...");
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Always fetch a new list after processing each video
  console.log("Fetching fresh user list after processing video");
  
  try {
    // Force refetch the list
    await fetchList(true);
    
    // Continue processing with the refreshed list
    await continueProcessingAfterRefetch();
  } catch (error) {
    console.error("Error fetching updated list:", error);
    hideLoading();
  }
}

// Function to continue processing after refetching the list
async function continueProcessingAfterRefetch() {
  // Find unprocessed users in the newly fetched list
  const unprocessedUser = cachedUserList.find(
    (user) => user.anomalyStatus !== "PROCESSED"
  );

  if (unprocessedUser) {
    console.log(
      "Automatically continuing with next user after list refresh:",
      unprocessedUser.mail || unprocessedUser._id
    );

    // Set the user data
    processData = unprocessedUser;
    
    // Update header status
    const userName = unprocessedUser.mail || unprocessedUser._id || 'user';
    updateHeaderStatus(`Continuing batch processing with ${userName}...`, true);

    // Update UI to highlight the user
    document.querySelectorAll(".user-item").forEach((item) => {
      item.classList.remove("active");
      if (
        item
          .querySelector(".user-details small")
          .textContent.includes(unprocessedUser._id)
      ) {
        item.classList.add("active");
      }
    });

    try {
      // Reinitialize model after cleanup to prevent GPU issues
      const modelReady = await reinitializeModelAfterCleanup();
      
      if (!modelReady) {
        console.error("Failed to reinitialize model, skipping to next video");
        await moveToNextVideo();
        return;
      }

      // Start processing this user's video
      await initializeProcessing(true);
    } catch (error) {
      console.error("Error in continueProcessingAfterRefetch:", error);
      updateHeaderStatus("Error continuing processing", false);
      setTimeout(() => updateHeaderStatus(), 3000);
      await moveToNextVideo();
    }
  } else {
    console.log("No unprocessed users found in the new list");
    
    // Update header status to show completion
    updateHeaderStatus("Batch processing complete", false);
    
    // Hide the status after 5 seconds
    setTimeout(() => {
      updateHeaderStatus();
    }, 5000);
    
    hideLoading();

    // Start polling for new data since we have nothing to process
    startPollingForNewData();
  }
}

// Add polling mechanism for checking new data when idle
let pollingInterval = null;
const POLLING_INTERVAL = 30000; // 30 seconds

function startPollingForNewData() {
  // Clear any existing polling interval
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  console.log("Starting polling for new data every 30 seconds");

  // Set up polling interval
  pollingInterval = setInterval(async () => {
    // Only poll if not currently processing anything
    if (!isProcessing) {
      console.log("Polling for new data...");

      try {
        // Check for a URL parameter - don't poll in single attendee mode
        const urlAttenderId = getUrlParameter("attenderId");
        if (urlAttenderId) {
          console.log("In single attendee mode, stopping polling");
          stopPollingForNewData();
          return;
        }

        // Fetch fresh data from server
        const freshUsers = await fetchList(true);

        // Check if there are any unprocessed users
        const unprocessedUser = freshUsers.find(
          (user) => user.anomalyStatus !== "PROCESSED"
        );

        if (unprocessedUser) {
          console.log(
            "Found new unprocessed video during polling:",
            unprocessedUser.mail || unprocessedUser._id
          );

          // Stop polling as we're about to start processing
          stopPollingForNewData();

          // Set the user data
          processData = unprocessedUser;

          // Update UI to highlight the user
          document.querySelectorAll(".user-item").forEach((item) => {
            item.classList.remove("active");
            if (
              item
                .querySelector(".user-details small")
                .textContent.includes(unprocessedUser._id)
            ) {
              item.classList.add("active");
            }
          });

          // Show a notification in the UI
          const listInfo = document.getElementById("listInfo");
          if (listInfo) {
            listInfo.innerHTML = `<span style="color: #4CAF50;">Found new video to process!</span>`;

            // Restore normal display after 3 seconds
            setTimeout(() => {
              const lastFetchTime = new Date().toLocaleTimeString();
              listInfo.innerHTML = `
                Last updated: ${lastFetchTime} 
                <button id="refreshList" class="btn" style="padding: 2px 8px; font-size: 12px; margin-left: 8px;">Refresh</button>
              `;

              // Re-add refresh button handler
              const refreshButton = document.getElementById("refreshList");
              if (refreshButton) {
                refreshButton.addEventListener("click", async () => {
                  listInfo.textContent = "Refreshing list...";
                  await fetchList(true);
                });
              }
            }, 3000);
          }

          // Ensure model is loaded and start processing
          await ensureModelLoaded();
          await initializeProcessing(true);
        } else {
          console.log("No new unprocessed videos found during polling");
        }
      } catch (error) {
        console.error("Error during polling:", error);
      }
    }
  }, POLLING_INTERVAL);

  // Add a visual indicator that polling is active
  const modelStatus = document.getElementById("modelStatus");
  if (modelStatus) {
    const pollingIndicator = document.createElement("span");
    pollingIndicator.id = "pollingIndicator";
    pollingIndicator.textContent = " (Polling)";
    pollingIndicator.style.fontSize = "12px";
    pollingIndicator.style.color = "#4CAF50";

    // Only add if it doesn't exist yet
    if (!document.getElementById("pollingIndicator")) {
      modelStatus.appendChild(pollingIndicator);
    }
  }
}

function stopPollingForNewData() {
  if (pollingInterval) {
    console.log("Stopping polling for new data");
    clearInterval(pollingInterval);
    pollingInterval = null;

    // Remove polling indicator from UI
    const pollingIndicator = document.getElementById("pollingIndicator");
    if (pollingIndicator) {
      pollingIndicator.remove();
    }
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const canvas = elements.canvas;
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#333";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";

  // Add global WebGL context loss handler
  canvas.addEventListener('webglcontextlost', function(event) {
    console.warn('WebGL context lost detected, preventing default and marking model for reload');
    event.preventDefault();
    
    // Mark model as not loaded to force reinitialization
    isModelLoaded = false;
    updateModelStatus();
    
    // If we're currently processing, stop and try to recover
    if (isProcessing) {
      console.log('Stopping current processing due to WebGL context loss');
      isProcessing = false;
      
      // Show recovery message
      updateHeaderStatus('GPU context lost, recovering...', true);
      
      // Try to recover after a delay
      setTimeout(async () => {
        try {
          console.log('Attempting to recover from WebGL context loss...');
          await reinitializeModelAfterCleanup();
          updateHeaderStatus('Recovery successful, resuming processing...', true);
          
          // Resume processing if we have processData
          if (processData && processData._id) {
            await initializeProcessing(true);
          } else {
            updateHeaderStatus();
          }
        } catch (error) {
          console.error('Failed to recover from WebGL context loss:', error);
          updateHeaderStatus('Recovery failed, please refresh the page', false);
        }
      }, 3000);
    }
  });

  canvas.addEventListener('webglcontextrestored', function(event) {
    console.log('WebGL context restored');
    updateHeaderStatus('GPU context restored', false);
    setTimeout(() => updateHeaderStatus(), 2000);
  });

  // Add unhandled error listener for GPU-related errors
  window.addEventListener('unhandledrejection', function(event) {
    const error = event.reason;
    if (error && typeof error === 'object') {
      const errorMessage = error.message || error.toString();
      
      // Check for GPU-related errors
      if (errorMessage.includes('GPUBuffer') || 
          errorMessage.includes('WebGL') || 
          errorMessage.includes('context lost') ||
          errorMessage.includes('mapAsync')) {
        
        console.error('GPU-related error detected:', errorMessage);
        
        // Stop current processing
        if (isProcessing) {
          isProcessing = false;
          updateHeaderStatus('GPU error detected, recovering...', true);
          
          // Try to recover
          setTimeout(async () => {
            try {
              await reinitializeModelAfterCleanup();
              updateHeaderStatus('Recovery from GPU error successful', false);
              setTimeout(() => updateHeaderStatus(), 3000);
            } catch (recoveryError) {
              console.error('Failed to recover from GPU error:', recoveryError);
              updateHeaderStatus('Please refresh the page to continue', false);
            }
          }, 2000);
        }
        
        // Prevent the error from propagating
        event.preventDefault();
      }
    }
  });

  // Add the CSS for the header status message and privacy mode
  const style = document.createElement('style');
  style.textContent = `
    .header-status {
      margin-left: 15px;
      font-size: 14px;
      font-weight: normal;
      color: #4CAF50;
      padding: 2px 8px;
      border-radius: 4px;
    }
    
    .header-status.processing {
      color: #ffffff;
      background-color: #FF9800;
      animation: pulse 1.5s infinite;
    }
    
    @keyframes pulse {
      0% { opacity: 0.8; }
      50% { opacity: 1; }
      100% { opacity: 0.8; }
    }
    
    /* Privacy mode styles */
    #privacyMode {
      background-color: #2196F3;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      margin-left: 10px;
      font-size: 12px;
    }
    
    #privacyMode.active {
      background-color: #F44336;
    }
    
    /* Parallel processing and optimization button styles */
    #toggleProcessingMode, #optimizationSettings {
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      margin-left: 10px;
      font-size: 12px;
      transition: background-color 0.3s;
    }
    
    #toggleProcessingMode.parallel-mode {
      background-color: #FF5722;
    }
    
    #optimizationSettings.fast-mode {
      background-color: #FF9800;
    }
    
    #toggleProcessingMode:hover, #optimizationSettings:hover {
      opacity: 0.8;
    }
    
    #videoContainer {
      position: relative;
      width: 100%;
    }
    
    #videoContainer.privacy-mode video {
      opacity: 0.1;
    }
  `;
  document.head.appendChild(style);
  
  // Add privacy mode button to header
  const headerControls = document.querySelector('.header-controls');
  if (headerControls) {
    const privacyButton = document.createElement('button');
    privacyButton.id = 'privacyMode';
    privacyButton.textContent = 'Enable Privacy Mode';
    privacyButton.addEventListener('click', togglePrivacyMode);
    headerControls.appendChild(privacyButton);
    
    // Add parallel processing toggle button
    const parallelButton = document.createElement('button');
    parallelButton.id = 'toggleProcessingMode';
    parallelButton.textContent = parallelConfig.enableParallelProcessing ? 
      'Switch to Sequential Mode' : 'Switch to Parallel Mode';
    parallelButton.classList.add('processing-mode-toggle');
    if (parallelConfig.enableParallelProcessing) {
      parallelButton.classList.add('parallel-mode');
    }
    parallelButton.addEventListener('click', toggleProcessingMode);
    headerControls.appendChild(parallelButton);
    
    // Add optimization settings button
    const optimizationButton = document.createElement('button');
    optimizationButton.id = 'optimizationSettings';
    optimizationButton.textContent = optimizationConfig.enableFastMode ? 
      'Disable Fast Mode' : 'Enable Fast Mode';
    optimizationButton.classList.add('optimization-toggle');
    if (optimizationConfig.enableFastMode) {
      optimizationButton.classList.add('fast-mode');
    }
    optimizationButton.addEventListener('click', () => {
      optimizationConfig.enableFastMode = !optimizationConfig.enableFastMode;
      optimizationButton.textContent = optimizationConfig.enableFastMode ? 
        'Disable Fast Mode' : 'Enable Fast Mode';
      optimizationButton.classList.toggle('fast-mode', optimizationConfig.enableFastMode);
      
      if (optimizationConfig.enableFastMode) {
        updateHeaderStatus(
          'Fast mode enabled (2x speed, adaptive frame sampling for 10fps videos)', 
          false
        );
        // Display optimization settings to console
        display10fpsOptimizations();
      } else {
        updateHeaderStatus('Fast mode disabled', false);
      }
      
      setTimeout(() => updateHeaderStatus(), 3000);
    });
    headerControls.appendChild(optimizationButton);
  }
  
  // Wrap video and canvas in a container if not already
  const videoContainer = document.createElement('div');
  videoContainer.id = 'videoContainer';
  
  // Get the current parent of the video element
  const videoParent = elements.video.parentElement;
  
  // Insert the container before the video
  videoParent.insertBefore(videoContainer, elements.video);
  
  // Move video and canvas into the container
  videoContainer.appendChild(elements.video);
  videoContainer.appendChild(elements.canvas);

  // Check if we have an attenderId in the URL
  const urlAttenderId = getUrlParameter("attenderId");

  urlExamId = getUrlParameter("examId");

  // If we have an attenderId, bypass login and go straight to processing
  if (urlAttenderId) {
    // Hide login overlay if it's visible
    hideLoginOverlay();

    
    // Hide debug button and process all button in single attendee mode
    const debugButton = document.getElementById("debugMode");
    if (debugButton) {
      debugButton.style.display = "none";
    }
    
    const processAllButton = document.getElementById("startEvaluation");
    if (processAllButton) {
      processAllButton.style.display = "none";
    }

    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
      logoutButton.style.display = "none";
    }

    // Single attendee mode
    ctx.fillText(
      "Loading specific attendee data...",
      canvas.width / 2,
      canvas.height / 2
    );

    // Hide user list section if we're processing a specific attendee
    const userListSection = document.querySelector(".user-list-section");
    if (userListSection) {
      userListSection.style.display = "none";
    }

    // Expand video section to full width
    const videoSection = document.querySelector(".video-section");
    if (videoSection) {
      videoSection.style.width = "100%";
    }

    // Fetch and process the specific attendee
    const attendee = await fetchAttendeeById(urlAttenderId);

    if (attendee) {
      processData = attendee;

      // Ensure model is loaded and start processing
      await ensureModelLoaded();
      await initializeProcessing(true);
    } else {
      ctx.fillText(
        "Could not find the specified attendee. Please check the ID.",
        canvas.width / 2,
        canvas.height / 2
      );
    }
  }
  // Normal mode - require login
  else {
    // Set up login functionality
    setupLogin();

    // Add logout button to the UI
    addLogoutButton();

    // Display initial message while checking login
    ctx.fillText(
      "Please login to access the dashboard",
      canvas.width / 2,
      canvas.height / 2
    );

    // Initialize normal mode only if logged in
    function initializeNormalMode() {
      ctx.fillText(
        "Select a user from the list to start processing",
        canvas.width / 2,
        canvas.height / 2
      );

      // Initialize model status
      updateModelStatus();

      // Add click handler for the Start Evaluation button
      if (elements.startEvaluation) {
        elements.startEvaluation.addEventListener("click", () => {
          stopPollingForNewData(); // Stop polling when manually starting
          processAllVideos();
        });
      }

      // Add initial click handler for refresh button
      const refreshButton = document.getElementById("refreshList");
      if (refreshButton) {
        refreshButton.addEventListener("click", async () => {
          const listInfo = document.getElementById("listInfo");
          if (listInfo) {
            listInfo.textContent = "Refreshing list...";
          }
          await fetchList(true);
        });
      }

      // Set up search functionality
      const searchInput = document.getElementById("userSearch");
      if (searchInput) {
        searchInput.addEventListener("input", function () {
          const userList = document.getElementById("userList");
          if (userList && userList.originalUsers) {
            updateUserList(userList.originalUsers);
          }

          // Show/hide clear button based on input content
          const clearButton = document.getElementById("clearSearch");
          if (clearButton) {
            clearButton.style.display = this.value ? "block" : "none";
          }
        });

        // Add clear button functionality
        const clearButton = document.getElementById("clearSearch");
        if (clearButton) {
          clearButton.addEventListener("click", function () {
            searchInput.value = "";
            searchInput.focus();
            const userList = document.getElementById("userList");
            if (userList && userList.originalUsers) {
              updateUserList(userList.originalUsers);
            }
            this.style.display = "none";
          });
        }

        // Add clear button functionality when x is clicked in search field
        searchInput.addEventListener("search", function () {
          if (this.value === "") {
            const userList = document.getElementById("userList");
            if (userList && userList.originalUsers) {
              updateUserList(userList.originalUsers);
            }
            const clearButton = document.getElementById("clearSearch");
            if (clearButton) {
              clearButton.style.display = "none";
            }
          }
        });
      }

      // Just fetch the user list without loading the model
      fetchList().then((users) => {
        // Check if there are any unprocessed users
        const unprocessedUser = users.find(
          (user) => user.anomalyStatus !== "PROCESSED"
        );

        // If no unprocessed users, start polling
        if (!unprocessedUser) {
          startPollingForNewData();
        }
      });
    }

    // Modify the hideLoginOverlay function to initialize normal mode after login
    const originalHideLoginOverlay = hideLoginOverlay;
    hideLoginOverlay = function () {
      originalHideLoginOverlay();
      initializeNormalMode();
    };

    // If already logged in, initialize normal mode immediately
    if (localStorage.getItem("isLoggedIn") === "true" || urlExamId) {
      hideLoginOverlay();
    }
  }
});

function detectHeadphones() {
  let detected = false;
  let confidence = 0;
  const detectionMethods = [];

  const headphoneDetections = human.result.object.filter(
    (obj) =>
      [
        "earphone",
        "headphones",
        "headphone",
        "headset",
        "earphones",
        "earbuds",
        "electronics",
        "accessory",
      ].includes(obj.label.toLowerCase()) &&
      obj.score >= 0.1 &&
      obj.box[2] > 5
  );

  

  if (headphoneDetections.length > 0) {
    detected = true;
    confidence = Math.max(...headphoneDetections.map((h) => h.score));
    detectionMethods.push("model detection");
  }

  if (human.result.face.length > 0 && human.result.face[0].mesh) {
    const face = human.result.face[0];
    const rightEarIndex = 234;
    const leftEarIndex = 454;

    if (face.mesh.length > Math.max(rightEarIndex, leftEarIndex)) {
      const hasRightEar = face.mesh[rightEarIndex]?.[2] > 0.5;
      const hasLeftEar = face.mesh[leftEarIndex]?.[2] > 0.5;

      if ((hasRightEar || hasLeftEar) && human.result.object.length > 0) {
        const earX = hasRightEar
          ? face.mesh[rightEarIndex][0]
          : face.mesh[leftEarIndex][0];
        const earY = hasRightEar
          ? face.mesh[rightEarIndex][1]
          : face.mesh[leftEarIndex][1];

        const nearEarObjects = human.result.object.filter((obj) => {
          const objCenterX = obj.box[0] + obj.box[2] / 2;
          const objCenterY = obj.box[1] + obj.box[3] / 2;
          const distance = Math.sqrt(
            Math.pow(objCenterX - earX, 2) + Math.pow(objCenterY - earY, 2)
          );
          return (
            distance < obj.box[2] * 2 && obj.label.toLowerCase() !== "person"
          );
        });

        if (nearEarObjects.length > 0) {
          detected = true;
          confidence = Math.max(confidence, 0.6);
          detectionMethods.push("ear proximity");
        }
      }
    }
  }

  return { detected, confidence, methods: detectionMethods };
}

// Add a function to detect high noise levels
let audioContext = null;
let audioAnalyser = null;
let audioDataArray = null;
let audioSource = null;
const NOISE_THRESHOLD = 0.05; // Changed from 0.15 to 0.05 (5% threshold)
const NOISE_DETECTION_INTERVAL = 250; // Check more frequently (250ms)
let lastNoiseCheck = 0;

function setupAudioAnalysis() {
  try {
    // Create audio context if it doesn't exist
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log("Created new AudioContext, state:", audioContext.state);
    }
    
    // Resume audio context if it's suspended
    if (audioContext.state === 'suspended') {
      console.log("Resuming suspended AudioContext");
      audioContext.resume().then(() => {
        console.log("AudioContext resumed successfully");
      }).catch(err => {
        console.error("Failed to resume AudioContext:", err);
      });
    }
    
    // If we already have an analyser with the same video source, just return
    if (audioAnalyser && audioSource) {
      return true;
    }
    
    // Clean up any previous connections
    if (audioSource) {
      try {
        audioSource.disconnect();
      } catch (e) {
        console.log("Couldn't disconnect previous source, might be OK:", e);
      }
      audioSource = null;
    }
    
    // Get the audio source from the video element
    try {
      audioSource = audioContext.createMediaElementSource(elements.video);
      console.log("Created new media element source from video");
    } catch (e) {
      // If error is about already connected media element, try to work with existing connections
      console.warn("Could not create media element source, might be already connected:", e);
      
      // If we have an existing analyser, try to use it
      if (audioAnalyser) {
        return true;
      }
      
      // Otherwise, we can't proceed with audio analysis
      return false;
    }
    
    // Create an analyser
    audioAnalyser = audioContext.createAnalyser();
    audioAnalyser.fftSize = 1024; // Larger FFT size for better analysis
    audioAnalyser.smoothingTimeConstant = 0.3; // Add smoothing
    
    // Connect the source to the analyser and the analyser to the destination
    audioSource.connect(audioAnalyser);
    audioAnalyser.connect(audioContext.destination);
    
    // Create a data array for the analyser
    const bufferLength = audioAnalyser.frequencyBinCount;
    audioDataArray = new Uint8Array(bufferLength);
    
    console.log("Audio analysis setup successfully with buffer length:", bufferLength);
    return true;
  } catch (error) {
    console.error("Error setting up audio analysis:", error);
    return false;
  }
}

function detectNoise() {
  // Only check noise at certain intervals to avoid performance issues
  const now = Date.now();
  if (now - lastNoiseCheck < NOISE_DETECTION_INTERVAL) {
    return status.noiseDetected;
  }
  
  lastNoiseCheck = now;
  
  try {
    // If we don't have an audio analyser or if the video is muted, return false
    if (!audioAnalyser || elements.video.muted) {
      console.log("Audio detection skipped: analyser unavailable or video muted");
      return { status: false, val: 0 };
    }
    
    if (audioContext.state !== 'running') {
      console.log("Audio context not running, attempting to resume");
      audioContext.resume().catch(err => console.error("Failed to resume in detectNoise:", err));
      return { status: false, val: 0 };
    }
    
    // Try to use frequency data for better noise detection (volume-based)
    const frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
    audioAnalyser.getByteFrequencyData(frequencyData);
    
    // Also get time domain data (waveform)
    audioAnalyser.getByteTimeDomainData(audioDataArray);
    
    // Calculate the average volume from both methods
    let freqSum = 0;
    let waveSum = 0;
    let count = audioDataArray.length;
    
    for (let i = 0; i < count; i++) {
      // Process frequency data (0-255)
      if (i < frequencyData.length) {
        freqSum += frequencyData[i] / 255;
      }
      
      // Process waveform data (0-255, centered at 128)
      const amplitude = Math.abs((audioDataArray[i] - 128) / 128);
      waveSum += amplitude;
    }
    
    const freqAverage = count > 0 ? freqSum / count : 0;
    const waveAverage = count > 0 ? waveSum / count : 0;
    
    // Use the higher of the two values for better detection
    const averageVolume = Math.max(freqAverage, waveAverage);
    
    // Update the noise detection status
    status.noiseDetected.val = averageVolume;
    status.noiseDetected.status = averageVolume > NOISE_THRESHOLD;
    
    // Log noise detection events for troubleshooting
    if (averageVolume > 0.01) { // Log even very low levels for debugging
      const noisePercentage = (averageVolume * 100).toFixed(1);
      const thresholdPercentage = (NOISE_THRESHOLD * 100).toFixed(1);
      
      let message = `Noise level: ${noisePercentage}%, threshold: ${thresholdPercentage}%`;
      
      if (status.noiseDetected.status) {
        message += ` - NOISE DETECTED (${(averageVolume/NOISE_THRESHOLD).toFixed(1)}x threshold)`;
        console.warn(message); // Use warning level for detected noise
      } else if (averageVolume > NOISE_THRESHOLD/2) {
        message += " - Approaching threshold";
        console.log(message);
      } else {
        console.log(message);
      }
    }
    
    return status.noiseDetected;
  } catch (error) {
    console.error("Error detecting noise:", error);
    return { status: false, val: 0 };
  }
}

function displayLiveResults(detectedViolations, similarityScore = 0) {
  const resultsDisplay = document.getElementById("liveResults");
  if (!resultsDisplay) return;

  // Make sure the results container is visible
  resultsDisplay.style.display = "block";

  const effectiveScore =
    similarityScore > 0 ? similarityScore : globalFaceSimilarity;
  const similarityPercent = Math.round(effectiveScore * 100);

  let similarityColor = "#FF4444";
  let similarityText = "Poor Match";

  if (similarityPercent >= 75) {
    similarityColor = "#44FF44";
    similarityText = "Strong Match";
  } else if (similarityPercent >= 45) {
    similarityColor = "#FFFF44";
    similarityText = "Moderate Match";
  }

  // Handle noise level display
  const noiseLevel = status.noiseDetected.val || 0;
  const noisePercent = Math.round(noiseLevel * 100);
  let noiseColor = "#44FF44"; // Green for low noise
  let noiseMessage = '';
  
  if (status.noiseDetected.status) {
    noiseColor = "#FF4444"; // Red for high noise
    noiseMessage = '(NOISE DETECTED - ABOVE 5%)';
  } else if (noisePercent > 2) {
    noiseColor = "#FFCC44"; // Yellow for medium noise
    noiseMessage = '(Moderate noise)';
  }

  const violationsList =
    detectedViolations.length > 0
      ? detectedViolations
          .map((v) => `<span class="violation">${v}</span>`)
          .join(", ")
      : '<span class="no-violation">No violations detected</span>';

  resultsDisplay.innerHTML = `
    <h3>Live Anomaly Status</h3>
    <div style="margin: 5px 0; display: flex; flex-direction: column; gap: 5px; max-height: 300px;">
      <div style="margin-bottom: 5px;">
        <strong>Current Status:</strong> ${violationsList}
      </div>
      <div style="margin-bottom: 5px;">
        <strong>Face Match:</strong>
        <div style="margin-top: 5px;">
          <span style="font-weight: bold; color: ${similarityColor};">${similarityPercent}% (${similarityText})</span>
          <div style="height: 6px; width: 100%; background-color: #eee; border-radius: 3px; margin-top: 3px;">
            <div style="height: 100%; width: ${similarityPercent}%; background-color: ${similarityColor}; border-radius: 3px;"></div>
          </div>
        </div>
      </div>
      <div style="margin-bottom: 5px; width: 50%;">
        <strong>Noise Level:</strong>
        <div style="margin-top: 5px;">
          <span style="font-weight: bold; color: ${noiseColor};">${noisePercent}% ${noiseMessage}</span>
          <div style="height: 6px; width: 100%; background-color: #eee; border-radius: 3px; margin-top: 3px;">
            <div style="height: 100%; width: ${noisePercent}%; background-color: ${noiseColor}; border-radius: 3px;"></div>
          </div>
        </div>
      </div>
      ${
        processData?.referenceEmbedding?.length > 0
          ? '<div style="color: #4CAF50;">✓ Reference face loaded</div>'
          : '<div style="color: #F44336;">⚠ No reference face</div>'
      }
      ${
        audioContext && audioContext.state === 'running'
          ? '<div style="color: #4CAF50;">✓ Audio analysis active</div>'
          : '<div style="color: #F44336;">⚠ Audio analysis inactive</div>'
      }
    </div>
  `;
}

function setFixedCropValues() {
  if (elements.video.videoWidth > 0) {
    cropConfig.originalWidth = elements.video.videoWidth;
    cropConfig.originalHeight = elements.video.videoHeight;

    cropConfig.x = 640;
    cropConfig.y = 0;
    cropConfig.width = 640;
    cropConfig.height = 660;

    if (document.getElementById("cropX")) {
      const xPercent = Math.round(
        (cropConfig.x / cropConfig.originalWidth) * 100
      );
      const yPercent = Math.round(
        (cropConfig.y / cropConfig.originalHeight) * 100
      );
      const widthPercent = Math.round(
        (cropConfig.width / cropConfig.originalWidth) * 100
      );
      const heightPercent = Math.round(
        (cropConfig.height / cropConfig.originalHeight) * 100
      );

      document.getElementById("cropX").value = xPercent;
      document.getElementById("cropY").value = yPercent;
      document.getElementById("cropWidth").value = widthPercent;
      document.getElementById("cropHeight").value = heightPercent;

      document.getElementById("cropXValue").textContent = `${xPercent}%`;
      document.getElementById("cropYValue").textContent = `${yPercent}%`;
      document.getElementById(
        "cropWidthValue"
      ).textContent = `${widthPercent}%`;
      document.getElementById(
        "cropHeightValue"
      ).textContent = `${heightPercent}%`;
    }
  }
}

// Add a function to process all videos sequentially
async function processAllVideos() {
  try {
    // Check if parallel processing is enabled
    if (parallelConfig.enableParallelProcessing) {
      // Initialize parallel processors if not already done
      if (videoProcessors.length === 0) {
        initializeParallelProcessors();
        // Ensure model is loaded once for all processors
        await reinitializeModelAfterCleanup();
      }
      
      // Get fresh user list
      const users = await fetchList(true);
      
      // Start parallel processing
      await processVideosInParallel(users);
      return;
    }

    // Original sequential processing logic
    // Reset any existing processing
    resetApplicationState(false);

    // Show loading state
    showLoading("Loading model and fetching user list...");
    
    // Show status in header
    updateHeaderStatus("Preparing batch processing...", true);

    // Ensure the liveResults container is visible
    const resultsDisplay = document.getElementById("liveResults");
    if (resultsDisplay) {
      resultsDisplay.style.display = "block";
    }

    // Always fetch a fresh list when processing all
    let users = [];
    try {
      users = await fetchList(true);
    } catch (error) {
      console.error("Error fetching user list:", error);
      updateHeaderStatus(); // Clear header status
      alert("Failed to fetch users list. Please try again.");
      hideLoading();
      return;
    }

    if (!users || users.length === 0) {
      updateHeaderStatus(); // Clear header status
      alert("No users found to process");
      hideLoading();
      return;
    }

    // Ensure model is loaded before processing with proper error handling
    try {
      await reinitializeModelAfterCleanup();
    } catch (error) {
      console.error("Error loading model:", error);
      updateHeaderStatus(); // Clear header status
      alert("Failed to load AI model. Please try again.");
      hideLoading();
      return;
    }

    // Find the first unprocessed user
    const firstUnprocessed =
      users.find((user) => user.anomalyStatus !== "PROCESSED") || users[0];

    // Start processing with the first unprocessed user
    processData = firstUnprocessed;

    // Update UI to show which user is active
    const userItems = document.querySelectorAll(".user-item");
    userItems.forEach((item) => {
      item.classList.remove("active");
      if (
        item
          .querySelector(".user-details small")
          .textContent.includes(processData._id)
      ) {
        item.classList.add("active");
      }
    });

    // Update header status with the first user
    const userName = processData.mail || processData._id || 'user';
    updateHeaderStatus(`Starting batch processing with ${userName}...`, true);

    // Start processing this user's video
    await initializeProcessing(true);
  } catch (error) {
    console.error("Error in processAllVideos:", error);
    updateHeaderStatus(); // Clear header status
    hideLoading();
    alert(
      "An error occurred while setting up video processing. Please try again."
    );
  }
}

// Add a global test function for noise detection
window.testNoiseDetection = async function() {
  console.log("=====================================");
  console.log("Starting noise detection test");
  console.log("=====================================");
  
  // Check if we already have an audio context
  if (!audioContext) {
    console.log("Creating new AudioContext");
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  console.log("AudioContext state:", audioContext.state);
  
  if (audioContext.state === 'suspended') {
    console.log("Resuming AudioContext...");
    try {
      await audioContext.resume();
      console.log("AudioContext resumed, new state:", audioContext.state);
    } catch (err) {
      console.error("Failed to resume AudioContext:", err);
    }
  }
  
  // Check if video element exists and has a valid source
  if (!elements.video) {
    console.error("Video element not found!");
    return false;
  }
  
  console.log("Video element:", elements.video);
  console.log("Video muted:", elements.video.muted);
  console.log("Video paused:", elements.video.paused);
  console.log("Video src:", elements.video.src || "No src");
  console.log("Video srcObject:", elements.video.srcObject ? "Has srcObject" : "No srcObject");
  
  // Unmute the video
  elements.video.muted = false;
  console.log("Video unmuted");
  
  // Try to setup audio analysis
  console.log("Setting up audio analysis...");
  const setupSuccess = setupAudioAnalysis();
  console.log("Setup success:", setupSuccess);
  
  // Force play if paused
  if (elements.video.paused && elements.video.src) {
    console.log("Attempting to play video...");
    try {
      await elements.video.play();
      console.log("Video playing");
    } catch (err) {
      console.error("Failed to play video:", err);
    }
  }
  
  // Run noise detection 5 times with 1-second intervals
  console.log("Running noise detection tests...");
  
  for (let i = 0; i < 5; i++) {
    console.log(`Test ${i+1}:`);
    const result = detectNoise();
    console.log("  Noise level:", result.val);
    console.log("  Above threshold:", result.status);
    console.log("  Current threshold:", NOISE_THRESHOLD);
    
    if (i < 4) {
      console.log("Waiting 1 second...");
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log("=====================================");
  console.log("Noise detection test complete");
  console.log("=====================================");
  
  return "Test complete. Check console for results.";
};

// Function to adjust the noise threshold dynamically
window.adjustNoiseThreshold = function(newThreshold) {
  if (typeof newThreshold !== 'number' || newThreshold < 0 || newThreshold > 1) {
    console.error("Invalid threshold value. Must be a number between 0 and 1.");
    return false;
  }
  
  const oldThreshold = NOISE_THRESHOLD;
  NOISE_THRESHOLD = newThreshold;
  
  console.log(`Noise threshold adjusted from ${oldThreshold} to ${newThreshold}`);
  return true;
};

// Add optimization configuration
const optimizationConfig = {
  frameSkipRate: 5, // For 10fps videos: process every 5th frame = 2fps processing rate (more efficient for 10fps source)
  videoPlaybackSpeed: 2.0, // Reduced from 3x to 2x for better stability with 10fps videos
  maxProcessingDuration: null, // Remove time limit - process full video
  enableFastMode: true, // Enable frame sampling optimizations
  sampleInterval: 1, // Sample every 1 second for 10fps videos (more thorough than 2s)
  earlyExitOnMultipleViolations: false, // NEVER exit early - process full video
  violationThreshold: null, // Remove violation threshold - no early stopping
  ensureFullVideoProcessing: true, // Flag to ensure complete video analysis
  
  // New settings optimized for 10fps videos
  tenFpsOptimizations: {
    enabled: true,
    targetProcessingFps: 2, // Process at 2fps (every 5th frame of 10fps source)
    adaptiveSkipping: true, // Adjust frame skipping based on detected activity
    lowActivitySkipRate: 10, // Skip more frames during low activity periods
    highActivitySkipRate: 3, // Skip fewer frames during high activity (violations)
  }
};

// Add frame sampling counter
let frameSkipCounter = 0;

// Add parallel processing configuration
const parallelConfig = {
  maxConcurrentVideos: 3, // Process up to 3 videos simultaneously
  enableParallelProcessing: true,
  processingQueue: [],
  activeProcessors: new Map(),
  completedVideos: new Set(),
  ensureFullVideoProcessing: true // Ensure every video is processed completely
};

// Create multiple video elements for parallel processing
function createVideoProcessor(index) {
  const videoElement = document.createElement('video');
  videoElement.id = `video-processor-${index}`;
  videoElement.crossOrigin = 'anonymous';
  videoElement.muted = false;
  videoElement.autoplay = true;
  videoElement.style.display = 'none'; // Hidden processing videos
  document.body.appendChild(videoElement);
  
  const canvasElement = document.createElement('canvas');
  canvasElement.id = `canvas-processor-${index}`;
  canvasElement.style.display = 'none';
  document.body.appendChild(canvasElement);
  
  return {
    video: videoElement,
    canvas: canvasElement,
    id: index,
    isProcessing: false,
    currentUser: null
  };
}

// Initialize parallel processors
let videoProcessors = [];
function initializeParallelProcessors() {
  if (!parallelConfig.enableParallelProcessing) return;

  logAnomalyProcess(`Initializing ${parallelConfig.maxConcurrentVideos} parallel video processors`);

  for (let i = 0; i < parallelConfig.maxConcurrentVideos; i++) {
    videoProcessors.push(createVideoProcessor(i));
  }

  logAnomalyProcess('Parallel processors initialized');
}

// Parallel processing manager
async function processVideosInParallel(userList) {
  if (!parallelConfig.enableParallelProcessing || videoProcessors.length === 0) {
    logAnomalyProcess("Parallel processing disabled, falling back to sequential processing");
    return processAllVideos();
  }

  logAnomalyProcess(`Starting parallel processing of ${userList.length} videos with ${videoProcessors.length} processors`);

  // Update header status
  updateHeaderStatus(`Processing ${userList.length} videos in parallel...`, true);
  
  // Filter out already processed videos
  const unprocessedUsers = userList.filter(user => user.anomalyStatus !== "PROCESSED");
  
  if (unprocessedUsers.length === 0) {
    updateHeaderStatus("All videos already processed", false);
    setTimeout(() => updateHeaderStatus(), 3000);
    return;
  }
  
  // Split users into chunks for parallel processing
  const processingPromises = [];
  let userIndex = 0;
  
  // Start processing on each available processor
  for (let i = 0; i < Math.min(videoProcessors.length, unprocessedUsers.length); i++) {
    const processor = videoProcessors[i];
    const user = unprocessedUsers[userIndex++];
    
    if (user) {
      processingPromises.push(processVideoOnProcessor(processor, user, unprocessedUsers, userIndex));
    }
  }
  
  // Wait for all processors to complete
  try {
    await Promise.all(processingPromises);
    updateHeaderStatus("Parallel processing completed successfully", false);
    setTimeout(() => updateHeaderStatus(), 5000);
  } catch (error) {
    console.error("Error in parallel processing:", error);
    updateHeaderStatus("Parallel processing completed with errors", false);
    setTimeout(() => updateHeaderStatus(), 5000);
  }
  
  // Clean up processors
  cleanupParallelProcessors();
  
  // Refresh the user list
  await fetchList(true);
}

// Process a single video on a specific processor
async function processVideoOnProcessor(processor, user, allUsers, startIndex) {
  try {
    processor.isProcessing = true;
    processor.currentUser = user;

    logAnomalyProcess(`Processor ${processor.id} starting video for user: ${user.mail || user._id}`);

    // Process this user
    await processSingleUserOnProcessor(processor, user);
    
    // Continue with next users in queue
    let nextIndex = startIndex;
    while (nextIndex < allUsers.length) {
      // Find next unprocessed user
      const nextUser = allUsers.find((u, idx) => 
        idx >= nextIndex && 
        u.anomalyStatus !== "PROCESSED" && 
        !parallelConfig.completedVideos.has(u._id)
      );
      
      if (!nextUser) break;
      
      nextIndex = allUsers.indexOf(nextUser) + 1;
      parallelConfig.completedVideos.add(nextUser._id);

      logAnomalyProcess(`Processor ${processor.id} continuing with user: ${nextUser.mail || nextUser._id}`);
      await processSingleUserOnProcessor(processor, nextUser);
    }
    
  } catch (error) {
    console.error(`Error on processor ${processor.id}:`, error);
  } finally {
    processor.isProcessing = false;
    processor.currentUser = null;
  }
}

// Process a single user on a specific processor (simplified version)
async function processSingleUserOnProcessor(processor, user) {
  try {
    logAnomalyProcess(`Processing user ${user._id} on processor ${processor.id}`);

    // Mark as completed to avoid duplicate processing
    parallelConfig.completedVideos.add(user._id);
    
    // Get signed URL
    const signedUrlData = await fetchSignedUrl(user._id);
    if (!signedUrlData?.signedUrl) {
      console.error(`No video URL for user ${user._id}`);
      return;
    }
    
    // Update status
    await updateUserAnomalyStatus(user._id, "PROCESSING");
    
    // Load reference face
    let referenceEmbedding = null;
    if (signedUrlData.faceSignedUrl) {
      try {
        referenceEmbedding = await loadReferenceFace(signedUrlData.faceSignedUrl);
      } catch (error) {
        console.warn(`Could not load reference face for ${user._id}:`, error);
      }
    }
    
    // Process video with optimizations
    const results = await processVideoFast(processor, signedUrlData.signedUrl, referenceEmbedding, user);
    
    // Upload results
    await uploadProcessingResults(user._id, results);
    
    // Update user status in cache
    const cachedUser = cachedUserList.find(u => u._id === user._id);
    if (cachedUser) {
      cachedUser.anomalyStatus = "PROCESSED";
    }
    
    console.log(`Completed processing user ${user._id} on processor ${processor.id}`);
    
  } catch (error) {
    console.error(`Error processing user ${user._id}:`, error);
    // Mark as processed even if failed to avoid infinite retries
    await updateUserAnomalyStatus(user._id, "PROCESSED");
  }
}

// Fast video processing function with aggressive optimizations
async function processVideoFast(processor, videoUrl, referenceEmbedding, user) {
  return new Promise(async (resolve, reject) => {
    try {
      const { video, canvas } = processor;
      const results = [];
      let violationCount = 0;
      let frameCount = 0;
      const sampleEveryNSeconds = 1; // Changed from 3 to 1 second for 10fps videos - better coverage
      
      console.log(`Fast processing video: ${videoUrl.substring(0, 50)}...`);
      
      // Set up video
      video.src = videoUrl;
      video.playbackRate = 2.0; // Reduced from 4x to 2x for 10fps videos for better stability
      video.muted = true; // Mute for faster processing
      
      // Set up canvas
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      
      // Wait for video to load
      await new Promise((videoResolve, videoReject) => {
        video.onloadeddata = videoResolve;
        video.onerror = videoReject;
        setTimeout(() => videoReject(new Error('Video load timeout')), 30000);
      });
      
      await video.play();
      
      let lastSampleTime = 0;
      // Note: Removed processing timeout to ensure full video is processed
      
      const processFrame = async () => {
        try {
          // Only exit when video naturally ends - no early termination
          if (video.ended) {
            logAnomalyProcess(`Video processing completed. Total duration: ${Math.floor(video.duration)}s, Violations: ${violationCount} user: ${user?._id} userName: ${user?.mail}`);
            resolve({ results, violationCount, duration: Math.floor(video.duration) });
            return;
          }
          
          const currentTime = video.currentTime;
          
          // Time-based sampling - process at regular intervals to cover entire video
          if (currentTime - lastSampleTime >= sampleEveryNSeconds) {
            lastSampleTime = currentTime;
            frameCount++;
            
            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert to grayscale for better detection
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
              data[i] = data[i + 1] = data[i + 2] = gray;
            }
            ctx.putImageData(imageData, 0, 0);
            
            // Run detection with simplified config
            const detectionResult = await human.detect(canvas);
            
            // Analyze results quickly
            const violations = analyzeFrameQuickly(detectionResult, referenceEmbedding);
            
            if (violations.length > 0) {
              results.push({
                time: Math.floor(currentTime),
                detection: violations
              });
              violationCount += violations.length;
            }
            
            // Log progress every 30 seconds
            if (frameCount % 10 === 0) {
              console.log(`Processing progress: ${Math.floor(currentTime)}s / ${Math.floor(video.duration)}s (${Math.round((currentTime/video.duration)*100)}%)`);
            }
          }
          
          // Continue processing until video ends
          requestAnimationFrame(processFrame);
          
        } catch (error) {
          console.error('Error in frame processing:', error);
          requestAnimationFrame(processFrame);
        }
      };
      
      // Start processing
      requestAnimationFrame(processFrame);
      
    } catch (error) {
      reject(error);
    }
  });
}

// Quick frame analysis function
function analyzeFrameQuickly(detectionResult, referenceEmbedding) {
  const violations = [];
  
  try {
    // Check face count
    const validFaces = detectionResult.face?.filter(face => 
      face.box && Math.min(face.box[2], face.box[3]) >= 100
    ) || [];
    
    if (validFaces.length === 0) {
      violations.push("userNotDetected");
    } else if (validFaces.length > 1) {
      violations.push("multipleFaces");
    }
    
    // Check face similarity if we have a reference
    if (validFaces.length === 1 && referenceEmbedding && validFaces[0].embedding) {
      try {
        const similarity = human.match.similarity(
          validFaces[0].embedding,
          referenceEmbedding,
          matchConfig
        );
        
        if (similarity < 0.4) {
          violations.push("faceMismatch");
        }
      } catch (error) {
        console.warn('Error checking face similarity:', error);
      }
    }
    
    // Check for objects (phones, headphones)
    const objects = detectionResult.object || [];
    
    const phoneDetected = objects.some(obj => 
      ['cell phone', 'mobile phone', 'phone'].includes(obj.label.toLowerCase()) && 
      obj.score >= 0.2
    );
    
    if (phoneDetected) {
      violations.push("phoneDetected");
    }
    
    const headphoneDetected = objects.some(obj => 
      ['headphones', 'headphone', 'earphone'].includes(obj.label.toLowerCase()) && 
      obj.score >= 0.15
    );
    
    if (headphoneDetected) {
      violations.push("headphoneDetected");
    }
    
    // Check gestures quickly
    const gestures = Object.values(detectionResult.gesture || {}).map(g => g.gesture);
    
    if (!gestures.includes("facing center")) {
      violations.push("NotFacingScreen");
    }
    
    if (!gestures.includes("looking center")) {
      violations.push("NotLookingAtScreen");
    }
    
  } catch (error) {
    console.error('Error in quick analysis:', error);
  }
  
  return violations;
}

// Helper functions for parallel processing

async function updateUserAnomalyStatus(attenderId, status) {
  const url = `${ATTENDER_END_POINT}/anomaly-status?attenderId=${attenderId}`;
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": ApiKey,
  };
  
  try {
    await fetch(url, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify({ anomalyStatus: status }),
    });
  } catch (error) {
    console.error("Error updating anomaly status:", error);
  }
}

async function uploadProcessingResults(attenderId, processResults) {
  const url = `${base_url}/attender/anomaly?attenderId=${attenderId}`;
  const finalReport = {
    anomaly: processResults.results || [],
    anomalyStatus: "PROCESSED",
    totalDuration: processResults.duration || 0,
    violationCount: processResults.violationCount || 0,
  };

  try {
    await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ApiKey,
      },
      body: JSON.stringify(finalReport),
    });
    console.log(`Results uploaded for user ${attenderId}`);
  } catch (error) {
    console.error("Error uploading results for user", attenderId, ":", error);
  }
}

function cleanupParallelProcessors() {
  videoProcessors.forEach(processor => {
    if (processor.video) {
      processor.video.pause();
      processor.video.src = '';
      processor.video.remove();
    }
    if (processor.canvas) {
      processor.canvas.remove();
    }
  });
  
  videoProcessors = [];
  parallelConfig.completedVideos.clear();
  console.log('Parallel processors cleaned up');

  // Flush any remaining logs before cleanup
  flushLogBatch();
}

// Function to toggle between sequential and parallel processing
function toggleProcessingMode() {
  parallelConfig.enableParallelProcessing = !parallelConfig.enableParallelProcessing;
  
  const button = document.getElementById('toggleProcessingMode');
  if (button) {
    button.textContent = parallelConfig.enableParallelProcessing ? 
      'Switch to Sequential Mode' : 'Switch to Parallel Mode';
    button.classList.toggle('parallel-mode', parallelConfig.enableParallelProcessing);
  }
  
  updateHeaderStatus(
    parallelConfig.enableParallelProcessing ? 
      'Parallel processing enabled' : 'Sequential processing enabled',
    false
  );
  
  setTimeout(() => updateHeaderStatus(), 3000);
}

// Function to display current optimization settings for 10fps videos
function display10fpsOptimizations() {
  const settings = optimizationConfig.tenFpsOptimizations;
  console.log("=== 10fps Video Optimization Settings ===");
  console.log(`Enabled: ${settings.enabled}`);
  console.log(`Target Processing FPS: ${settings.targetProcessingFps}`);
  console.log(`Adaptive Skipping: ${settings.adaptiveSkipping}`);
  console.log(`Low Activity Skip Rate: ${settings.lowActivitySkipRate} (process every ${settings.lowActivitySkipRate}th frame)`);
  console.log(`High Activity Skip Rate: ${settings.highActivitySkipRate} (process every ${settings.highActivitySkipRate}rd frame)`);
  console.log(`Default Skip Rate: ${optimizationConfig.frameSkipRate} (process every ${optimizationConfig.frameSkipRate}th frame)`);
  console.log(`Video Playback Speed: ${optimizationConfig.videoPlaybackSpeed}x`);
  console.log(`Sample Interval: ${optimizationConfig.sampleInterval} second(s)`);
  console.log("==========================================");
}

// Add to global scope for debugging
window.display10fpsOptimizations = display10fpsOptimizations;

// Add event listener to flush logs when page is unloaded
window.addEventListener('beforeunload', () => {
  flushLogBatch();
});

// Optimized logging system with IP caching and batched API calls
let cachedIPAddress = null;
let logBatch = [];
let batchTimeout = null;
const BATCH_DELAY = 3000; // Send logs every 2 seconds
const MAX_BATCH_SIZE = 10; // Maximum logs per batch

// Function to send batched logs to the server
async function sendBatchedLogs() {
  if (logBatch.length === 0) return;

  try {
    const timestamp = new Date().toISOString();

    const response = await fetch(`${EXAM_END_POINT}/anomoly-process-log`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...apiHeaders
      },
      body: JSON.stringify(logBatch)
    });

    if (!response.ok) {
      console.error(`Failed to send batched logs to server: ${response.status}`);
    } else {
      // Clear the batch after successful send
      logBatch = [];
    }
  } catch (error) {
    console.error('Error sending batched logs:', error);
  }
}

// Function to add log to batch and schedule sending
async function addLogToBatch(logMessage, additionalData = {}) {
  const logEntry = {
    anomolyProcessLog: logMessage,
    timestamp: new Date().toISOString(),
    ...additionalData
  };

  logBatch.push(logEntry);

  // Clear existing timeout
  if (batchTimeout) {
    clearTimeout(batchTimeout);
  }

  // Send immediately if batch is full
  if (logBatch.length >= MAX_BATCH_SIZE) {
    sendBatchedLogs();
  } else {
    // Schedule sending after delay
    batchTimeout = setTimeout(sendBatchedLogs, BATCH_DELAY);
  }

  // Also set a maximum time limit to ensure logs don't stay too long
  if (logBatch.length === 1) {
    setTimeout(() => {
      if (logBatch.length > 0) {
        sendBatchedLogs();
      }
    }, BATCH_DELAY * 3); // Force send after 6 seconds if not sent yet
  }
}

// Enhanced logging function that batches logs
function logAnomalyProcess(message, additionalData = {}) {
  console.log(message);
  // Add to batch instead of sending immediately
  addLogToBatch(message, additionalData);
}

// Function to flush remaining logs (call this when shutting down or when immediate sending is needed)
async function flushLogBatch() {
  if (logBatch.length > 0) {
    await sendBatchedLogs();
  }
}

// Add to global scope for debugging and manual log flushing
window.flushLogBatch = flushLogBatch;
window.getCurrentLogBatch = () => logBatch;
window.getCachedIP = () => cachedIPAddress;
