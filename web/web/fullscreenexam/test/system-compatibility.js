    $(document).ready(function () {
      renderLanguage();
    });
    // OS detection function
    function getOSInfo() {
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      if (/Windows NT 10.0/i.test(userAgent)) return "Windows 10";
      if (/Windows NT 6.2/i.test(userAgent)) return "Windows 8";
      if (/Windows NT 6.1/i.test(userAgent)) return "Windows 7";
      if (platform === "iPad") return 'iPad';
      else if (/Mac OS X/i.test(userAgent)) return "macOS";
      if (/Android/i.test(userAgent)) return "Android";
      if (/Linux/i.test(userAgent)) return "Linux";
      return "Unknown OS";
    }

    // Browser detection function
    function getBrowserInfo() {
      const userAgent = navigator.userAgent;
      const vendor = navigator.vendor || "";
      const platform = navigator.platform;
      if (platform === "iPad") {
        if (/Edg/i.test(userAgent)) {
          const version = userAgent.match(/Edg\/(\d+)/);
          return `Edge ${version ? version[1] : "Unknown"}`;
        }
        if (/CriOS/i.test(userAgent)) {
          const version = userAgent.match(/Chrome\/(\d+)/);
          return `Chrome ${version ? version[1] : "Unknown"}`;
        }
        if (/Mobile/i.test(userAgent) && !/Safari/i.test(userAgent)) {
          const version = userAgent.match(/Chrome\/(\d+)/);
          return `Chrome ${version ? version[1] : "Unknown"}`;
        }
      } else {
        if (/Edg/i.test(userAgent)) {
          const version = userAgent.match(/Edg\/(\d+)/);
          return `Edge ${version ? version[1] : "Unknown"}`;
        }
        if (/Chrome/i.test(userAgent)) {
          const version = userAgent.match(/Chrome\/(\d+)/);
          return `Chrome ${version ? version[1] : "Unknown"}`;
        }
      }
      return "Unknown Browser";
    }

    // Check if browser and OS are supported
    function checkCompatibility() {
      const os = getOSInfo();
      const browser = getBrowserInfo();
      const osStatusEl = document.getElementById(
        "container_system_info_section_operating_system_status"
      );
      const browserStatusEl = document.getElementById(
        "container_system_info_section_browser_status"
      );
      const statusEl = document.getElementById("container_test_setup_status");

      // Define supported configurations
      const supportedConfigs = {
        "Windows 10": ["Chrome", "Edge", "Brave"],
        "Windows 8": ["Chrome", "Edge", "Brave"],
        "Windows 7": ["Chrome", "Edge", "Brave"],
        "iPad": ["Chrome", "Edge", "Brave"],
        "Linux": ['Chrome', 'Edge', "Brave"],
        macOS: ["Chrome", "Edge"],
      };

      // Check OS compatibility
      const isOSSupported = supportedConfigs.hasOwnProperty(os);
      if (isOSSupported) {
        osStatusEl.innerHTML = `${os} <span style="color: green;">✓</span>`;
      } else {
        osStatusEl.innerHTML = `<div>
            <div style="color:red;font-weight:550">${os}</div>
            <div><span style="color: red;font-weight:550">This OS is not supported for writing the exam.</span></div>
            <div>`;

      }

      // Check browser compatibility
      const browserName = browser.split(" ")[0];
      const isBrowserSupported =
        isOSSupported && supportedConfigs[os].includes(browserName);
      if (isBrowserSupported || ['Chrome', 'Edge', 'Brave'].includes(browserName)) {
        browserStatusEl.innerHTML = `${browser} <span style="color: green;fontWeight:550">✓</span>`;
      } else {
        browserStatusEl.innerHTML = `<div>
            <div style="color:red;font-weight:550">${browser}</div>
            <div><span style="color: red;font-weight:550">This browser is not supported for writing the exam.</span></div>
            <div>`;
      }

      // Disable test buttons if system is not compatible
      const webcamBtn = document.getElementById(
        "container_test_setup_buttons_webcam"
      );
      const shareBtn = document.getElementById(
        "container_test_setup_buttons_screen_share"
      );
      if (!isOSSupported || !isBrowserSupported) {
        webcamBtn.disabled = true;
        shareBtn.disabled = true;
        webcamBtn.style.opacity = "0.5";
        shareBtn.style.opacity = "0.5";
      }

      return { os, browser, isOSSupported, isBrowserSupported };
    }

    // Update OS & Browser info on page load
    const compatibility = checkCompatibility();

    // Dynamically update icons using Font Awesome
    function updateIcons() {
      const osIconEl = document.getElementById("os-icon");
      const browserIconEl = document.getElementById("browser-icon");
      let osIconHTML = "";
      let browserIconHTML = "";
      // OS Icons
      if (compatibility.os === "iPad") {
        osIconHTML = '<i class="fa-solid fa-tablet-screen-button" style="color:red"></i>';
      } else if (compatibility.os === "macOS") {
        osIconHTML = '<i class="fab fa-apple" ></i>';
      } else if (compatibility.os.startsWith("Windows")) {
        osIconHTML = '<i class="fab fa-windows"></i>';
      } else if (compatibility.os === "Linux") {
        osIconHTML = '<i class="fab fa-linux"></i>';
      } else if (compatibility.os === "Android") {
        osIconHTML = '<i class="fab fa-android" style="color:red"></i>';
      } else {
        osIconHTML = '<i class="fas fa-desktop"></i>';
      }

      // Browser Icons
      if (compatibility.browser.indexOf("Chrome") !== -1) {
        browserIconHTML = '<i class="fab fa-chrome"></i>';
      } else if (compatibility.browser.indexOf("Edge") !== -1) {
        browserIconHTML = '<i class="fab fa-edge"></i>';
      } else if (compatibility.browser.indexOf("Safari") !== -1) {
        browserIconHTML = '<i class="fab fa-safari" style="color:red"></i>';
      } else if (compatibility.browser.indexOf("Firefox") !== -1) {
        browserIconHTML = '<i class="fab fa-firefox" style="color:red"></i>';
      } else if (compatibility.browser.indexOf("Opera") !== -1) {
        browserIconHTML = '<i class="fa-brands fa-opera" style="color:red"></i>';
      } else {
        browserIconHTML = '<i class="fas fa-globe" style="color:red"></i>';
      }

      osIconEl.innerHTML = osIconHTML;
      browserIconEl.innerHTML = browserIconHTML;
    }
    updateIcons();

    // --- Webcam and Screen Share Button Logic ---
    const webcamBtn = document.getElementById(
      "container_test_setup_buttons_webcam"
    );
    const shareBtn = document.getElementById(
      "container_test_setup_buttons_screen_share"
    );
    const statusEl = document.getElementById("container_test_setup_status");
    const webcamVideo = document.getElementById("webcam-video");
    const screenVideo = document.getElementById("screen-video");

    // Webcam access button
    webcamBtn.addEventListener("click", async () => {
      if (!compatibility.isOSSupported || !compatibility.isBrowserSupported) {
        return;
      }
      const isEnglish = localStorage.getItem("lang") === "en";
      statusEl.textContent = isEnglish
        ? "Requesting webcam..."
        : "جارٍ طلب كاميرا الويب...";
      try {
        const webcamStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        webcamVideo.srcObject = webcamStream;
        statusEl.textContent = isEnglish
          ? "✅ Webcam enabled successfully!"
          : "جارٍ طلب كاميرا الويب...";
        webcamBtn.textContent = isEnglish
          ? "Webcam Enabled"
          : "تم تمكين كاميرا الويب";
      } catch (err) {
        console.error("Webcam error:", err);
        statusEl.textContent = isEnglish
          ? `❌ Webcam failed: ${err.message || err}`
          : `❌ فشل في كاميرا الويب: ${err.message || err}`;
      }
    });

    // Screen sharing button
    shareBtn.addEventListener("click", async () => {
      if (!compatibility.isOSSupported || !compatibility.isBrowserSupported) {
        return;
      }
      const isEnglish = localStorage.getItem("lang") === "en";
      statusEl.textContent = isEnglish
        ? "Requesting screen share..."
        : "جارٍ طلب مشاركة الشاشة...";
      try {
        if (!navigator.mediaDevices.getDisplayMedia) {
          throw new Error("Your browser does not support getDisplayMedia().");
        }
        // For Safari, use "window" instead of "monitor"
        const constraints = {
          video: {
            displaySurface:
              /Safari/i.test(navigator.userAgent) &&
                !/Edg/i.test(navigator.userAgent)
                ? "window"
                : "monitor",
            cursor: "always",
          },
          audio: false,
        };
        const screenStream = await navigator.mediaDevices.getDisplayMedia(
          constraints
        );
        screenVideo.srcObject = screenStream;
        statusEl.textContent = isEnglish
          ? "✅ Screen sharing started!"
          : "✅ تم بدء مشاركة الشاشة!";
        shareBtn.textContent = isEnglish
          ? "Screen Share Enabled"
          : "تم تمكين مشاركة الشاشة";
      } catch (err) {
        console.error("Screen share error:", err);
        statusEl.textContent = isEnglish
          ? `❌ Screen share failed: ${err.message || err}`
          : `❌ فشل في مشاركة الشاشة: ${err.message || err}`;
      }
    });


    // Back history button handler: sets arrow direction and text based on language (on load and on toggle)
    const $icon = $('#back-arrow-icon');
    const $langToggle = $('#lang-toggle');
    const $backText = $('#back-history-text');
    const savedLanguage = localStorage.getItem("lang") || "en";

    // On page load: set direction and text
    if (savedLanguage === "ar") {
      $langToggle.prop('checked', true);
      $icon.removeClass('fa-arrow-left').addClass('fa-arrow-right');
      $backText.text('رجوع'); // Arabic for "Back"
    } else {
      $langToggle.prop('checked', false);
      $icon.removeClass('fa-arrow-right').addClass('fa-arrow-left');
      $backText.text('Back');
    }

    // On toggle: update language, icon, and text
    $langToggle.change(function () {
      const isChecked = $(this).is(':checked');
      const selectedLanguage = isChecked ? 'ar' : 'en';
      localStorage.setItem("lang", selectedLanguage);

      if (selectedLanguage === 'ar') {
        $icon.removeClass('fa-arrow-left').addClass('fa-arrow-right');
        $backText.text('رجوع');
      } else {
        $icon.removeClass('fa-arrow-right').addClass('fa-arrow-left');
        $backText.text('Back');
      }
    });
    // Optional: Reload page after 2 minutes (if needed)
    setTimeout(function () {
      window.location.reload();
    }, 2 * 60000);
