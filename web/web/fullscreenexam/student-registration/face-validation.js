const faceValidationThresholds = {
  minConfidence: 0.6,        
  minLighting: 0.5,          
  maxPoseAngle: 25,          
  minAntispoofScore: 0.5,    
  minLivenessScore: 0.2,     
  minBrightness: 40          
};

let human = null;
let Human = null;
let liveValidationTimer = null;
let lastValidationResult = null;
let validationStatusElement = null;
let voiceGuidanceEnabled = true;
let speechSynthesis = window.speechSynthesis;
let lastSpokenMessage = "";
let lastSpeechTime = 0;
const SPEECH_COOLDOWN = 5000; 


export async function initFaceValidation() {
  try {
    if (!Human) {
      try {
        const HumanModule = await import('../../anamoly_process/dist/human.esm.js');
        Human = HumanModule.default || HumanModule.Human;
      } catch (importError) {
        console.error("Error importing Human module:", importError);
        throw new Error("Failed to load face detection module");
      }
    }
    
    if (!human) {
      human = new Human({
        modelBasePath: "../../anamoly_process/models",
        filter: {
          enabled: true,
          equalization: true,
          brightness: 0.1,
          contrast: 0.1,
          sharpness: 0.3,
        },
        face: {
          enabled: true,
          detector: {
            rotation: true,
            return: 1,
            mask: false,
            maxDetected: 1,
            minConfidence: 0.2,
            minSize: 100,
          },
          mesh: { enabled: true },
          iris: { enabled: true },
          description: { enabled: false },
          emotion: { enabled: false },
          antispoof: { enabled: true },
          liveness: { enabled: true }
        }
      });
      
      await human.load();
    }
    
    return {
      validateFace,
      startLiveValidation,
      stopValidation,
      setVoiceGuidance,
      createUI,
      isVoiceGuidanceEnabled: () => voiceGuidanceEnabled,
      dispose
    };
  } catch (error) {
    console.error("Face validation initialization error:", error);
    throw error;
  }
}


function createUI(container) {
  const isEnglish = (localStorage.getItem('lang') || 'en') === 'en';

  $('#voiceToggle').remove();
  $('#validationStatus').remove();
  
  validationStatusElement = document.createElement('div');
  validationStatusElement.id = 'validationStatus';
  validationStatusElement.className = 'validation-status';
  
  const voiceToggleBtn = document.createElement('button');
  voiceToggleBtn.id = 'voiceToggle';
  voiceToggleBtn.className = 'voice-toggle';
  voiceToggleBtn.type = 'button';
  voiceToggleBtn.title = isEnglish ? 'Toggle Voice Guidance' : 'تبديل الإرشاد الصوتي';

  // Check if voice guidance setting exists in localStorage
  if (localStorage.getItem('voiceGuidanceEnabled') !== null) {
    voiceGuidanceEnabled = localStorage.getItem('voiceGuidanceEnabled') === 'true';
  }

  voiceToggleBtn.innerHTML = `
    <i class="fas ${voiceGuidanceEnabled ? 'fa-volume-up' : 'fa-volume-mute'}"></i>
  `;
  
  voiceToggleBtn.addEventListener('click', function() {
    setVoiceGuidance(!voiceGuidanceEnabled);
    
    const icon = this.querySelector('i');
    
    if (voiceGuidanceEnabled) {
      icon.className = 'fas fa-volume-up';
      
      if (speechSynthesis) {
        const msg = new SpeechSynthesisUtterance(isEnglish ? 'Voice guidance activated' : 'تم تفعيل الإرشاد الصوتي');
        msg.lang = isEnglish ? 'en-US' : 'ar-SA';
        speechSynthesis.speak(msg);
      }
    } else {
      icon.className = 'fas fa-volume-mute';
      
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
    }
    
    // Save voice guidance state to localStorage
    localStorage.setItem('voiceGuidanceEnabled', voiceGuidanceEnabled);
  });
  
  container.appendChild(validationStatusElement);

  // Find the "For best results:" text element and position the button next to it
  const forBestResultsEl = document.getElementById('photo_upload_camera_instructions_title');
  if (forBestResultsEl) {
    // Create a wrapper div to contain both the text and button
    const wrapper = document.createElement('div');
    wrapper.className = 'best-results-wrapper';
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'space-between';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '10px';
    
    // Replace the original element with the wrapper
    forBestResultsEl.parentNode.insertBefore(wrapper, forBestResultsEl);
    wrapper.appendChild(forBestResultsEl);
    wrapper.appendChild(voiceToggleBtn);
    
  } else {
    // Fallback: append to the container if "For best results:" text not found
    container.appendChild(voiceToggleBtn);
  }
  
  return {
    validationStatusElement,
    voiceToggleBtn
  };
}


function startLiveValidation(videoElement, captureButton) {
  stopValidation();
  
  runLiveValidation(videoElement, captureButton);
  
  liveValidationTimer = setInterval(() => runLiveValidation(videoElement, captureButton), 500);
}


async function runLiveValidation(videoElement, captureButton) {
  if (!human || !videoElement || !validationStatusElement) {
    return;
  }
  
  try {
    const result = await validateFace(videoElement);
    lastValidationResult = result;
    
    updateValidationStatus(result);
    
    if (captureButton) {
      if (result.valid) {
        captureButton.classList.remove('disabled');
        captureButton.disabled = false;
      } else {
        captureButton.classList.add('disabled');
        captureButton.disabled = true;
      }
    }
    
    speakValidationMessage(result);
  } catch (error) {
    console.error("Live validation error:", error);
  }
}


function updateValidationStatus(result) {
  if (!validationStatusElement) return;
  
  const isEnglish = (localStorage.getItem('lang') || 'en') === 'en';
  
  validationStatusElement.innerHTML = '';
  
  if (result.valid) {
    validationStatusElement.innerHTML = `
      <div class="status-item valid">
        <i class="fas fa-check-circle"></i>
        <span>${isEnglish ? "Face validation successful! You can capture your photo now." : "تم التحقق من الوجه بنجاح! يمكنك التقاط صورتك الآن."}</span>
      </div>
    `;
    validationStatusElement.classList.remove('invalid');
    validationStatusElement.classList.add('valid');
  } else {
    validationStatusElement.innerHTML = `
      <div class="status-item invalid">
        <i class="fas fa-exclamation-triangle"></i>
        <span>${isEnglish ? result.message : result.messageAr}</span>
      </div>
    `;
    validationStatusElement.classList.remove('valid');
    validationStatusElement.classList.add('invalid');
  }
}


function speakValidationMessage(result) {
  if (!speechSynthesis || !voiceGuidanceEnabled) return;
  
  const isEnglish = (localStorage.getItem('lang') || 'en') === 'en';
  const currentTime = Date.now();
  
  let messageToSpeak = "";
  
  if (result.valid) {
    if (lastSpokenMessage && lastSpokenMessage.includes("error")) {
      messageToSpeak = isEnglish ? 
        "Perfect! You can now capture your photo." : 
        "ممتاز! يمكنك الآن التقاط صورتك.";
    } else {
      return;
    }
  } else {
    if (result.message.includes("No face detected")) {
      messageToSpeak = isEnglish ? 
        "Please face the camera." : 
        "يرجى مواجهة الكاميرا.";
    } else if (result.message.includes("Face not clear")) {
      messageToSpeak = isEnglish ? 
        "Please check your lighting and face the camera directly." : 
        "يرجى التحقق من الإضاءة ومواجهة الكاميرا مباشرة.";
    } else if (result.message.includes("Face is not straight")) {
      messageToSpeak = isEnglish ? 
        "Please keep your head straight and look directly at the camera." : 
        "يرجى إبقاء رأسك مستقيماً والنظر مباشرة إلى الكاميرا.";
    } else if (result.message.includes("Spoof detected")) {
      messageToSpeak = isEnglish ? 
        "Please use your real face, not a photo." : 
        "يرجى استخدام وجهك الحقيقي، وليس صورة.";
    } else if (result.message.includes("Liveness check failed")) {
      messageToSpeak = isEnglish ? 
        "Please ensure you are a real person." : 
        "يرجى التأكد من أنك شخص حقيقي.";
    } else if (result.message.includes("Poor image quality")) {
      messageToSpeak = isEnglish ? 
        "Please improve lighting and adjust your distance from the camera." : 
        "يرجى تحسين الإضاءة وضبط المسافة من الكاميرا.";
    } else {
      messageToSpeak = isEnglish ? result.message : result.messageAr;
    }
  }
  
  if (messageToSpeak !== lastSpokenMessage || (currentTime - lastSpeechTime) > SPEECH_COOLDOWN) {
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(messageToSpeak);
    
    utterance.lang = isEnglish ? 'en-US' : 'ar-SA';
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    speechSynthesis.speak(utterance);
    
    lastSpokenMessage = messageToSpeak;
    lastSpeechTime = currentTime;
  }
}


async function validateFace(videoElement) {
  
  if (!human || !videoElement) {
    return { 
      valid: false, 
      message: "Face detection not initialized properly.", 
      messageAr: "لم يتم تهيئة اكتشاف الوجه بشكل صحيح." 
    };
  }
  
  try {
    const brightnessLevel = await checkBrightness(videoElement);
    if (brightnessLevel < faceValidationThresholds.minBrightness) {
      return { 
        valid: false, 
        message: "Lighting is too dark. Please move to a better lit area or turn on more lights.", 
        messageAr: "الإضاءة مظلمة جدًا. يرجى الانتقال إلى منطقة أفضل إضاءة أو تشغيل المزيد من الأضواء." 
      };
    }
    
    const result = await human.detect(videoElement);
    
    if (!result.face || result.face.length === 0) {
      return { 
        valid: false, 
        message: "No face detected. Please position yourself properly in front of the camera.", 
        messageAr: "لم يتم اكتشاف وجه. يرجى وضع نفسك بشكل صحيح أمام الكاميرا." 
      };
    }
    
    const face = result.face[0];

    const gestures = Object.values(human.result.gesture).map(
      (gesture) => gesture.gesture
    );

    
    if (face.score < faceValidationThresholds.minConfidence) {
      return { 
        valid: false, 
        message: "Face not clear. Please ensure good lighting and face the camera directly.", 
        messageAr: "الوجه غير واضح. يرجى التأكد من الإضاءة الجيدة والنظر إلى الكاميرا مباشرة." 
      };
    }

     const faceArea = face.box[2] * face.box[3]; 
     const faceImageSize = videoElement.width * videoElement.height;
     const relativeFaceSize = faceArea / faceImageSize;
     
     if (relativeFaceSize < 0.1 || face.score < faceValidationThresholds.minConfidence) {
       return { 
         valid: false, 
         message: "Poor image quality or lighting. Please ensure good lighting and proper distance from camera.", 
         messageAr: "جودة الصورة أو الإضاءة سيئة. يرجى التأكد من الإضاءة الجيدة والمسافة المناسبة من الكاميرا." 
       };
     }

    if (!gestures.includes("facing center")) {
      return { 
        valid: false, 
        message: "Face is not straight. Please face the camera directly without tilting your head.", 
        messageAr: "الوجه ليس مستقيمًا. يرجى مواجهة الكاميرا مباشرة دون إمالة رأسك." 
      };
    }
    
    if (face.real && face.real < faceValidationThresholds.minAntispoofScore) {
      return { 
        valid: false, 
        message: "Spoof detected. Please ensure you're using a real face, not a photo or screen.", 
        messageAr: "تم اكتشاف تزييف. يرجى التأكد من استخدام وجه حقيقي، وليس صورة أو شاشة." 
      };
    }
    
    return { 
      valid: true, 
      message: "Face validation successful!", 
      messageAr: "تم التحقق من الوجه بنجاح!" 
    };
  } catch (error) {
    console.error("Face validation error:", error);
    return { 
      valid: false, 
      message: "Error during face validation. Please try again.", 
      messageAr: "خطأ أثناء التحقق من الوجه. يرجى المحاولة مرة أخرى." 
    };
  }
}


async function checkBrightness(videoElement) {
  if (!videoElement) return 0;
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  canvas.width = videoElement.videoWidth || 640;
  canvas.height = videoElement.videoHeight || 480;
  
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let totalBrightness = 0;
  let sampleCount = 0;
  
  for (let i = 0; i < data.length; i += 40) { 
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    
    totalBrightness += brightness;
    sampleCount++;
  }
  
  const averageBrightness = totalBrightness / sampleCount;
  
  
  return averageBrightness;
}


function setVoiceGuidance(enabled) {
  voiceGuidanceEnabled = enabled;
  
  if (!enabled && speechSynthesis) {
    speechSynthesis.cancel();
  }
}


function stopValidation() {
  if (liveValidationTimer) {
    clearInterval(liveValidationTimer);
    liveValidationTimer = null;
  }
  
  if (speechSynthesis) {
    speechSynthesis.cancel();
  }
}


function dispose() {
  stopValidation();
  
  if (human) {
    human.dispose();
    human = null;
  }
  
  if (validationStatusElement) {
    if (validationStatusElement.parentNode) {
      validationStatusElement.parentNode.removeChild(validationStatusElement);
    }
    validationStatusElement = null;
  }
  
  lastValidationResult = null;
}


export function getLastValidationResult() {
  return lastValidationResult;
} 