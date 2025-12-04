// Exam Preview JavaScript
let examData = null;
let attendeesData = [];
let examId = null;

$(document).ready(function () {
  // Get exam ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  examId = urlParams.get("examId");

  if (!examId) {
    showError("No exam ID provided");
    return;
  }



  // Initialize user info and navigation
  try {
    // Load user information for header
    if (typeof loadUserInfo === "function") {
      loadUserInfo();
    }

    // Initialize navigation menu
    if (typeof initNavSectionMenu === "function") {
      initNavSectionMenu();
    }
  } catch (error) {
    console.warn("Navigation initialization error:", error);
  }

  // Load exam details and attendees
  loadExamDetails();
  loadAttendees();
});

function loadExamDetails() {
  showAssessmentLoader(true, "Loading exam details...");

  const apiUrl = `${EXAM_END_POINT}?entranceExamId=${examId}`;

  makeApiCall({
    url: apiUrl,
    method: "GET",
    successCallback: function (response) {
      setTimeout(() => {
        showAssessmentLoader(false);
        if (response && response.data && response.data.exam) {
          examData = response.data.exam;
          renderExamDetails();
        } else {
          showError("Failed to load exam details");
        }
      }, 500);
    },
    errorCallback: function (error) {
      showAssessmentLoader(false);
      showError("Failed to load exam details: " + error);
    },
  });
}
function loadAttendees() {
  const attendeesApiUrl = `${EXAM_END_POINT}/attender?canPaginate=false&showAdditionalFields=true&entranceExamId=${examId}`;

  makeApiCall({
    url: attendeesApiUrl,
    method: "GET",
    successCallback: function (response) {
      // Handle the new API structure: response.data.data
      if (response && response.data && response.data.data) {
        attendeesData = response.data.data;
      } else if (response && response.data && Array.isArray(response.data)) {
        attendeesData = response.data;
      } else if (Array.isArray(response)) {
        attendeesData = response;
      } else {
        attendeesData = [];
      }

      // No pagination - showing all attendees

      // Re-render basic info and attendee statistics to update attendee count
      if (examData) {
        console.log(
          "Re-rendering basic info with attendees count:",
          attendeesData.length
        );
        renderBasicInfoSimplified();
        renderAttendeesStatisticsSimplified();
      }
    },
    errorCallback: function (error) {
      console.error("Failed to load attendees:", error);
      attendeesData = [];

      // Re-render basic info and attendee statistics even on error
      if (examData) {
        renderBasicInfoSimplified();
        renderAttendeesStatisticsSimplified();
      }

      // Show user-friendly message
      if (window.showToast) {
        window.showToast("Unable to load attendees information", "warning");
      }
    },
  });
}
function renderExamDetails() {
  const uniqueQuestions = getUniqueQuestions();

  // Render exam header
  renderExamHeader();

  // Render all sections in simplified layout
  renderBasicInfoSimplified();
  renderSessionInfoSimplified();  
  renderEnabledFeaturesSimplified();
  renderQuestionsStatisticsSimplified();
  renderAttendeesStatisticsSimplified();
  
  // Show main content
  $("#main-content").show();
}


// New simplified rendering functions
function renderExamHeader() {
  const uniqueQuestions = getUniqueQuestions();
  
  // Update exam title
  $("#exam-title").text(examData.name || "Untitled Exam");
  
  // Update exam status
  const status = examData.examStatus || examData.status || "Unknown";
  const statusClass = getExamStatusClass(status);
  const statusText = formatExamStatus(status);
  $("#exam-status").removeClass().addClass(`pill ${statusClass}`).text(statusText);
  
  // Update exam meta information
  const session = examData.session || {};
  const settings = examData.settings || {};
  
  $("#exam-start").text(formatDateTime(session.start) || "Not set");
  $("#exam-end").text(formatDateTime(session.end) || "Not set");
  $("#exam-duration").text(settings.duration ? `${settings.duration} min` : calculateDuration(session.start, session.end));
  $("#last-updated").text(formatDateTime(examData.updatedAt) || "Not set");
  $("#created-by").text(formatDateTime(examData.createdAt) || "Not set");
  $("#exam-createdby").text(examData.createdBy.email)

}

function renderBasicInfoSimplified() {
  const settings = examData.settings || {};
  
  const basicInfoHtml = `
    <div class="info-row">
      <span class="label">Pass Mark</span>
      <span class="value">${settings.cutoff || 0}%</span>
    </div>
    <div class="info-row">
      <span class="label">Time Zone</span>
      <span class="value">${settings.timeZone || "Not specified"}</span>
    </div>
  `;
  
  $("#basic-info").html(basicInfoHtml);
}

function renderSessionInfoSimplified() {
  const settings = examData.settings || {};
  
  const sessionInfoHtml = `
    <div class="info-row has-tooltip">
      <span class="label">Shuffle Questions <i class="fas fa-info-circle info-icon"></i></span>
      <span class="value">
        <span class="status-indicator ${settings.canShuffleQuestions ? 'on' : 'off'}">
          ${settings.canShuffleQuestions ? 'ON' : 'OFF'}
        </span>
      </span>
      <div class="tooltip">When enabled, questions will be displayed in a random order for each student, helping to prevent cheating and ensure exam integrity.</div>
    </div>
    <div class="info-row has-tooltip">
      <span class="label">Shuffle Options <i class="fas fa-info-circle info-icon"></i></span>
      <span class="value">
        <span class="status-indicator ${settings.canShuffleOptions ? 'on' : 'off'}">
          ${settings.canShuffleOptions ? 'ON' : 'OFF'}
        </span>
      </span>
      <div class="tooltip">When enabled, answer options within each question will be randomized for each student, providing an additional layer of exam security.</div>
    </div>
    <div class="info-row has-tooltip">
      <span class="label">Without Registration <i class="fas fa-info-circle info-icon"></i></span>
      <span class="value">
        <span class="status-indicator ${settings.allowStudentsWithoutRegistration ? 'on' : 'off'}">
          ${settings.allowStudentsWithoutRegistration ? 'ON' : 'OFF'}
        </span>
      </span>
      <div class="tooltip">When this setting is turned on, students are allowed to take the exam without creating or registering an account. Useful for quick testing or guest access scenarios.</div>
    </div>
    <div class="info-row has-tooltip">
      <span class="label">Send Email With Password <i class="fas fa-info-circle info-icon"></i></span>
      <span class="value">
        <span class="status-indicator ${settings.canSendEmailWithPassword ? 'on' : 'off'}">
          ${settings.canSendEmailWithPassword ? 'ON' : 'OFF'}
        </span>
      </span>
      <div class="tooltip">When turned on, students will automatically receive an email with their login credentials. If turned off, the credentials must be shared with students manually.</div>
    </div>
  `;
  
  $("#session-info").html(sessionInfoHtml);
}

function renderQuestionsStatisticsSimplified() {
  const uniqueQuestions = getUniqueQuestions();
  
  if (uniqueQuestions.length === 0) {
    $("#questions-statistics").html(`
      <div class="info-row"><span class="label">Questions</span><span class="value">0</span></div>
      <div class="info-row"><span class="label">Total Marks</span><span class="value">0</span></div>
      <div class="info-row"><span class="label">Evaluated</span><span class="value">0</span></div>
      <div class="info-row"><span class="label">Not Evaluated</span><span class="value">0</span></div>
    `);
    return;
  }

  // Calculate detailed statistics
  const totalQuestions = uniqueQuestions.length;
  const evaluatedQuestions = uniqueQuestions.filter((q) => q.shouldEvaluate !== false).length;
  const notEvaluatedQuestions = totalQuestions - evaluatedQuestions;
  const totalMarks = uniqueQuestions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);

  // Question type distribution
  const typeDistribution = {};
  uniqueQuestions.forEach((q) => {
    const type = q.type || "Unknown";
    typeDistribution[type] = (typeDistribution[type] || 0) + 1;
  });

  let statisticsHtml = `
    <div class="info-row">
      <span class="label">Questions</span>
      <span class="value">${totalQuestions}</span>
    </div>
    <div class="info-row">
      <span class="label">Total Marks</span>
      <span class="value">${totalMarks}</span>
    </div>
    <div class="info-row">
      <span class="label">Evaluated</span>
      <span class="value">${evaluatedQuestions}</span>
    </div>
    <div class="info-row">
      <span class="label">Not Evaluated</span>
      <span class="value">${notEvaluatedQuestions}</span>
    </div>
  `;

  // Add question type distribution
  if (Object.keys(typeDistribution).length > 0) {
    statisticsHtml += `
      <div class="info-row question-types-row">
        <span class="label">Question Types</span>
        <div class="question-types">`;
    
    Object.entries(typeDistribution).forEach(([type, count]) => {
      // Show question type directly as short code
      const shortType = getShortQuestionType(type);
      const typeName = type.replace(/\s+/g, '').toLowerCase();
      statisticsHtml += `
        <div class="type-badge ${typeName}">
          <div class="type-code">${shortType}</div>
          <div class="type-count">${count}</div>
        </div>`;
    });
    
    statisticsHtml += `
        </div>
      </div>`;
  }

  $("#questions-statistics").html(statisticsHtml);
}

function renderAttendeesStatisticsSimplified() {
  if (attendeesData.length === 0) {
    $("#attendees-statistics").html('<div class="info-row"><span class="label">Attendees</span><span class="value">0</span></div>');
    return;
  }
console.log("Rendering attendees statistics with data:", attendeesData);
  // Calculate statistics
  const totalAttendees = attendeesData.length;
  const registeredAttendees = attendeesData.filter((a) => a.registrationStatus === "REGISTERED" || a.status === "completed").length;
  const approvedAttendees = attendeesData.filter((a) => a.registrationStatus === "APPROVED").length;
  const pendingAttendees = attendeesData.filter((a) => a.registrationStatus === "NOT_REGISTERED" || !a.registrationStatus).length;

  const statisticsHtml = `
    <div class="info-row">
      <span class="label">Total</span>
      <span class="value">${totalAttendees}</span>
    </div>
    <div class="info-row">
      <span class="label">Registered</span>
      <span class="value">${registeredAttendees}</span>
    </div>
    <div class="info-row">
      <span class="label">Approved</span>
      <span class="value">${approvedAttendees}</span>
    </div>
    <div class="info-row">
      <span class="label">Pending</span>
      <span class="value">${pendingAttendees}</span>
    </div>
    <div class="info-row">
      <span class="label">Registration Rate</span>
      <span class="value">
        <span class="percentage-badge">${Math.round((registeredAttendees / totalAttendees) * 100)}%</span>
      </span>
    </div>
  `;

  $("#attendees-statistics").html(statisticsHtml);
}

function renderEnabledFeaturesSimplified() {
  if (!examData.enabledFeatures || examData.enabledFeatures.length === 0) {
    $("#enabled-features").html('<div class="info-row"><span class="label">Features</span><span class="value">None enabled</span></div>');
    return;
  }

  let featuresHtml = '';
  const features = examData.enabledFeatures
      // console.log("Feature:", features);
  features.forEach((feature) => {

    const featureInfo = getFeatureInfo(feature);
    const tooltip = getFeatureTooltip(feature);
    featuresHtml += `
      <div class="info-row has-tooltip">
        <span class="label">${featureInfo.label} <i class="fas fa-info-circle info-icon"></i></span>
        <span class="value">
          <span class="status-indicator on">ON</span>
        </span>
        <div class="tooltip">${tooltip}</div>
      </div>
    `;
  });

  $("#enabled-features").html(featuresHtml);
}

function getFeatureTooltip(feature) {
  const tooltipMap = {
    screenRecording: "Enables screen capture during the exam to monitor what the student is doing — useful for detecting suspicious activity like browsing or copying.",
    webCamRecording: "Turns on the candidate's webcam to record them while taking the exam, helping confirm identity and detect impersonation.",
    audioRecording: "Captures background audio through the candidate's microphone during the exam. This can help detect if someone nearby is coaching or reading out answers.",
    canSendEmailWithPassword: "When turned on, students will automatically receive an email with their login credentials. If turned off, the credentials must be shared with students manually.",
    isVoiceAlert: "When enabled, the system will use text-to-speech (TTS) to audibly announce important exam instructions at the beginning and notify students when only 5 minutes are left, helping them manage time effectively.",
    canShowCalculator: "When enabled, students will have access to an on-screen scientific calculator during the exam. This is especially useful for solving complex numerical or mathematical questions.",
    canPublishReport: "If enabled, once the exam is completed and the result is ready, the student will be able to see their report in the system after they receive an official invitation. If disabled, results won't be visible until manually shared.",
    withoutRegistration: "When this setting is turned on, students are allowed to take the exam without creating or registering an account. Useful for quick testing or guest access scenarios."
  };

  return tooltipMap[feature] || "This feature enhances the exam experience and security.";
}

// New function to redirect to specific steps in create question page
function redirectToEditStep(step) {
  // Get exam ID from URL parameters if available
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get('examId');
  
  if (examId) {
    window.location.href = `create.html?id=${examId}&stepper=${step}`;
  } else {
    // Fallback: redirect to create page with step
    window.location.href = `create.html?stepper=${step}`;
  }
}

// Function to redirect to edit exam page (step 1)
function redirectToEditExam() {
  // Get exam ID from URL parameters if available
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get('examId');
  
  if (examId) {
    window.location.href = `create.html?id=${examId}`;
  } else {
    // Fallback: redirect to create page
    window.location.href = `create.html`;
  }
}

// Function to get short question type codes
function getShortQuestionType(type) {
  const shortTypeMap = {
    // Common mappings
    'MCQ': 'MCQ',
    'multiple_choice': 'MCQ',
    'MULTIPLE_CHOICE': 'MCQ',
    'single_choice': 'MCQ',
    
    'TF': 'TF',
    'true_false': 'TF',
    'TRUE_FALSE': 'TF',
    
    'SAQ': 'SAQ',
    'saq': 'SAQ',
    'short_answer': 'SAQ',
    'SHORT_ANSWER': 'SAQ',
    
    'FTB': 'FTB',
    'ftb': 'FTB',
    'fill_blank': 'FTB',
    'FILL_BLANK': 'FTB',
    'fillup': 'FTB',
    'FILLUP': 'FTB',
    
    'MTF': 'MTF',
    'mtf': 'MTF',
    'matching': 'MTF',
    'MATCHING': 'MTF',
    'match': 'MTF',
    'MATCH': 'MTF',
    
    'PRQ': 'PRQ',
    'prq': 'PRQ',
    'coding': 'PRQ',
    'CODING': 'PRQ',
    
    'ESSAY': 'ESSAY',
    'essay': 'ESSAY',
    
    'MSQ': 'MSQ',
    'msq': 'MSQ',
    'multiple_select': 'MSQ',
    'MULTIPLE_SELECT': 'MSQ',
    
    // Direct mappings for codes that should stay as is
    'IR': 'IR',
    'UD': 'UD',
    'OR': 'OR',
    'TAB': 'TAB',
    'DRAG_DROP': 'DRAG_DROP',
    'HOTSPOT': 'HOTSPOT',
    'ORDERING': 'ORDERING'
  };

  return shortTypeMap[type] || type.toUpperCase();
}


// Helper Functions
function getUniqueQuestions() {
  if (!examData.questions) return [];

  const uniqueQuestions = [];
  const seenQuestions = new Set();

  examData.questions.forEach((question) => {
    const questionKey = question.question + (question.type || "");
    if (!seenQuestions.has(questionKey)) {
      seenQuestions.add(questionKey);
      uniqueQuestions.push(question);
    }
  });

  return uniqueQuestions;
}

  function formatDateTime(input) {
  if (!input) return "Not specified";

  try {
    // Case 1: If input is object {date, hour, minute, format}
    if (typeof input === "object" && input.date) {
      const date = new Date(input.date);
      const hours = input.hour || 0;
      const minutes = input.minute || 0;
      const format = input.format || "AM";

      const formattedDate = date.toLocaleDateString();
      const time = `${hours}:${minutes.toString().padStart(2, "0")} ${format}`;
      return `${formattedDate} at ${time}`;
    }

    // Case 2: If input is string (ISO date or timestamp)
    if (typeof input === "string" || input instanceof Date) {
      const date = new Date(input);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleString(); // e.g. "8/22/2025, 2:31:51 PM"
    }

    return "Invalid input";
  } catch (error) {
    return "Invalid date";
  }
}
function calculateDuration(start, end) {
  if (!start || !end) return "Not specified";

  try {
    const startDate = new Date(start.date);
    startDate.setHours(start.hour || 0, start.minute || 0);

    const endDate = new Date(end.date);
    endDate.setHours(end.hour || 0, end.minute || 0);

    const diffMs = endDate - startDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins} minutes`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours} hour${hours > 1 ? "s" : ""} ${
        mins > 0 ? `${mins} minutes` : ""
      }`;
    }
  } catch (error) {
    return "Unable to calculate";
  }
}
function getExamStatusClass(status) {
  switch (status?.toLowerCase()) {
    case "active":
    case "ongoing":
      return "status-active";
    case "ended":
    case "completed":
      return "status-ended";
    default:
      return "status-inactive";
  }
}
function formatExamStatus(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function formatDate(dateString) {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return dateString;
  }
}
function getFeatureInfo(feature) {

  const featureMap = {
    screenRecording: { icon: "bx bx-video", label: "Screen Recording" },
    webCamRecording: { icon: "bx bx-camera", label: "Webcam Recording" },
    audioRecording: { icon: "bx bx-microphone", label: "Audio Recording" },
    canSendEmailWithPassword: {
      icon: "bx bx-envelope",
      label: "Email with Password",
    },
    isVoiceAlert: { icon: "bx bx-volume-full", label: "Voice Alerts" },
    canShowCalculator: { icon: "bx bx-calculator", label: "Calculator" },
    canPublishReport: { icon: "bx bx-file-blank", label: "Publish Reports" },
  };

  return featureMap[feature] || { icon: "bx bx-check", label: feature };
}


// Error handling
function showError(message) {
  $("#main-content")
    .html(
      `
        <div class="alert alert-danger" role="alert">
            <i class="bx bx-error"></i> ${message}
        </div>
    `
    )
    .show();

  if (window.showToast) {
    window.showToast(message, "error");
  } else {
    console.error(message);
  }
}


