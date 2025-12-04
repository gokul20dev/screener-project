let stepCount = new URLSearchParams(window.location.search).get("stepper");
let urlParams = new URLSearchParams(window.location.search);
let examIds = getQueryParameter("id");
let registrationContent;
let InviteContent;
let questionCount = 0;
let totalMcqMarks = 0;
let totalSaqMarks = 0;
let totalMarksDisplay = 0;
let previousHash = "";
let oldMarksValues = {};
let examStatus = "";
let examCurrentStatus = "";
let tempQuestions = [];
let isTimeZone = false;
let examDurationMinutes;
let timezones = [];
let cutoffPercentage = 50;
let enableItemTypes = [];
let allTags = [];
let isSendPasscode = false;
let validateStep2IsValid = false;
let enableAIQuestionGenerator = false;
let enableInsight = false;
let currentGridData = [];
const dragDropZone = $("#dragDropZone")[0];
const examId = getQueryParameter("id");
let selectedGroups = [];
let selectedAttenders = [];
let allGroups = [];
let canSendEmail = false;
let canSendExamMail = false;
let canSendRegistrationMail = false;
const allowedFileTypes = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
  "audio/mpeg",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

// isDisableIR = false;

$(document).ready(function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const formattedDate = formatDateForDateInput(today);
  $("#edit-attender-btn").hide();
  $("#clear-attender-btn").hide();
  $("#navigate-to-report-btn").on("click", function () {
    const examId = getQueryParameter("id");
    if (examId) {
      window.location.href = `../reports/?examid=${examId}`;
    } else {
      displayToast("Error: Could not find exam ID.", "error");
    }
  });

  // Aesthetic accordion functionality
  $('.aesthetic-accordion-header').on('click', function () {
    const accordionId = $(this).data('accordion');
    const $content = $(`#${accordionId}`);
    const $header = $(this);
    const $item = $(this).parent('.aesthetic-accordion-item');

    // Toggle current accordion with smooth animation
    if ($header.hasClass('active')) {
      $header.removeClass('active');
      $content.removeClass('show').slideUp(400, 'swing');
      $item.removeClass('expanded');
    } else {
      // Close other accordions for better UX
      $('.aesthetic-accordion-header').removeClass('active');
      $('.aesthetic-accordion-content').removeClass('show').slideUp(400, 'swing');
      $('.aesthetic-accordion-item').removeClass('expanded');

      // Open clicked accordion
      $header.addClass('active');
      $content.addClass('show').slideDown(400, 'swing');
      $item.addClass('expanded');
    }
  });

  // Add hover effects for better interactivity
  $('.setting-card').hover(
    function () {
      $(this).find('.setting-icon').css('transform', 'scale(1.1)');
    },
    function () {
      $(this).find('.setting-icon').css('transform', 'scale(1)');
    }
  );

  // Smooth scroll to settings when header is clicked
  $('.aesthetic-settings-header').on('click', function () {
    const firstAccordion = $('.aesthetic-accordion-item').first();
    if (firstAccordion.length) {
      $('html, body').animate({
        scrollTop: firstAccordion.offset().top - 100
      }, 600);
    }
  });

  $("#main-table-search").on("input", function () {
    const value = $(this).val();
    gridOptions.api.setGridOption("quickFilterText", value);
  });

  $("#start-time").on("input", function () {
    $(this).val($(this).val());
  });

  $("#start-time").on("blur", function () {
    setTimeout(() => {
      $(".ui-timepicker-container").hide();
    }, 200);

    const timeVal = $(this).val().trim();
    if (!timeVal) return;

    const timePattern = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
    const match = timeVal.match(timePattern);
    if (match) {
      let hours = parseInt(match[1], 10);
      let minutes = parseInt(match[2], 10);
      const meridiem = match[3].toUpperCase();

      if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
        displayToast(
          "Please enter a valid time in HH:MM AM/PM format",
          "error",
          6000
        );
        $(this).val("");
      } else {
        const formattedHours = hours < 10 ? "0" + hours : hours;
        const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
        $(this).val(`${formattedHours}:${formattedMinutes} ${meridiem}`);
      }
    } else {
      displayToast(
        "Please enter time in HH:MM AM/PM format (e.g., 09:30 AM)",
        "error",
        6000
      );
      $(this).val("");
    }
  });

  $("#start-date").attr("min", formattedDate);

  // Add blur handler to validate selected date
  $("#start-date").on("blur", function () {
    const selectedDate = new Date($(this).val());
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() < today.getTime()) {
      displayToast("Please select today or a future date", "error", 6000);
      $(this).val(""); // Clear the input
      $(this).attr("placeholder", "MM/DD/YYYY");
    }
  });

  $("#user-email").text(localStorage.getItem("email") || "Profile Information");

  $("#user-filter-input").on("click", function () {
    $("#time-zone").find("ul").show();
  });

  $("#time-zone").find("ul").hide();
  $("#ai-generate-btn").hide();
  $("#group-import-btn").hide();

  $("#uncheck-selected").on("click", function () {
    gridOptions.api.deselectAll();
  });

  $("#prev-to-step-2").on("click", () => {
    $("#step-1-circle").addClass("tab-circle-border-active");
    $("#1-pratent").addClass("tab-circle-active");
    $("#step-2-circle").addClass("tab-circle-border-active");
    $("#step-3-circle").removeClass("tab-circle-border-active");
    $("#3-pratent").removeClass("tab-circle-active");
    $("#2-pratent").addClass("tab-circle-active");
    $("#line-first").find(".line").addClass("active-line");
    $("#line-second").find(".line").removeClass("active-line");
    $("#line-first").find(".point").addClass("active-arrow");
    $("#line-second").find(".point").removeClass("active-arrow");
  });

  $("#prev-to-step-1").on("click", () => {
    $("#prev-to-step-1")[0].style.setProperty("display", "none", "important");
    $("#preview-and-next")[0].style.setProperty("display", "none", "important");
    $("#next-to-step-2")[0].style.setProperty("display", "block", "important");
    $("#step-1-circle").addClass("tab-circle-border-active");
    $("#1-pratent").addClass("tab-circle-active");
    $("#line-first").find(".line").addClass("active-line");
    $("#line-second").find(".line").removeClass("active-line");
    $("#line-first").find(".point").addClass("active-arrow");
    $("#line-second").find(".point").removeClass("active-arrow");
    $("#2-pratent").removeClass("tab-circle-active");
    $("#step-2-circle").removeClass("tab-circle-border-active");
  });

  $(".timepicker").timepicker({
    timeFormat: "h:mm p",
    interval: 5,
    minTime: "24",
    maxTime: "11:55pm",
    defaultTime: "1",
    startTime: "5:00am",
    dynamic: false,
    dropdown: true,
    scrollbar: true,
  });
  $(".card-body").on("scroll", function () {
    $(".timepicker").blur();
  });

  $("#preview-and-next").on("click", function () {
    if (validateStep2IsValid) {
      urlParams.set("stepper", 3);
      history.pushState(null, "", "?" + urlParams.toString());
      navigateToStep(3);
      $("#step-1-circle").addClass("tab-circle-border-active");
      $("#1-pratent").addClass("tab-circle-active");
      $("#step-2-circle").addClass("tab-circle-border-active");
      $("#2-pratent").addClass("tab-circle-active");
      $("#step-3-circle").addClass("tab-circle-border-active");
      $("#3-pratent").addClass("tab-circle-active");
      $("#line-first").find(".line").addClass("active-line");
      $("#line-second").find(".line").addClass("active-line");
      $("#line-first").find(".point").addClass("active-arrow");
      $("#line-second").find(".point").addClass("active-arrow");
      $("#step-1").removeClass("active");
      $("#step-2").removeClass("active");
      $("#step-3").addClass("active");
      $("#preview-and-next")[0].style.setProperty(
        "display",
        "none",
        "important"
      );
      $("#finalize-btn")[0].style.setProperty("display", "block", "important");
      $("#prev-to-step-1")[0].style.setProperty("display", "none", "important");
      $("#prev-to-step-2")[0].style.setProperty(
        "display",
        "block",
        "important"
      );
    }
  });

  $("#add-question-btn").click(() => {
    if ($("#question-type").val() === "") {
      return;
    }

    let oldMarks = parseInt($(".total-marks-container input").val()) || 0;

    oldMarks += 1;
    $(".total-marks-container input").val(oldMarks.toFixed(2));

    let questionType = $("#question-type").val();

    if (questionType == "MCQ") {
      addMcqQuestion();
    } else if (questionType == "TF") {
      addTFQuestion();
    } else if (questionType == "SAQ") {
      addSaqQuestion();
    } else if (questionType == "FTB") {
      addFtbQuestion();
    } else if (questionType == "IR") {
      addIrQuestion();
    } else if (questionType == "UD") {
      addDuQuestion();
    } else if (questionType == "PRQ") {
      addPrqQuestion();
    } else if (questionType == "OR") {
      addOrQuestion();
    } else if (questionType == "MTF") {
      addMTFQuestion();
    } else if (questionType == "TAB") {
      addTabQuestion();
    }
  });

  $("#add-saq-btn").click(() => {
    let oldMarks = parseInt($(".total-marks-container input").val()) || 0;

    oldMarks += 1;

    $(".total-marks-container input").val(oldMarks.toFixed(2));

    addSaqQuestion();
  });

  $("#national_id_label").text(`${national_ID}`);
  $("#sla_id_label").text(`${sla_ID}`);

  $("#edit-attender-btn").click(function () {
    const email = $("#email").val().trim();
    const id = $("#sla_id").val();
    const id2 = $("#national_id").val();
    if (id || id2) {
      const entranceExamId = getQueryParameter("id");
      const endpointUrl = `${EXAM_END_POINT}/attender?entranceExamId=${entranceExamId}&mail=${email}`;
      makeApiCall({
        url: endpointUrl,
        method: "PUT",
        data: JSON.stringify({ id: id2, id2 }),
        successCallback: function (response) {
          displayToast("Attender Edited successfully!", "success");
          reloadAttendees(entranceExamId);
          $("#email").val("").prop("disabled", false);
          $("#edit-attender-btn").hide();
           $("#clear-attender-btn").hide();
        },
        errorCallback: function (error) {
          displayToast(`Error:${error}`, "error");
        },
      });
      $("#email").val("");
      $("#sla_id").val("");
      $("#national_id").val("");
      $("#add-emails-btn").show();
    }
  });

  $("#add-emails-btn").click(function () {
    const email = $("#email").val().trim();
    const SLA_ID = $("#sla_id").val();
    const Naional_ID = $("#national_id").val();

    // Regular expression for email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      displayToast("Email is empty. Please add an email address.", "error");
      return false;
    }
    if (!emailRegex.test(email)) {
      displayToast("invalid email format", "error");
      return false;
    }
    if (SLA_ID == "" || Naional_ID == "") {
      displayToast(`invalid ${national_ID}`, "error");
      return false;
    }

    if (email.toLowerCase() !== email) {
      displayToast("Email must be in lowercase", "error");
      return false;
    }

    if (currentGridData.some((value) => value?.mail?.includes(email))) {
      displayToast("Already this attenders exits", "error");
      return false;
    }

    if (email.toLowerCase() !== email) {
      displayToast("Email must be in lowercase", "error");
      return false;
    }

    if (currentGridData.some((value) => value?.mail?.includes(email))) {
      displayToast("Already this attenders exits", "error");
      return false;
    }

    const emailPayload = {
      newAttenders: [
        {
          mail: email,
          id: Naional_ID,
          id2: Naional_ID,
        },
      ],
      oldAttenders: [],
    };

    const entranceExamId = getQueryParameter("id");
    const endpointUrl = `${EXAM_END_POINT}/attender?entranceExamId=${entranceExamId}`;

    makeApiCall({
      url: endpointUrl,
      method: "POST",
      data: JSON.stringify(emailPayload),
      successCallback: function (response) {
        displayToast("Emails added successfully!", "success");
        reloadAttendees(entranceExamId);
      },
      errorCallback: function (error) {
        displayToast(`Error:${error}`, "error");
      },
    });

    // $('#audience-emails').val('');
    $("#email").val("");
    $("#sla_id").val("");
    $("#national_id").val("");
  });

  $("#delete-selected").on("click", function () {
    const selectedRows = gridOptions.api.getSelectedRows();
    const email = selectedRows.map((selected) => selected.mail);
    const entranceExamId = getQueryParameter("id");
    const endpointUrl = `${EXAM_END_POINT}/attender?entranceExamId=${entranceExamId}`;

    // Show custom delete confirmation modal
    showDeleteConfirmation();

    // Handle delete confirmation
    function showDeleteConfirmation() {
      const modal = document.getElementById("customDeleteModal");
      modal.classList.add("active");

      // Close modal handlers
      document.getElementById("closeDeleteModal").onclick = function () {
        closeDeleteModal();
      };

      document.getElementById("cancelDeleteBtn").onclick = function () {
        closeDeleteModal();
      };

      // Handle click outside the modal to close it
      const overlay = modal.querySelector(".custom-modal-overlay");
      overlay.onclick = function (event) {
        if (event.target === overlay) {
          closeDeleteModal();
        }
      };

      // Add ESC key handler
      document.addEventListener("keydown", handleEscKey);

      function handleEscKey(event) {
        if (event.key === "Escape") {
          closeDeleteModal();
        }
      }

      function closeDeleteModal() {
        modal.classList.remove("active");
        document.removeEventListener("keydown", handleEscKey);
      }

      // Confirm button handler
      document.getElementById("confirmDeleteBtn").onclick = function () {
        closeDeleteModal();

        // Proceed with deletion
        makeApiCall({
          url: endpointUrl,
          method: "DELETE",
          data: JSON.stringify({ attenderMails: email }),
          successCallback: function (response) {
            displayToast("Email removed successfully!", "success");
            gridOptions.api.applyTransaction({ remove: selectedRows });
            currentGridData = currentGridData.filter(
              (value) => !email.includes(value.mail)
            );
            $(".selected-rows").css({ opacity: 0, visibility: "hidden" });
          },
          errorCallback: function (error) {
            displayToast(`Error:${error}`, "error");
          },
        });
      };
    }
  });

  $("#send-invite-to-all-btn").click(function () {
    const allEmails = [];
    emailTable.rows().every(function (rowIdx) {
      const data = this.data();
      allEmails.push(data[1]); // Assuming email is in the second column
    });
  });

  $("#preview-and-next").click(function () {
    if (validateStep2()) {
      const examId = getQueryParameter("id");
      const questions = [];
      validateStep2IsValid = true;
      let totalMarks = 0;

      // Get global shuffle questions setting
      const globalShuffleQuestions = $("#shuffle-questions-toggle").prop("checked");

      $("#questions-container .question").each(function () {
        const id = $(this).attr("id").split("-")[1];
        let questionText = $(`#question-text-${id}`).val();
        const questionType = $(this).attr("data-qtype");
        const backendId = $(this).attr("data-realid");
        // Shuffle questions is now controlled globally
        // Shuffle options is only available for MCQ and FTB questions
        let shuffleOption = false;
        if (questionType === "MCQ" || questionType === "FTB" || questionType === "MTF") {
          shuffleOption = $(this).find(".shuffleOption").prop("checked");
        }
        const shouldEv = $(this).find(".shouldEv").prop("checked");
        const programmingLanguage = $(this).find(".lang-select").val();
        const marksValue = parseFloat($(`.mark${id}`).val());
        const tags = $(this)
          .find(".tag-item")
          .map(function () {
            const tagName = $(this).data("name");
            let tagId = $(this).data("id");

            if (!tagId) {
              const existingTag = allTags.find((tag) => tag.name === tagName);
              if (existingTag) {
                tagId = existingTag.id;
              }
            }

            return { name: tagName, _id: tagId };
          })
          .get();

        const studentResponseTool = getQuestionResponseTool(id);

        // const totalMarks = $(`.total-mark`).val()

        totalMarks += shouldEv ? marksValue : 0;
        let choices = [];
        let blanks = [];
        let correct = "";

        if (questionType === "MCQ") {
          $(`#choices-${id} .choice`).each(function () {
            const choiceKey = $(this).attr("id").split("-")[1];
            const choiceId = $(this).attr("data-choice-id");
            const choiceLabel = $(`#choice-${choiceKey}-text-${id}`).val();
            const attachmentContainer = $(
              `#choice-attachment-container-${id}-${choiceKey}`
            );
            const attachment = JSON.parse(
              attachmentContainer.attr("data-attachments") || "[]"
            );
            const choiceData = {
              key: choiceKey,
              label: choiceLabel,
              ...(choiceId && choiceId !== "new" && { _id: choiceId }),
              attachments: attachment,
            };

            choices.push(choiceData);
          });

          correct = $(`input[name="correct-${id}"]:checked`).val();
        }

        if (questionType === "TF") {
          correct = $(`input[name="true-or-false-${id}"]:checked`).val();
        }

        const attachmentContainer = $(`#attachment-container-${id}`);
        const attachments = JSON.parse(
          attachmentContainer.attr("data-attachments") || "[]"
        );

        // FTB SPECIFIC PROCESSING
        if (questionType === "FTB") {
          $(`#blanks-answers-${id} .blank-answer`).each(function () {
            const blankId = $(this).data("blank-id").split("-")[2];
            const answerType = $(this).find(".answer-type").val();

            const values = [];
            if (answerType === "text") {
              $(this)
                .find(".text-answer-group input")
                .each(function () {
                  const val = $(this).val().trim();
                  if (val) {
                    values.push({
                      value: val,
                      isCorrect: true,
                    });
                  }
                });
            } else {
              // dropdown
              $(this)
                .find(".option-item")
                .each(function () {
                  const optionText = $(this).find(".option-text").val().trim();
                  const isCorrect = $(this)
                    .find(".correct-option")
                    .is(":checked");
                  if (optionText) {
                    values.push({
                      value: optionText,
                      isCorrect: isCorrect,
                    });
                  }
                });
            }

            blanks.push({
              identity: blankId.toString(),
              type: answerType,
              values: values,
            });
          });
          $(`#question-${id}`).attr("data-ftb-blanks", JSON.stringify(blanks));
        }

        // Handle TAB question type blanks
        if (questionType === "TAB") {
          $(`#tab-blanks-container-${id} .blank-item`).each(function () {
            const blankId = $(this).data("blank-id").split("-")[3]; // Get the blank ID from the format tab-blank-questionId-blankId
            const cellRef = $(this).data("cell-ref"); // Get the cell reference

            // Get answers data
            let answersData = [];
            try {
              answersData = JSON.parse($(this).attr("data-answers") || "[]");
            } catch (e) {
              console.error("Error parsing answers:", e);
              answersData = [];
            }

            // Format the values with isCorrect flag
            const values = answersData.map((answer, index) => {
              return {
                value: answer.value,
                isCorrect: index === 0, // First answer is primary (correct), others are alternatives
              };
            });
            // If we have no values but have a DOM structure with answers, try to extract from DOM
            if (values.length === 0) {
              const $answersDisplay = $(this).find(".answers-display");
              const primaryAnswer = $answersDisplay
                .find(".primary-answer")
                .text()
                .trim();

              if (primaryAnswer) {
                values.push({
                  value: primaryAnswer,
                  isCorrect: true,
                });

                $answersDisplay.find(".alternative-answer").each(function () {
                  const altAnswer = $(this).text().trim();
                  if (altAnswer) {
                    values.push({
                      value: altAnswer,
                      isCorrect: false,
                    });
                  }
                });
              }
            }

            // Add to blanks array with identity as the cell reference
            blanks.push({
              identity: cellRef || blankId.toString(),
              type: "text", // TAB questions always use text type
              values: values,
            });
          });
          $(`#question-${id}`).attr("data-tab-blanks", JSON.stringify(blanks));
        }

        let correctOrder = [];
        // Handle ordering questions (OR type)
        if (questionType === "OR") {
          // Get options (all items in the ordering list)
          $(`#ordering-items-list-${id} .ordering-item`).each(function () {
            const itemText = $(this).find(".ordering-item-text").text();
            correctOrder.push(itemText);
          });
          $(`#question-${id}`).attr(
            "data-correct-order",
            JSON.stringify(correctOrder)
          );
          // Get correctOrder data from the data attribute
          const correctOrderData = $(`#ordering-items-${id}`).data(
            "correctOrder"
          );
          if (correctOrderData && Array.isArray(correctOrderData)) {
            correctOrder = correctOrderData;
          } else {
            // Fallback: Get order from current DOM structure
            const items = [];
            $(`#ordering-items-list-${id} .ordering-item`).each(function () {
              items.push($(this).find(".ordering-item-text").text());
            });
            correctOrder = items;
          }
        }
        if (questionType === "MTF") {
          questionText = questionText;
          if (questionText.endsWith("</p>")) {
            questionText = questionText.slice(0, -4);
          }

          $(`#matches-answers-${id} .match-container`).each(function () {
            const matchId = $(this).attr("data-match-id").split("-")[2];
            const matchQuestion = $(this).find(".match-question").val();
            const matchAnswer = $(this).find(".match-answer").val();
            questionText += matchId + "\uFE0F\u20E3" + matchQuestion;

            const values = [
              {
                value: matchAnswer,
                isCorrect: true,
              },
            ];

            blanks.push({
              identity: matchId.toString(),
              type: "text",
              values: values,
            });
          });
          const questionMtf = (questionText || "").replace(/<\/?p>/g, "");
          $(`#question-${id}`).attr("data-mtf-question", questionMtf);
          $(`#question-${id}`).attr("data-mtf-blanks", JSON.stringify(blanks));
          questionText += "</p>";
        }

        if (backendId !== "new") {
          questions.push({
            _id: backendId,
            question: questionText,
            choices: choices,
            tags: tags,
            blanks: blanks,
            programmingLanguage: programmingLanguage,
            correctChoice: correct,
            attachments: attachments,
            type: questionType,
            shouldShuffleQts: globalShuffleQuestions,
            shouldShuffleOptions: shuffleOption,
            shouldEvaluate: shouldEv,
            allowedMaxChar: 500,
            marks: marksValue,
            correctOrder: correctOrder,
            meta: {
              ...(studentResponseTool && {
                "student-responce-type": studentResponseTool,
              }),
            },
            ...(questionType === "TAB" && {
              table: buildTableObject(id),
            }),
          });
        } else {
          questions.push({
            question: questionText,
            choices: choices,
            tags: tags,
            blanks: blanks,
            programmingLanguage: programmingLanguage,
            correctChoice: correct,
            attachments: attachments,
            type: questionType,
            shouldShuffleQts: globalShuffleQuestions,
            shouldShuffleOptions: shuffleOption,
            shouldEvaluate: shouldEv,
            allowedMaxChar: 500,
            marks: marksValue,
            correctOrder: correctOrder,
            meta: {
              ...(studentResponseTool && {
                "student-responce-type": studentResponseTool,
              }),
            },
            ...(questionType === "TAB" && {
              table: buildTableObject(id),
            }),
          });
        }
      });

      saveQuestions(examId, questions, function () {
        let previewHtml = "";

        $("#questions-container .question").each(function () {
          const id = $(this).attr("id").split("-")[1];
          const questionType = $(this).attr("data-qtype");
          let questionText = $(this).find("textarea").val();
          const isEvaluate = $(this).find(".shouldEv").prop("checked");
          const marksValue = isEvaluate ? parseFloat($(`.mark${id}`).val()) : 0;
          const correctChoices = $(this)
            .find('input[type="radio"]:checked')
            .val();

          let choicesHtml = "";
          if (questionType === "MCQ") {
            choicesHtml = $(this)
              .find(".choice")
              .map(function () {
                const choiceText = $(this).find("textarea").val();
                const choiceKey = $(this).find('input[type="radio"]').val();
                const isCorrect = choiceKey === correctChoices;
                const choiceId = $(this).attr("id").split("-")[1];

                const $choiceAttachmentContainer = $(
                  `#choice-attachment-container-${id}-${choiceId}`
                );
                const attachments = JSON.parse(
                  $choiceAttachmentContainer.attr("data-attachments") || "[]"
                );

                // Generate image HTML from attachments
                const attachmentsHtml =
                  attachments.length > 0
                    ? `
                  <div class="preview-image-grid">
  ${attachments
                      .map((attachment) => {
                        if (attachment.type === "image") {
                          return `
          <div class="preview-image-item">
            <img src="${attachment.url}" 
                 alt="${attachment.name}" 
                 title="${attachment.name}"
                 onerror="handleImageError(this)">
          </div>
        `;
                        } else if (attachment.type === "audio") {
                          return `
          <div class="preview-image-item">
            <audio controls src="${attachment.url}" onerror="handleImageError(this)"></audio>
          </div>
        `;
                        } else if (attachment.type === "application") {
                          return `
         <div class="preview-image-item">
          <div class="attachment-resume">
            <object class="finalize-preview-resume" data="${attachment.url}" type="application/pdf" onerror="handleImageError(this)">
              <p>Your browser doesn't support PDF preview.</p>
            </object>
          </div>
           </div>
        `;
                        } else {
                          return ""; // fallback for unsupported types
                        }
                      })
                      .join("")}
</div>

                    `
                    : "";

                return `<div class="preview-choice ${isCorrect ? "correct-answer" : ""
                  }">
                                <div class="choice-question-wrapper">
                                    <b>${choiceKey}:</b>
                                    <span>${choiceText}</span>
                                </div>
                                ${attachmentsHtml}
                            </div>`;
              })
              .get()
              .join("");
          } else if (questionType === "TF") {
            choicesHtml = `<div class = "preview-choice ${correctChoices === "true" ? "correct-answer" : ""
              }">
  True
</div>
<div class = "preview-choice ${correctChoices === "true" ? "" : "correct-answer"
              }">
  False
</div>`;
          } else if (questionType === "FTB") {
            const blanks = JSON.parse(
              $(`#question-${id}`).attr("data-ftb-blanks")
            );

            const blanksIdentityHtml = blanks
              .map((blank, i) => {
                const blankValueData = (blank.values || [])
                  .map(
                    (val, i) => `<div class="ftb-blanks-val ${(blank.type === "text" && i === 0) ||
                        (blank.type === "dropdown" && val.isCorrect)
                        ? "correct-answer"
                        : ""
                      }"><b>${i + 1}:</b> ${val.value}</div>
        <div class = "ftb-alternative-answer">${blank.type === "text" && i < 1 ? "Alternative answers" : ""
                      }</div>
        `
                  )
                  .join("");

                return `
        <div class="ftb-preview-values">
          <div class="ftb-blanks-heading">
          <span>Blank ${blank.identity}</span>
          </div>
          ${blankValueData}
        </div>
      `;
              })
              .join("");

            choicesHtml = `<div class="ftb-preview-blanks">${blanksIdentityHtml}</div>`;
          } else if (questionType === "OR") {
            const choiceOrderAttr = $(this).attr("data-correct-order");
            const correctOrder = JSON.parse(choiceOrderAttr);
            const correctOrderHtml = correctOrder
              .slice()
              .map(
                (order, i) => `
    <div class="ftb-blanks-val"><b>${i + 1}:</b>${order}</div>
  `
              )
              .join("");

            choicesHtml = `
<div>${correctOrderHtml}</div>
`;
          } else if (questionType === "MTF") {
            const questionMtf = $(this).attr("data-mtf-question");
            const mtfBlanksAttr = $(this).attr("data-mtf-blanks");
            const mtfBlanks = mtfBlanksAttr ? JSON.parse(mtfBlanksAttr) : [];

            const matches = [
              ...questionMtf.matchAll(
                /([\d]\uFE0F?\u20E3)(.*?)(?=[\d]\uFE0F?\u20E3|$)/gs
              ),
            ];

            const result = matches.map(([, emoji, text]) => {
              const number = emoji.codePointAt(0) - 48;
              return {
                emoji,
                number,
                text: text.trim(),
              };
            });

            const mtfChoices = result
              .map(
                (res, i) => `
<div class = "mtf-preview-value"><span>${res.emoji} ${res.text}</span><div><i class="fas fa-arrow-right"></i></div><span class="correct-answer">${res.emoji} ${mtfBlanks[i].values[0].value}</span></div>

`
              )
              .join("");
            choicesHtml = `<div>${mtfChoices}</div>`;
          } else if (questionType === "TAB") {
            const tabBlanksAttr = $(this).attr("data-tab-blanks");
            const tabBlanks = tabBlanksAttr ? JSON.parse(tabBlanksAttr) : [];

            const tabTable = buildTableObject(id);

            let numRows = tabTable.rows;
            let numColumns = tabTable.columns;

            let tableHtml = '<div class="accountence-table-container">';
            tableHtml += '<table class="accountence-table">';

            // Build table
            for (let r = 1; r <= numRows; r++) {
              let rowHtml = "<tr>";
              for (let c = 0; c < numColumns; c++) {
                const cellId = String.fromCharCode(65 + c) + r;
                const cellIndex = (r - 1) * numColumns + c;
                const cellData = tabTable.cells?.[cellIndex] || {};
                const isBlank = cellData.value === "[blank]";
                const filledValue =
                  tabBlanks.find((item) => item.identity === cellId)
                    ?.values?.[0]?.value || "";

                rowHtml += isBlank
                  ? `<td class="editable-cell prevtab-correct-answer">&nbsp;${escapeHtml(
                    filledValue
                  )}</td>`
                  : `<td class="editable-cell">&nbsp;${escapeHtml(
                    cellData.value
                  )}</td>`;
              }
              rowHtml += "</tr>";
              tableHtml += rowHtml;
            }

            tableHtml += "</table></div>";
            choicesHtml += `<div>${tableHtml}</div>`;
          }

          const imageHtml = $(this)
            .find(".image-preview img")
            .map(function () {
              const imgSrc = $(this).attr("src");
              const altText = $(this).attr("alt");
              return `<div class="preview-image image-size-style"><img src="${imgSrc}" alt="${altText}" onerror="handleImageError(this)"></div>`;
            })
            .get()
            .join("");

          // Get attachments from data attribute
          const $attachmentContainer = $(`#attachment-container-${id}`);
          const attachments = JSON.parse(
            $attachmentContainer.attr("data-attachments") || "[]"
          );

          // Generate image HTML from attachments
          const newImageHtml =
            attachments.length > 0
              ? `
                    <div class="preview-image-grid">
                        ${attachments
                .map((attachment) => {
                  if (attachment.type === "image") {
                    return `
                                  <div class="preview-image-item">
                                    <img src="${attachment.url}" 
                                         alt="${attachment.name}" 
                                         title="${attachment.name}"
                                         onerror="handleImageError(this)">
                                  </div>
                                `;
                  } else if (attachment.type === "audio") {
                    return `
                                  <div class="preview-image-item">
                                    <audio controls src="${attachment.url}" onerror="handleImageError(this)"></audio>
                                  </div>
                                `;
                  } else if (attachment.type === "application") {
                    return `
                                 <div class="preview-image-item">
                                  <div class="attachment-resume">
                                    <object class="finalize-preview-resume" data="${attachment.url}" type="application/pdf" onerror="handleImageError(this)">
                                      <p>Your browser doesn't support PDF preview.</p>
                                    </object>
                                  </div>
                                   </div>
                                `;
                  } else {
                    return ""; // fallback for unsupported types
                  }
                })
                .join("")}
                    </div>
                `
              : "";

          // Get response tool information for SAQ and PRQ
          let responseToolHtml = "";
          if (questionType === "SAQ" || questionType === "PRQ") {
            const responseTool = $(this).attr("data-response-tool");
            if (responseTool) {
              let toolDisplayName = "";
              let toolIcon = "";
              let toolClass = "";

              if (responseTool === "digital-writing") {
                toolDisplayName = "Digital Writing";
                toolIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/></svg>';
                toolClass = "response-tool-digital-writing";
              } else if (responseTool === "qr-upload") {
                toolDisplayName = "Scan and Edit";
                toolIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V2zM1 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V7zM1 12a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2z"/></svg>';
                toolClass = "response-tool-scan-edit";
              } else if (responseTool === "webcam-capture") {
                toolDisplayName = "Webcam Capture";
                toolIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.25 3.5a.25.25 0 0 0-.4-.2l-3 2.25a.25.25 0 0 0-.1.2v3.5a.25.25 0 0 0 .1.2l3 2.25a.25.25 0 0 0 .4-.2v-8zM11 2H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM3 4h8v6H3V4z"/><circle cx="7" cy="7" r="2"/></svg>';
                toolClass = "response-tool-webcam";
              } else if (responseTool === "audio-response") {
                toolDisplayName = "Audio Response";
                toolIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4.75a.75.75 0 0 0-1.5 0V8.5a.75.75 0 0 0 1.5 0V4.75z"/><path d="M4.5 8.5A3.5 3.5 0 0 1 8 5a3.5 3.5 0 0 1 3.5 3.5v.5a.75.75 0 0 0 1.5 0V8.5a5 5 0 0 0-4.25-4.937V1.75a.75.75 0 0 0-1.5 0v1.813A5 5 0 0 0 3 8.5v.5a.75.75 0 0 0 1.5 0v-.5z"/><path d="M8 11.5a.5.5 0 0 1 .5.5v2.5a.5.5 0 0 1-1 0V12a.5.5 0 0 1 .5-.5z"/><path d="M8 7.25a.25.25 0 1 0 0 .5.25.25 0 0 0 0-.5z"/></svg>';
                toolClass = "response-tool-audio";
              }

              if (toolDisplayName) {
                responseToolHtml = `
                  <div class="response-tool-badge ${toolClass}">
                    <span class="response-tool-icon">${toolIcon}</span>
                    <span class="response-tool-text">Student Response: ${toolDisplayName}</span>
                  </div>`;
              }
            }
          }

          // Get programming language for PRQ
          let languageHtml = "";
          if (questionType === "PRQ") {
            const programmingLanguage = $(this).find(".lang-select").val();
            if (programmingLanguage) {
              languageHtml = `
                <div class="programming-language-badge">
                  <span class="language-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z"/>
                    </svg>
                  </span>
                  <span class="language-text">Language: ${programmingLanguage}</span>
                </div>`;
            }
          }

          previewHtml += `<div class="preview-question">
                                        <span class="preview-speech-bubble-badge">${questionType}</span>
                                        <p class="marks">${isEvaluate
              ? `<b>Marks:</b> ${marksValue}`
              : `<b class = "not-evaluate"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M16.192 6.344L11.949 10.586 7.707 6.344 6.293 7.758 10.535 12 6.293 16.242 7.707 17.656 11.949 13.414 16.192 17.656 17.606 16.242 13.364 12 17.606 7.758z"></path></svg>Not Evaluate</b>`
            }</p>
                                        <h3>${questionText}</h3>
                                        ${responseToolHtml}
                                        ${languageHtml}
                                        ${choicesHtml}
                                        ${newImageHtml}
                                    </div>`;
        });

        const totalMarksHtml = `<div class="preview-total-marks">
                                <h3>Total Marks: ${totalMarks?.toFixed(2)}</h3>
                            </div>`;

        $("#preview-content").html(totalMarksHtml + previewHtml);

        $("#preview-modal").dialog({
          modal: true,
          width: "80%",
          buttons: {
            Print: {
              text: "Print",
              class: "btn-print",
              click: function () {
                printPreview();
              },
            },
            Next: {
              text: "Next",
              class: "btn-next",
              click: function () {
                const params = new URLSearchParams(window.location.search);
                $(this).dialog("close");
                // $('.total-mark').val(0)
                markStepCompleted("#link-to-step-2");
                navigateToStep(3);
                urlParams.set("id", params.get("id"));
                urlParams.set("stepper", 3);
                history.pushState(null, "", "?" + urlParams.toString());
                $("#next-to-step-2").css({ display: "none" });
                $("#preview-and-next").css({ display: "none" });
                $("#preview-and-next")[0].style.setProperty(
                  "display",
                  "none",
                  "important"
                );
                $("#finalize-btn")[0].style.setProperty(
                  "display",
                  "block",
                  "important"
                );
                $("#prev-to-step-1")[0].style.setProperty(
                  "display",
                  "none",
                  "important"
                );
                $("#prev-to-step-2")[0].style.setProperty(
                  "display",
                  "block",
                  "important"
                );
                $("#next-to-step-2")[0].style.setProperty(
                  "display",
                  "none",
                  "important"
                );
                $("#step-1-circle").addClass("tab-circle-border-active");
                $("#1-pratent").addClass("tab-circle-active");
                $("#step-2-circle").addClass("tab-circle-border-active");
                $("#2-pratent").addClass("tab-circle-active");
                $("#step-3-circle").addClass("tab-circle-border-active");
                $("#3-pratent").addClass("tab-circle-active");
                $("#line-first").find(".line").addClass("active-line");
                $("#line-second").find(".line").addClass("active-line");
                $("#line-first").find(".point").addClass("active-arrow");
                $("#line-second").find(".point").addClass("active-arrow");
                $("#prev-to-step-2").removeClass("d-none");
                $("#prev-to-step-1").addClass("d-none");
                if (currentGridData.length && examId && questionCount > 0) {
                  $("#3-pratent .tab-circle-text").css({ color: "#2F80ED" });
                  $("#step-3-circle").css({ border: "2px solid #2F80ED" });
                  $("#3-pratent .tab-circle-border .tab-circle").css({
                    backgroundColor: "#2F80ED !important",
                  });

                  $("#line-first")
                    .find(".point")
                    .css({ borderLeft: "11px solid #16A34A" });
                  $("#line-first")
                    .find(".line")
                    .css({ backgroundColor: "#16A34A" });
                  $("#1-pratent .tab-circle-text").css({ color: "#16A34A" });
                  $("#step-1-circle").css({ border: "2px solid #16A34A" });
                  $("#1-pratent .tab-circle-border .tab-circle").css({
                    backgroundColor: "#16A34A",
                  });

                  $("#line-second")
                    .find(".point")
                    .css({ borderLeft: "11px solid #16A34A" });
                  $("#line-second")
                    .find(".line")
                    .css({ backgroundColor: "#16A34A" });
                  $("#2-pratent .tab-circle-text").css({ color: "#16A34A" });
                  $("#step-2-circle").css({ border: "2px solid #16A34A" });
                  $("#2-pratent .tab-circle-border .tab-circle").css({
                    backgroundColor: "#16A34A",
                  });
                }

                $("#step-2-circle").css({ border: "2px solid #16A34A" });
                $("#2-pratent .tab-circle-border .tab-circle").css({
                  backgroundColor: "#16A34A !important",
                });
                $("#2-pratent .tab-circle-text").css({ color: "#16A34A" });
                $("#line-first")
                  .find(".line")
                  .css({ backgroundColor: "1.5px solid #16A34A" });
                $("#line-second")
                  .find(".point")
                  .css({ borderLeft: "11px solid #16A34A" });
                $("#line-second")
                  .find(".line")
                  .css({ backgroundColor: "1.5px solid #16A34A" });
              },
            },
          },
          create: function (event, ui) {
            $(".ui-widget-overlay").css({
              background: "rgb(40, 167, 69)",
              "backdrop-filter": "blur(5px)",
            });
            var closeButton = $(
              '<button type="button" class="ui-button ui-corner-all ui-widget ui-dialog-titlebar-close" title="Close">X</button>'
            );
            closeButton.on("click", function () {
              validateStep2IsValid = false;
              $("#preview-modal").dialog("close");
            });
            $(this)
              .closest(".ui-dialog")
              .find(".ui-dialog-titlebar")
              .append(closeButton);
          },
        });
      });
    }
  });

  $("#registration-content").trumbowyg({
    semantic: false,
    removeformatPasted: true,
    autogrow: true,
  });

  $("#invitation-content").trumbowyg({
    semantic: false,
    removeformatPasted: true,
    autogrow: true,
  });

  // Updated email template dialog configuration
  $("#email-template").dialog({
    autoOpen: false,
    modal: true,
    title: "Email Templates",
    width: "80%",
    buttons: {
      "Reset format": {
        text: "Reset format",
        class: "btn-reset",
        click: function () {
          const activeTab = $(".tab-content.active").attr("id");
          loadDefaultContent(
            activeTab === "registration-tab",
            activeTab === "invitation-tab",
            (success, defaults) => {
              applyResetContent(activeTab, defaults);
              displayToast(
                success
                  ? "Reset to organization defaults"
                  : "Reset to system defaults",
                success ? "success" : "warning"
              );
            }
          );
        },
      },
      Save: {
        text: "Save",
        class: "btn-save",
        click: function () {
          const entranceExamId = getQueryParameter("id");

          const activeTab = $(".tab-content.active").attr("id");

          const payload = {
            registrationContent: $("#registration-content").trumbowyg("html"),
            registrationSubject: $("#registration-subject").val(),
            invitationContent: $("#invitation-content").trumbowyg("html"),
            invitationSubject: $("#invitation-subject").val(),
          };

          if (activeTab === "registration-tab") {
            if (
              !payload?.registrationSubject ||
              payload?.registrationSubject?.trim() === ""
            ) {
              displayToast(
                "Email subject is required for registration.",
                "error"
              );
              return;
            }
            if (
              !payload?.registrationContent ||
              payload?.registrationContent?.trim() === ""
            ) {
              displayToast(
                "Email content cannot be empty for registration.",
                "error"
              );
              return;
            }
          }

          if (activeTab === "invitation-tab") {
            if (
              !payload?.invitationSubject ||
              payload?.invitationSubject?.trim() === ""
            ) {
              displayToast(
                "Email subject is required for invitation.",
                "error"
              );
              return;
            }
            if (
              !payload?.invitationContent ||
              payload?.invitationContent?.trim() === ""
            ) {
              displayToast(
                "Email content cannot be empty for invitation.",
                "error"
              );
              return;
            }
          }

          makeApiCall({
            url: `${EXAM_END_POINT}/email-content?entranceExamId=${entranceExamId}`,
            method: "PUT",
            data: JSON.stringify(payload),
            successCallback: () => displayToast("Templates saved!", "success"),
            errorCallback: (error) =>
              displayToast(`Save failed: ${error}`, "error"),
          }).finally(() => $(this).dialog("close"));
        },
      },
    },
    open: function () {
      // Initialize editors if needed
      const initEditor = (selector) => {
        if (!$(selector).data("trumbowyg")) {
          $(selector).trumbowyg({
            semantic: false,
            removeformatPasted: true,
            autogrow: true,
          });
        }
      };

      initEditor("#registration-content");
      initEditor("#invitation-content");

      // Check content needs
      const needsDefaults = {
        registration:
          !$("#registration-content").trumbowyg("html") ||
          !$("#registration-subject").val(),
        invitation:
          !$("#invitation-content").trumbowyg("html") ||
          !$("#invitation-subject").val(),
      };

      if (needsDefaults.registration || needsDefaults.invitation) {
        loadDefaultContent(
          needsDefaults.registration,
          needsDefaults.invitation,
          (success) => {
            if (!success) displayToast("Loaded fallback content", "warning");
          }
        );
      }
    },
    create: function (event, ui) {
      // Tab switching logic
      $(this).on("click", ".tab-link", function () {
        const tabId = $(this).data("tab");
        $(".tab-link, .tab-content").removeClass("active");
        $(this).addClass("active");
        $(`#${tabId}`).addClass("active");
      });

      // Dialog styling
      $(".ui-widget-overlay").css({
        background: "rgb(40, 167, 69)",
        "backdrop-filter": "blur(5px)",
      });

      // Custom close button
      const closeButton = $(
        '<button type="button" class="ui-button ui-corner-all ui-widget ui-dialog-titlebar-close" title="Close">X</button>'
      ).click(() => $("#email-template").dialog("close"));

      $(this)
        .closest(".ui-dialog")
        .find(".ui-dialog-titlebar")
        .append(closeButton);
    },
  });

  $("#email-template-btn").click(function () {
    $("#email-template").dialog("open");
  });

  $("#prev-to-step-1").click(function () {
    navigateToStep(1);
  });

  $("#prev-to-step-2").click(function () {
    navigateToStep(2);
    $("#preview-and-next").css({ display: "block" });
    $("#prev-to-step-2")[0].style.setProperty("display", "none", "important");
    $("#prev-to-step-1").removeClass("d-none");
    $("#prev-to-step-1").css({ display: "block" });
    $("#finalize-btn")[0].style.setProperty("display", "none", "important");
  });

  $(".step-link").click(function () {
    const stepNumber = $(this).attr("id").split("-")[3];
    navigateToStep(stepNumber);
  });

  $("#next-to-step-2").click(function () {
    if (validateStep1()) {
      let currentStep = stepCount;
      function nextStep() {
        $(this).prop("disabled", true);
        urlParams.set("stepper", 2);
        if (getQueryParameter("id")) urlParams.set("id", getQueryParameter("id"));
        history.pushState(null, "", "?" + urlParams.toString());
        currentStep++;
        setTimeout(() => {
          $("#next-to-step-2").prop("disabled", false);
        }, 5000);
        navigateToStep(2);
        $("#prev-to-step-1")[0].style.setProperty(
          "display",
          "block",
          "important"
        );
        $("#next-to-step-2")[0].style.setProperty("display", "none", "important");
        $("#preview-and-next")[0].style.setProperty(
          "display",
          "block",
          "important"
        );
      }

      clearErrorMessages();
      const examName = $("#exam-name").val();
      let enabledFeatures = [];
      const startDate = $("#start-date").val();
      // const endDate = $("#end-date").val();

      // Get time from inputs
      const startTime = $("#start-time").val();
      // const endTime = $("#end-time").val();

      // Function to parse time in "HH:MM AM/PM" format
      function parseTime(timeString) {
        const [time, period] = timeString.split(" ");
        const [hours, minutes] = time.split(":").map(Number);
        return {
          hour: hours % 12 || 12,
          minute: minutes.toString().padStart(2, "0"),
          format: period,
        };
      }

      // Parse start and end times
      const startTimeParsed = parseTime(startTime);
      // const endTimeParsed = parseTime(endTime);

      const screenRecording = $("#screen-recording-toggle").is(":checked");
      const webCamRecording = $("#webcam-recording-toggle").is(":checked");
      // const imageCapture = $("#image-capture-toggle").is(":checked");
      // const imageUpload = $("#image-upload-toggle").is(":checked");
      const scientificCalculator = $("#calculator-toggle").prop("checked");
      const publishReport = $("#publish-report-toggle").prop("checked");
      const allowStudentsWithoutRegistration = $("#without-registration").prop(
        "checked"
      );
      const audioRecording = $("#audio-recording-toggle").prop("checked");
      const isVoiceAlert = $("#voice-alert-toggle").prop("checked");
      const canSendEmailWithPassword = $("#canSendEmailWithPassword").prop(
        "checked"
      );
      const shouldShuffleQuestions = $("#shuffle-questions-toggle").prop("checked");
      const shouldShuffleOptions = $("#shuffle-options-toggle").prop("checked");
      const timeZone = $("#user-filter-input").data("identifier");
      // const cutOff = $("#cut-off").val();
      const duration = $("#exam-duration").val();

      if (screenRecording) {
        enabledFeatures.push("screenRecording");
      }

      if (webCamRecording) {
        enabledFeatures.push("webCamRecording");
      }

      if (audioRecording) {
        enabledFeatures.push("audioRecording");
      }

      if (isVoiceAlert) {
        enabledFeatures.push("isVoiceAlert");
      }

      if (scientificCalculator) {
        enabledFeatures.push("canShowCalculator");
      }

      if (publishReport) {
        enabledFeatures.push("canPublishReport");
      }

      const payload = {
        name: examName,
        enabledFeatures,
        session: {
          start: {
            date: startDate,
            hour: startTimeParsed.hour,
            minute: startTimeParsed.minute,
            format: startTimeParsed.format,
          },
        },
        settings: {
          duration: duration,
          cutoff: cutoffPercentage,
          timeZone,
          canShuffleQuestions: shouldShuffleQuestions,
          canShuffleOptions: shouldShuffleOptions,
          canSendEmailWithPassword,
          allowStudentsWithoutRegistration,
        },
      };

      const examIdQuery = getQueryParameter("id");
      if (examIdQuery) {
        const endpointUrl = `${EXAM_END_POINT}?entranceExamId=${examIdQuery}`;
        makeApiCall({
          url: endpointUrl,
          method: "PUT",
          data: JSON.stringify(payload),
          successCallback: function (response) {
            displayToast("Step 1 completed successfully!", "success");
            markStepCompleted("#link-to-step-1");
            isSendPasscode = canSendEmailWithPassword;
            nextStep()
            navigateToStep(2);
          },
          errorCallback: function (error) {
            displayToast(`Error:  ${error}`, "error");
          },
        });
      }
      if (!examIdQuery) {
        const endpointUrl = `${EXAM_END_POINT}`;
        const url = new URL(window.location);
        url.searchParams.set("isnew", "true");
        url.searchParams.set("stepper", "2");

        makeApiCall({
          url: endpointUrl,
          method: "POST",
          data: JSON.stringify(payload),
          successCallback: function (response) {
            url.searchParams.set("id", response.data.entranceExamId);
            displayToast("Step 1 completed successfully!", "success");
            markStepCompleted("#link-to-step-1");
            isSendPasscode = canSendEmailWithPassword;
            nextStep()
            navigateToStep(2);
            window.history.pushState({}, "", url);
            loadAttendees(response.data.entranceExamId, true);
            $("#line-first").find(".point").css({ borderLeft: "11px solid #16A34A" });
            $("#line-first").find(".line").css({ backgroundColor: "#16A34A" });
            $("#1-pratent .tab-circle-text").css({ color: "#16A34A" });
            $("#step-1-circle").css({ border: "2px solid #16A34A" });
            $("#1-pratent .tab-circle-border .tab-circle").css({backgroundColor: "#16A34A"});
          },
          errorCallback: function (error) {
            displayToast(`Error:${error}`, "error");
          },
        });
      }
    } else {
      displayErrorMessage(
        "step-1",
        "Please fill out all required fields correctly."
      );
    }
  });

  $("#finalize-btn").click(function () {
    // Check if exam time is in the past
    const startDate = $("#start-date").val();
    const startTime = $("#start-time").val();
    const timeZoneIdentifier = $("#user-filter-input").data("identifier");

    if (startDate && startTime && timeZoneIdentifier) {
      // Parse the date and time
      const [time, period] = startTime.split(" ");
      const [hours, minutes] = time.split(":").map(Number);
      let hour = hours % 12;
      if (period.toUpperCase() === "PM") hour += 12;

      // Create date object in the selected timezone
      const examDateTime = luxon.DateTime.fromObject(
        {
          year: parseInt(startDate.split("-")[0]),
          month: parseInt(startDate.split("-")[1]),
          day: parseInt(startDate.split("-")[2]),
          hour: hour,
          minute: minutes,
        },
        { zone: timeZoneIdentifier }
      );

      // Get current time in the same timezone
      const now = luxon.DateTime.now().setZone(timeZoneIdentifier);

      // Check if exam time is in the past
      if (examDateTime < now) {
        displayToast(
          "Cannot finalize exam with a past start time. Please update the exam schedule.",
          "error"
        );
        return;
      }
    }

    if (currentGridData.length < 1) {
      displayToast(
        "Cannot finalize exam without insert student data minium 1 student is required to finalize exam.",
        "error"
      );
      return;
    }
    // Continue with existing validation
    if ($("#questions-container .question").length === 0) {
      displayToast(
        "Cannot finalize exam without any questions. Please add at least one question.",
        "error"
      );
      return;
    }

    const entranceExamId = getQueryParameter("id");
    const endpointUrl = `${EXAM_END_POINT}/finalize?entranceExamId=${entranceExamId}`;

    makeApiCall({
      url: endpointUrl,
      method: "PUT",
      successCallback: function (response) {
        displayToast("Exam finalized successfully!", "success");
        setTimeout(function () {
          window.location.href = "/fullscreenexam/exam-list";
        }, 1000);
      },
      errorCallback: function (error, errorData) {
        const message = error || "An unknown error occurred";
        const data = errorData?.responseJSON?.data || [];

        if (message === "Items not finalized") {
          let formattedErrorData = `<strong>Just a few quick updates needed:</strong>`;

          data.forEach((item, index) => {
            formattedErrorData += `<br><span style="margin-top: 5px; display: inline-block;"><strong>Issue ${index + 1}:</strong></span>`;
            for (let key in item) {
              if (item.hasOwnProperty(key)) {
                // Format the key to be more readable (e.g., "question_count" -> "Question Count")
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                formattedErrorData += `<br>&nbsp;&nbsp;• ${formattedKey}: <span style="font-weight: 600;">${item[key]}</span>`;
              }
            }
          });

          formattedErrorData += `<br><em>Once you update these, you'll be all set! 👍</em>`;

          // Set HTML option for toastr to render HTML content
          toastr.options.escapeHtml = false;
          displayToast(formattedErrorData, "error", 6000);
          return; // Prevent showing duplicate message
        }
        displayToast(message, "error", 6000);
        if (message === "Already marked as Finalized") {
          setTimeout(function () {
            window.location.href = "/fullscreenexam/exam-list";
          }, 1000);
        }
      },
    });
  });

  $("#confirmationInput").trumbowyg();

  $("#import-questions-btn").click(function () {
    $("#process-questions-btn").prop("disabled", true);
    $("#import-questions-modal").show();
    $("#modalOverlay").addClass("active");
  });

  $("#cancel-import-btn, #process-questions-btn").click(function () {
    $("#import-questions-modal").hide();
    $("#modalOverlay").removeClass("active");
  });

  // Close modal when clicking outside
  $("#modalOverlay").click(function () {
    $("#import-questions-modal").hide();
    $(this).removeClass("active");
    tempQuestions = [];
    updateQuestionCount(0);
  });

  // Prevent modal from closing when clicking inside
  $("#import-questions-modal").click(function (e) {
    e.stopPropagation();
  });

  // Drag and drop handlers
  dragDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    $(dragDropZone).addClass("dragover");
  });

  dragDropZone.addEventListener("dragleave", () => {
    $(dragDropZone).removeClass("dragover");
  });

  dragDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    $(dragDropZone).removeClass("dragover");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  $("#browse-files-btn").on("click", function () {
    $("#hidden-file-input").trigger("click");
  });

  $("#hidden-file-input").change(function (e) {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  $("#process-questions-btn").click(async function () {
    const btn = $(this);
    const originalText = btn.html();

    try {
      btn
        .html(
          `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Importing questions...
            `
        )
        .prop("disabled", true);

      await addImportedQuestions(tempQuestions);
      displayToast(
        `Successfully imported ${tempQuestions.length} questions`,
        "success"
      );

      $("#import-questions-modal").hide();
    } catch (error) {
      displayToast(`Error importing questions: ${error.message}`, "error");
      updateQuestionCount(0);
    } finally {
      btn.html(originalText).prop("disabled", false);
      tempQuestions = [];
      updateQuestionCount(0);
    }
  });

  $("#cancel-import-btn").click(function () {
    $("#import-questions-modal").hide();
    tempQuestions = [];
    updateQuestionCount(0);
  });

  // Usage with your button
  $("#download-excel-template").on("click", createExcelTemplate);
  $("#download-doc-template").on("click", downloadDocTemplate);

  $("#3-pratent").on("click", function () {
    if (validateStep1() && validateStep2()) {
      navigateToStep(3);
      let urlParams = new URLSearchParams(window.location.search); // ✅ keeps old params
      urlParams.set("stepper", 3);
      history.pushState(null, "", "?" + urlParams.toString());
      $("#next-to-step-2").css({ display: "none" });
      $("#preview-and-next").css({ display: "none" });
      $("#preview-and-next")[0].style.setProperty(
        "display",
        "none",
        "important"
      );
      $("#finalize-btn")[0].style.setProperty("display", "block", "important");
      $("#prev-to-step-1")[0].style.setProperty("display", "none", "important");
      $("#prev-to-step-2")[0].style.setProperty(
        "display",
        "block",
        "important"
      );
      $("#next-to-step-2")[0].style.setProperty("display", "none", "important");
      $("#step-1-circle").addClass("tab-circle-border-active");
      $("#1-pratent").addClass("tab-circle-active");
      $("#step-2-circle").addClass("tab-circle-border-active");
      $("#2-pratent").addClass("tab-circle-active");
      $("#step-3-circle").addClass("tab-circle-border-active");
      $("#3-pratent").addClass("tab-circle-active");
      $("#line-first").find(".line").addClass("active-line");
      $("#line-second").find(".line").addClass("active-line");
      $("#line-first").find(".point").addClass("active-arrow");
      $("#line-second").find(".point").addClass("active-arrow");
      $("#prev-to-step-2").removeClass("d-none");
      $("#prev-to-step-1").addClass("d-none");
      if (currentGridData.length && examId && questionCount > 0) {
        $("#3-pratent .tab-circle-text").css({ color: "#2F80ED" });
        $("#step-3-circle").css({ border: "2px solid #2F80ED" });
        $("#3-pratent .tab-circle-border .tab-circle").css({
          backgroundColor: "#2F80ED !important",
        });

        $("#line-first")
          .find(".point")
          .css({ borderLeft: "11px solid #16A34A" });
        $("#line-first").find(".line").css({ backgroundColor: "#16A34A" });
        $("#1-pratent .tab-circle-text").css({ color: "#16A34A" });
        $("#step-1-circle").css({ border: "2px solid #16A34A" });
        $("#1-pratent .tab-circle-border .tab-circle").css({
          backgroundColor: "#16A34A",
        });

        $("#line-second")
          .find(".point")
          .css({ borderLeft: "11px solid #16A34A" });
        $("#line-second").find(".line").css({ backgroundColor: "#16A34A" });
        $("#2-pratent .tab-circle-text").css({ color: "#16A34A" });
        $("#step-2-circle").css({ border: "2px solid #16A34A" });
        $("#2-pratent .tab-circle-border .tab-circle").css({
          backgroundColor: "#16A34A",
        });
      }
    }
  });

  $("#2-pratent").on("click", function () {
   
    if (validateStep1()) {
      navigateToStep(2);
      let urlParams = new URLSearchParams(window.location.search); // ✅ keeps old params
      urlParams.set("stepper", 2);
      history.pushState(null, "", "?" + urlParams.toString());

      $("#prev-to-step-1")[0].style.setProperty(
        "display",
        "block",
        "important"
      );
      $("#prev-to-step-2")[0].style.setProperty("display", "none", "important");
      $("#next-to-step-2")[0].style.setProperty("display", "none", "important");
      $("#preview-and-next")[0].style.setProperty(
        "display",
        "block",
        "important"
      );
      $("#next-to-step-2").css({ display: "none" });
      $("#preview-and-next").css({ display: "block" });
      $("#finalize-btn").css({ display: "none" });
      $("#step-1-circle").addClass("tab-circle-border-active");
      $("#1-pratent").addClass("tab-circle-active");
      $("#step-2-circle").addClass("tab-circle-border-active");
      $("#2-pratent").addClass("tab-circle-active");
      $("#step-3-circle").removeClass("tab-circle-border-active");
      $("#3-pratent").removeClass("tab-circle-active");
      $("#line-first").find(".line").addClass("active-line");
      $("#line-second").find(".line").addClass("active-line");
      $("#line-first").find(".point").addClass("active-arrow");
      $("#line-second").find(".point").addClass("active-arrow");
      $("#prev-to-step-2").addClass("d-none");
      $("#prev-to-step-1").removeClass("d-none");
      if (currentGridData.length && examId && questionCount > 0) {
        $("#line-second")
          .find(".point")
          .css({ borderLeft: "11px solid #2F80ED" });
        $("#line-second").find(".line").css({ backgroundColor: " #2F80ED" });
        $("#2-pratent .tab-circle-text").css({ color: "#2F80ED" });
        $("#step-2-circle").css({ border: "2px solid #2F80ED" });
        $("#2-pratent .tab-circle-border .tab-circle").css({
          backgroundColor: "#2F80ED",
        });

        $("#line-first")
          .find(".point")
          .css({ borderLeft: "11px solid #16A34A" });
        $("#line-first").find(".line").css({ backgroundColor: "#16A34A" });
        $("#1-pratent .tab-circle-text").css({ color: "#16A34A" });
        $("#step-1-circle").css({ border: "2px solid #16A34A" });
        $("#1-pratent .tab-circle-border .tab-circle").css({
          backgroundColor: "#16A34A",
        });

        $("#line-second")
          .find(".point")
          .css({ borderLeft: "11px solid #16A34A" });
        $("#line-second").find(".line").css({ backgroundColor: "#16A34A" });
        $("#3-pratent .tab-circle-text").css({ color: "#16A34A" });
        $("#step-3-circle").css({ border: "2px solid #16A34A" });
        $("#3-pratent .tab-circle-border .tab-circle").css({
          backgroundColor: "#16A34A",
        });
      }
    }
  });

  $("#1-pratent").on("click", function () {
    urlParams = new URLSearchParams(window.location.search);
    urlParams.set("stepper", 1);
    history.pushState(null, "", "?" + urlParams.toString());
    navigateToStep(1);
    $("#prev-to-step-1")[0].style.setProperty("display", "none", "important");
    $("#prev-to-step-2")[0].style.setProperty("display", "none", "important");
    $("#preview-and-next")[0].style.setProperty("display", "none", "important");
    $("#next-to-step-2")[0].style.setProperty("display", "block", "important");
    $("#finalize-btn")[0].style.setProperty("display", "none", "important");
    $("#preview-and-next").css({ display: "none" });
    $("#preview-and-next").css({ display: "none" });
    $("#step-1-circle").addClass("tab-circle-border-active");
    $("#1-pratent").addClass("tab-circle-active");
    $("#step-2-circle").removeClass("tab-circle-border-active");
    $("#2-pratent").removeClass("tab-circle-active");
    $("#step-3-circle").removeClass("tab-circle-border-active");
    $("#3-pratent").removeClass("tab-circle-active");
    $("#line-first").find(".line").addClass("active-line");
    $("#line-first").find(".point").addClass("active-arrow");
    $("#prev-to-step-2").addClass("d-none");
    $("#prev-to-step-1").addClass("d-none");

    if (currentGridData.length && examId && questionCount > 0) {
      $("#step-2-circle").addClass("tab-circle-border-active");
      $("#2-pratent").addClass("tab-circle-active");

      $("#line-first").find(".point").css({ borderLeft: "11px solid #2F80ED" });
      $("#line-first").find(".line").css({ backgroundColor: " #2F80ED" });
      $("#1-pratent .tab-circle-text").css({ color: "#2F80ED" });
      $("#step-1-circle").css({ border: "2px solid #2F80ED" });
      $("#1-pratent .tab-circle-border .tab-circle").css({
        backgroundColor: "#2F80ED !important",
      });

      $("#2-pratent .tab-circle-text").css({ color: "#16A34A" });
      $("#step-2-circle").css({ border: "2px solid #16A34A" });
      $("#2-pratent .tab-circle-border .tab-circle").css({
        backgroundColor: "#16A34A",
      });

      $("#line-second")
        .find(".point")
        .css({ borderLeft: "11px solid #16A34A" });
      $("#line-second").find(".line").css({ backgroundColor: "#16A34A" });
      $("#3-pratent .tab-circle-text").css({ color: "#16A34A" });
      $("#step-3-circle").css({ border: "2px solid #16A34A" });
      $("#3-pratent .tab-circle-border .tab-circle").css({
        backgroundColor: "#16A34A",
      });
    }
  });

  $("#exam-duration").on("input", function (e) {
    const value = new String(e.target.value);
    if (value.length <= 3) $(this).val(e.target.value);
    else $(this).val(value.substring(0, 3));
  });

  $(".banner-close").click(function () {
    $(this).closest(".save-reminder-banner").slideUp(300);
  });

  // Attach click handler to bulk upload info button
  $('#bulk-upload-info-btn').on('click', function (e) {
    e.preventDefault();
    showItemTypeGuideModal();
  });

  handlefetchAllTags();
  setTimeZones();
  centerOrRight(questionCount);
  updateSteps();
  getExamFeatures(!examId);
  addTotalMarksSettingsIcon();
  AssessmentLoader.initializePageLoader(getQueryParameter("id"));
  window.renderQuestionByType = renderQuestionByType;
  window.addImportedQuestions = addImportedQuestions;
  window.reloadAttendees = reloadAttendees;
  setInterval(function () {
    saveQuestionsPeriodically();
  }, 3000);

  // Process tables on page load
  setTimeout(function () {
    $(".accountence-table td").each(function () {
      const questionId = $(this).closest(".question").attr("id");
      if (questionId) {
        processBlankCell(this, questionId.split("-")[1]);
      }
    });
  }, 500);
});

(function () {
  // Use standardTimezones from variable.js
  timezones = standardTimezones;

  // Get current system timezone
  const getCurrentTimezone = () => {
    try {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Find matching timezone based on identifier
      return (
        standardTimezones.find((tz) => tz.identifier === userTimeZone) ||
        standardTimezones.find((tz) =>
          tz.name.includes(userTimeZone.split("/").pop().replace(/_/g, " "))
        ) ||
        standardTimezones[0]
      );
    } catch (e) {
      return standardTimezones[0];
    }
  };

  // Set default timezone based on systemaddInfoIconsToResponseTools
  const defaultTimezone = getCurrentTimezone();
  if (defaultTimezone) {
    $("#user-filter-input").val(
      `${defaultTimezone.offset} ${defaultTimezone.name}`
    );
    $("#user-filter-input").data("identifier", defaultTimezone.identifier);
  }

  const handleChange = (userInput) => {
    if (!userInput) {
      timezones = standardTimezones;
    } else {
      timezones = standardTimezones.filter((tz) =>
        (tz.offset + " " + tz.name)
          .toLowerCase()
          .includes(userInput.toLowerCase())
      );
    }
  };

  handleChange("");
  $("#user-filter-input").on("input", function () {
    handleChange($(this).val());
    setTimeZones();
  });
})();

function handleSelect(e) {
  e.stopPropagation();
  const tzElement = $(this);
  const displayValue = tzElement.data("value");
  const identifier = tzElement.data("identifier");

  $("#user-filter-input").val(displayValue);
  $("#user-filter-input").data("identifier", identifier);
  $("#time-zone").find("ul").hide();
}

function setTimeZones() {
  $("#time-zone").find("ul").empty();
  if (timezones.length === 0) {
    return $("#time-zone")
      .find("ul")
      .append(`<li disabled style="text-align:center">No Data Found !</li>`);
  }
  timezones.forEach((tz, index) => {
    const label = `${tz.offset} ${tz.name}`;
    $("#time-zone")
      .find("ul")
      .append(
        `<li id="list${index}" data-value="${label}" data-identifier="${tz.identifier}">${label}</li>`
      );
    $(`#list${index}`).on("click", handleSelect);
  });
}

function updateSteps(isEnable = true) {
  if (stepCount == 1) {
    $("#step-1-circle").addClass("tab-circle-border-active");
    $("#1-pratent").addClass("tab-circle-active");
    $("#line-first").find(".line").addClass("active-line");
    $("#line-second").find(".line").removeClass("active-line");
    $("#line-first").find(".point").addClass("active-arrow");
    $("#line-second").find(".point").removeClass("active-arrow");
    $("#2-pratent").removeClass("tab-circle-active");
    $("#step-2-circle").removeClass("tab-circle-border-active");
    navigateToStep(1);
    $("#prev-to-step-1")[0].style.setProperty("display", "none", "important");
    $("#preview-and-next")[0].style.setProperty("display", "none", "important");
    $("#next-to-step-2")[0].style.setProperty("display", "block", "important");
    $("#step-2-circle").css({ borderRadius: "50%" });
  }
  if (stepCount == 2) {
    $("#step-1-circle").addClass("tab-circle-border-active");
    $("#1-pratent").addClass("tab-circle-active");
    $("#step-2-circle").addClass("tab-circle-border-active");
    $("#step-3-circle").removeClass("tab-circle-border-active");
    $("#3-pratent").removeClass("tab-circle-active");
    $("#2-pratent").addClass("tab-circle-active");
    $("#line-first").find(".line").addClass("active-line");
    $("#line-second").find(".line").addClass("active-line");
    $("#line-first").find(".point").addClass("active-arrow");
    $("#line-second").find(".point").addClass("active-arrow");
    navigateToStep(2);
    $("#prev-to-step-1")[0].style.setProperty("display", "block", "important");
    $("#next-to-step-2")[0].style.setProperty("display", "none", "important");
    $("#preview-and-next")[0].style.setProperty(
      "display",
      "block",
      "important"
    );
  }
  if (stepCount == 3) {
    $("#step-1-circle").addClass("tab-circle-border-active");
    $("#1-pratent").addClass("tab-circle-active");
    $("#step-2-circle").addClass("tab-circle-border-active");
    $("#2-pratent").addClass("tab-circle-active");
    $("#step-3-circle").addClass("tab-circle-border-active");
    $("#3-pratent").addClass("tab-circle-active");
    $("#line-first").find(".line").addClass("active-line");
    $("#line-second").find(".line").addClass("active-line");
    $("#line-first").find(".point").addClass("active-arrow");
    $("#line-second").find(".point").addClass("active-arrow");
    $("#step-1").removeClass("active");
    $("#step-2").removeClass("active");
    $("#step-3").addClass("active");
    navigateToStep(3);
    $("#preview-and-next")[0].style.setProperty("display", "none", "important");
    $("#finalize-btn")[0].style.setProperty("display", "block", "important");
    $("#prev-to-step-1")[0].style.setProperty("display", "none", "important");
    $("#prev-to-step-2")[0].style.setProperty("display", "block", "important");
    $("#next-to-step-2")[0].style.setProperty("display", "none", "important");
  }
  if (examIds && isEnable && stepCount !== 1) {
    $("#step-1-circle").css({ border: "2px solid #16A34A" });
    $("#1-pratent .tab-circle-border .tab-circle").css({
      backgroundColor: "#16A34A !important",
    });
    $("#1-pratent .tab-circle-text").css({ color: "#16A34A" });
    $("#line-first")
      .find(".line")
      .css({ backgroundColor: "1.5px solid #16A34A" });
    $("#line-second").find(".line").removeClass("active-line");
    $("#line-first").find(".point").css({ borderLeft: "11px solid #16A34A" });
    $("#line-second").find(".point").removeClass("active-arrow");
    // urlParams.set("step", 2);
    // history.pushState(null, "", "?" + urlParams.toString());
    $("#step-1-circle").addClass("tab-circle-border-active");
    $("#1-pratent").addClass("tab-circle-active");
    $("#step-2-circle").addClass("tab-circle-border-active");
    $("#step-3-circle").removeClass("tab-circle-border-active");
    $("#3-pratent").removeClass("tab-circle-active");
    $("#2-pratent").addClass("tab-circle-active");
    $("#line-first").find(".line").addClass("active-line");
    $("#line-second").find(".line").addClass("active-line");
    $("#line-first").find(".point").addClass("active-arrow");
    $("#line-second").find(".point").addClass("active-arrow");
  }
  $("#step-2-circle").css({ borderRadius: "50%" });
  if (questionCount > 0) {
    $("#2-pratent .tab-circle-text").css({ color: "#16A34A", fontWeight: 550 });
  }
  // if (JSON.parse(localStorage.getItem("questions")).includes(examId)) {
  //   $("#step-2-circle").css({ border: "2px solid #16A34A" });
  //   $("#2-pratent .tab-circle-border .tab-circle").css({
  //     backgroundColor: "#16A34A !important",
  //   });
  //   $("#2-pratent .tab-circle-text").css({ color: "#16A34A" });
  //   $("#line-first").css({ border: "1.5px solid #16A34A" });
  // }
}

function deleteGridRow(selectedRowsForDelete) {
  if (selectedRowsForDelete.length) {
    $(".selected-rows").css({ opacity: 1, visibility: "visible" });
    $("#selected-items").text(`${selectedRowsForDelete.length} Tasks Selected`);
  } else {
    $(".selected-rows").css({ opacity: 0, visibility: "hidden" });
  }
}

function setTimeZones() {
  $("#time-zone").find("ul").empty();
  if (timezones.length === 0) {
    return $("#time-zone")
      .find("ul")
      .append(`<li disabled style="text-align:center">No Data Found !</li>`);
  }
  timezones.forEach((tz, index) => {
    const utc = tz.offset;
    const place = tz.name;
    $("#time-zone")
      .find("ul")
      .append(
        `<li id="list${index}" data-value="${utc} ${place}" data-identifier="${tz.identifier}">${utc} ${place}</li>`
      );
    $(`#list${index}`).on("click", handleSelect);
  });
}

// Function to auto save questions
function saveQuestionsPeriodically() {
  const examId = getQueryParameter("id");
  const questions = [];

  // Get global shuffle questions setting
  const globalShuffleQuestions = $("#shuffle-questions-toggle").prop("checked");

  $("#questions-container .question").each(function () {
    const id = $(this).attr("id").split("-")[1];
    let questionText = $(`#question-text-${id}`).val();
    const questionType = $(this).attr("data-qtype");
    const backendId = $(this).attr("data-realid");
    // Shuffle questions is now controlled globally
    // Shuffle options is only available for MCQ and FTB questions
    let shuffleOption = false;
    if (questionType === "MCQ" || questionType === "FTB" || questionType === "MTF") {
      shuffleOption = $(this).find(".shuffleOption").prop("checked");
    }
    const shouldEv = $(this).find(".shouldEv").prop("checked");
    const programmingLanguage = $(this).find(".lang-select").val();
    const marksValue = parseFloat($(`.mark${id}`).val());

    try {
      // Try to get from CKEditor first
      if (CKEDITOR.instances[`question-text-${id}`]) {
        questionText = CKEDITOR.instances[`question-text-${id}`].getData();
      } else {
        // Fallback to regular textarea
        questionText = $(`#question-text-${id}`).val();
      }
    } catch (e) {
      // If any error, use the regular textarea value
      questionText = $(`#question-text-${id}`).val();
    }

    const tags = $(this)
      .find(".tag-item")
      .map(function () {
        const tagName = $(this).data("name");
        let tagId = $(this).data("id");

        if (!tagId) {
          const existingTag = allTags.find((tag) => tag.name === tagName);
          if (existingTag) {
            tagId = existingTag.id;
          }
        }

        return { name: tagName, _id: tagId };
      })
      .get();

    const studentResponseTool = getQuestionResponseTool(id);

    let choices = [];
    let blanks = [];
    let correct = "";

    if (questionType === "MCQ") {
      $(`#choices-${id} .choice`).each(function () {
        const choiceKey = $(this).attr("id").split("-")[1];
        const choiceId = $(this).attr("data-choice-id");
        const choiceLabel = $(`#choice-${choiceKey}-text-${id}`).val();
        const attachmentContainer = $(
          `#choice-attachment-container-${id}-${choiceKey}`
        );
        const attachment = JSON.parse(
          attachmentContainer.attr("data-attachments") || "[]"
        );
        const choiceData = {
          key: choiceKey,
          label: choiceLabel,
          ...(choiceId && choiceId !== "new" && { _id: choiceId }),
          attachments: attachment,
        };

        choices.push(choiceData);
      });

      correct = $(`input[name="correct-${id}"]:checked`).val();
    }

    if (questionType === "TF") {
      correct = $(`input[name="true-or-false-${id}"]:checked`).val();
    }

    const attachmentContainer = $(`#attachment-container-${id}`);
    const attachments = JSON.parse(
      attachmentContainer.attr("data-attachments") || "[]"
    );

    if (questionType === "FTB") {
      $(`#blanks-answers-${id} .blank-answer`).each(function () {
        const blankId = $(this).data("blank-id").split("-")[2];
        const answerType = $(this).find(".answer-type").val();

        const values = [];
        if (answerType === "text") {
          $(this)
            .find(".text-answer-group input")
            .each(function () {
              const val = $(this).val().trim();
              if (val) {
                values.push({
                  value: val,
                  isCorrect: true,
                });
              }
            });
        } else {
          // dropdown
          $(this)
            .find(".option-item")
            .each(function () {
              const optionText = $(this).find(".option-text").val().trim();
              const isCorrect = $(this).find(".correct-option").is(":checked");
              if (optionText) {
                values.push({
                  value: optionText,
                  isCorrect: isCorrect,
                });
              }
            });
        }

        blanks.push({
          identity: blankId.toString(),
          type: answerType,
          values: values,
        });
      });
    }

    // Handle TAB question type blanks
    if (questionType === "TAB") {
      $(`#tab-blanks-container-${id} .blank-item`).each(function () {
        const blankId = $(this).data("blank-id").split("-")[3]; // Get the blank ID from the format tab-blank-questionId-blankId
        const cellRef = $(this).data("cell-ref"); // Get the cell reference

        // Get answers data
        let answersData = [];
        try {
          answersData = JSON.parse($(this).attr("data-answers") || "[]");
        } catch (e) {
          console.error("Error parsing answers:", e);
          answersData = [];
        }

        // Format the values with isCorrect flag
        const values = answersData.map((answer, index) => {
          return {
            value: answer.value,
            isCorrect: index === 0, // First answer is primary (correct), others are alternatives
          };
        });

        // If we have no values but have a DOM structure with answers, try to extract from DOM
        if (values.length === 0) {
          const $answersDisplay = $(this).find(".answers-display");
          const primaryAnswer = $answersDisplay
            .find(".primary-answer")
            .text()
            .trim();

          if (primaryAnswer) {
            values.push({
              value: primaryAnswer,
              isCorrect: true,
            });

            $answersDisplay.find(".alternative-answer").each(function () {
              const altAnswer = $(this).text().trim();
              if (altAnswer) {
                values.push({
                  value: altAnswer,
                  isCorrect: false,
                });
              }
            });
          }
        }

        // Add to blanks array with identity as the cell reference
        blanks.push({
          identity: cellRef || blankId.toString(),
          type: "text", // TAB questions always use text type
          values: values,
        });
      });
    }

    let correctOrder = [];
    // Handle ordering questions (OR type)
    if (questionType === "OR") {
      // Get options (all items in the ordering list)
      $(`#ordering-items-list-${id} .ordering-item`).each(function () {
        const itemText = $(this).find(".ordering-item-text").text();
        correctOrder.push(itemText);
      });

      // Get correctOrder data from the data attribute
      const correctOrderData = $(`#ordering-items-${id}`).data("correctOrder");
      if (correctOrderData && Array.isArray(correctOrderData)) {
        correctOrder = correctOrderData;
      } else {
        // Fallback: Get order from current DOM structure
        const items = [];
        $(`#ordering-items-list-${id} .ordering-item`).each(function () {
          items.push($(this).find(".ordering-item-text").text());
        });
        correctOrder = items;
      }
    }
    if (questionType === "MTF") {
      questionText = questionText;
      if (questionText.endsWith("</p>")) {
        questionText = questionText.slice(0, -4);
      }

      $(`#matches-answers-${id} .match-container`).each(function () {
        const matchId = $(this).attr("data-match-id").split("-")[2];
        const matchQuestion = $(this).find(".match-question").val();
        const matchAnswer = $(this).find(".match-answer").val();

        questionText += matchId + "\uFE0F\u20E3" + matchQuestion;

        const values = [
          {
            value: matchAnswer,
            isCorrect: true,
          },
        ];

        blanks.push({
          identity: matchId.toString(),
          type: "text",
          values: values,
        });
      });

      questionText += "</p>";
    }

    if (backendId !== "new") {
      questions.push({
        _id: backendId,
        question: questionText,
        choices: choices,
        blanks: blanks,
        programmingLanguage: programmingLanguage,
        correctChoice: correct,
        attachments: attachments,
        type: questionType,
        tags: tags,
        shouldShuffleQts: globalShuffleQuestions,
        shouldShuffleOptions: shuffleOption,
        shouldEvaluate: shouldEv,
        allowedMaxChar: 500,
        marks: marksValue,
        correctOrder: correctOrder,
        meta: {
          ...(studentResponseTool && {
            "student-responce-type": studentResponseTool,
          }),
        },
        ...(questionType === "TAB" && {
          table: buildTableObject(id),
        }),
      });
    } else {
      questions.push({
        question: questionText,
        choices: choices,
        blanks: blanks,
        programmingLanguage: programmingLanguage,
        correctChoice: correct,
        attachments: attachments,
        type: questionType,
        tags: tags,
        shouldShuffleQts: globalShuffleQuestions,
        shouldShuffleOptions: shuffleOption,
        shouldEvaluate: shouldEv,
        allowedMaxChar: 500,
        marks: marksValue,
        correctOrder: correctOrder,
        meta: {
          ...(studentResponseTool && {
            "student-responce-type": studentResponseTool,
          }),
        },
        ...(questionType === "TAB" && {
          table: buildTableObject(id),
        }),
      });
    }
  });

  const currentHash = generateQuestionsHash(questions);
  if (examId) {
    if (examStatus === "FINALIZED") {
      const allQuestionsValid = questions.every(
        (q) =>
          q.question !== "" &&
          (q.type === "SAQ" ||
            (q.choices.length > 0 && q.correctChoice !== undefined))
      );

      // if (allQuestionsValid) {
      if (currentHash !== previousHash) {
        saveQuestions(examId, questions, function () {
          const hasNewQuestions =
            $('.question[data-realid="new"]').length > 0;
          const hasNewChoices = $('.choice[data-choice-id="new"]').length > 0;
          if (hasNewQuestions || hasNewChoices) {
            const endpointUrl = `${QUESTIONS_END_POINT}?entranceExamId=${getQueryParameter(
              "id"
            )}`;

            makeApiCall({
              url: endpointUrl,
              method: "GET",

              successCallback: function (getResponse) {
                updateQuestionIds(getResponse?.data);
              },
              errorCallback: function (error) {
                console.error("Failed to fetch updated questions:", error);
              },
            });
          }
        });
      }
      previousHash = currentHash;
      // }
    } else {
      if (currentHash !== previousHash) {
        saveQuestions(
          examId,
          questions,
          function () {
            const hasNewQuestions =
              $('.question[data-realid="new"]').length > 0;
            const hasNewChoices = $('.choice[data-choice-id="new"]').length > 0;


            if (hasNewQuestions || hasNewChoices) {
              const endpointUrl = `${QUESTIONS_END_POINT}?entranceExamId=${getQueryParameter(
                "id"
              )}`;
              makeApiCall({
                url: endpointUrl,
                method: "GET",
                disableLoading: true,
                successCallback: function (getResponse) {
                  updateQuestionIds(getResponse?.data);
                },
                errorCallback: function (error) {
                  console.error("Failed to fetch updated questions:", error);
                },
              });
            }
          },
          true
        );
        previousHash = currentHash;
      }
    }
  }
}

function updateTotalMarks() {
  $(".total-mark").val(totalMarksDisplay.toFixed(2));
  totalMarksDisplay = 0;
}

function loadQuestions(examId) {
  showLoader(true);
  // Start the assessment loader with rotating messages
  AssessmentLoader.startEditorTracking();
  $("#questions-container").empty();
  questionCount = 0;
  const endpointUrl = `${QUESTIONS_END_POINT}?entranceExamId=${examId}`;

  makeApiCall({
    url: endpointUrl,
    method: "GET",
    successCallback: function (response) {
      const toggleMap = {
        screenRecording: "#screen-recording-toggle",
        webCamRecording: "#webcam-recording-toggle",
        canShowCalculator: "#calculator-toggle",
        canPublishReport: "#publish-report-toggle",
        audioRecording: "#audio-recording-toggle",
      };

      updateTotalMarks();

      // Render all questions first
      response.data.questions.forEach((question) => {
        renderQuestionByType(question);
      });

      // Hide the assessment loader after all questions are rendered with a 3-second delay
      setTimeout(() => {
        AssessmentLoader.showAssessmentLoader(false);
        showLoader(false);
      }, 3000);

      const features = response?.data?.exam?.enabledFeatures || [];

      // Hide the default loader but not the assessment loader
      showLoader(false);
    },
    errorCallback: function (error) {
      displayToast(`Error: ${error}`, "error");
      // Hide both loaders on error
      showLoader(false);
      AssessmentLoader.showAssessmentLoader(false);
    },
  });
}

function updateQuestionNumber() {
  $(".qcnt").each(function (i, k) {
    $(this).text(i + 1);
  });
}

function renderQuestionByType(question) {
  updateQuestionNumber();
  totalMarksDisplay += parseFloat(question?.marks || 0);
  $(".total-marks-container input").val(totalMarksDisplay.toFixed(2));

  switch (question.type) {
    case "MCQ":
      addMcqQuestion(question);
      break;
    case "SAQ":
      addSaqQuestion(question);
      break;
    case "FTB":
      addFtbQuestion(question);
      break;
    case "MTF":
      addMTFQuestion(question);
      break;
    case "IR":
      addIrQuestion(question);
      break;
    case "UD":
      addDuQuestion(question);
      break;
    case "PRQ":
      addPrqQuestion(question);
      break;
    case "TF":
      addTFQuestion(question);
      break;
    case "OR":
      addOrQuestion(question);
      break;
    case "TAB":
      addTabQuestion(question);
      break;
    default:
      console.error(`Unsupported question type: ${question.type}`);
  }
}

function generateQuestionsHash(questions) {
  return JSON.stringify(questions);
}

function validateStep1(value) {
  let isValid = true;
  $("input").removeClass("input-error input-success");

  if (!$("#exam-name").val()) {
    isValid = false;
    $("#exam-name").addClass("input-error");
    displayToast("Please enter an exam name.", "error");
  } else {
    $("#exam-name").addClass("input-success");
  }

  if (!$("#start-time").val()) {
    isValid = false;
    displayToast("Please enter a Exam Start time.", "error");
  } else {
    $("#start-time").addClass("input-success");
  }

  if (!$("#start-date").val()) {
    isValid = false;
    $("#start-date").addClass("input-error");
    displayToast("Please enter a start date and time.", "error");
  } else {
    $("#start-date").addClass("input-success");
  }

  if (!$("#exam-duration").val()) {
    isValid = false;
    displayToast("Please enter a valid exam duration.", "error");
  }

  return isValid;
}

function validateStep2() {
  let isValid = true;
  $('.question, .choice textarea, .choice input[type="radio"]').removeClass(
    "input-error input-success"
  );

  if ($("#questions-container .question").length === 0) {
    isValid = false;
    const noQuestionsMsg = `<strong>Let's get started!</strong>Add your first question to begin creating your exam.`;
    toastr.options.escapeHtml = false;
    displayToast(noQuestionsMsg, "error", 6000);
    return isValid;
  }

  let errorMessages = [];

  $("#questions-container .question").each(function () {
    const questionText = $(this).find("textarea");
    const questionId = $(this).attr("id");
    if ($(this).attr("data-qtype") == "MCQ") {
      if (!questionText.val()) {
        isValid = false;
        questionText.addClass("input-error");
        errorMessages.push(`${questionId} - Question text is empty`);
      } else {
        questionText.addClass("input-success");
      }
      // const choices = $(this).find('.choice input[type="text"]');
      const choices = $(this).find(".choice textarea");
      let hasChoice = false;
      choices.each(function () {
        const choiceText = $(this);
        const choiceKey = $(this).attr("id").split("-")[1];
       if(choiceText.val().trim()===""){
         isValid = false;
         errorMessages.push(
             `${questionId} Choice ${choiceKey} is missing. Please fill it in.`
         )
       } else if (choiceText.val()) {
          
          hasChoice = true;
          choiceText.addClass("input-success");
        } else {
          choiceText.addClass("input-error");
        }
      });
      if (!hasChoice) {
        isValid = false;
        errorMessages.push(
          `${questionId} - No correct answer selected`
        );
      }

      const correctAnswer = $(this).find('input[type="radio"]:checked');
      if (correctAnswer.length === 0) {
        isValid = false;
        errorMessages.push(
          `${questionId} - No correct answer selected`
        );
      }
    } else if ($(this).attr("data-qtype") == "TF") {
      // Validation for True/False questions
      if (!questionText.val()) {
        isValid = false;
        questionText.addClass("input-error");
        errorMessages.push(`${questionId} - Question text is empty`);
      } else {
        questionText.addClass("input-success");
      }

      const correctAnswer = $(this).find('input[type="radio"]:checked');
      if (correctAnswer.length === 0) {
        isValid = false;
        errorMessages.push(
          `${questionId} does not have a correct answer (True/False) selected.`
        );
      }
    } else {
      if (!questionText.val()) {
        isValid = false;
        questionText.addClass("input-error");
        errorMessages.push(`${questionId} - Question text is empty`);
      }
    }
  });

  $("#questions-container .question").each(function () {
    const questionType = $(this).attr("data-qtype");

    if (questionType === "FTB" || questionType === "MTF") {
      const questionId = $(this).attr("id");
      let blankErrors = 0;

      if (questionType === "FTB") {
        // Specific validation for FTB questions
        const blankContainers = $(this).find(".blank-answer");

        if (blankContainers.length === 0) {
          isValid = false;
          $(this).addClass("input-error");
          errorMessages.push(
            `${questionId} - Fill in the Blanks question must have at least one blank.`
          );
          return; // Skip further validation if no blanks exist
        }
        const questionText = $(this).find("textarea");
        // Check if a blank emoji exists in the question text
        // const questionContent = $(this).find(".ck-editor__editable").html() || "";

        if (!questionText.val().includes("️⃣")) {
          isValid = false;
          $(this).find(".text-editor").addClass("input-error");
          errorMessages.push(
            `${questionId} - Question must contain at least one blank placeholder (emoji).`
          );
        }

        // Now validate each blank
        blankContainers.each(function (index) {
          const answerType = $(this).find(".answer-type").val();
          let hasValidAnswer = false;

          if (answerType === "text") {
            const textInputs = $(this).find(".text-type");
            // true if all are non-empty
            hasValidAnswer = textInputs.toArray().every(input => {
              return $(input).val().trim() !== "";
            });
          } else {
            // dropdown
            // Check dropdown options
            const hasOptions =
              $(this)
                .find(".option-text")
                .filter(function () {
                  return $(this).val().trim() !== "";
                }).length > 0;

            const hasCorrect =
              $(this).find(".correct-option:checked").length > 0;
            hasValidAnswer = hasOptions && hasCorrect;
          }

          if (!hasValidAnswer) {
            errorMessages.push(
              `${questionId} - Blank ${index + 1} needs to be completed (missing answer or correct option)`
            );
            blankErrors++;
            $(this).addClass("input-error");
          }
        });
      } else if (questionType === "MTF") {
        // Specific validation for MTF questions
        const matchContainers = $(this).find(".match-container");

        if (matchContainers.length === 0) {
          isValid = false;
          $(this).addClass("input-error");
          errorMessages.push(
            `${questionId} - MTF question must have at least one match.`
          );
        }

        matchContainers.each(function (index) {
          const matchQuestion = $(this).find(".match-question").val().trim();
          const matchAnswer = $(this).find(".match-answer").val().trim();

          if (!matchQuestion) {
            isValid = false;
            $(this).find(".match-question").addClass("input-error");
            blankErrors++;
            errorMessages.push(
              `${questionId} - Match ${index + 1}: Question is empty.`
            );
          }

          if (!matchAnswer) {
            isValid = false;
            $(this).find(".match-answer").addClass("input-error");
            blankErrors++;
            errorMessages.push(
              `${questionId} - Match ${index + 1}: Answer is empty.`
            );
          }
        });
      }

      if (blankErrors > 0) {
        isValid = false;
        $(this).addClass("input-error");
      }
    } else if (questionType === "OR") {
      const questionId = $(this).attr("id");
      const orderingItemsCount = $(this).find(".ordering-item").length;

      if (orderingItemsCount < 3) {
        isValid = false;
        $(this).addClass("input-error");
        errorMessages.push(
          `${questionId} - Ordering question must have at least three item`
        );
      }
    } else if (questionType === "TAB") {
      const questionId = $(this).attr("id");
      const qId = questionId.split("-")[1]; // Extract the numeric part of the ID
      const $table = $(this).find(".accountence-table");

      // Validate that a table exists
      if ($table.length === 0) {
        isValid = false;
        $(this).addClass("input-error");
        errorMessages.push(`${questionId} - Table question must have a table`);
      } else {
        // Build an object to represent the table data
        const tableData = buildTableObject(qId);

        // Check if the table has content
        if (!tableData.cells || tableData.cells.length === 0) {
          isValid = false;
          $(this).addClass("input-error");
          errorMessages.push(
            `${questionId} - Table must have at least one cell with content`
          );
        }

        // Check if any cell is empty (except blank cells which are intentionally empty)
        let emptyCellCount = 0;
        let emptyCellLocations = [];

        // Loop through each cell and check if it's empty
        $table.find("td.editable-cell").each(function (idx) {
          const cellId = $(this).data("cell-id");

          // Check if the cell is intentionally a blank
          const hasBlank =
            $(this).find(".blank-indicator").length > 0 ||
            $(this).text().includes("[blank]") ||
            $(this).hasClass("blank-cell");

          // If not a blank cell, check if it's empty
          if (!hasBlank && $(this).text().trim() === "") {
            emptyCellCount++;
            if (cellId) {
              emptyCellLocations.push(cellId);
            } else {
              emptyCellLocations.push(`Cell ${idx + 1}`);
            }
          }
        });

        // Show error if empty cells found
        if (emptyCellCount > 0) {
          isValid = false;
          $(this).addClass("input-error");
          errorMessages.push(
            `${questionId} - Table has ${emptyCellCount} empty cells: ${emptyCellLocations.join(
              ", "
            )}`
          );
        }

        // Check blank cells for answers
        const blankCells = $table.find(".blank-cell, td:contains('[blank]')");
        if (blankCells.length > 0) {
          // Get all blank items
          const $blankItems = $(`#tab-blanks-container-${qId} .blank-item`);

          // Show error if no blank items found but blank cells exist
          if ($blankItems.length === 0) {
            isValid = false;
            $(this).addClass("input-error");
            errorMessages.push(
              `${questionId} - Table contains ${blankCells.length} blank cells but no answers are defined`
            );
          } else {
            // Check each blank item for answer
            let blankErrors = 0;
            $blankItems.each(function () {
              const cellRef = $(this).data("cell-ref");
              let hasAnswer = false;

              // Check for answers in data-answers attribute
              try {
                const answersData = JSON.parse(
                  $(this).attr("data-answers") || "[]"
                );
                if (answersData.length > 0 && answersData[0].value) {
                  hasAnswer = true;
                }
              } catch (e) {
                // Error parsing, continue checking DOM
              }

              // Check for answers in DOM
              if (!hasAnswer) {
                const primaryAnswer = $(this)
                  .find(".primary-answer")
                  .text()
                  .trim();
                hasAnswer = primaryAnswer !== "";
              }

              if (!hasAnswer) {
                blankErrors++;
                errorMessages.push(
                  `${questionId} - Cell ${cellRef} has no primary answer`
                );
              }
            });

            if (blankErrors > 0) {
              isValid = false;
              $(this).addClass("input-error");
            }
          }
        } else {
          isValid = false;
          errorMessages.push(
            `${questionId} has no answers. Please add at least one answer option.`
          );
        }
      }
    }
  });

  if (errorMessages.length > 0) {
    let formattedErrorData = `<strong>Almost there! Just a few things to complete:</strong>`;

    errorMessages.forEach((error, index) => {
      // Extract question number from error message
      const questionMatch = error.match(/question-(\d+)/);
      const questionNum = questionMatch ? questionMatch[1] : index + 1;

      // Format the error message
      let formattedError = error
        .replace(/question-\d+/, `Question ${questionNum}`)
        .replace(/Blank (\d+)/, 'Blank $1');

      formattedErrorData += `<br>&nbsp;&nbsp;<span style="color: #fff; font-weight: normal;">•</span> ${formattedError}`;
    });

    formattedErrorData += `<br><em>You're doing great! Complete these items and you'll be ready to go.</em>`;

    // Set HTML option for toastr to render HTML content
    toastr.options.escapeHtml = false;
    displayToast(formattedErrorData, "error", 6000);
  }

  return isValid;
}

function renderAttachmentsContainer(
  attachments,
  $attachmentList,
  questionId,
  questionCount
) {
  $attachmentList.empty();

  // Create the drag-and-drop area
  const attachmentMainContainerHtml = `   
              <div class="attachment-drop-zone">
                  <div class="dropzone-content">
                      <button class="attachmentBrowseBtn"  data-question-id="${questionId}">
                        <span> Browse Files </span> <i class='bx bx-plus-circle text-white'></i>
                      </button>
                      <input type="file" id="hiddenFileInput" data-question-count="${questionCount}" data-question-id="${questionId}" style="display: none;">
                      <p class="Supported-text">
                          Supported formats: JPEG, JPG, PNG, PDF, MP3
                      </p>
                  </div>
              </div>

              <!-- Selected Files List -->
              <div class="attachment-list"></div>
      `;

  // Append the drag-and-drop container
  $attachmentList.append(attachmentMainContainerHtml);

  // Now append each attachment to the correct container inside the `attachmentMainContainerHtml`
  const attachmentContainer = $attachmentList.find(".attachment-list");

  if (attachments && attachments.length > 0) {
    attachments.forEach((attachment) => {
      const encodedAttachment = JSON.stringify(attachment).replace(
        /"/g,
        "&quot;"
      );
      const imageUrl = attachment.url;
      const fileName = attachment.name || imageUrl.split("/").pop();
      const fileType = attachment.type;

      let previewHtml = "";
      if (fileType === "image") {
        previewHtml = `<img src="${imageUrl}" alt="${fileName}" onerror="handleImageError(this)"/>`;
      } else if (fileType === "application") {
        previewHtml = `
        <div class="attachment-resume">
       <object data="${imageUrl}" type="application/pdf" onerror="handleImageError(this)">
</object>
   
    </div>`;
      } else if (fileType === "audio") {
        previewHtml = `

<audio controls src="${imageUrl}" onerror="handleImageError(this)"></audio>
`;
      }

      const attachmentHtml = `
                  <div class="attachment-item" data-attachment-id="${attachment._id
        }">
                    <button class="open-preview-btn" data-url="${encodedAttachment}" title="Open in new tab">
        <div class="open-preview-icon">
           <i class="fas fa-eye"></i>
        </div>
    </button>
                      <div class="remove-attachment" title="Delete">
                          <div class="remove-attachment-icon">
                              <i class="fas fa-trash"></i>
                          </div>
                      </div>
                      <div class="attachment-thumbnail">
                          ${previewHtml}
                      </div>
                      <div class="attachment-info">
                          <div class="file-meta">
                              <span class="file-type">${fileType === "application" ? "pdf" : fileType
        }</span>
                          </div>
                      </div>
                  </div>
              `;
      showLoader(true);
      setTimeout(() => {
        attachmentContainer.append(attachmentHtml);
        showLoader(false);
      }, 3000);
    });
  } else {
    attachmentContainer.html('<div class="no-files">No images attached</div>');
  }
}

function deleteAttachment(questionCount, questionId, attachmentId, choiceId) {
  const endpointUrl = `${QUESTIONS_END_POINT}/attachment?entranceExamId=${getQueryParameter(
    "id"
  )}&id=${questionId}&attachmentId=${attachmentId}`;

  makeApiCall({
    url: endpointUrl,
    method: "DELETE",
    successCallback: function (response) {
      // Handle choice attachments if choiceId is provided
      if (choiceId) {
        const $choiceAttachmentContainer = $(
          `.choice-attachment-sub-main-container[data-question-id="${questionId}"][data-choice-id="${choiceId}"]`
        );
        let choiceAttachments = JSON.parse(
          $choiceAttachmentContainer.attr("data-attachments") || "[]"
        );

        choiceAttachments = choiceAttachments.filter(
          (attachment) => attachment._id !== attachmentId
        );

        $choiceAttachmentContainer.attr(
          "data-attachments",
          JSON.stringify(choiceAttachments)
        );

        const $choiceCountBubble = $choiceAttachmentContainer.find(
          ".attachment-count-bubble"
        );
        if (choiceAttachments.length > 0) {
          $choiceCountBubble.text(choiceAttachments.length);
        } else {
          $choiceCountBubble.remove();
        }

        $(
          `div[data-attachment-id="${attachmentId}"][data-question-id="${questionId}"][data-choice-id="${choiceId}"]`
        ).remove();

        // Refresh the attachment list in the panel
        const $attachmentList = $(".attachment-main-container");
        renderAttachmentsContainer(
          choiceAttachments,
          $attachmentList,
          questionId,
          questionCount
        );
      } else {
        // Handle question attachments
        const $questionAttachmentContainer = $(
          `#attachment-container-${questionCount}`
        );
        let questionAttachments = JSON.parse(
          $questionAttachmentContainer.attr("data-attachments") || "[]"
        );

        questionAttachments = questionAttachments.filter(
          (attachment) => attachment._id !== attachmentId
        );

        $questionAttachmentContainer.attr(
          "data-attachments",
          JSON.stringify(questionAttachments)
        );

        const $questionCountBubble = $questionAttachmentContainer.find(
          ".attachment-count-bubble"
        );
        if (questionAttachments.length > 0) {
          $questionCountBubble.text(questionAttachments.length);
        } else {
          $questionCountBubble.remove();
        }

        $(
          `div[data-attachment-id="${attachmentId}"][data-question-id="${questionId}"]`
        ).remove();

        // Refresh the attachment list in the panel
        const $attachmentList = $(".attachment-main-container");
        renderAttachmentsContainer(
          questionAttachments,
          $attachmentList,
          questionId,
          questionCount
        );
      }
    },
    errorCallback: function (error) {
      displayToast(`Error:${error}`, "error");
    },
  });
}

function deleteChoiceAttachment(choiceId, questionId, attachmentId) {
  const endpointUrl = `${QUESTIONS_END_POINT}/attachment?entranceExamId=${getQueryParameter(
    "id"
  )}&id=${questionId}&choiceId=${choiceId}&attachmentId=${attachmentId}`;

  makeApiCall({
    url: endpointUrl,
    method: "DELETE",
    successCallback: function (response) {
      const $attachmentContainer = $(
        `.choice-attachment-sub-main-container[data-question-id="${questionId}"][data-choice-id="${choiceId}"]`
      );

      let attachments = JSON.parse(
        $attachmentContainer.attr("data-attachments") || "[]"
      );
      attachments = attachments.filter(
        (attachment) => attachment._id !== attachmentId
      );
      $attachmentContainer.attr(
        "data-attachments",
        JSON.stringify(attachments)
      );

      const $countBubble = $attachmentContainer.find(
        ".attachment-count-bubble"
      );
      if (attachments.length > 0) {
        $countBubble.text(attachments.length);
      } else {
        $countBubble.remove();
      }

      $(
        `div[data-attachment-id="${attachmentId}"][data-question-id="${questionId}"][data-choice-id="${choiceId}"]`
      ).remove();

      const $attachmentList = $attachmentContainer
        .closest(".attachment-main-container")
        .find(".attachment-list");
      if (attachments.length === 0) {
        $attachmentList.html('<div class="no-files">No images attached</div>');
      }
    },
    errorCallback: function (error) {
      displayToast(`Error deleting attachment: ${error}`, "error");
    },
  });
}

function handleEditorChange(questionCount) {
  const editor = $(`#question-text-${questionCount}`).data("ckeditorInstance");
  const content = editor.getData();
  const blanksContainer = $(`#blanks-answers-${questionCount}`);
  const existingBlanks = blanksContainer.find(".blank-answer");

  // Extract indices from existing blanks
  const existingIndices = existingBlanks
    .map(function () {
      return parseInt($(this).data("blank-id").split("-")[2]);
    })
    .get();

  // Extract indices from emojis in the editor
  const emojiRegex = /(\d)\uFE0F\u20E3/g; // Matches "1️⃣", "2️⃣", etc.
  const matches = [];
  let match;
  while ((match = emojiRegex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  const emojiIndices = matches.map((m) => parseInt(m));

  // Find indices to remove (present in DOM but not in editor)
  const indicesToRemove = existingIndices.filter(
    (idx) => !emojiIndices.includes(idx)
  );

  // Remove corresponding blanks
  indicesToRemove.forEach((idx) => {
    const blankToRemove = blanksContainer.find(
      `[data-blank-id="blank-${questionCount}-${idx}"]`
    );
    blankToRemove.remove();
  });

  // Reindex remaining blanks and update editor
  const remainingBlanks = blanksContainer.find(".blank-answer");
  remainingBlanks.each(function (index) {
    const newIndex = index + 1;
    const newBlankId = `blank-${questionCount}-${newIndex}`;

    // Update DOM elements
    $(this).attr("data-blank-id", newBlankId);
    $(this).find(".blank-input").attr("data-blank-id", newBlankId);
    $(this).find("label").text(`Answer for Blank ${newIndex}:`);
  });

  // Update emojis in the editor to reflect new indices
  let updatedContent = content;
  remainingBlanks.each(function (index) {
    const oldIndex = parseInt($(this).data("blank-id").split("-")[2]);
    const newIndex = index + 1;
    const oldEmoji = `${oldIndex}\uFE0F\u20E3`;
    const newEmoji = `${newIndex}\uFE0F\u20E3`;
    updatedContent = updatedContent.replace(
      new RegExp(oldEmoji, "g"),
      newEmoji
    );
  });

  // Prevent infinite loop by checking content difference
  if (updatedContent !== content) {
    editor.setData(updatedContent);
  }
}

function reorderBlankEmojis(questionId) {
  const editor = $(`#question-text-${questionId}`).data("ckeditorInstance");
  if (editor) {
    // Get the current editor content.
    const content = editor.getData();
    // Regular expression to match number emojis: e.g. "1️⃣", "2️⃣", etc.
    const emojiRegex = /(\d)\uFE0F\u20E3/g;
    let newIndex = 0;
    // Replace each found emoji with a new index based on its order of appearance.
    const newContent = content.replace(emojiRegex, function (match, p1) {
      newIndex++;
      return `${newIndex}\uFE0F\u20E3`;
    });
    // Update the editor content.
    editor.setData(newContent);
  }
}

function createChoiceHtml(
  questionData,
  questionId,
  key,
  label = "",
  isCorrect = false
) {
  const attachments =
    questionData?.choices?.find((choice) => choice.key === key)?.attachments ||
    [];
  const attachmentCount = attachments.length;

  return `
          <div class="choice" id="choice-${key}-${questionId}"  data-choice-id="${questionData && questionData._id
      ? questionData.choices?.find((choice) => choice.key === key)?._id
      : "new"
    }" >
              <label for="choice-${key}-text-${questionId}" class="choice-key">${key}</label>
               <input type="radio" name="correct-${questionId}" value="${key}" ${isCorrect ? "checked" : ""
    }>
              <div class="choice-content flex-grow-1">
                  <textarea class="choice-editor" id="choice-${key}-text-${questionId}" name="choice-${key}-text-${questionId}" placeholder="Enter choice text...">${label}</textarea>
              </div>
              <div class="choice-attachment-sub-main-container" 
                      id="choice-attachment-container-${questionId}-${key}" 
                      data-choice-key="${key}"
                      data-question-id="${questionData && questionData._id
      ? questionData._id
      : "new"
    }" 
                      data-choice-id="${questionData && questionData._id
      ? questionData.choices?.find(
        (choice) => choice.key === key
      )?._id
      : "new"
    }" 
                      data-attachments='${JSON.stringify(attachments)}'>
                      <div class="choice-attachment-container" style="position: relative; display: inline-block;">
                          <i class='bx bx-folder-open font-size-25'></i>
                          ${attachmentCount > 0
      ? `
                              <div class="attachment-count-bubble">
                                  ${attachmentCount}
                              </div>
                          `
      : ""
    }
                      </div>
                      <div class="remove-choice-btn red" data-id="${questionCount}"><i class="bx bx-x font-size-25"></i></div>
                  </div>
          </div>
      `;
}

function renderChoiceAttachmentsContainer(
  attachments,
  $attachmentList,
  questionId,
  choiceId,
  questionCount
) {
  $attachmentList.empty();

  const attachmentMainContainerHtml = `   
          <div class="attachment-drop-zone">
              <div class="dropzone-content">
                  <button class="attachmentBrowseBtn"  data-question-id="${questionId}">
                         <span> Browse Files </span> <i class='bx bx-plus-circle text-white'></i>
                      </button>
                  <input type="file" id="choice-hiddenFileInput" data-choice-id="${choiceId}" data-question-id="${questionId}" style="display: none;">
                  <p class="Supported-text">
                      Supported formats: JPEG, JPG, PNG, PDF, MP3
                  </p>
              </div>
          </div>

          <!-- Selected Files List -->
          <div class="attachment-list"></div>
  `;

  $attachmentList.append(attachmentMainContainerHtml);

  const attachmentContainer = $attachmentList.find(".attachment-list");

  if (attachments && attachments.length > 0) {
    attachments.forEach((attachment) => {
      const encodedAttachment = JSON.stringify(attachment).replace(
        /"/g,
        "&quot;"
      );
      const imageUrl = attachment.url;
      const fileName = attachment.name || imageUrl.split("/").pop();
      const fileType = attachment.type;

      let file;
      let previewHtml = "";

      if (fileType === "image") {
        previewHtml = `<img src="${imageUrl}" alt="${fileName}" onerror="handleImageError(this)"/>`;
      } else if (fileType === "application") {
        previewHtml = `
         <div class="attachment-resume">
       <object data="${imageUrl}" type="application/pdf">
</object>
   
    </div>`;
      } else if (fileType === "audio") {
        previewHtml = `
<audio controls src="${imageUrl}"></audio>
`;
      }

      const attachmentHtml = `
<div class="attachment-item" data-attachment-id="${attachment._id
        }" data-question-id="${questionId}" data-choice-id="${choiceId}">
    <button class="open-preview-btn" data-url="${encodedAttachment}" title="Open in new tab">
       <i class="fas fa-eye"></i>
    </button>

    <div class="remove-attachment" title="Delete">
        <div class="choice-remove-attachment-icon">
            <i class="fas fa-trash"></i>
        </div>
    </div>

    <div class="attachment-thumbnail">
        ${previewHtml}
    </div>

    <div class="attachment-info">
        <div class="file-meta">
             <span class="file-type">${fileType === "application" ? "pdf" : fileType
        }</span>
        </div>
    </div>
</div>
`;

      showLoader(true);
      setTimeout(() => {
        attachmentContainer.append(attachmentHtml);
        showLoader(false);
      }, 3000);
    });
  } else {
    attachmentContainer.html('<div class="no-files">No images attached</div>');
  }
}

// Queue for staggered editor initialization
let editorInitQueue = [];
let isProcessingEditors = false;

// Process editor initialization queue with delay
function processEditorQueue() {
  if (isProcessingEditors || editorInitQueue.length === 0) {
    return;
  }

  isProcessingEditors = true;

  const processNext = () => {
    if (editorInitQueue.length === 0) {
      isProcessingEditors = false;
      // Hide loader after all editors are initialized
      setTimeout(() => {
        AssessmentLoader.showAssessmentLoader(false);
      }, 500);
      return;
    }

    const { selector, editorType, isFillup } = editorInitQueue.shift();
    applyEditorImmediately(selector, editorType, isFillup);

    // Process next editor after a delay
    setTimeout(processNext, 5); // 100ms delay between editors
  };

  processNext();
}

// Add editor to initialization queue
function applyEditor(selector, editorType, isFillup = false) {
  editorInitQueue.push({ selector, editorType, isFillup });
  processEditorQueue();
}

// Original applyEditor function renamed
function applyEditorImmediately(selector, editorType, isFillup = false) {
  const element = $(selector);
  const elementValue = element.val();
  const LICENSE_KEY =
    "eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3Mzk0OTExOTksImp0aSI6IjhmMmUxN2RjLWI3MjUtNDFhOS04OTQyLTYwMzFlNTk5ODUwNiIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6Ijk0ZTczMGY5In0.9JUvRvWCr1SEWC0DGzbcsINRLuCZNXbWO8T9PQnC5tp0TODumpMQNrT2AKYzed8ygStUKe7HLb2vYhBOdfAwbg";

  // Use CKEditor when isEnableWirisEditor is true
  editorConfig = {
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
      toolbar: ["imageTextAlternative", "imageStyle:full", "imageStyle:side"],
    },
    table: {
      contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
    },
  };

  ClassicEditor.create(element[0], editorConfig)
    .then((editor) => {
      editor.setData(elementValue);

      editor.model.document.on("change:data", () => {
        const data = editor.getData();
        let count = 0;

        // Auto-reindex emoji placeholders like 1️⃣ 2️⃣ 3️⃣
        const newData = data.replace(/(\d)\uFE0F\u20E3/g, () => {
          count++;
          return `${count}\uFE0F\u20E3`;
        });

        // If changed, set new content (avoid infinite loop)
        if (newData !== data) {
          editor.setData(newData);
          return;
        }

        element.val(editor?.getData());
        const questionId = element.attr("id").split("-")[2];
        // Delay to allow CKEditor to fully update content
        setTimeout(() => {
          handleEditorChange(questionId);
        }, 50);
      });

      element.data("ckeditorInstance", editor);
    })
    .catch((error) => {
      console.error("CKEditor error:", error);
    });


}

function renderAttachments(attachments) {
  if (!attachments.length) return "";
  return attachments
    .map(
      (attachment) => `
          <div class="attachment">
              <img class="image-size-style" src="${attachment.url}" alt="Attachment Preview" onerror="handleImageError(this)">
              <button class="remove-image" data-id="${attachment._id}">Remove Image</button>
          </div>
      `
    )
    .join("");
}

function addOptionField(container) {
  // Get the blank ID from the container
  const blankId = container.closest(".blank-answer").data("blank-id");
  const identitfierId = blankId;

  const optionsContainer = container.find(".options-container");
  const optionId = optionsContainer.children().length + 1;

  const optionHtml = `
      <div class="option-item">
          <input type="text" placeholder="Option ${optionId}" class="option-text">
          <div class="option-item-others">
              <input type="radio" name="correctOption-${identitfierId}" class="correct-option">
              <p>Correct</p>
          </div>
          <div class="remove-options-divider"></div>
          <div class="remove-option-btn">
            <i class="bx bx-trash"></i>
          </div>
      </div>`;
  optionsContainer.append(optionHtml);
}

function handleFile(file) {
  const loadingOverlay = document.getElementById("loadingOverlay");
  const processBtn = $("#process-questions-btn");

  loadingOverlay.style.display = "flex";
  processBtn.prop("disabled", true);

  const reader = new FileReader();
  reader.onload = async function (event) {
    try {
      if (file.name.endsWith(".xlsx")) {
        // Process Excel file
        const workbook = XLSX.read(event.target.result, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const questions = parseExcelQuestions(
          XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
        );
        updateQuestionCount(questions.length);
        tempQuestions = questions;
        $("#process-questions-btn").prop("disabled", false);
      } else if (file.name.match(/\.docx?$/)) {
        // Existing Word document processing
        JSZip.loadAsync(reader.result)
          .then((zip) => {
            return zip.file("word/document.xml").async("text");
          })
          .then((result) => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(result, "text/xml");
            const questions = parseQuestions(xmlDoc);
            updateQuestionCount(questions.length);
            tempQuestions = questions;
            $("#process-questions-btn").prop("disabled", false);
          });
      }
    } catch (error) {
      displayToast(`Error processing file: ${error.message}`, "error");
    } finally {
      loadingOverlay.style.display = "none";
      processBtn.prop("disabled", false);
    }
  };

  reader.onerror = function () {
    loadingOverlay.style.display = "none";
    processBtn.prop("disabled", false);
    displayToast("Error reading file", "error");
  };

  reader.readAsArrayBuffer(file);
}

function parseExcelQuestions(data) {
  const questions = [];
  const headers = data[0].map((h) => h.toLowerCase());

  // Find column indices by title keywords
  const questionCol = headers.findIndex((h) => h.includes("question"));
  const optionCols = headers
    .map((h, idx) => (h.includes("option") ? idx : -1))
    .filter((idx) => idx !== -1);
  const answerCol = headers.findIndex((h) => h.includes("answer"));

  if (questionCol === -1 || answerCol === -1) {
    throw new Error("Invalid File format");
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const questionText = row[questionCol];
    if (row.length > 0) {
      const correctAnswer = row[answerCol]?.toString().trim();

      // Collect options from all option columns
      const options = optionCols.map(
        (col) => row[col]?.toString().trim() || ""
      );
      const nonEmptyOptions = options.filter((opt) => opt !== "");

      if (nonEmptyOptions.length === 0) {
        if (enableItemTypes.includes("SAQ")) {
          questions.push({
            question: questionText,
            choices: [],
            correctChoices: [],
            type: "SAQ",
          });
        }
      } else {
        // Validate no empty options between filled ones
        for (let i = 0; i < options.length; i++) {
          if (
            options[i] === "" &&
            options.slice(i + 1).some((opt) => opt !== "")
          ) {
            throw new Error(
              `Empty option ${String.fromCharCode(
                65 + i
              )} found between filled options in question ${i}`
            );
          }
        }

        // Filter out empty options after validation

        const getCorrectIndex = () => {
          const correctIndex = nonEmptyOptions.findIndex(
            (c) =>
              c?.trim()?.toUpperCase() == correctAnswer?.trim()?.toUpperCase()
          );
          if (correctIndex === -1) {
            throw new Error(
              `Invalid correct answer "${correctAnswer}" for question "${i}, not found in options".`
            );
          }
          return correctIndex;
        };

        if (enableItemTypes.includes("MCQ")) {
          questions.push({
            question: questionText,
            choices: nonEmptyOptions.map((opt, index) => ({
              key: String.fromCharCode(65 + index),
              label: opt,
            })),
            correctChoices: [String.fromCharCode(65 + getCorrectIndex())],
            type: "MCQ",
          });
        }
      }
    }
  }

  return questions;
}

function parseQuestions(xmlDoc) {
  const questions = [];
  const tables = xmlDoc.getElementsByTagName("w:tbl");

  Array.from(tables).forEach((table) => {
    Array.from(table.getElementsByTagName("w:tr"))
      .slice(1)
      .forEach((row) => {
        const columns = Array.from(row.getElementsByTagName("w:tc"));

        if (columns.length >= 4) {
          let question = {
            question: getQuestions(columns[2]),
          };

          let getOptions_correct = getValue(columns[3]);

          question.choices = getOptions_correct.option;
          question.correctChoices = [getOptions_correct.correct];
          question.type =
            getOptions_correct.option.length === 0 ? "SAQ" : "MCQ";
          if (enableItemTypes.includes(question.type)) {
            questions.push(question);
          }
        }
      });
  });

  return questions;
}

function updateQuestionCount(count) {
  $("#questionCount span").text(count);
}

function addImportedQuestions(questions) {
  // Your existing logic to add questions to the interface
  questions.forEach((question) => {
    renderQuestionByType(question);
  });

  // Calculate and update total marks after importing
  let totalMarks = 0;

  $(".marks-container input").each(function () {
    totalMarks += parseFloat($(this).val()) || 0;
  });
  // Format total marks - remove .00 if it's a whole number
  const formattedTotal = Number.isInteger(totalMarks)
    ? totalMarks.toString()
    : totalMarks.toFixed(2);
  $(".total-marks-container input").val(formattedTotal);
}

// Add template download handlers
async function createExcelTemplate() {
  // Create new workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Questions");

  // Add header row with styling
  const headerRow = worksheet.addRow([
    "Question",
    "Option A",
    "Option B",
    "Option C",
    "Correct Answer",
  ]);

  // Style header cells
  headerRow.eachCell((cell) => {
    cell.font = {
      bold: true,
      size: 12,
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // Add sample data
  worksheet.addRow([
    "What is the importance of education?(MCQ)",
    "Knowledge",
    "Wealth",
    "Power",
    "Knowledge",
  ]);
  worksheet.addRow([
    "Which of the following is a type of education?(MCQ)",
    "Formal",
    "Informal",
    "Non-formal",
    "Formal",
  ]);
  worksheet.addRow(["Write about the importance of education?(SAQ)"]);

  worksheet.addRow(["Write about the importance of Forest?(SAQ)"]);

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    column.width = 25;
  });

  // Generate blob and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "question_template.xlsx";
  a.click();
}

async function downloadDocTemplate() {
  const response = await fetch("./assets/docTemplate.docx");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "docTemplate.docx";
  a.click();
}

function addTagChip(tagContainer, tagName, tagColor, tagId) {
  const existingTags = tagContainer
    .find(".tag-chip")
    .map(function () {
      return $(this)
        .contents()
        .filter(function () {
          return this.nodeType === 3;
        })
        .text()
        .trim();
    })
    .get();

  if (existingTags.includes(tagName)) {
    return;
  }

  const bgColor = lightenHexColor(tagColor, 75);

  tagContainer.prepend(`
    <div data-name="${tagName.trim()}" data-id="${tagId}" class="tag-item">
      <span class="tag-chip" style="--tag-bg: ${bgColor}; --tag-color: ${tagColor}">
        ${tagName.trim()}
        <i class="fas fa-times"></i>
      </span>
    </div>
  `);
}

const handlefetchAllTags = async () => {
  allTags = [];
  try {
    const url = base_url + "/tag";

    makeApiCall({
      url: url,
      method: "GET",
      successCallback: (response) => {
        response.data.forEach((tag) => {
          allTags.push({
            color: tag.color || randomColor(),
            name: tag.name,
            id: tag._id,
          });
        });
      },
      errorCallback: (error) => { },
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
  }
};

// Add this function to your JavaScript file
function addTotalMarksSettingsIcon() {
  // Update the total marks container to include a settings icon
  $(".total-marks-container").html(`
      <b>Total marks:</b>
      <input type="number" class="total-mark" id="total-mark" placeholder="0" readonly/>
      <i class="bx bx-cog font-size-25 total-marks-settings" title="Marks Settings" style="cursor: pointer;"></i>
    `);
}

function openMarksSettingsPopup() {
  // Create the popup HTML if it doesn't exist
  if ($("#marks-settings-popup").length === 0) {
    $("body").append(`
      <div id="marks-settings-popup" title="Marks Settings" style="display:none;">
        <div class="marks-settings-content">
          <div class="form-group mb-4">
            <label for="bulk-marks-value" class="mb-2">Set marks for all questions:</label>
            <input type="number" id="bulk-marks-value" class="form-control" min="0" step="0.01" placeholder="Enter marks value">
            <small class="text-muted mt-2 d-block">
              This will update the marks for all questions in the exam. Current questions will have their marks replaced with this value.
            </small>
          </div>
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            Total marks will be recalculated automatically after applying changes.
          </div>
        </div>
      </div>
    `);
  }

  // Initialize the dialog
  $("#marks-settings-popup").dialog({
    modal: true,
    width: 500,
    buttons: {
      Cancel: function () {
        $(this).dialog("close");
      },
      "Apply to All Questions": function () {
        const marksValue = parseFloat($("#bulk-marks-value").val());
        if (!isNaN(marksValue) && marksValue >= 0) {
          applyMarksToAllQuestions(marksValue);
          $(this).dialog("close");
        } else {
          displayToast("Please enter a valid marks value", "error");
        }
      },
    },
    create: function (event, ui) {
      $(".ui-widget-overlay").css({
        background: "rgb(40, 167, 69)",
        "backdrop-filter": "blur(5px)",
      });
      var closeButton = $(
        '<button type="button" class="ui-button ui-corner-all ui-widget ui-dialog-titlebar-close" title="Close">X</button>'
      );
      closeButton.on("click", function () {
        $("#marks-settings-popup").dialog("close");
      });
      $(this)
        .closest(".ui-dialog")
        .find(".ui-dialog-titlebar")
        .append(closeButton);
    },
  });
}

// Function to apply the marks value to all questions
function applyMarksToAllQuestions(marksValue) {
  let totalMarks = 0;
  $("#questions-container .question").each(function () {
    const id = $(this).attr("id").split("-")[1];
    const marksInput = $(`.mark${id}`);

    const oldValue = parseFloat(marksInput.val()) || 0;
    oldMarksValues[id] = oldValue;
    marksInput.val(marksValue.toFixed(2));

    totalMarks += marksValue;
  });

  $(".total-mark").val(totalMarks.toFixed(2));

  displayToast(`Marks updated for all questions`, "success");
}

function getQueryParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function displayToast(message, type, delay = 5000) {
  // Preserve existing options and merge with new ones
  toastr.options = Object.assign(toastr.options || {}, {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: delay || "5000",
    preventDuplicates: true, // Prevent duplicate messages
    newestOnTop: true
  });

  if (type === "success") {
    toastr.success(message);
  } else if (type === "error") {
    toastr.error(message);
  }
}

function markStepCompleted(stepLinkId) {
  $(stepLinkId).addClass("completed");
}

function navigateToStep(stepNumber) {
  if (stepNumber === "2") {
    const step1 = $("#step-1").hasClass("completed");
    const step3 =
      $("#step-2").hasClass("active") || $("#step-3").hasClass("active");

    if (step1 || step3) {
      $(".step").removeClass("active");
      $(`#step-2`).addClass("active");
    } else {
      displayToast(
        "Please proceed to step 2 by clicking the Next button.",
        "error"
      );
    }
  } else {
    $(".step").removeClass("active");
    $(`#step-${stepNumber}`).addClass("active");
  }
}

// Add these helper functions at the top level
function loadDefaultContent(needsRegistration, needsInvitation, callback) {
  showLoader(true);

  makeApiCall({
    url: `${ACCOUNT_END_POINT}/content`,
    method: "GET",
    successCallback: (response) => {
      const defaults = response.data;
      if (needsRegistration) {
        $("#registration-subject").val(defaults.registrationSubject);
        $("#registration-content").trumbowyg(
          "html",
          defaults.registrationContent
        );
      }
      if (needsInvitation) {
        $("#invitation-subject").val(defaults.invitationSubject);
        $("#invitation-content").trumbowyg("html", defaults.invitationContent);
      }
      callback(true, defaults);
      showLoader(false);
    },
    errorCallback: (error) => {
      const fallback = {
        registrationSubject: "Registration Invitation",
        registrationContent: "Please complete your registration",
        invitationSubject: "Exam Invitation",
        invitationContent: "You're invited to take the exam",
      };
      if (needsRegistration) {
        $("#registration-subject").val(fallback.registrationSubject);
        $("#registration-content").trumbowyg(
          "html",
          fallback.registrationContent
        );
      }
      if (needsInvitation) {
        $("#invitation-subject").val(fallback.invitationSubject);
        $("#invitation-content").trumbowyg("html", fallback.invitationContent);
      }
      callback(false, fallback);
      showLoader(false);
    },
  });
}

function applyResetContent(activeTab, defaults) {
  if (activeTab === "registration-tab") {
    $("#registration-subject").val(defaults.registrationSubject);
    $("#registration-content").trumbowyg("html", defaults.registrationContent);
  } else if (activeTab === "invitation-tab") {
    $("#invitation-subject").val(defaults.invitationSubject);
    $("#invitation-content").trumbowyg("html", defaults.invitationContent);
  }
}

function clearErrorMessages() {
  $(".error-message").text("");
}

function displayErrorMessage(step, message) {
  $(`#${step}-error`).text(message);
}

function loadAttendees(examId, isNewExam = false) {
  const columnDefs = [
    {
      headerName: "S.No",
      field: "sno",
      headerCheckboxSelection: true,
      checkboxSelection: true,
      valueGetter: (params) => params.node.rowIndex + 1,
      sortable: true,
      filter: false,
      resizable: false,
      autoHeight: false,
      headerClass: "table-ag-class",
      flex: 0.5,
      cellStyle: {
        color: "#4B5563",
        fontSize: "14px",
        display: "flex",
        justifyContent: "start",
        whiteSpace: "normal",
        wordBreak: "break-word",
        // padding: "12px 19px",
        lineHeight: "1.2",
      },
    },
    {
      headerName: "Email ID",
      field: "mail",
      autoHeight: false,
      filter: true,
      flex: 1.5,
      headerClass: "table-ag-class",
      cellStyle: {
        color: "#4B5563",
        fontSize: "14px",
        display: "flex",
        justifyContent: "start",
        whiteSpace: "normal",
        wordBreak: "break-word",
        // padding: "12px 8px",
        lineHeight: "1.2",
      },
      onCellDoubleClicked: function (params) {
        navigator.clipboard.writeText(params.value).then(() => {
          displayToast("Email copied to clipboard! " + params.value, "success");
        });
      },
    },
    {
      headerName: "Passcode",
      field: "id2",
      autoHeight: false,
      headerClass: "table-ag-class",
      sortable: true,
      filter: true,
      flex: 0.8,
      cellStyle: {
        color: "#4B5563",
        fontSize: "14px",
        display: "flex",
        justifyContent: "start",
        whiteSpace: "normal",
        wordBreak: "break-word",
        // padding: "12px 8px",
        lineHeight: "1.2",
        alignItems: "center",
      },
      onCellDoubleClicked: function (params) {
        navigator.clipboard.writeText(params.value).then(() => {
          displayToast(
            "Passcode copied to clipboard! " + params.value,
            "success"
          );
        });
      },
    },
    {
      headerName: "Registration Status",
      field: "registrationStatus",
      sortable: true,
      autoHeight: false,
      filter: true,
      filterValueGetter: (params) => {
        // Handle registration status
        if (
          params.data.registrationStatus === REGISTERED ||
          params.data.registrationStatus === APPROVED ||
          params.data.registrationStatus === REJECTED
        ) {
          return params.data.registrationStatus;
        }
        // Handle invitation status
        switch (params.data.registrationInviteStatus) {
          case "P":
            return "Invitation Pending";
          case "Q":
            return "Sending Invitation";
          case "S":
            return "Invitation Sent";
          default:
            return "Not Invited";
        }
      },
      headerClass: "table-ag-class",
      // width: 200,
      flex: 1.2,
      autoWidth: true,
      resizable: true,
      cellStyle: {
        color: "#4B5563",
        fontSize: "14px",
        display: "flex",
        justifyContent: "start",
        whiteSpace: "normal",
        wordBreak: "break-word",
        // padding: "12px 8px",
        lineHeight: "1.2",
      },
      cellRenderer: function (params) {
        let html = "";
        if (
          params.data.registrationStatus === REGISTERED ||
          params.data.registrationStatus === APPROVED ||
          params.data.registrationStatus === REJECTED
        ) {
          if (params.data.registrationStatus === REGISTERED) {
            html = `
            <div class="d-flex align-items-center">
              <div class="status-chip status-chip-registered">
                <i class="fas fa-user"></i> <div class="status-text-container">
                  <div class="status-chip-text">Registered</div>
                  <div class="status-chip-description">Waiting for Approval</div>
                </div>
              </div>
              <button class="status-action-btn send-invite" data-type="registration" data-email="${params.data.mail}" ${!canSendRegistrationMail ? 'disabled' : ''}>
                <i class='bx bxs-send'></i>
    </button>
            </div>`;
          } else if (params.data.registrationStatus === APPROVED) {
            html = `
            <div class="d-flex align-items-center">
              <div class="status-chip status-chip-approved">
                <i class="fas fa-check-circle"></i>
                <div class='status-text-container'> 
                  <div class="status-chip-text">Approved</div>
                  <div class="status-chip-description">Ready to Take Exam</div>
                </div>
              </div>
              <button class="status-action-btn send-invite" data-type="registration" data-email="${params.data.mail}" ${!canSendRegistrationMail ? 'disabled' : ''}>
                <i class='bx bxs-send'></i>
              </button>
            </div>`;
          } else if (params.data.registrationStatus === NOT_REGISTERED) {
            html = `
            <div class="d-flex align-items-center">
              <div class="status-chip status-chip-not-registered">
                <i class="fas fa-exclamation-circle"></i>
                <div class='status-text-container'> 
                  <div class="status-chip-text">Not Registered</div>
                  <div class="status-chip-description">Action Required</div>
                </div>
              </div>
              <button class="status-action-btn send-invite" data-type="registration" data-email="${params.data.mail}" ${!canSendRegistrationMail ? 'disabled' : ''}>
                <i class='bx bxs-send'></i>
              </button>
            </div>`;
          } else if (params.data.registrationStatus === REJECTED) {
            html = `
            <div class="d-flex align-items-center">
              <div class="status-chip status-chip-rejected">
                <i class="fas fa-times-circle"></i> <div class="status-text-container">
                  <div class="status-chip-text">Rejected</div>
                  <div class="status-chip-description">Reinvite to register</div>
                </div>  
              </div>
              <button class="status-action-btn send-invite" data-type="registration" data-email="${params.data.mail}" ${!canSendRegistrationMail ? 'disabled' : ''}>
                <i class='bx bxs-send'></i>
              </button>
            </div>`;
          }
        } else {
          switch (params.data.registrationInviteStatus) {
            case "P":
              html = `
                <div class="d-flex align-items-center">
                  <div class="status-chip status-chip-pending">
                    <i class="fas fa-exclamation-circle"></i>
                    <div class='status-text-container'> 
                      <div class="status-chip-text">Invitation Pending</div>
                      <div class="status-chip-description">Waiting for Response</div>
                    </div>
                  </div>
                  <button class="status-action-btn send-invite" data-type="registration" data-email="${params.data.mail}" ${!canSendRegistrationMail ? 'disabled' : ''}>
                    <i class='bx bxs-send'></i>
                  </button>
                </div>`;
              break;
            case "Q":
              html = `
                <div class="d-flex align-items-center">
                  <div class="status-chip status-chip-sending">
                    <i class="fas fa-spinner fa-pulse"></i>
                    <div class='status-text-container'> 
                      <div class="status-chip-text">Sending Invitation</div>
                      <div class="status-chip-description">Waiting for Response</div>
                    </div>
                  </div>
                  <button class="status-action-btn send-invite" data-type="registration" data-email="${params.data.mail}" ${!canSendRegistrationMail ? 'disabled' : ''}>
                    <i class='bx bxs-send'></i>
                  </button>
                </div>`;
              break;
            case "S":
              html = `
                <div class="d-flex align-items-center">
                  <div class="status-chip status-chip-sent">
                    <i class="fas fa-check-circle"></i>
                    <div class='status-text-container'> 
                      <div class="status-chip-text">Invitation Sent</div>
                      <div class="status-chip-description">Awaiting Registration</div>
                    </div>
                  </div>
                  <button class="status-action-btn send-invite" data-type="registration" data-email="${params.data.mail}" ${!canSendRegistrationMail ? 'disabled' : ''}>
                    <i class='bx bxs-send'></i>
                  </button>
                </div>`;
              break;
            default:
              html = `
                <div class="d-flex align-items-center">
                  <div class="status-chip status-chip-not-invited">
                    <i class="fas fa-times-circle"></i>
                    <div class='status-text-container'> 
                      <div class="status-chip-text">Not Invited</div>
                      <div class="status-chip-description">Send Invitation</div>
                    </div>
                  </div>
                  <button class="status-action-btn send-invite" data-type="registration" data-email="${params.data.mail}" ${!canSendRegistrationMail ? 'disabled' : ''}>
                    <i class='bx bxs-send'></i>
                  </button>
                </div>`;
          }
        }

        return html;
      },
    },
    {
      headerName: "Exam Status",
      field: "status",
      sortable: true,
      autoHeight: false,
      headerClass: "table-ag-class",
      // width: 180,
      flex: 1.2,
      resizable: false,
      filter: true,
      filterValueGetter: function (params) {
        switch (params.data.status) {
          case "P":
            return "Pending";
          case "Q":
            return "Sending";
          case "S":
            return "Sent";
          default:
            return "Not Sent";
        }
      },
      cellStyle: {
        color: "#4B5563",
        fontSize: "14px",
        display: "flex",
        justifyContent: "start",
        whiteSpace: "normal",
        wordBreak: "break-word",
        // padding: "12px 8px",
        lineHeight: "1.2",
      },
      cellRenderer: function (params) {
        let html = "";

        switch (params.data.status) {
          case "P":
            html = `
              <div class="d-flex align-items-center">
                <div class="status-chip status-chip-pending">
                  <i class="fas fa-exclamation-circle"></i>
                  <div class='status-text-container'> 
                    <div class="status-chip-text">Pending</div>
                    <div class="status-chip-description">Exam Invitation Pending</div>
                  </div>
                </div>
                <button class="status-action-btn send-invite" data-type="exam" data-email="${params.data.mail}" ${!canSendExamMail ? 'disabled' : ''}>
                  <i class='bx bxs-send'></i>
                </button>
              </div>`;
            break;
          case "Q":
            html = `
              <div class="d-flex align-items-center">
                <div class="status-chip status-chip-sending">
                  <i class="fas fa-spinner fa-pulse"></i>
                  <div class='status-text-container'> 
                    <div class="status-chip-text">Sending</div>
                    <div class="status-chip-description">Sending Invitation</div>
                  </div>
                </div>
                <button class="status-action-btn send-invite" data-type="exam" data-email="${params.data.mail}" ${!canSendExamMail ? 'disabled' : ''}>
                  <i class='bx bxs-send'></i>
                </button>
              </div>`;
            break;
          case "S":
            html = `
              <div class="d-flex align-items-center">
                <div class="status-chip status-chip-sent">
                  <i class="fas fa-check-circle"></i>
                  <div class='status-text-container'> 
                    <div class="status-chip-text">Sent</div>
                    <div class="status-chip-description">Ready to Take Exam</div>
                  </div>
                </div>
                <button class="status-action-btn send-invite" data-type="exam" data-email="${params.data.mail}" ${!canSendExamMail ? 'disabled' : ''}>
                  <i class='bx bxs-send'></i>
                </button>
              </div>`;
            break;
          default:
            html = `
              <div class="d-flex align-items-center">
                <div class="status-chip status-chip-not-invited">
                  <i class="fas fa-times-circle"></i>
                  <div class='status-text-container'> 
                    <div class="status-chip-text">Not Sent</div>
                    <div class="status-chip-description">Send Invitation</div>
                  </div>
                </div>
                <button class="status-action-btn send-invite" data-type="exam" data-email="${params.data.mail}" ${!canSendExamMail ? 'disabled' : ''}>
                  <i class='bx bxs-send'></i>
                </button>
              </div>`;
        }

        return html;
      },
    },
    {
      headerName: "Actions",
      field: "actions",
      maxWidth: 200,
      autoHeight: false,
      filter: false,
      headerClass: "table-ag-class",
      cellStyle: {
        paddingLeft: "14px",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "start",
      },
      cellRenderer: function (params) {
        const rowIndex = params.rowIndex;
        return `<div class="action-container" data-row-index="${rowIndex}">

          <button class="view-details-button" ${params.data.registrationStatus === NOT_REGISTERED ? "disabled" : ""
          } id="view-details" data-email="${params.data.mail}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            ${params.data.registrationStatus === REGISTERED
            ? "Approve"
            : "View Details"
          }
          </button>
    
        <div class="action-menu-main" data-email="${params.data.mail
          }" data-row-index="${rowIndex}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </div>

        <div class="action-dropdown" id="dropdown-${rowIndex}" data-row-index="${rowIndex}">
         
          <div class="dropdown-item" id="edit-attender" data-email="${params.data.mail
          }" data-pass="${params.data.id}">
            <div class="dropdown-item-icons">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
              </svg>
            </div>
            <span>Edit Attender</span>
          </div>

          <div class="dropdown-item ${params.data.registrationStatus === NOT_REGISTERED
            ? "disabled-item"
            : ""
          }" 
               id="view-details" 
               data-email="${params.data.mail}" 
               data-pass="${params.data.id}"
               ${params.data.registrationStatus === NOT_REGISTERED
            ? "disabled"
            : ""
          }>
            <div class="dropdown-item-icons">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                  <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="item-text">
              <span>View and Approve</span>
              ${params.data.registrationStatus === NOT_REGISTERED
            ? '<span class="disabled-notice">(No registration document available)</span>'
            : ""
          }
            </div>
          </div>

          <div class="dropdown-item ${examCurrentStatus !== ENDED && examCurrentStatus !== ON_GOING
            ? "disabled-item"
            : ""
          }" 
               id="extra-time" 
               data-id="${params.data._id}" 
               ${examCurrentStatus !== ENDED && examCurrentStatus !== ON_GOING
            ? "disabled"
            : ""
          }>
            <div class="dropdown-item-icons">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="item-text">
              <span>Give Extra Time</span>
              ${examCurrentStatus !== ENDED && examCurrentStatus !== ON_GOING
            ? '<span class="disabled-notice">(Only available during or after exam)</span>'
            : ""
          }
            </div>
          </div>
          
          <div class="dropdown-item ${examCurrentStatus !== ENDED ? "disabled-item" : ""
          } " 
               id="revoke-exam" 
               data-email="${params.data.mail}" 
               data-id="${params.data._id}"
               data-attender='${params?.data?.canStartExamAfterExamEndTime
            ? JSON.stringify(params?.data?.canStartExamAfterExamEndTime)
            : ""
          }'
               ${examCurrentStatus !== ENDED ? "disabled" : ""}>
            <div class="dropdown-item-icons">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>

            </div>
            <div class="item-text">
              <span>Extend Exam</span>
              ${examCurrentStatus !== ENDED
            ? '<span class="disabled-notice">(Only available after exam)</span>'
            : ""
          }
            </div>
          </div>

        </div>
      </div>`;

        //   return `
        //     <div class="d-flex gap-2">
        //        <button class="red edit-data step-3-btn px-2"
        //          data-email="${params.data.mail}"
        //          data-pass="${params.data.id}"
        //          >
        //         <i class="fas fa-edit mx-2"></i>
        //       </button>
        //       ${
        //         examCurrentStatus === ENDED || examCurrentStatus === ON_GOING
        //           ? `<button class="step-3-btn btn-extra-time" data-id="${params?.data?._id}" data-examstatus="${examCurrentStatus}" data-canExtendExam="${params?.data?.canExtendExam}" title="Give Extra Time">
        //         <i class='bx bx-timer'></i>
        //       </button>`
        //           : ""
        //       }
        //       ${
        //         params.data.registrationStatus !== NOT_REGISTERED
        //           ? `<button class="step-3-btn btn-view-details" data-email="${params.data.mail}" data-pass='${params.data.id}'>
        //           <i class='bx bx-low-vision'></i>
        //         </button>`
        //           : ""
        //       }
        //     </div>
        // </div>`;
      },
      sortable: false,
      filter: false,
    },
  ];

  gridOptions = {
    theme: "legacy",
    rowModelType: "clientSide",
    columnDefs: columnDefs,
    defaultColDef: {
      filter: true,
      sortable: true,
      resizable: true,
      minWidth: 100,
    },
    rowHeight: 58,
    rowSelection: "multiple",
    suppressRowClickSelection: true,
    pagination: true,
    paginationPageSize: 100,
    domLayout: "autoHeight",
    getRowId: (params) => params.data.mail,

    overlayLoadingTemplate:
      '<span class="ag-overlay-loading-center">Loading Attendees List .Please Wait...</span>',
    overlayNoRowsTemplate:
      '<span class="ag-overlay-loading-center">No data to display</span>',
    onSelectionChanged: function () {
      const selectedRows = gridOptions.api.getSelectedRows();
      const count = selectedRows.length;
      $("#selected-items").text(
        count > 0
          ? `${count < 10 ? "0" + count : count} Tasks selected:`
          : "00 Tasks selected:"
      );

      if (count > 0) {
        $(".selected-rows").css({
          opacity: 1,
          visibility: "visible",
          zIndex: 5,
        });
      } else {
        $(".selected-rows").css({ opacity: 0, visibility: "hidden" });
      }
    },
  };

  new agGrid.Grid(document.getElementById("myGrid"), gridOptions);
  if (isNewExam) {
    gridOptions.api.showNoRowsOverlay();
  } else {
    reloadAttendees(examId);
  }
}

function reloadAttendees(examId) {
  const endpointUrl = `${EXAM_END_POINT}/attender?canPaginate=false&showAdditionalFields=true&entranceExamId=${examId}`;

  makeApiCall({
    url: endpointUrl,
    method: "GET",
    successCallback: function (response) {
      if (response.data && response.data.data) {
        currentGridData = response.data.data;
        const rowsToRemove = [];
        gridOptions.api.forEachNode((node) => rowsToRemove.push(node.data));
        gridOptions.api.applyTransaction({
          remove: rowsToRemove,
          add: response.data.data,
        });
        gridOptions.api.hideOverlay();
        if (response.data.data.length) {
          $("#step-3-circle").css({
            border: "2px solid #16A34A",
            borderRadius: "50%",
          });
          $("#3-pratent .tab-circle-border .tab-circle").css({
            backgroundColor: "#16A34A !important",
            color: "#ffffff",
          });
          $("#3-pratent .tab-circle-text").css({
            color: "#16A34A",
            fontWeight: 550,
          });
        }
      } else {
        gridOptions.api.showNoRowsOverlay();
      }
      showLoader(false);
    },
    errorCallback: function (error) {
      displayToast(`Error: ${error}`, "error");
      showLoader(false);
      AssessmentLoader.showAssessmentLoader(false);
    },
  });
}

function getExamFeatures(isNewExam = false) {
  makeApiCall({
    url: `${ACCOUNT_END_POINT}`,
    method: "get",
    successCallback: function (response) {
      const data = response.data;
      const settings = data[0]?.settings?.exam;
      const features = data[0]?.settings?.features;
      const enableScAndNq = settings?.enableScAndNq;
      const enableAnomalyDetection = features?.enableAnomalyDetection;
      const enableGroupCreation = features?.enableGroupCreation || false;
      enableInsight = features?.enableInsight || false;
      localStorage.setItem("enableInsight", enableInsight);
      localStorage.setItem("enableGroupCreation", enableGroupCreation);
      enableItemTypes = settings?.enableItemTypes;
      const enablePublishReport = settings?.enableReportPublish;
      enableAIQuestionGenerator = settings?.enableAIQuestionGenerator;

      canSendEmail = features?.reminder?.canSendEmail || false;
      canSendExamMail = features?.reminder?.canSendEmail 
      && features?.reminder?.canSendExamReminder || false
      canSendRegistrationMail = features?.reminder?.canSendEmail 
      && features?.reminder?.canSendRegistrationReminder || false;
      
      if (canSendEmail) {
        if (canSendExamMail && canSendRegistrationMail) {
          $(".email-type-select").append(
            `<option value = "exam">Exam</option>
            <option value="registration">Registration</option>
            <option value="both">Both</option>`
          );
        } else{
              if (canSendExamMail) {
          $(".email-type-select").append(
            `<option value="exam">Exam</option>`
          );
        }
        if (canSendRegistrationMail) {
          $(".email-type-select").append(
            `<option value="registration">Registration</option>`
          );
        }
        }
    
      }

      if (canSendEmail) {
        $("#send-invite-all-btn, #send-invite-pending-btn, #send-selected-invite-btn")
          .prop('disabled', false)
          .removeClass("disabled");
      } else {
        $("#send-invite-all-btn, #send-invite-pending-btn, #send-selected-invite-btn, .email-type-select")
          .prop('disabled', true)
          .addClass("disabled");
      }


      if (isNewExam) {
        $("#without-registration").prop(
          "checked",
          settings?.allowStudentsWithoutRegistration
        );
        if (!enablePublishReport && !enableScAndNq)
          $("#ADDTIONAL").css({ display: "none" });
        if (!enableAnomalyDetection) {
          $("#screen-recording-toggle").prop(
            "checked", false
          );
          $("#webcam-recording-toggle").prop(
            "checked", false
          );
          $("#audio-recording-toggle").prop(
            "checked", false
          );
          $("#both-two-option").prop(
            "checked", false
          );
          $("#AI").css({ display: "none" });
        }
        if (!enablePublishReport) {
          $("#publish-report-toggle").prop(
            "checked", false
          );
          $("#DR").css({ display: "none" });
        }
        if (!enableScAndNq) {
          $("#SC").css({ display: "none" });
          $("#calculator-toggle").prop(
            "checked", false
          );
        }
        if (!enablePublishReport && !enableScAndNq && !enableAnomalyDetection)
          $("#exam-setting").css({ display: "none" });
        if (!isTimeZone) {
          const timezone = standardTimezones.find(
            (tz) => tz.identifier === data[0]?.settings?.exam?.timeZone
          );

          $("#user-filter-input").val(`${timezone.offset} ${timezone.name}`);
          $("#user-filter-input").data(
            "identifier",
            data[0]?.settings?.exam?.timeZone
          );
        }
        loadAcountContent(null)
      } else {
        const examId = getQueryParameter("id");
        getExamData(examId, enableAnomalyDetection, enableScAndNq, enablePublishReport);
      }

      if (enableAIQuestionGenerator) {
        $("#ai-generate-btn").show();
      }

      if (enableGroupCreation) {
        $("#group-import-btn").show();
      }

      let QuestionTypeDropDown = $("#question-type");
      QuestionTypeDropDown.empty();

      // Wrap the dropdown in a wrapper div for the info button
      if (!QuestionTypeDropDown.parent().hasClass('question-type-wrapper')) {
        QuestionTypeDropDown.wrap('<div class="question-type-wrapper"></div>');

        // Add info button next to the dropdown
        const infoButton = $('<span class="info-button">i</span>');
        QuestionTypeDropDown.parent().append(infoButton);

        // Initialize Bootstrap tooltip for info button
        infoButton.tooltip();

        // Add info panel
        const infoPanel = $(`
          <div class="question-types-info-panel">
            <div class="question-types-info-panel-header">Question Type Information</div>
            <div class="question-types-info-list"></div>
          </div>
        `);
        QuestionTypeDropDown.parent().append(infoPanel);

        // Handle info button click
        infoButton.on('click', function (e) {
          e.stopPropagation();
          infoPanel.toggleClass('show');
        });

        // Close panel when clicking outside
        $(document).on('click', function (e) {
          if (!$(e.target).closest('.question-type-wrapper').length) {
            infoPanel.removeClass('show');
          }
        });
      }

      if (enableItemTypes?.length === 0 || enableItemTypes === undefined) {
        $("#question-type").append(
          `<option value="MCQ">MCQ (Multiple Choice Question)</option>`
        );
      } else {
        // Clear info panel
        $('.question-types-info-list').empty();

        QuestionTypes.filter((type) =>
          enableItemTypes?.includes(type.value)
        ).forEach((type) => {
          QuestionTypeDropDown.append(
            `<option value="${type.value}" data-bs-toggle="tooltip" data-bs-placement="right" title="${type.description}">${type.name}</option>`
          );

          // Add to info panel
          $('.question-types-info-list').append(`
            <div class="question-type-info-item">
              <div class="question-type-info-item-title">${type.name}</div>
              <div class="question-type-info-item-description">${type.description}</div>
            </div>
          `);
        });
      }
    },
    errorCallback: function (error) {
      displayToast(`Error: ${error}`, "error");
    },
  });
}

function getExamData(examId, enableAnomalyDetection, enableScAndNq, enablePublishReport) {
  const endpointUrl = `${EXAM_END_POINT}?entranceExamId=${examId}`;

  makeApiCall({
    url: endpointUrl,
    method: "GET",
    successCallback: function (response) {
      const data = response.data.exam;
      const enabledFeatures = response?.data?.exam?.enabledFeatures;
      examStatus = response.data.exam.status;
      examCurrentStatus = response.data.exam.examStatus;
      examDurationMinutes = data?.settings?.duration;
      cutoffPercentage = data?.settings?.cutoff;

      if (response.data.exam.questions.length) {
        $("#step-2-circle").css({ border: "2px solid #16A34A" });
        $("#2-pratent .tab-circle-border .tab-circle").css({
          backgroundColor: "#16A34A !important",
        });
        $("#2-pratent .tab-circle-text").css({ color: "#16A34A" });
        $("#line-first")
          .find(".line")
          .css({ backgroundColor: "1.5px solid #16A34A" });
        $("#line-second")
          .find(".point")
          .css({ borderLeft: "11px solid #16A34A" });
        $("#line-second")
          .find(".line")
          .css({ backgroundColor: "1.5px solid #16A34A" });
      }
      if (examCurrentStatus === ON_GOING) {
        $(".exam-ongoing-msg").html("Ongoing");
      }
      if (
        examStatus === FINALIZED &&
        examCurrentStatus !== ON_GOING &&
        examCurrentStatus !== ENDED
      ) {
        $(".exam-ongoing-msg").html("Finalized");
      }
      if (examCurrentStatus === ENDED) {
        $(".exam-ongoing-msg").html("Ended");
        $("#navigate-to-report-btn").show();
      } else {
        $("#navigate-to-report-btn").hide();
      }

      if (examStatus === FINALIZED) {
        $(".save-reminder-banner").css({ display: "flex" });
      } else {
        $(".save-reminder-banner").css({ display: "none" });
      }

      $("#exam-name").val(data.name);
      $('input[id="exam-duration"]').each(function () {
        $(this).val(data?.settings?.duration);
      });
      $("#is-record").prop("checked", response.data.exam?.isRecordingEnable);
      $("#screen-recording-toggle").prop(
        "checked",
        enabledFeatures.includes("screenRecording")
      );
      $("#webcam-recording-toggle").prop(
        "checked",
        enabledFeatures.includes("webCamRecording")
      );
      $("#audio-recording-toggle").prop(
        "checked",
        enabledFeatures.includes("audioRecording")
      );
      $("#both-two-option").prop(
        "checked",
        enabledFeatures.includes("webCamRecording") &&
        enabledFeatures.includes("screenRecording") &&
        enabledFeatures.includes("audioRecording")
      );
      if (!enableAnomalyDetection) $("#AI").css({ display: "none" });
      if (!enableScAndNq) $("#SC").css({ display: "none" });
      if (!enablePublishReport) $("#DR").css({ display: "none" });
      $("#calculator-toggle").prop(
        "checked",
        enabledFeatures.includes("canShowCalculator")
      );

      $("#voice-alert-toggle").prop(
        "checked",
        enabledFeatures.includes("isVoiceAlert")
      );
      $("#canSendEmailWithPassword").prop(
        "checked",
        response?.data?.exam?.settings?.canSendEmailWithPassword
      );

      $("#without-registration").prop(
        "checked",
        response?.data?.exam?.settings?.allowStudentsWithoutRegistration
      );
      isSendPasscode = response?.data?.exam?.settings?.canSendEmailWithPassword;
      $("#publish-report-toggle").prop(
        "checked",
        enabledFeatures.includes("canPublishReport")
      );

      // Set shuffle questions toggle based on settings
      $("#shuffle-questions-toggle").prop(
        "checked",
        response?.data?.exam?.settings?.canShuffleQuestions !== false
      );

      // Set shuffle options toggle based on settings
      $("#shuffle-options-toggle").prop(
        "checked",
        response?.data?.exam?.settings?.canShuffleOptions !== false
      );

      if (response?.data?.exam?.settings?.timeZone) {
        const timezone = standardTimezones.find(
          (tz) => tz.identifier === response?.data?.exam?.settings?.timeZone
        );
        if (timezone) {
          isTimeZone = true;
          $("#user-filter-input").val(`${timezone.offset} ${timezone.name}`);
          $("#user-filter-input").data(
            "identifier",
            response?.data?.exam?.settings?.timeZone
          );
        }
      }
      loadExamDetails(response);
      // Format and set the start date and time
      const newStartDate = new Date(data.session.start.date);
      const startHour = data.session.start.hour;
      const startMinute = data.session.start.minute;
      const startFormat = data.session.start.format;
      const startTime = formatTime(startHour, startMinute, startFormat);
      const startDate = formatDate(newStartDate);

      // Set the values for start date and time
      $("#start-date").val(formatDateForDateInput(newStartDate));

      $("#start-time").val(startTime);

      // Format and set the end date and time
      const newEndDate = new Date(data.session.end.date);
      const endHour = data.session.end.hour;
      const endMinute = data.session.end.minute;
      const endFormat = data.session.end.format;
      const endTime = formatTime(endHour, endMinute, endFormat);
      // const endDate = formatDate(newEndDate);

      // Set the values for end date and time
      $("#end-date").val(formatDateForDateInput(newEndDate));

      $("#end-time").val(endTime);

      const examDetails = `
            <h1>${data.name}</h1>
            <b>Start Date: ${startDate}  ${startTime} <br></b>
            `;

      // Initialize email template content
      loadAcountContent(data?.content);

      $("#exam-details").html(examDetails);

      const isnew = getQueryParameter("isnew");
      if (isnew) {
        navigateToStep(2);
        markStepCompleted("#link-to-step-1");
      }

      // Start the assessment loader before rendering questions
      if (response?.data?.exam?.questions?.length > 0) {
        AssessmentLoader.startEditorTracking();
      }

      // Render all questions first
      response?.data?.exam?.questions?.forEach((question) => {
        renderQuestionByType(question);
      });

      // Hide the assessment loader after all questions are rendered with a 3-second delay
      setTimeout(() => {
        AssessmentLoader.showAssessmentLoader(false);
        showLoader(false);
      }, 3000);

      loadAttendees(examId);

      // Hide the default loader only
      showLoader(false);
    },
    errorCallback: function (error) {
      displayToast(`Error: ${error}`, "error");
      showLoader(false);
      AssessmentLoader.showAssessmentLoader(false);
    },
  });
}
// 1. Live update when user types
$("#exam-name").on("input", function () {
  const examName = $(this).val().trim();
  $(".breadcrumb-exam-name").text(examName || "");
});

// Load from API
function loadExamDetails(response) {
  const examNameFromApi = response?.data?.exam?.name || "";
  $("#exam-name").val(examNameFromApi);
  $(".breadcrumb-exam-name").text(examNameFromApi);
}
function updateQuestionIds(serverQuestions) {
  serverQuestions?.questions.forEach((serverQuestion, index) => {
    const $questionElement = $("#questions-container .question").eq(index);
    const currentRealId = $questionElement.attr("data-realid");
    let hasNewChoice = false;
    $questionElement.find(".choice").each(function () {
      const choiceId = $(this).attr("data-choice-id");
      if (choiceId === "new") {
        hasNewChoice = true;
        return false; // break loop early
      }
    });


    if (currentRealId === "new" || hasNewChoice) {
      $questionElement.attr("data-realid", serverQuestion._id);
      $questionElement
        .find(".attactment-upload")
        .attr("data-question-id", serverQuestion._id)
        .attr(
          "data-attachments",
          JSON.stringify(serverQuestion.attachments || [])
        );

      // Handle choices for different question types
      if (serverQuestion.choices && serverQuestion.choices.length > 0) {
        serverQuestion.choices.forEach((serverChoice) => {
          if (!serverChoice.key || !serverChoice._id) {
            return;
          }

          // Update the main choice div
          const $choiceElement = $questionElement.find(
            `#choice-${serverChoice.key}-${index + 1}`
          );
          if ($choiceElement.length) {
            $choiceElement.attr("data-choice-id", serverChoice._id);
          }

          // Update the choice attachment container - Fix selector to match the actual ID structure
          const $attachmentContainer = $questionElement.find(
            `#choice-attachment-container-${index + 1}-${serverChoice.key}`
          );

          // If no container found with the first pattern, try another pattern
          if (!$attachmentContainer.length) {
            const questionId = index + 1;
            const alternativeContainer = $questionElement.find(
              `#choice-attachment-container-${questionId}-${serverChoice.key}`
            );

            if (alternativeContainer.length) {
              alternativeContainer.attr("data-choice-id", serverChoice._id);
              alternativeContainer.attr("data-question-id", serverQuestion._id);

              // Update inner elements
              alternativeContainer
                .find(".choice-attachment-container")
                .attr("data-choice-id", serverChoice._id);
              alternativeContainer
                .find(".choice-attachment-container")
                .attr("data-question-id", serverQuestion._id);

              // Safely update attachments attribute
              try {
                alternativeContainer.attr(
                  "data-attachments",
                  JSON.stringify(serverChoice.attachments || [])
                );
              } catch (e) {
                alternativeContainer.attr("data-attachments", "[]");
              }
            }
          } else {
            $attachmentContainer.attr("data-choice-id", serverChoice._id);
            $attachmentContainer.attr("data-question-id", serverQuestion._id);

            // Update inner choice-attachment-container elements
            $attachmentContainer
              .find(".choice-attachment-container")
              .attr("data-choice-id", serverChoice._id);
            $attachmentContainer
              .find(".choice-attachment-container")
              .attr("data-question-id", serverQuestion._id);

            // Safely update attachments attribute
            try {
              $attachmentContainer.attr(
                "data-attachments",
                JSON.stringify(serverChoice.attachments || [])
              );
            } catch (e) {
              $attachmentContainer.attr("data-attachments", "[]");
            }
          }
        });
      }

      // Update question numbering display
      $questionElement.find(".qcnt").text(index + 1);
    }
  });
}

// Add this function outside the click handler
function printPreview() {
  const printContent = $("#preview-modal").clone();
  printContent.find(".ui-dialog-titlebar, button").remove();
  printContent
    .find(".ui-dialog-titlebar, .correct-answer")
    .append(`<div style="float:right;margin-top:-18px">✔</div>`);

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
        <html>
            <head>
                <title>Digival IT Solutions - Exam Preview</title>
                <style>
                    ${$("style")
      .map((i, el) => el.innerHTML)
      .get()
      .join("\n")}
                    .preview-total-marks {
                        text-align: right;
                        margin: 0 0 20px 0;
                        page-break-after: avoid;
                    }
                    .preview-question { 
                        page-break-inside: avoid; 
                        margin: 0 0 30px 0;
                    }
                    .preview-question:first-child {
                        margin-top: 0;
                    }
                    .preview-image-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);  /* More columns for smaller images */
                        gap: 10px;
                        margin: 15px 0;
                    }
                    .preview-image-item {
                        max-width: 150px !important;  /* Smaller image container */
                        height: auto !important;
                        margin: 0 auto;  /* Center images */
                    }
                    .preview-image-item img {
                        max-width: 100% !important;  /* Constrain image to container */
                        height: 120px !important;  /* Fixed height */
                        object-fit: cover;  /* Maintain aspect ratio */
                    }
                    .preview-choice {
                        border: 1px solid #ddd;
                        padding: 15px;
                        margin: 10px 0;
                        border-radius: 4px;
                    }
                    @media print {
                        .preview-total-marks {
                            margin-bottom: 10px;
                        }
                        body {
                            padding-top: 0 !important;
                        }

                        button { display: none; }

                        .marks {
                            text-align: right;
                            margin: 0 0 10px 0;
                            padding: 0;
                        }
                        
                        .preview-question h3 {
                            margin-top: 0;
                            padding-top: 0;
                        }

                        .preview-image-item { 
                            max-width: 120px !important;
                            height: 100px !important;
                        }
                        .preview-image-grid {
                            grid-template-columns: repeat(5, 1fr);
                        }

                        .preview-attachment-item {
                            max-width: 100px !important;
                            height: 80px !important;
                        }
                        .attachment-thumbnail {
                            height: 80px !important;
                        }
                    }
                </style>
            </head>
            <body>
                ${printContent.html()}
            </body>
        </html>
    `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}

function getQuestions(cell) {
  let content = "";
  Array.from(cell.getElementsByTagName("w:p")).forEach((para) => {
    const runs = para.getElementsByTagName("w:r");

    for (const run of runs) {
      let textContent = "";
      const textNodes = run.getElementsByTagName("w:t");
      if (textNodes.length > 0) {
        textContent = textNodes[0].textContent;
      }
      content += textContent;
    }
  });
  return content;
}

function getValue(cell) {
  let options = [];
  let correctIndex = -1;

  Array.from(cell.getElementsByTagName("w:p")).forEach((para, index) => {
    let optionText;
    let isCorrect = false;

    const runs = para.getElementsByTagName("w:r");
    for (const run of runs) {
      const textNodes = run.getElementsByTagName("w:t");
      if (textNodes.length > 0) {
        optionText = textNodes[0].textContent;
      }

      // Check if this run has formatting (indicates correct answer)
      if (run.getElementsByTagName("w:rPr")[0]) {
        isCorrect = true;
      }
    }

    if (optionText) {
      options.push({ label: optionText, key: String.fromCharCode(65 + index) });
    }

    if (isCorrect) {
      correctIndex = index;
    }
  });

  const correct =
    correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : "";
  return { option: options, correct };
}

function saveQuestions(examId, questions, callback, isAutoSave = false) {
  const endpointUrl = `${QUESTIONS_END_POINT}/create?entranceExamId=${examId}`;

  makeApiCall({
    url: endpointUrl,
    method: "POST",
    data: JSON.stringify({ questions: questions }),
    disableLoading: isAutoSave,
    successCallback: function (response) {
      if (!isAutoSave) displayToast("Questions saved successfully!", "success");
      if (typeof callback === "function") {
        callback();
      }
      localStorage.setItem("questions", JSON.stringify([examId]));
    },
    errorCallback: function (error) { },
  });
}

function updateToggle(response, isDisab) {
  const features = response?.data?.exam?.enabledFeatures || [];
  const toggleMap = {
    screenRecording: "#screen-recording-toggle",
    webCamRecording: "#webcam-recording-toggle",
    // canTakePhoto: "#image-capture-toggle",
    // canUploadImage: "#image-upload-toggle",
    canShowCalculator: "#calculator-toggle",
    audioRecording: "#audio-recording-toggle",
    voiceAlert: "#voice-alert-toggle",
    canSendEmailWithPassword: "#canSendEmailWithPassword",
    withoutRegistration: "#without-registration",
  };
  features.forEach((feature) => {
    if (toggleMap[feature]) {
      $(toggleMap[feature]).prop("checked", true);
    }
  });

  // if (
  //   features.includes("canTakePhoto") &&
  //   features.includes("canUploadImage")
  // ) {
  //   isDisableIR = true;
  // }
}

function openDetailsDialog(attenderData) {
  const { data } = attenderData;

  // Format date
  const registrationDate = new Date(data.updatedAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  // Generate HTML for face images with actions
  const faceImagesHTML = data.face?.length
    ? data.face
        .map(
          (urlArray) =>
            `<div class="face-image-container">
      <img src="${urlArray}" alt="Face Photo" class="face-photo" onerror="handleImageError(this)"/>
      <div class="attachment-actions">
        <a href="${urlArray}" target="_blank" class="action-btn view">
            <i class="fas fa-external-link-alt"></i> Open
        </a>
        <a href="${urlArray}" target="_blank" download class="action-btn download">
          <i class="fas fa-download"></i> Download
        </a>
      </div>
                          </div>`
      )
      .join("")
    : '<div class="no-images">No face photos found</div>';

  // Generate HTML for attachments
  const attachmentsHTML = data.attachments?.length
    ? data.attachments
      .map((urlArray) => generateAttachmentHTML(urlArray))
      .join("")
    : '<div class="no-images">No attachments found</div>';

  const dialogContent = `
    <div class="student-details-container g-scroll">
      <div class="student-info-grid">
        <div class="info-card" >
          <h3>Personal Information</h3>
          <div class="info-item">
            <span class="label">Name:</span>
            <span class="value">${data.name?.first || ""} ${data.name?.last || ""
    }</span>
                  </div>
          <div class="info-item">
            <span class="label">Email:</span>
            <span class="value">${data.email}</span>
                </div>
                        </div>
        <div class="info-card">
          <h3>Status Information</h3>
          <div class="info-item">
            <span class="label">Registration Date:</span>
            <span class="value">${registrationDate}</span>
                                  </div>
          <div class="info-item">
            <span class="label">Registration Status:</span>
            <span class="status-badge ${data.status?.registration?.toLowerCase()}">${data.status?.registration || "N/A"
    }</span>
                                  </div>  
                                  </div>
                                </div>

        <div class="face-attachments-section">
          ${faceImagesHTML
      ? `
            <div class="info-card">
              <h3>Face Photos</h3>
              <div class="face-images-grid">
                ${faceImagesHTML}
                            </div>
                          </div>
          `
      : ""
    }

          ${attachmentsHTML
      ? `
            <div class="info-card">
              <h3>Documents & Files</h3>
              <div class="attachments-grid">
                ${attachmentsHTML}
              </div>
                                        </div>
                                    `
      : ""
    }
                </div>
            </div>
        `;

  $("#viewDetailsDialog")
    .html(dialogContent)
    .dialog({
      title: "Student Details",
      width: 1000,
      maxHeight: 800,
      modal: true,
      classes: {
        "ui-dialog": "student-details-dialog",
      },
      buttons: [
        {
          html: `
              <label class="toggle-resend">
                  <input type="checkbox" id="resend-toggle" ${canSendEmail ? "checked" : "disabled"}>
                  <span class="slider"></span>
                  <span class="toggle-label">Resend Invitation Email When Rejecting Application </span>
              </label>
          `,
          class: "btn-resend-mail-toggle",
          click: function () { },
        },
        {
          html: `<i class="fas fa-times-circle"></i> <span style="font-size: 12px;">Reject</span>`,
          class: "email-template-btn",
          click: function () {
            const email = $(this).data("email");
            const shouldResend =
              document.getElementById("resend-toggle").checked
            if (shouldResend) {
              sendInviteEmails([data.email], {
                forceRegistration: true,
                forceInvitation: false,
              });
              updateAttenderStatus(data.email, REJECTED);
            } else {
              $("#viewDetailsDialog").dialog("close");
            }
          },
        },
        {
          html: `
    <i class="fas fa-check-circle"></i> 
    ${data.status?.registration === APPROVED
              ? `<span style="font-size: 12px;">Approved</span>`
              : `<span style="font-size: 12px;">Approve</span>`
            }
  `,
          class: `bulk-import-btn ${data.status?.registration === APPROVED ? "disabled" : ""
            }`,
          click: function () {
            if (data.status?.registration !== APPROVED) {
              updateAttenderStatus(data.email, APPROVED);
            }
          },
          disabled: data.status?.registration === APPROVED,
        },
      ],
      create: function (event, ui) {
        var closeButton = $(
          '<button type="button" class="ui-button ui-corner-all ui-widget ui-dialog-titlebar-close" title="Close">X</button>'
        );
        closeButton.on("click", function () {
          $("#viewDetailsDialog").dialog("close");
        });
        $(this)
          .closest(".ui-dialog")
          .find(".ui-dialog-titlebar")
          .append(closeButton);
      },
    });
}

//update approved the attender
function updateAttenderStatus(email, status) {
  showLoader(true);
  $.ajax({
    url: `${ATTENDER_END_POINT}?email=${email}`,
    method: "PUT",
    headers: apiHeaders,
    contentType: "application/json",
    data: JSON.stringify({
      status: {
        registration: status,
      },
    }),
    success: function (response) {
      displayToast("Student details updated", "Success");
      showLoader(false);
      $("#viewDetailsDialog").dialog("close");
    },
    error: function (xhr) {
      displayToast("Failed to update student", "Error");
      showLoader(false);
    },
  });
}

// Update generateAttachmentHTML function
function generateAttachmentHTML(url) {
  if (!url) return "";

  const cleanUrl = url.split("?")[0];
  const fileExtension = cleanUrl.split(".").pop().toLowerCase();

  if (fileExtension === "pdf") {
    return `
      <div class="attachment-preview">
        <object data="${url}" type="application/pdf" width="100%" height="100%">
          <div class="pdf-fallback">
            <i class="fas fa-file-pdf pdf-icon"></i>
            <p>Preview not available. <a href="${url}" download>Download PDF</a></p>
          </div>
        </object>
        <div class="attachment-actions">
          <a href="${url}" target="_blank" class="action-btn view">
            <i class="fas fa-external-link-alt"></i> Open
          </a>
          <a href="${url}" target="_blank" download class="action-btn download">
            <i class="fas fa-download"></i> Download
          </a>
        </div>
      </div>`;
  } else {
    return `
      <div class="attachment-preview">
        <img src="${url}" alt="Attachment" loading="lazy" onerror="handleImageError(this)"/>
        <div class="attachment-actions">
          <a href="${url}" target="_blank" class="action-btn view">
            <i class="fas fa-external-link-alt"></i> Open
          </a>
          <a href="${url}" target="_blank" download class="action-btn download">
            <i class="fas fa-download"></i> Download
          </a>
        </div>
      </div>`;
  }
}

// Function to open the extra time dialog
function openExtraTimeDialog(id) {
  // Show loader while fetching data
  showLoader(true);
  makeApiCall({
    url: `${STUDENT_END_POINT}/end-time?entranceExamId=${examIds}&studentId=${id}`,
    method: "GET",
    successCallback: function (response) {
      showLoader(false);
      renderExtraTimeDialog(response.data, id);
    },
    errorCallback: function (error) {
      showLoader(false);
      toastr.error("Failed to add extra time. Please try again.");
    },
  });
}

// Function to render the extra time dialog with data
function renderExtraTimeDialog(timeData, id) {
  // Calculate current extra time if data exists
  let extraTimeInfo = "";
  let hasExistingExtraTime = false;

  if (timeData) {
    // Use Luxon to handle timezone-aware date formatting
    const endTime = luxon.DateTime.fromISO(timeData.endTime).setZone(
      timeData.timeZone
    );
    const startTime = luxon.DateTime.fromISO(timeData.firstStartedAt).setZone(
      timeData.timeZone
    );

    // Calculate duration in minutes
    const durationInMinutes = Math.round(
      endTime.diff(startTime, "minutes").minutes
    );
    const standardDuration = examDurationMinutes || 0; // Get from the main exam duration
    // If exam duration is longer than standard, extra time was given
    if (standardDuration > 0) {
      const extraMinutes = durationInMinutes - standardDuration;
      hasExistingExtraTime = true;

      // Format time display
      const hours = Math.floor(extraMinutes / 60);
      const minutes = extraMinutes % 60;
      const timeDisplay =
        hours > 0
          ? `${hours} hour${hours > 1 ? "s" : ""} ${minutes > 0
            ? ` and ${minutes} minute${minutes > 1 ? "s" : ""}`
            : ""
          }`
          : `${minutes} minute${minutes > 1 ? "s" : ""}`;

      // Format date-time display in the correct timezone - show only hours and minutes with AM/PM
      const formattedEndTime = endTime.toFormat("hh:mm a");

      // Generate history HTML if reasons array exists with new structure
      let reasonsHistoryHtml = "";

      if (timeData.reasons && timeData.reasons.length > 0) {
        reasonsHistoryHtml = `
          <div class="extra-time-history">
            <div class="time-history-list">
              ${timeData.reasons
            .map((reasonData, index) => {
              const entryTime = luxon.DateTime.fromISO(
                reasonData.timestamp
              ).setZone(timeData.timeZone);
              const formattedEntryTime = entryTime.toFormat(
                "MMM d, yyyy hh:mm a"
              );

              // Format duration display
              const entryHours = Math.floor(reasonData.duration / 60);
              const entryMinutes = reasonData.duration % 60;
              const entryTimeDisplay =
                entryHours > 0
                  ? `${entryHours} hour${entryHours > 1 ? "s" : ""} ${entryMinutes > 0
                    ? ` and ${entryMinutes} minute${entryMinutes > 1 ? "s" : ""
                    }`
                    : ""
                  }`
                  : `${entryMinutes} minute${entryMinutes > 1 ? "s" : ""}`;

              return `
                <div class="history-entry${index > 0 ? " mt-3" : ""}">
                  <div class="history-entry-header">
                    <span class="entry-duration">${entryTimeDisplay}</span>
                    <span class="entry-timestamp">Added on: ${formattedEntryTime}</span>
                  </div>
                  <div class="reason-text">
                    ${reasonData.reason}
          </div>
                  
                </div>`;
            })
            .join("")}
        </div>
          </div>`;
      }

      extraTimeInfo = `
        <div class="current-extra-time-info">
          <div class="extra-time-summary">
            <div class="summary-icon"><i class="fas fa-clock"></i></div>
            <div class="summary-details">
              <h4>Current Status</h4>
              <div class="time-value">${timeDisplay} of extra time</div>
              <div class="text-muted">Ends at: ${formattedEndTime} (${timeData.timeZone})</div>
            </div>
          </div>
          ${reasonsHistoryHtml}
          </div>
      `;
    }
  }

  // Create the dialog content with tabs
  const dialogContent = `
    <div class="extra-time-dialog">
      <div class="extra-time-tabs">
        <button class="tab-btn active" data-tab="add-time-tab">Give Extra Time</button>
        <button class="tab-btn " data-tab="history-tab">Extra Time History</button>
            </div>
  
      <div class="tab-content-container">
       
        <div id="add-time-tab" class="tab-content active">
          <div class="extra-time-reminder-banner">
                <div class="banner-content">
                  <i class="fas fa-exclamation-triangle banner-icon"></i>
                  <span class="banner-message">Please provide a minimum of 10 minutes extra time.</span>
                </div>
              </div>
          <div class="info-card extra-time-section">
            <h3>Give Extra Time</h3>
            <p class="extra-time-description">Specify the amount of extra time to give to this student.</p>
            
            <div class="extra-time-controls">
              <div class="time-input-group">
                <label for="extra-hours">Hours:</label>
                <input type="number" id="extra-hours" min="0" max="24" value="0" class="time-input">
              </div>
              <div class="time-input-group">
                <label for="extra-minutes">Minutes:</label>
                <input type="number" id="extra-minutes" min="10" max="59" value="0" class="time-input">
                        </div>
                        </div>  
            
            <div class="reason-input-container">
              <label for="extra-time-reason">Reason for giving extra time:</label>
              <textarea id="extra-time-reason" placeholder="Please provide a reason for giving extra time" class="form-control"></textarea>
                        </div>
                      </div>

                  </div>
  
        <div id="history-tab" class="tab-content">
          <div class="info-card extra-time-history-section">
            <h3>Extra Time History</h3>
            ${hasExistingExtraTime
      ? extraTimeInfo
      : '<p class="no-history">No extra time has been given yet.</p>'
    }
            </div>
          </div>
        </div>
      </div>
    `;

  // Define a function to update button text based on active tab
  function updateButtonText() {
    const dialog = $("#extraTimeDialogContainer");
    const applyButton = dialog.dialog("widget").find(".btn-apply-extra-time");

    if ($("#history-tab").hasClass("active")) {
      applyButton.text("Give Extra Time");
    } else {
      applyButton.text("Apply Extra Time");
    }
  }

  // Create and open the dialog
  $("#extraTimeDialogContainer")
    .html(dialogContent)
    .dialog({
      title: "Extra Time Management",
      width: 550,
      modal: true,
      classes: {
        "ui-dialog": "extra-time-dialog-container",
      },
      buttons: [
        {
          text: "Cancel",
          class: "btn-cancel",
          click: function () {
            $(this).dialog("close");
          },
        },
        {
          text: "Apply Extra Time",
          class: "btn-apply-extra-time",
          click: function () {
            // Check which tab is active
            if ($("#history-tab").hasClass("active")) {
              // If on history tab, switch to the add time tab
              $(".tab-btn[data-tab='add-time-tab']").trigger("click");
              return;
            }

            // Otherwise process the extra time form
            const extraHours = parseInt($("#extra-hours").val()) || 0;
            const extraMinutes = parseInt($("#extra-minutes").val()) || 0;
            const reason = $("#extra-time-reason").val().trim();

            if (extraHours === 0 && extraMinutes < 10) {
              toastr.warning("Please enter at least 10 minutes of extra time.");
              return;
            }

            const totalExtraMinutes = extraHours * 60 + extraMinutes;
            addExtraTime(id, totalExtraMinutes, reason);

            $(this).dialog("close");
          },
        },
      ],
      create: function (event, ui) {
        var closeButton = $(
          '<button type="button" class="ui-button ui-corner-all ui-widget ui-dialog-titlebar-close" title="Close">X</button>'
        );
        closeButton.on("click", function () {
          $("#extraTimeDialogContainer").dialog("close");
        });
        $(this)
          .closest(".ui-dialog")
          .find(".ui-dialog-titlebar")
          .append(closeButton);
      },
      open: function () {
        // Add tab switching functionality
        $(".tab-btn").on("click", function () {
          // Don't do anything if the tab is disabled
          if ($(this).hasClass("disabled")) return;

          const tabId = $(this).data("tab");

          // Update active tab button
          $(".tab-btn").removeClass("active");
          $(this).addClass("active");

          // Show the selected tab content
          $(".tab-content").removeClass("active");
          $("#" + tabId).addClass("active");

          // Update dialog buttons based on active tab
          updateButtonText();
        });

        // Initial button text update
        updateButtonText();
      },
    });
}

// Function to add extra time to a student's exam
function addExtraTime(studentId, extraMinutes, reason) {
  showLoader(true);
  makeApiCall({
    url: `${STUDENT_END_POINT}/extra-time?entranceExamId=${examIds}&studentId=${studentId}`,
    method: "PUT",
    data: JSON.stringify({
      duration: extraMinutes,
      reason: reason,
    }),
    successCallback: function (response) {
      showLoader(false);
      toastr.success(
        `Successfully added ${extraMinutes} minutes of extra time.`
      );
    },
    errorCallback: function (error) {
      showLoader(false);
      toastr.error("Failed to give extra time.because student already submitted");
    },
  });
}

// Function to open the revoke exam dialog
function openRevokeExamDialog(id, attenderData) {
  renderRevokeExamCustomPopup(id, attenderData);
}

// Function to render a custom revoke exam popup
function renderRevokeExamCustomPopup(id, attenderData) {
  const popupHTML = `
    <div id="custom-revoke-popup" class="custom-popup">
      <div class="custom-popup-content">
        <div class="custom-popup-header">
          <h3>Extend Exam</h3>
          <span class="close-popup">&times;</span>
                </div>
        <div class="custom-popup-body">
          <div class="control-card">
            <div class="revoke-control-section">
              <div class="revoke-toggle-container">
                <div class="status-label">
                  <span>Extend Exam</span>
                        </div>
                <div class="toggle-with-status">
                                      <label class="toggle-switch">
                    <input type="checkbox" id="revoke-exam-toggle" ${attenderData && attenderData?.value ? "checked" : ""
    } >
                    <span class="toggle-slider"></span>
                                      </label>                            
                  <span id="access-status" class="status-badge ${attenderData && attenderData?.value
      ? "status-enabled"
      : "status-disabled"
    }">${attenderData && attenderData?.value ? "Extended" : "Not Extended"
    } </span>
                                  </div>
                
                                  </div>  
              <span class="info-text">Allow student to start the exam regardless of the scheduled start time</span>
              <div id="action-reason-section">
                <label for="action-reason">
                  <i class="fas fa-comment-alt"></i> 
                  Reason :
                                      </label>
                <textarea id="action-reason" rows="3" placeholder="Enter reason..."></textarea>
                <div class="button-container">
                  <button id="submit-action" class="btn-modern" data-id="${id}">
                    <i class="fas fa-check-circle "></i>  Apply Changes
                  </button>
                                  </div>
                                </div>
                            </div>
                          </div>
          
          <div class="control-card">
            <div class="history-section">
              <h4>Changes History</h4>
              <div class="history-list">

                ${attenderData &&
    attenderData?.reasons
      ?.map(
        (item) => `
                  <div class="history-item">
                    <div class="history-content">
                      <span class="history-event">${item?.text}</span>
                      <span class="history-time">${new Date(
          item?.createdAt
        ).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })}</span>
                    </div>
                                  </div>
                                  `
      )
      .join("")
    }

                              </div>
                          </div>
                          </div>
                        </div>
                    </div>
            </div>
        `;

  // Append to body
  $("body").append(popupHTML);

  // Add event listeners
  $(".close-popup").on("click", function () {
    $("#custom-revoke-popup").remove();
  });

  // Close when clicking outside of popup content
  $("#custom-revoke-popup").on("click", function (event) {
    if (event.target === this) {
      $(this).remove();
    }
  });

  // Toggle the access status when toggle is changed
  $("#revoke-exam-toggle").on("change", function () {
    if ($(this).is(":checked")) {
      $("#access-status")
        .text("Extended")
        .removeClass("status-disabled")
        .addClass("status-enabled");
    } else {
      $("#access-status")
        .text("Not Extended")
        .removeClass("status-enabled")
        .addClass("status-disabled");
    }
  });

  // Handle action submission
  $("#submit-action").on("click", function () {
    const studentId = $(this).data("id");
    const reason = $("#action-reason").val();
    const isEnabled = $("#revoke-exam-toggle").is(":checked");
    if (!reason.trim()) {
      toastr.error("Please provide a reason for changing exam access.");
      return;
    }
    if (attenderData?.value === isEnabled) {
      toastr.error(
        `Please ${attenderData?.value === true ? "disable" : "enable"} extend`
      );
      return;
    }

    // Get the examId - assuming it's available from URL or stored in data attribute
    const examId = getQueryParameter("id"); // Using the existing getQueryParameter function

    // Call API to update exam access
    makeApiCall({
      url: `${STUDENT_END_POINT}/exam-access?entranceExamId=${examId}&studentId=${studentId}`,
      method: "PUT",
      data: JSON.stringify({
        canStartExamAfterExamEndTime: isEnabled,
        reason: reason,
      }),
      successCallback: function (response) {
        // Show success message and close popup
        const actionType = isEnabled ? "extended" : "not extended";
        toastr.success(`Exam access has been ${actionType} successfully.`);
        $("#custom-revoke-popup").remove();
        reloadAttendees(examId);
      },
      errorCallback: function (error) {
        toastr.error("Failed to update exam access. Please try again.");
        console.error("Error updating exam access:", error);
      },
    });
  });
}

function centerOrRight(count) {
  if (count < 1) {
    $(".add-question-container").css({
      position: "absolute",
      top: "50%",
      left: "35%",
    });
  } else {
    $(".add-question-container").css({
      position: "",
      top: "",
      left: "",
    });
  }
}

// Add these helper functions at the top level
function loadAcountContent(content = null) {
  if (content) {
    // Initialize email template content
    $("#registration-subject").val(content?.registrationSubject);
    $("#registration-content").trumbowyg("html", content?.registrationContent);
    $("#invitation-subject").val(content?.invitationSubject);
    $("#invitation-content").trumbowyg("html", content?.invitationContent);
  } else {
    makeApiCall({
      url: `${ACCOUNT_END_POINT}/content`,
      method: "GET",
      successCallback: (response) => {
        const accountContent = response?.data;
        loadAcountContent(accountContent);
      },
      errorCallback: (error) => { },
    });
  }
}

// Function to update match numbers when items are added or removed
function updateMatchNumbers(questionId) {
  const matchesContainer = $(`#matches-answers-${questionId}`);
  const matches = matchesContainer.children(".match-container");

  // Update emoji numbers
  matches.each(function (index) {
    const matchNumber = index + 1;
    $(this).find(".match-number").text(`${matchNumber}`);
  });

  // Update total count display
  $(".match-count").text(matches.length);
}

// Helper function to format the date as dd-mm-yyyy
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Helper function to format time as hh:mm AM/PM
function formatTime(hour, minute, format) {
  const hours12 = hour % 12 || 12;
  const formattedMinute = String(minute).padStart(2, "0");
  return `${hours12}:${formattedMinute} ${format}`;
}

// Helper function to format date for input type="date" as yyyy-mm-dd
function formatDateForDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Function to generate the table dimension grid
function generateTableGrid(rows, cols) {
  let gridHtml = '<table class="dimension-grid">';

  for (let r = 0; r < rows; r++) {
    gridHtml += "<tr>";
    for (let c = 0; c < cols; c++) {
      gridHtml += `<td class="grid-cell" data-row="${r + 1}" data-col="${c + 1
        }"></td>`;
    }
    gridHtml += "</tr>";
  }

  gridHtml += "</table>";
  return gridHtml;
}

// Function to initialize the grid selector behavior
function initTableGridSelector() {
  let selectedRows = 0;
  let selectedCols = 0;

  // Handle hover over grid cells
  $(document).on("mouseover", ".grid-cell", function () {
    const row = parseInt($(this).data("row"));
    const col = parseInt($(this).data("col"));

    // Update selected dimensions
    selectedRows = row;
    selectedCols = col;

    // Update display
    $("#table-dimension-label").text(`${col} x ${row}`);

    // Highlight cells
    $(".grid-cell").removeClass("selected");
    for (let r = 0; r < row; r++) {
      for (let c = 0; c < col; c++) {
        $(`.grid-cell[data-row="${r + 1}"][data-col="${c + 1}"]`).addClass(
          "selected"
        );
      }
    }
  });

  // Close dialog
  $(document).on(
    "click",
    ".close-table-dialog, .table-dialog-overlay",
    function () {
      $("#table-creator-dialog, .table-dialog-overlay").remove();
      // Clean up the event handlers
      $(document).off("mouseover", ".grid-cell");
      $(document).off("click", ".grid-cell");
      $(document).off("click", ".close-table-dialog, .table-dialog-overlay");
      $(document).off("click", "#create-custom-table");
    }
  );

  // Handle cell click to create table
  $(document).on("click", ".grid-cell", function () {
    const questionId = $("#create-custom-table").data("question-id");
    const rows = parseInt($(this).data("row"));
    const cols = parseInt($(this).data("col"));

    createCustomTable(questionId, rows, cols);

    // Close the dialog
    $("#table-creator-dialog, .table-dialog-overlay").remove();
    // Clean up event handlers
    $(document).off("mouseover", ".grid-cell");
    $(document).off("click", ".grid-cell");
    $(document).off("click", ".close-table-dialog, .table-dialog-overlay");
    $(document).off("click", "#create-custom-table");
  });

  // Create table button click
  $(document).on("click", "#create-custom-table", function () {
    if (selectedRows > 0 && selectedCols > 0) {
      const questionId = $(this).data("question-id");
      createCustomTable(questionId, selectedRows, selectedCols);

      // Close the dialog
      $("#table-creator-dialog, .table-dialog-overlay").remove();
      // Clean up event handlers
      $(document).off("mouseover", ".grid-cell");
      $(document).off("click", ".grid-cell");
      $(document).off("click", ".close-table-dialog, .table-dialog-overlay");
      $(document).off("click", "#create-custom-table");
    }
  });
}

// Function to create a custom table - replace with direct row/column inputs
function createCustomTable(questionId, rows, cols) {
  // Determine number of columns based on input data
  const totalCells = rows * cols;
  const numColumns = cols;
  const numRows = rows;

  // Generate table HTML
  let tableHtml =
    '<div class="accountence-table-container">' +
    '<table class="accountence-table">';

  // Create table rows and cells without headers
  for (let r = 1; r <= numRows; r++) {
    tableHtml += "<tr>";
    for (let c = 0; c < numColumns; c++) {
      // Still maintain the cell ID format for compatibility with existing code
      const cellId = String.fromCharCode(65 + c) + r;
      tableHtml += `<td class="editable-cell" data-cell-id="${cellId}">&nbsp;</td>`;
    }
    tableHtml += "</tr>";
  }

  tableHtml += "</table></div>";

  // Check if a table container already exists for this question
  const existingTable = $(
    `#question-${questionId} .accountence-table-container`
  );

  if (existingTable.length) {
    // Replace the existing table
    existingTable.replaceWith(tableHtml);

    // Clear all existing blank answers
    $(`#tab-blanks-container-${questionId}`).empty();
    $(`#tab-blanks-container-${questionId}`).html(`
       <div class="no-blanks-message">
         <i class="fas fa-info-circle"></i>
         <span>No blanks have been added yet. Add [blank] tags in the table cells to create answer fields.</span>
       </div>
     `);

    // Reset the blank count
    updateBlankCount(questionId);

    // Show success message
    toastr.success("Table replaced. Please re-add answer fields as needed.");
  } else {
    const tableContainer = `
      <div class="table-section" id="table-section-${questionId}">
        ${tableHtml}
      </div>
    `;

    // Insert the table container after the editor
    $(`#question-${questionId} .editor-attachment-container`).after(
      tableContainer
    );

    // Add the answer fields section after the table section
    const answerFieldsSection = `
      <div class="answer-fields-section" id="answer-fields-${questionId}">
        <div class="answer-fields-header">
          <i class="fas fa-pen"></i>
          <span>Answer Fields</span>
          <span class="tab-blank-count">0</span>
        </div>
        
        <div class="answer-fields-info">
          <div>
            <i class="fas fa-info-circle"></i>
            <span>Add blanks in the editor using [blank] tags. Each blank added in the table will appear here for answer configuration.</span>
          </div>
        </div>
        
        <div id="tab-blanks-container-${questionId}" class="tab-blanks-container">
          <div class="no-blanks-message">
            <i class="fas fa-info-circle"></i>
            <span>No blanks have been added yet. Add [blank] tags in the table cells to create answer fields.</span>
          </div>
        </div>
        
      </div>
    `;

    $(`#table-section-${questionId}`).after(answerFieldsSection);

    // Show success message
    toastr.success(
      "Table created successfully. You can now add answer fields."
    );
  }
}

// Add this function to format cell content with special tag styling
function formatCellContent(content) {
  if (!content) return "";

  // Replace &nbsp; with space
  content = content.replace(/&nbsp;/g, " ");

  // Create a temporary div to extract text content
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = content;

  // Check if the content contains indicators
  if (tempDiv.querySelector(".blank-indicator")) {
    return "[blank]";
  }

  if (tempDiv.querySelector(".answer-indicator")) {
    return "[answer]";
  }

  // For non-indicator content, just use the text content
  let plainText = tempDiv.textContent || tempDiv.innerText || "";

  // Strip extra whitespace
  plainText = plainText.trim();

  // Special handling for [blank] and [answer] text markers
  if (plainText.includes("[blank]")) {
    return "[blank]";
  }

  if (plainText.includes("[answer]")) {
    return "[answer]";
  }

  // Return the sanitized content
  return plainText;
}

// Helper function to check if cursor is inside a tag
function isInsideTag(content, cursorPos, tag) {
  // Find all occurrences of the tag
  let startIndex = 0;
  let index;

  while ((index = content.indexOf(tag, startIndex)) !== -1) {
    // Check if cursor is inside this tag instance
    if (cursorPos >= index && cursorPos <= index + tag.length) {
      return true;
    }
    startIndex = index + tag.length;
  }

  return false;
}

// Helper function to find the position of a tag based on cursor position
function findTagPosition(content, cursorPos, tag) {
  // Find all occurrences of the tag
  let startIndex = 0;
  let index;

  while ((index = content.indexOf(tag, startIndex)) !== -1) {
    // Check if cursor is inside this tag instance
    if (cursorPos >= index && cursorPos <= index + tag.length) {
      return index;
    }
    startIndex = index + tag.length;
  }

  return -1;
}

// Updated function to simplify and remove type options
function addBlankAnswerField(questionId, cellRef) {
  // Get the question container
  const $question = $(`#question-${questionId}`);

  // Create a unique ID for this blank field
  const blankId = Date.now();
  const fullBlankId = `tab-blank-${questionId}-${blankId}`;

  // Hide the "no blanks" message
  $(`#answer-fields-${questionId} .no-blanks-message`).hide();

  // Create the blank answer HTML with a more visible and structured display
  const blankHtml = `
    <div class="blank-item" id="blank-${fullBlankId}" data-blank-id="${fullBlankId}" data-cell-ref="${cellRef}">
      <div class="blank-header">
        <div class="cell-reference-container">
          <span class="cell-tag">Cell</span>
          <div class="cell-reference">${cellRef}</div>
        </div>
        <div class="blank-actions">
          <button class="edit-blank-btn" data-question-id="${questionId}" data-cell-ref="${cellRef}" data-blank-id="${fullBlankId}" title="Edit answers">
            <i class="fas fa-edit"></i>
          </button>
          <button class="remove-table-blank-btn" data-question-id="${questionId}" data-cell-ref="${cellRef}" data-blank-id="${fullBlankId}" title="Remove this answer field">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="blank-content">
        <div class="answers-display">
          <div class="answer-value default-answer">
            <i class="fas fa-info-circle"></i> No answer provided yet - click Edit to add answers
          </div>
        </div>
      </div>
    </div>
  `;

  // Add the blank to the container
  $(`#tab-blanks-container-${questionId}`).append(blankHtml);

  // Update the blank count
  updateBlankCount(questionId);

  // Initialize an empty answers array and save it
  const $blank = $(`#blank-${fullBlankId}`);
  $blank.data("answers", []);
  $blank.attr("data-answers", JSON.stringify([]));
}

// Function to open the answer field dialog with improved styling
function editBlankAnswer(questionId, cellRef, blankId) {
  // Remove any existing answer field dialogs to prevent duplicates
  $("#answer-field-dialog").remove();

  // Find the relevant blank
  const $blank = $(`.blank-item[data-blank-id="${blankId}"]`);

  // Check if blank exists
  if (!$blank.length) {
    toastr.error("This answer field no longer exists.");
    return;
  }

  // Find the cell
  const $cell = $(`.accountence-table td[data-cell-id="${cellRef}"]`);
  if (!$cell.length) {
    toastr.error("The cell for this answer field cannot be found.");
    return;
  }

  // Get existing answers - try both data and attr methods to ensure we get the data
  let existingAnswers = $blank.data("answers") || [];

  // If no answers found via data(), try getting from attribute
  if (!existingAnswers || existingAnswers.length === 0) {
    try {
      const answersAttr = $blank.attr("data-answers");
      if (answersAttr) {
        existingAnswers = JSON.parse(answersAttr);
      }
    } catch (e) {
      console.error("Error parsing answers from attribute:", e);
      existingAnswers = [];
    }
  }

  const primaryAnswer =
    existingAnswers.length > 0 ? existingAnswers[0]?.value || "" : "";
  let alternativeHtml = "";

  // Generate HTML for alternative answers (starting from index 1)
  for (let i = 1; i < existingAnswers.length; i++) {
    if (existingAnswers[i] && existingAnswers[i].value) {
      alternativeHtml += `
        <div class="alternative-input-group">
          <input type="text" class="alternative-answer" value="${existingAnswers[i].value}">
          <button class="remove-alternative-btn" title="Remove this alternative answer">×</button>
        </div>
      `;
    }
  }

  // Create the dialog with improved styling
  const dialog = `
  <div class="cell-editor-popup" id="answer-field-dialog" >
    <div class="cell-editor-popup-wrapper">
      <div class="cell-editor-header">
        <div class="cell-editor-title">
          <i class="fas fa-pen-alt"></i> 
          Edit Answer for Cell ${cellRef}
        </div>
        <button class="close-answer-field-dialog" title="Close without saving">&times;</button>
      </div>
      <div class="cell-input-container">
        <div class="field-row">
          <label for="answer-value">Primary Answer:</label>
          <input type="text" id="answer-value" class="primary-answer-input" placeholder="Enter the correct answer" value="${primaryAnswer}">
        </div>
        
        <div class="alternative-answers-header">
          <h4>Alternative Correct Answers</h4>
          <p class="alternatives-hint">Add multiple acceptable answers that will be marked as correct</p>
        </div>
        
        <div id="alternative-answers-container">
          ${alternativeHtml}
        </div>
        
        <button type="button" class="add-alternative-btn">
          <i class="fas fa-plus"></i> Add Alternative Answer
        </button>
      </div>
      <div class="cell-editor-actions">
        <button type="button" class="save-answer-field" data-blank-id="${blankId}" data-cell-ref="${cellRef}" data-question-id="${questionId}">
          <i class="fas fa-save"></i> Save Answers
        </button>
      </div>
    </div>
    </div>
  `;

  // Add to the DOM and show
  $("body").append(dialog);
  $("#answer-field-dialog").fadeIn(300);

  // Focus the primary answer field
  $("#answer-value").focus();
}

function updateBlankCount(questionId) {
  const count = $(`#tab-blanks-container-${questionId}`).children(
    ".blank-item"
  ).length;
  $(`#answer-fields-${questionId}`).find(".tab-blank-count").text(count);
}

// Function to handle styling and processing for [blank] tags
function processBlankCell(cell, questionId) {
  const $cell = $(cell);
  const cellId = $cell.data("cell-id");

  // If cell already has a styled [blank] or [answer], don't process again
  if (
    $cell.find(".blank-indicator").length ||
    $cell.find(".answer-indicator").length
  ) {
    return;
  }

  const cellContent = $cell.html().trim();
  const cellText = $cell.text().trim();

  // Check for [blank] in various forms
  if (
    cellText === "[blank]" ||
    cellContent === "[blank]" ||
    (cellContent.includes("[blank]") && !$cell.find(".blank-indicator").length)
  ) {
    // Style the cell properly with our CSS class
    $cell.addClass("blank-cell");
    $cell.html('<span class="blank-indicator">[blank]</span>');

    // Create an answer field if it doesn't exist yet
    const existingBlank = $(`[data-cell-ref="${cellId}"]`);
    if (existingBlank.length === 0) {
      addBlankAnswerField(questionId, cellId);
    }

    return true;
  }

  // Also check for [answer] indicators
  if (
    cellText.includes("[answer]") ||
    cellContent.includes("[answer]") ||
    cellContent.includes("answer-indicator")
  ) {
    // Style cell with answer indicator
    $cell.addClass("blank-cell");
    $cell.html(
      '<span class="answer-indicator"><i class="fas fa-check-circle"></i> [answer]</span>'
    );

    // Create an answer field if it doesn't exist yet
    const existingBlank = $(`[data-cell-ref="${cellId}"]`);
    if (existingBlank.length === 0) {
      addBlankAnswerField(questionId, cellId);
    }

    return true;
  }

  return false;
}

// Function to ensure we have column labels for the table
function getTableColumnLabels(questionId) {
  // Get the table
  const $table = $(`#question-${questionId} .accountence-table`);

  // If no table, return empty array
  if ($table.length === 0) {
    return [];
  }

  // Find the first row of the table and count cells
  const firstRow = $table.find("tbody tr:first-child");
  const cellCount = firstRow.find("td").length;

  // Generate column labels: A, B, C, etc.
  return Array.from({ length: cellCount }, (_, i) =>
    String.fromCharCode(65 + i)
  );
}

// Function to build a complete and well-structured table object
function buildTableObject(questionId) {
  const $table = $(`#question-${questionId} .accountence-table`);

  // Handle the case where table doesn't exist
  if ($table.length === 0) {
    return {
      rows: 0,
      columns: 0,
      cells: [],
    };
  }

  const cells = [];
  let rowCount = 0;
  let columnCount = 0;

  // Iterate over each row to extract cell data in order
  $table.find("tbody tr").each(function (rowIndex) {
    rowCount++;
    const $dataCells = $(this).find("td.editable-cell");

    // Skip if no data cells in this row
    if ($dataCells.length === 0) {
      return;
    }

    // Update column count (use the max in case rows have different cell counts)
    columnCount = Math.max(columnCount, $dataCells.length);

    // Get all cells in the row
    $dataCells.each(function (cellIndex) {
      const hasBlank =
        $(this).find(".blank-indicator").length > 0 ||
        $(this).text().includes("[blank]") ||
        $(this).hasClass("blank-cell");

      const cellValue = hasBlank
        ? "[blank]"
        : $(this)
          .text()
          .replace(/\[blank\]/g, "")
          .trim();

      // Add cell to the cells array with just the value property
      cells.push({
        value: cellValue,
      });
    });
  });

  // Return the table object with rows and columns as single numbers
  return {
    rows: rowCount,
    columns: columnCount,
    cells: cells,
  };
}

// Student Response Tool Functions
function getQuestionResponseTool(questionCount) {
  const questionElement = $(`#question-${questionCount}`);
  if (questionElement.length) {
    const selectedTool = questionElement.attr("data-response-tool");
    const responseToolObject = {
      "digital-writing": false,
      "scan-and-edit": false,
      "webcam-capture": false,
      "audio-response": false,
    };

    // Set the selected tool to true
    if (selectedTool === "digital-writing") {
      responseToolObject["digital-writing"] = true;
    } else if (selectedTool === "qr-upload") {
      responseToolObject["scan-and-edit"] = true;
    } else if (selectedTool === "webcam-capture") {
      responseToolObject["webcam-capture"] = true;
    } else if (selectedTool === "audio-response") {
      responseToolObject["audio-response"] = true;
    }

    return selectedTool ? responseToolObject : null;
  }
  return null;
}

// Function to show iframe modal
function showItemTypeGuideModal() {
  // Create modal HTML with iframe
  const modalHtml = `
    <div id="item-type-guide-modal" class="item-type-guide-modal">
      <div class="item-type-guide-modal-content">
        <div class="item-type-guide-modal-header">
          <h3>Question Type Guide</h3>
          <button class="close-item-type-guide" id="close-item-type-guide">&times;</button>
        </div>
        <div class="item-type-guide-modal-body">
          <iframe src="../../document/item-type-guide.html" id="item-type-guide-iframe"></iframe>
        </div>
      </div>
    </div>
  `;

  // Add modal to body if it doesn't exist
  if (!$('#item-type-guide-modal').length) {
    $('body').append(modalHtml);
  }

  // Show modal
  $('#item-type-guide-modal').fadeIn();

  // Close modal handlers
  $('#close-item-type-guide, #item-type-guide-modal').on('click', function (e) {
    if (e.target.id === 'item-type-guide-modal' || e.target.id === 'close-item-type-guide') {
      $('#item-type-guide-modal').fadeOut();
    }
  });
}

function showWirisLoader($questionHeader) {
  $questionHeader.find(".wiris-editor-loader").remove();

  const loaderHtml = `
    <div class="wiris-editor-loader show">
      <div class="wiris-dots-loader">
        <div class="wiris-dot"></div>
        <div class="wiris-dot"></div>
        <div class="wiris-dot"></div>
      </div>
      <div class="loader-text">Securely fetching question</div>
    </div>
  `;

  $questionHeader.append(loaderHtml);
}

function hideWirisLoader($questionHeader) {
  const $loader = $questionHeader.find(".wiris-editor-loader");
  if ($questionHeader.data("loadingInterval")) {
    clearInterval($questionHeader.data("loadingInterval"));
    $questionHeader.removeData("loadingInterval");
  }

  if ($loader.length) {
    $loader.fadeOut(300, function () {
      $(this).remove();
    });
  }
}