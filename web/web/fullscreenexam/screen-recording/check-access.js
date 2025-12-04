// Translations dictionary
const translations = {
  en: {
    systemAccessCheck: "System Access Check",
    proceedWithExam: "To proceed with the exam, please grant access to:",
    yourOperatingSystem: "Your Operating System",
    yourBrowser: "Your Browser",
    supportedBrowsers: "Supported Browsers",
    browserCompatibility: "Browser Compatibility",
    internetSpeedCheck: "Internet Speed Check",
    checking: "Checking...",
    cameraAccess: "Camera Access",
    screenSharingAccess: "Screen Sharing Access",
    refresh: "Refresh",
    unsupportedBrowserDetected: "Unsupported Browser Detected",
    notSupported: "Your current browser ({0}) is not supported for this exam.",
    pleaseUse: "Please use one of the following browsers:",
    macOSSupportedBrowsers: "macOS: Latest versions of Chrome, Edge",
    windowsSupportedBrowsers: "Windows: Latest versions of Chrome, Edge, or Brave",
    downloadChrome: "Download Chrome",
    downloadEdge: "Download Edge",
    downloadBrave: "Download Brave",
    safariPreinstalled: "Safari comes pre-installed with macOS",
    screenSharingStopped: "Screen sharing was stopped. Please grant access again to continue with the exam.",
    entireScreen: "Click \"Entire Screen\" to share your screen",
    allowCamera: "Click \"Allow\" to enable camera access",
    preparingExam: "Preparing your exam environment...",
    // Toast messages
    internetSufficient: "Internet speed is sufficient!",
    internetSlow: "Internet speed is too slow.",
    internetTestFailed: "Failed to test internet speed.",
    webcamAccessGranted: "Webcam access granted!",
    webcamAccessDenied: "Webcam access denied. Please allow access.",
    shareEntireScreen: "Please share your entire screen (monitor) to continue.",
    screenSharingGranted: "Screen sharing access granted!",
    screenSharingDenied: "Screen sharing access denied. Please allow access.",
    useSupportedBrowser: "Please use a supported browser to proceed.",
    mbps: "Mbps",
    webcam: "webcam",
    screenSharing: "screen sharing",
    and: "and"
  },
  ar: {
    systemAccessCheck: "فحص وصول النظام",
    proceedWithExam: "للمتابعة في الامتحان، يرجى منح إذن الوصول إلى:",
    yourOperatingSystem: "نظام التشغيل الخاص بك",
    yourBrowser: "متصفحك",
    supportedBrowsers: "المتصفحات المدعومة",
    browserCompatibility: "توافق المتصفح",
    internetSpeedCheck: "فحص سرعة الإنترنت",
    checking: "جاري الفحص...",
    cameraAccess: "الوصول إلى الكاميرا",
    screenSharingAccess: "الوصول إلى مشاركة الشاشة",
    refresh: "تحديث",
    unsupportedBrowserDetected: "تم الكشف عن متصفح غير مدعوم",
    notSupported: "المتصفح الحالي ({0}) غير مدعوم لهذا الامتحان.",
    pleaseUse: "يرجى استخدام أحد المتصفحات التالية:",
    macOSSupportedBrowsers: "macOS: أحدث إصدارات Chrome و Edge",
    windowsSupportedBrowsers: "Windows: أحدث إصدارات Chrome و Edge أو Brave",
    downloadChrome: "تنزيل Chrome",
    downloadEdge: "تنزيل Edge",
    downloadBrave: "تنزيل Brave",
    safariPreinstalled: "يأتي Safari مثبتًا مسبقًا مع macOS",
    screenSharingStopped: "توقفت مشاركة الشاشة. يرجى منح الإذن مرة أخرى لمواصلة الامتحان.",
    entireScreen: "انقر على \"الشاشة بأكملها\" لمشاركة الشاشة",
    allowCamera: "انقر على \"السماح\" لتمكين الوصول إلى الكاميرا",
    preparingExam: "جارٍ تحضير بيئة الامتحان الخاصة بك...",
    // Toast messages
    internetSufficient: "سرعة الإنترنت كافية!",
    internetSlow: "سرعة الإنترنت بطيئة جدًا.",
    internetTestFailed: "فشل اختبار سرعة الإنترنت.",
    webcamAccessGranted: "تم منح الوصول إلى الكاميرا!",
    webcamAccessDenied: "تم رفض الوصول إلى الكاميرا. يرجى السماح بالوصول.",
    shareEntireScreen: "يرجى مشاركة الشاشة بأكملها (الشاشة) للمتابعة.",
    screenSharingGranted: "تم منح الوصول إلى مشاركة الشاشة!",
    screenSharingDenied: "تم رفض الوصول إلى مشاركة الشاشة. يرجى السماح بالوصول.",
    useSupportedBrowser: "يرجى استخدام متصفح مدعوم للمتابعة.",
    mbps: "ميجابت/ثانية",
    webcam: "كاميرا الويب",
    screenSharing: "مشاركة الشاشة",
    and: "و"
  }
};

function getText(key, ...args) {
  const lang = localStorage.getItem('lang') === 'ar' ? 'ar' : 'en';
  let text = translations[lang][key] || translations['en'][key] || key;
  
  if (args.length > 0) {
    args.forEach((arg, index) => {
      text = text.replace(`{${index}}`, arg);
    });
  }
  
  return text;
}

// Check browser compatibility
function isBrowserSupported() {
  const os = getOSInfo();
  const browser = getBrowserInfo();
  const browserName = browser.split(" ")[0];

  const userAgentLog = navigator?.userAgent || "Unknown";

  userActivityLogsApi(
    "Browser: " + userAgentLog + " OS: " + os,
    "browser-checking"
  );

  // Define supported browsers by OS
  const supportedBrowsers = {
    "Windows 11": ["Chrome", "Edge", "Brave"],
    "Windows 10": ["Chrome", "Edge", "Brave"],
    "Windows 8": ["Chrome", "Edge", "Brave"],
    "Windows 7": ["Chrome", "Edge", "Brave"],
    iPad: ["Chrome", "Edge", "Brave", "Safari"],
    iPhone: ["Chrome", "Edge", "Brave", "Safari"],
    Android: ["Chrome", "Edge", "Brave", "Samsung"],
    // "macOS": ["Chrome", "Edge", "Safari"],
    macOS: ["Chrome", "Edge"],
    Linux: ["Chrome", "Edge"],
  };

  let isSupported = false;

  // Check if current OS has supported browsers defined
  if (supportedBrowsers[os]) {
    userActivityLogsApi(
      "Supported: " + supportedBrowsers[os].includes(browserName),
      "browser-checking"
    );
    isSupported = supportedBrowsers[os].includes(browserName);
    return isSupported;
  }

  return false;
}

// Generate browser icon HTML
function getBrowserIconHTML(browserName) {
  if (browserName === "Chrome") {
    return '<i class="fab fa-chrome"></i>';
  } else if (browserName === "Edge") {
    return '<i class="fab fa-edge"></i>';
  } else if (browserName === "Safari") {
    return '<i class="fab fa-safari"></i>';
  } else if (browserName === "Firefox") {
    return '<i class="fab fa-firefox"></i>';
  } else if (browserName === "Brave") {
    return '<img src="../exam-portal/imgs/brave-reverse-brands.svg" class="browser-icon brave-icon" alt="Brave browser">';
  } else {
    return '<i class="fas fa-globe"></i>';
  }
}

// Generate OS icon HTML
function getOSIconHTML(osName) {
  if (osName.startsWith("Windows")) {
    return '<i class="fab fa-windows"></i>';
  } else if (osName === "macOS") {
    return '<i class="fab fa-apple"></i>';
  } else if (osName === "Linux") {
    return '<i class="fab fa-linux"></i>';
  } else if (osName === "Android") {
    return '<i class="fab fa-android"></i>';
  } else {
    return '<i class="fas fa-desktop"></i>';
  }
}

// Generate download links based on OS
function getDownloadLinks(os) {
  let links = `<div class="download-links-container">`;
  
  links += `<div class="browser-link">
    <a href="https://www.google.com/chrome/" target="_blank" rel="noopener">
      ${getBrowserIconHTML("Chrome")} ${getText('downloadChrome')}
    </a>
  </div>`;
  
  links += `<div class="browser-link">
    <a href="https://www.microsoft.com/edge" target="_blank" rel="noopener">
      ${getBrowserIconHTML("Edge")} ${getText('downloadEdge')}
    </a>
  </div>`;
  
  links += `<div class="browser-link">
    <a href="https://brave.com/download/" target="_blank" rel="noopener">
      ${getBrowserIconHTML("Brave")} ${getText('downloadBrave')}
    </a>
  </div>`;
  
  if (os === "macOS") {
    links += `<div class="browser-link">
      <span>${getBrowserIconHTML("Safari")} ${getText('safariPreinstalled')}</span>
    </div>`;
  }
  
  links += `</div>`;
  return links;
}

function showAccessContainer() {
  $('#check-acces-container, #webcam-container').remove();
  
  const os = getOSInfo();
  const browser = getBrowserInfo();
  isBrowserOk = isBrowserSupported();
  const lang = localStorage.getItem('lang') === 'ar' ? 'ar' : 'en';
  const isRtl = lang === 'ar';

  // Define supported browsers per OS for the supported browsers section
  const supportedBrowsersSection = os === "macOS" ? 
    `<div class="supported-browsers">
      <h3>${getText('supportedBrowsers')}</h3>
      <div class="browser-icons">
        <div class="browser-icon-item">
          ${getBrowserIconHTML("Chrome")}
          <p>Chrome</p>
        </div>
        <div class="browser-icon-item">
          ${getBrowserIconHTML("Edge")}
          <p>Edge</p>
        </div>
        <!-- <div class="browser-icon-item">
          ${getBrowserIconHTML("Safari")}
          <p>Safari</p>
        </div> -->
      </div>
    </div>` :
    `<div class="supported-browsers">
      <h3>${getText('supportedBrowsers')}</h3>
      <div class="browser-icons">
        <div class="browser-icon-item">
          ${getBrowserIconHTML("Chrome")}
          <p>Chrome</p>
        </div>
        <div class="browser-icon-item">
          ${getBrowserIconHTML("Edge")}
          <p>Edge</p>
        </div>
        <div class="browser-icon-item">
          ${getBrowserIconHTML("Brave")}
          <p>Brave</p>
        </div>
      </div>
    </div>`;
  
  const statusItems = [
    `<div class="status">
      <input type="checkbox" id="browser-status" ${isBrowserOk ? 'checked' : ''} disabled>
      <label for="browser-status">${getText('browserCompatibility')}</label>
    </div>`,
    
    `<div class="status">
      <input type="checkbox" id="internet-status" disabled>
      <label for="internet-status">${getText('internetSpeedCheck')} (<span id="speed-value">${getText('checking')}</span>)</label>
    </div>`,
  ];

  if (webCamRecording) {
    statusItems.push(`
      <div class="status">
        <input type="checkbox" id="webcam-status" disabled>
        <label for="webcam-status">${getText('cameraAccess')}</label>
      </div>
    `);
  }

  if (screenRecording) {
    statusItems.push(`
      <div class="status">
        <input type="checkbox" id="share-status" disabled>
        <label for="share-status">${getText('screenSharingAccess')}</label>
      </div>
    `);
  }

  const htmlContent = `
    <div id="check-acces-container" dir="${isRtl ? 'rtl' : 'ltr'}">
      <div class="access-card">
        <div class="header-section">
          <h1>${getText('systemAccessCheck')}</h1>
          <p>${getText('proceedWithExam')}${getRequiredAccessText()}</p>
        </div>
        
        <div class="container-columns">
          <div class="left-column">
            <div class="system-info-section">
              <div class="system-item">
                <h3>${getText('yourOperatingSystem')}</h3>
                <div class="system-icon">${getOSIconHTML(os)}</div>
                <p>${os}</p>
              </div>
              
              <div class="system-item">
                <h3>${getText('yourBrowser')}</h3>
                <div class="system-icon">${getBrowserIconHTML(browser.name)}</div>
                <p>${browser}</p>
              </div>
            </div>
            
            ${supportedBrowsersSection}
          </div>
          
          <div class="right-column">
            <div class="status-container">
              ${statusItems.join('')}
            </div>
          </div>
        </div>
        
        <div class="button-container">
          <button id="refresh-button">${getText('refresh')}</button>
        </div>
        
        ${!isBrowserOk ? `
        <div class="browser-warning">
          <h3>${getText('unsupportedBrowserDetected')}</h3>
          <p>${getText('notSupported', browser.name)}</p>
          <p>${getText('pleaseUse')}</p>
          <ul>
            ${os === "macOS" ? 
              `<li><strong>macOS:</strong> ${getText('macOSSupportedBrowsers')}</li>` : 
              `<li><strong>Windows:</strong> ${getText('windowsSupportedBrowsers')}</li>`}
          </ul>
          <div class="download-links">
            ${getDownloadLinks(os)}
          </div>
        </div>` : ''}
      </div>
    </div>
    ${
      webCamRecording
        ? `<div id="webcam-container">
             <video id="webcam-video" autoplay muted 
                    oncontextmenu="return false;"
                    controlsList="nodownload nofullscreen noremoteplayback"
                    disablePictureInPicture>
             </video>
           </div>`
        : ''
    }    
  `;

  $('body').append(htmlContent);
  $('#check-acces-container').show();

  $(document).on('click', '#refresh-button', function () {
    $(document).off('click', '#refresh-button');
    location.reload();
  });

  if (isBrowserOk) {
    userActivityLogsApi(
      "Browser compatibility check passed, proceeding with access validation",
      "browser-checking"
    );
    validateLogin();
  } else {
    userActivityLogsApi(
      `Unsupported browser detected: ${browser}`,
      "browser-checking"
    );
    showToast(getText("useSupportedBrowser"), "error");
  }
}

function showAccessContainerForRetry() {
  // Stop any existing streams before reinitializing
  if (window.webcamStream) {
    window.webcamStream.getTracks().forEach((track) => track.stop());
  }
  if (window.screenStream) {
    window.screenStream.getTracks().forEach((track) => track.stop());
  }

  // Remove any existing check-access container and webcam container
  $('#check-acces-container, #webcam-container').remove();

  const os = getOSInfo();
  const browser = getBrowserInfo();
  const isBrowserOk = isBrowserSupported();
  const lang = localStorage.getItem('lang') === 'ar' ? 'ar' : 'en';
  const isRtl = lang === 'ar';

  // Define supported browsers per OS for the supported browsers section
  const supportedBrowsersSection = os === "macOS" ? 
    `<div class="supported-browsers">
      <h3>${getText('supportedBrowsers')}</h3>
      <div class="browser-icons">
        <div class="browser-icon-item">
          ${getBrowserIconHTML("Chrome")}
          <p>Chrome</p>
        </div>
        <div class="browser-icon-item">
          ${getBrowserIconHTML("Edge")}
          <p>Edge</p>
        </div>
        <!-- <div class="browser-icon-item">
          ${getBrowserIconHTML("Safari")}
          <p>Safari</p>
        </div> -->
      </div>
    </div>` :
    `<div class="supported-browsers">
      <h3>${getText('supportedBrowsers')}</h3>
      <div class="browser-icons">
        <div class="browser-icon-item">
          ${getBrowserIconHTML("Chrome")}
          <p>Chrome</p>
        </div>
        <div class="browser-icon-item">
          ${getBrowserIconHTML("Edge")}
          <p>Edge</p>
        </div>
        <div class="browser-icon-item">
          ${getBrowserIconHTML("Brave")}
          <p>Brave</p>
        </div>
      </div>
    </div>`;

  const statusItems = [
    `<div class="status">
      <input type="checkbox" id="browser-status" ${isBrowserOk ? 'checked' : ''} disabled>
      <label for="browser-status">${getText('browserCompatibility')}</label>
    </div>`,
    
    `<div class="status">
      <input type="checkbox" id="internet-status" disabled>
      <label for="internet-status">${getText('internetSpeedCheck')} (<span id="speed-value">${getText('checking')}</span>)</label>
    </div>`,
  ];

  if (webCamRecording) {
    statusItems.push(`
      <div class="status">
        <input type="checkbox" id="webcam-status" disabled>
        <label for="webcam-status">${getText('cameraAccess')}</label>
      </div>
    `);
  }

  if (screenRecording) {
    statusItems.push(`
      <div class="status">
        <input type="checkbox" id="share-status" disabled>
        <label for="share-status">${getText('screenSharingAccess')}</label>
      </div>
    `);
  }

  const htmlContent = `
    <div id="check-acces-container" dir="${isRtl ? 'rtl' : 'ltr'}">
      <div class="access-card">
        <div class="header-section">
          <h1>${getText('systemAccessCheck')}</h1>
          <p>${getText('screenSharingStopped')}</p>
        </div>
        
        <div class="container-columns">
          <div class="left-column">
            <div class="system-info-section">
              <div class="system-item">
                <h3>${getText('yourOperatingSystem')}</h3>
                <div class="system-icon">${getOSIconHTML(os)}</div>
                <p>${os}</p>
              </div>
              
              <div class="system-item">
                <h3>${getText('yourBrowser')}</h3>
                <div class="system-icon">${getBrowserIconHTML(browser.name)}</div>
                <p>${browser.name} ${browser.version}</p>
              </div>
            </div>
            
            ${supportedBrowsersSection}
          </div>
          
          <div class="right-column">
            <div class="status-container">
              ${statusItems.join('')}
            </div>
          </div>
        </div>
        
        <div class="button-container">
          <button id="retry-button">${getText('refresh')}</button>
        </div>
        
        ${!isBrowserOk ? `
        <div class="browser-warning">
          <h3>${getText('unsupportedBrowserDetected')}</h3>
          <p>${getText('notSupported', browser.name)}</p>
          <p>${getText('pleaseUse')}</p>
          <ul>
            ${os === "macOS" ? 
              `<li><strong>macOS:</strong> ${getText('macOSSupportedBrowsers')}</li>` : 
              `<li><strong>Windows:</strong> ${getText('windowsSupportedBrowsers')}</li>`}
          </ul>
          <div class="download-links">
            ${getDownloadLinks(os)}
          </div>
        </div>` : ''}
      </div>
    </div>
    ${
      webCamRecording
        ? '<div id="webcam-container"><video id="webcam-video" autoplay muted></video></div>'
        : ''
    }
  `;

  $('body').append(htmlContent);
  $('#check-acces-container').show();

  // Add click event handler using event delegation
  $(document).on('click', '#retry-button', function () {
    $(document).off('click', '#retry-button');
    location.reload();
  });

  if (isBrowserOk) {
    validateLogin();
  } else {
    showToast(getText('useSupportedBrowser'), 'error');
  }
}

// Helper function for access text
function getRequiredAccessText() {
  const requirements = [];
  if (webCamRecording) requirements.push(getText('webcam'));
  if (screenRecording) requirements.push(getText('screenSharing'));
  return requirements.length > 0 ? ` ${requirements.join(` ${getText('and')} `)}` : '';
}

// Document ready function
$(document).ready(function () {
  function addDynamicStyles() {
    const styles = `
           <style>
#check-acces-container {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
    background-color: white;
    color: #333;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 9999;
}

.access-card {
    background: white;
    width: 90%;
    max-width: 900px;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.header-section {
    background-color: #2c3e50;
    color: white;
    padding: 20px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    text-align: center;
}

.header-section h1 {
    font-size: 24px;
    margin: 0 0 10px 0;
    color: white;
}

.header-section p {
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    font-size: 14px;
}

.container-columns {
    display: flex;
    padding: 20px;
}

.left-column {
    flex: 1;
    padding-right: 20px;
    border-right: 1px solid #eee;
}

.right-column {
    flex: 1;
    padding-left: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.system-info-section {
    display: flex;
    justify-content: space-between;
    margin-bottom: 30px;
}

.system-item {
    text-align: center;
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.system-item h3 {
    font-size: 14px;
    color: #555;
    margin: 0 0 15px 0;
    font-weight: normal;
}

.system-icon {
    font-size: 40px;
    margin-bottom: 10px;
    color: #2c3e50;
}

.system-item p {
    margin: 0;
    font-size: 14px;
    color: #333;
}

.supported-browsers {
    background-color: #f5f7f9;
    padding: 15px;
    border-radius: 5px;
}

.supported-browsers h3 {
    text-align: center;
    font-size: 16px;
    color: #333;
    margin: 0 0 15px 0;
}

.browser-icons {
    display: flex;
    justify-content: space-around;
}

.browser-icon-item {
    text-align: center;
}

.browser-icon-item svg {
    font-size: 30px;
    color: #2c3e50;
}

.browser-icon-item p {
    margin: 5px 0 0 0;
    font-size: 12px;
}

.status-container {
    background: white;
    border-radius: 6px;
    width: 100%;
}

.status {
    margin: 20px 0;
    display: flex;
    align-items: center;
}

.status input[type="checkbox"] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border: 2px solid #ddd;
    border-radius: 4px;
    margin-right: 10px;
    position: relative;
    cursor: pointer;
    background-color: white;
}

.status input[type="checkbox"]:checked {
    background-color: #007bff;
    border-color: #007bff;
}

.status input[type="checkbox"]:checked:after {
    content: '\\2713';
    font-size: 14px;
    position: absolute;
    top: 0px;
    left: 3px;
    color: white;
}

.status label {
    font-size: 14px;
    color: #444;
}

.button-container {
    display: flex;
    justify-content: center;
    padding: 20px 0;
    border-top: 1px solid #eee;
}

#refresh-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 30px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s;
}

#refresh-button:hover {
    background-color: #0069d9;
}

.browser-warning {
    background: #fff3cd;
    border: 1px solid #ffeeba;
    padding: 15px;
    margin: 0 20px 20px;
    border-radius: 6px;
    color: #856404;
}

.browser-warning h3 {
    font-size: 16px;
    margin-bottom: 10px;
}

.browser-warning p {
    margin-bottom: 10px;
}

.browser-warning ul {
    list-style-type: disc;
    padding-left: 20px;
    margin-bottom: 15px;
}

.download-links-container {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 15px;
}

.download-links {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
}

.browser-link a, .browser-link span {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: 4px;
    text-decoration: none;
    font-size: 13px;
    min-width: 150px;
    justify-content: flex-start;
    margin: 0 5px;
}

.browser-link a {
    background-color: #007bff;
    color: white;
    transition: background-color 0.3s;
}

.browser-link a:hover {
    background-color: #0069d9;
}

.browser-link i, .browser-link svg {
    margin-right: 10px;
    font-size: 16px;
}

.brave-icon {
    width: 18px;
    height: 18px;
    margin-right: 10px;
    vertical-align: middle;
}

#webcam-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 200px;
    height: 150px;
    z-index: 1000;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
    background-color: #000;
}

#webcam-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.toast.show {
    opacity: 1;
}

.toast.success {
    background: rgba(40, 167, 69, 0.9);
}

.toast.error {
    background: rgba(220, 53, 69, 0.9);
}

.toast.warning {
    background: rgba(255, 140, 0, 0.9);
}

#loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.95);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #333;
}

.countdown-container {
    font-size: 48px;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 20px;
}

.loading-message {
    font-size: 16px;
    color: #666;
    margin-bottom: 20px;
}

.loading-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

#retry-button, 
#refresh-button {
    margin-top: 20px;
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

@keyframes spin {
    100% { transform: rotate(360deg); }
}

/* Screen sharing guidance */
#screen-sharing-guidance {
    position: fixed;
    bottom: 30px;
    left: 45%;
    z-index: 10000;
    pointer-events: none;
}

#entire-screen-sharing-guidance {
    position: fixed;
    top: 20%;
    left: 15%;
    z-index: 10000;
    pointer-events: none;
}

.guidance-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 40px;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: 10px;
    padding: 20px;
    max-width: 400px;
}

#entire-screen-sharing-guidance .entire-screen-guidance-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 40px;
    align-items: center;
    border-radius: 10px;
    padding: 20px;
    max-width: 400px;
}

.guidance-arrow {
    width: 100px;
    height: auto;
    margin-right: 15px;
    margin-bottom: 0;
}

#entire-screen-sharing-guidance .guidance-arrow {
    width: 200px;
    height: auto;
    margin-right: 15px;
    margin-bottom: 0;
}

.guidance-text {
    color: white;
    font-weight: bold;
    font-size: 16px;
    text-align: center;
}

/* Webcam guidance */
#webcam-guidance {
    position: fixed;
    top: 250px;
    left: 120px;
    z-index: 10000;
    pointer-events: none;
}

/* Add style for Brave icon */
.brave-icon {
    color: #FB542B;
}

.browser-icon-item .browser-icon {
  width: 30px;
  height: 30px;
}

.overlay-not-visible-1 {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
}

.popup-not-visible-1 {
    background: white;
    padding: 30px;
    border-radius: 10px;
    max-width: 500px;
    width: 90%;
}

.popup-not-visible-1 h2 {
    color: #dc3545;
    margin-bottom: 20px;
}

.popup-not-visible-1 p {
    margin-bottom: 15px;
    line-height: 1.5;
}

.tips-text-not-visible-1 {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 5px;
    text-align: left;
    white-space: pre-line;
}

.popup-timer-bar-not-visible-1 {
    margin-top: 20px;
    height: 4px;
    background: #eee;
    border-radius: 2px;
    overflow: hidden;
}

.timer-progress-not-visible-1 {
    height: 100%;
    background: #dc3545;
    width: 100%;
}

@keyframes countdown-not-visible-1 {
    from { width: 100%; }
    to { width: 0%; }
}

</style>`;
    $('head').append(styles);
  }

  function checkSession() {
    const urlParams = new URLSearchParams(window.location.search);
    screenRecording = urlParams.get('screenRecording') === 'true';
    webCamRecording = urlParams.get('webCamRecording') === 'true';
    const isRecordingEnable = screenRecording || webCamRecording;

    if (isRecordingEnable) {
      $('.testing, .container').hide();
      showAccessContainer();
    } else {
      startExam();
      $('.testing, .container').show();
      $('#check-acces-container').remove();
    }
  }

  // Initialize
  window.initializeAuth = function () {
    addDynamicStyles();
    checkSession();
  };

  initializeAuth();
});

// Other global functions
function showToast(message, type) {
  // Remove any existing toasts
  $('.toast').remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);

  toast.offsetHeight;

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function detectNetworkQuality({
  speedUrl = "../../common/commonLibaries/font-awesome.5.15.3.js.all.min.js",
  minMbps = 0.08
} = {}) {

  const start = performance.now();
  try {
    const response = await fetch(`${speedUrl}?nocache=${Date.now()}`, { cache: "no-store" });
    const data = await response.arrayBuffer();
    const durationSec = (performance.now() - start) / 1000;
    const fileSizeBytes = data.byteLength;
    const mbps = ((fileSizeBytes * 8) / durationSec) / 1_000_000;

    userActivityLogsApi(`Speed Test Details ${JSON.stringify({
      fileSize: (fileSizeBytes / 1024 / 1024).toFixed(2) + ' MB',
      downloadTime: durationSec.toFixed(2) + ' seconds',
      speed: mbps.toFixed(2) + ' Mbps'
    })}`);

    return {
      isSlow: mbps < minMbps,
      mbps: mbps.toFixed(2)
    };
  } catch (err) {
    return {
      isSlow: true,
      mbps: 0
    };
  }
}

function showLoadingScreen() {
  const loadingHtml = `
        <div id="loading-screen" dir="${localStorage.getItem('lang') === 'ar' ? 'rtl' : 'ltr'}">
            <div class="countdown-container"></div>
            <div class="loading-message">${getText('preparingExam')}</div>
            <div class="loading-spinner"></div>
        </div>
    `;
  $('body').append(loadingHtml);
}

function startCountdown(seconds) {
  const countdownElement = $('.countdown-container');
  let count = seconds;

  clearCountdown();

  window.countdownInterval = setInterval(() => {
    countdownElement.text(count);
    count--;

    if (count < 0) {
      clearCountdown();
      $('#loading-screen').fadeOut(1000, function () {
        $(this).remove();
        const urlParams = new URLSearchParams(window.location.search);
        window.isVoiceAlert = urlParams.get('isVoiceAlert') === 'true';
  
        if (window.isVoiceAlert) {
          speakInstructions( "Please read instructions carefully" );
        }
      });
    }
  }, 1000);
}

function clearCountdown() {
  // Clear the countdown interval
  const countdownInterval = window.countdownInterval;
  if (countdownInterval) {
    clearInterval(countdownInterval);
    window.countdownInterval = null;
  }
}

async function validateLogin() {
  const webcamStatus = document.getElementById('webcam-status');
  const shareStatus = document.getElementById('share-status');
  const internetStatus = document.getElementById('internet-status');
  const speedValue = document.getElementById('speed-value');
  let webcamStream;
  let screenStream;
  let webcamPermissionGranted = false;
  let screenPermissionGranted = false;
  let audioPermissionGranted = false;
  let audioSource = null; // Track which source has audio

  // Reset checkboxes
  if (webcamStatus) webcamStatus.checked = false;
  if (shareStatus) shareStatus.checked = false;
  if (internetStatus) internetStatus.checked = false;

  // Check for internet speed
  try {
    const { isSlow, mbps } = await detectNetworkQuality();
    
    if (!isSlow) {
      internetStatus.checked = true;
      showToast(`${getText("internetSufficient")} (${mbps} Mbps)`, "success");
      speedValue.style.fontWeight = "bold";
      speedValue.style.color = "green";
      speedValue.innerText = `${mbps} Mbps`;
    } else {
      speedValue.style.fontWeight = "bold";
      speedValue.style.color = "red";
      speedValue.innerText = `${mbps} Mbps Internet Slow`;
      userActivityLogsApi(
        `Internet too slow: ${mbps} Mbps`,
        "internet-checking"
      );
      showToast(`${getText("internetSlow")} (${mbps} Mbps)`, "error");
      return;
    }
    
    
  } catch (err) {
    speedValue.innerText = `${mbps} Mbps`;
    speedValue.style.fontWeight = "bold";
    speedValue.style.color = "red";
    userActivityLogsApi(
      `Internet speed check failed: ${err?.message}`,
      "internet-checking"
    );
    showToast(getText("internetTestFailed"), "error");
    return;
  }

  // Check for webcam access
  if (webCamRecording) {

    const modelLoaded = await initFaceDetection();
    if (!modelLoaded) {
      showToast(getText("faceDetectionFailed"), "error");
      return;
    }
    
    try {
      const webcamTimer = setTimeout(() => {
        if (!webcamPermissionGranted) {
          showWebcamGuidance();
        }
      }, 5000);

      try {
        if (canEnableAudio) {
          webcamStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          if (canEnableAudio && webcamStream.getAudioTracks().length > 0) {
            audioPermissionGranted = true;
            audioSource = "webcam";
            videoUploadLog("Webcam audio enabled", 'recording');
            userActivityLogsApi(
              "Webcam access granted with audio",
              "webcam-checking"
            );
          }
        } else {
          webcamStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          userActivityLogsApi(
            "Webcam access granted without audio",
            "webcam-checking"
          );
        }
      } catch (innerErr) {
        videoUploadLog(`Couldn't get webcam with audio, trying without: ${innerErr?.message}`, 'recording');
        userActivityLogsApi(
          `Webcam access with audio failed, retrying without audio: ${innerErr?.message}`,
          "webcam-checking"
        );
        webcamStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      const webcamVideo = document.getElementById("webcam-video");
      webcamVideo.srcObject = webcamStream;
      webcamStatus.checked = true;

      clearTimeout(webcamTimer);        
      webcamPermissionGranted = true;
      $('#webcam-guidance').remove();

      showToast(getText('webcamAccessGranted'), 'success');
    } catch (err) {
      userActivityLogsApi(
        "Webcam access denied: " + err?.message,
        "webcam-checking"
      );
      showToast(getText("webcamAccessDenied"), "error");
      return;
    }
  }

  if (screenRecording) {
    // Check for screen sharing access
    try {
      const screenArrowTimer = setTimeout(() => {
        if (!screenPermissionGranted) {
          showEntireScreenSharingGuidance();
        }
      }, 3000);
      const screenTimer = setTimeout(() => {          
        if (!screenPermissionGranted) {            
          showScreenSharingGuidance();          
        }        
      }, 5000);

      // Try to get screen sharing - with audio if enabled and webcam audio not already granted
      const requestScreenAudio = canEnableAudio && (!audioPermissionGranted);
      
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
            cursor: "always",
            logicalSurface: true,
          },
          audio: requestScreenAudio,
          selfBrowserSurface: "include",
          systemAudio: "include",
        });
        
        // Check if audio was granted for screen sharing
        if (requestScreenAudio && screenStream.getAudioTracks().length > 0) {
          audioPermissionGranted = true;
          audioSource = 'screen';
          videoUploadLog("Screen audio enabled", 'recording');
          
          // Log detailed information about the audio track
          const audioTrack = screenStream.getAudioTracks()[0];
          videoUploadLog(`Screen audio track: ${audioTrack.label}, enabled: ${audioTrack.enabled}, muted: ${audioTrack.muted}`, 'recording');
          
          // Ensure the track is enabled
          audioTrack.enabled = true;
          userActivityLogsApi(
              "Screen sharing access granted with audio",
              "screen-checking"
            );
        } else {
          userActivityLogsApi(
            "Screen sharing access granted without audio",
            "screen-checking"
          );
        }
      } catch (innerErr) {
        videoUploadLog(`Couldn't get screen with audio, trying without: ${innerErr?.message}`, 'recording');
        userActivityLogsApi(
          `Screen sharing with audio failed, retrying without audio: ${innerErr?.message}`,
          "screen-checking"
        );
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
            cursor: "always",
            logicalSurface: true,
          },
          audio: false,
        });
      }
      
      clearTimeout(screenArrowTimer);
      clearTimeout(screenTimer);
      screenPermissionGranted = true;

      const track = screenStream.getVideoTracks()[0];
      const settings = track.getSettings();

      if (settings.displaySurface !== "monitor") {
        userActivityLogsApi(
          "Screen sharing mode invalid - not in monitor mode",
          "screen-checking"
        );
        showToast(getText("shareEntireScreen"), "error");
        screenStream.getTracks().forEach((track) => track.stop());
        return;
      }
      shareStatus.checked = true;
      userActivityLogsApi(
        "Screen sharing access granted in monitor mode",
        "screen-checking"
      );
      showToast(getText("screenSharingGranted"), "success");
      setTimeout(() => {
        $('#screen-sharing-guidance').remove();
      }, 500);
      setTimeout(() => {
        $('#entire-screen-sharing-guidance').remove();
      }, 500);
    } catch (err) {
      userActivityLogsApi(
        "Screen sharing access denied: " + err?.message,
        "screen-checking"
      );
      showToast(getText("screenSharingDenied"), "error");
      window.location.href = `message.html?status=permission-denied${
        cid ? `&cid=${cid}` : ""
      }`;
      return;
    }
  }

  if (webcamStatus?.checked || (shareStatus?.checked && internetStatus?.checked)) {
    userActivityLogsApi(
      "All required access checks passed, starting exam",
      "system-check"
    );
    userActivityLogsApi("All required access checks passed, starting exam", "exam-start");
    
    if (faceNotVisibleCount >= 1) {
      userActivityLogsApi("Face not visible, showing warning and terminating without starting exam", "exam-start");
      showFaceNotVisibleWarning();
      return;
    }

    await startExam();

    currentAttenderId = new URLSearchParams(window.location.search).get(
      "attender_id"
    );

    const newBaseFileName = `recording_${examId}_${studentId}_${Date.now()}`;

    videoUploadLog(`Getting new signed URL for ${newBaseFileName}.webm in first time`, 'upload');
    await getGcpSignedUrl(
      currentAttenderId,
      newBaseFileName,
      "webm",
    );

    showLoadingScreen();
    startCountdown(5);

    // Add screen sharing monitoring only if screen recording is enabled
    if (screenRecording && screenStream) {
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        clearCountdown();
        $('#loading-screen').remove();

        [webcamStream, screenStream].forEach((stream) => {
          stream?.getTracks().forEach((track) => track.stop());
        });

        userActivityLogsApi(
          "Screen sharing ended, showing retry container",
          "screen-checking"
        );
        showAccessContainerForRetry();
      });
    }

    setTimeout(() => {
      $('.testing, .container').fadeIn(1000);
      $('#check-acces-container').fadeOut(1000, function () {
        $(this).remove();
      });

      window.webcamStream = webcamStream;
      window.screenStream = screenStream;
      window.audioPermissionGranted = audioPermissionGranted;
      window.audioSource = audioSource;
      window.canEnableAudio = canEnableAudio;

      userActivityLogsApi(
        "Starting webcam and screen recording",
        "screen-checking"
      );
      renderWebcamAndScreenRecording(webcamStream, screenStream);
      startHealthCheck();
    }, 6000);
  }
}

function showEntireScreenSharingGuidance() {
  // Remove any existing guidance overlay
  $('#entire-screen-sharing-guidance').remove();
  
  const guidanceHtml = `
    <div id="entire-screen-sharing-guidance">
      <div class="entire-screen-guidance-content">
        <img src="../../common/imgs/share_screen.gif" alt="screen share icon" class="guidance-arrow">
      </div>
    </div>
  `;
  
  $('body').append(guidanceHtml);
}

function showScreenSharingGuidance() {
  // Remove any existing guidance overlay
  $('#screen-sharing-guidance').remove();
  
  const guidanceHtml = `
    <div id="screen-sharing-guidance">
      <div class="guidance-content">
        <img src="../../common/imgs/share_screen.gif" alt="screen share icon" class="guidance-arrow" style="transform: rotate(-50deg);">
        <div class="guidance-text">👆 ${getText('entireScreen')}</div>
      </div>
    </div>
  `;
  
  $('body').append(guidanceHtml);
}

// Add a new function for webcam guidance
function showWebcamGuidance() {
  // Remove any existing guidance overlay
  $('#webcam-guidance').remove();
  
  const guidanceHtml = `
    <div id="webcam-guidance">
      <div class="guidance-content">
        <img src="../../common/imgs/share_screen.gif" alt="webcam access icon" class="guidance-arrow" style="transform: rotate(-90deg);">
        <div class="guidance-text">👆 ${getText('allowCamera')}</div>
      </div>
    </div>
  `;
  
  $('body').append(guidanceHtml);
  
}

document.addEventListener("DOMContentLoaded", function () {
  let video = document.getElementById("webcam-video");

  if (video) {
      // Disable right-click context menu
      video.addEventListener("contextmenu", function (event) {
          event.preventDefault();
      });

      // Remove video controls dynamically if they get added
      video.removeAttribute("controls");

      // Set additional attributes to restrict user actions
      video.setAttribute("controlsList", "nodownload nofullscreen noremoteplayback");
      video.setAttribute("disablePictureInPicture", true);

      // Prevent keyboard shortcuts for dev tools & saving content
      document.addEventListener("keydown", function (event) {
          if (event.key === "F12" || 
              (event.ctrlKey && event.shiftKey && event.key === "I") || 
              (event.ctrlKey && event.shiftKey && event.key === "J") || 
              (event.ctrlKey && event.key === "U")) {
              event.preventDefault();
          }
      });
  }
});

function showFaceNotVisibleWarning() {
  faceNotVisibleCount = 0;
  const isEnglish = localStorage.getItem("lang") === "en";
  const countdownSeconds = 15;
  let secondsLeft = countdownSeconds;

  // Remove any existing overlay first
  $("#notVisibleOverlay").remove();

  $("body").append(`
    <div class="overlay-not-visible-1" id="notVisibleOverlay-not-visible-1">
      <div class="popup-not-visible-1">
        <h2>${
          isEnglish
            ? "Warning: Camera Access/Visibility Issue"
            : "تحذير: مشكلة في الوصول للكاميرا/الرؤية"
        }</h2>
          <p>${
            isEnglish
              ? "We cannot detect your face through the camera. <br> This could be because: <br> 1. You are not properly visible in front of the camera <br> 2. Camera access is not properly granted"
              : "لا يمكننا اكتشاف وجهك من خلال الكاميرا. قد يكون هذا بسبب: <br> ١. أنت غير مرئي بشكل صحيح أمام الكاميرا <br> ٢. لم يتم منح إذن الوصول للكاميرا بشكل صحيح"
          }</p>
          <p>${
            isEnglish
              ? "If this issue is not resolved within"
              : "إذا لم يتم حل هذه المشكلة خلال"
          } <span id="countdown">${countdownSeconds}</span> ${
    isEnglish ? "seconds" : "ثواني"
  } ${
    isEnglish
      ? ", the exam will be automatically terminated."
      : "، سيتم إنهاء الامتحان تلقائيًا."
  }</p>
          <p class="tips-text-not-visible-1">${
            isEnglish
              ? "Tips:\n• Ensure you are sitting directly in front of the camera\n• Check if your browser has camera permissions\n• Make sure there is adequate lighting\n• If using an external camera, verify it is properly connected"
              : "نصائح:\n• تأكد من أنك تجلس مباشرة أمام الكاميرا\n• تحقق من أن متصفحك لديه أذونات الكاميرا\n• تأكد من وجود إضاءة كافية\n• إذا كنت تستخدم كاميرا خارجية، تحقق من توصيلها بشكل صحيح"
          }</p>
          <div class="popup-timer-bar-not-visible-1">
            <div class="timer-progress-not-visible-1"></div>
          </div>
        </div>
      </div>
    `);

  $("#notVisibleOverlay-not-visible-1").fadeIn();
  $(".timer-progress-not-visible-1").css(
    "animation",
    `countdown-not-visible-1 ${countdownSeconds}s linear forwards`
  );

  const countdownInterval = setInterval(async () => {
    secondsLeft--;
    $("#countdown").text(secondsLeft);

    if (secondsLeft <= 0) {
      videoUploadLog("Maximum face not visible count reached and exam terminated", 'recording');
      await sendLogsToServer();
      clearInterval(countdownInterval);
      $("#notVisibleOverlay-not-visible-1").fadeOut(() => {
        $(this).remove();
        window.location.href = `message.html?status=not-visible${
          cid ? `&cid=${cid}` : ""
        }`;
      });
    }
  }, 1000);
}

function showRecordingFailed() {
  const isEnglish = localStorage.getItem("lang") === "en";
  const countdownSeconds = 15;
  let secondsLeft = countdownSeconds;

  // Remove any existing overlay first
  $("#recording-failed-overlay").remove();

  $("body").append(`
    <div class="overlay-not-visible-1" id="recording-failed-overlay">
      <div class="popup-not-visible-1">
        <h2>${isEnglish ? "⚠️ Recording Failed" : "⚠️ فشل التسجيل"}</h2>
        
        <p>
          ${isEnglish 
            ? "There was a problem with your recording. Please restart the exam and try using a different device if the issue persists."
            : "واجه التسجيل مشكلة. يرجى إعادة تشغيل الاختبار واستخدام جهاز آخر إذا استمرت المشكلة."}
        </p>

        <div class="tips-text-not-visible-1">
          <strong>${isEnglish ? "How to fix this issue:" : "كيفية حل هذه المشكلة:"}</strong>
          <ul>
            ${isEnglish 
              ? `
              <li>1. Refresh this page to restart the exam.</li>
              <li>2. Allow camera & microphone permissions when prompted.</li>
              <li>3. Ensure your internet connection is stable.</li>
              <li>4. Close other apps that may use your camera or mic.</li>
              <li>5. If the problem continues, contact your exam supervisor.</li>
              `
              : `
              <li>١. قم بتحديث الصفحة لإعادة بدء الامتحان.</li>
              <li>٢. اسمح باستخدام الكاميرا والميكروفون عند الطلب.</li>
              <li>٣. تأكد من أن اتصال الإنترنت لديك مستقر.</li>
              <li>٤. أغلق التطبيقات الأخرى التي قد تستخدم الكاميرا أو الميكروفون.</li>
              <li>٥. إذا استمرت المشكلة، تواصل مع مشرف الامتحان.</li>
              `}
          </ul>
        </div>

        <div class="popup-timer-bar-not-visible-1">
          <div class="timer-progress-not-visible-1"></div>
        </div>

        <div style="margin-top:20px; display:flex; justify-content:center; align-items:center; gap:10px;">
          <button id="restartExamBtn" 
            style="background:#007bff;color:#fff;padding:10px 20px;border:none;border-radius:6px;cursor:pointer;">
            ${isEnglish ? "🔄 Restart Exam Now" : "🔄 إعادة بدء الامتحان الآن"}
          </button>
        </div>
      </div>
    </div>
  `);

  $("#recording-failed-overlay").fadeIn();
  $(".timer-progress-not-visible-1").css(
    "animation",
    `countdown-not-visible-1 ${countdownSeconds}s linear forwards`
  );

  // Countdown logic
  const countdownInterval = setInterval(async () => {
    secondsLeft--;
    $("#countdown").text(secondsLeft);

    if (secondsLeft <= 0) {
      videoUploadLog("Recording failure timeout reached, exam terminated", 'recording');
      await sendLogsToServer();
      clearInterval(countdownInterval);
      $("#recording-failed-overlay").fadeOut(() => {
        $(this).remove();
        window.location.href = `/fullscreenexam/app-landing/index.html?${
          cid ? `&cid=${cid}` : ""
        }`;
      });
    }
  }, 1000);

  // Manual restart button
  $("#restartExamBtn").on("click", async () => {
    clearInterval(countdownInterval);
    videoUploadLog("Student clicked Restart Exam button", 'recording');
    await sendLogsToServer();
    window.location.href = `/fullscreenexam/app-landing/index.html?${
          cid ? `&cid=${cid}` : ""
        }`;
  });
}

function showInternetFailed() {
  const isEnglish = localStorage.getItem("lang") === "en";
  const countdownSeconds = 15;
  let secondsLeft = countdownSeconds;

  // Remove any existing overlay first
  $("#recording-failed-overlay").remove();

  $("body").append(`
    <div class="overlay-not-visible-1" id="recording-failed-overlay">
      <div class="popup-not-visible-1">
        <h2>${isEnglish ? "⚠️ Internet Issue Detected" : "⚠️ تم اكتشاف مشكلة في الإنترنت"}</h2>
        
        <p>
          ${isEnglish 
            ? "Your recording stopped due to an unstable internet connection. Don't worry, you can restart the exam safely."
            : "توقف التسجيل بسبب اتصال إنترنت غير مستقر. لا تقلق، يمكنك إعادة بدء الاختبار بأمان."}
        </p>

        <div class="tips-text-not-visible-1">
          <strong>${isEnglish ? "Quick Fix Steps:" : "خطوات الحل السريع:"}</strong>
          <ul>
            ${isEnglish 
              ? `
              <li>Refresh this page to restart the exam.</li>
              <li>Ensure your internet connection is stable.</li>
              <li>Allow camera & microphone permissions if prompted.</li>
              <li>Close other apps that may use your camera or microphone.</li>
              <li>If the problem persists, try another device or contact your exam supervisor.</li>
              `
              : `
              <li>قم بتحديث الصفحة لإعادة بدء الاختبار.</li>
              <li>تأكد من استقرار اتصال الإنترنت.</li>
              <li>اسمح بالكاميرا والميكروفون عند الطلب.</li>
              <li>أغلق التطبيقات الأخرى التي قد تستخدم الكاميرا أو الميكروفون.</li>
              <li>إذا استمرت المشكلة، جرب جهازًا آخر أو تواصل مع مشرف الاختبار.</li>
              `}
          </ul>
        </div>

        <div class="popup-timer-bar-not-visible-1">
          <div class="timer-progress-not-visible-1"></div>
        </div>

        <div style="margin-top:20px; display:flex; justify-content:center; align-items:center; gap:10px;">
          <button id="restartExamBtn" 
            style="background:#007bff;color:#fff;padding:10px 20px;border:none;border-radius:6px;cursor:pointer;">
            ${isEnglish ? "🔄 Restart Exam Now" : "🔄 إعادة بدء الامتحان الآن"}
          </button>
        </div>
      </div>
    </div>
  `);

  $("#recording-failed-overlay").fadeIn();
  $(".timer-progress-not-visible-1").css(
    "animation",
    `countdown-not-visible-1 ${countdownSeconds}s linear forwards`
  );

  // Countdown logic
  const countdownInterval = setInterval(async () => {
    secondsLeft--;
    $("#countdown").text(secondsLeft);

    if (secondsLeft <= 0) {
      videoUploadLog("Recording failure due to internet timeout, exam terminated", 'recording');
      await sendLogsToServer();
      clearInterval(countdownInterval);
      $("#recording-failed-overlay").fadeOut(() => {
        $(this).remove();
        window.location.href = `/fullscreenexam/app-landing/index.html?${
          cid ? `&cid=${cid}` : ""
        }`;
      });
    }
  }, 1000);

  // Manual restart button
  $("#restartExamBtn").on("click", async () => {
    clearInterval(countdownInterval);
    videoUploadLog("Student clicked Restart Exam button", 'recording');
    await sendLogsToServer();
    window.location.href = `/fullscreenexam/app-landing/index.html?${
          cid ? `&cid=${cid}` : ""
        }`;
  });
}

window.showAccessContainer = showAccessContainer;
window.validateLogin = validateLogin;
window.showAccessContainerForRetry = showAccessContainerForRetry;
window.showToastAccess = showToast;
window.showFaceNotVisibleWarning = showFaceNotVisibleWarning;
window.showRecordingFailed = showRecordingFailed;
window.showInternetFailed = showInternetFailed;
