// Assessment Loader Module
// Handles loading UI for assessments.

let completionTimeout = null; // Failsafe timer
let messageInterval = null; // Message rotation interval

// Loading messages to rotate through
const loadingMessages = [
  "Establishing secure connection...",
  "Encrypting assessment data Securely...",
  "Verifying digital signatures...",
  "Implementing anti-tampering protocols...",
  "Securing your exam environment...",
  "Activating proctoring safeguards...",
  "Validating content integrity checks...",
  "Initializing secure browser mode...",
  "Applying data loss prevention...",
  "Finalizing security protocols..."
];

// Custom loader for Assessment loading
function showAssessmentLoader(show, message = null) {
  // Use random message from array if no message provided
  if (message === null) {
    const randomIndex = Math.floor(Math.random() * loadingMessages.length);
    message = loadingMessages[randomIndex];
  }
  if (show) {
    if ($('#assessment-loader-overlay').length === 0) {
      const loaderHtml = `
        <div id="assessment-loader-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); z-index: 999999; display: none; align-items: center; justify-content: center;">
          <div id="assessment-loader" style="background: white; padding: 50px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); text-align: center; min-width: 450px;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 30px;">
              <div style="font-size: 28px; font-weight: 700; color: #0056b3; letter-spacing: 1px; text-transform: uppercase; margin-bottom: -10px;">Screener</div>
              <div class="loader-animation-container" style="position: relative; width: 120px; height: 120px;">
                <!-- Shield with lock animation -->
                <svg width="120" height="120" viewBox="0 0 120 120" style="position: absolute; top: 0; left: 0;">
                  <defs>
                    <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#007bff;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#0056b3;stop-opacity:1" />
                    </linearGradient>
                  </defs>
                  <!-- Shield path -->
                  <path d="M60 10 L85 25 L85 55 Q85 85 60 100 Q35 85 35 55 L35 25 Z" 
                        fill="url(#shieldGradient)" 
                        stroke="#004494" 
                        stroke-width="2"
                        opacity="0.9">
                    <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
                  </path>
                  <!-- Lock icon -->
                  <g transform="translate(60, 50)">
                    <!-- Lock body -->
                    <rect x="-12" y="-5" width="24" height="20" rx="3" fill="white" stroke="#004494" stroke-width="1.5"/>
                    <!-- Lock shackle -->
                    <path d="M -8 -5 Q -8 -15 0 -15 Q 8 -15 8 -5" fill="none" stroke="white" stroke-width="3"/>
                    <!-- Keyhole -->
                    <circle cx="0" cy="3" r="3" fill="#004494">
                      <animate attributeName="r" values="3;4;3" dur="1.5s" repeatCount="indefinite"/>
                    </circle>
                    <!-- Check mark (appears and disappears) -->
                    <path d="M -5 3 L -2 6 L 5 -1" stroke="#28a745" stroke-width="2" fill="none" opacity="0">
                      <animate attributeName="opacity" values="0;0;1;1;0" dur="3s" repeatCount="indefinite"/>
                      <animate attributeName="stroke-dasharray" values="0 20;20 0;20 0;20 0;0 20" dur="3s" repeatCount="indefinite"/>
                    </path>
                  </g>
                  <!-- Scanning line effect -->
                  <line x1="35" y1="25" x2="85" y2="25" stroke="#00ff00" stroke-width="2" opacity="0.6">
                    <animate attributeName="y1" values="25;90;25" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="y2" values="25;90;25" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0;0.6;0" dur="3s" repeatCount="indefinite"/>
                  </line>
                </svg>
                <!-- Orbiting dots -->
                <div style="position: absolute; width: 100%; height: 100%; animation: rotate 4s linear infinite;">
                  <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; background: #007bff; border-radius: 50%;"></div>
                  <div style="position: absolute; top: 50%; right: 0; transform: translateY(-50%); width: 8px; height: 8px; background: #28a745; border-radius: 50%;"></div>
                  <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; background: #ffc107; border-radius: 50%;"></div>
                  <div style="position: absolute; top: 50%; left: 0; transform: translateY(-50%); width: 8px; height: 8px; background: #dc3545; border-radius: 50%;"></div>
                </div>
              </div>
              <div id="assessment-loader-message" style="font-size: 20px; font-weight: 500; color: #333; min-height: 30px;">
                <span id="message-main">${message}</span>
              </div>
              <div class="loading-dots" style="display: flex; gap: 8px; justify-content: center;">
                <div style="width: 10px; height: 10px; background: #007bff; border-radius: 50%; animation: bounce 1.4s ease-in-out infinite;"></div>
                <div style="width: 10px; height: 10px; background: #007bff; border-radius: 50%; animation: bounce 1.4s ease-in-out 0.2s infinite;"></div>
                <div style="width: 10px; height: 10px; background: #007bff; border-radius: 50%; animation: bounce 1.4s ease-in-out 0.4s infinite;"></div>
              </div>
            </div>
          </div>
        </div>
        <style>
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 1; }
            40% { transform: translateY(-10px); opacity: 0.7; }
          }
        </style>
      `;
      $('body').append(loaderHtml);
    }

    $('#message-main').text(message);
    if ($('#assessment-loader-overlay').css('display') === 'none') {
      $('#assessment-loader-overlay').css('display', 'flex').hide().fadeIn(300);
    }
    
    // Always start message rotation when showing the loader
    if (!messageInterval) {
      let lastIndex = -1; // Track last shown message to avoid repeats
      
      // Function to rotate to next random message
      const rotateMessage = () => {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * loadingMessages.length);
        } while (randomIndex === lastIndex && loadingMessages.length > 1);
        
        lastIndex = randomIndex;
        const $messageElement = $('#message-main');
        if ($messageElement.length > 0) {
          $messageElement.fadeOut(200, function() {
            $(this).text(loadingMessages[randomIndex]).fadeIn(200);
          });
        }
      };
      
      // Start rotating immediately after a short delay (to let initial message show briefly)
      setTimeout(rotateMessage, 800);
      
      // Then continue rotating every 1.8 seconds
      messageInterval = setInterval(rotateMessage, 1800);
    }
    
  } else {
    if (completionTimeout) {
      clearTimeout(completionTimeout);
      completionTimeout = null;
    }
    if (messageInterval) {
      clearInterval(messageInterval);
      messageInterval = null;
    }
    $('#assessment-loader-overlay').stop(true, true).fadeOut(400, function() {
      $(this).remove();
    });
  }
}

// Start assessment loading
function startEditorTracking() {
  // Show the loader with random initial message (rotation starts automatically)
  showAssessmentLoader(true);
  
  // Set a failsafe timeout to hide the loader after 30 seconds (in case of errors)
  completionTimeout = setTimeout(() => {
    showAssessmentLoader(false);
  }, 30000); // Failsafe: Hide after 30 seconds
}

// Initialize loader on page load for existing exams
function initializePageLoader(examId) {
  if (examId) {
      // Show the loader with random initial message (rotation starts automatically)
      showAssessmentLoader(true);
  }
}

// Export functions for global use
window.AssessmentLoader = {
  showAssessmentLoader,
  startEditorTracking,
  initializePageLoader
};