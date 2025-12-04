$(document).ready(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email");
  const examId = urlParams.get("examId");
  fetchStudentAnamolys();
  $("#student-email").text(email);

  // Add click handlers for PDF export buttons
  $("#export-pdf-english").on("click", function () {
    exportToPdf("ltr");
  });

  $("#export-pdf-arabic").on("click", function () {
    exportToPdf("rtl");
  });

  // Add click handler for digital ink view button
  $(document).on("click", ".btn-view-digital-ink", function () {
    const questionNumber = $(this).data("question-number");
    const digitalInkData = $(this).data("digital-ink");
    showDigitalInkModal(questionNumber, digitalInkData);
  });

  //Show the correct or incorrect icon and class depending on answer correctness, selection, and question type.
  function answerValidationHighlighter({
    isCorrect,
    questionType,
    isSelected,
    isAttend,
  } = {}) {
    let typeArray = ["MCQ", "TF"];
    let optionClass = "";
    let iconHtml = "";
    if (isAttend) return {};
    if (isCorrect) {
      optionClass = "correct";
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>`;
    } else if (isSelected && typeArray.includes(questionType)) {
      optionClass = "selected";
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M16.192 6.344L11.949 10.586 7.707 6.344 6.293 7.758 10.535 12 6.293 16.242 7.707 17.656 11.949 13.414 16.192 17.656 17.606 16.242 13.364 12 17.606 7.758z"></path></svg>`;
    } else if (!typeArray.includes(questionType)) {
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M16.192 6.344L11.949 10.586 7.707 6.344 6.293 7.758 10.535 12 6.293 16.242 7.707 17.656 11.949 13.414 16.192 17.656 17.606 16.242 13.364 12 17.606 7.758z"></path></svg>`;
    }
    return { optionClass, iconHtml };
  }

  function createQuestionsCard(question, questionType) {
    const responseClass = question.studentResponse?.isCorrect
      ? "correct"
      : "incorrect";

    // Create question number display like Q1, Q2, etc.
    const questionNum = `Q${question.number}`;
    // Handle different question types
    let studentResponseHtml = "";
    let ftbQuestion = question.text.replace(/<\/?p>/g, "");
    let mtfQuestion;
    // Check if question has digital ink data
    const hasDigitalInk = question?.studentDigitalInk && question?.studentDigitalInk?.length > 0;

    // isAttend is true when question is NOT attended (confusing variable name)
    let isAttend = (question?.answer  === "Not answered" || question.studentResponse?.answer === "Not answered" ||
      question.studentResponse?.text === "Not answered" ||
      question?.studentBlanks?.length === 0 ||
      question.studentResponse?.length === 0) && !hasDigitalInk


    if (questionType === "MCQ") {
      // For MCQ, we'll render all the options
      if (question.choices && question.choices.length > 0) {
        studentResponseHtml = `
          <div class="mcq-options">
            ${question.choices
              .map((choice) => {
                const isSelected =
                  choice.key === question.studentResponse.answer;
                const isCorrect =
                  question.correctChoices &&
                  question.correctChoices.includes(choice.key);

                let { optionClass = "", iconHtml = "" } =
                  answerValidationHighlighter({
                    isCorrect,
                    questionType,
                    isSelected,
                  });

                return `
                <div class="mcq-option ${optionClass} d-flex justify-content-between">
                <div>
                  <span class="mcq-option-label">${
                    choice.key
                  }) ${choice.label.replace(/<\/?p>/g, "")}</span>
                 ${iconHtml}
                  </div>
                   <div class="mx-4 ${
                     optionClass === "correct" ? "text-success" : "text-danger"
                   }">${isSelected ? "STUDENT RESPONSE" : ""}</div>
                </div>
              `;
              })
              .join("")}
          </div>
        `;
      } else {
        // Fallback if no choices are available
        studentResponseHtml = `<div class="student-response-text ${responseClass}">
          ${
            question.studentResponse.text ||
            question.studentResponse.answer ||
            "Not answered"
          }
        </div>`;
      }
    } else if (questionType === "TF") {
      if (question.choices && question.choices.length > 0) {
        studentResponseHtml = `
          <div class="mcq-options">
            ${question.choices
              .map((choice) => {
                const isSelected =
                  choice.key === question.studentResponse.answer;
                const isCorrect =
                  question.correctChoices &&
                  question.correctChoices.includes(choice.key);

                let { optionClass = "", iconHtml = "" } =
                  answerValidationHighlighter({
                    isCorrect,
                    questionType,
                    isSelected,
                  });

                return `
                <div class="mcq-option ${optionClass} d-flex justify-content-between">
                <div>
                  <span class="mcq-option-label"> ${choice.label.replace(
                    /<\/?p>/g,
                    ""
                  )}</span>
                  ${iconHtml}
                  </div>
                  <div class="mx-4 ${
                    optionClass === "correct" ? "text-success" : "text-danger"
                  }">${isSelected ? "STUDENT RESPONSE" : ""}</div>
                </div>
              `;
              })
              .join("")}
          </div>
        `;
      } else {
        // Fallback if no choices are available
        studentResponseHtml = `<div class="student-response-text ${responseClass}">
          ${
            question.studentResponse.text ||
            question.studentResponse.answer ||
            "Not answered"
          }
        </div>`;
      }
    } else if (questionType === "SAQ") {
      // For SAQ questions
      let isCorrect = question?.isAnsweredCorrect;
      let { optionClass = "", iconHtml = "" } = answerValidationHighlighter({
        isCorrect,
        questionType,
        isAttend,
      });

      // Determine the response text
      let responseText = question.studentResponse.text || question.studentResponse.answer;

      // If no text response but has digital ink, show digital ink message
      if ((!responseText || responseText === "Not answered") && hasDigitalInk) {
        responseText = "This question has been answered with Digital Ink";
      } else if (!responseText) {
        responseText = "Not answered";
      }

      studentResponseHtml = `<div class="student-response-saq ${optionClass}">
        ${responseText}${iconHtml}
      </div>`;
    } else if (questionType === "FTB" || questionType === "FIBQ") {
      // Sanitize base text
      let sanitizedText = question.text.replace(/<\/?p>/g, "");
      let ftbAnswer = sanitizedText;
      // Replace each emoji placeholder (like 1️⃣, 2️⃣...) with correct answer
      question.blanks.forEach((blank) => {
        const emoji = parseInt(blank.identity) + "\uFE0F\u20E3";
        const emojiWithUnderScore = parseInt(blank.identity) + "\uFE0F\u20E3" + "_";
        console.log(`Processing blank: ${emoji} with identity ${blank.identity}`);
        const correctValues = blank.values
          .filter((v) => v.isCorrect)
          .map((v) => v.value);

        const displayText =
          correctValues.length > 0
            ? correctValues.join(" | ")
            : "Correct Answer";

        // Important: Update the text after each replacement!
        ftbAnswer = ftbAnswer
        .replaceAll(emojiWithUnderScore,`<span class="ftb-bold">${displayText}</span>`)
        .replaceAll(emoji,`<span class="ftb-bold">${displayText}</span>`); //remove the blanks emoji and replace the correct answer in the aswer key
    sanitizedText = sanitizedText
  .replaceAll(emojiWithUnderScore, `<span class="ftb-bold">________</span>`)
  .replaceAll(emoji, `<span class="ftb-bold">________</span>`);
      });

      // This will be used in question display
      ftbQuestion = sanitizedText;

      // Replace with student response + correctness indicators
      if (question.studentBlanks && question.studentBlanks.length > 0) {
        let studentSanitizedText = question.text.replace(/<\/?p>/g, "");

        question.studentBlanks.forEach((data) => {
          const emoji = parseInt(data.identity) + "\uFE0F\u20E3";
           const emojiWithUnderScore = parseInt(data.identity) + "\uFE0F\u20E3" + "_";
          const answer = data.answer || "Not answered";
          const isCorrect = checkBlankCorrectness(data, question.blanks);
          let { optionClass = "", iconHtml = "" } = answerValidationHighlighter(
            { isCorrect }
          );
          const icon = isCorrect
            ? `<div class="ftb-correct-icon">${answer}${iconHtml}</div>`
            : `<div class="ftb-incorrect-icon">${answer}${iconHtml}</div>`;

          studentSanitizedText = studentSanitizedText
  .replaceAll(emojiWithUnderScore, icon)
  .replaceAll(emoji, icon);
        });

        studentResponseHtml = `
          <div class="ftb-container">
            ${studentSanitizedText}
          </div>
          <div class="ftb-answer-container">
            <div class="ftb-answer-heading">ANSWER KEY</div>
            <div>
              ${ftbAnswer}
            </div>
          </div>
        `;
      } else {
        studentResponseHtml = `<div class="student-response-text">No responses provided</div>`;
      }
    } else if (questionType === "MTF") {
      // For MTF (Match the Following) questions
      let matchingPairs = [];
      const sanitizedText = question.text.replace(/<\/?p>/g, "");

      // Extract the base question without the numbered placeholders
      let baseQuestion = sanitizedText;

      // Find the position of the first numbered emoji
      let firstEmojiIndex = -1;
      for (let i = 0; i < question.blanks.length; i++) {
        const emoji = parseInt(question.blanks[i].identity) + "\uFE0F\u20E3";
        const emojiIndex = sanitizedText.indexOf(emoji);

        if (
          emojiIndex !== -1 &&
          (firstEmojiIndex === -1 || emojiIndex < firstEmojiIndex)
        ) {
          firstEmojiIndex = emojiIndex;
        }
      }

      // Extract the text before the first emoji as the question prompt
      if (firstEmojiIndex !== -1) {
        baseQuestion = sanitizedText.substring(0, firstEmojiIndex).trim();
      }

      // If no clear base question is found, use a default prompt
      if (!baseQuestion) {
        baseQuestion = "Match the following items:";
      }

      mtfQuestion = baseQuestion;
      // Create the matching cards layout
      let matchingCardsHtml = `
        <div class="mtf-container">
      `;

      // Process each matching item
      question.blanks.forEach((blank) => {
        const emoji = parseInt(blank.identity) + "\uFE0F\u20E3";

        // Enhanced text extraction for MTF items
        // Find the position of the current emoji in the question text
        const emojiIndex = sanitizedText.indexOf(emoji);
        let itemText = "";

        if (emojiIndex !== -1) {
          // Extract text after this emoji, until the next emoji or end of string
          const startPos = emojiIndex + emoji.length;
          let endPos = sanitizedText.length;

          // Look for the next emoji to find where this item's text ends
          for (let i = 0; i < question.blanks.length; i++) {
            const nextEmoji =
              parseInt(question.blanks[i].identity) + "\uFE0F\u20E3";
            const nextEmojiIndex = sanitizedText.indexOf(nextEmoji, startPos);

            if (nextEmojiIndex !== -1 && nextEmojiIndex < endPos) {
              endPos = nextEmojiIndex;
            }
          }

          itemText = sanitizedText.substring(startPos, endPos).trim();
        }

        // Find student's response for this item
        const studentBlank = question.studentBlanks.find(
          (sb) => sb.identity === blank.identity
        );
        const studentAnswer = studentBlank
          ? studentBlank.answer
          : "Not answered";

        // Find correct answer
        const correctAnswer =
          blank.values.find((v) => v.isCorrect)?.value || "";

        // Determine if student's answer is correct
        const isCorrect =
          studentAnswer.toLowerCase() === correctAnswer.toLowerCase();
        let { optionClass = "", iconHtml = "" } = answerValidationHighlighter({
          isCorrect,
        });
        // Create card for this matching pair
        matchingCardsHtml += `
          <div class="mtf-card">
            <div class="mtf-item">
              <div class="mtf-item-number">${blank.identity}</div>
              <div class="mtf-item-text">${itemText}</div>
            </div>
            <div class="mtf-student-answer ${
              isCorrect ? "crt-answer" : "wrg-answer"
            } ">
              <div class="mtf-label">Student Answer</div>
              <div class="mtf-value ${optionClass}">${studentAnswer}
                ${iconHtml}
              </div>
            </div>
            <div class="mtf-correct-answer">
              <div class="mtf-label">Correct Answer</div>
              <div class="mtf-value">${correctAnswer}</div>
            </div>
          </div>
        `;
      });

      matchingCardsHtml += `
        </div>
      `;

      studentResponseHtml = matchingCardsHtml;
    } else if (questionType === "OR") {
      let studentOrder = "";
      let correctOrder = "";

      question.correctOrder.forEach((data, i) => {
        const check =
          toLowerCase(question.studentResponse[i]) == toLowerCase(data);
        const answerClass = check
          ? "mcq-option correct "
          : "response-option student-response ";
        correctOrder += `<div class="or-data-table">${data}</div>`;
        studentOrder += `<div class="or-data-table ${answerClass}">${
          question?.studentResponse?.[i] != null &&
          question.studentResponse[i] !== ""
            ? question.studentResponse[i]
            : "Not Answered"
        }
</div>`;
      });

      studentResponseHtml += `
    <div class="or-container">
        <div class="or-response-container">
            <strong>Correct Order:</strong>
            ${correctOrder}
        </div>
          <div class="or-response-container ">
            <strong>Student Response:</strong>
            ${studentOrder}
        </div>
    </div>`;
    } else if (questionType === "IR" || questionType === "UD") {
      let fileHtml = "";
      let answerText = question.answer || "";

      // Check if there are files to display
      if (question.studentResponse && question.studentResponse.length > 0) {
        question.studentResponse.forEach((file, i) => {
          const fileExt = file.url.split(".").pop().toLowerCase();

          if (fileExt === "pdf") {
            fileHtml += `
          <div id="pdf-${question.number}-${i}" class="pdf-box">
            <div class="loading">Loading PDF...</div>
          </div>
        `;
          } else {
            fileHtml += `
          <img
            id="image-${question.number}-${i}"
            data-original-src="${file.url}"
            class="ir-image"
            alt="${file.name || `Image ${i + 1}`}"
          />
        `;
          }
        });
      }

      // If no files and no answer text but has digital ink, show digital ink message
      if ((!fileHtml && (!answerText || answerText === "Not answered")) && hasDigitalInk) {
        answerText = "This question has been answered with Digital Ink";
      } else if (!fileHtml && (!answerText || answerText === "Not answered")) {
        answerText = "Not answered";
      }

      studentResponseHtml = `
    <div>${answerText}</div>
    ${fileHtml ? `
    <div class="file-container file-container-${question.number}">
      <div class="image-wrapper">${fileHtml}</div>
      <div class="show-more-btn-wrapper">
        <button class="show-more-loader-btn ${!(question.studentResponse.length>1)?"no-more-file":""}" data-question="${
          question.number
        }">${!(question.studentResponse.length>1)?"No more files":"Show more"}</button>
      </div>
    </div>
    ` : ''}
  `;

      // ✅ Store question and load state together
      questionState[question.number] = {
        question: question,
        nextIndex: 1,
      };

      // ✅ Load first file
      setTimeout(() => {
        const questionNum = question.number;
        const $container = $(`.file-container-${questionNum}`);
        const firstFile = question.studentResponse[0];
        if (!firstFile) return;

        const ext = firstFile.url.split(".").pop().toLowerCase();

        if (ext === "pdf") {
          const $pdfBox = $container.find(`#pdf-${questionNum}-0`);
          getSignedUrl(firstFile.url, null, {
            appendPDF: (signedUrl) => {
              $pdfBox.find(".loading").remove();
              $pdfBox.append(
                `<embed src="${signedUrl}" type="application/pdf" />`
              );
              $pdfBox.show();
            },
            onError: () => {
              $pdfBox.find(".loading").remove();
              $pdfBox.append(`<div class="error">Failed to load PDF</div>`);
            },
          });
        } else {
          const $img = $container.find(`#image-${questionNum}-0`);
          if ($img.length) {
            getSignedUrl(firstFile.url, $img, $container);
          }
        }
      }, 0);
    } else if (questionType === "PRQ") {
      let isCorrect = question?.isAnsweredCorrect;
      let { optionClass = "", iconHtml = "" } = answerValidationHighlighter({
        isCorrect,
        questionType,
        isAttend,
      });

      let displayCode = question?.answer || "";

      // If no text response but has digital ink, show digital ink message
      if ((!displayCode || displayCode === "Not answered") && hasDigitalInk) {
        displayCode = "This question has been answered with Digital Ink";
        studentResponseHtml = `<div class="student-response-prq ${optionClass}">${displayCode}${iconHtml}</div>`;
      } else {
        let escapedCode = escapeHtml(displayCode);
        studentResponseHtml = `<div class="student-response-prq ${optionClass}"> <pre>${escapedCode}</pre>${iconHtml}</div>`;
      }
    } else if (questionType === "TAB") {
      let numRows = question?.table[0]?.rows;
      let numColumns = question?.table[0]?.columns;
      let tableHtml =
        '<div class="tab-accountence-table-container"><table class="tab-accountence-table">';
      let tabAnswerHtml = '<table class="tab-accountence-table">';

      for (let r = 1; r <= numRows; r++) {
        let count = (r - 1) * numColumns;
        tableHtml += "<tr>";
        tabAnswerHtml += "<tr>";

        for (let c = 0; c < numColumns; c++) {
          const cellId = String.fromCharCode(65 + c) + r;
          const result = question?.blanks?.find(
            (item) => item.identity === cellId
          );
          const value = result?.values?.[0]?.value ?? "";
          const studentResponse = question?.studentResponse?.find(
            (item) => item.identity === cellId
          );
          const studentResponseValue = studentResponse?.answer ?? "";
          const cellData = question?.table[0]?.cells[count + c].value;

          if (cellData === "[blank]") {
            const isCorrect =
              toLowerCase(studentResponseValue) === toLowerCase(value);
            const cellClass = isCorrect
              ? "prevtab-correct-answer"
              : "prevtab-wrong-answer";
            tableHtml += `<td class="editable-cell ${cellClass}">${studentResponseValue}</td>`;
            tabAnswerHtml += `<td class="editable-cell">${value}</td>`;
          } else {
            tableHtml += `<td class="editable-cell">&nbsp;${cellData}</td>`;
            tabAnswerHtml += `<td class="editable-cell">&nbsp;${cellData}</td>`;
          }
        }

        tableHtml += "</tr>";
        tabAnswerHtml += "</tr>";
      }

      tableHtml += "</table></div>";
      tabAnswerHtml += "</table>";

      studentResponseHtml += `
  <div class="ftb-container">
    ${tableHtml}
  </div>
  <div class="ftb-answer-container">
    <div class="ftb-answer-heading">ANSWER KEY</div>
    <div>
      ${tabAnswerHtml}
    </div>
  </div>`;

      //  studentResponseHtml += `<div class = "tab-answer-container">${tableHtml}</div>`
    }

    // Sanitize question text

    let questionText;
    if (questionType === "FTB") {
      questionText = ftbQuestion;
    } else if (questionType === "MTF") {
      questionText = mtfQuestion;
    } else {
      questionText = question.text.replace(/<\/?p>/g, "");
    }

    // Handle captures for all question types
    let capturesHtml = "";
    if (question.captures && question.captures.length > 0) {
      capturesHtml = `
        <div class="saq-captures-section">
          <button class="saq-view-captures-btn" data-question-number="${
            question.number
          }" data-captures='${JSON.stringify(question.captures)}'>
            <i class="fas fa-images"></i>
            <span>View Captures</span>
          </button>
        </div>
      `;
    }

    return `
      <div class="mcq-card" data-id="${questionType}">
        <div class="fixed-question">
          <div class="question-number">${questionNum}</div>
          <div class="question-text">${questionText}</div>
      <div>
  ${
    isAttend
      ? '<span class="unattempted-status"><i class="fas fa-minus-circle"></i> Not Attempted</span>'
      : `<span class="question-mark">Mark : <span class="${
          question?.isAnsweredCorrect ? "mark-correct" : "mark-incorrect"
        }">${question?.isAnsweredCorrect ? question?.questionMark : 0}/${
          question?.questionTotalMark
        }</span></span>`
  }
</div>
        </div>
        
        <div class="student-response-section">
          <div class="student-response-label">ANSWER</div>
          <div class="student-response-content">
            ${studentResponseHtml}
            ${hasDigitalInk ? `
              <div class="digital-ink-section">
                <button class="btn-view-digital-ink" data-question-number="${question.number}" data-digital-ink='${JSON.stringify(question.studentDigitalInk)}'>
                  <i class="fas fa-eye"></i> View Digital Ink
                </button>
              </div>
            ` : ''}
          </div>
          ${capturesHtml}
        </div>
      </div>
    `;
  }


  // Helper function to get the purpose of a blank (e.g., "for minerals", "for respiration")
  function getBlankPurpose(identity) {
    const purposes = {
      1: "minerals",
      2: "respiration",
    };
    return purposes[identity] || "";
  }

  // Helper function to check if a blank was answered correctly
  function checkBlankCorrectness(studentBlank, questionBlanks) {
    if (!questionBlanks || !studentBlank || !studentBlank.identity)
      return false;

    const matchingBlank = questionBlanks.find(
      (b) => b.identity === studentBlank.identity
    );
    if (!matchingBlank || !matchingBlank.values) return false;

    // Check if the student's answer matches any of the correct values (without case sensitivity)
    return matchingBlank.values.some(
      (v) =>
        v.isCorrect &&
        toLowerCase(v.value) === (toLowerCase(studentBlank.answer) || "")
    );
  }

  function fetchStudentAnamolys() {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get("examId");
    const email = urlParams.get("email");

    const url = `${REPORT_END_POINT}?entranceExamId=${examId}&canPaginate=false&mail=${encodeURIComponent(
      email
    )}`;

    makeApiCall({
      url: url,
      method: "GET",
      successCallback: function (response) {
        if (response.message === "Retrieved successfully") {
          const studentData = response?.data?.data[0];
          const questions = studentData?.questions;
          const settings = response?.data?.settings;
          const mcqGrid = $(".mcq-grid");
          mcqGrid.empty();

          // Calculate percentage and pass/fail status
          const totalMarks = response?.data?.totalMarks || 100;
          const achievedMarks = studentData?.totalAchievedMarks || 0;
          const percentage =
            totalMarks > 0 ? Math.round((achievedMarks / totalMarks) * 100) : 0;
          const cutoff = settings?.cutoff || 50;
          const isPassed = percentage >= cutoff;

          // Update the stats in the UI
          $("#total-questions").text(response?.data?.questionsCount || 0);
          $("#total-answered").text(studentData?.attended || 0);
          $("#total-correct").text(studentData?.correct || 0);
          $("#total-incorrect").text(studentData?.incorrect || 0);

          // Add new stats
          $("#achieved-marks").text(`${achievedMarks}/${totalMarks}`);
          $("#percentage").text(`${percentage}%`);
          $("#cutoff-value").text(`${cutoff}%`);
          $("#pass-status").text(isPassed ? "PASS" : "FAIL");
          $("#pass-status")
            .removeClass("pass fail")
            .addClass(isPassed ? "pass" : "fail");

          // Update exam status
          const examStatus = response?.data?.data[0]?.status?.exam;
          const statusBadge = $("#exam-status");
          const examName = $("#exam-name");

          examName.text(response?.data?.examName || "Exam");
          statusBadge.text(
            examStatus === "ENDED"
              ? "Ended"
              : examStatus === "ON_GOING"
              ? "On Going"
              : "Not Started"
          );
          statusBadge
            .removeClass("ended on_going not_started")
            .addClass(
              examStatus === "ENDED"
                ? "ended"
                : examStatus === "ON_GOING"
                ? "on_going"
                : "not_started"
            );
          questions?.forEach((questionData, index) => {
            
            if (questionData?.question?.type === "MCQ") {
              const mcqQuestion = {
                number: index + 1,
                text: questionData?.question?.question,
                choices: questionData?.question?.choices,
                correctChoices: questionData?.question?.correctChoices,
                captures: questionData?.captures || [],
                isAnsweredCorrect: questionData?.isAnsweredCorrect,
                marks: questionData?.question?.marks,
                studentResponse: {
                  isCorrect: questionData?.question?.correctChoices?.includes(
                    questionData?.studentResponse
                  ),
                  answer: questionData.studentResponse || "Not answered",
                  text:
                    questionData?.question?.choices?.find(
                      (c) => c.key === questionData?.studentResponse
                    )?.label || "",
                },
                questionTotalMark:questionData?.question?.marks,
                questionMark:
                  questionData?.awardedMarks ?? questionData?.question?.marks,
              };
              mcqGrid.append(createQuestionsCard(mcqQuestion, "MCQ"));
            } else if (questionData?.question?.type === "SAQ") {
              const saqQuestion = {
                number: index + 1,
                text: questionData?.question?.question,
                isAnsweredCorrect: questionData?.isAnsweredCorrect,
                marks: questionData?.question?.marks,
                studentResponse: {
                  answer: "",
                  text: questionData?.studentResponse || "Not answered",
                },
                captures: questionData?.captures || [],
                questionTotalMark:questionData?.question?.marks,
                questionMark:
                  questionData?.awardedMarks ?? questionData?.question?.marks,
                studentDigitalInk: questionData?.studentDigitalInk || [],
              };
              mcqGrid.append(createQuestionsCard(saqQuestion, "SAQ"));
            } else if (questionData?.question?.type === "FTB") {
              const ftbQuestion = {
                number: index + 1,
                text: questionData?.question?.question,
                blanks: questionData?.question?.blanks,
                captures: questionData?.captures || [],
                studentBlanks: questionData?.studentBlanks || [],
                isAnsweredCorrect: questionData?.isAnsweredCorrect,
                questionMark:questionData?.awardedMarks ?? questionData?.question?.marks,
                questionTotalMark:questionData?.question?.marks

              };
              mcqGrid.append(createQuestionsCard(ftbQuestion, "FTB"));
            } else if (questionData?.question?.type === "TF") {
              const tfQuestion = {
                number: index + 1,
                text: questionData?.question?.question,
                correctChoices: questionData?.question?.correctChoices,
                captures: questionData?.captures || [],
                isAnsweredCorrect: questionData?.isAnsweredCorrect,
                marks: questionData?.question?.marks,
                choices: [
                  { key: "true", label: "True" },
                  { key: "false", label: "False" },
                ],
                studentResponse: {
                  isCorrect: questionData?.question?.correctChoices?.includes(
                    questionData?.studentResponse
                  ),
                  answer: questionData.studentResponse || "Not answered",
                  text:
                    questionData?.question?.choices?.find(
                      (c) => c.key === questionData?.studentResponse
                    )?.label || "",
                },
                questionTotalMark:questionData?.question?.marks,
                questionMark:
                  questionData?.awardedMarks ?? questionData?.question?.marks,
              };

              mcqGrid.append(createQuestionsCard(tfQuestion, "TF"));
            } else if (questionData?.question?.type === "MTF") {
              const mtfQuestion = {
                number: index + 1,
                text: questionData?.question?.question,
                blanks: questionData?.question?.blanks,
                captures: questionData?.captures || [],
                studentBlanks: questionData?.studentBlanks || [],
                isAnsweredCorrect: questionData?.isAnsweredCorrect,
                questionTotalMark:questionData?.question?.marks,
                questionMark:
                  questionData?.awardedMarks ?? questionData?.question?.marks,
              };
              mcqGrid.append(createQuestionsCard(mtfQuestion, "MTF"));
            } else if (questionData?.question?.type === "OR") {
              const orQuestion = {
                number: index + 1,
                text: questionData?.question?.question,
                correctOrder: questionData?.question?.correctOrder,
                captures: questionData?.captures || [],
                studentResponse: questionData?.studentResponse || [],
                isAnsweredCorrect: questionData?.isAnsweredCorrect,
                questionTotalMark:questionData?.question?.marks,
                questionMark:
                  questionData?.awardedMarks ?? questionData?.question?.marks,
              };
              mcqGrid.append(createQuestionsCard(orQuestion, "OR"));
            } else if (questionData?.question?.type === "IR") {
              const irQuestion = {
                number: index + 1,
                text: questionData?.question?.question,
                captures: questionData?.captures || [],
                studentResponse: questionData?.studentAttachments || [],
                isAnsweredCorrect: questionData?.isAnsweredCorrect,
                marks: questionData?.question?.marks,
                answer: questionData?.studentResponse,
                questionTotalMark:questionData?.question?.marks,
                questionMark: questionData?.awardedMarks ?? questionData?.question?.marks,
                studentDigitalInk: questionData?.studentDigitalInk || [],
              }
              mcqGrid.append(createQuestionsCard(irQuestion, "IR"));
            } else if (questionData?.question?.type === "UD") {
              const udQuestion = {
                number: index + 1,
                text: questionData?.question?.question,
                captures: questionData?.captures || [],
                studentResponse: questionData?.studentAttachments || [],
                marks: questionData?.question?.marks,
                answer: questionData?.studentResponse,
                isAnsweredCorrect: questionData?.isAnsweredCorrect,
                questionTotalMark:questionData?.question?.marks,
                questionMark: questionData?.awardedMarks ?? questionData?.question?.marks,
                studentDigitalInk: questionData?.studentDigitalInk || [],
              }
              mcqGrid.append(createQuestionsCard(udQuestion, "UD"));
            } else if (questionData?.question?.type === "PRQ") {
              const prqQuestion = {
                number: index + 1,
                text: questionData?.question?.question,
                captures: questionData?.captures || [],
                answer: questionData?.studentResponse || "Not answered",
                isAnsweredCorrect: questionData?.isAnsweredCorrect,
                questionTotalMark:questionData?.question?.marks,
                questionMark: questionData?.awardedMarks ?? questionData?.question?.marks,
                studentDigitalInk: questionData?.studentDigitalInk || [],
              }
              mcqGrid.append(createQuestionsCard(prqQuestion, "PRQ"));
            } else if (questionData?.question?.type === "TAB") {
              const tabQuestion = {
                number: index + 1,
                text: questionData?.question?.question,
                blanks: questionData?.question?.blanks,
                table: questionData?.question?.table,
                captures: questionData?.captures || [],
                studentResponse: questionData?.studentBlanks || [],
                isAnsweredCorrect: questionData?.isAnsweredCorrect,
                questionTotalMark:questionData?.question?.marks,
                questionMark:
                  questionData?.awardedMarks ?? questionData?.question?.marks,
              };
              mcqGrid.append(createQuestionsCard(tabQuestion, "TAB"));
            }
          });
        }
      },
      errorCallback: function (error) {
        console.error("Error fetching student anomalies:", error);
      },
    });
  }

  function exportToPdf(direction) {
    showLoader();

    const exportButtons = $(".btn-primary");
    exportButtons.hide();

    const studentEmail = $("#student-email").text();
    const filename = `${studentEmail.replace("@", "_")}_report${
      direction === "rtl" ? "_arabic" : ""
    }.pdf`;

    const contentElement = document.querySelector(".px-4");

    // Store original attributes and styles
    const originalDir = contentElement.getAttribute("dir");
    const originalClass = contentElement.className;
    const originalStyle = contentElement.getAttribute("style") || "";

    // Apply direction for export
    contentElement.setAttribute("dir", direction);
    contentElement.classList.add(direction === "rtl" ? "rtl-text" : "ltr-text");

    // Set explicit width to ensure content spans full page
    contentElement.style.width = "100%";
    contentElement.style.maxWidth = "100%";
    contentElement.style.margin = "0";
    contentElement.style.padding = "10px";
    contentElement.style.boxSizing = "border-box";

    // Apply direction to all question and response elements
    const questionElements = contentElement.querySelectorAll(
      ".question-text, .student-response-text"
    );
    questionElements.forEach((el) => {
      el.setAttribute("dir", direction);
      el.classList.add(direction === "rtl" ? "rtl-text" : "ltr-text");
    });

    // Set explicit width on mcq-grid and mcq-card to ensure proper display
    const mcqGrids = contentElement.querySelectorAll(".mcq-grid");
    const mcqCards = contentElement.querySelectorAll(".mcq-card");

    mcqGrids.forEach((el) => {
      el.style.display = "block";
      el.style.width = "100%";
      el.style.maxWidth = "100%";
    });

    mcqCards.forEach((el) => {
      el.style.width = "100%";
      el.style.maxWidth = "100%";
      el.style.marginBottom = "30px";
      el.style.boxSizing = "border-box";
    });

    const options = {
      margin: [5, 5, 5, 5], // [top, right, bottom, left] in mm
      filename: filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        foreignObjectRendering: true,
        width: contentElement.offsetWidth,
        windowWidth: contentElement.offsetWidth,
        x: 0,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: false,
        hotfixes: ["px_scaling"],
      },
    };

    html2pdf()
      .set(options)
      .from(contentElement)
      .save()
      .then(() => {
        hideLoader();
        // Restore original attributes and styles
        if (originalDir) {
          contentElement.setAttribute("dir", originalDir);
        } else {
          contentElement.removeAttribute("dir");
        }
        contentElement.className = originalClass;
        contentElement.setAttribute("style", originalStyle);

        // Restore original question elements
        questionElements.forEach((el) => {
          el.removeAttribute("dir");
          el.classList.remove("rtl-text", "ltr-text");
        });

        // Reset grid and card styles
        mcqGrids.forEach((el) => {
          el.removeAttribute("style");
        });

        mcqCards.forEach((el) => {
          el.removeAttribute("style");
        });

        exportButtons.show();
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
        hideLoader();

        // Restore original attributes and styles
        if (originalDir) {
          contentElement.setAttribute("dir", originalDir);
        } else {
          contentElement.removeAttribute("dir");
        }
        contentElement.className = originalClass;
        contentElement.setAttribute("style", originalStyle);

        // Restore original question elements
        questionElements.forEach((el) => {
          el.removeAttribute("dir");
          el.classList.remove("rtl-text", "ltr-text");
        });

        // Reset grid and card styles
        mcqGrids.forEach((el) => {
          el.removeAttribute("style");
        });

        mcqCards.forEach((el) => {
          el.removeAttribute("style");
        });

        exportButtons.show();
        alert("Error generating PDF. Please try again.");
      });

    setTimeout(() => {
      // Ensure buttons are shown and attributes are restored even if something goes wrong
      if (originalDir) {
        contentElement.setAttribute("dir", originalDir);
      } else {
        contentElement.removeAttribute("dir");
      }
      contentElement.className = originalClass;
      contentElement.setAttribute("style", originalStyle);

      // Restore original question elements
      questionElements.forEach((el) => {
        el.removeAttribute("dir");
        el.classList.remove("rtl-text", "ltr-text");
      });

      // Reset grid and card styles
      mcqGrids.forEach((el) => {
        el.removeAttribute("style");
      });

      mcqCards.forEach((el) => {
        el.removeAttribute("style");
      });

      exportButtons.show();
    }, 3000);
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

  $(document).on("click", ".saq-view-captures-btn", function () {
    const capturesData = $(this).data("captures");

    if (capturesData && capturesData.length > 0) {
      // Convert captures data to the format expected by image slider
      const captures = capturesData.map((capture) => ({ url: capture.url,type:capture?.meta?.type }));

      // Use centralized image slider with signed URLs
      openImageSliderWithSignedUrls(captures, 0);
    }
  });
  });
