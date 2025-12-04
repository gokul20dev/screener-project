window.addEventListener("load", function () {
    // --- DOM Elements ---
    const video = document.getElementById("video-feed");
    const messageContainer = document.getElementById("message-container");
    const scanBox = document.getElementById("scan-box");
    const switchCameraButton = document.getElementById("switch-camera-btn");
    const helpButton = document.getElementById("help-btn");
    const langLabelEn = document.getElementById("lang-label-en");
    const langLabelAr = document.getElementById("lang-label-ar");
    const instructionsContainer = document.getElementById("instructions-container");
    const instructionsTitle = document.getElementById("instructions-title");
    const instructionsEn = document.getElementById("instructions-en");
    const instructionsAr = document.getElementById("instructions-ar");
    const mainTitle = document.getElementById("main-title");
    const scanMessage = document.getElementById("scan-message");
    const switchCameraText = document.getElementById("switch-camera-text");
    const helpText = document.getElementById("help-text");

    // --- State Variables ---
    let scanning = false;
    let currentStream;
    let currentFacingMode = "environment";
    let videoDevices = [];
    let currentDeviceIndex = 0;
    let canvasElement, canvas;
    let redirectTimeout;

    function showMessage(text, type = "") {
        messageContainer.textContent = text;
        messageContainer.className = type ? `message-container ${type}` : "message-container";
    }

    async function enumerateCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            videoDevices = devices.filter(device => device.kind === 'videoinput');
            if (videoDevices.length > 1) {
                switchCameraButton.style.display = 'flex'; // Show button if multiple cameras
            }
        } catch (err) {
            console.error("Error enumerating devices:", err);
        }
    }

    async function initializeCamera(deviceId) {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: currentFacingMode } })
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            currentStream = stream;
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                // Create canvas once video metadata is available
                canvasElement = document.createElement("canvas");
                canvas = canvasElement.getContext("2d", { willReadFrequently: true });
                canvasElement.height = video.videoHeight;
                canvasElement.width = video.videoWidth;

                scanning = true;
                requestAnimationFrame(tick);
                showMessage("Ready to scan.", "success");
            };
            await enumerateCameras(); // Refresh camera list
        } catch (err) {
            console.error("Camera access error:", err);
            let errorMessage = "Could not access camera. Please enable it in your browser settings.";
            if (err.name === 'NotAllowedError') {
                errorMessage = "Camera access was denied. You'll need to enable it in your browser's settings to scan the QR code.";
            } else if (err.name === 'NotFoundError') {
                errorMessage = "No camera found on this device. Please connect a camera to continue.";
            } else if (err.name === 'NotReadableError') {
                errorMessage = "The camera is currently in use by another application.";
            } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
                // This can happen if the 'environment' camera is not available. Try the user (front) camera.
                if (constraints.video.facingMode) {
                    currentFacingMode = 'user';
                    initializeCamera(); // Retry with the other facing mode
                    return;
                }
                errorMessage = "Could not find a suitable camera.";
            }
            showMessage(errorMessage, "error");
        }
    }

    async function switchCamera() {
        if (videoDevices.length > 1) {
            currentDeviceIndex = (currentDeviceIndex + 1) % videoDevices.length;
            const newDeviceId = videoDevices[currentDeviceIndex].deviceId;
            await initializeCamera(newDeviceId);
        } else {
            // Fallback for browsers that don't support enumerateDevices well but might support facingMode
            currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
            await initializeCamera();
        }
    }

    function tick() {
        if (!scanning || !currentStream || !canvas) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                handleQRCode(code);
            }
        }
        if (scanning) {
            requestAnimationFrame(tick);
        }
    }

    function handleQRCode(code) {
        scanning = false;
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        
        try {
            // First, validate the QR code data is a valid URL
            new URL(code.data); 
            
            // Only show the success overlay if the URL is valid
            document.getElementById('success-overlay').style.display = 'flex';
            
            redirectTimeout = setTimeout(() => {
                window.location.href = code.data;
            }, 1500);
        } catch (e) {
            // If validation fails, show an error message and restart the camera
            showMessage("Invalid QR Code found. Please scan a valid code.", "error");
            setTimeout(() => {
                initializeCamera(videoDevices[currentDeviceIndex]?.deviceId);
            }, 3000);
        }
    }

    // --- Event Listeners ---
    switchCameraButton.addEventListener('click', switchCamera);

    document.getElementById('scan-again-btn').addEventListener('click', () => {
        clearTimeout(redirectTimeout);
        document.getElementById('success-overlay').style.display = 'none';
        initializeCamera(videoDevices[currentDeviceIndex]?.deviceId);
    });

    helpButton.addEventListener('click', () => {
        alert(
            "How to Scan:\n\n" +
            "1. Point your camera at a QR code on the exam paper.\n" +
            "2. Ensure the QR code is centered within the scanning box.\n" +
            "3. Once scanned, you'll be taken to the upload page for that question.\n" +
            "4. Use the 'Switch Camera' button if you have more than one camera.\n" +
            "5. To make a correction, just re-scan the same QR code."
        );
    });

    const translations = {
        ar: {
            mainTitle: '<span class="brand-highlight">DigiAssess</span> - ماسح الورق الضوئي',
            scanMessage: 'قم بمحاذاة رمز الاستجابة السريعة داخل الإطار للمسح',
            instructionsTitle: 'تعليمات',
            switchCamera: 'تبديل الكاميرا',
            help: 'مساعدة',
            langLabel: 'English'
        },
        en: {
            mainTitle: '<span class="brand-highlight">DigiAssess</span> - Paper Scanner',
            scanMessage: 'Align the QR code within the frame to scan',
            instructionsTitle: 'Instructions',
            switchCamera: 'Switch Camera',
            help: 'Help',
            langLabel: 'العربية'
        }
    };

    function setLanguage(lang) {
        const dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.body.dir = dir;
        instructionsContainer.dir = dir;

        scanMessage.textContent = translations[lang].scanMessage;
        instructionsTitle.textContent = translations[lang].instructionsTitle;
        switchCameraText.textContent = translations[lang].switchCamera;
        helpText.textContent = translations[lang].help;

        if (lang === 'ar') {
            instructionsEn.style.display = 'none';
            instructionsAr.style.display = 'block';
            langLabelEn.classList.remove('active');
            langLabelAr.classList.add('active');
        } else {
            instructionsEn.style.display = 'block';
            instructionsAr.style.display = 'none';
            langLabelEn.classList.add('active');
            langLabelAr.classList.remove('active');
        }
    }

    langLabelEn.addEventListener('click', () => setLanguage('en'));
    langLabelAr.addEventListener('click', () => setLanguage('ar'));

    // --- Initialization ---
    async function start() {
        if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' && window.jsQR) {
            await initializeCamera();
        } else {
            showMessage("Your browser does not support the necessary features for QR code scanning.", "error");
        }
        setLanguage('en'); // Set default language on load
    }

    start();
}); 
//test
//anothe test