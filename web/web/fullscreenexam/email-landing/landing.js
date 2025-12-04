let examsData = []; // Global variable to store exams data
let isEnglish;
// let systemCompatibility = false;

$(document).ready(function () {

  checkBrowserCompatibility()

  if(!localStorage.getItem("lang"))localStorage.setItem("lang","en")
  const isEnglish = localStorage.getItem("lang") === "en"
  $("#login-modal").prop('title',isEnglish?'Login Exam':"امتحان تسجيل الدخول")
  $("#sla-id").prop("placeholder",isEnglish?'Please Enter Your Passcode':"الرجاء إدخال رمز المرور الخاص بك")
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email");

  const nid = urlParams.get("nid");
  if (!email && !nid){ 
    $(".toggle-container").css({ display: "none" });
    $(".search-container").css({ display: "none" });
  }
  if (nid) {
    $("#national-id").val(nid);
  }
  if (email) $("#email").val(email);
  console.log("nid", nid, "national-id", $("#national-id").length);
  if (email) {
    $("#login_email_input").val(email);
    fetchExamList(email);
  } else {
    $("#email-modal").show();
    //  alert('Email ID is missing in the query parameters.');
  }
  // setTimeout(function () {
  //   $(".reload_status").show();
  // }, 4000);

  $(document).on("click", "#lang-toggle", function () {
    $(".email_form_input").prop(
      "placeholder",
      $("#lang-toggle").prop("checked") ? "معرف البريد الإلكتروني" : "Email ID"
    );
    $("#login-modal").prop("title", "Login Exam / امتحان تسجيل الدخول");
    setTimeout(function () {
      renderLanguage();
      if (examsData.length > 0) {
        renderExamCards(examsData);
      }
    }, 100);
  });
  renderLanguage();

  $("#email-form").submit(function (event) {
    event.preventDefault();

    let baseUrl = window.location.origin;
    const urlParams = new URLSearchParams(window.location.search);
    let uid = $("#email-check").val().trim();
    if ($("#email-check").val() == "" || $("#email-check").val() == " ") {
      alert("pls enter valid National ID");
      return false;
    }

    $("#email-button").text("loading");
    makeApiCall({
      url: `${STUDENT_END_POINT}/info?id=${uid}`,
      method: "GET",
      isApiKey: true,
      successCallback: function (response) {
        $("#email-button").text("verify");
        if (!response.data.mail) {
          alert("invalid email");
          return false;
        }
        if (uid.trim() == response.data.id2.trim()) {
          let uid = response.data.mail;
          console.log("get data from back", response.data.mail);

          if (window.location.origin.indexOf("localhost") != -1) {
            baseUrl = baseUrl + "/full-screen-exam/fullscreenexam";
          }

          const examUrl = `${baseUrl}/fullscreenexam/email-landing/?email=${uid}&nid=${response.data.id2}`;
          window.location.href = examUrl;
        } else {
          alert("No Exams Found for National id" + uid);
        }
      },
      errorCallback: function (error) {
        $("#email-button").text("verify");

        alert("No Exams Planned or not a valid id", uid);
        console.error("Error:", error);
        // Handle the error
      },
    });
  });

  $("#national_id").text(`${isEnglish ? national_ID : national_ID_Arabic}`);
  $("#national_id_label").text(
    `${isEnglish ? national_ID : national_ID_Arabic}`
  );
  $("#sla_id_label").text(`${isEnglish ? sla_ID : sla_ID_Arabic}`);
  $("#national_id_label1").text(
    `${isEnglish ? national_ID : national_ID_Arabic}`
  );
  $("#sla_id_label1").text(`${isEnglish ? sla_ID : sla_ID_Arabic}`);

  $("#login-form").submit(function (event) {
    event.preventDefault();

    const slaId = $("#sla-id").val();
    const nationalId = $("#sla-id").val();
    const examId = $("#login-button").data("exam-id");
    const attenderId = $("#login-button").data("attender-id");

    validateAndStartExam(slaId, nationalId, examId, attenderId);
  });
});

window.onload = function() {
  checkBrowserCompatibility();
}

function fetchExamList(email) {
  makeApiCall({
    url: `${STUDENT_END_POINT}/exam/list?mail=${encodeURIComponent(email)}`,
    method: "GET",
    isApiKey: true,
    successCallback: function (response) {
      if (response.message === "Retrieved successfully") {
        examsData = response.data.data; // Store data in global variable
        renderExamCards(response.data.data);

        const urlParams = new URLSearchParams(window.location.search);
        const examId = urlParams.get("entranceExamId");

        if (examId) {
          const exam = examsData.find((exam) => exam._id === examId);

          if (exam && exam.isReportPublished) {
            showReportPopup(examId, exam.name);
          }
        }
        renderLanguage();
      }
    },
    errorCallback: function (error) {
      console.error("Error fetching exam list:", error);
    },
  });
}

function renderExamCards(exams) {
  const examCardsContainer = $("#exam-cards-container");
  examCardsContainer.empty();

  // Check if we need to show the refresh notification
  let showRefreshNotification = false;
  let hasActiveExams = false;

  // Sort exams with ON_GOING status first
  exams.sort((a, b) => {
    if (a.examStatus === "ON_GOING" && b.examStatus !== "ON_GOING") {
      return -1;
    } else if (a.examStatus !== "ON_GOING" && b.examStatus === "ON_GOING") {
      return 1;
    } else {
      return 0;
    }
  });

  // First check if any exams need the notification
  exams.forEach((exam) => {
    if (exam.examStatus === "ON_GOING" || exam.examStatus === "NOT_STARTED") {
      hasActiveExams = true;

      const isExamOngoing = exam.examStatus === "ON_GOING";
      const isStudentRegistered =
        exam.attender && exam.attender.registrationStatus === APPROVED;
      const isStudentExamEnded =
        exam.attender && exam.attender.studentExamStatus === "ENDED";
      const isTimeOver = exam?.isTimeOver;
      const isallowStudentsWithoutRegistration =
        exam?.settings?.allowStudentsWithoutRegistration;
      const studentStatusLabel = isStudentExamEnded
        ? "Exam Completed"
        : exam.attender.studentExamStatus;
      const canStartAnytime =
        exam?.attender?.canStartExamAfterExamEndTime?.value;

      const isButtonDisabled = canStartAnytime
        ? isStudentExamEnded
        : (!isExamOngoing &&
            !(
              studentStatusLabel === "ON_GOING" &&
              exam.examStatus === "ENDED" &&
              !isTimeOver
            )) ||
          isStudentExamEnded ||
          (!isStudentRegistered && !isallowStudentsWithoutRegistration);

      if (
        (isExamOngoing && isButtonDisabled) ||
        (exam.examStatus === "NOT_STARTED" && isStudentRegistered)
      ) {
        showRefreshNotification = true;
      }
    }
  });

  // If we need to show the refresh notification, add it at the top
  if (showRefreshNotification && hasActiveExams) {
    const refreshNotification = `
      <div class="refresh-notification">
        <div class="refresh-notification-icon">
          <i class="fas fa-info-circle"></i>
        </div>
        <div class="refresh-notification-content">
          <p class="refresh-notification-title">Exam Status Update Required</p>
          <p class="refresh-notification-text login_exam_card_refresh_notice">The system has detected that some exam statuses may need to be updated. Please refresh the page to ensure you have the latest exam information.</p>
        </div>
        <button class="refresh-notification-button" onclick="location.reload()">
          <i class="fas fa-sync-alt"></i> Refresh Now
        </button>
      </div>`;
    examCardsContainer.append(refreshNotification);
  }

  exams.forEach((exam) => {
    const exitCount =
      exam.attender && exam.attender.fullScreen
        ? exam.attender.fullScreen.exitCount
        : 0;
    const showExitCount = exam.examStatus !== "NOT_STARTED" && exitCount > 0;
    const isExamOngoing = exam.examStatus === "ON_GOING";
    const isTimeOver = exam?.isTimeOver;
    const isallowStudentsWithoutRegistration =
      exam?.settings?.allowStudentsWithoutRegistration;
    const isStudentExamEnded =
      exam.attender && exam.attender.studentExamStatus === "ENDED";
    const buttonLabel = isStudentExamEnded ? "Exam Completed" : "Start Exam";
    const studentStatusLabel = isStudentExamEnded
      ? "Exam Completed"
      : exam.attender.studentExamStatus;
    const isStudentRegistered =
      exam.attender && exam.attender.registrationStatus === APPROVED;

    const isRegistered =
      exam.attender && exam.attender.registrationStatus === "REGISTERED";

    const masterAttenderId = exam.attender
      ? exam.attender?.masterAttenderId
      : "";

    const canStartAnytime = exam?.attender?.canStartExamAfterExamEndTime?.value;

    const isButtonDisabled = canStartAnytime
      ? isStudentExamEnded
      : (!isExamOngoing &&
          !(
            studentStatusLabel === "ON_GOING" &&
            exam.examStatus === "ENDED" &&
            !isTimeOver
          )) ||
        isStudentExamEnded ||
        (!isStudentRegistered && !isallowStudentsWithoutRegistration);

    const timeZone = exam?.settings?.timeZone;

    console.log(
      "canStartAnytime",
      canStartAnytime,
      "isButtonDisabled",
      isButtonDisabled
    );

    const examCard = `
            <div class="exam-card">
                <h2>${exam.name}</h2>
                <p><span class="login_exam_card_start_time">Start Time:</span> ${formatDateTime(
                  exam.session.start
                )}</p>
                <p><span class="login_exam_card_end_time">End Time:</span> ${formatDateTime(
                  exam.session.end
                )}</p>
                <p class="exam-status"><span class="login_exam_card_exam_status">Exam Status:</span> ${getStatusHTML(
                  exam.examStatus
                )}</p>
                <p class="exam-status"><span class="login_exam_card_student_status">Student Status:</span> ${getStudentStatusHTML(
                  studentStatusLabel,
                  exam.attender ? exam.attender.registrationStatus : null
                )}</p>
                <p class="exam-status"><span class="login_exam_card_time_zone">Time Zone:</span> ${getTimezoneDisplay(
                  timeZone
                )}</p>
                
                ${
                  showExitCount
                    ? `<p ><span class="login_exam_card_exit_count">Exit Count:</span> ${exitCount}</p>`
                    : ""
                }

                <a href="#" class="toggle-history-link login_exam_card_show_history" data-exam-id="${
                  exam._id
                }" data-attender-id="${
      exam.attender ? exam.attender._id : ""
    }" data-master-attender-id="${masterAttenderId}">Show Exit History</a>
                
                <div class="button-wrap" style="justify-content: ${
                  (exam?.enabledFeatures?.includes("screenRecording") ||
                    exam?.enabledFeatures?.includes("webCamRecording")) &&
                  !isButtonDisabled
                    ? "space-between"
                    : "flex-end"
                }">
                  ${
                    (exam?.enabledFeatures?.includes("screenRecording") ||
                      exam?.enabledFeatures?.includes("webCamRecording")) &&
                    !isButtonDisabled
                      ? `<button class="test-button" data-exam-id="${
                          exam._id
                        }" data-attender-id="${
                          exam.attender ? exam.attender._id : ""
                        }"><i class="fas fa-desktop"></i> <i class="fas fa-video"></i><span class="test-button-text">Test System Compatibility</span> </button>`
                      : ""
                  }
                    ${
                      !isStudentRegistered &&
                      !(isExamOngoing && isTimeOver && !isStudentExamEnded) &&
                      !isallowStudentsWithoutRegistration
                        ? `<div class="registration-warning">
                            <span><i class="fas fa-exclamation-triangle"></i> <span class="login_exam_card_register_validation">Please register for this exam to participate.</span></span>
                            <button class="register-now-btn"  data-regis="${isRegistered}" data-attender-id="${masterAttenderId}">
                                <i class="fas fa-user-plus"></i> <span class="${
                                  isRegistered
                                    ? "login_exam_card_waiting_approve"
                                    : "login_exam_card_register_button"
                                }">Register Now</span>
                            </button>
                            ${
                              exam.examStatus == "NOT_STARTED"
                                ? `<!-- Individual reload button removed in favor of centralized refresh notification
                                <button class="reload_status login_exam_card_reload_button">Reload Exam Status</button>
                                -->`
                                : ""
                            }
                          </div>`
                        : ""
                    }
                    ${
                      exam.examStatus == "NOT_STARTED" &&
                      isStudentRegistered &&
                      !(isExamOngoing && isTimeOver && !isStudentExamEnded)
                        ? `<span class="reload_status_span"><span class="login_exam_card_will_start">Exam will start on</span> - ${formatDateTime(
                            exam.session.start
                          )}</span>`
                        : ""
                    }

                    ${
                      isExamOngoing && isTimeOver && !isStudentExamEnded
                        ? `<div class="time-over-message"> <i class="fas fa-info-circle"></i> <span class="login_exam_card_time_over_message">${
                            isEnglish
                              ? "Exam Time Over - Cannot Start Now"
                              : "انتهى وقت الامتحان - لا يمكن البدء الآن"
                          }</span></div>`
                        :
                          exam?.enabledFeatures?.includes("canPublishReport") &&
                          exam?.isReportPublished
                        ? `<button class=" report-btn" 
                              data-exam-id="${exam._id}"
                              data-exam-name="${encodeURIComponent(exam.name)}"
                              data-user-email="${encodeURIComponent(
                                getEmailFromParams()
                              )}">
                              <i class="fas fa-chart-line"></i> <span class="login_exam_card_report_button">View Report</span>
                          </button>`
                        : !isStudentRegistered &&
                          !isallowStudentsWithoutRegistration
                        ? ""
                        : `<button class="startexam-btn login_exam_card_save_button ${
                            isButtonDisabled ? "disabled" : ""
                          }" 
                                data-exam-id="${exam._id}"
                                data-attender-id="${
                                  exam.attender ? exam.attender._id : ""
                                }"
                                data-master-attender-id="${masterAttenderId}"
                                ${isButtonDisabled ? "disabled" : ""}>
                                ${buttonLabel}
                              </button>`
                    }
                    ${
                      exam.examStatus == "NOT_STARTED" &&
                      isStudentRegistered &&
                      !(isExamOngoing && isTimeOver && !isStudentExamEnded)
                        ? `<!-- Individual reload button removed in favor of centralized refresh notification
                        <button class="reload_status login_exam_card_reload_status">Reload Exam Status</button>
                        -->`
                        : ""
                    }
                </div>
            </div>
        `;
    examCardsContainer.append(examCard);
  });

  // Only show "No Active Exams Found" if the search box is empty
  if (exams.length == 0 && !$("#exam-search").val().trim()) {
    examCardsContainer.append(
      "<h4 class='login_exam_card_active_exams_found'>No Active Exams Found</h4>"
    );
  }

  // Event listener for toggle history link
  $(document).on("click", ".toggle-history-link", function (event) {
    event.preventDefault();
    const examId = $(this).data("exam-id");
    const attenderId = $(this).data("attender-id");
    showHistoryModal(examId, attenderId);
  });

  // Event listener for Start Exam button
  $(document).on(
    "click",
    ".exam-card .startexam-btn:not(.disabled)",
    function () {
      const examId = $(this).data("exam-id");
      const attenderId = $(this).data("attender-id");
      showLoginModal(examId, attenderId);
    }
  );

  // Event listener for Register Now button
  $(document).on("click", ".register-now-btn", function () {
    if (!$(this).data("regis")) {
      const masterAttenderId = $(this).data("attender-id");
      const registrationUrl = `${window.location.origin}/fullscreenexam/student-registration/?attenderId=${masterAttenderId}`;
      window.location.href = registrationUrl;
    }
  });

  // Replace vanilla JS click handler with jQuery event delegation
  $(document)
    .off("click", ".report-btn")
    .on("click", ".report-btn", function () {
      const examId = $(this).data("exam-id");
      const examName = decodeURIComponent($(this).data("exam-name"));
      showReportPopup(examId, examName);
    });

  $(document).on("click", ".test-button", function () {
    const baseUrl = window.location.origin;
    const systemCompatibilityUrl = new URL(
      `${baseUrl}/fullscreenexam/test/system-compatibility.html`
    );
    window.location.href = systemCompatibilityUrl.toString();
  });

  // Add click handler for digital ink view button
  $(document).on("click", ".btn-view-digital-ink", function () {
    const questionNumber = $(this).data("question-number");
    const digitalInkData = $(this).data("digital-ink");
    showDigitalInkModal(questionNumber, digitalInkData);
  });
}

function formatDateTime(dateTime) {
  const date = new Date(dateTime.date);
  const hours = dateTime.hour.toString().padStart(2, "0");
  const minutes = dateTime.minute.toString().padStart(2, "0");
  const period = dateTime.format;

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-based
  const year = date.getFullYear();

  return `${day}-${month}-${year} <span class="timeformat">${hours}:${minutes} ${period}</span`;
}

function showHistoryModal(examId, attenderId) {
  const exam = examsData.find((exam) => exam._id === examId); // Use global variable
  if (
    !exam ||
    !exam.attender ||
    !exam.attender.fullScreen ||
    !exam.attender.fullScreen.history
  ) {
    $("#history-modal-content").html(
      `<p class='no_exit_history'>${
        isEnglish ? "No exit history available" : "لا يوجد سجل خروج متاح"
      }</p>`
    );
  } else {
    const { exitCount, history } = exam.attender.fullScreen;
    const historyEntries = history
      .map((entry) => {
        const date = new Date(entry.createdAt);
        const formattedDate = date.toLocaleString();
        return `<li>${entry.reason} - ${formattedDate}</li>`;
      })
      .join("");

    const modalContent = `
            <b><p><span class="exited_exam">You have exited the exam<span> <span style= "color: red"> ${exam.attender.fullScreen.exitCount}</span> <span class="times">times. To ensure a smooth completion, please remain focused on the exam window and avoid any interruptions.<span></p></b>
            <p><span class="exit_count">Exit Count:</span> <span style= "color: red"> ${exam.attender.fullScreen.exitCount}</span></p>
            <p><b class='exit_history'>Exit History:</b></p>
            <ul>
                ${historyEntries}
            </ul>
        `;
    $("#history-modal-content").html(modalContent);
    const selectedLanguage = localStorage.getItem("lang") || "en";
    $(".no_exit_history").text(change[selectedLanguage]["no_exit_history"]);
    $(".exited_exam").text(change[selectedLanguage]["exited_exam"]);
    $(".times").text(change[selectedLanguage]["times"]);
    $(".exit_count").text(change[selectedLanguage]["exit_count"]);
    $(".exit_history").text(change[selectedLanguage]["exit_history"]);
  }
  $("#history-modal").dialog({
    modal: true,
    width: 600,
    create: function (event, ui) {
      var closeButton = $(
        '<button type="button" class="ui-button ui-corner-all ui-widget ui-dialog-titlebar-close" title="Close">X</button>'
      );
      closeButton.on("click", function () {
        $("#history-modal").dialog("close");
      });
      $(this)
        .closest(".ui-dialog")
        .find(".ui-dialog-titlebar")
        .append(closeButton);
    },
  });
}
function showLoginModal(examId, attenderId) {
  $("#login-button").data("exam-id", examId).data("attender-id", attenderId);
  $("#login-modal").dialog({
    modal: true,
    open: function () {
      $(".ui-widget-overlay").css({
        "background-color": "rgba(0, 0, 0, 0.5)", // Custom backdrop color
        opacity: "0.8", // Custom opacity
      });
    },
    create: function (event, ui) {
      var closeButton = $(
        '<button type="button" class="ui-button ui-corner-all ui-widget ui-dialog-titlebar-close" title="Close">X</button>'
      );
      closeButton.on("click", function () {
        $("#login-modal").dialog("close");
      });
      $(this)
        .closest(".ui-dialog")
        .find(".ui-dialog-titlebar")
        .append(closeButton);
    },
  });
}

function validateAndStartExam(slaId, nationalId, examId, attenderId) {
  // Trim the input strings to remove spaces from both ends
  const trimmedSlaId = slaId.trim();
  const trimmedNationalId = nationalId.trim();
  const trimmedExamId = examId.trim();
  const trimmedAttenderId = attenderId.trim();

  const exam = examsData.find((exam) => exam._id == trimmedExamId); // Use global variable
  if (
    exam &&
    exam.attender &&
    exam.attender.id.trim() == trimmedSlaId &&
    exam.attender.id2.trim() == trimmedNationalId
  ) {
    startExam(
      trimmedExamId,
      trimmedAttenderId,
      exam?.enabledFeatures,
      exam.attender._id
    );
  } else {
    $("#login-error").show();
    setTimeout(function () {
      $("#login-error").hide();
    }, 4000);
  }
}

function startExam(examId, attenderId, enabledFeatures, attender_id) {
  const baseUrl = window.location.origin;
  const urlParams = new URLSearchParams(window.location.search);
  const cid = urlParams.get("cid");

  // Create base URL with essential parameters
  const examUrl = new URL(`${baseUrl}/fullscreenexam/exam-portal/`);
  examUrl.searchParams.set("examid", examId);
  examUrl.searchParams.set("uid", attenderId);
  examUrl.searchParams.set("attender_id", attender_id);
  examUrl.searchParams.set("shuffleqtn", "true");
  examUrl.searchParams.set("shuffleoptions", "true");

  if (cid) {
    examUrl.searchParams.set("cid", cid);
  }

  if (Array.isArray(enabledFeatures)) {
    enabledFeatures.forEach((feature) => {
      examUrl.searchParams.set(feature, "true");
    });
  }

  window.location.href = examUrl.toString();
}

// Add new popup function
function showReportPopup(examId, examName) {
  const apiUrl = `${REPORT_END_POINT}?entranceExamId=${examId}&canPaginate=false&mail=${encodeURIComponent(
    getEmailFromParams()
  )}`;

  // Hide exam list and show report container
  $("#exam-cards-container").fadeOut(300, function () {
    $(".container header").fadeOut(300);
    $("#report-container").remove();
    $(".search-container").hide();

    // Create report container
    const reportContainer = $(
      '<div id="report-container" style="opacity:0;"></div>'
    );
    $(".container").append(reportContainer);
  
    reportContainer.animate({ opacity: 1 }, 400);

    // Add back button with enhanced icon
    const backButton = $(
      `<div class="back-button"><i class="fas fa-arrow-left"></i> <span class="back_to_exam_list">Back to Exam List</span></div>`
    );
    reportContainer.append(backButton);

    // Add loading animation with message
    const loading = $(
      `<div class="report-loading">
        <div class="loading-message">Loading your exam report...</div>
      </div>`
    );
    reportContainer.append(loading);

    // Fetch report data with timeout to show error if it takes too long
    let isLoaded = false;
    const loadTimeout = setTimeout(function () {
      if (!isLoaded) {
        loading.html(
          `<div class="loading-message">Taking longer than expected. Please wait...</div>`
        );
      }
    }, 5000);

    // Fetch report data
    makeApiCall({
      url: apiUrl,
      method: "GET",
      isApiKey: true,
      successCallback: function (response) {
        isLoaded = true;
        clearTimeout(loadTimeout);
        loading.fadeOut(300, function () {
          $(this).remove();
          if (response.data.data.length > 0) {
            const reportContent = $(renderReportData(response?.data, examName));
            reportContent.hide();
            reportContainer.append(reportContent);
            reportContent.fadeIn(500);
            renderLanguage();
            // Add event handlers for Show More/Less buttons
            setupSaqExpandButtons();
          } else {
            reportContainer.append(
              '<div class="error">No report data available for this exam.</div>'
            );
          }
        });
      },
      errorCallback: function (jqXHR) {
        isLoaded = true;
        clearTimeout(loadTimeout);
        loading.fadeOut(300, function () {
          $(this).remove();
          reportContainer.append(
            `<div class="error">
              <i class="fas fa-exclamation-circle"></i> 
              Error loading report: ${jqXHR.status || "Unknown error"}
              <p>Please try again later or contact support if the problem persists.</p>
            </div>`
          );
        });
      },
    });

    // Back button handler with smooth transition
    backButton.on("click", () => {
      $("#report-container").fadeOut(300, function () {
        $(this).remove();
        $("#exam-cards-container").fadeIn(300);
        $(".container header").fadeIn(300);
        $(".search-container").show();
      });
    });
  });
}

// Function to set up event handlers for Show More/Less buttons
function setupSaqExpandButtons() {
  // Show More button click handler
  $(document).on("click", ".show-more-btn", function () {
    const saqResponse = $(this).closest(".saq-response");
    saqResponse.find(".truncated-answer").hide();
    saqResponse.find(".full-answer").fadeIn(300);
    $(this).hide();
    saqResponse.find(".show-less-btn").show();
  });

  // Show Less button click handler
  $(document).on("click", ".show-less-btn", function () {
    const saqResponse = $(this).closest(".saq-response");
    saqResponse.find(".full-answer").hide();
    saqResponse.find(".truncated-answer").fadeIn(300);
    $(this).hide();
    saqResponse.find(".show-more-btn").show();
  });
}

// Add render function for report data
function renderReportData(data, examName) {
  const exam = data.data[0];
  const totalMarks = data.totalMarks;
  const cutoff = data?.settings?.cutoff;
  const totalScore = exam.totalAchievedMarks;
  
  // Calculate both percentages
  const overallPercentage = ((totalScore / totalMarks) * 100).toFixed(1);
  
  // Calculate success rate based on attempted questions
  const attemptedPercentage = exam.attended > 0 ? ((exam.correct / exam.attended) * 100).toFixed(1) : "0.0";
  
  // Use overall percentage for pass/fail determination
  const percentage = overallPercentage;

  // Determine pass/fail status based on given conditions
  let passOrFail = "Fail";
  let cutoffPercentage = 50; // Default cutoff percentage
  let statusChangeInfo = ""; // For storing status change information

  if (exam.passStatus && exam.passStatus.length > 0) {
    // If passStatus is available, take the last array item
    const lastStatus = exam.passStatus[exam.passStatus.length - 1];
    passOrFail = lastStatus.newResult === "pass" ? "Pass" : "Fail";

    // Add information about who changed the result and why
    const changedBy = lastStatus.changedBy.mail || "Unknown";
    const reason = lastStatus.reason || "No reason provided";
    const changedAt =
      new Date(lastStatus.changedAt).toLocaleString() || "Unknown date";

    statusChangeInfo = `
      <div class="status-change-info">
        <p><strong>Result modified by:</strong> ${changedBy}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Changed on:</strong> ${changedAt}</p>
        <p><strong>Original Result:</strong> ${
          lastStatus.oldResult.charAt(0).toUpperCase() +
          lastStatus.oldResult.slice(1)
        }</p>
      </div>
    `;
  } else {
    // If no passStatus, check for cutoff in settings
    if (data.settings && cutoff) {
      cutoffPercentage = cutoff;
    }
    // Compare percentage with cutoff
    if (parseFloat(percentage) >= cutoffPercentage) {
      passOrFail = "Pass";
    }
  }

  // Determine CSS class based on pass/fail status
  const resultClass = passOrFail.toLowerCase();

  // Format percentage with visual indicator
  const percentageDisplay = `
    <div class="percentage-display">
      <div class="percentage-bar">
        <div class="percentage-fill" style="width: ${Math.min(
          overallPercentage,
          100
        )}%;"></div>
      </div>
      <div class="percentage-value">${overallPercentage}%</div>
    </div>
  `;

  // Function to handle SAQ responses with "Show More" button for long answers
  const formatSaqResponse = (studentResponse, hasDigitalInk = false) => {
    if (!studentResponse) {
      if (hasDigitalInk) {
        return "<div>This question has been answered with Digital Ink</div>";
      }
      return "<div>No answer provided</div>";
    }

    // Define the character limit for truncation
    const charLimit = 150;

    if (studentResponse.length <= charLimit) {
      // If answer is short, just display it directly
      return `
        <div class="saq-response">
          <strong>Student Answer:</strong>
          <div>${studentResponse}</div>
        </div>
      `;
    } else {
      // If answer is long, truncate it and add Show More/Show Less buttons
      const truncatedAnswer = studentResponse.substring(0, charLimit) + "...";

      return `
        <div class="saq-response">
          <strong>Student Answer:</strong>
          <div class="truncated-answer">${truncatedAnswer}</div>
          <div class="full-answer" style="display:none;">${studentResponse}</div>
          <button class="show-more-btn">Show More</button>
          <button class="show-less-btn" style="display:none;">Show Less</button>
        </div>
      `;
    }
  };

  // Function to render question details based on type
  const renderQuestionDetails = (q, index) => {
    // Check if question has digital ink data
    const hasDigitalInk = q?.studentDigitalInk && q?.studentDigitalInk?.length > 0;

    // Check if question is unattempted (similar to detailed page logic)
    const isUnattempted = (!q.studentResponse || !q.studentBlanks.length || !q.responses) && !hasDigitalInk;


    
    switch (q.question.type) {
      case "MCQ":
        return `
          ${isUnattempted ? '<div class="unattempted-notice"><i class="fas fa-minus-circle"></i> Not Attempted</div>' : ''}
          <div class="options-list">
              ${q.question.choices
                .map(
                  (choice) => `
                  <div class="option ${
                    choice.key === q.studentResponse
                      ? "student-answer"
                      : ""
                  } ${
                    q.studentResponse === choice.key
                      ? q.studentResponse ===
                        q.question.correctChoices[0]
                        ? "crtmarkKey"
                        : "markKey"
                      : ""
                  }">
                      ${choice.key})${" "} ${
                    choice.label
                  }
                  </div>
              `
                )
                .join("")}
          </div>
          <b class="correct-answer">
              Correct Answer: ${
                q.question.correctChoices?.join(
                  ", "
                ) || "Not available"
              }
          </b>
          ${hasDigitalInk ? `
            <div class="digital-ink-section">
              <button class="btn-view-digital-ink" data-question-number="${index + 1}" data-digital-ink='${JSON.stringify(q.studentDigitalInk)}'>
                <i class="fas fa-eye"></i> View Digital Ink
              </button>
            </div>
          ` : ''}
      `;
      case "TF":
        const trueFalseChoices = [
          { key: "true", label: "True" },
          { key: "false", label: "False" },
        ];
        return `
        ${isUnattempted ? '<div class="unattempted-notice"><i class="fas fa-minus-circle"></i> Not Attempted</div>' : ''}
    
        <div class="options-list">
            ${trueFalseChoices
              .map(
                (choice) => `
                <div class="option ${
                  choice.key === q.studentResponse ? "student-answer" : ""
                } ${
                  q.studentResponse === choice.key
                    ? q.studentResponse === q.question.correctChoices[0]
                      ? "crtmarkKey"
                      : "markKey"
                    : ""
                }">
                    ${" "} ${choice.label}
                </div>
            `
              )
              .join("")}
        </div>
        <b class="correct-answer">
            Correct Answer: ${
              q.question.correctChoices?.join(", ") || "Not available"
            }
        </b>
        ${hasDigitalInk ? `
          <div class="digital-ink-section">
            <button class="btn-view-digital-ink" data-question-number="${index + 1}" data-digital-ink='${JSON.stringify(q.studentDigitalInk)}'>
              <i class="fas fa-eye"></i> View Digital Ink
            </button>
          </div>
        ` : ''}
    `;
      case "FTB":
        return `
          ${isUnattempted ? '<div class="unattempted-notice"><i class="fas fa-minus-circle"></i> Not Attempted</div>' : ''}
          <div class="ftb-response">
              <strong >Student Answers:</strong>
              ${
                q.studentBlanks && q.studentBlanks.length > 0
                  ? q.studentBlanks
                      .map((studentBlank) => {
                        const correctBlank =
                          q.question.blanks?.find(
                            (b) =>
                              b.identity ===
                              studentBlank.identity
                          );
                        return `
                          <div >
                              Blank ${
                                studentBlank.identity
                              }: 
                              Your Answer: <span class="student-answer">${
                                studentBlank.answer
                              }</span>
                              (Correct Answer: <span class="correct-answer-blank">${
                                correctBlank?.values?.find(
                                  (v) => v.isCorrect
                                )?.value || ""
                              }</span>)
                          </div>
                      `;
                      })
                      .join("")
                  : hasDigitalInk ? "This question has been answered with Digital Ink" : "No blanks answered"
              }
          </div>
          ${hasDigitalInk ? `
            <div class="digital-ink-section">
              <button class="btn-view-digital-ink" data-question-number="${index + 1}" data-digital-ink='${JSON.stringify(q.studentDigitalInk)}'>
                <i class="fas fa-eye"></i> View Digital Ink
              </button>
            </div>
          ` : ''}
      `;
      case "MTF":
        return `
          ${isUnattempted ? '<div class="unattempted-notice"><i class="fas fa-minus-circle"></i> Not Attempted</div>' : ''}
          <div class="mtf-response">
              <strong >Student Answers:</strong>
              ${
                q.studentBlanks && q.studentBlanks.length > 0
                  ? q.studentBlanks
                      .map((studentBlank) => {
                        const correctBlank =
                          q.question.blanks?.find(
                            (b) =>
                              b.identity ===
                              studentBlank.identity
                          );
                        return `
                          <div >
                              Blank ${
                                studentBlank.identity
                              }: 
                              Your Answer: <span class="student-answer">${
                                studentBlank.answer
                              }</span>
                              (Correct Answer: <span class="correct-answer-blank">${
                                correctBlank?.values?.find(
                                  (v) => v.isCorrect
                                )?.value || ""
                              }</span>)
                          </div>
                      `;
                      })
                      .join("")
                  : hasDigitalInk ? "This question has been answered with Digital Ink" : "No blanks answered"
              }
          </div>
          ${hasDigitalInk ? `
            <div class="digital-ink-section">
              <button class="btn-view-digital-ink" data-question-number="${index + 1}" data-digital-ink='${JSON.stringify(q.studentDigitalInk)}'>
                <i class="fas fa-eye"></i> View Digital Ink
              </button>
            </div>
          ` : ''}
      `;
     
      default: // Handles SAQ and any other types
        if (isUnattempted) {
          return `<div class="unattempted-notice"><i class="fas fa-minus-circle"></i> Not Attempted</div>
            ${hasDigitalInk ? `
              <div class="digital-ink-section">
                <button class="btn-view-digital-ink" data-question-number="${index + 1}" data-digital-ink='${JSON.stringify(q.studentDigitalInk)}'>
                  <i class="fas fa-eye"></i> View Digital Ink
                </button>
              </div>
            ` : ''}`;
        }
        return `${formatSaqResponse(q.studentResponse, hasDigitalInk)}
          ${hasDigitalInk ? `
            <div class="digital-ink-section">
              <button class="btn-view-digital-ink" data-question-number="${index + 1}" data-digital-ink='${JSON.stringify(q.studentDigitalInk)}'>
                <i class="fas fa-eye"></i> View Digital Ink
              </button>
            </div>
          ` : ''}`;
    }
  };

  console.log(exam);

  return `
        <div class="report-container">
            <div class="report-header">
                <div class="report-header-title">
                    <h2 class="exam_report">Exam Report</h2>
                    <h3><span class="exam_name">Exam Name </span>: ${examName}</h3>
                    ${
                      exam.reportGeneratedAt
                        ? `<p class="report-generation-time">Generated on: ${new Date(
                            exam.reportGeneratedAt
                          ).toLocaleString()}</p>`
                        : ""
                    }
                </div>
                <div class="score-summary">
                    <div class="score-card">
                        <h3>${totalScore}/${totalMarks}</h3>
                        <p class="total_score">Total Score</p>
                    </div>
                    <div class="score-card">
                        <h3>${overallPercentage}%</h3>
                        <p class="percentage">Overall Percentage</p>
                        ${percentageDisplay}
                    </div>
                    <div class="score-card">
                        <h3>${attemptedPercentage}%</h3>
                        <p class="success-rate">Success Rate (Attempted Questions)</p>
                    </div>
                    <div class="score-card">
                        <h3>${exam.attended}/${data.questionsCount}</h3>
                        <p class="questions_attempted">Questions Attempted</p>
                    </div>
                    <div class="score-card result-card">
                        <h3 class="${resultClass}">${passOrFail}</h3>
                        <p><span class="result">Result</span> ${
                          exam.passStatus && exam.passStatus.length > 0
                            ? '(<span class="modified">Modified</span>)'
                            : `(<span class="cutoff">Cutoff</span>: ${cutoffPercentage}%)`
                        }</p>
                    </div>
                </div>
                ${statusChangeInfo}
            </div>

            <div class="detailed-stats">
                <h3 class="section-title performance_summary">Performance Summary</h3>
                <div class="stat-item">
                    <span class="stat-label correct_answers">Correct Answers:</span>
                    <span class="stat-value correct">${exam.correct}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label incorrect_answers">Incorrect Answers:</span>
                    <span class="stat-value incorrect">${exam.incorrect}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label unattempted_answers">Unattempted:</span>
                    <span class="stat-value">${
                      data.questionsCount - exam.attended
                    }</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Overall Percentage:</span>
                    <span class="stat-value">${overallPercentage}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Success Rate:</span>
                    <span class="stat-value success">${attemptedPercentage}% of attempted questions</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label result_label">Result:</span>
                    <span class="stat-value ${resultClass}">${passOrFail} ${
    exam.passStatus && exam.passStatus.length > 0
      ? "(Modified)"
      : `(Cutoff: ${cutoffPercentage}%)`
  }</span>
                </div>
                ${
                  exam?.name && (exam?.name?.first || exam?.name?.last)
                    ? `
                <div class="stat-item">
                    <span class="stat-label student_name">Student Name:</span>
                    <span class="stat-value">${exam?.name?.first || ""} ${
                        exam?.name?.last || ""
                      }</span>
                </div>
                `
                    : ""
                }
            </div>
            ${
              exam?.enabledFeatures?.includes("canShowDetailedReport")
                ? `
                <h3 class="section-title question_wise_breakdown">Question-wise Breakdown</h3>
                <div class="questions-grid">
                    ${exam?.questions
                      ?.map(
                        (q, index) => `
                        <div class="question-card ${
                            (() => {
                              const hasDigitalInk = q?.studentDigitalInk && q?.studentDigitalInk?.length > 0;
                              const isUnattempted = (!q.studentBlanks.length || q.studentResponse) && !hasDigitalInk;

                              if (isUnattempted) return "unattempted";
                              if (!q?.question?.shouldEvaluate) return "not-evaluated";
                              return q.isAnsweredCorrect ? "correct" : "incorrect";
                            })()
                        }">
                            <div class="question-header">
                               <div class="question-number-container">
                                <span><span class="question_number">Question</span> ${
                                  index + 1
                                }</span>
                                <span class="question-type ${q.question.type} ">${q.question.type}</span>
                               </div>
                            ${
                                (() => {
                                  const hasDigitalInk = q?.studentDigitalInk && q?.studentDigitalInk?.length > 0;
                                  const isUnattempted = (!q.studentBlanks.length || q.studentResponse) && !hasDigitalInk;

                                  if (isUnattempted) {
                                    return '<span class="unattempted-status"><i class="fas fa-minus-circle"></i> Not Attempted</span>';
                                  }
                                  if (!q?.question?.shouldEvaluate) {
                                    return '<span class="not-evaluated-status"><i class="fas fa-times-circle"></i> Not Evaluated</span>';
                                  }
                                  return q.isAnsweredCorrect
                                    ? '<span class="correct-status"><i class="fas fa-check-circle"></i> Correct</span>'
                                    : '<span class="incorrect-status"><i class="fas fa-times-circle"></i> Incorrect</span>';
                                })()
                            }
                            </div>
                            <div class="question-content">
                                <div class="question-text">${
                                  q.question.question
                                }</div>
                                
                                ${renderQuestionDetails(q, index)}
                            </div>
                        </div>
                    `
                      )
                      .join("")}
                </div>`
                : ""
            }
        </div>
    `;
}

// Add this function to get email from URL params
function getEmailFromParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email");
  if (!email) {
    console.error("Email parameter missing in URL");
    return "";
  }
  return email;
}

function getStatusHTML(status) {
  let statusText = "";
  let statusClass = "";
  let icon = "";

  switch (status) {
    case "ON_GOING":
      statusText = "Active - Exam in Progress";
      statusClass = "status-active on_going_content_status";
      icon = "fa-clock";
      break;
    case "ENDED":
      statusText = "Completed - Exam has ended";
      statusClass = "status-completed ended_content_status";
      icon = "fa-check-circle";
      break;
    case "NOT_STARTED":
      statusText = "Scheduled - Exam has not started yet";
      statusClass = "status-scheduled not_started_status";
      icon = "fa-calendar";
      break;
    default:
      statusText = status;
      statusClass = "";
      icon = "fa-info-circle";
  }

  return `<span class="status-indicator ${statusClass}"><i class="fas ${icon}"></i> ${statusText}</span>`;
}

function getStudentStatusHTML(studentStatus, registrationStatus) {
  let statusText = "";
  let statusClass = "";
  let icon = "";

  if (registrationStatus === "APPROVED") {
    if (studentStatus === "Exam Completed") {
      statusText = "Completed - You have finished this exam";
      statusClass = "status-completed exam_completed_content";
      icon = "fa-check-circle";
    } else if (studentStatus === "ON_GOING") {
      statusText = "In Progress - You are taking this exam";
      statusClass = "status-active on_going_content";
      icon = "fa-pen";
    } else if (studentStatus === "NOT_STARTED") {
      statusText = "Ready - You can start this exam when it begins";
      statusClass = "status-ready not_started_content";
      icon = "fa-thumbs-up";
    }
  } else if (registrationStatus === "REJECTED") {
    statusText = "Registration Rejected - Contact administrator";
    statusClass = "status-rejected rejected_content";
    icon = "fa-times-circle";
  } else if (registrationStatus === "REGISTERED") {
    statusText = "Waiting for Approval - Your registration is pending";
    statusClass = "status-pending registered_content";
    icon = "fa-hourglass-half";
  } else {
    statusText = "Not Registered - Registration required";
    statusClass = "status-not-registered not_registered_content";
    icon = "fa-exclamation-triangle";
  }

  return `<span class="status-indicator ${statusClass}"><i class="fas ${icon}"></i> ${statusText}</span>`;
}

function getTimezoneDisplay(timezoneIdentifier) {
  const timezone = standardTimezones.find(
    (tz) => tz.identifier === timezoneIdentifier
  );
  if (timezone) {
    // Use currentLang variable which is updated by the language toggle
    const lang = localStorage.getItem("lang") || "en";
    const displayName = lang === "ar" ? timezone.arabic_name : timezone.name;
    return `${timezone.offset} ${displayName}`;
  }
  return timezoneIdentifier || "Unknown timezone";
}

function checkBrowserCompatibility() {
  const os = getOSInfo();
  const browser = getBrowserInfo();
  const browserName = browser.split(" ")[0];

  // Define supported browsers by OS
  const supportedBrowsers = {
    "Windows 11": ["Chrome", "Edge", "Brave"],
    "Windows 10": ["Chrome", "Edge", "Brave"],
    "Windows 8": ["Chrome", "Edge", "Brave"],
    "Windows 7": ["Chrome", "Edge", "Brave"],
    "iPad": ["Chrome", "Edge", "Brave"],
    // "macOS": ["Chrome", "Edge", "Safari"],
    macOS: ["Chrome", "Edge"],
    Linux: ["Chrome", "Edge"],
  };

  let isSupported = false;

  // Check if current OS has supported browsers defined
  if (supportedBrowsers[os]) {
    isSupported = supportedBrowsers[os].includes(browserName);
  }

  if (!isSupported) {
    setTimeout(function() {
      // Redirect to browser compatibility page
      window.location.href = '../../app-landing/browser-compatibility.html';
    }, 3000);
    return false;
  }

  return true;
}

// Function to show digital ink modal
function showDigitalInkModal(questionNumber, digitalInkData) {
  // Create modal HTML if it doesn't exist
  if (!$("#digital-ink-modal").length) {
    const modalHtml = `
      <div id="digital-ink-modal" class="custom-modal">
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Digital Ink - Question ${questionNumber}</h3>
            <button class="modal-close" type="button">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div id="digital-ink-container">
              <div id="sketch-widget-container"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    $("body").append(modalHtml);
  } else {
    // Update the title for the current question
    $("#digital-ink-modal .modal-title").text(`Digital Ink - Question ${questionNumber}`);
  }

  // Clear previous content
  $("#sketch-widget-container").empty();

  // Show the modal
  $("#digital-ink-modal").addClass("active");
  $("body").addClass("modal-open");

  // Initialize SketchWidget when modal opens
  setTimeout(() => {
    initializeSketchWidget(digitalInkData);
  }, 100);

  // Add event listeners for closing modal
  $("#digital-ink-modal .modal-close, #digital-ink-modal .modal-overlay").off("click").on("click", function() {
    closeDigitalInkModal();
  });

  // Close modal on Escape key
  $(document).off("keydown.modal").on("keydown.modal", function(e) {
    if (e.key === "Escape") {
      closeDigitalInkModal();
    }
  });
}

// Function to close digital ink modal
function closeDigitalInkModal() {
  $("#digital-ink-modal").removeClass("active");
  $("body").removeClass("modal-open");
  $("#sketch-widget-container").empty();
  $(document).off("keydown.modal");
}

// Function to initialize the SketchWidget with digital ink data
function initializeSketchWidget(digitalInkData) {
  const containerElement = document.getElementById('sketch-widget-container');

  if (!containerElement) {
    console.error('Sketch widget container not found');
    return;
  }

  try {
    // Check if SketchWidget is available
    if (typeof SketchWidget === 'undefined') {
      throw new Error('SketchWidget is not available');
    }

    // Initialize SketchWidget with read-only configuration
    const widget = new SketchWidget(containerElement, {
      width: "100%",
      height: "100%",
      tools: ['pencil', 'pen', 'marker', 'eraser', 'lasso', 'ruler'],
      colors: ['#000000', '#FF3B30', '#007AFF', '#34C759', '#FF9500', '#FFCC00'],
      exportFormat: 'json',
      showToolbar: false,
      toolbarPosition: 'floating',
      toolbarOrientation: 'horizontal',
      toolbarDraggable: false,
      toolbarCollapsible: false,
      toolbarCollapsed: false,
      editable: false, // Read-only mode
      readOnly: true   // Read-only mode
    });

    // Wait for widget to be ready before loading strokes
    widget.waitForReady().then(() => {
      widget.loadStrokes(digitalInkData || []);
      console.log('SketchWidget initialized and strokes loaded');
    }).catch((error) => {
      console.error('Error initializing SketchWidget:', error);
    });

  } catch (error) {
    console.error('Error creating SketchWidget:', error);
    // Show error message in container
    containerElement.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: #666;">
        <div style="text-align: center;">
          <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
          <p>Unable to load digital ink data</p>
        </div>
      </div>
    `;
  }
}