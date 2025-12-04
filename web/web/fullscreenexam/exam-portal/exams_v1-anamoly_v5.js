//exam_v1.js
let currentQuestionIndex = 0;
let questions = [];
let answers = [];
let initialAnswers = [];
let isAnswerChanged = false;
let unsavedAnswers = [];
let questionStartTime = null;
let isFirstTime = true;
let savingInProgress = {};
let pendingSaveRequests = [];
let digitalWritingWidgets = new Map(); // Store widget instances by question index
const allowedFileTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // for doc files types
  "application/msword",
  "application/vnd.ms-word", // for doc files
  "application/wps-writer", // for wps files
  "application/octet-stream", //this is for fallback to support old browsers
];

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/jpg",
]
const index_label = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];
let faceNotVisibleCount = 0;
let apiFailureCount = 0;
const MAX_API_FAILURES = 7; //checking api failure count to show internet connection warning
$("#submit-btn-lang").hide()
// Debounce function to prevent multiple rapid clicks
function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

function initAccordion(questionIndex, imageIndex) {
  const $header = $(`#hdr-${questionIndex}-${imageIndex}`);
  const $content = $header.next(".accordion-content");
  const $img = $content.find(`#image-${questionIndex}-${imageIndex}`);
  const originalSrc = $img.data("original-src");
  // Check if we're opening or closing
  const isOpening = !$content.is(":visible");

  // Close all other accordions first
  $(".accordion-header")
    .not($header)
    .removeClass("active")
    .next(".accordion-content")
    .slideUp(200);

  // Toggle current accordion
  $content.slideToggle(200);
  $header.toggleClass("active");

  // Only call API if we're opening the accordion
  if (isOpening && originalSrc && !$img.attr("src")) {
    try {
      // Clear any existing error or loading messages
      $content.find(".loading, .error").remove();

      $img.hide();
      $content.append('<div class="loading">Loading image...</div>');
      getSignedUrl(originalSrc, $img, $content);
    } catch (error) {
      $content.find(".loading").remove();
      $content.append('<div class="error">Failed to load image</div>');
    }
  }
}

const urlParams = new URLSearchParams(window.location.search);
const examId = urlParams.get("examid");
const studentId = urlParams.get("uid");
const shuffleQuestions = urlParams.get("shuffleqtn") === "true";
const shuffleOptions = urlParams.get("shuffleoptions") === "true";
const cid = urlParams.get("cid");
let attender_id = urlParams.get("attender_id");
let showCalculators = urlParams.get("canShowCalculator") === "true";
let canEnableAudio = urlParams.get("audioRecording") === "true";
let infoPanelDom = $(".top-info-panel p");
let saving_answerInfo = $("#saving-answers");
let saving_videoInfo = $("#saving-video");
let saving_answerFailedInfo = $("#saving-answers-failed");
let saving_videoFailedInfo = $("#saving-video-failed");

let examEndTime;
let firstStartedAt;
let examTimeZone;
let timerInterval;
let remainingDurationSeconds = 0; // Store the remaining duration in seconds
const fiveMinutesInMs = 5 * 60 * 1000;

let canStartExamAfterExamEndTime = false;
let isBrowserOk = false;

$("#modal-image").hide();

function finalButtons() {
  let isEnglish = localStorage.getItem("lang") === "en";
  if (isEnglish) {
    $('button:contains("يُقدِّم")').text("Submit");
    $('button:contains("يلغي")').text("Cancel");
  } else {
    $('button:contains("Submit")').text("يُقدِّم");
    $('button:contains("Cancel")').text("يلغي");
  }
}

$(document).ready(function () {
  $("#prev-btn, #next-btn").on("click", function () {
    $(this).attr("disabled", true);
    _dom_capture = $(this);
    setTimeout(function () {
      $("#prev-btn, #next-btn").attr("disabled", false);
    }, 1600);
  });
    // finalButtons();


  if (showCalculators) {
    $("#calculator-toggle-item").show();
  } else {
    $("#calculator-toggle-item").hide();
  }

  // Function to handle language change
  function handleLanguageChange() {
    const lang = localStorage.getItem("lang");
    renderLanguage("../exam-portal/translations/");
    toggleLanguage(lang || "en");
    if (lang === "ar") {
      $("#language-toggle").prop("checked", true);
      $("#language-text").text("Arabic");
      $("#menu-container").css({ right: "-230px" });
      $(".toggle-item").css({ flexDirection: "row-reverse" });
    } else {
      $("#language-text").text("English");
      $("#language-toggle").prop("checked", false);
      $("#menu-container").css({ right: 0 });
      $(".toggle-item").css({ flexDirection: "row" });
    }
  }
  handleLanguageChange();

  $("#prev-btn").click(
    debounce(async function () {
      const getLang = localStorage.getItem("lang") || "en";
      // Calculate duration for current question
      if (questionStartTime) {
        const duration = Math.round((new Date() - questionStartTime) / 1000); // Duration in seconds
        videoUploadLog(
          `Question ${currentQuestionIndex + 1} duration: ${duration} seconds`,
          "exam"
        );
      }

      // Log the next button click and current state
      videoUploadLog(
        `Previous button clicked - Current Question: ${currentQuestionIndex + 1
        }, Total Questions: ${questions.length}`,
        "exam"
      );
      videoUploadLog(
        `Current Answer: ${JSON.stringify(answers[currentQuestionIndex])}`,
        "exam"
      );

      scrollToTop(currentQuestionIndex);
      await attemptSaveUnsavedAnswers();

      // Capture digital writing data before proceeding
      await captureDigitalInk(currentQuestionIndex);

      try {
        await saveUnsavedResponsesFromDOM();
      } catch (error) {
        console.error("Failed to save unsaved responses from DOM:", error);
      }

      if (currentQuestionIndex > 0) {
        // Comprehensive validation for all question types
        if (!isQuestionAnswered(currentQuestionIndex)) {
          ShowToAnswer();
          return false;
        }

        if (isAnswerChanged) {
          try {
            await saveResponseForQuestion(currentQuestionIndex);
          } catch (error) {
            console.error("Failed to save response:", error);
          }
        }
        if (currentQuestionIndex === questions.length) {
               $("#next-btn-lang").hide()
                $("#submit-btn-lang").show()
        } else {
           $("#submit-btn-lang").hide()
           $("#next-btn-lang").show()
        }

        if (currentQuestionIndex < questions.length) {
          currentQuestionIndex--;
          showQuestion(currentQuestionIndex);
        }
      }
      // renderLanguage('../exam-portal/translations/')
    }, 300)
  );

  $("#next-btn").click(
    debounce(async function () {
      scrollToTop(currentQuestionIndex);
      await attemptSaveUnsavedAnswers();

      // Capture digital writing data before proceeding
      await captureDigitalInk(currentQuestionIndex);

      const currentQuestion = questions[currentQuestionIndex];
      const currentAnswer = answers[currentQuestionIndex];
      // Calculate duration for current question
      if (questionStartTime) {
        const duration = Math.round((new Date() - questionStartTime) / 1000); // Duration in seconds
        videoUploadLog(
          `Question ${currentQuestionIndex + 1
          } Student spent time for this question: ${duration} seconds`,
          "exam"
        );
      }

      // Log the next button click and current state
      videoUploadLog(
        `Next button clicked - Current Question: ${currentQuestionIndex + 1
        }, Total Questions: ${questions.length}`,
        "exam"
      );
      videoUploadLog(
        `Current Answer: ${JSON.stringify(currentAnswer)}`,
        "exam"
      );

      // Comprehensive validation for all question types
      if (!isQuestionAnswered(currentQuestionIndex)) {
        ShowToAnswer();
        return false;
      }

      if (currentQuestionIndex < questions.length - 1) {
        const getLang = localStorage.getItem("lang") || "en";

        if (isAnswerChanged) {
          try {
            await saveResponseForQuestion(currentQuestionIndex);
          } catch (error) {
            console.error("Failed to save response:", error);
          }
        }

        try {
          await saveUnsavedResponsesFromDOM();
        } catch (error) {
          console.error("Failed to save unsaved responses from DOM:", error);
        }
        if (currentQuestionIndex === questions.length - 2) {
           $("#next-btn-lang").hide()
          $("#submit-btn-lang").show()
        } else {
          $("#submit-btn-lang").hide()
          $("#next-btn-lang").show()
        }

        if (currentQuestionIndex < questions.length && currentAnswer) {
          currentQuestionIndex++;
          showQuestion(currentQuestionIndex);
          videoUploadLog(
            `Navigated to question ${currentQuestionIndex + 1}`,
            "exam"
          );
        }
      } else if (currentQuestionIndex === questions.length - 1) {
        videoUploadLog(`Reached last question - Initiating submission`, "exam");
        if (isAnswerChanged) {
          try {
            await saveResponseForQuestion(currentQuestionIndex);
          } catch (error) {
            console.error("Failed to save response:", error);
          }
        }

        try {
          await saveUnsavedResponsesFromDOM();
        } catch (error) {
          console.error("Failed to save unsaved responses from DOM:", error);
        }

        validateAndSubmit();
      }
      // renderLanguage('../exam-portal/translations/');
      finalButtons();
    }, 300)
  );

  $(document).on("click", "#hamburger-icon", function () {
    $("#menu-container").toggleClass("show");
  });

  // Event listener for choice selection
  $(document).on("click", ".choice", function () {
    isAnswerChanged = true;
    const selectedChoice = $(this).data("choice");

    answers[currentQuestionIndex] = selectedChoice.toString();
    $(this).parent().find(".choice").removeClass("selected");
    $(this).parent().find(".tick-mark").remove();
    $(this).addClass("selected");
    $(this).append('<span class="tick-mark">✔️</span>');

    // Update filter number button with a green tick and mark as unsaved
    $(`.filter-numbers button[data-index=${currentQuestionIndex}]`).addClass(
      "selected"
    );
    $(`.filter-numbers button[data-index=${currentQuestionIndex}]`).attr(
      "data-answer-saved",
      "false"
    );
  });

  function scrollToTop(index) {
    $(`.filter-numbers button[data-index=${index}]`).attr("id", "selected");
    document.getElementById("selected").scrollIntoView({ behavior: "smooth" });
    $(`.filter-numbers button[data-index=${index}]`).removeAttr("id");
  }

  // Event listener for attachment icon click
  $(document).on("click", ".attachment-icon", function () {
    const $this = $(this);
    const $questionSection = $this.closest(".question-section");
    const $content = $questionSection.find(".attachment-content");
    const mainAttachmentCount = $content.data("attachmentcount");

    $content.toggle(200, function () {
      if ($content.is(":visible")) {
        $this.html(
          `▼ <span>Close Attachment</span> <span class="attachment-count">${mainAttachmentCount}</span>`
        );
      } else {
        $this.html(
          `▶ <span>Open Attachment</span> <span class="attachment-count">${mainAttachmentCount}</span>`
        );
      }
    });
  });

  // Event listener for image zoom click
  $(document).on("click", ".zoom-icon, .attachment-image", function () {
    const fileData = JSON.parse($(this).attr("data-url"));

    // Store the clicked element's data for later use in download
    $("#image-modal").data("current-file", fileData);

    const fileUrl = fileData.url;
    const fileType = fileData.type;
    const fileName = fileData.name || decodeURIComponent(fileUrl.split("/").pop().split("?")[0]);

    // Hide all modal content types
    // Hide all modal content types
    $("#modal-image, #modal-audio, #modal-pdf").hide();


    if (fileType === "image") {
      $("#modal-image")
        .attr("src", fileUrl)
        .attr("onerror", "handleImageError(this)")
        .show();

    } else if (fileType === "audio") {
      const audioElement = $("#modal-audio")[0];
      const sourceElement = $("#audio-source");
      sourceElement
        .attr("src", fileUrl)
        .attr("onerror", "handleImageError(this)");
      audioElement.load();
      $("#modal-audio").show();

    } else if (fileType === "application" || fileType === "pdf") {
      $("#modal-pdf")
        .attr("src", fileUrl)
        .show();
      // Use timeout approach like your working code since onerror doesn't work reliably for PDFs
      setTimeout(() => {
        const frame = $("#modal-pdf")[0];
        if (frame && frame.getAttribute("data-retry") !== "true") {
          handleImageError(frame)
        }
      }, 100);

    }



    $("#image-modal").dialog({
      modal: true,
      width: 600,
      minHeight: 300,
      maxHeight: 600,
      resizable: true,
      draggable: true,
      open: function () {
        $(".ui-widget-overlay").bind("click", function () {
          $("#image-modal").dialog("close");
        });
      },
      close: function () {
        $('#modal-image').attr('data-retry', false);
        // Clear any previous retry flags
        $("#modal-audio")[0].setAttribute("data-retry", "false");
        $("#audio-source").attr("data-retry", "false");
        $("#modal-pdf")[0].setAttribute("data-retry", "false");
      },
      create: function (event, ui) {
        const $dialog = $(this).closest(".ui-dialog");

        // Download button
        const downloadButton = $(
          `<button type="button" class="ui-button ui-corner-all ui-widget" title="Download" id="attachment-download-btn">
           <i class="fas fa-download"></i>
         </button>`
        );

        downloadButton.on("click", function () {
          const fileData = $("#image-modal").data("current-file");

          if (!fileData || !fileData.url) {
            alert("File URL is not available.");
            return;
          }

          const fileUrl = fileData.url;
          const fileName =
            fileData.name ||
            decodeURIComponent(fileUrl.split("/").pop().split("?")[0]);

          // Show loading indicator
          const $downloadBtn = $(this);
          const originalContent = $downloadBtn.html();
          $downloadBtn.html('<i class="fas fa-spinner fa-spin"></i>');
          $downloadBtn.prop("disabled", true);

          // Use fetch API to download the file
          fetch(fileUrl)
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.blob();
            })
            .then((blob) => {
              // Create a download link and trigger it
              const downloadUrl = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = downloadUrl;
              link.download = fileName || "download";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              // Clean up the URL object
              setTimeout(() => {
                URL.revokeObjectURL(downloadUrl);
              }, 100);

              // Reset button
              $downloadBtn.html(originalContent);
              $downloadBtn.prop("disabled", false);
            })
            .catch((err) => {
              console.error("Download failed:", err);
              alert("Download failed. Please try again.");
              $downloadBtn.html(originalContent);
              $downloadBtn.prop("disabled", false);
            });
        });

        // Close button (X)
        const closeButton = $(
          `<button type="button" class="ui-button ui-corner-all ui-widget ui-dialog-titlebar-close" title="Close">
          X
        </button>`
        );

        closeButton.on("click", function () {
          $("#image-modal").dialog("close");
          $('#modal-image').attr('data-retry', false);
        });

        const titleBar = $dialog.find(".ui-dialog-titlebar");
        titleBar.append(downloadButton);
        titleBar.append(closeButton);
      },
    });
  });

  // Hide menu when clicking outside
  $(document).click(function (e) {
    if (!$(e.target).closest(".menu-container, #hamburger-icon").length) {
      $("#menu-container").removeClass("show");
    }
  });

  // Language toggle functionality
  $("#language-toggle").change(function () {
    const selectedLanguage = this.checked ? "ar" : "en";
    localStorage.setItem("lang", selectedLanguage);
    if ($(this).is(":checked")) {
      $(".open-attachments").addClass("rtl");
      $("#language-text").text("Arabic");
      renderLanguage("../exam-portal/translations/");
      toggleLanguage("ar");
      $("#menu-container").css({ right: "-230px" });
      $(".toggle-item").css({ flexDirection: "row-reverse" });
    } else {
      $(".open-attachments").removeClass("rtl");
      $("#language-text").text("English");
      renderLanguage("../exam-portal/translations/");
      toggleLanguage("en");
      $("#menu-container").css({ right: 0 });
      $(".toggle-item").css({ flexDirection: "row" });
    }
    $("#menu-container").removeClass("show");
    // finalButtons();
  });

  // Calculator toggle functionality
  $("#calculator-toggle").change(function () {
    if ($(this).is(":checked")) {
      $(".calculator-toggle-button").addClass("visible");
      showCalculator();
    } else {
      $(".calculator-toggle-button").removeClass("visible");
      hideCalculator();
    }
    $("#menu-container").removeClass("show");
  });

  videoUploadLog(`Exam interface initialized `, "exam");

  // Function to toggle between languages
  function toggleLanguage(lang) {
    localStorage.setItem("lang", lang);

    if (lang === "ar") {
      $("body").addClass("rtl-language");
    } else {
      $("body").removeClass("rtl-language");
    }
  }

  // Function to hide calculator if visible
  function hideCalculator() {
    if ($(".scientific-calculator-container").is(":visible")) {
      $(".scientific-calculator-container").hide();
    }
  }

  // Function to show calculator
  function showCalculator() {
    $(".scientific-calculator-container").show();
  }

  // Function to handle language change
  function handleLanguageChange() {
    const lang = localStorage.getItem("lang");
    renderLanguage("../exam-portal/translations/");
    toggleLanguage(lang || "en");
    if (lang === "ar") {
      $("#language-toggle").prop("checked", true);
      $("#language-text").text("Arabic");
      $("#menu-container").css({ right: "-230px" });
      $(".toggle-item").css({ flexDirection: "row-reverse" });
    } else {
      $("#language-text").text("English");
      $("#language-toggle").prop("checked", false);
      $("#menu-container").css({ right: 0 });
      $(".toggle-item").css({ flexDirection: "row" });
    }
  }
  handleLanguageChange();
});

$(document).on("click", ".document-preview", function () {
  const url = $(this).data("url");
  openDocumentPreview(url);
});

$(document).on("click", ".image-preview", function () {
  const url = $(this).data("url");
  openImagePreview(url);
});

function fetchAnsweredQuestions() {
  const apiEndpoint = `${STUDENT_END_POINT}/question?entranceExamId=${examId}&studentId=${studentId}`;

  makeApiCall({
    url: apiEndpoint,
    method: "GET",
    isApiKey: true,
    successCallback: function (response) {
      userActivityLogsApi(
        "Answered questions retrieved successfully",
        "exam-start"
      );
      if (response.message === "Retrieved successfully") {
        canStartExamAfterExamEndTime =
          response?.data?.canStartExamAfterExamEndTime;

        if (!canStartExamAfterExamEndTime) {
          if (response.data.studentExamStatus === "ENDED") {
            window.location.href = `message.html?status=already-completed${cid ? `&cid=${cid}` : ""
              }`;
            return;
          }
        }

        let answeredQuestions = [];
        let unansweredQuestions = [];
        response.data.questions.forEach((question, index) => {
          question.originalIndex = index; // Store the original index of each question
          if (question.studentResponse) {
            answeredQuestions.push(question);
          } else {
            unansweredQuestions.push(question);
          }
        });

        if (shuffleQuestions) {
          unansweredQuestions = shuffleArrayWithFixed(unansweredQuestions);
        }

        questions = answeredQuestions.concat(unansweredQuestions);
        initialAnswers = questions.map(
          (question) => question.studentResponse || null
        );
        answers = [...initialAnswers];

        renderQuestions();
        showQuestion(currentQuestionIndex);

        // Initialize all questions with studentResponse as saved in the DOM
        questions.forEach((question, index) => {
          if (
            question.studentResponse != "" ||
            question.studentBlankslength > 0 ||
            question.studentattachmentlength > 0 ||
            question.studentOrder?.length > 0
          ) {
            $(`.filter-numbers button[data-index=${index}]`).attr(
              "data-answer-saved",
              "true"
            );
            $(`.filter-numbers button[data-index=${index}]`).addClass(
              "selected"
            );
          } else {
            $(`.filter-numbers button[data-index=${index}]`).attr(
              "data-answer-saved",
              "false"
            );
          }
        });

        if (response && response.data && response.data.exam) {
          if (!canStartExamAfterExamEndTime) {
            initializeExamTimer(response.data.exam);
          } else {
            $("#exam-timer").hide();
          }
        }
      }
      renderLanguage("../exam-portal/translations/");
    },
    errorCallback: function (error) {
      window.location.href = `message.html?status=ended${cid ? `&cid=${cid}` : ""
        }`;
      console.error("Error fetching answered questions:", error);
    },
  });
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function shuffleArrayWithFixed(array) {
  let shuffledArray = array.filter((q) => q.shouldShuffleQts !== false);
  let fixedArray = array.filter((q) => q.shouldShuffleQts === false);

  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }

  fixedArray.forEach((q) => {
    shuffledArray.splice(q.originalIndex, 0, q); // Re-insert the fixed questions at their original positions
  });

  return shuffledArray;
}

//#region Helper Functions
function replaceBlanksInQuestion(questionText, responses) {
  // Match emojis followed optionally by underscore and text
  return questionText.replace(/(\d+️⃣)(_)?/g, (match, p1, underscore) => {
    const identity = p1.replace("️⃣", "");
    const hasResponse = responses[identity];

    if (hasResponse) {
      // If there's a response, remove underscore and inject answer
      return `${p1}<b>${hasResponse}</b><span class="space-left"></span>`;
    } else {
      // No response — keep the underscore if it was there
      return underscore ? `${p1}_____` : p1;
    }
  });
}


//#endregion
function setupAudioRecorder(questionId, index) {
  let recorder, stream, analyser, audioContext, animationId;
  let audioChunks = [], currentBlob = null, timerInterval;
  let seconds = 0;
  const recordings = [];
  const MAX_RECORDINGS = 5;

  const $recordBtn = $(`#recordBtn-${index}`);
  const $stopBtn = $(`#stopBtn-${index}`);
  const $pauseBtn = $(`#pauseBtn-${index}`);
  const $timer = $(`#timer-${index}`);
  const $saveControls = $(`#saveControls-${index}`);

  $(`#stop-record-text-${index}`).hide()
  $(`#pause-record-text-${index}`).hide()
  $(`#resume-record-text-${index}`).hide()
  $(`#save-btn-controls-${index}`).hide()
  $(`#microphone-error-${index}`).hide()
  $(`#recording-audioStatus-${index}`).hide()
  $(`#paused-audioStatus-${index}`).hide();
  const canvas = document.getElementById(`customWaveform-${index}`);
  const ctx = canvas.getContext('2d');
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  window.addEventListener('resize', resizeCanvas);

  function drawInitialWave() {
    const mid = canvas.height / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(canvas.width, mid);
    ctx.stroke();
  }

  function drawWave() {
    if (!analyser) {
      console.warn('Analyser not initialized');
      return;
    }
    const mid = canvas.height / 2;
    const width = canvas.width;
    const height = canvas.height;
    const buffer = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buffer);

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(width, mid);
    ctx.stroke();

    ctx.strokeStyle = '#00ffff';
    ctx.beginPath();
    const half = width / 2;
    const step = half / buffer.length;
    let x = 0;
    for (let i = 0; i < buffer.length; i++) {
      const y = mid + (buffer[i] - 128) / 128 * (height / 3);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      x += step;
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(half, mid);
    ctx.lineTo(width, mid);
    ctx.stroke();
  }

  function animateWave() {
    drawWave();
    animationId = requestAnimationFrame(animateWave);
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      $timer.text(`${m}:${s}`);
    }, 1000);
  }

  function resetTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    $timer.text('00:00');
  }

  $recordBtn.on('click', async () => {

    if (recordings.length >= MAX_RECORDINGS) return;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      $recordBtn.addClass("record-mic-disable");
      $stopBtn.addClass("stop-record-enable");
      $pauseBtn.addClass("pause-record-enable");
      $timer.addClass("timer-record-enable");
      $(`#microphone-error-${index}`).hide()
      $(`#audio-info-text-${index}`).hide()
      $(`#start-record-text-${index}`).hide()
      $(`#stop-record-text-${index}`).show()
      $(`#pause-record-text-${index}`).show()
      $(`#resume-record-text-${index}`).hide()
      $(`#save-btn-controls-${index}`).hide()
      $pauseBtn.find(".fa-play").removeClass('fa-play').addClass('fa-pause');
      // $(`#pause-record-text-${index}`).text("Pause").show();
      $(`#customWaveform-${index}`).addClass("customWaveform-enable")
      resizeCanvas();
      $(`#previewAudio-${index}`).remove();


      ;
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => audioChunks.push(e.data);
      recorder.onstop = () => {
        currentBlob = new Blob(audioChunks, { type: 'audio/webm' });
        $saveControls.show();
        drawInitialWave();
        stream.getTracks().forEach(t => t.stop());
        audioContext.close();
        cancelAnimationFrame(animationId);
        $(`#previewAudio-${index}`).remove();
        $saveControls.before(`<audio id="previewAudio-${index}" controls src="${URL.createObjectURL(currentBlob)}" style="width: 100%;"></audio>`);
      };

      audioChunks = [];
      recorder.start();
      startTimer();
      animateWave();
      $(`#recording-audioStatus-${index}`).show();
    } catch (err) {
      console.error(err);
      $(`#microphone-error-${index}`).show();
    }
  });

  $stopBtn.on('click', () => {
    $recordBtn.removeClass("record-mic-disable");
    $stopBtn.removeClass("stop-record-enable");
    $pauseBtn.removeClass("pause-record-enable");
    $timer.removeClass("timer-record-enable");
    $(`#save-btn-controls-${index}`).show()
    $(`#customWaveform-${index}`).removeClass("customWaveform-enable")
    $(`#audio-info-text-${index}`).show()
    $(`#start-record-text-${index}`).show()
    $(`#stop-record-text-${index}`).hide()
    $(`#pause-record-text-${index}`).hide()
    $(`#resume-record-text-${index}`).hide()
    if (recorder && recorder.state !== 'inactive') {
      $(`#recording-audioStatus-${index}`).hide();
      $(`#paused-audioStatus-${index}`).hide();
      resetTimer();
      recorder.stop();
      clearInterval(timerInterval);
    }
  });

  $pauseBtn.on('click', () => {
    if (!recorder) return;
    if (recorder.state === 'recording') {
      recorder.pause();
      clearInterval(timerInterval);
      cancelAnimationFrame(animationId);
       $(`#recording-audioStatus-${index}`).hide();
       $(`#paused-audioStatus-${index}`).show();
      $pauseBtn.find(".fa-pause").removeClass('fa-pause').addClass('fa-play');
       $(`#pause-record-text-${index}`).hide();
      $(`#resume-record-text-${index}`).show();
      
    } else if (recorder.state === 'paused') {
      recorder.resume();
      startTimer();
      animateWave();
      $(`#recording-audioStatus-${index}`).show();
      $(`#paused-audioStatus-${index}`).hide();
      $pauseBtn.find(".fa-play").removeClass('fa-play').addClass('fa-pause');
      $(`#pause-record-text-${index}`).show();
      $(`#resume-record-text-${index}`).hide();
 
    }
  });

  $(`#saveRecording-${index}`).on('click', () => {
    $(`#save-btn-controls-${index}`).hide()
    if (currentBlob) {
      const timestamp = Date.now();
      const fileName = `recording-${timestamp}.webm`;
      const fileFromBlob = new File([currentBlob], fileName, {
        type: currentBlob.type,
      });

      // Now call the function without breaking anything
      uploadFileForQuestion(studentId, { file: fileFromBlob }).then(() => {
        const filePath = `${CONFIG.BUCKET}/${CONFIG.FOLDERNAME}/${studentId}/${fileName}`;
        const payload = {
          capturedResponses: [{ meta: { name: fileName, type: "audio" }, url: filePath }],
        };
        makeApiCall({
          url: `${STUDENT_END_POINT}/captured-response?examId=${examId}&studentId=${studentId}&questionId=${questionId}`,
          method: "POST",
          data: JSON.stringify(payload),
          isApiKey: true,
          successCallback: () => {
          },
          errorCallback: (error) => { }
        });
      })
      $saveControls.hide();
      $(`#previewAudio-${index}`).remove();
      currentBlob = null;
    }
  });

  $(`#discardRecording-${index}`).on('click', () => {
    $(`#save-btn-controls-${index}`).hide()
    currentBlob = null;
    $saveControls.hide();
    $(`#previewAudio-${index}`).remove();
    resetTimer();
  })
  drawInitialWave();
}

function createQRCodePlaceholder(question, index) {


  const requiresScanAndEdit =
    question.meta?.["student-responce-type"]?.["scan-and-edit"];
  const requiresWebcamCapture =
    question.meta?.["student-responce-type"]?.["webcam-capture"];
  const reqquiresAudioRecord =
    question.meta?.["student-responce-type"]?.["audio-response"];
  if (!requiresScanAndEdit && !requiresWebcamCapture && !reqquiresAudioRecord) {
    return "";
  }

  const refreshButtonHtml = `
        <button class="refresh-attachments-btn" data-question-id="${question._id}" data-question-index="${index}">
            <i class="fas fa-sync-alt"></i>
            <div class="refresh-btn-text">Refresh</div>
        </button>
    `;

  let uploadMechanismHtml = "";
  let noAttachmentsMessage = "";

  if (requiresWebcamCapture) {
    const domain = window.location.origin;
    const urlParams = new URLSearchParams(window.location.search);
    const examid = urlParams.get("examid");
    const attender_id = urlParams.get("attender_id");
    const qid = question._id;
    const scanUrl = `${domain}/fullscreenexam/paper-scan/plain.html?examid=${examid}&attender_id=${attender_id}&qid=${qid}&a=1`;

    uploadMechanismHtml = `
      <div class="webcam-capture-wrapper">
        <button type="button" class="webcam-capture-btn" data-scan-url="${scanUrl}" data-question-index="${index}">
          <i class="fas fa-camera"></i> <span class="take-photo-btn-text"> Take Photo</span>
        </button>
        <div class="refresh-attachments-text take-photo-text">Click the take photo button to upload your response from a mobile device and click on the refresh button to see the uploaded response.</div>
        <div id="webcam-capture-modal-${index}" class="webcam-capture-modal" style="display: none;">
          <div class="webcam-capture-modal-content">
            <div class="webcam-capture-iframe-container">
              <div class="webcam-capture-loading" id="webcam-loading-${index}">
                <div class="webcam-capture-loading-content">
                  <div class="webcam-capture-spinner"></div>
                  <div class="webcam-capture-loading-text">Loading Scanner...</div>
                  <div class="webcam-capture-loading-subtext">Please wait while we prepare the camera interface for you.</div>
                  <div class="webcam-capture-loading-progress">
                    <div class="webcam-capture-loading-progress-bar"></div>
                  </div>
                </div>
              </div>
              <iframe src="about:blank" id="webcam-iframe-${index}"></iframe
            </div>
          </div>
        </div>saveControls
      </div>
    `;

    noAttachmentsMessage = `
        <div class="no-attachments-message">
            <i class="fas fa-camera"></i>
            <p class="attachment-info-text_1">No attachments uploaded yet.</p>
            <span class="take-photo-info-text_2">Please click the "Take Photo" button to upload your response.</span>
        </div>
    `;
  } else if (requiresScanAndEdit) {
    uploadMechanismHtml = `
      <div id="qr-code-placeholder-${index}" style="display: inline-block;"></div>
      <p class="refresh-attachments-text" id="qr-scaner-text">
          Scan this QR code to upload your response from a mobile device and click on the refresh button to see the uploaded response.
      </p>
    `;
    noAttachmentsMessage = `
      <div class="no-attachments-message">
          <i class="fas fa-camera"></i>
          <p class="attachment-info-text_1">No attachments uploaded yet.</p>
          <span id="qr-scaner-info-text_2">Please scan the "QR" code to upload your response.</span>
      </div>
    `;
  } else if (reqquiresAudioRecord) {
    uploadMechanismHtml = `
<div class="audio-wrapper">
  <canvas class="customWaveform-disable record-custom-waveform" id="customWaveform-${index}"></canvas>
  <div id="recording-audioStatus-${index}" class="audio-status-message recording-audioStatus">Recording...</div>
  <div id="paused-audioStatus-${index}" class="audio-status-message paused-audioStatus">Paused</div>
  <div id="microphone-error-${index}" class="audio-status-message microphone-error">Microphone access error. Please allow microphone</div>
  <div class="audio-info-text" id="audio-info-text-${index}">Click the button to start recording...</div>

  <div class="controls">
    <div class="audio-recording-controls">
      <button class="btn record" id="recordBtn-${index}"><i class="fas fa-microphone"></i></button>
      <button class="btn stop record-stop" id="stopBtn-${index}">
        <span></span> 
        <div class="stop-record-text" id="stop-record-text-${index}">Stop</div>
      </button>
      <div class="timer" id="timer-${index}">00:00</div>
    </div>
    <button class="btn pause record-pause" id="pauseBtn-${index}"><i class="fas fa-pause"></i>
      <div class="pause-record-text pause-resume-style" id="pause-record-text-${index}">Pause</div>
      <div class="resume-record-text pause-resume-style" id="resume-record-text-${index}">Resume</div>
    </button>
  </div>

  <div class="start-record-text" id="start-record-text-${index}">Start Recording</div>
  <div class="recording-preview" id="saveControls-${index}"></div>
  <div class="controls" id="save-btn-controls-${index}">
    <button class="btn save audio-save-btn-text" id="saveRecording-${index}">Save</button>
    <button class="btn discard audio-discard-btn-text" id="discardRecording-${index}">Discard</button>
  </div>
  <div class="recordings" id="recordingsList-${index}"></div>
</div>

  `;

    noAttachmentsMessage = `
  <div class="no-attachments-message">
    <i class="fas fa-microphone"></i>
    <p class="audio-info-text_1">No audio recordings uploaded yet.</p>
    <span class="audio-info-text_2">Please click the "Record Audio" button to upload your response.</span>
  </div>
`;
    setTimeout(() => {
      setupAudioRecorder(question?._id, index);
    }, 0);
  }

  return `
        <div class="qr-code-upload-container">
            ${uploadMechanismHtml}
            <div class="student-attachments-wrapper">
            ${refreshButtonHtml}
                <div class="student-attachments-container" id="student-attachments-container-${index}">
                    <div class="thumbnails-wrapper" id="thumbnails-wrapper-card">
                      ${noAttachmentsMessage}
                    </div>
                </div>
            </div>
        </div>
    `;
}

//#endregion

function renderQuestions() {
  const isEnglish = localStorage.getItem("lang") === "en";
  renderSidebar();
  questions.forEach((question, index) => {
    if (shuffleOptions && question.shouldShuffleOptions !== false) {
      question.choices = shuffleArray(question.choices);
    }
    const mainAttachmentCount = question.attachments.length;
    const hasAttachments = mainAttachmentCount > 0;

    const attachmentIcon = hasAttachments
      ? `<span class="attachment-icon ${question.type==="PRQ"?"attachment-wrapper-btn":""}"> ▼ Close Attachment <span class="attachment-count">${mainAttachmentCount}</span></span>`
      : "";

    const studentResponse = question.studentResponse;
    const studentBlanks = question.studentBlanks;
    const studentattachment = question.studentattachment;
    const studentOrder = question?.studentOrder;
    const studentDigitalInk = question?.studentDigitalInk;
    let questionTitle = "";
    let questionText = "";
    // Build the answer UI based on question type
    const qrCodeHtml = createQRCodePlaceholder(question, index);
    let answerHtml = "";
    if (question?.meta?.["student-responce-type"]?.["digital-writing"]) {
      answerHtml = `<div class="digital-ink-container" id="digital-ink-container-${index}">
        
      </div>`;
    } else {
      if (question.type === "MCQ") {
        answerHtml = question.choices
          .map(
            (choice, i) => `
            <div class="choice ${studentResponse === choice.key ? "selected" : ""
              }" data-choice="${choice.key}">
              <div class="choice-text-key" translate="no">
                  <span class="letter" translate="no">${index_label[i]}</span> 
                  <span class="created-option" translate="no">${choice.label}</span>
                  ${studentResponse === choice.key
                ? '<span class="tick-mark" translate="no">✔️</span>'
                : ""
              }
              </div>
            
              ${choice.attachments.length > 0
                ? `<span class="open-attachments ${isEnglish ? "" : "rtl"
                }"  data-attachments='${JSON.stringify(
                  choice.attachments
                )}'>  <span class="open-choice-attachment-text">▶ Open Attachment</span><span class="choice-attachment-count">${choice.attachments.length
                }</span></span>`
                : ""
              }
            </div>
          `
          )
          .join("");
      } else if (question.type === "TF") {
        answerHtml = `
          <div class="choice ${studentResponse === "true" ? "selected" : ""
          }" data-choice="true">
            <div class="choice-text-key">
                <span class="letter">${index_label[0]}</span> 
                <span class="created-option">True</span>
               
                ${studentResponse === "true"
            ? '<span class="tick-mark">✔️</span>'
            : ""
          }
            </div>
          </div>
          <div class="choice ${studentResponse === "false" ? "selected" : ""
          }" data-choice="false">
            <div class="choice-text-key">
                <span class="letter">${index_label[1]}</span> 
                <span class="created-option">False</span>
                ${studentResponse === "false"
            ? '<span class="tick-mark">✔️</span>'
            : ""
          }
            </div>
          </div>
        `;
      } else if (question.type === "OR") {
        // Get the order items from the question
        const orderItems = question.correctOrder || [];

        // If there's a saved student response, parse it
        let studentOrderResponse = [];
        if (studentResponse) {
          try {
            studentOrderResponse = JSON.parse(studentResponse);
          } catch (e) {
            console.error("Error parsing student ordering response:", e);
          }
        }

        // Check if we have a specific studentOrder from the server
        let studentOrderItems = [];
        if (studentOrder) {
          try {
            studentOrderItems = Array.isArray(studentOrder)
              ? studentOrder
              : JSON.parse(studentOrder);
          } catch (e) {
            console.error("Error parsing student order:", e);
          }
        }

        // Determine what items to display
        let itemsToDisplay = [];
        let hasStudentAnswer = false;

        // Priority: 1. studentOrder from API, 2. local studentResponse, 3. shuffled correctOrder
        if (studentOrderItems.length > 0) {
          // Use the studentOrder from the API
          itemsToDisplay = [...studentOrderItems];
          hasStudentAnswer = true;
        } else if (studentOrderResponse.length > 0) {
          // Use the parsed student response
          itemsToDisplay = [...studentOrderResponse];
          hasStudentAnswer = true;
        } else {
          // Shuffle the correctOrder for display
          itemsToDisplay = [...orderItems];

          // Ensure the shuffled order isn't the same as the correct order
          let shuffleAttempts = 0;
          let isSameAsCorrectOrder = true;

          while (isSameAsCorrectOrder && shuffleAttempts < 5) {
            // Shuffle the items
            itemsToDisplay = shuffleArray([...orderItems]);

            // Check if the shuffled order matches the correct order
            isSameAsCorrectOrder = itemsToDisplay.every(
              (item, index) => item === orderItems[index]
            );
            shuffleAttempts++;
          }

          // If after 5 attempts we still have the same order, force a change
          if (isSameAsCorrectOrder && itemsToDisplay.length > 1) {
            // Swap the first two elements to ensure it's different
            [itemsToDisplay[0], itemsToDisplay[1]] = [
              itemsToDisplay[1],
              itemsToDisplay[0],
            ];
          }
        }

        answerHtml = `
        <div class="ordering-question-container">
          <p class="ordering-instructions">
            ${hasStudentAnswer
            ? `<span class="previous-answer-flag"><i class="fas fa-info-circle"></i> You have previously answered this question. You can rearrange items if needed.</span>`
            : `Use the grip lines (≡) to drag items up or down into the correct sequence`
          }
          </p>
          <div class="ordering-items ${hasStudentAnswer ? "selected" : ""
          }" id="ordering-items-${index}" data-has-answer="${hasStudentAnswer}">
            ${itemsToDisplay
            .map(
              (item, i) => `
              <div class="ordering-item-wrapper">
                            <div class="ordering-item drag-handle-or" data-item-value="${item}">
                <div class="drag-handle"><i class="fas fa-grip-lines"></i></div>
                <div class="item-content">
                  <span class="ordering-item-text">${item}</span>
                </div>
              </div>
              </div>
            `
            )
            .join("")}
          </div>
        </div>
      `;
      } else if (question.type === "FTB") {
        answerHtml = question.blanks
          .map((blank) => {
            // Find the student's answer for this blank based on identity
            const studentBlank = question.studentBlanks?.find(
              (sb) => sb.identity === blank.identity
            );
            const studentAnswer = studentBlank ? studentBlank.answer : ""; // Get the student's saved answer

            return `
                ${blank.type === "dropdown"
                ? `
                    <div class="ftb-field">
                      <label><b>${blank.identity}️⃣</b></label>
                      <select class="ftb-dropdown" data-identity="${blank.identity
                }" data-valid-options='${JSON.stringify(
                  blank.values.map((opt) => opt.value)
                )}'>
                          <option value="" disabled ${!studentAnswer ? "selected" : ""
                }>Select an option</option>
                          ${blank.values
                  .map(
                    (opt) => `
                              <option value="${opt.value}" ${studentAnswer === opt.value ? "selected" : ""
                      }>
                                  ${opt.value}
                              </option>
                          `
                  )
                  .join("")}
                      </select>
                  </div>
                `
                : `
                    <div class="ftb-field">
                        <label><b>${blank.identity}️⃣</b></label>
                        <input type="text" class="ftb-text" data-identity="${blank.identity}" value="${studentAnswer}" placeholder="Please enter your answer"/>
                    </div>
                `
              }
            `;
          })
          .join("");
      } else if (question.type === "TAB") {
        // Handle table-based questions
        const tableData =
          question.table && question.table.length > 0
            ? question.table[0]
            : null;

        if (tableData && tableData.cells && tableData.cells.length > 0) {
          // Determine rows and columns for the table
          const numRows =
            tableData.rows || Math.ceil(Math.sqrt(tableData.cells.length));
          const numColumns =
            tableData.columns || Math.min(3, tableData.cells.length);

          // Generate the table HTML
          let tableHtml =
            '<div class="accountence-table-container"><table class="accountence-table">';

          let cellIndex = 0;
          const cellCount = tableData.cells.length;

          // Create rows and cells
          for (let r = 0; r < numRows && cellIndex < cellCount; r++) {
            tableHtml += "<tr>";

            for (let c = 0; c < numColumns && cellIndex < cellCount; c++) {
              // Generate cell ID (e.g., A1, B2, etc.)
              const cellId = String.fromCharCode(65 + c) + (r + 1);

              // Get cell data
              const cellData = tableData.cells[cellIndex];
              let cellClass = "editable-cell";
              let cellContent = cellData.value || "&nbsp;";

              // Check if this is a blank cell
              const isBlank = cellData.value === "[blank]";

              if (isBlank) {
                cellClass += " blank-cell";

                // Check if student has already answered this blank
                const studentBlank = studentBlanks?.find(
                  (blank) => blank.identity === cellId
                );

                if (studentBlank && studentBlank.answer) {
                  // Show the student's answer
                  cellContent = `<span class="answer-indicator">${studentBlank.answer}</span>`;
                } else {
                  // Show blank indicator
                  cellContent = '<span class="blank-indicator">[blank]</span>';
                }
              }

              tableHtml += `<td class="${cellClass}" data-cell-id="${cellId}" data-row="${r}" data-col="${c}">${cellContent}</td>`;
              cellIndex++;
            }

            tableHtml += "</tr>";
          }

          tableHtml += "</table></div>";

          // Create the blank input fields for answering
          let blanksForm = "";

          if (tableData.cells.some((cell) => cell.value === "[blank]")) {
            blanksForm = '<div class="tab-blanks-form">';

            // Find all blank cells and create input fields
            const blankCells = tableData.cells
              .map((cell, idx) => {
                if (cell.value === "[blank]") {
                  const r = Math.floor(idx / numColumns);
                  const c = idx % numColumns;
                  const cellId = String.fromCharCode(65 + c) + (r + 1);
                  return { cellId, index: idx };
                }
                return null;
              })
              .filter((cell) => cell !== null);

            // Create input fields for each blank
            blanksForm += '<div class="tab-blanks-container">';
            blankCells.forEach((blankCell) => {
              const studentBlank = studentBlanks?.find(
                (blank) => blank.identity === blankCell.cellId
              );
              const studentAnswer = studentBlank ? studentBlank.answer : "";

              blanksForm += `
              <div class="tab-blank-field">
                <label><span class="cell-tag">Cell</span> <b>${blankCell.cellId}</b></label>
                <input type="text" class="tab-blank-input" data-cell-id="${blankCell.cellId}" 
                  value="${studentAnswer}" placeholder="Enter answer for ${blankCell.cellId}"/>
              </div>
            `;
            });
            blanksForm += "</div>";
            blanksForm += "</div>";
          }

          // Combine table and blanks form
          answerHtml = `
          <div class="tab-question-container">
            ${tableHtml}
            ${blanksForm}
          </div>
        `;
        } else {
          // Fallback if no table data is available
          answerHtml =
            '<div class="error-message">Table data not available</div>';
        }
      } else if (question.type === "MTF") {
        // Extract question title and text for MTF questions
        questionText = question.question || "";

        if (questionText.endsWith("</p>")) {
          questionText = questionText.slice(0, -4);
        }

        if (questionText.startsWith("<p>")) {
          questionText = questionText.substring(3);
        }

        const emojiToken = "1️⃣";
        const tokenIndex = questionText.indexOf(emojiToken);

        if (tokenIndex !== -1) {
          questionTitle = questionText.substring(0, tokenIndex).trim();
          questionText =
            emojiToken +
            questionText.substring(tokenIndex + emojiToken.length).trim();
        } else {
          questionTitle = questionText.trim();
          questionText = "";
        }

        questionText = "<p>" + questionText;

        var content = questionText;
        if (content.startsWith("<p>")) {
          content = content.substring(3);
        }

        var regex = /(\d️⃣)(.*?)(?=\d️⃣|$)/g;
        var extractedMatches = [];
        var matchResult;

        while ((matchResult = regex.exec(content)) !== null) {
          var answerText = matchResult[2].trim();
          if (answerText) {
            extractedMatches.push(answerText);
          }
        }

        if (extractedMatches.length > 0) {
          questionText = "<p>" + questionTitle + "</p>";
        }

        const matchAnswers = question.blanks.map((match) => {
          return {
            identity: match.identity,
            answer: match.values[0].value,
          };
        });

        // Get student answers if they exist
        const studentBlanks = question.studentBlanks || [];
        // Create a shuffled copy of the answers
        let shuffledAnswers = [...matchAnswers];
        if (shuffleOptions && question.shouldShuffleOptions !== false) {
          for (let i = shuffledAnswers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledAnswers[i], shuffledAnswers[j]] = [
              shuffledAnswers[j],
              shuffledAnswers[i],
            ];
          }
        }

        // Create HTML for the matching UI
        answerHtml = `
        <div class="mtf-container">
          <div class="mtf-columns">
            <div class="mtf-column mtf-questions">
              <div class="mtf-column-header">Match</div>
              <div class="mtf-items">
                ${extractedMatches
            .map((question, idx) => {
              const identity = (idx + 1).toString();

              return `
                    <div class="mtf-question-item ${studentBlanks.find((blank) => blank.identity === identity)
                  ? "answered"
                  : ""
                }" data-identity="${identity}">
                      <div class="mtf-identity">${identity}️⃣</div>
                      <div class="mtf-question-text">${question}</div>
                      
                    </div>
                  `;
            })
            .join("")}
              </div>
            </div>
            <div class="mtf-column mtf-answers">
              <div class="mtf-column-header">Follow</div>
              <div class="mtf-items">
                ${shuffledAnswers
            .map((answer) => {
              const studentMatch = studentBlanks.find((blank) => {
                const expectedAnswer =
                  typeof answer?.answer === "string"
                    ? answer?.answer
                    : JSON.stringify(answer?.answer);
                return blank?.answer === expectedAnswer;
              });
              const matchedQuestion = studentMatch
                ? studentMatch.identity
                : "";

              return `
                    <div class="mtf-answer-item ${studentMatch ? "answered" : ""
                }" data-answer="${answer.answer}">
                      <div class="mtf-answer-text">${answer.answer}</div>
                      <div class="mtf-selected-answer" data-selected="${matchedQuestion}">${matchedQuestion + "\uFE0F\u20E3"
                }</div>
                    </div>
                  `;
            })
            .join("")}
              </div>  
            </div>
          </div>
        </div>
      `;

        // Add event handlers for the matching UI
        setTimeout(() => {
          $(`#question-${index} .mtf-question-item`).on("click", function () {
            // Toggle active state
            $(`#question-${index} .mtf-question-item`).removeClass("active");
            $(this).addClass("active");
          });

          $(`#question-${index} .mtf-answer-item`).on("click", function () {
            const answer = $(this).data("answer");
            const activeQuestion = $(
              `#question-${index} .mtf-question-item.active`
            );

            if (activeQuestion.length) {
              const identity = activeQuestion.data("identity");

              // Check if this question (identity) is already matched with another answer
              $(`#question-${index} .mtf-answer-item`).each(function () {
                const $selectedAnswerDiv = $(this).find(".mtf-selected-answer");
                if (
                  $selectedAnswerDiv.attr("data-selected") ===
                  identity.toString()
                ) {
                  // This question was previously matched to this answer item, clear it
                  $selectedAnswerDiv.text("");
                  $selectedAnswerDiv.attr("data-selected", "");
                  $(this).removeClass("answered");
                  // No need to remove from answers[index] here as it will be overwritten or set below
                }
              });

              // Check if this answer is already matched to a different question
              const $currentSelectedAnswerDiv = $(this).find(
                ".mtf-selected-answer"
              );
              const previouslySelectedQuestionIdentity =
                $currentSelectedAnswerDiv.attr("data-selected");

              if (
                previouslySelectedQuestionIdentity &&
                previouslySelectedQuestionIdentity !== identity.toString()
              ) {
                // This answer was matched to a different question, clear that question's 'answered' state
                $(
                  `#question-${index} .mtf-question-item[data-identity="${previouslySelectedQuestionIdentity}"]`
                ).removeClass("answered");
                // Remove the old association from the answers array
                if (
                  answers[index] &&
                  answers[index][previouslySelectedQuestionIdentity]
                ) {
                  delete answers[index][previouslySelectedQuestionIdentity];
                }
              }

              $(this)
                .find(".mtf-selected-answer")
                .text(identity + "\uFE0F\u20E3");
              $(this)
                .find(".mtf-selected-answer")
                .attr("data-selected", identity);

              // Update answers array for saving
              if (!answers[index]) {
                answers[index] = {};
              }

              if (typeof answers[index] === "string") {
                answers[index] = {};
              }

              answers[index][identity] =
                typeof answer === "string" ? answer : JSON.stringify(answer);

              // Mark as changed and add to selected class

              isAnswerChanged = true;
              activeQuestion.removeClass("active");

              $(this).addClass("answered");
              activeQuestion.addClass("answered");

              // Update the UI to show this question has been answered
              $(`.filter-numbers button[data-index=${index}]`).addClass(
                "selected"
              );
              $(`.filter-numbers button[data-index=${index}]`).attr(
                "data-answer-saved",
                "false"
              );
            }
          });
        }, 500);
      } else if (question.type === "UD") {
        // Document Upload interface
        answerHtml = `
            <textarea placeholder="Please Type Answers Here..." class="saq-input">${studentResponse || ""
          }</textarea>
                <div class="file-upload-container">
                    <div class="upload-area">
                        <input type="file" class="file-input du-file-input" accept=".pdf,.doc,.docx" id="du-input-${index}" />
                        <label for="du-input-${index}" class="upload-label">
                            <div class="upload-content">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <span class="browse-text">Browse Files</span>
                                <div class="supported-text">Supported formats: PDF, DOC, DOCX</div>
                            </div>
                        </label>
                    </div>
                                       <div class="accordion">
                        ${question.studentattachment &&
            question.studentattachment.length > 0
            ? question.studentattachment
              .map(
                (attachment, i) => `
                                <div class="accordion-item">
                                    <div class="accordion-header doc-accordion-header" id="doc-hdr-${index}-${i}" data-url="${attachment?.url
                  }" data-question-index="${index}" data-attachment-index="${i}">
                                        Document ${i + 1}
                                        <span class="arrow"></span>
                                    </div>
                                    <div class="accordion-content doc-accordion-content" id="doc-content-${index}-${i}">
                                        <!-- iframe will be loaded here on open -->
                                    </div>
                                </div>
                            `
              )
              .join("")
            : ""
          }

                    </div>
                </div>
            `;
        initiateCkEditor(".saq-input");
      } else if (question.type === "IR") {
        // Image Response interface with camera option
        answerHtml = `
              <textarea placeholder="Please Type Answers Here..." class="saq-input">${studentResponse || ""
          }</textarea>
                <div class="file-upload-container">
                    <div class="upload-methods">
                        <div class="upload-method">
                            <div class="upload-area" style="">
                                <input type="file" class="file-input ir-file-input" accept="image/*" id="ir-input-${index}" />
                                <label for="ir-input-${index}" class="upload-label">
                                    <div class="upload-content">
                                        <i class="fas fa-cloud-upload-alt"></i>
                                        <span class="browse-text">Browse Files</span>
                                        <div class="supported-text">Supported formats: JPEG, JPG, PNG</div>
                                    </div>
                                </label>
                            </div>
                        </div>
        
                        <div class="upload-divider">
                            <span>or</span>
                        </div>
        
                        <div class="upload-method">
                            <button type="button" class="camera-button" onclick="startIRCamera(${index})">
                                <i class="fas fa-camera"></i>
                                <span>Take Photo</span>
                            </button>
                        </div>
                    </div>
        
                    <div class="camera-container" id="camera-container-${index}" style="display: none;">
                        <div class="camera-preview-wrapper">
                            <video id="camera-preview-${index}" autoplay playsinline></video>
                            <canvas id="camera-canvas-${index}" style="display: none;"></canvas>
                        </div>
                        <div class="camera-controls">
                            <button type="button" class="capture-btn"  data-question='${JSON.stringify(
            question
          )}' onclick="captureIRPhoto(${index},this)">
                                <i class="fas fa-camera"></i> Capture
                            </button>
                            <button type="button" class="cancel-btn" onclick="stopIRCamera(${index})">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    </div>
        
                    <div class="accordion">
                        ${question.studentattachment
            ?.map(
              (attachment, i) => `
                            <div class="accordion-item">
                                <div class="accordion-header" id="hdr-${index}-${i}" onclick="initAccordion(${index}, ${i})">
                                    Image ${i + 1}
                                    <span class="arrow"></span>
                                </div>
                                <div class="accordion-content" >
                                    <img 
                                        id="image-${index}-${i}" 
                                        alt="Uploaded Image ${i + 1}" 
                                        class="preview-image"
                                        onerror="handleImageError(this)"
                                        data-original-src="${attachment?.url}"
                                    />
                                </div>
                            </div>
                        `
            )
            .join("")}
                    </div>
                </div>
            `;
        initiateCkEditor(".saq-input");
      } else if (question.type === "PRQ") {
        // Handle display of code editor for PRQ questions
        if (editor && typeof getCodeEditorResponse === "function") {
          const currentEditorValue = getCodeEditorResponse();
          if (currentEditorValue && currentQuestionIndex !== index) {
            // Save the current value to the answers array before switching
            answers[currentQuestionIndex] = currentEditorValue;
          }
        }

        // Clean up any previous containers
        $(".question-section-container > .prq-container").remove();

        // Extract the question text
        const questionText = questions[index].question;
        const programmingLanguage =
          questions[index].programmingLanguage || "JavaScript";

        // Create a new PRQ container to display above the editor
        const prqHTML = `
        <div class="prq-container">
          <div class="prq-header">
            <h3>Programming Question</h3>
          </div>
          <div class="prq-info">
            <div class="prq-language">Programming Language: <strong>${programmingLanguage}</strong></div>
            <div class="prq-question">${questionText}</div>
            <div class="prq-instructions">Write your code in the editor below. You can run your code to test your solution.</div>
          </div>
        </div>
      `;

        // Position the PRQ container above the editor
        $(".editor-attachment-main-container").before(prqHTML);

        // Show code editor container
        $(".editor-attachment-main-container").show();

        // Ensure proper layout
        $(".question-section-container").addClass("has-code-editor");

        // Hide only the question content, keep QR codes and attachments visible
        $(`#question-${index} .question-content`).hide();

        // Initialize or update the code editor with the current question
        renderCodeEditor(questions[index], function (code) {
          // Callback function to be executed when code is updated/saved
          if (code) {
            answers[index] = code;
            isAnswerChanged = true;
            $(`.filter-numbers button[data-index=${index}]`).addClass(
              "selected"
            );
            $(`.filter-numbers button[data-index=${index}]`).attr(
              "data-answer-saved",
              "false"
            );
          }
        });
      } else {
        // Default (SAQ)
        answerHtml = `<textarea placeholder="Please Type Answers Here..." style="width:10%" class="saq-input">${studentResponse || ""
          }</textarea>`;
        initiateCkEditor(".saq-input");
      }
    }

    // Append a new question section with the constructed answer UI.
    $(".question-section-container").append(`
          <div class="question-section" id="question-${index}" style="display: none;">
              <div class="question-content">
                  <div class="question-header" translate="no">
                      <div translate="no">${replaceBlanksInQuestion(
      questionTitle || question.question,
      answers[index] || {}
    )}</div>${attachmentIcon}
                  </div> 
                  ${question?.meta?.["student-responce-type"]?.[
        "digital-writing"
      ]
        ? `
                  <div class="digital-ink-notification">
                     <i class="fa fa-info-circle"></i>
                     <p class="digital-link-info-text">Digital writing feature is enabled for this question. You can write on the screen using your finger or a stylus.</p>
                  </div>
                  `
        : ""
      }
                  <div class="choices">
                      ${answerHtml} 
                  </div>
              </div>
              ${qrCodeHtml}
              ${hasAttachments ? renderAttachments(question.attachments,question.type,attachmentIcon) : ""}
          </div>
      `);

    // After appending, generate the QR code if the placeholder exists
    if (qrCodeHtml) {
      const placeholder = document.getElementById(
        `qr-code-placeholder-${index}`
      );
      const urlParams = new URLSearchParams(window.location.search);
      const examid = urlParams.get("examid");
      const attender_id = urlParams.get("attender_id");
      const qid = question._id;
      if (placeholder && examid && attender_id && qid) {
        const domain = window.location.origin;
        const scanUrl = `${domain}/fullscreenexam/paper-scan/plain.html?examid=${examid}&attender_id=${attender_id}&qid=${qid}&a=1`;
        generateQRCode(placeholder, scanUrl);
      }
    }

    // Add event listeners for FTB fields
    $(`#question-${index} .ftb-dropdown, #question-${index} .ftb-text`).on(
      "change input",
      function () {
        isAnswerChanged = true;
        const responses = {};
        $(this)
          .closest(".choices")
          .find(".ftb-dropdown, .ftb-text")
          .each(function () {
            const identity = $(this).data("identity");
            responses[identity] = $(this).val();
          });

        answers[index] = responses;

        // Update question text with responses
        const questionHeader = $(this)
          .closest(".question-section")
          .find(".question-header div:first");
        const originalQuestion = questions[index].question;
        questionHeader.html(
          replaceBlanksInQuestion(originalQuestion, responses)
        );

        $(`.filter-numbers button[data-index=${index}]`).addClass("selected");
        $(`.filter-numbers button[data-index=${index}]`).attr(
          "data-answer-saved",
          "false"
        );
      }
    );

    if (question?.meta?.["student-responce-type"]?.["digital-writing"]) {
      // Use setTimeout to ensure DOM is fully ready
      setTimeout(() => {
        const containerElement = document.querySelector(
          `#digital-ink-container-${index}`
        );

        if (!containerElement) {
          return;
        }

        // Wait for container to be visible and properly sized
        const initWidget = () => {
          if (
            containerElement.offsetWidth === 0 ||
            containerElement.offsetHeight === 0
          ) {
            setTimeout(initWidget, 100);
            return;
          }

          try {
            // Determine if widget should be editable based on exam state
            const isExamActive = true; // Replace with actual exam state logic
            const isReviewMode = false; // Replace with actual review mode logic

            let widget = new SketchWidget(containerElement, {
              width: "100%",
              height: "100%",
              tools: ["pencil", "pen", "marker", "eraser", "lasso", "ruler"],
              colors: [
                "#000000",
                "#FF3B30",
                "#007AFF",
                "#34C759",
                "#FF9500",
                "#FFCC00",
              ],
              exportFormat: "json",
              showToolbar: true,
              toolbarPosition: "floating", // Can be 'top', 'bottom', 'left', 'right', 'floating'
              toolbarOrientation: "horizontal", // 'horizontal' or 'vertical'
              toolbarDraggable: true, // Allow dragging toolbar
              toolbarCollapsible: true,
              toolbarCollapsed: false,
              editable: isExamActive && !isReviewMode, // Editable only during active exam
              readOnly: !isExamActive || isReviewMode, // Read-only in review mode or inactive exam
            });

            // Wait for widget to be ready before loading strokes
            widget.waitForReady().then(() => {
              widget.loadStrokes(question?.studentDigitalInk || []);
            });

            // Store widget reference for later use
            digitalWritingWidgets.set(index, widget);
          } catch (error) {
            console.error("Error initializing SketchWidget:", error);
          }
        };

        initWidget();
      }, 1000); // Increased timeout to ensure DOM is ready
    }

    // Add event listeners for TAB question blanks
    if (question.type === "TAB") {
      // Handle input in blank fields
      $(`#question-${index} .tab-blank-input`).on("change input", function () {
        isAnswerChanged = true;
        const cellId = $(this).data("cell-id");
        const value = $(this).val();

        // Initialize answers object if needed
        if (!answers[index] || typeof answers[index] !== "object") {
          answers[index] = {};
        }

        // Store the answer by cell ID
        answers[index][cellId] = value;

        // Update the cell in the table to show the answer
        const $cell = $(`#question-${index} td[data-cell-id="${cellId}"]`);

        if (value.trim() !== "") {
          // Show the answer in the cell
          $cell.html(`<span class="answer-indicator">${value}</span>`);
        } else {
          // If empty, show blank indicator
          $cell.html('<span class="blank-indicator">[blank]</span>');
        }

        // Mark question as answered and unsaved
        $(`.filter-numbers button[data-index=${index}]`).addClass("selected");
        $(`.filter-numbers button[data-index=${index}]`).attr(
          "data-answer-saved",
          "false"
        );
      });

      // Handle clicks on table cells for better UX
      $(`#question-${index} .blank-cell`).on("click", function () {
        const cellId = $(this).data("cell-id");
        // Focus on the corresponding input field
        $(
          `#question-${index} .tab-blank-input[data-cell-id="${cellId}"]`
        ).focus();
      });
    }

    // For UD type
    if (question.type === "UD") {
      $(`#du-input-${index}`).on("change", function () {
        isAnswerChanged = true;
        const files = this.files;

        if (files.length > 0) {
          // Initialize or get existing attachments array
          if (!answers[index] || typeof answers[index] !== "object") {
            answers[index] = { attachments: [] };
          }
          answers[index].attachments = answers[index].attachments || [];
          if (!allowedFileTypes.includes(files[0].type)) {
            toastr.error(
              "Invalid file type. Only document formats (PDF, DOC, DOCX) are allowed.",
              "error"
            );
            return;
          }

          // Process each file
          Array.from(files).forEach((file, i) => {
            // Add timestamp to file name
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const fileExtension = file.name.split(".").pop();
            const baseFileName = file.name.substring(
              0,
              file.name.lastIndexOf(".")
            );
            const timestampedFileName = `${baseFileName}_${timestamp}`;

            // Create a new file object with the timestamped name (without extension)
            const timestampedFile = new File(
              [file],
              `${timestampedFileName}.${fileExtension}`,
              {
                type: file.type,
              }
            );
            const fileObj = {
              file: timestampedFile,
              fileName: timestampedFileName,
            };

            uploadFileForQuestion(studentId, fileObj)
              .then((signedUrl) => {
                // Add to attachments array
                answers[index].attachments.push({
                  fileType: file?.type?.split("/")[1],
                  fileName: `${timestampedFileName}`,
                });
                // Update accordion with new document item
                const accordionContainer = $(`#question-${index} .accordion`);
                const docIndex =
                  accordionContainer.find(".accordion-item").length;
                const completeUrl = `${CONFIG.BUCKET}/${CONFIG.FOLDERNAME}/${studentId}/${timestampedFileName}.${fileExtension}`;

                accordionContainer.append(`
                  <div class="accordion-item">
                    <div class="accordion-header doc-accordion-header" id="doc-hdr-${index}-${docIndex}" data-url="${completeUrl}" data-question-index="${index}" data-attachment-index="${docIndex}">
                      Document ${docIndex + 1}
                      <span class="arrow"></span>
                    </div>
                    <div class="accordion-content doc-accordion-content" id="doc-content-${index}-${docIndex}">
                      <!-- iframe will be loaded here on open -->
                    </div>
                  </div>
                `);

                $(`.filter-numbers button[data-index=${index}]`).addClass(
                  "selected"
                );
                $(`.filter-numbers button[data-index=${index}]`).attr(
                  "data-answer-saved",
                  "false"
                );

                isAnswerChanged = true;
                saveResponse();
              })
              .catch((error) => {
                console.error("Error processing UD file:", error);
              });
          });
        }
      });
    }

    // For IR type
    if (question.type === "IR") {
      $(`#ir-input-${index}`).on("change", function () {
        isAnswerChanged = true;
        const files = this.files;

        if (files.length > 0) {
          // Initialize or get existing attachments array
          if (!answers[index] || typeof answers[index] !== "object") {
            answers[index] = { attachments: [] };
          }
          answers[index].attachments = answers[index].attachments || [];

          if (!allowedImageTypes.includes(files[0].type)) {
            toastr.error(
              "Invalid file type. Only image formats (JPEG, PNG, JPG) are allowed.",
              "error"
            );
            return;
          }

          // Process each file
          Array.from(files).forEach((file) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            let fileExtension = file.name.split(".").pop().toLowerCase();
            const baseFileName = file.name.substring(
              0,
              file.name.lastIndexOf(".")
            );
            const timestampedFileName = `${baseFileName}_${timestamp}`;
            const finalFileName = `${timestampedFileName}.${fileExtension}`;

            // Create a new file object with fixed extension
            const timestampedFile = new File([file], finalFileName, {
              type: file.type,
            });

            const fileObj = {
              file: timestampedFile,
              fileName: timestampedFileName,
            };

            uploadFileForQuestion(studentId, fileObj)
              .then((signedUrl) => {
                // Add to attachments array
                answers[index].attachments.push({
                  fileType: fileExtension,
                  fileName: timestampedFileName,
                });

                // Append new accordion item
                const accordionContainer = $(`#question-${index} .accordion`);
                const imageIndex =
                  accordionContainer.find(".accordion-item").length;

                const completeUrl = `${CONFIG.BUCKET}/${CONFIG.FOLDERNAME}/${studentId}/${finalFileName}`;

                accordionContainer.append(`
              <div class="accordion-item">
                <div class="accordion-header" id="hdr-${index}-${imageIndex}" onclick="initAccordion(${index}, ${imageIndex})">
                  Image ${imageIndex + 1}
                  <span class="arrow"></span>
                </div>
                <div class="accordion-content">
                  <div class="loading">Loading image...</div>
                  <img 
                    id="image-${index}-${imageIndex}" 
                    alt="Uploaded Image ${imageIndex + 1}" 
                    class="preview-image"
                    onerror="handleImageError(this)"
                    data-original-src="${completeUrl}"
                    data-file-name="${file.name}"
                  />
                </div>
              </div>
            `);

                // Update UI state
                $(`.filter-numbers button[data-index=${index}]`).addClass(
                  "selected"
                );
                $(`.filter-numbers button[data-index=${index}]`).attr(
                  "data-answer-saved",
                  "false"
                );

                isAnswerChanged = true;
                saveResponse();
              })
              .catch((error) => {
                console.error("Error processing IR file:", error);
              });
          });
        }
      });
    }

    // For OR type - initialize sortable functionality
    if (question.type === "OR") {
      // Initialize after a slight delay to ensure the DOM is ready
      setTimeout(() => {
        $(`#ordering-items-${index}`)
          .sortable({
            items: ".ordering-item-wrapper",
            handle: ".ordering-item",
            placeholder: "ordering-item-placeholder",
            cursor: "grabbing",
            tolerance: "pointer",
            axis: "y",
            revert: 200,
            helper: function (e, item) {
              // Create a helper that maintains width
              const helper = $(item).clone();
              helper.width($(item).width());
              helper.height($(item).height());
              return helper;
            },
            opacity: 0.8,
            start: function (e, ui) {

              // Add styling to the item being dragged
              ui.helper.addClass("dragging-item");
              // Create a nice placeholder
              ui.placeholder.html(
                '<div class="placeholder-text">Drop here</div>'
              );
              ui.placeholder.css("height", ui.item.outerHeight());
            },
            stop: function (e, ui) {
              ui.item.removeClass("dragging-item");
            },
            update: function (event, ui) {
              // Get the new order
              const newOrder = [];
              $(this)
                .find(".ordering-item")
                .each(function () {
                  newOrder.push($(this).data("item-value"));
                });

              // Get previous order if any
              let previousOrder = null;
              if (answers[index]) {
                try {
                  previousOrder = JSON.parse(answers[index]);
                } catch (e) {
                  console.error("Error parsing previous order:", e);
                }
              }

              // Check if the order has changed from previous answer
              let hasChanged = false;
              if (previousOrder && Array.isArray(previousOrder)) {
                hasChanged =
                  JSON.stringify(newOrder) !== JSON.stringify(previousOrder);
              }

              // Save the new order as the student's response
              answers[index] = JSON.stringify(newOrder);
              isAnswerChanged = true;

              // Add a visual indicator for changed answer if needed
              if (hasChanged && $(this).data("has-answer") === "true") {
                if (!$(this).find(".answer-changed").length) {
                  $(this).append(
                    '<div class="answer-changed" title="Answer changed"><i class="fas fa-exclamation"></i></div>'
                  );
                }
                // Mark the question filter number as having a changed answer
                $(`.filter-numbers button[data-index=${index}]`).attr(
                  "data-answer-changed",
                  "true"
                );
              }

              // Update the UI to show the question has been answered
              $(`.filter-numbers button[data-index=${index}]`).addClass(
                "selected"
              );
              $(`.filter-numbers button[data-index=${index}]`).attr(
                "data-answer-saved",
                "false"
              );
            },
          })
          .disableSelection(); // Prevent text selection during drag
      }, 500);
    }

    // In the question initialization section (renderQuestions function)
    if (
      studentResponse ||
      studentBlanks ||
      studentattachment ||
      studentOrder ||
      studentDigitalInk
    ) {
      let hasValidAnswer = false;

      // Handle different question types based on their response structure
      if (question.type === "FTB" || question.type === "MTF") {
        if (studentBlanks && studentBlanks.length > 0) {
          answers[index] = {};
          studentBlanks.forEach((blank) => {
            answers[index][blank.identity] = blank.answer;
          });
          hasValidAnswer = true;
        }
      } else if (question.type === "TAB") {
        if (studentBlanks && studentBlanks.length > 0) {
          answers[index] = {};
          studentBlanks.forEach((blank) => {
            answers[index][blank.identity] = blank.answer;
          });
          hasValidAnswer = true;
        }
      } else if (question.type === "OR") {
        if (studentOrder && studentOrder.length > 0) {
          answers[index] = JSON.stringify(studentOrder);
          hasValidAnswer = true;
        } else if (studentResponse && studentResponse.trim() !== "") {
          answers[index] = studentResponse.toString();
          hasValidAnswer = true;
        }
      } else if (question.type === "IR" || question.type === "UD") {
        if (
          (studentattachment && studentattachment.length > 0) ||
          (studentResponse && studentResponse.trim() !== "")
        ) {
          answers[index] = {};
          if (studentattachment && studentattachment.length > 0) {
            answers[index].attachments = studentattachment;
            hasValidAnswer = true;
          }
          if (studentResponse && studentResponse.trim() !== "") {
            answers[index].textResponse = studentResponse.toString();
            hasValidAnswer = true;
          }
        }
      } else if (studentResponse && studentResponse.trim() !== "") {
        // Handle all other question types (MCQ, TF, SAQ, PRQ, etc.)
        answers[index] = studentResponse.toString();
        hasValidAnswer = true;
      } else if (studentDigitalInk && studentDigitalInk?.length > 0) {
        answers[index] = studentDigitalInk;
        hasValidAnswer = true;
      }

      // Mark as selected and saved if there's a valid answer
      if (hasValidAnswer) {
        $(`.filter-numbers button[data-index=${index}]`).addClass("selected");
        // Mark pre-existing answers as saved
        $(`.filter-numbers button[data-index=${index}]`).attr(
          "data-answer-saved",
          "true"
        );
      }
    }

    // setTimeout(focusHandler, 1500);
  });
}

function renderAttachments(attachments,questionType,attachmentIcon) {
  return `${questionType === "PRQ" ? attachmentIcon:""}
    <div class="attachment-content ${questionType === "PRQ"?"attachment-wrapper":""}" data-attachmentCount="${attachments.length
    }">
      ${attachments
      .map((attachment) => {
        const encodedData = JSON.stringify(attachment).replace(
          /"/g,
          "&quot;"
        );
        if (attachment.type === "image") {
          return `
            <div class="attachment">
              <img src="${attachment.url}" alt="${attachment.name}" data-url="${attachment.url}" class="attachment-image" onerror="handleImageError(this)"/>
              <span class="zoom-icon" data-url="${encodedData}">🔍</span>
            </div>`;
        } else if (attachment.type === "audio") {
          return `
            <div class="attachment">
              <audio controls src="${attachment.url}"  onerror="handleImageError(this)"></audio>
              <span class="zoom-icon" data-url="${encodedData}">🔍</span>
            </div>`;
        } else if (attachment.type === "application" || attachment.type === "pdf") {
          const iframeId = `pdf-frame-${Date.now()}`;

          setTimeout(() => {
            const $frame = $(`#${iframeId}`);
            if ($frame.length && $frame.attr("data-retry") !== "true") {
              handleImageError($frame[0]);
            }
          }, 100); // Adjust if needed

          return `
    <div class="attachment">
      <div class="attachment-resume">
        <iframe id="${iframeId}" src="${attachment.url}" type="application/pdf" class="pdf-frame" width="100%" height="150px"></iframe>
      </div>
      <span class="zoom-icon" data-url="${encodedData}">🔍</span>
    </div>`;
        } else {
          return "";
        }
      })
      .join("")}
    </div>
  `;
}

// Initialize ClassicEditor for SAQ fields
function initiateCkEditor(ckData) {
  setTimeout(() => {
    $(ckData)
      .not('[data-initialized="true"]')
      .each(function () {
        const element = $(this);
        // Use CKEditor when isEnableWirisEditor is true
        ClassicEditor.create(element[0], {
          toolbar: {
            items: [
              "undo",
              "redo",
              "|",
              "bold",
              "italic",
              "|",
              "numberedList",
              "bulletedList",
              "|",
              "MathType",
              "ChemType",
              "|",
              "subscript",
              "superscript",
              "specialCharacters",
              "|",
            ],
          },
          image: {
            toolbar: [
              "imageTextAlternative",
              "imageStyle:full",
              "imageStyle:side",
            ],
          },
          table: {
            contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
          },
        })
          .then((editor) => {
            const currentQuestionIndex = element
              .closest(".question-section")
              .attr("id")
              .split("-")[1];

            editor.setData(element.val());
            element.data("ckeditorInstance", editor);
            element.attr("data-initialized", "true");

            // Handle data changes
            editor.model.document.on("change:data", () => {
              element.val(editor.getData());
              isAnswerChanged = true;
              answers[currentQuestionIndex] = editor.getData().toString();
              $(
                `.filter-numbers button[data-index=${currentQuestionIndex}]`
              ).addClass("selected");
              $(
                `.filter-numbers button[data-index=${currentQuestionIndex}]`
              ).attr("data-answer-saved", "false");
            });

            // Additional focus handling for WIRIS math editor (if needed)
            editor.plugins.get("MathType").on("wirisModalOpened", () => {
              element.closest(".ftb-field-input").addClass("ftb-input-focus");
            });

            editor.plugins.get("MathType").on("wirisModalClosed", () => { });
          })
          .catch((error) => {
            console.error(
              "There was a problem initializing the editor.",
              error
            );
          });
      });
  }, 1000);
}

// Toggle Open/Close from the main button
$(document).on("click", ".open-attachments", function () {
  const $panel = $("#exam-attachment-sidpanel-data");
  const $overlay = $("#attachment-blurOverlay");
  const $this = $(this);
  const attachments = $this.data("attachments");

  // If panel already open
  if ($panel.hasClass("open") && $this.hasClass("active-attachment-btn")) {
    $panel.removeClass("open");
    $overlay.hide();
    setTimeout(() => {
      $panel.find(".choice-attachment-container").html("");
    }, 300);
    $this.removeClass("active-attachment-btn")
      .find(".open-choice-attachment-text").html("▶ Open Attachment");
  }
  else {
    // Always reset all other buttons first
    $(".open-attachments")
      .removeClass("active-attachment-btn")
      .find(".open-choice-attachment-text").html("▶ Open Attachment");

    // If no attachments, do nothing
    if (!attachments || !attachments.length) return;
    const attachmentsHtml = renderChoiceAttachments(attachments);
    $panel.find(".choice-attachment-container").html(attachmentsHtml);
    $panel.addClass("open");
    $overlay.show();
    $this.addClass("active-attachment-btn")
      .find(".open-choice-attachment-text").html("▼ Close Attachment");
  }
});


// Close panel from a separate close button

$(document).on("click", ".close-attachment-panel", function () {
  const $panel = $("#exam-attachment-sidpanel-data");
  const $overlay = $("#attachment-blurOverlay");

  $panel.removeClass("open");
  $overlay.hide();
  setTimeout(() => {
    $panel.find(".choice-attachment-container").html("");
  }, 300);

  // Optional: reset any toggle button state (if you have a reference to it)
  $(".open-choice-attachment-text").html("▶ Open Attachment");
});

$(document).on("mousedown", function (e) {
  const $panel = $("#exam-attachment-sidpanel-data");

  // Whitelist selectors where clicking should NOT close the panel
  const isSafeClick =
    $(e.target).closest(".open-attachments").length || // toggle button
    $(e.target).closest(".attachment-icon").length;    // attachment icon

  if (
    $panel.hasClass("open") &&
    !$panel[0].contains(e.target) &&
    !isSafeClick
  ) {
    $panel.removeClass("open");
    $("#attachment-blurOverlay").hide();
    setTimeout(() => {
      $panel.find(".choice-attachment-container").empty();
    }, 300);
    $(".open-choice-attachment-text").text("▶ Open Attachment");
  }
});




function renderChoiceAttachments(attachments) {
  if (!attachments || !attachments.length) return "";
  return `
        <div class="choice-attachment-content">
            ${attachments
      .map((attachment) => {
        const encodedData = JSON.stringify(attachment).replace(
          /"/g,
          "&quot;"
        );
        if (attachment.type === "image") {
          return `
                <div class="attachment">
                    <img src="${attachment.url}" alt="${attachment.name}" data-url="${attachment.url}" class="attachment-image" style="max-width: 100%; max-height: 100%;" onerror="handleImageError(this)"/>
                     <span class="zoom-icon" data-url="${encodedData}">🔍</span>
                </div>
            `;
        } else if (attachment.type === "audio") {
          return `  <div class="attachment">
                     <audio controls src="${attachment.url}"  onerror="handleImageError(this)"></audio>
                    <span class="zoom-icon" data-url="${encodedData}">🔍</span>
                              </div>`;
        } else if (attachment.type === "application") {
          return `  <div class="attachment">
                      <div class="attachment-resume">
            <object data="${attachment.url}" type="application/pdf" onerror="handleImageError(this)">
              <p>Your browser doesn't support PDF preview.</p>
            </object>
          </div>
             <span class="zoom-icon" data-url="${encodedData}">🔍</span>
                              </div>`;
        }
      })
      .join("")}
        </div>
    `;
}

function renderSidebar() {
  $(".filter-numbers").html(
    questions
      .map(
        (question, i) => `
        <button data-index="${i}" data-qtype="${question.type}">${i + 1
          }</button>
    `
      )
      .join("")
  );

  $(".filter-numbers").on("click", "button", async function () {
    const getLang = localStorage.getItem("lang") || "en";

    // Capture digital writing data before proceeding
    await captureDigitalInk(currentQuestionIndex);

    // Check if current question needs to be answered before navigation
    if (!isQuestionAnswered(currentQuestionIndex)) {
      ShowToAnswer();
      return false;
    }

    if (isAnswerChanged) {
      try {
        await saveResponseForQuestion(currentQuestionIndex);
      } catch (error) {
        console.error("Failed to save response:", error);
      }
    }

    if (questionStartTime) {
      const duration = Math.round((new Date() - questionStartTime) / 1000); // Duration in seconds
      videoUploadLog(
        `Question ${currentQuestionIndex + 1} duration: ${duration} seconds`,
        "exam"
      );
    }

    // Log the next button click and current state
    videoUploadLog(
      `Question ${currentQuestionIndex + 1
      } button clicked - Current Question: ${currentQuestionIndex + 1
      }, Total Questions: ${questions.length}`,
      "exam"
    );
    videoUploadLog(
      `Current Answer: ${JSON.stringify(answers[currentQuestionIndex])}`,
      "exam"
    );

    try {
      await saveUnsavedResponsesFromDOM();
    } catch (error) {
      console.error("Failed to save unsaved responses from DOM:", error);
    }

    currentQuestionIndex = $(this).data("index");
    showQuestion(currentQuestionIndex);

    if (currentQuestionIndex === questions.length - 1) {
       $("#next-btn-lang").hide()
      $("#submit-btn-lang").show()
    } else {
            $("#next-btn-lang").show()
      $("#submit-btn-lang").hide()
    }
  });
  // renderLanguage('../exam-portal/translations/')
}

function showQuestion(index) {
  $(".question-section").hide();
  $(`#question-${index}`).show();
  $(".filter-numbers button").removeClass("active");
  $(`.filter-numbers button[data-index=${index}]`).addClass("active");

  const isEnglish = localStorage.getItem("lang") === "en";

  if (isEnglish) {
    $("#question-count").html(
      `<span>${index + 1} <span class="of">OF</span> ${questions.length
      } <span class="questions-out-of">QUESTIONS</span></span>`
    );
  } else {
    $("#question-count").html(
      `<span>${index + 1} <span class="of">من</span> ${questions.length
      } <span class="questions-out-of">الأسئلة</span></span>`
    );
  }

  questionStartTime = new Date();

  // Auto-fetch student attachments for questions with scan-and-edit or webcam-capture
  const currentQuestion = questions[index];
  if (currentQuestion) {
    const requiresScanAndEdit =
      currentQuestion.meta?.["student-responce-type"]?.["scan-and-edit"];
    const requiresWebcamCapture =
      currentQuestion.meta?.["student-responce-type"]?.["webcam-capture"];
    const reqquiresAudioRecord =
      currentQuestion.meta?.["student-responce-type"]?.["audio-response"];

    if (requiresScanAndEdit || requiresWebcamCapture || reqquiresAudioRecord) {
      fetchAndRenderStudentAttachments(currentQuestion._id, index);
    }
  }

  const selectedChoice = answers[index];

  // Handle display of code editor for PRQ questions
  if (
    questions[index]?.type === "PRQ" &&
    !questions[index]?.meta?.["student-responce-type"]?.["digital-writing"]
  ) {
    // Save the current editor value if we're switching from another PRQ question
    if (editor && typeof getCodeEditorResponse === "function") {
      const currentEditorValue = getCodeEditorResponse();
      if (currentEditorValue && currentQuestionIndex !== index) {
        // Save the current value to the answers array before switching
        answers[currentQuestionIndex] = currentEditorValue;
      }
    }

    // Clean up any previous containers
    $(".question-section-container > .prq-container").remove();

    // Extract the question text
    const questionText = questions[index].question;
    const programmingLanguage =
      questions[index].programmingLanguage || "JavaScript";

    // Create a new PRQ container to display above the editor
    const prqHTML = `
      <div class="prq-container">
        <div class="prq-header">
          <h3>Programming Question </h3>
          </div>
          <div class="prq-info">
          <div class="prq-language">Programming Language: <strong>${programmingLanguage}</strong></div>
          <div class="prq-question">${questionText}</div>
          <div class="prq-instructions">Write your code in the editor below. You can run your code to test your solution.</div>
        </div>
      </div>
    `;

    // Position the PRQ container above the editor
    $(".editor-attachment-main-container").before(prqHTML);

    // Show code editor container
    $(".editor-attachment-main-container").show();

    // Ensure proper layout
    $(".question-section-container").addClass("has-code-editor");

    // Show the question section but hide only the question content, keep QR codes and attachments visible
    $(`#question-${index}`).show();
    $(`#question-${index} .question-content`).hide();

    // Initialize or update the code editor with the current question
    renderCodeEditor(questions[index], function (code) {
      // Callback function to be executed when code is updated/saved
      if (code) {
        answers[index] = code;
        isAnswerChanged = true;
        $(`.filter-numbers button[data-index=${index}]`).addClass("selected");
        $(`.filter-numbers button[data-index=${index}]`).attr(
          "data-answer-saved",
          "false"
        );
      }
    });
  } else {
    // For non-PRQ questions, show the original question
    $(`#question-${index}`).show();
    // Make sure question content is also visible for non-PRQ questions
    $(`#question-${index} .question-content`).show();

    // Hide code editor for non-PRQ questions
    $(".editor-attachment-main-container").hide();
    $(".question-section-container").removeClass("has-code-editor");

    // Remove any previously added PRQ containers
    $(".question-section-container > .prq-container").remove();
  }
}

async function saveResponse() {
  // If the user changed the answer on the *current* question,
  // or if the current question was previously unsaved,
  // then re-save. Otherwise skip.
  if (!isAnswerChanged && !unsavedAnswers.includes(currentQuestionIndex)) {
    return; // No need to save again
  }

  // Mark that we tried saving so isAnswerChanged resets
  isAnswerChanged = false;

  try {
    await saveResponseForQuestion(currentQuestionIndex);
  } catch (error) {
    console.error("Failed to save response:", error);
  }
}

function ShowToAnswer() {
  const isEnglish = localStorage.getItem("lang") === "en";
  const currentQuestion = questions[currentQuestionIndex];

  // Get specific message based on question type
  let specificMessage = "";
  if (currentQuestion) {
    switch (currentQuestion.type) {
      case "MCQ":
        specificMessage = isEnglish
          ? "Please select one of the multiple choice options."
          : "يرجى اختيار أحد خيارات الاختيار المتعدد.";
        break;
      case "TF":
        specificMessage = isEnglish
          ? "Please select either True or False."
          : "يرجى اختيار إما صحيح أو خطأ.";
        break;
      case "OR":
        specificMessage = isEnglish
          ? "Please arrange the items in the correct order."
          : "يرجى ترتيب العناصر بالترتيب الصحيح.";
        break;
      case "FTB":
        specificMessage = isEnglish
          ? "Please fill in all the blank fields."
          : "يرجى ملء جميع الحقول الفارغة.";
        break;
      case "TAB":
        specificMessage = isEnglish
          ? "Please complete all the required cells in the table."
          : "يرجى إكمال جميع الخلايا المطلوبة في الجدول.";
        break;
      case "MTF":
        specificMessage = isEnglish
          ? "Please match all items correctly."
          : "يرجى مطابقة جميع العناصر بشكل صحيح.";
        break;
      case "UD":
        specificMessage = isEnglish
          ? "Please upload a document. Document upload is mandatory for this question."
          : "يرجى تحميل مستند. تحميل المستند إلزامي لهذا السؤال.";
        break;
      case "IR":
        specificMessage = isEnglish
          ? "Please upload an image. Image upload is mandatory for this question."
          : "يرجى تحميل صورة. تحميل الصورة إلزامي لهذا السؤال.";
        break;
      case "PRQ":
        specificMessage = isEnglish
          ? "Please write your code solution."
          : "يرجى كتابة حل الكود الخاص بك.";
        break;
      default:
        specificMessage = isEnglish
          ? "Please provide your answer in the text area."
          : "يرجى تقديم إجابتك في منطقة النص.";
    }
  }

  const message = `
    <div>
        <h5>${isEnglish
      ? "Please answer the current question before moving on to the next one."
      : "من فضلك أجب على السؤال الحالي قبل الانتقال إلى السؤال التالي."
    }</h5>
        ${specificMessage ? `<p><strong>${specificMessage}</strong></p>` : ""}
    </div>
`;
  $(".ui-dialog-title").text("Message / رسالة");
  $("#dialog-message").html(message);

  $("#dialog-message").dialog({
    modal: true,
    buttons: {
      "OK / نعم": function () {
        $(this).dialog("close");
      },
    },
    create: function (event, ui) {
      var closeButton = $(
        '<button type="button" class="ui-button ui-corner-all ui-widget ui-dialog-titlebar-close" title="Close" translate="no">X</button>'
      );
      closeButton.on("click", function () {
        $("#dialog-message").dialog("close");
      });
      $(this)
        .closest(".ui-dialog")
        .find(".ui-dialog-titlebar")
        .append(closeButton);
    },
  });
}

function validateAndSubmit() {
  const unansweredQuestions = [];
  const isEnglish = localStorage.getItem("lang") === "en";

  // Use comprehensive validation for all question types
  questions.forEach((question, index) => {
    if (!isQuestionAnswered(index)) {
      unansweredQuestions.push(index + 1);
    }
  });

  if (unansweredQuestions.length > 0) {
    const questionList = unansweredQuestions
      .map(
        (num) =>
          `<a href="#" class="navigate-question" data-index="${num - 1
          }"> ${num}</a>`
      )
      .join("");
    const message = `
            <div>
                 <p>${isEnglish
        ? "You must answer all questions before submitting the exam. The following questions are unanswered:"
        : "يجب عليك الإجابة على جميع الأسئلة قبل تقديم الامتحان. الأسئلة التالية غير مُجابة:"
      }</p>
                <ul>${questionList}</ul>
                <p>${isEnglish
        ? "Please click on a question number to navigate to it and provide an answer."
        : "الرجاء النقر على رقم السؤال للانتقال إليه وتقديم الإجابة."
      }</p>
            </div>
        `;

    $("#dialog-message").html(message);
    $("#dialog-message").dialog({
      modal: true,
      buttons: {
        Cancel: function () {
          $(this).dialog("close");
        },
        // Submit: async function () {
        //   if(unansweredQuestions.length > 0){
        //     saveResponse();
        //   }
        //   $(this).dialog('close');

        //   // Show upload animation early to indicate processing
        //   showUploadAnimation();

        //   try {
        //     // First save any unsaved answers
        //     await attemptSaveUnsavedAnswers();

        //     if (webCamRecording || screenRecording) {
        //       const uploadSuccess = await stopRecording();

        //       sendLogsToServer();

        //       if (!uploadSuccess) {
        //         hideUploadAnimation();
        //         displayToast('Error uploading recording. Please try again or contact support.', 'error');
        //         return;
        //       }
        //     }

        //     // Only after recording is fully uploaded, submit the exam
        //     const endpointUrl = `${STUDENT_END_POINT}/submit?entranceExamId=${examId}&studentId=${studentId}`;

        //     makeApiCall({
        //       url: endpointUrl,
        //       method: 'PUT',
        //       isApiKey: true,
        //       successCallback: function (response) {
        //         console.log('Exam submitted successfully');
        //         window.location.href = 'success.html';
        //       },
        //       errorCallback: function (error) {
        //         console.error('Error submitting exam:', error);
        //         hideUploadAnimation();
        //         displayToast('Error submitting exam. Please try again.', 'error');
        //       },
        //     });

        //   } catch (error) {
        //     console.error('Error during submission process:', error);
        //     hideUploadAnimation();
        //     displayToast('Error during submission. Please try again.', 'error');
        //   }
        // },
      },
      create: function (event, ui) {
        var closeButton = $(
          '<button type="button" class="ui-button ui-corner-all ui-widget ui-dialog-titlebar-close" title="Close" translate="no">X</button>'
        );
        closeButton.on("click", function () {
          $("#dialog-message").dialog("close");
        });
        $(this)
          .closest(".ui-dialog")
          .find(".ui-dialog-titlebar")
          .append(closeButton);
      },
    });

    // Event listener for navigating to the question
    $(document).on("click", ".navigate-question", function (event) {
      event.preventDefault();
      const questionIndex = $(this).data("index");
      $("#dialog-message").dialog("close");
      currentQuestionIndex = questionIndex;
      showQuestion(questionIndex);
    });
  } else {
    const confirmationMessage = `
            <div class="submit-confirmation-popup">
                <div class="warning-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="confirmation-content">
                    <h4>Are you sure you want to submit the exam ?</h4>
                    <h4>هل أنت متأكد أنك تريد تقديم الامتحان؟</h4>
                    <div class="warning-message">
                        <p><strong>Please Note / يرجى الملاحظة:</strong></p>
                        <ul>
                            <li>Once submitted, you cannot return to the exam
                                <br><span class="arabic-text">بمجرد التقديم ، لا يمكنك العودة إلى الامتحان</span>
                            </li>
                            <li>Verify all your answers carefully before submission
                                <br><span class="arabic-text">تحقق من جميع إجاباتك بعناية قبل التقديم</span>
                            </li>
                            <li>Make sure you have attempted all questions
                                <br><span class="arabic-text">تأكد من أنك حاولت الإجابة على جميع الأسئلة</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

    $("#dialog-message").html(confirmationMessage);
    $("#dialog-message").dialog({
      modal: true,
      width: 500,
      buttons: {
        Cancel: function () {
          $(this).dialog("close");
        },
        Submit: async function () {
          $(this).dialog("close");

          // Show upload animation early to indicate processing
          showUploadAnimation();

          try {
            // First attempt to save any unsaved answers
            await attemptSaveUnsavedAnswers();

            // Then do a final check for any unsaved answers using the bulk method
            await saveUnsavedResponsesFromDOM();

            videoUploadLog("Exam submitting manually", "exam");

            if (webCamRecording || screenRecording) {
              const uploadSuccess = await stopRecording();

              sendLogsToServer();

              if (!uploadSuccess) {
                hideUploadAnimation();
                displayToast(
                  "Error uploading recording. Please try again or contact support.",
                  "error"
                );
                return;
              }
            }

            // Only after recording is fully uploaded, submit the exam
            const endpointUrl = `${STUDENT_END_POINT}/submit?entranceExamId=${examId}&studentId=${studentId}`;

            makeApiCall({
              url: endpointUrl,
              method: "PUT",
              isApiKey: true,
              successCallback: function (response) {
                window.location.href = `message.html?status=completed${cid ? `&cid=${cid}` : ""
                  }`;
              },
              errorCallback: function (error) {
                hideUploadAnimation();
                displayToast("Error submitting exam: " + error, "error");
              },
            });
          } catch (error) {
            console.error("Error during submission process:", error);
            hideUploadAnimation();
            displayToast("Error during submission. Please try again.", "error");
          }
        },
      },
      create: function (event, ui) {
        var closeButton = $(
          '<button type="button" class="ui-button ui-corner-all ui-widget ui-dialog-titlebar-close" title="Close" translate="no">X</button>'
        );
        closeButton.on("click", function () {
          $("#dialog-message").dialog("close");
        });
        $(this)
          .closest(".ui-dialog")
          .find(".ui-dialog-titlebar")
          .append(closeButton);
      },
    });
  }
}

// Optional: helper to extract file name from a URL
function extractFileName(url) {
  try {
    const urlObject = new URL(url);
    const pathname = urlObject.pathname;
    return decodeURIComponent(
      pathname.substring(pathname.lastIndexOf("/") + 1)
    );
  } catch (error) {
    console.error("Error extracting file name from URL:", error);
    return url;
  }
}

function openDocumentPreview(url) {
  const extension = url.split(".").pop().toLowerCase();
  let previewUrl = url;

  if (extension !== "pdf") {
    previewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
      url
    )}&embedded=true`;
  }

  $("#document-frame").attr("src", previewUrl);

  $("#document-modal").dialog({
    modal: true,
    width: "80%",
    height: $(window).height() * 0.8,
    buttons: {
      Close: function () {
        $(this).dialog("close");
      },
    },
    create: function (event, ui) {
      var closeButton = $(
        '<button type="button" class="ui-button ui-corner-all ui-widget ui-dialog-titlebar-close" title="Close" translate="no">X</button>'
      );
      closeButton.on("click", function () {
        $("#document-modal").dialog("close");
      });
      $(this)
        .closest(".ui-dialog")
        .find(".ui-dialog-titlebar")
        .append(closeButton);
    },
  });
}

function openImagePreview(url) {
  $("#modal-image").attr("src", url).attr('onerror', 'handleImageError(this)').show();
  $("#image-modal").dialog({
    modal: true,
    width: "auto",
    height: "auto",
    resizable: true,
    draggable: true,
    open: function () {
      $(".ui-widget-overlay").bind("click", function () {
        $("#image-modal").dialog("close");
      });
    },
    buttons: {
      Close: function () {
        $(this).dialog("close");
        $('#modal-image').attr('data-retry', false);
      },
    },
    create: function (event, ui) {
      var closeButton = $(
        '<button type="button" class="ui-button ui-corner-all ui-widget ui-dialog-titlebar-close" title="Close" translate="no">X</button>'
      );
      closeButton.on("click", function () {
        $("#image-modal").dialog("close");
        $('#modal-image').attr('data-retry', false);
      });
      $(this)
        .closest(".ui-dialog")
        .find(".ui-dialog-titlebar")
        .append(closeButton);
    },
  });
}

// anamoly_v4.js
$(document).ready(function () {
  let cheatCount = 0;
  const cheatLimit = 1000;
  let backButtonClickListener;
  const urlParams = new URLSearchParams(window.location.search);
  const entranceExamId = urlParams.get("examid");
  const studentId = urlParams.get("uid");

  // Make handleCheatDetected available globally
  window.handleCheatDetected = function (reason, isPopup = true) {
    cheatCount++;
    callExitCountAPI(reason);

    if (cheatCount >= cheatLimit) {
      terminateExam(reason);
    } else {
      if (isPopup) {
        showCheatPopup(reason);
      }
    }
  };

  // Add cooldown tracking variables
  let lastApiCallTime = 0;
  const apiCooldownPeriod = 30000; // 30 seconds in milliseconds

  // Device detection
  const isTablet = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /(ipad|tablet|(android(?!.*mobile))|(windows.*(touch))|(kindle))/i.test(
      userAgent
    );
  };

  const callExitCountAPI = (reason) => {
    const currentTime = Date.now();

    // Check if we're still in the cooldown period
    if (currentTime - lastApiCallTime < apiCooldownPeriod) {
      return; // Skip this API call if we're in cooldown period
    }

    // Update the last API call time
    lastApiCallTime = currentTime;

    const endpointUrl = `${base_url}/entrance-exam/attender/exit-count?entranceExamId=${entranceExamId}&studentId=${studentId}&exitCount=${cheatCount}`;

    makeApiCall({
      url: endpointUrl,
      method: "PUT",
      data: JSON.stringify({ reason: reason }),
      successCallback: function (response) { },
      errorCallback: function (error) {
        console.error("API call failed:", error);
      },
    });
  };

  const showCheatPopup = (reason) => {
    const isEnglish = localStorage.getItem("lang") === "en";
    $("body").append(`
        <div class="overlay" id="cheatOverlay">
          <div class="popup">
            <h2>${isEnglish ? "Warning" : "تحذير"}</h2>
            <p> ${isEnglish ? "Noncompliant detected:" : "تم الكشف عن عدم الامتثال:"
      } ${reason}. ${isEnglish
        ? "If it happens again, the exam will be terminated."
        : "إذا حدث ذلك مرة أخرى، سيتم إنهاء الامتحان"
      }</p>
            <div class="button-wrap">
              <button id="continueExamButton">${isEnglish ? "Continue Exam:" : "متابعة الامتحان:"
      }</button>
            </div>
          </div>
        </div>
      `);
    $("#cheatOverlay").fadeIn();
    $("#continueExamButton").click(function () {
      $("#cheatOverlay").fadeOut(function () {
        $(this).remove();
      });
      goFullScreen();
    });
  };

  const goFullScreen = () => {
    try {
      // Skip fullscreen for tablet devices
      if (isTablet()) {
        // Still monitor for tab switching and other cheating attempts
        startFullScreenMonitoring();
        return;
      }

      // For non-mobile/tablet devices, proceed with fullscreen
      const elem = document.documentElement;

      // Create a function to attempt fullscreen
      const attemptFullScreen = () => {
        // Try multiple fullscreen request methods with promise chaining
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch((err) => {
            console.error("Fullscreen error:", err);
            showFullScreenWarning();
          });
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen().catch((err) => {
            console.error("Fullscreen error (moz):", err);
            showFullScreenWarning();
          });
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen().catch((err) => {
            console.error("Fullscreen error (webkit):", err);
            showFullScreenWarning();
          });
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen().catch((err) => {
            console.error("Fullscreen error (ms):", err);
            showFullScreenWarning();
          });
        } else {
          console.warn("No fullscreen API available");
          showFullScreenWarning();
          return false;
        }

        // Verify fullscreen was actually entered
        setTimeout(() => {
          checkIfFullScreenSucceeded();
        }, 500);

        return true;
      };

      // Try to request fullscreen
      const succeeded = attemptFullScreen();

      // Start monitoring the fullscreen state
      startFullScreenMonitoring();

      // Fallback for browsers that don't support Promises on requestFullscreen
      if (succeeded) {
        setTimeout(() => {
          checkIfFullScreenSucceeded();
        }, 1000);
      }
    } catch (e) {
      console.error("Exception in goFullScreen:", e);
      showFullScreenWarning();
    }
  };

  // Function to check if fullscreen succeeded
  const checkIfFullScreenSucceeded = () => {
    const isFullScreen =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    if (!isFullScreen) {
      showFullScreenWarning();
    } else {
      // If there's a fullscreen warning showing, remove it
      if ($("#fullScreenWarning").length) {
        $("#fullScreenWarning").fadeOut(function () {
          $(this).remove();
        });
      }
    }
  };

  const showFullScreenWarning = () => {
    // Don't show multiple warnings
    const isEnglish = localStorage.getItem("lang") === "en";
    if ($("#fullScreenWarning").length) {
      return;
    }

    $("body").append(`
      <div class="overlay" id="fullScreenWarning">
        <div class="popup">
          <h2>${isEnglish ? "Warning" : "تحذير"}</h2>
          <p>${isEnglish
        ? "Full screen mode is required for this exam. Please click the button below and allow full screen when prompted."
        : "يتطلب هذا الاختبار وضع ملء الشاشة. يُرجى النقر على الزر أدناه وتفعيل وضع ملء الشاشة عند الطلب."
      }</p>
          <div class="button-wrap">
            <button id="retryFullScreenButton">${isEnglish ? "Enter Full Screen" : "أدخل ملء الشاشة"
      }</button>
          </div>
        </div>
      </div>
    `);

    $("#fullScreenWarning").fadeIn();

    // Remove any existing click handlers
    $("#retryFullScreenButton")
      .off("click")
      .on("click", function () {
        goFullScreen();
      });
  };

  // Function to monitor if full screen is active
  const startFullScreenMonitoring = () => {
    const isEnglish = localStorage.getItem("lang") === "en";

    // Skip monitoring for tablet devices since we're not forcing fullscreen
    if (isTablet()) {
      // Still monitor for tab switching and other cheating attempts
      if (window.fullScreenMonitorInterval) {
        clearInterval(window.fullScreenMonitorInterval);
      }

      window.fullScreenMonitorInterval = setInterval(() => {
        // Only check for tab switching, not fullscreen state
        if (document.hidden) {
          handleCheatDetected(
            isEnglish
              ? "Switched tabs or apps"
              : "تم تغيير علامة التبويب أو التطبيقات",
            false
          );
        }
      }, 1000);
      return;
    }

    // Clear any existing monitoring
    if (window.fullScreenMonitorInterval) {
      clearInterval(window.fullScreenMonitorInterval);
    }

    window.fullScreenMonitorInterval = setInterval(() => {
      const isFullScreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      if (!isFullScreen) {
        handleCheatDetected(
          isEnglish ? "Exited full screen mode" : "تم الخروج من وضع ملء الشاشة",
          false
        );
        setTimeout(goFullScreen, 300); // Try to re-enter fullscreen with a small delay
      }
    }, 1000); // Check more frequently
  };

  // Function to capture Escape key events at all levels
  const captureEscapeKey = () => {
    // Remove any existing handlers first to avoid duplicates
    document.removeEventListener("keydown", globalKeyHandler, true);
    window.removeEventListener("keydown", globalKeyHandler, true);
    $(document).off("keydown.examEscape");

    // Global document-level keydown handler with capture phase
    function globalKeyHandler(e) {
      const isEnglish = localStorage.getItem("lang") === "en";
      if (e.key === "Escape" || e.keyCode === 27 || e.which === 27) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleCheatDetected(
          isEnglish ? "Escape button clicked" : "تم النقر على زر الهروب"
        );
        return false;
      }

      // Block Ctrl+C and Ctrl+V
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "c" ||
          e.keyCode === 67 || // Copy
          e.key === "v" ||
          e.keyCode === 86)
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleCheatDetected(
          isEnglish ? "Copy/Paste attempt blocked" : "تم حظر محاولة النسخ/اللصق"
        );
        return false;
      }

      // Block Ctrl+Shift+I (Developer Tools)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "i" || e.keyCode === 73)
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleCheatDetected(
          isEnglish
            ? "Developer tools attempt blocked"
            : "تم حظر محاولة أدوات المطورين"
        );
        return false;
      }

      // Also block other potentially problematic keys
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "r" ||
          e.keyCode === 82 || // Refresh
          e.key === "w" ||
          e.keyCode === 87 || // Close tab
          e.key === "t" ||
          e.keyCode === 84 || // New tab
          e.key === "n" ||
          e.keyCode === 78 || // New window
          e.key === "p" ||
          e.keyCode === 80 || // Print
          e.key === "s" ||
          e.keyCode === 83 || // Save
          e.key === "u" ||
          e.keyCode === 85 || // View source
          e.key === "a" ||
          e.keyCode === 65)
      ) {
        // Select all
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleCheatDetected(
          isEnglish
            ? "Keyboard shortcut blocked: " + e.key
            : "تم حظر محاولة أدوات المطورين" + e.key
        );
        return false;
      }

      // Block F12 key (alternative way to open dev tools)
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleCheatDetected(
          isEnglish
            ? "Developer tools attempt blocked (F12)"
            : "تم حظر محاولة أدوات المطور (F12)"
        );
        return false;
      }
    }

    // Register the handlers
    document.addEventListener("keydown", globalKeyHandler, true);
    window.addEventListener("keydown", globalKeyHandler, true);

    // Also use jQuery for older browser compatibility
    $(document).on("keydown.examEscape", function (event) {
      const isEnglish = localStorage.getItem("lang") === "en";
      if (
        event.key === "Escape" ||
        event.keyCode === 27 ||
        event.which === 27
      ) {
        event.preventDefault();
        event.stopPropagation();
        handleCheatDetected(
          isEnglish ? "Escape button clicked" : "تم النقر على زر الهروب"
        );
        return false;
      }
    });

    // Add a specific handler for context menu (right-click)
    document.addEventListener(
      "contextmenu",
      function (e) {
        const isEnglish = localStorage.getItem("lang") === "en";
        e.preventDefault();
        e.stopPropagation();
        handleCheatDetected(
          isEnglish
            ? "Right-click menu attempt blocked"
            : "تم حظر محاولة النقر بالزر الأيمن"
        );
        return false;
      },
      true
    );

    // Override the default browser fullscreen exit behavior
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("mozfullscreenchange", handleFullScreenChange);
    document.addEventListener("MSFullscreenChange", handleFullScreenChange);
  };

  const checkCheatingActions = () => {
    const isEnglish = localStorage.getItem("lang") === "en";
    if (backButtonClickListener) clearInterval(backButtonClickListener);

    backButtonClickListener = setInterval(() => {
      if (checkIsChatGPTExtensionOpen()) {
        handleCheatDetected(
          isEnglish
            ? "ChatGPT extension opened. Close it and proceed"
            : "تم فتح ملحق ChatGPT. أغلقه وتابع."
        );
        handleCheatDetected("ChatGPT extension opened", false);
      }
    }, 5000);

    $(document).on("visibilitychange", function () {
      if (document.hidden || document.visibilityState === "hidden") {
        handleCheatDetected(
          isEnglish
            ? "Clicked out of exam window"
            : "تم النقر خارج نافذة الامتحان"
        );
      }
    });

    // Set up enhanced Escape key capture
    captureEscapeKey();

    function handleFullScreenChange() {
      const isEnglish = localStorage.getItem("lang") === "en";
      if (
        !document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement
      ) {
        // User exited full screen
        handleCheatDetected(
          isEnglish ? "Exited full screen mode" : "تم الخروج من وضع ملء الشاشة",
          false
        );
        setTimeout(goFullScreen, 300); // Try to go back to full screen with a small delay
      }
    }

    $(document).on("contextmenu", function (event) {
      return false; // Prevent default action
    });

    $(window).on("blur", function () {
      const isEnglish = localStorage.getItem("lang") === "en";
      // Check if navigator and userAgent are defined
      var userAgent =
        (typeof navigator !== "undefined" &&
          (navigator.userAgent || navigator.vendor || window.opera)) ||
        "";

      // Safely check if the device is an iPad
      var isIpad = /iPad/i.test(userAgent);

      // Define isTablet only if isIpad is checked
      var isTablet = isIpad;

      // If it's not a tablet, handle cheat detection
      if (!isTablet) {
        handleCheatDetected(
          isEnglish ? "Window out of focus" : "نافذة خارج التركيز"
        );
      }
    });

    // Disable browser back
    history.pushState(null, null, location.href);
    window.addEventListener("popstate", function () {
      const isEnglish = localStorage.getItem("lang") === "en";
      history.pushState(null, null, location.href);
      handleCheatDetected(
        isEnglish
          ? "Browser back button pressed"
          : "تم الضغط على زر الرجوع للمتصفح"
      );
    });
  };

  const checkIsChatGPTExtensionOpen = () => {
    return $("#aitopia-sidebar-opener").length !== 0;
  };

  const showTerminateMessage = () => {
    const isEnglish = localStorage.getItem("lang") === "en";
    $("#instructionOverlay").remove();
    $("body").append(`
        <div class="overlay" id="terminateOverlay">
          <div class="popup">
            <h2>${isEnglish
        ? "The exam is terminated due to repeated noncompliance with exam standards. Contact support for further actions."
        : "تم إلغاء الامتحان بسبب تكرار عدم الالتزام بمعايير الامتحان. تواصل مع الدعم لاتخاذ الإجراءات اللازمة."
      }</h2>
          </div>
        </div>
      `);
    $("#terminateOverlay").fadeIn();
  };

  // Initial API call to get the already cheated count
  $.ajax({
    url: `${EXAM_ATTENDER_END_POINT}/exit-count?studentId=${studentId}&entranceExamId=${entranceExamId}`,
    type: "GET",
    headers: {
      ...apiheaders,
    },
    success: function (response) {
      if (response.data && response.data.fullScreen) {
        cheatCount = response.data.fullScreen.exitCount || 0;
      }

      if (cheatCount >= cheatLimit) {
        attemptSaveUnsavedAnswers()
          .then(() => { })
          .catch((error) => {
            console.error("Error saving final answers:", error);
          })
          .finally(() => {
            setTimeout(() => {
              window.location.href = `message.html?status=terminated${cid ? `&cid=${cid}` : ""
                }`;
            }, 3000);
          });

        showTerminateMessage();
      } else {
        $("#instructionOverlay").fadeIn();

        $("#acknowledgeButton").click(function () {
          $(this).hide();
          $("#startExamButton").show();
        });

        $("#startExamButton").click(function () {
          // startExam();

          if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
          $("#instructionOverlay").fadeOut();
          goFullScreen();
          checkCheatingActions();
        });
      }
    },
    error: function (xhr, status, error) { },
  });
});

const startExam = () => {
  const endpointUrl = `${STUDENT_END_POINT}/start?entranceExamId=${examId}&studentId=${studentId}`;

  makeApiCall({
    url: endpointUrl,
    method: "PUT",
    isApiKey: true,
    successCallback: function (response) {
      userActivityLogsApi("Exam started successfully", "exam-start");
      fetchAnsweredQuestions();
    },
    errorCallback: function (error) {
      window.location.href = `message.html?status=already-completed${cid ? `&cid=${cid}` : ""
        }`;
    },
  });
};

(function () {
  // Push the current state into the history stack with a unique state identifier
  history.pushState(null, null, location.href);

  // Listen for the popstate event, which is triggered when navigating back
  window.addEventListener("popstate", function (event) {
    // Reload the page when the user navigates back
    location.reload(true);
  });
})();

function getTextResponseForQuestion(qIndex) {
  const $questionSection = $(`#question-${qIndex}`);
  const $textarea = $questionSection.find(".saq-input");

  if ($textarea.length > 0) {
    const ckeditorInstance = $textarea.data("ckeditorInstance");
    if (ckeditorInstance) {
      // Get content from CKEditor
      return ckeditorInstance.getData();
    } else {
      // Fallback to textarea value
      return $textarea.val() || "";
    }
  }

  return "";
}

/**
 * Capture digital writing data from the widget for the specified question
 * @param {number} qIndex - The question index
 */
async function captureDigitalInk(qIndex) {
  const widget = digitalWritingWidgets.get(qIndex);

  if (widget && typeof widget.getStrokes === "function") {
    try {
      const strokes = widget.getStrokes();
      if (strokes && strokes.length > 0) {
        // Store the strokes data in the answers array
        answers[qIndex] = strokes;
        isAnswerChanged = true;

        // Update UI to show question has been answered
        $(`.filter-numbers button[data-index=${qIndex}]`).addClass("selected");
        $(`.filter-numbers button[data-index=${qIndex}]`).attr(
          "data-answer-saved",
          "false"
        );
      }
    } catch (error) {
      console.error(
        `Error capturing digital writing data for question ${qIndex}:`,
        error
      );
    }
  }
}

/**
 * Save response for a specific question index
 * without changing global currentQuestionIndex.
 *
 * @param {number} qIndex - The index of the question in the questions array.
 * @returns {Promise} - Resolves when the save attempt finishes (either success or fail).
 */
function saveResponseForQuestion(qIndex) {
  const isEnglish = localStorage.getItem("lang") === "en";

  // If a save operation is already in progress for this question, return that promise
  if (savingInProgress[qIndex]) {
    return savingInProgress[qIndex];
  }

  const savePromise = new Promise((resolve, reject) => {
    const question = questions[qIndex];
    const selectedChoice = answers[qIndex];

    // If there's no user answer at qIndex, just resolve
    if (!selectedChoice) {
      return resolve({ success: true });
    }

    // Show a "saving" status
    saving_answerInfo
      .text(isEnglish ? "Saving answers .." : "حفظ الإجابات..")
      .show();

    // Construct API endpoint
    const endpointUrl =
      `${STUDENT_END_POINT}/response` +
      `?entranceExamId=${examId}&studentId=${studentId}&questionId=${question._id}`;

    let requestData;
    if (question?.meta?.["student-responce-type"]?.["digital-writing"]) {
      // Handle digital writing questions
      requestData = {
        digitalInk: selectedChoice,
      };
    } else {
      if (question.type === "FTB" || question.type === "MTF") {
        const blanks = Object.keys(selectedChoice).map((identity) => ({
          identity,
          answer: selectedChoice[identity],
        }));
        requestData = { blanks };
      } else if (question.type === "TAB") {
        // Handle table-based question responses
        const blanks = Object.keys(selectedChoice)
          .filter(
            (identity) =>
              selectedChoice[identity] && selectedChoice[identity].trim() !== ""
          ) // Only include non-empty answers
          .map((identity) => ({
            identity,
            answer: selectedChoice[identity],
          }));

        // Only send the request if there are actual answered blanks
        if (blanks.length > 0) {
          requestData = { blanks };
        } else {
          // If no blanks are answered, don't save anything
          delete savingInProgress[qIndex];
          resolve({ success: true, message: "No blanks answered" });
          return;
        }
      } else if (question.type === "UD" || question.type === "IR") {
        // Get text response from CKEditor or textarea
        const textResponse = getTextResponseForQuestion(qIndex);

        if (
          selectedChoice.attachments &&
          selectedChoice.attachments.length > 0
        ) {
          requestData = {
            attachments: [
              selectedChoice.attachments[selectedChoice.attachments.length - 1],
            ],
            response: textResponse || "", // Include text response if available
          };
        } else {
          // For cases where only text response exists (though attachments are mandatory)
          requestData = { response: textResponse || "" };
        }
      } else if (question.type === "PRQ") {
        const codeResponse =
          typeof selectedChoice === "string"
            ? selectedChoice
            : getCodeEditorResponse();
        requestData = { response: codeResponse };
      } else if (question.type === "OR") {
        let orderingArray;

        if (typeof selectedChoice === "string") {
          try {
            orderingArray = JSON.parse(selectedChoice);
          } catch (e) {
            orderingArray = selectedChoice
              .split(",")
              .map((item) => item.trim());
          }
        }
        requestData = { responses: orderingArray };
      } else {
        requestData = { response: selectedChoice };
      }
    }

    // Attempt saving
    makeApiCall({
      url: endpointUrl,
      method: "PATCH",
      isApiKey: true,
      data: JSON.stringify(requestData),
      disableLoading: true,
      successCallback: function (response) {
        apiFailureCount = 0;

        // Remove from unsavedAnswers if present
        unsavedAnswers = unsavedAnswers.filter((idx) => idx !== qIndex);

        // Only reset isAnswerChanged if we're on this question
        if (currentQuestionIndex === qIndex) {
          isAnswerChanged = false;
        }

        saving_answerInfo
          .text(isEnglish ? "Saved successfully" : "تم الحفظ بنجاح")
          .hide();

        // Mark this question as saved in the DOM
        $(`.filter-numbers button[data-index=${qIndex}]`).attr(
          "data-answer-saved",
          "true"
        );

        // Clear the in-progress flag for this question
        delete savingInProgress[qIndex];

        resolve({ success: true });
      },
      errorCallback: function (error) {
        console.error(`Error saving response for question ${qIndex}:`, error);
        saving_answerInfo.text(isEnglish ? "Saving failed" : "فشل الحفظ");

        apiFailureCount++;
        videoUploadLog(`API failure count: ${apiFailureCount}`, "exam");
        if (apiFailureCount >= MAX_API_FAILURES) {
          videoUploadLog(
            `Showing internet connection warning for question ${qIndex}`,
            "exam"
          );
          showInternetConnectionWarning();
        }

        // Add to unsavedAnswers if not already there
        if (!unsavedAnswers.includes(qIndex)) {
          unsavedAnswers.push(qIndex);
        }

        // Mark this question as not saved in the DOM
        $(`.filter-numbers button[data-index=${qIndex}]`).attr(
          "data-answer-saved",
          "false"
        );

        // Clear the in-progress flag for this question
        delete savingInProgress[qIndex];

        reject({ success: false, error: error });
      },
    });
  });

  // Store the promise in our tracking object
  savingInProgress[qIndex] = savePromise;

  // Return the promise
  return savePromise;
}

async function attemptSaveUnsavedAnswers() {
  // First check if we have any unsaved answers tracked in our array
  if (unsavedAnswers.length > 0) {
    const answersToSave = [...unsavedAnswers];
    const savePromises = [];

    // Create save promises for each unsaved answer (if not already saving)
    for (const idx of answersToSave) {
      if (!savingInProgress[idx]) {
        savePromises.push(
          saveResponseForQuestion(idx).catch((error) => {
            console.error(`Failed to save answer for question ${idx}:`, error);
            return { success: false, index: idx };
          })
        );
      }
    }

    // Wait for all save operations to complete
    await Promise.allSettled(savePromises);
  }
}

function initializeExamTimer(examData) {
  examEndTime = examData.endTime;
  firstStartedAt = examData.firstStartedAt;
  examTimeZone = examData.timeZone || "UTC";

  if (examData.remainingDuration) {
    remainingDurationSeconds = Math.floor(examData.remainingDuration / 1000);
  } else if (examEndTime) {
    const { DateTime } = luxon;
    const now = DateTime.now();
    const endTime = DateTime.fromISO(examEndTime).setZone(examTimeZone);
    remainingDurationSeconds = Math.floor(
      endTime.diff(now).milliseconds / 1000
    );
  }

  updateCountdown();
  clearInterval(timerInterval);
  timerInterval = setInterval(updateCountdown, 1000);
}

function formatTimeRemaining(seconds) {
  if (seconds <= 0) return "00:00:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function updateCountdown() {
  // Decrement the remaining duration by 1 second
  remainingDurationSeconds--;

  const countdownDisplay = $("#countdown-display");

  if (remainingDurationSeconds <= 0) {
    clearInterval(timerInterval);
    countdownDisplay.text("00:00:00");
    countdownDisplay.addClass("time-warning");
    showUploadAnimation()

    attemptSaveUnsavedAnswers()
      .then(() => { })
      .catch((error) => { })
      .finally(async () => {
        await saveUnsavedResponsesFromDOM();
        await updateTimeOver();

        if (webCamRecording || screenRecording) {
          const uploadSuccess = await stopRecording();

          videoUploadLog("Exam Time Over auto submitting", "exam");

          sendLogsToServer();

          if (!uploadSuccess) {
            hideUploadAnimation();
            displayToast(
              "Error uploading recording. Please try again or contact support.",
              "error"
            );
            return;
          }
        }

        setTimeout(() => {
          window.location.href = `message.html?status=ended${cid ? `&cid=${cid}` : ""
            }`;
        }, 3000);
      });

    return;
  }

  // Calculate and display end time if needed
  if (examEndTime && examTimeZone) {
    const { DateTime } = luxon;
    const endTime = DateTime.fromISO(examEndTime).setZone(examTimeZone);
    const endTimeFormatted = endTime.toFormat("hh:mm a");
    $("#exam-end-time").text(`${endTimeFormatted}`);
  }

  // Format and display the remaining time
  const formattedTime = formatTimeRemaining(remainingDurationSeconds);
  countdownDisplay.text(formattedTime);

  // Add warning class if less than 5 minutes remaining
  if (remainingDurationSeconds < 5 * 60) {
    countdownDisplay.addClass("time-warning");
    if (window.isVoiceAlert && isFirstTime) {
      speakInstructions(
        "Less than 5 minutes remaining, please complete your exam"
      );
      isFirstTime = false;
    }
  } else {
    countdownDisplay.removeClass("time-warning");
  }
}

// Function to read instructions aloud
function speakInstructions(allText) {
  // Check if the browser supports speech synthesis
  if ("speechSynthesis" in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create a speech utterance
    const utterance = new SpeechSynthesisUtterance(allText);

    // Adjust parameters for better clarity
    utterance.rate = 0.9; // Slightly slower than default
    utterance.pitch = 1; // Normal pitch
    utterance.volume = 1; // Full volume

    // Get the speech language based on current interface language
    const isEnglish =
      localStorage.getItem("lang") === "en" || !localStorage.getItem("lang");
    utterance.lang = isEnglish ? "en-US" : "ar-SA";

    window.speechSynthesis.speak(utterance);
  }
}

// New function for bulk saving responses based on DOM attributes
function saveUnsavedResponsesFromDOM() {
  return new Promise(async (resolve, reject) => {
    const isEnglish = localStorage.getItem("lang") === "en";
    const unsavedQuestions = [];
    const bulkResponses = { responses: [] };

    // Find all questions marked as unsaved in the DOM
    $('.filter-numbers button[data-answer-saved="false"]').each(function () {
      const qIndex = parseInt($(this).data("index"));
      if (answers[qIndex]) {
        unsavedQuestions.push(qIndex);
      }
    });

    for (let i = 0; i < questions.length; i++) {
      if (unsavedQuestions.includes(i)) continue;
      if (
        answers[i] &&
        $(".filter-numbers button[data-index=" + i + "]").attr(
          "data-answer-saved"
        ) !== "true"
      ) {
        unsavedQuestions.push(i);
        // Mark the button as having an unsaved answer
        $(".filter-numbers button[data-index=" + i + "]").attr(
          "data-answer-saved",
          "false"
        );
      }
    }

    if (unsavedQuestions.length === 0) {
      resolve({ success: true, message: "No unsaved answers found" });
      // saving_answerInfo.text(isEnglish ? 'No unsaved answers found' : "لا يوجد إجابات غير محفوظة").show();
      return;
    }

    // Show saving status
    // saving_answerInfo.text(isEnglish ? 'Saving unsaved answers..' : "جارٍ حفظ الإجابات غير المحفوظة..").show();

    // Prepare the bulk request payload
    unsavedQuestions.forEach((qIndex) => {
      const question = questions[qIndex];
      const answer = answers[qIndex];

      if (!question || !answer) return;

      let response = {
        questionId: question._id,
        blanks: [],
        attachments: [],
      };

      if (question?.meta?.["student-responce-type"]?.["digital-writing"]) {
        response.digitalInk = answer;
      } else {
        if (
          question.type === "FTB" ||
          (question.type === "MTF" && typeof answer === "object")
        ) {
          response.blanks = Object.keys(answer).map((identity) => ({
            identity,
            answer: answer[identity],
          }));
        } else if (question.type === "TAB" && typeof answer === "object") {
          // For TAB questions, only include non-empty blanks
          response.blanks = Object.keys(answer)
            .filter(
              (identity) => answer[identity] && answer[identity].trim() !== ""
            )
            .map((identity) => ({
              identity,
              answer: answer[identity],
            }));

          // If no blanks are answered, skip this question
          if (response.blanks.length === 0) {
            return;
          }
        } else if (
          (question.type === "UD" || question.type === "IR") &&
          (answer.attachments || (typeof answer === "object" && answer.url))
        ) {
          // Get text response from CKEditor
          const textResponse = getTextResponseForQuestion(qIndex);

          if (answer.attachments && answer.attachments.length > 0) {
            response.attachments = answer.attachments.map((attach) => ({
              type: question.type,
              url: attach.url,
            }));
            response.response = textResponse || ""; // Include text response
          } else if (answer.url) {
            response.attachments = [
              {
                type: question.type,
                url: answer.url,
              },
            ];
            response.response = textResponse || "";
          } else {
            response.response = textResponse || answer.fileName || "";
          }
        } else if (question.type === "PRQ") {
          const codeResponse =
            typeof selectedChoice === "string"
              ? selectedChoice
              : getCodeEditorResponse();
          response.response = codeResponse;
        } else if (question.type === "OR") {
          let orderingArray;

          if (typeof answer === "string") {
            try {
              orderingArray = JSON.parse(answer);
            } catch (e) {
              orderingArray = answer.split(",").map((item) => item.trim());
            }
          }
          response.responses = orderingArray;
        } else {
          response.response = answer;
        }
      }

      bulkResponses.responses.push(response);
    });

    // Make the bulk save API call
    if (bulkResponses.responses.length > 0) {
      // saving_answerInfo.text(isEnglish ? 'Saving unsaved answers..' : "جارٍ حفظ الإجابات غير المحفوظة..").show();
      const endpointUrl = `${STUDENT_END_POINT}/responses?entranceExamId=${examId}&studentId=${studentId}`;

      try {
        makeApiCall({
          url: endpointUrl,
          method: "PUT",
          isApiKey: true,
          data: JSON.stringify(bulkResponses),
          successCallback: function (response) {
            apiFailureCount = 0;
            // Update DOM to mark all questions as saved
            unsavedQuestions.forEach((qIndex) => {
              $(".filter-numbers button[data-index=" + qIndex + "]").attr(
                "data-answer-saved",
                "true"
              );
            });

            // Remove these questions from the unsavedAnswers array
            unsavedAnswers = unsavedAnswers.filter(
              (idx) => !unsavedQuestions.includes(idx)
            );

            // saving_answerInfo.text(isEnglish ? 'All unsaved answers saved' : "تم حفظ جميع الإجابات غير المحفوظة").fadeOut(3000);

            resolve({ success: true, savedCount: unsavedQuestions.length });
          },
          errorCallback: function (error) {
            apiFailureCount++;
            videoUploadLog(`API failure count: ${apiFailureCount}`, "exam");
            if (apiFailureCount >= MAX_API_FAILURES) {
              videoUploadLog(
                `Showing internet connection warning for question ${qIndex}`,
                "exam"
              );
              showInternetConnectionWarning();
            }

            // saving_answerInfo.text(isEnglish ? 'Failed to save some answers' : "فشل حفظ بعض الإجابات").show();

            reject({ success: false, error });
          },
        });
      } catch (error) {
        console.error("Error in bulk save:", error);
        // saving_answerInfo.text(isEnglish ? 'Error saving answers' : "خطأ في حفظ الإجابات").show();
        reject({ success: false, error });
      }
    } else {
      // saving_answerInfo.hide();
      resolve({ success: true, message: "No valid answers to save" });
    }
  });
}

function isQuestionAnswered(questionIndex) {
  const question = questions[questionIndex];
  const answer = answers[questionIndex];

  if (!question) {
    return false;
  }

  // Check if answer exists
  if (!answer) {
    return false;
  }

  switch (question.type) {
    case "MCQ": {
      // Multiple Choice Question - check if a choice is selected
      const selectedChoice = $(`#question-${questionIndex} .choice.selected`);
      return selectedChoice.length > 0 && answer.toString().trim() !== "";
    }

    case "TF": {
      // True/False Question - check if answer is "true" or "false"
      return answer === "true" || answer === "false";
    }

    case "OR": {
      // Ordering Question - check if ordering array exists and has items
      if (typeof answer === "string") {
        try {
          const parsed = JSON.parse(answer);
          return Array.isArray(parsed) && parsed.length > 0;
        } catch (e) {
          return answer.trim() !== "";
        }
      }
      // Check if there's a saved studentOrder
      if (question.studentOrder && Array.isArray(question.studentOrder)) {
        return question.studentOrder.length > 0;
      }
      return false;
    }

    case "FTB": {
      // Fill in the Blanks - check if all blanks are filled
      if (typeof answer !== "object" || !question.blanks) {
        return false;
      }

      const requiredBlanks = question.blanks.length;
      const answeredBlanks = Object.keys(answer).filter(
        (key) => answer[key] && answer[key].toString().trim() !== ""
      ).length;

      return answeredBlanks === requiredBlanks && answeredBlanks > 0;
    }

    case "TAB": {
      // Table-based Question - check if all required blanks are filled
      if (typeof answer !== "object" || !question.blanks) {
        return false;
      }

      const requiredBlanks = question.blanks.length;
      const answeredBlanks = Object.keys(answer).filter(
        (key) => answer[key] && answer[key].toString().trim() !== ""
      ).length;

      return answeredBlanks === requiredBlanks && answeredBlanks > 0;
    }

    case "MTF": {
      // Match the Following - check if all items are matched
      if (typeof answer !== "object" || !question.blanks) {
        return false;
      }

      const expectedMatches = question.blanks.length;
      const actualMatches = Object.keys(answer).filter(
        (key) => answer[key] && answer[key].toString().trim() !== ""
      ).length;

      return actualMatches === expectedMatches && actualMatches > 0;
    }

    case "UD": {
      // Document Upload - check if file is uploaded or text is provided
      if (typeof answer === "object") {
        // Check for attachments
        if (answer.attachments && Array.isArray(answer.attachments)) {
          return answer.attachments.length > 0;
        } else if (answer && answer?.length > 0) {
          return true;
        }
      }

      // Check for student attachments from server (mandatory)
      const hasServerAttachments =
        question.studentattachment &&
        Array.isArray(question.studentattachment) &&
        question.studentattachment.length > 0;

      // Also check if there are any accordion items (rendered attachments)
      const hasRenderedAttachments =
        $(`#question-${questionIndex} .accordion .accordion-item`).length > 0;

      // For DU questions, attachments are mandatory
      return hasServerAttachments || hasRenderedAttachments;
    }

    case "IR": {
      // Image Response - attachments are mandatory, text response is optional
      if (typeof answer === "object") {
        // Check for attachments
        if (answer.attachments && Array.isArray(answer.attachments)) {
          return answer.attachments.length > 0;
        } else if (answer && answer?.length > 0) {
          return true;
        }
      }

      // Check for student attachments from server (mandatory)
      const hasServerAttachments =
        question.studentattachment &&
        Array.isArray(question.studentattachment) &&
        question.studentattachment.length > 0;

      // Also check if there are any accordion items (rendered attachments)
      const hasRenderedAttachments =
        $(`#question-${questionIndex} .accordion .accordion-item`).length > 0;

      // For IR questions, attachments are mandatory
      return hasServerAttachments || hasRenderedAttachments;
    }

    case "PRQ": {
      // Programming Question - check if code is written
      let codeResponse = "";

      if (typeof answer === "string") {
        codeResponse = answer;
      } else if (answer && answer?.length > 0) {
        return true;
      } else if (typeof getCodeEditorResponse === "function") {
        codeResponse = getCodeEditorResponse();
      }

      return codeResponse && codeResponse.trim() !== "";
    }

    case "SAQ":
    default: {
      // Check if this is a digital writing question
      if (question?.meta?.["student-responce-type"]?.["digital-writing"]) {
        // Digital writing question - check if strokes exist
        return Array.isArray(answer) && answer.length > 0;
      }

      // Short Answer Question or default - check if text is provided
      if (typeof answer === "string") {
        return answer.trim() !== "";
      }

      // For CKEditor content, check if there's actual content (not just empty tags)
      if (typeof answer === "string") {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = answer;
        const textContent = tempDiv.textContent || tempDiv.innerText || "";
        return textContent.trim() !== "";
      }

      return false;
    }
  }
}

function isValidAnswer(currentQuestionIndex) {
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  if (currentQuestion && currentQuestion.type === "OR") {
    if (currentAnswer) {
      try {
        const parsed = JSON.parse(currentAnswer);
        return !(Array.isArray(parsed) && parsed.length > 0);
      } catch (e) {
        return !(
          typeof currentAnswer === "string" && currentAnswer.trim() !== ""
        );
      }
    }

    if (
      currentQuestion.studentOrder &&
      Array.isArray(currentQuestion.studentOrder) &&
      currentQuestion.studentOrder.length > 0
    ) {
      return false;
    }

    // If no direct answer and no studentOrder, check studentResponse
    if (currentQuestion.studentResponse) {
      try {
        const parsed = JSON.parse(currentQuestion.studentResponse);
        return !(Array.isArray(parsed) && parsed.length > 0);
      } catch (e) {
        return !(
          typeof currentQuestion.studentResponse === "string" &&
          currentQuestion.studentResponse.trim() !== ""
        );
      }
    }
    return true;
  }

  // Validation for TF (True/False) questions
  if (currentQuestion && currentQuestion.type === "TF") {
    // Check if the answer is either "true" or "false"
    if (
      !currentAnswer ||
      (currentAnswer !== "true" && currentAnswer !== "false")
    ) {
      return true; // Invalid answer, requires selection
    }
    return false; // Valid answer
  }

  // Validate TAB question: return true if any tab's answer is missing
  if (
    currentQuestion.type === "TAB" &&
    currentQuestion.blanks.length !== Object.keys(currentAnswer).length
  ) {
    return true;
  }

  // Validation for MTF (Match the Following) questions
  if (currentQuestion && currentQuestion.type === "MTF") {
    // If there's no answer object or it's empty, it's invalid
    if (
      !currentAnswer ||
      typeof currentAnswer !== "object" ||
      Object.keys(currentAnswer).length === 0
    ) {
      return true; // Invalid answer, requires matching
    }

    // Check if all questions have been matched
    // Get the expected number of matches from the question blanks
    const expectedMatchCount = currentQuestion.blanks
      ? currentQuestion.blanks.length
      : 0;

    // Count the actual matches in the answer
    const actualMatchCount = Object.keys(currentAnswer).length;

    // If not all items are matched, it's invalid
    if (actualMatchCount < expectedMatchCount) {
      return true; // Invalid answer, not all items matched
    }

    return false; // Valid answer
  }

  if (
    !currentAnswer ||
    (Object.keys(currentAnswer).length === 0 && should_answer_before_next)
  ) {
    return true;
  } else if (
    typeof currentAnswer === "object" &&
    Object.keys(currentAnswer).length !== 0 &&
    Object.values(currentAnswer).some((value) => value === "")
  ) {
    return true;
  } else {
    return false;
  }
}

function updateTimeOver() {
  return new Promise(async (resolve, reject) => {
    const endpointUrl = `${EXAM_ATTENDER_END_POINT}/time-over?attenderId=${studentId}&entranceExamId=${examId}`;
    makeApiCall({
      url: endpointUrl,
      method: "PUT",
      isApiKey: true,
      successCallback: function (response) {
        resolve(response);
      },
      errorCallback: function (error) {
        reject(error);
      },
    });
  });
}

function showInternetConnectionWarning() {
  // Remove any existing overlay first
  $("#internetConnectionOverlay").remove();

  $("body").append(`
    <div class="overlay-internet" id="internetConnectionOverlay">
      <div class="popup-internet">
        <h2>
          <i class="fas fa-wifi"></i>
          <div class="title-content">
            <span>Internet Connection Issue</span>
            <span class="arabic-title" dir="rtl">مشكلة في اتصال الإنترنت</span>
          </div>
        </h2>

        <div class="message-block">
          <div class="lang-row">
            <div class="lang-icon">
              <i class="fas fa-globe-americas"></i>
            </div>
            <div class="lang-content">
              We are having trouble connecting to the server. This could be because of your internet connection or connectivity issues.
            </div>
          </div>
          <div class="lang-row">
            <div class="lang-icon">
              <i class="fas fa-globe-asia"></i>
            </div>
            <div class="lang-content" dir="rtl">
              نواجه مشكلة في الاتصال بالخادم. قد يكون هذا بسبب اتصال الإنترنت الخاص بك أو مشاكل في الاتصال.
            </div>
          </div>
        </div>

        <div class="tips-container">
          <div class="tips-header">
            <i class="fas fa-lightbulb"></i>
            <div class="tips-title">
              <span>Troubleshooting Steps</span>
              <span class="arabic-title" dir="rtl">خطوات حل المشكلة</span>
            </div>
          </div>
          <div class="tips-content">
            <div class="lang-row">
              <div class="lang-icon">
                <i class="fas fa-globe-americas"></i>
              </div>
              <div class="lang-content">
                • Check your internet connection<br>
                • Try refreshing the page<br>
                • Contact exam administrator if the problem persists
              </div>
            </div>
            <div class="lang-row">
              <div class="lang-icon">
                <i class="fas fa-globe-asia"></i>
              </div>
              <div class="lang-content" dir="rtl">
                • تحقق من اتصال الإنترنت الخاص بك<br>
                • حاول تحديث الصفحة<br>
                • اتصل بمسؤول الامتحان إذا استمرت المشكلة
              </div>
            </div>
          </div>
        </div>

        <div class="button-container-internet">
          <button onclick="refreshPage()" class="action-button refresh-button">
            <i class="fas fa-sync-alt"></i>
            <div class="button-text">
              <span>Refresh Page</span>
              <span dir="rtl">تحديث الصفحة</span>
            </div>
          </button>
          <button onclick="navigateAppLanding()" class="action-button landing-button">
            <i class="fas fa-home"></i>
            <div class="button-text">
              <span>Go to App Landing</span>
              <span dir="rtl">الذهاب إلى الصفحة الرئيسية</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  `);

  $("#internetConnectionOverlay").fadeIn(300);
}

function refreshPage() {
  videoUploadLog(
    `Max count of api failures, user clicked refresh button, Refreshing page`,
    "exam"
  );
  location.reload();
}

function navigateAppLanding() {
  videoUploadLog(
    `Max count of api failures, user clicked go to app landing button, Navigating to app landing`,
    "exam"
  );
  const urlParams = new URLSearchParams(window.location.search);
  const cid = urlParams.get("cid");
  window.location.href = `${window.location.origin}/fullscreenexam/app-landing/index.html?cid=${cid}`;
}

$(document)
  .off("click", ".doc-accordion-header")
  .on("click", ".doc-accordion-header", function () {
    const $header = $(this);
    const $content = $header
      .closest(".accordion-item")
      .find(".doc-accordion-content");
    const originalUrl = $header.data("url");

    $(".doc-accordion-header")
      .not($header)
      .removeClass("active")
      .next(".doc-accordion-content")
      .slideUp(200);

    $header.toggleClass("active");
    $content.slideToggle(200, function () {
      if ($content.is(":visible") && !$content.data("loaded")) {
        $content.html('<div class="loading">Loading document...</div>');

        getSignedUrl(originalUrl, null, {
          appendPDF: function (signedUrl) {
            $content.html(
              `<iframe src="${signedUrl}" class="pdf-iframe"></iframe>`
            );
            $content.data("loaded", true);
          },
          onError: function () {
            $content.html('<div class="error">Failed to load document</div>');
          },
        });
      } else if (!$content.is(":visible")) {
        $content.empty();
        $content.data("loaded", false);
      }
    });
  });

function fetchAndRenderStudentAttachments(questionId, questionIndex) {
  const examId = urlParams.get("examid");
  const studentId = urlParams.get("uid");
  const apiEndpoint = `${STUDENT_END_POINT}/captured-response?examId=${examId}&studentId=${studentId}&questionId=${questionId}`;

  makeApiCall({
    url: apiEndpoint,
    method: "GET",
    isApiKey: true,
    successCallback: function (response) {
      const container = $(
        `#student-attachments-container-${questionIndex} #thumbnails-wrapper-card`
      );
      container.empty();
      if (response.data && response.data.length > 0) {
        const attachments = response.data;

        const containsAudio = attachments.some(att => att?.meta?.type === "audio");

        if (containsAudio) {
          container.removeClass("thumbnails-wrapper").addClass("audio-wrapper-thumbnail");
          $(`#student-attachments-container-${questionIndex} .thumbnail`).css("aspect-ratio", "auto");
        } else {
          container.addClass("thumbnails-wrapper").removeClass("audio-wrapper-thumbnail");
        }

        attachments.forEach((attachment, i) => {
          const thumbnailUrl = attachment.url;
          const attachmentId = attachment._id;
          const viewType = attachment?.meta?.type;
          const isAudio = viewType === "audio";
          const mediaHtml = isAudio
            ? `<audio controls src="${thumbnailUrl}" preload="metadata "></audio>`
            : `<img src="${thumbnailUrl}" alt="Attachment ${i + 1}" />`;

          const thumbnailHtml = `
            <div class="thumbnail" data-index="${i}" style="${isAudio ? 'aspect-ratio: auto;' : ''}">
                ${mediaHtml}
                <button class="delete-attachment-btn"  data-attachment-type="${isAudio}" data-attachment-id="${attachmentId}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
          `;

          container.append(thumbnailHtml);
        });

        container.find(".thumbnail").on("click", function () {
          const selectedIndex = $(this).data("index");
          // Use centralized image slider component
          openImageSliderWithDirectUrls(attachments, selectedIndex);
        });

        container.find(".delete-attachment-btn").on("click", function (e) {
          e.stopPropagation();
          const isAudio = $(this).data("attachment-type")
          const attachmentId = $(this).data("attachment-id");
          showCustomConfirm(isAudio,
            function () {
              deleteAttachment(questionId, questionIndex, [attachmentId]);
            }
          );
        });
      } else {
        const question = questions[questionIndex];
        const requiresScanAndEdit =
          question.meta?.["student-responce-type"]?.["scan-and-edit"];
        const requiresWebcamCapture =
          question.meta?.["student-responce-type"]?.["webcam-capture"];
        const reqquiresAudioRecord =
          question.meta?.["student-responce-type"]?.["audio-response"];
        let noAttachmentHtml;

        if (requiresWebcamCapture) {
          noAttachmentHtml = `
            <div class="no-attachments-message">
                <i class="fas fa-camera"></i>
                <p class="attachment-info-text_1">No attachments uploaded yet.</p>
                <span class="take-photo-info-text_2">Please click the "Take Photo" button to upload your response.</span>
            </div>
          `;
        } else if (reqquiresAudioRecord) {
          noAttachmentHtml = `
          <div class="no-attachments-message">
              <i class="fas fa-microphone"></i>
              <p class="audio-info-text_1">No audio recordings uploaded yet.</p>
              <span class="audio-info-text_2">Please click the "Record Audio" button to upload your response.</span>
          </div>
          `;
        } else if (requiresScanAndEdit) {
          noAttachmentHtml = `
            <div class="no-attachments-message">
                <i class="fas fa-camera"></i>
                <p class="attachment-info-text_1">No attachments uploaded yet.</p>
               <span class="qr-scaner-info-text_2">Please scan the "QR" code to upload your response.</span>
            </div>
          `;
        }
        container.append(noAttachmentHtml);
      }
      renderLanguage("../exam-portal/translations/");
    },
    errorCallback: function (error) {
      console.error("Error fetching student attachments:", error);
    },
  });
}

function deleteAttachment(questionId, questionIndex, capturedResponseIds) {
  const examId = urlParams.get("examid");
  const studentId = urlParams.get("uid");
  const apiEndpoint = `${STUDENT_END_POINT}/captured-response?examId=${examId}&studentId=${studentId}&questionId=${questionId}`;
  const isEnglish = localStorage.getItem("lang") === "en";
  makeApiCall({
    url: apiEndpoint,
    method: "DELETE",
    isApiKey: true,
    data: JSON.stringify({ capturedResponseIds }),
    successCallback: function (response) {
      showToast(isEnglish?"Attachment deleted successfully": "تم حذف المرفق بنجاح", "success");
      fetchAndRenderStudentAttachments(questionId, questionIndex);
    },
    errorCallback: function (error) {
      console.error("Error deleting attachment:", error);
      showToast("Failed to delete attachment.", "error");
    },
  });
}

function showCustomConfirm(isAudio,callback) {
  // Remove any existing confirmation modal
  $(".custom-confirm-modal").remove();
  const isEnglish = localStorage.getItem("lang") === "en";
    
  const confirmModalHtml = `
      <div class="custom-confirm-modal">
          <div class="confirm-overlay"></div>
          <div class="confirm-container">
              <p class="confirm-message">${isEnglish? `Are you sure you want to delete this ${isAudio ? "audio" : "image"}?`:`هل أنت متأكد أنك تريد حذف هذا ${isAudio ? "الصوت" : "الصورة"}؟`}</p>
              <div class="confirm-buttons">
                  <button class="confirm-btn yes">${isEnglish?"Yes, Delete":"نعم، احذف"}</button>
                  <button class="confirm-btn no" >${isEnglish?"Cancel":"إلغاء"}</button>
              </div>
          </div>
      </div>
  `;

  $("body").append(confirmModalHtml);

  $(".custom-confirm-modal .confirm-btn.yes").on("click", function () {
    if (typeof callback === "function") {
      callback();
    }
    $(".custom-confirm-modal").remove();
  });

  $(
    ".custom-confirm-modal .confirm-btn.no, .custom-confirm-modal .confirm-overlay"
  ).on("click", function () {
    $(".custom-confirm-modal").remove();
  });
}

// Note: openAttachmentSlider function has been replaced with centralized ImageSlider component
// The functionality is now handled by openImageSliderWithDirectUrls() function from common/js/image-slider.js

$(document).on("click", ".refresh-attachments-btn", function () {
  const questionId = $(this).data("question-id");
  const questionIndex = $(this).data("question-index");
  fetchAndRenderStudentAttachments(questionId, questionIndex);
});

$(document).on("click", ".webcam-capture-btn", function () {
  const index = $(this).data("question-index");
  const scanUrl = $(this).data("scan-url");
  const modal = $(`#webcam-capture-modal-${index}`);
  const iframe = $(`#webcam-iframe-${index}`);
  const loadingElement = $(`#webcam-loading-${index}`);

  // Show modal with loading state
  modal.show();
  loadingElement.removeClass("hidden");

  // Set up message event listener for this specific modal
  window.addEventListener("message", function (event) {
    if (event.data === "closeIframe") {
      modal.hide();
      iframe.attr("src", "about:blank");
      loadingElement.removeClass("hidden");

      const questionId = modal
        .closest("[data-question-id]")
        .data("question-id");
      if (questionId) {
        setTimeout(() => {
          fetchAndRenderStudentAttachments(questionId, index);
        }, 500);
      }
    }
  });

  // Set up iframe load event
  iframe.off("load").on("load", function () {
    // Hide loading after iframe loads
    setTimeout(() => {
      loadingElement.addClass("hidden");
    }, 800); // Small delay to show loading completed
  });

  // Load the scanner URL
  setTimeout(() => {
    iframe.attr("src", scanUrl);
  }, 300); // Small delay to show loading animation
});

$(document).on("click", ".webcam-capture-close", function () {
  const index = $(this).data("question-index");
  const modal = $(`#webcam-capture-modal-${index}`);
  const iframe = $(`#webcam-iframe-${index}`);
  const loadingElement = $(`#webcam-loading-${index}`);

  // Hide modal and reset iframe
  modal.hide();
  iframe.attr("src", "about:blank");
  loadingElement.removeClass("hidden"); // Reset loading state for next time

  // Refresh attachments after closing (user might have uploaded something)
  const questionId = modal.closest("[data-question-id]").data("question-id");
  if (questionId) {
    setTimeout(() => {
      fetchAndRenderStudentAttachments(questionId, index);
    }, 500);
  }
});
