//#region Validation
$(document).on("blur", ".text-answer-group input", function () {
    const container = $(this).closest(".text-answers-container");
  if (
    !$(this).val().trim() &&
    $(this).closest(".text-answer-group").siblings().length > 0
  ) {
    $(this).closest(".text-answer-group").remove();
      updateButtonArrangement(container);
  }
});

//#region Student Response Tool Events
// Handle all response tool options with radio button behavior (only one can be selected per question)
$(document).on("click", ".response-tool-option", function (e) {
  e.preventDefault();

  const option = $(this);
  const radio = option.find('input[type="radio"]');
  const questionContainer = option.closest(".question");
  const questionCount = questionContainer.attr("id").split("-")[1];
  const toolValue = radio.val();
  const toolType = option.attr("data-tool") || toolValue;

  // Check if currently selected (use both classes for compatibility)
  const isCurrentlySelected =
    option.hasClass("selected") || option.hasClass("enabled");

  if (isCurrentlySelected) {
    // Unselect the currently selected tool (clicking same tool again)
    option.removeClass("selected enabled");
    radio.prop("checked", false);
    questionContainer.removeAttr("data-response-tool");

    updateResponseToolInfo(questionCount, null);

    const toolName = toolValue
      .replace("-", " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    displayToast(`${toolName} unselected`, "info");
  } else {
    // First, unselect ALL tools in this question (radio button behavior)
    const allToolsInQuestion = questionContainer.find(".response-tool-option");
    allToolsInQuestion.removeClass("selected enabled");
    allToolsInQuestion.find('input[type="radio"]').prop("checked", false);

    // Then select the clicked tool
    if (toolType === "digital-writing") {
      option.addClass("enabled");
    } else {
      option.addClass("selected");
    }
    radio.prop("checked", true);

    // Store the response tool data (overwrite any existing selection)
    questionContainer.attr("data-response-tool", toolValue);

    updateResponseToolInfo(questionCount, toolValue);

    const toolName = toolValue
      .replace("-", " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    displayToast(`${toolName} selected`, "success");
  }
});

// Prevent info icon clicks from triggering option selection
$(document).on("click", ".response-tool-info", function (e) {
  e.stopPropagation();
});

// Soft delete attachment on click
$(document).on("click", ".remove-attachment-icon", function () {
  const attachmentId = $(this)
    .closest(".attachment-item")
    .data("attachment-id");
  const alternativeId = $(this).closest(".attachment-item").data("question-id");
  const choiceId = $(this).closest(".attachment-item").data("choice-id");
  const panelContainer = $(this).closest(".attachment-main-container");
  const questionId = panelContainer
    .find("#hiddenFileInput")
    .data("question-id");
  const questionCount = panelContainer
    .find("#hiddenFileInput")
    .data("question-count");

  deleteAttachment(
    questionCount,
    questionId || alternativeId,
    attachmentId,
    choiceId
  );
});

$(document).on("click", ".choice-attachment-container", function () {
  $("#choice-attachmentPanel").css("width", "90%");
  $("#blurOverlay").css("display", "block");

  const questionId = $(this)
    .closest(".choice-attachment-sub-main-container")
    .data("question-id");

  const choiceId = $(this)
    .closest(".choice-attachment-sub-main-container")
    .data("choice-id");

  const questionCount = $(this).closest(".question").attr("id").split("-")[1];
  const attachments = $(this)
    .closest(".choice-attachment-sub-main-container")
    .attr("data-attachments");
  let parsedAttachments = [];

  if (attachments) {
    parsedAttachments = JSON.parse(attachments);
  }

  const $attachmentList = $(".choice-attachment-main-container");

  $attachmentList.empty();
  renderChoiceAttachmentsContainer(
    parsedAttachments,
    $attachmentList,
    questionId,
    choiceId,
    questionCount
  );
});

$(document).on("click", ".attachmentBrowseBtn", function () {
  $(this).siblings('input[type="file"]').trigger("click");
});

$(document).on("change", "#hiddenFileInput", function () {
  const file = this.files[0];
  const questionId = $(this).data("question-id");
  const questionCount = $(this).data("question-count");
  const endpointUrl = `${QUESTIONS_END_POINT}/attachment?entranceExamId=${getQueryParameter(
    "id"
  )}${questionId !== "new" ? `&id=${questionId}` : ""}`;

  if (!file) return;

  if (!allowedFileTypes.includes(file.type)) {
    displayToast(
      "Invalid file type. Only image formats (JPEG, PNG,JPG, PDF, MP3) are allowed.",
      "error"
    );
    $(this).val("");
    return;
  }
  $(this).val("");
  const formData = new FormData();
  formData.append("attachment", file);

  makeApiCall({
    url: endpointUrl,
    method: "PUT",
    data: formData,
    successCallback: function (response) {
      $(".no-files").hide();

      const attachment = response.data;
      const encodedAttachment = JSON.stringify(attachment).replace(
        /"/g,
        "&quot;"
      );
      const imageUrl = attachment.url;
      const fileName = attachment.name;
      const fileType = attachment.type;

      let previewHtml = "";
      if (fileType === "image") {
        previewHtml = `<img src="${imageUrl}" alt="${fileName}" onerror="handleImageError(this)"/>
          `;
      } else if (fileType === "application") {
        previewHtml = `
          <div class="attachment-resume">
          <object data="${imageUrl}" type="application/pdf" >
          </object>
      </div>`;
      } else if (fileType === "audio") {
        previewHtml = `

  <audio controls src="${imageUrl}"></audio>
  `;
      }

      // Get the question's attachment container
      const $attachmentContainer = $(`#attachment-container-${questionCount}`);

      // Retrieve and parse the existing attachments from the data-attachments attribute
      let existingAttachments = JSON.parse(
        $attachmentContainer.attr("data-attachments") || "[]"
      );
      console.log(existingAttachments, 134);
      // Push the new attachment data
      existingAttachments.push({
        _id: attachment._id,
        url: imageUrl,
        name: fileName,
        type: fileType,
      });

      // Update the data-attachments attribute with the new array
      $attachmentContainer.attr(
        "data-attachments",
        JSON.stringify(existingAttachments)
      );

      const $countBubble = $attachmentContainer.find(
        ".attachment-count-bubble"
      );
      if ($countBubble.length) {
        $countBubble.text(existingAttachments.length);
      } else {
        $attachmentContainer.append(`
                    <div class="attachment-count-bubble">
                        ${existingAttachments.length}
                    </div>
                `);
      }

      // Generate HTML for the new attachment
      const newAttachmentHtml = `
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

      // Prepend the new attachment to the list
      $(".attachment-list").prepend(newAttachmentHtml);

      // Also update the preview area
      $(`#image-preview`).append(`
                    <div class="attachment-item">
                        <img src="${imageUrl}" alt="Attachment Preview" onerror="handleImageError(this)">
                        <button class="remove-image" data-attachment-id="${attachment._id}">Remove</button>
                    </div>
                `);
    },
    errorCallback: function (error) {
      showLoader(false);
      displayToast(`Error: ${error}`, "error");
    },
  });
});

$(document).on("click", ".attachment-close-btn", function () {
  $("#attachmentPanel").css("width", "0");
  $("#blurOverlay").css("display", "none");
});

$(document).on("click", ".accordion-header", function () {
  const blankAnswer = $(this).closest(".blank-answer");
  blankAnswer.toggleClass("active");

  // Close other accordions when opening one
  if (blankAnswer.hasClass("active")) {
    $(".blank-answer.active").not(blankAnswer);
  }
});

// Toggle blank item accordion
$(document).on("click", ".blank-header, .toggle-blank-btn", function (e) {
  const blankItem = $(this).closest(".blank-item");
  blankItem.toggleClass("active");

  // Stop propagation if clicking on buttons inside header
  if ($(e.target).closest(".edit-blank-btn, .remove-table-blank-btn").length) {
    e.stopPropagation();
  }
});

$(document).on("click", ".add-text-answer-btn", function () {
  const container = $(this).closest(".text-answers-container");
  const newField = $(`
        <div class="text-answer-group">
            <input type="text" class="blank-input text-type" 
                  placeholder="Alternative correct answer">
            <button type="button" class="add-text-answer-btn">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `);
  // limit to max 5 fields
  if (container.children(".text-answer-group").length >= 5) {
    $(this).hide();
    return;
  }
  container.append(newField);
  updateButtonArrangement(container);
});

// Remove answer field and limit to 5
$(document).on("click", ".remove-text-answer-btn", function () {
  const removeGroup = $(this).closest(".text-answer-group");
  const container = $(this).closest(".text-answers-container");
  const siblings = removeGroup.siblings(".text-answer-group");
  siblings
    .first()
    .find(".blank-input")
    .attr("placeholder", "Enter Correct answer");
  removeGroup.remove();
  updateButtonArrangement(container);
});
function updateButtonArrangement(container) {
  container.find(".text-answer-group").each(function () {
    $(this).find("button").remove();
  });

  const totalGroups = container.children(".text-answer-group").length;
  container.find(".text-answer-group").each(function (index) {
    const isLastGroup = index === totalGroups - 1;

    if (totalGroups === 1) {
      $(this).append(`
        <button type="button" class="add-text-answer-btn">
          <i class="fas fa-plus"></i>
        </button>
      `);
    } else if (isLastGroup) {
      // Last group - both add and remove buttons
      $(this).append(`
        <button type="button" class="add-text-answer-btn">
          <i class="fas fa-plus"></i>
        </button>
        <button type="button" class="remove-text-answer-btn">
          <i class="fas fa-times"></i>
        </button>
      `);
    } else {
      // All other groups - only remove button
      $(this).append(`
        <button type="button" class="remove-text-answer-btn">
          <i class="fas fa-times"></i>
        </button>
      `);
    }
  });
}

$(document).on("click", ".remove-blank-btn", function () {
  const questionId = $(this).data("id");
  const blank = $(this).closest(".blank-answer");
  const blankId = blank.data("blank-id").split("-")[2]; // e.g. "2"
  blank.remove();

  const blanksContainer = $(`#blanks-answers-${questionId}`);
  const remainingBlanks = blanksContainer.find(".blank-answer");

  // Capture original indices before updating
  const originalIndices = [];
  remainingBlanks.each(function () {
    const originalId = $(this).data("blank-id").split("-")[2];
    originalIndices.push(originalId);
  });

  // Update IDs and labels
  remainingBlanks.each(function (index) {
    const newBlankId = `blank-${questionId}-${index + 1}`;
    $(this).data("blank-id", newBlankId);
    $(this).attr("data-blank-id", newBlankId);
    $(this).find(".blank-input").attr("data-blank-id", newBlankId);
    $(this).find("label").text(`Answer for Blank ${index + 1}:`);
    $(this).find(".accordion-toggle span").text(`Blank ${index + 1}`);
  });

  // Create a mapping from original indices to new indices
  const indexMap = {};
  originalIndices.forEach((original, idx) => {
    indexMap[original] = idx + 1;
  });

  const editor = $(`#question-text-${questionId}`).data("ckeditorInstance");
  if (editor) {
    let content = editor.getData();

    // ✅ Remove emoji + optional underscore only for deleted blank
    const emojiPattern = new RegExp(`${blankId}\uFE0F\u20E3_?`, "g");
    content = content.replace(emojiPattern, "");

    // ✅ Reindex remaining emojis
    Object.entries(indexMap).forEach(([original, newIndex]) => {
      const originalEmoji = `${original}\uFE0F\u20E3`;
      const newEmoji = `${newIndex}\uFE0F\u20E3`;
      const emojiRegex = new RegExp(originalEmoji, "g");
      content = content.replace(emojiRegex, newEmoji);
    });

    editor.setData(content);
  }

  $(`#blank-count-${questionId}`).text(remainingBlanks.length);
});


$(document).on("click", ".choice-attachment-close-btn", function () {
  $("#choice-attachmentPanel").css("width", "0");
  $("#blurOverlay").css("display", "none");
});

$(document).on("click", ".choice-remove-attachment-icon", function () {
  const attachmentId = $(this)
    .closest(".attachment-item")
    .data("attachment-id");
  const questionId = $(this).closest(".attachment-item").data("question-id");
  const choiceId = $(this).closest(".attachment-item").data("choice-id");

  deleteChoiceAttachment(choiceId, questionId, attachmentId);
});

$(document).on("change", "#choice-hiddenFileInput", function () {
  const file = this.files[0];
  const questionId = $(this).data("question-id");
  const choiceId = $(this).data("choice-id");
  const endpointUrl = `${QUESTIONS_END_POINT}/choice-attachment?entranceExamId=${getQueryParameter(
    "id"
  )}&questionId=${questionId}&id=${choiceId}`;

  if (!file) return;

  if (!allowedFileTypes.includes(file.type)) {
    displayToast(
      "Invalid file type. Only image formats (JPEG, PNG ,JPG, PDF) are allowed.",
      "error"
    );
    $(this).val("");
    return;
  }
  $(this).val("");
  const formData = new FormData();
  formData.append("attachment", file);

  makeApiCall({
    url: endpointUrl,
    method: "PUT",
    data: formData,
    successCallback: function (response) {
      const attachment = response.data;
      const encodedAttachment = JSON.stringify(attachment).replace(
        /"/g,
        "&quot;"
      );
      const imageUrl = attachment.url;
      const fileName = attachment.name;
      const fileType = attachment.type;

      let previewHtml = "";
      if (fileType === "image") {
        previewHtml = `<img src="${imageUrl}" alt="${fileName}" onerror="handleImageError(this)"/>`;
      } else if (fileType === "application") {
        previewHtml = `
            <div class="attachment-resume">
        <object  data="${imageUrl}" type="application/pdf">
  </object>
    
      </div>`;
      } else if (fileType === "audio") {
        previewHtml = `

  <audio controls src="${imageUrl}"></audio>
  `;
      }

      const $choiceContainer = $(
        `.choice-attachment-sub-main-container[data-question-id="${questionId}"][data-choice-id="${choiceId}"]`
      );

      let existingAttachments = JSON.parse(
        $choiceContainer.attr("data-attachments") || "[]"
      );
      console.log;
      existingAttachments.push({
        _id: attachment._id,
        url: imageUrl,
        name: fileName,
        type: fileType,
      });

      $choiceContainer.attr(
        "data-attachments",
        JSON.stringify(existingAttachments)
      );

      const $countBubble = $choiceContainer.find(".attachment-count-bubble");

      if ($countBubble.length) {
        $countBubble.text(existingAttachments.length);
      } else {
        $choiceContainer.find("img").after(`
                        <div class="attachment-count-bubble">
                            ${existingAttachments.length}
                        </div>
                    `);
      }

      const newAttachmentHtml = `
                    <div class="attachment-item" data-attachment-id="${attachment._id
        }" data-question-id="${questionId}" data-choice-id="${choiceId}">
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
                                <span class="file-type">${fileType.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                `;

      // Update the specific choice's attachment list
      $(".choice-attachment-main-container .attachment-list").prepend(
        newAttachmentHtml
      );
      $(".choice-attachment-main-container .no-files").remove();
      const examId = getQueryParameter("id");
      if (!examId) {
        console.error("Missing Entrance examId for attachment");
        return;
      }
      loadQuestions(examId);
    },
    errorCallback: function (error) {
      displayToast(`Error: ${error}`, "error");
    },
  });
});

$(document).on("click", ".open-preview-btn", function () {
  $("#preview-attachmentPanel").css("width", "50%");
  $("#preview-attachment-blurOverlay").css("display", "block");
  const rawData = $(this).attr("data-url");
  const attachment = JSON.parse(rawData);
  if (!attachment) return alert("URL is missing!");
  const imageUrl = attachment.url;
  const fileName = attachment.name || imageUrl.split("/").pop();
  const fileType = attachment.type;
  console.log("preview attachment url", imageUrl);
  let previewHtml = "";

  if (fileType === "image") {
    previewHtml = `<img src="${imageUrl}" alt="${fileName}"/>`;
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
  $(".preview-attachment-main-container").empty().append(previewHtml);
});

$(document).on("click", ".preview-attachment-close-btn", function () {
  $("#preview-attachmentPanel").css("width", "0");
  $("#preview-attachment-blurOverlay").css("display", "none");
});

$(document).on("click", ".remove-question-btn", function () {
  const id = $(this).data("id");

  const $question = $(`#question-${id}`); // Get the full question block
  const markValue =
    parseFloat($question.find(".marks-container input").val()) || 0;
  const shouldEv = $question.find(".shouldEv").prop("checked");

  let oldMarks = parseFloat($(".total-marks-container input").val()) || 0;

  if (shouldEv) {
    oldMarks -= markValue;
  }

  // Remove the question
  $question.remove();
  $(".total-marks-container input").val(oldMarks.toFixed(2));

  updateQuestionNumber();
  // questionCount = $(".question").length;
});

$(document).on("click", ".shouldEv", function () {
  const $checkbox = $(this);
  const $question = $checkbox.closest(".question");
  const $marksInput = $question.find(".marks-container input");

  let markValue = parseFloat($marksInput.val()) || 0;
  const isChecked = $checkbox.prop("checked");

  // Set default mark to 1 if checked and mark is 0
  if (isChecked && markValue === 0) {
    markValue = 1;
    $marksInput.val(markValue);
  }

  // Recalculate total from scratch
  let totalMarks = 0;
  $(".question").each(function () {
    const isChecked = $(this).find(".shouldEv").prop("checked");
    let marks = parseFloat($(this).find(".marks-container input").val()) || 0;
    if (isChecked) {
      totalMarks += marks;
    }
  });

  const formattedTotal = Number.isInteger(totalMarks)
    ? totalMarks.toString()
    : totalMarks.toFixed(2);

  $(".total-marks-container input").val(formattedTotal);
});

$(document).on("focus", ".marks-container input", function () {
  const inputId = $(this).attr("id");
  const questionId = parseInt(inputId.replace("mark", ""));
  oldMarksValues[questionId] = parseInt($(this).val()) || 0;
});

// Handle input in marks fields
$(document).on("input", ".marks-container input", function () {
  const currentInput = $(this)[0];
  let currentValue = currentInput.value;
  const cursorPosition = currentInput.selectionStart;

  // Clean and restrict to two decimal places
  let cleanedValue = currentValue
    .replace(/[^0-9.]/g, "")
    .replace(/\.(?=.*\.)/g, "")
    .replace(/(\.\d{2})\d+/g, "$1");

  if (cleanedValue !== currentValue) {
    const delta = cleanedValue.length - currentValue.length;
    currentInput.value = cleanedValue;
    const newPos = cursorPosition + delta;
    currentInput.setSelectionRange(newPos, newPos);
  }

  const markValue = parseFloat(currentInput.value) || 0;
  const inputId = currentInput.id;
  if (!inputId || !inputId.startsWith("mark")) return;

  const questionId = parseInt(inputId.replace("mark", ""));
  const $question = $(currentInput).closest(".question");
  const shouldEv = $question.find(".shouldEv").prop("checked");

  if (shouldEv) {
    oldMarksValues[questionId] = markValue;
  }

  // ✅ Recalculate total marks from all checked questions
  let newTotalMarks = 0;
  $(".marks-container input").each(function () {
    const $input = $(this);
    const $q = $input.closest(".question");
    const isChecked = $q.find(".shouldEv").prop("checked");

    if (isChecked) {
      const val = parseFloat($input.val()) || 0;
      newTotalMarks += val;
    }
  });

  const formattedTotal = Number.isInteger(newTotalMarks)
    ? newTotalMarks.toString()
    : newTotalMarks.toFixed(2);

  $(".total-marks-container input").val(formattedTotal);
});

$(document).on("click", ".qtntoggle", function () {
  const $question = $(this).closest(".question");
  const $questionHeader = $question;
  const $content = $question.find(".question-content");

  if (!$question.hasClass("editor-initialized")) {
    showWirisLoader($questionHeader);

    setTimeout(() => {
      $question.find("textarea").each(function() {
        applyEditor($(this), 'classic', false);
      });
      $question.addClass("editor-initialized");
    }, 50);
  }

  $content.slideToggle(550, function() {
    hideWirisLoader($questionHeader);
  });
});

$(document).on("click", ".add-choice-btn", function () {
  const $this = $(this);
  $this.prop("disabled", true);

  const id = $this.data("id");
  const choicesContainer = $(`#choices-${id}`);
  const newKey = String.fromCharCode(65 + choicesContainer.children().length);
  choicesContainer.append(createChoiceHtml(null, id, newKey));
  saveQuestionsPeriodically()
  setTimeout(function () {
    applyEditor(`#choices-${id} .choice-editor:last`);
  }, 1000);

  setTimeout(function () {
    $this.prop("disabled", false);
  }, 2000);
});

$(document).on("click", ".advance-setting", function (event) {
  event.stopImmediatePropagation();
  $(this).find(".choice-actions").slideToggle();
});

$(document).on("click", ".remove-choice-btn", function () {
  const $choice = $(this).closest(".choice");
  const $choicesContainer = $choice.parent();

  if ($choicesContainer.children().length > 2) {
    $choice.remove();

    // Reindex remaining choices
    $choicesContainer.children(".choice").each(function (index) {
      const newKey = String.fromCharCode(65 + index); // 65 is ASCII for 'A'
      $(this).find("label").text(newKey);
      $(this).find('input[type="radio"]').val(newKey);
      $(this).attr(
        "id",
        `choice-${newKey}-${$(this).attr("id").split("-")[2]}`
      );
    });
  } else {
    displayToast("At least two choices are required.", "error", 6000);
  }
});

$(document).on("change", ".file-upload", function () {
  const id = $(this).attr("id").split("-")[2];
  const file = this.files[0];

  if (!allowedFileTypes.includes(file.type)) {
    displayToast(
      "Invalid file type. Only image formats (JPEG, PNG, JPG) are allowed.",
      "error"
    );
    $(this).val(""); // Clear the input file
    return;
  }

  $(`#image-preview-${id}`).append(
    "<span class='progress-load'>Uploading in progress ..Please Wait </span>"
  );

  if (file) {
    const formData = new FormData();
    formData.append("attachment", file);
    const endpointUrl = `${EXAM_END_POINT}/attachment?id=${getQueryParameter(
      "id"
    )}`;

    makeApiCall({
      url: endpointUrl,
      method: "POST",
      data: formData,
      successCallback: function (response) {
        const imageUrl = response.data.attachment.url;
        const imagePreviewHtml = `
                        <img src="${imageUrl}" alt="Attachment Preview" onerror="handleImageError(this)">
                        <button class="remove-image" data-id="${id}">Remove Image</button>`;

        $(`#image-preview-${id}`).html(imagePreviewHtml);
        $(`#image-preview-${id}`).find(".progress-load").remove();
      },
      errorCallback: function (error) {
        displayToast(`Error: ${error}`, "error");
      },
    });
  }
});

// Update the answer type change handler to preserve values
$(document).on("change", ".answer-type", function () {
  const blankId = $(this).data("blank-id");
  const answerType = $(this).val();
  const container = $(this)
    .closest(".blank-answer")
    .find(".answer-input-container");
  const previousAnswers = [];

  // Collect existing values before replacing
  if (answerType === "text") {
    // Switching from dropdown to text - get first correct answer if exists
    const correctOption = container
      .find(".correct-option:checked")
      .closest(".option-item");
    if (correctOption.length) {
      previousAnswers.push(correctOption.find(".option-text").val());
    }
  } else {
    // Switching from text to dropdown - get all text answers
    container.find(".text-type").each(function () {
      previousAnswers.push($(this).val());
    });
  }

  // Create new input container with preserved values
  if (answerType === "text") {
    container.html(`
                <div class="text-answers-container">
                    ${previousAnswers
        .map(
          (val, index) => `
                        <div class="text-answer-group">
                            <input type="text" class="blank-input text-type" 
                                value="${val || ""}"
                                placeholder="Enter correct answer"
                                data-blank-id="${blankId}">
                            ${index === 0
              ? `
                            <button type="button" class="add-text-answer-btn">
                                <i class="fas fa-plus"></i>
                            </button>`
              : `
                            <button type="button" class="remove-text-answer-btn">
                                <i class="fas fa-times"></i>
                            </button>`
            }
                        </div>
                    `
        )
        .join("")}
                    ${previousAnswers.length === 0
        ? `
                        <div class="text-answer-group">
                            <input type="text" class="blank-input text-type" 
                                placeholder="Enter correct answer"
                                data-blank-id="${blankId}">
                            <button type="button" class="add-text-answer-btn">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>`
        : ""
      }
                </div>
            `);
  } else {
    container.html(`
                <div class="dropdown-options">
                    <div class="options-container">
                        ${previousAnswers
        .map(
          (val, index) => `
                            <div class="option-item">
                                <input type="text" class="option-text" 
                                    value="${val || ""}"
                                    placeholder="Option ${index + 1}">
                                <div class="option-item-others">
                                    <input type="radio" name="correctOption-${blankId}" 
                                        class="correct-option" >
                                    <p>Correct</p>
                                </div>
                                <div class="remove-options-divider"></div>
                                <div class="remove-option-btn">
                                    <i class="bx bx-trash"></i>
                                </div>
                            </div>
                        `
        )
        .join("")}
                    </div>
                    <button type="button" class="add-option-btn">Add Option</button>
                </div>
            `);
  }
});

$(document).on("click", function (e) {
  if (!$(e.target).closest("#time-zone").length) {
    if ($("#time-zone").find("ul").is(":visible")) {
      $("#time-zone").find("ul").hide();
    }
  }
});

$(document).on("click", ".remove-image", function () {
  $(this).prev().remove();
  $(this).remove();

  const id = $(this).data("id");
  // console.log("remobve id ",id)
  $(`#file-upload-${id}`).val("");
  $(`#image-preview-${id}`).empty();
});

$(document).on("click", "#edit-attender", function () {
  const email = $(this).attr("data-email");
  const pass = $(this).attr("data-pass");
  $("#email").val(email).prop("disabled", true);
  $("#sla_id").val(pass);
  $("#national_id").val(pass);
  $("#edit-attender-btn").show();
  $("#clear-attender-btn").show();
  $("#add-emails-btn").hide();
});

$(document).on("click", "#clear-attender-btn", function () {
  $("#email").val("").prop("disabled", false);
  $("#email").val("");
  $("#sla_id").val("");
  $("#national_id").val("");
  $("#edit-attender-btn").hide();
  $("#clear-attender-btn").hide();
  $("#add-emails-btn").show();
})

// add option & limit  5
$(document).on("click", ".add-option-btn", function () {
  const optionblankAnswerContainer = $(this).closest(".blank-answer");
  addOptionField(optionblankAnswerContainer);

  const optionsContainer =
    optionblankAnswerContainer.find(".options-container");
  if (optionsContainer.children().length >= 5) {
    optionblankAnswerContainer.find(".add-option-btn").hide();
    return;
  }
});

// remove option & limit 5
$(document).on("click", ".remove-option-btn", function () {
  const optionblankAnswerContainer = $(this).closest(".blank-answer");
  $(this).closest(".option-item").remove();
  const optionsContainer =
    optionblankAnswerContainer.find(".options-container");
  if (optionsContainer.children().length < 5) {
    optionblankAnswerContainer.find(".add-option-btn").show();
    return;
  }
});

// Add this inside your existing document ready handler
$(document).on("click", ".recording-accordion-header", function () {
  const $header = $(this);
  const $content = $header.next(".recording-accordion-content");
  const isClosing = $header.hasClass("active");

  $header.toggleClass("active", !isClosing);
  $content.slideToggle(200);

  // Close other accordions
  $(".recording-accordion-header").not($header).removeClass("active");
  $(".recording-accordion-content").not($content).slideUp();
});

// Update toggle logic
$(document).on("change", ".toggle-switch input", function () {
  const type = $(this).data("type");
  const isChecked = $(this).prop("checked");

  if (type === "both") {
    // Toggle both screen and camera when "both" is clicked
    $('[data-type="screen"], [data-type="camera"], [data-type="audio"]').prop(
      "checked",
      isChecked
    );
  } else {
    // When either screen/camera is toggled, update "both" state
    const screenChecked = $('[data-type="screen"]').prop("checked");
    const cameraChecked = $('[data-type="camera"]').prop("checked");
    const audioChecked = $('[data-type="audio"]').prop("checked");
    $('[data-type="both"]').prop(
      "checked",
      screenChecked && cameraChecked && audioChecked
    );

    // Ensure "both" can be properly unchecked
    if (!screenChecked || !cameraChecked || !audioChecked) {
      $('[data-type="both"]').prop("checked", false);
    }
  }

  // Update backend here
  const recordingConfig = {
    screen: $('[data-type="screen"]').prop("checked"),
    camera: $('[data-type="camera"]').prop("checked"),
    audio: $('[data-type="audio"]').prop("checked"),
    both: $('[data-type="both"]').prop("checked"),
  };
  console.log("Updated recording config:", recordingConfig);
});

$(document).on("click", ".setting-btn", function (event) {
  event.stopPropagation();
  const $container = $(this).closest(".setting-btn-container");
  const $panel = $container.find(".settings-popup");
  $panel.toggle();
  $(".settings-popup").not($panel).hide();
});

$(document).on("click", function (e) {
  if (!$(e.target).closest(".setting-btn-container").length) {
    $(".settings-popup").hide();
  }
});

$(document).on("change", '.choice input[type="radio"]', function () {
  $(this).closest(".question").find(".choice").removeClass("selected-choice");

  $(this).closest(".choice").addClass("selected-choice");
});

// Add click handler for the settings icon
$(document).on("click", ".total-marks-settings", function () {
  openMarksSettingsPopup();
});

$(document).on("change", "#exam-duration", function () {
  $(".exam-duration-input-container").not(this).val($(this).val());
});

$(document).on("click", ".action-button, .action-menu-main", function (e) {
  e.stopPropagation();

  const dropdown = $(this).siblings(".action-dropdown");
  const row = $(this).closest(".ag-row");

  // Hide all other dropdowns and remove has-open-dropdown class from all rows
  $(".action-dropdown").not(dropdown).removeClass("active").hide();
  $(".ag-row").removeClass("has-open-dropdown");

  // Toggle the current dropdown
  if (dropdown.is(":visible")) {
    dropdown.removeClass("active").hide();
    row.removeClass("has-open-dropdown");
  } else {
    dropdown.css({
      top: 50,
      right: 30,
      zIndex: 9999,
    });

    // Show the dropdown
    dropdown.addClass("active").show();
    row.addClass("has-open-dropdown");
  }
});

// Close dropdown when clicking outside
$(document).click(function () {
  $(".action-dropdown").removeClass("active").hide();
  $(".ag-row").removeClass("has-open-dropdown");
});

// Prevent dropdown close when clicking inside
$(document).on("click", ".action-dropdown", function (e) {
  e.stopPropagation();
});

$(document).on("click", ".tag-button", function (event) {
  event.stopPropagation();
  const tagInput = $(this).closest(".tag-input");
  if (!tagInput.hasClass("show")) {
    tagInput.addClass("show");
    tagInput.find("input").focus();
  }
});

$(document).on("click", ".tag-input", function (e) {
  e.stopPropagation();
});

$(document).on("input", ".tag-input input", function (e) {
  e.stopPropagation();
  const input = $(this);
  const query = input.val().toLowerCase();
  const suggestions = input.siblings(".tag-suggestions");

  if (!query) {
    suggestions.hide();
    return;
  }

  const matches = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(query)
  );

  if (matches.length > 0) {
    suggestions.empty();
    matches.forEach((tag) => {
      const bgColor = lightenHexColor(tag?.color, 75);
      suggestions.append(`
          <div class="suggestion-item" data-tag="${tag?.name}" 
               style="color: ${tag?.color}; background-color: ${bgColor};">
            ${tag?.name}
          </div>
        `);
    });
    suggestions.show();
  } else {
    suggestions.hide();
  }
});

$(document).on("click", ".suggestion-item", function (e) {
  e.stopPropagation();
  const tagName = $(this).data("tag");
  const tagContainer = $(this).closest(".tag-container");

  const tagData = allTags.find((tag) => tag.name === tagName);
  if (tagData) {
    const tagColor = tagData.color || randomColor();
    addTagChip(tagContainer, tagData.name, tagColor, tagData.id);
  }

  const tagInput = $(this).closest(".tag-input");
  tagInput.find("input").val("");
  tagInput.find(".tag-suggestions").hide();
  tagInput.removeClass("show");
});

$(document).on("click", ".tag-chip .fa-times", function (e) {
  e.stopPropagation();
  $(this).closest(".tag-item").remove();
});

$(document).on("click", ".tag-chip", function (e) {
  e.stopPropagation();
});

$(document).on("click", function (e) {
  e.stopPropagation();
  if (!$(e.target).closest(".tag-input").length) {
    $(".tag-suggestions").hide();
  }
});

$(document).on("keydown", ".tag-input input", function (e) {
  if (e.key === "Enter" || e.keyCode === 13) {
    e.preventDefault();
    const input = $(this);
    const tagName = input.val().trim();
    const tagContainer = input.closest(".tag-container");
    const suggestions = input.siblings(".tag-suggestions");

    if (tagName) {
      let tagData = allTags.find(
        (tag) => tag.name.toLowerCase() === tagName.toLowerCase()
      );

      if (!tagData) {
        const newTagColor = randomColor();

        const url = base_url + "/tag";

        makeApiCall({
          url: url,
          method: "POST",
          data: JSON.stringify({
            name: tagName.trim(),
          }),
          successCallback: async (response) => {
            const tagColor = newTagColor;
            addTagChip(
              tagContainer,
              response?.data?.name || tagName,
              tagColor,
              response?.data?._id
            );
            await handlefetchAllTags();
          },
          errorCallback: (error) => {
            console.log(error);
          },
        });
      } else {
        const tagColor = tagData?.color || randomColor();
        addTagChip(tagContainer, tagData?.name, tagColor);
      }
      input.val("");
      suggestions.hide();
      input.closest(".tag-input").removeClass("show");
    }
  }
});

$(document).on("click", function (e) {
  if ($(e.target).closest(".tag-input").length === 0) {
    $(".tag-input").removeClass("show");
    $(".tag-suggestions").hide();
  }
});

$(document).on("click", ".add-match-btn", function () {
  const questionId = $(this).data("id");
  const matchesContainer = $(`#matches-answers-${questionId}`);
  const matchCount = matchesContainer.children().length;

  const lastMatch = matchesContainer.children().last();
  let previousMatchId = 0;

  if (lastMatch.length) {
    const lastMatchId = lastMatch.data("match-id");
    const match = lastMatchId.match(/match-\d+-(\d+)$/);
    if (match && match[1]) {
      previousMatchId = parseInt(match[1], 10);
    }
  }

  // ✅ Generate new matchId and count
  const newMatchNumber = previousMatchId + 1;
  const matchId = `match-${questionId}-${newMatchNumber}`;

  // ✅ Check if match count has reached 10
  if (newMatchNumber >= 9) {
    $(this).hide();
  }

  // ✅ Create and append match HTML
  const matchHtml = `
    <div class="match-container" data-match-id="${matchId}"> 
      <span class="match-number">${newMatchNumber}</span>
      <div class="match-question-answer-container">
        <input type="text" class="match-question" id="match-question-${matchId}" placeholder="Enter question">
        <span class="match-arrow"><i class="fas fa-arrow-right"></i></span>
        <input type="text" class="match-answer" id="match-answer-${matchId}" placeholder="Enter answer">
      </div>
      <button type="button" class="remove-match-btn">
        <i class="fas fa-times"></i>
      </button>
    </div>`;

  matchesContainer.append(matchHtml);

  updateMatchNumbers(questionId);
  updateMatchRemoveButtons(questionId);
});

$(document).on("click", ".remove-match-btn", function () {
  const match = $(this).closest(".match-container");
  const questionId = match.data("match-id").split("-")[1];
  const matchesContainer = $(`#matches-answers-${questionId}`);
  const matchesCount = matchesContainer.children(".match-container").length;

  if (matchesCount <= 1) {
    displayToast(
      "Cannot remove the last match. MTF questions require at least one match.",
      "warning"
    );
    return;
  }

  match.remove();

  // 🔁 Recalculate after removal
  updateMatchNumbers(questionId);
  updateMatchRemoveButtons(questionId);

  // ✅ Show add button again if match count is now < 10
  const newCount = matchesContainer.children(".match-container").length;
  if (newCount < 9) {
    $(`.add-match-btn[data-id="${questionId}"]`).show();
  }
});

// Function to update the visual state of remove match buttons
function updateMatchRemoveButtons(questionId) {
  const matchesContainer = $(`#matches-answers-${questionId}`);
  const matchesCount = matchesContainer.children(".match-container").length;

  const removeButtons = matchesContainer.find(".remove-match-btn");

  if (matchesCount <= 1) {
    removeButtons.addClass("disabled");
  } else {
    removeButtons.removeClass("disabled");
  }
}

// Add this after the btn-view-details click handler
$(document).on("click", "#extra-time", function () {
  const id = $(this).data("id");
  openExtraTimeDialog(id);
});

$(document).on("click", "#revoke-exam", function () {
  const id = $(this).data("id");
  const attenderData = $(this).data("attender");
  openRevokeExamDialog(id, attenderData);
});

$(document).on("click", ".add-blank-btn", function () {
  const questionId = $(this).data("id");
  const blanksContainer = $(`#blanks-answers-${questionId}`);
  const blankCount = blanksContainer.children().length + 1;

  const lastBlank = blanksContainer.children().last();
  let previousBlankId = 0;

  if (lastBlank.length) {
    const lastBlankId = lastBlank.data("blank-id");
    const match = lastBlankId.match(/blank-\d+-(\d+)$/);
    if (match && match[1]) {
      previousBlankId = parseInt(match[1], 10);
    }
  }

  const blankId = `blank-${questionId}-${previousBlankId + 1}`;

  const editor = $(`#question-text-${questionId}`).data("ckeditorInstance");

  if (editor) {
    const blankEmoji = `${blankCount}️⃣`;
    const model = editor.model;
    const selection = model.document.selection;

    // Get the position where the cursor is
    const range = selection.getFirstRange();
    const position = range.start;

    model.change((writer) => {
      // Insert the blank emoji at cursor position
      writer.insertText(blankEmoji + "_", position);
      // If at the end of an empty paragraph, add space after
      if (position.parent.isEmpty && position.offset === 0) {
        writer.insertText(" ", position);
      }
    });
  }

  //#region Blank Answer Accordion
  const blankHtml = `
        <div class="blank-answer active" data-blank-id="${blankId}">
            <div class="accordion-header">
                <div class="accordion-toggle">
                    <span>Blank ${blankCount}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="remove-blank-btn" data-id="${questionId}">
                        <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="accordion-body">

                <div class="blank-answer-header">
                    <label class="header-label-blank-answer">Answer Type:</label>
                    <select class="answer-type" data-blank-id="${blankId}">
                        <option value="text">Text Input</option>
                        <option value="dropdown">Options</option>
                    </select>
                    
                </div>

                <div class="answer-input-container">
                  <div class="text-answers-container">
                        <div class="text-answer-group">
                            <input type="text" class="blank-input text-type" 
                                placeholder="Enter correct answer"
                                data-blank-id="${blankId}"
                                data-question-id="${questionId}">
                            <button type="button" class="add-text-answer-btn">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
        
                    <div class="dropdown-options" style="display:none;">
                        <div class="options-container"></div>
                        <button type="button" class="add-option-btn">Add Option</button>
                    </div>
                </div>
            </div>
        </div>`;
  //#endregion
  blanksContainer.append(blankHtml);

  $(".blank-count").text(blankCount);

  reorderBlankEmojis(questionId);
});

// Add click handler for the new button
$(document).on("click", ".btn-send-registration", function () {
  const email = $(this).data("email");
  sendInviteEmails(email);
});

$(document).on("click", "#view-details", function () {
  const email = $(this).data("email");

  $.ajax({
    url: `${base_url}/attender?email=${email}`,
    type: "GET",
    headers: apiHeaders,
    success: function (data) {
      openDetailsDialog(data);
    },
    error: function () {
      toastr.error("Failed to load attender details.");
    },
  });
});

// Table-based Question Type (TAB) event handlers
$(document).on("click", ".add-table-btn", function () {
  const questionId = $(this).data("id");

  // Check if a table already exists for this question
  const existingTable = $(
    `#question-${questionId} .accountence-table-container`
  );
  const hasExistingAnswers =
    $(`#tab-blanks-container-${questionId} .blank-item`).length > 0;

  // Create warning message based on existing content
  let warningMessage = "";
  if (existingTable.length) {
    warningMessage = `
      <div class="table-info-message" style="padding: 15px 20px; background-color: #fff3cd; color: #856404; border-bottom: 1px solid #ffeeba; margin-bottom: 10px;">
        <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
        <strong>Warning:</strong> Creating a new table will replace the existing one. ${hasExistingAnswers
        ? "<strong>All current answer fields will be lost!</strong>"
        : ""
      }
      </div>`;
  }

  // Create and show table dimension selector dialog
  const tableDialog = `
    <div id="table-creator-dialog" class="table-dialog">
      <div class="table-dialog-header">
        <h3>Create Table</h3>
        <button class="close-table-dialog">&times;</button>
      </div>
      ${warningMessage}
      <div class="table-grid-container">
        <div class="table-grid-selector">
          ${generateTableGrid(10, 10)}
        </div>
        <div class="table-dimensions-display">
          <span id="table-dimension-label">0 x 0</span>
        </div>
      </div>
      <div class="table-dialog-footer">
        <button id="create-custom-table" data-question-id="${questionId}">Create Table</button>
      </div>
    </div>
    <div class="table-dialog-overlay"></div>
  `;

  $("body").append(tableDialog);

  // Initialize the hover behavior for the grid cells
  initTableGridSelector();
});

// Add event handlers for the new table UI
$(document).on("click", ".insert-table-btn", function () {
  const questionId = $(this).data("question-id");
  const rows =
    parseInt(
      $(this).closest(".table-input-section").find(".table-rows-input").val()
    ) || 3;
  const cols =
    parseInt(
      $(this).closest(".table-input-section").find(".table-cols-input").val()
    ) || 3;

  // Validate input
  if (rows < 1 || rows > 10 || cols < 1 || cols > 10) {
    toastr.error("Rows and columns must be between 1 and 10");
    return;
  }

  createCustomTable(questionId, rows, cols);
  toastr.success(`Table updated with ${rows} rows and ${cols} columns`);
});

// Handle cell click for editing - update the selector to work with the standalone table
$(document).on("click", ".accountence-table td.editable-cell", function (e) {
  const cellId = $(this).data("cell-id");
  const content = $(this).html();

  // Check if we're already editing
  if ($("#cell-editor-popup").length) {
    return;
  }

  // Create cell editor popup
  const popup = `
  <div class="cell-editor-popup" id="cell-editor-popup" > 
    <div  class="cell-editor-popup-wrapper">
      <div class="cell-editor-header">
        <div class="cell-editor-title">Edit Cell ${cellId}</div>
        <button class="close-cell-editor">&times;</button>
      </div>
      <div class="cell-input-container">
        <textarea id="cell-content">${formatCellContent(content)}</textarea>
        <button class="add-blank-marker">
          <i class="fas fa-pen-alt"></i> Insert Answer Field
        </button>
      </div>
      <div class="cell-editor-actions">
        <button class="save-cell-content" data-cell-id="${cellId}">Save</button>
      </div>
    </div>
    </div>

  `;

  $("body").append(popup);
  $("#cell-editor-popup").fadeIn(200);
  $("#cell-content").focus();

  // Store the reference to the question for later use
  const questionId = $(this).closest(".question").attr("id").split("-")[1];
  $("#cell-editor-popup").data("question-id", questionId);

  // Stop event propagation
  e.stopPropagation();
});

// Add this event handler to prevent partial deletion of [blank] and [answer] tags
$(document).on("input", "#cell-content", function (e) {
  const content = $(this).val();

  // Check if someone is trying to partially delete [blank] or [answer]
  const partialBlank = content.match(
    /\[bla(?!nk\])|b(?:\]|lan(?!k\]))|bl(?:\]|an(?!k\]))|bla(?:\]|n(?!k\]))|blan(?:\]|(?!k\]))/
  );
  const partialAnswer = content.match(
    /\[ans(?!wer\])|a(?:\]|ns(?!wer\]))|an(?:\]|sw(?!er\]))|ans(?:\]|w(?!er\]))|answ(?:\]|e(?!r\]))|answe(?:\]|(?!r\]))/
  );

  if (partialBlank || partialAnswer) {
    // Get cursor position
    const cursorPos = this.selectionStart;

    // Replace partial tags with empty string
    let newContent = content;
    if (partialBlank) {
      // Find the position where the partial [blank] starts
      const pos = content.indexOf(partialBlank[0]);
      const endPos = pos + partialBlank[0].length;

      // Remove the partial tag
      newContent = content.substring(0, pos) + content.substring(endPos);
    }

    if (partialAnswer) {
      // Find the position where the partial [answer] starts
      const pos = content.indexOf(partialAnswer[0]);
      const endPos = pos + partialAnswer[0].length;

      // Remove the partial tag
      newContent = content.substring(0, pos) + content.substring(endPos);
    }

    // Update the content
    $(this).val(newContent);

    // Adjust cursor position
    this.selectionStart = cursorPos - 1;
    this.selectionEnd = cursorPos - 1;
  }
});

// Add this function to ensure [blank] and [answer] tags are treated as single entities
$(document).on("keydown", "#cell-content", function (e) {
  // Get cursor position and content
  const cursorPos = this.selectionStart;
  const content = $(this).val();

  // Check if cursor is inside or at the edge of a tag
  const isInsideBlankTag = isInsideTag(content, cursorPos, "[blank]");
  const isInsideAnswerTag = isInsideTag(content, cursorPos, "[answer]");

  // If trying to delete with Backspace or Delete keys and cursor is inside/at edge of a tag
  if (
    (e.key === "Backspace" || e.key === "Delete") &&
    (isInsideBlankTag || isInsideAnswerTag)
  ) {
    e.preventDefault();

    // Determine which tag we're dealing with
    const tag = isInsideBlankTag ? "[blank]" : "[answer]";

    // Find the position of the tag
    const tagPos = findTagPosition(content, cursorPos, tag);

    if (tagPos !== -1) {
      // Remove the entire tag
      const newContent =
        content.substring(0, tagPos) + content.substring(tagPos + tag.length);
      $(this).val(newContent);

      // Set cursor position to where the tag was
      this.selectionStart = tagPos;
      this.selectionEnd = tagPos;
    }
  }
});

// Update save cell content function to handle the new tag styling
$(document).on("click", ".save-cell-content", function () {
  const cellId = $(this).data("cell-id");
  let content = $("#cell-content").val();
  const questionId = $("#cell-editor-popup").data("question-id");

  // Trim the content
  content = content.trim();

  // Simplify the content detection
  const containsBlank = content.includes("[blank]");
  const containsAnswer = content.includes("[answer]");

  // Find the cell in the standalone table
  const $question = $(`#question-${questionId}`);
  const $cell = $question.find(
    `.accountence-table td[data-cell-id="${cellId}"]`
  );

  if ($cell.length) {
    // Check if the cell previously had a blank/answer that was removed
    const wasBlankCell = $cell.hasClass("blank-cell");
    const hadBlankOrAnswer =
      $cell.html().includes("blank-indicator") ||
      $cell.html().includes("answer-indicator");

    // If cell previously had answer/blank but now doesn't, remove the answer field
    if (wasBlankCell && hadBlankOrAnswer && !containsBlank && !containsAnswer) {
      // Find and remove the corresponding answer field
      const $blankItem = $(
        `#tab-blanks-container-${questionId} .blank-item[data-cell-ref="${cellId}"]`
      );
      if ($blankItem.length) {
        // Remove the answer field
        $blankItem.fadeOut(200, function () {
          $(this).remove();

          // Update blank count
          const totalBlankItems = $(
            `#tab-blanks-container-${questionId} .blank-item`
          ).length;

          // Show "no blanks" message if this was the last one
          if (totalBlankItems === 0) {
            $(`#answer-fields-${questionId} .no-blanks-message`).show();
          }

          // Update the blank count badge
          $(`.tab-blank-count`).text(totalBlankItems);
        });

        // Notify the user
        toastr.info("Answer field removed");
      }

      // Reset the cell
      $cell.removeClass("blank-cell");
      $cell.html(escapeHtml(content));
    } else if (containsBlank || containsAnswer) {
      // Apply special class if cell has blank or answer
      $cell.addClass("blank-cell");

      // Format the content appropriately with consistent styling
      let displayContent;

      // Apply special formatting for blank and answer tags
      if (containsBlank) {
        displayContent = '<span class="blank-indicator">[blank]</span>';

        const existingSelector = `#tab-blanks-container-${questionId} .blank-item[data-cell-ref="${cellId}"]`;

        // Check if this cellRef already exists
        if ($(existingSelector).length === 0) {
          toastr.success(`Adding new blank for: ${cellId}`);
          addBlankAnswerField(questionId, cellId);
        } else {
          toastr.error(`Blank already exists for: ${cellId}`);
        }
      } else if (containsAnswer) {
        displayContent =
          '<span class="answer-indicator"><i class="fas fa-check-circle"></i> [answer]</span>';
      } else {
        // Plain text content
        displayContent = escapeHtml(content);
      }

      $cell.html(displayContent);
    } else {
      $cell.removeClass("blank-cell");
      $cell.html(escapeHtml(content));
    }

    // Close the editor popup
    $("#cell-editor-popup").fadeOut(200, function () {
      $(this).remove();
    });
  }
});

// Helper function to escape HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Close cell editor when clicking outside

$(document).on("click", function (e) {
  // Close #cell-editor-popup if clicked outside
  if (
    $("#cell-editor-popup").length &&
    !$(e.target).closest("#cell-editor-popup").length &&
    !$(e.target).closest(".editable-cell").length
  ) {
    $("#cell-editor-popup").remove();
  }

  // Close #answer-field-dialog if clicked outside
  if (
    $("#answer-field-dialog").length &&
    !$(e.target).closest("#answer-field-dialog").length &&
    !$(e.target).closest(".editable-cell").length
  ) {
    $("#answer-field-dialog").remove();
  }

  // Close #cell-selector-dialog if clicked outside
  if (
    $("#cell-selector-dialog").length &&
    !$(e.target).closest("#cell-selector-dialog").length &&
    !$(e.target).closest(".add-table-answer-field-btn").length
  ) {
    $("#cell-selector-dialog").remove();
  }
});

// Close cell editor with close button
$(document).on("click", ".close-cell-editor", function () {
  $("#cell-editor-popup").remove();
});

// Insert blank marker into cell
$(document).on("click", ".add-blank-marker", function () {
  // Replace content with [blank] marker
  $("#cell-content").val("[blank]");
  $("#cell-content").focus();

  // Highlight the input to show it's been changed
  $("#cell-content").css({
    "background-color": "#e8f0fe",
    transition: "background-color 0.3s ease",
  });

  setTimeout(function () {
    $("#cell-content").css("background-color", "");
  }, 1000);
});

// Add alternative answer field - Update to match the new cleaner design
$(document).on("click", ".add-alternative-btn", function () {
  const container = $("#alternative-answers-container");
  const newField = `
    <div class="alternative-input-group" style="margin-bottom: 10px; display: flex; align-items: center;">
      <input type="text" class="alternative-answer" placeholder="Alternative correct answer" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 16px;">
      <button type="button" class="remove-alternative-btn" style="background: none; border: none; color: #dc3545; margin-left: 10px; cursor: pointer;"><i class="fas fa-times"></i></button>
    </div>
  `;
  container.append(newField);
  container.find("input").last().focus();
});

// Handle clicking the "Add Answer Field" button
$(document).on("click", ".add-table-answer-field-btn", function () {
  const questionId = $(this).data("question-id");

  // Create a dropdown with available cells
  const cells = [];
  $(`#question-${questionId} .accountence-table td.editable-cell`).each(
    function () {
      const cellId = $(this).data("cell-id");
      // Check if this cell already has an answer field
      const cellContent = $(this).html();
      const hasAnswer =
        cellContent.includes("[answer]") || cellContent.includes("[blank]");

      if (!hasAnswer) {
        cells.push(cellId);
      }
    }
  );

  // Sort cells alphabetically
  cells.sort();

  // Check if we have any available cells
  if (cells.length === 0) {
  toastr.error(
    "No available cells found. Please add a table cell before inserting an answer field."
  );
    return;
  }

  // Create cell selector dialog
  const cellSelectorHtml = `
   <div class="cell-editor-popup" id="cell-selector-dialog" >
    <div class="cell-editor-popup-wrapper">
      <div class="cell-editor-header">
        <div class="cell-editor-title">Select Cell for Answer Field</div>
        <button class="close-cell-selector">&times;</button>
      </div>
      <div class="cell-input-container cell-dropdown-container">
        <div class="field-row">
          <p style="margin-bottom: 10px;">Select a cell to add an answer field. This will mark the cell as an answer location.</p>
          <label for="cell-select-label">Select Cell:</label>
          <select onfocus='this.size=10;' onblur='this.size=1;' 
        onchange='this.size=1; this.blur();' id="cell-select" class="cell-select">
            ${cells
      .map((cell) => `<option value="${cell}">${cell}</option>`)
      .join("")}
          </select>
        </div>
      </div>
      <div class="cell-editor-actions">
        <button class="select-cell-btn" data-question-id="${questionId}">
          Add Answer Field
        </button>
      </div>
    </div>
   </div>
  `;

  $("body").append(cellSelectorHtml);
  $("#cell-selector-dialog").fadeIn(200);
});

// Handle cell selection for adding answer field
$(document).on("click", ".select-cell-btn", function () {
  const questionId = $(this).data("question-id");
  const cellRef = $("#cell-select").val();

  // Close the cell selector dialog
  $("#cell-selector-dialog").remove();

  // Get reference to the selected cell
  const $table = $(`#question-${questionId} .accountence-table`);
  const $cell = $table.find(`td[data-cell-id="${cellRef}"]`);

  // Add [blank] to the cell and process it automatically
  if (!$cell.html().includes("[blank]") && !$cell.html().includes("[answer]")) {
    // Update the cell with the properly formatted [blank] marker
    $cell.html('<span class="blank-indicator">[blank]</span>');
    // Add the blank-cell class for styling
    $cell.addClass("blank-cell");

    // Show success message
    toastr.success(`Added blank field to cell ${cellRef}`);
  } else {
    toastr.info(`Cell ${cellRef} already has a blank or answer field`);
  }

  // Add a blank answer field for the selected cell
  addBlankAnswerField(questionId, cellRef);
});

// Close cell selector dialog
$(document).on("click", ".close-cell-selector", function () {
  $("#cell-selector-dialog").remove();
});

// Remove alternative answer field
$(document).on("click", ".remove-alternative-btn", function () {
  $(this).closest(".alternative-input-group").remove();
});

// Close answer field dialog
$(document).on("click", ".close-answer-field-dialog", function () {
  $("#answer-field-dialog").remove();
});

// Save or update the answer field
$(document).on(
  "click",
  ".save-answer-field, .update-answer-field",
  function () {
    const questionId = $(this).data("question-id");
    const cellRef = $(this).data("cell-ref");
    const blankId = $(this).data("blank-id");

    // Get primary answer
    const primaryAnswer = $("#answer-value").val().trim();

    // Get alternative answers
    const alternativeAnswers = [];
    $(".alternative-answer").each(function () {
      const altValue = $(this).val().trim();
      if (altValue) {
        alternativeAnswers.push(altValue);
      }
    });

    // Check if at least one answer is provided
    if (!primaryAnswer && alternativeAnswers.length === 0) {
      // Show error and shake the primary input
      $("#answer-value").addClass("error-shake");
      setTimeout(() => {
        $("#answer-value").removeClass("error-shake");
      }, 600);

      toastr.error("Please provide at least one answer");
      return;
    }

    // Find or create the blank element
    let $blank;
    if (blankId) {
      // Update existing blank
      $blank = $(`#blank-${blankId}`);
      if (!$blank.length) {
        toastr.error("Cannot find the answer field to update");
        return;
      }
    } else {
      // Create new blank ID and element - this path shouldn't happen with current code
      const newBlankId = `tab-blank-${questionId}-${Date.now()}`;
      toastr.error("Unexpected error: No blank ID found");
      return;
    }

    // Create answers array with proper structure
    const answers = [];
    if (primaryAnswer) {
      answers.push({
        value: primaryAnswer,
        isCorrect: true,
      });
    }

    alternativeAnswers.forEach((alt) => {
      answers.push({
        value: alt,
        isCorrect: true,
      });
    });

    // Save answers data to the blank element
    $blank.data("answers", answers);
    $blank.attr("data-answers", JSON.stringify(answers));

    // Update the answers display with improved formatting
    const $answersDisplay = $blank.find(".answers-display");
    $answersDisplay.empty();

    if (answers.length > 0) {
      // Add primary answer with enhanced styling
      $answersDisplay.append(`
        <div class="answer-value primary-answer">
          <div class="answer-badge"><i class="fas fa-check-circle"></i> Primary</div>
          <div class="answer-text">${answers[0].value}</div>
        </div>
      `);

      // Add alternative answers with improved styling
      if (answers.length > 1) {
        $answersDisplay.append(`
          <div class="alternative-answers-label">
            <i class="fas fa-list-alt"></i> Alternative Answers (${answers.length - 1
          })
          </div>
        `);

        for (let i = 1; i < answers.length; i++) {
          $answersDisplay.append(`
            <div class="answer-value">
              <div class="answer-text">${answers[i].value}</div>
            </div>
          `);
        }
      }
    } else {
      // No answers provided, show default message with icon
      $answersDisplay.append(`
        <div class="answer-value default-answer">
          <i class="fas fa-info-circle"></i> No answer provided
        </div>
      `);
    }

    // Close the dialog with animation
    $("#answer-field-dialog").fadeOut(200, function () {
      $(this).remove();
    });

    // Update blank count
    updateBlankCount(questionId);
    toastr.success("Answer field updated successfully");
  }
);

// Handle edit blank button click
$(document).on("click", ".edit-blank-btn", function () {
  const questionId = $(this).data("question-id");
  const cellRef = $(this).data("cell-ref");
  const blankId = $(this).data("blank-id");

  // Call the function with the correct parameters
  editBlankAnswer(questionId, cellRef, blankId);
});

// Handle remove blank button click
$(document).on("click", ".remove-table-blank-btn", function () {
  const questionId = $(this).data("question-id");
  const cellRef = $(this).data("cell-ref");
  const blankId = $(this).data("blank-id");

  const $questionBlock = $(this).closest(".question"); // Scope limiter

  // Use scoped selector to find the blank item
  const $blank = $questionBlock.find(`.blank-item[data-blank-id="${blankId}"]`);

  if (!$blank.length) {
    console.error(`Blank element not found: [data-blank-id="${blankId}"]`);
    toastr.error("This answer field no longer exists.");
    return;
  }

  const $cell = $questionBlock.find(
    `.accountence-table td[data-cell-id="${cellRef}"]`
  );

  if ($cell.length) {
    $cell.removeClass("blank-cell").html("&nbsp;");

    $blank.fadeOut(200, function () {
      $(this).remove();

      const blankCount = $questionBlock.find(".blank-item").length;
      $questionBlock.find(".tab-blank-count").text(blankCount);

      if (blankCount === 0) {
        $questionBlock.find(".no-blanks-message").show();
      }
    });

    toastr.success("Answer field removed");
  } else {
    $blank.fadeOut(200, function () {
      $(this).remove();

      const blankCount = $questionBlock.find(".blank-item").length;
      $questionBlock.find(".tab-blank-count").text(blankCount);

      if (blankCount === 0) {
        $questionBlock.find(".no-blanks-message").show();
      }
    });

    console.warn(`Cell not found: ${cellRef}, but blank was still removed`);
    toastr.info("Answer field removed");
  }
});

// Add click handler for cells to detect and process [blank] tags on click
$(document).on("click", ".accountence-table td", function () {
  const cellText = $(this).text().trim();

  if (cellText === "[blank]" || cellText.includes("[blank]")) {
    const $questionContainer = $(this).closest(".question");
    const questionId = $questionContainer.attr("id").split("-")[1];

    processBlankCell(this, questionId);

    const cellId = $(this).data("cell-id");

    setTimeout(function () {
      const blankItem = $questionContainer.find(`[data-cell-ref="${cellId}"]`);
      if (blankItem.length) {
        const blankId = blankItem.data("blank-id");
        editBlankAnswer(questionId, cellId, blankId);
      }
    }, 100);
  }
});

// Update the cell selection handler to use consistent styling and processing function
$(document).on("click", ".select-cell-btn", function () {
  const questionId = $(this).data("question-id");
  const cellRef = $("#cell-select").val();

  // Close the cell selector dialog
  $("#cell-selector-dialog").remove();

  // Get reference to the selected cell
  const $table = $(`#question-${questionId} .accountence-table`);
  const $cell = $table.find(`td[data-cell-id="${cellRef}"]`);

  // Add [blank] to the cell if it doesn't already have a blank or answer
  if (!$cell.html().includes("[blank]") && !$cell.html().includes("[answer]")) {
    // Apply styled blank indicator directly
    $cell.addClass("blank-cell");
    $cell.html('<span class="blank-indicator">[blank]</span>');

    // Add the blank answer field
    addBlankAnswerField(questionId, cellRef);

    // Show success message
    toastr.success(`Added blank field to cell ${cellRef}`);
  } else {
    toastr.info(`Cell ${cellRef} already has a blank or answer field`);
  }

  // Open the edit dialog
  setTimeout(function () {
    const blankItem = $(`[data-cell-ref="${cellRef}"]`);
    if (blankItem.length) {
      const blankId = blankItem.data("blank-id");
      editBlankAnswer(questionId, cellRef, blankId);
    }
  }, 100);
});

// Update the save handler to use our CSS classes consistently
$(document).on(
  "click",
  ".save-answer-field, .update-answer-field",
  function () {
    const questionId = $(this).data("question-id");
    const cellRef = $(this).data("cell-ref");
    const blankId = $(this).data("blank-id");

    // Get primary answer
    const primaryAnswer = $("#answer-value").val().trim();

    // Get alternative answers
    const alternativeAnswers = [];
    $(".alternative-answer").each(function () {
      const altValue = $(this).val().trim();
      if (altValue) {
        alternativeAnswers.push(altValue);
      }
    });

    // Find or create the blank element
    let $blank;
    if (blankId) {
      // Update existing blank
      $blank = $(`.blank-item[data-blank-id="${blankId}"]`);
    } else {
      // Create new blank ID and element
      const newBlankId = `tab-blank-${questionId}-${Date.now()}`;

      // Hide the "no blanks" message
      $(`#answer-fields-${questionId} .no-blanks-message`).hide();

      const blankHtml = `      <div class="blank-item active" data-blank-id="${newBlankId}" data-cell-ref="${cellRef}">        <div class="blank-header accordion-header">          <div class="cell-reference">${cellRef}</div>          <div class="blank-actions">            <button class="edit-blank-btn" data-question-id="${questionId}" data-cell-ref="${cellRef}" data-blank-id="${newBlankId}">              <i class="fas fa-edit"></i>            </button>            <button class="remove-table-blank-btn" data-question-id="${questionId}" data-cell-ref="${cellRef}" data-blank-id="${newBlankId}">              <i class="fas fa-trash"></i>            </button>            <button class="toggle-blank-btn">              <i class="fas fa-chevron-down"></i>            </button>          </div>        </div>        <div class="blank-content accordion-body">          <div class="answers-display"></div>        </div>      </div>    `;
      $(`#tab-blanks-container-${questionId}`).append(blankHtml);
      $blank = $(`.blank-item[data-blank-id="${newBlankId}"]`);
    }

    // Update the answers display with better styling
    const $answersDisplay = $blank.find(".answers-display");
    $answersDisplay.empty();

    if (primaryAnswer) {
      // Use our CSS classes from the external stylesheet
      $answersDisplay.append(`
        <div class="primary-answer">
          <div class="answer-label">Primary Answer:</div>
          ${primaryAnswer}
        </div>
      `);

      if (alternativeAnswers.length > 0) {
        $answersDisplay.append(
          `<div class="alternative-answers-label">Alternative Answers:</div>`
        );

        alternativeAnswers.forEach((alt) => {
          $answersDisplay.append(`<div class="answer-value">${alt}</div>`);
        });
      }
    } else {
      $answersDisplay.append(
        `<div class="default-answer">No answer provided</div>`
      );
    }

    // Highlight the cell in the table
    const $table = $(`#question-${questionId} .accountence-table`);
    const $cell = $table.find(`td[data-cell-id="${cellRef}"]`);

    // Use consistent styling for the [answer] indicator
    $cell.addClass("blank-cell");
    $cell.html(
      '<span class="answer-indicator"><i class="fas fa-check-circle"></i> [answer]</span>'
    );

    // Close the dialog
    $("#answer-field-dialog").fadeOut(200, function () {
      $(this).remove();
    });

    // Update blank count
    updateBlankCount(questionId);
  }
);

// Make sure only one event handler is attached
$(document).off("click", ".close-answer-field-dialog");
$(document).off("click", ".add-alternative-btn");
$(document).off("click", ".remove-alternative-btn");
$(document).off("click", ".save-answer-field");

// Initialize close button - single implementation
$(document).on("click", ".close-answer-field-dialog", function () {
  $("#answer-field-dialog").fadeOut(200, function () {
    $(this).remove();
  });
});

// Initialize add alternative answer button - single implementation

$(document).on("click", ".add-alternative-btn", function () {
  let alternativeAnswerLength = $("#alternative-answers-container").children()
    .length;
  if (alternativeAnswerLength >= 2) {
    $(this).hide();
  }
  const alternativeInput = `
    <div class="alternative-input-group">
      <input type="text" class="alternative-answer" placeholder="Alternative answer">
      <button class="remove-alternative-btn">×</button>
    </div>
  `;

  $("#alternative-answers-container").append(alternativeInput);
  $("#alternative-answers-container").find("input").last().focus();
});

// Initialize remove alternative answer button - single implementation
$(document).on("click", ".remove-alternative-btn", function (event) {
  event.stopPropagation();
  $(this).closest(".alternative-input-group").remove();

  if ($("#alternative-answers-container").children().length <= 2) {
    $(".add-alternative-btn").show();
  }
});

// Save answer field - single implementation
$(document).on("click", ".save-answer-field", function () {
  const blankId = $(this).data("blank-id");
  const cellRef = $(this).data("cell-ref");
  const questionId = $(this).data("question-id");

  // Add null checking for the primary value
  const answerValue = $("#answer-value").val();
  const primaryValue = answerValue ? answerValue.trim() : "";

  const answers = [];

  // Add primary answer
  if (primaryValue) {
    answers.push({
      value: primaryValue,
      isCorrect: true,
    });
  }

  // Add alternative answers with null checking
  $(".alternative-answer").each(function () {
    const inputValue = $(this).val();
    const value = inputValue ? inputValue.trim() : "";
    if (value) {
      answers.push({
        value: value,
        isCorrect: true,
      });
    }
  });

  // Find the blank element using correct selector
  const $blank = $(`.blank-item[data-blank-id="${blankId}"]`);
  if (!$blank.length) {
    toastr.error("Error saving answers: blank not found");
    return;
  }

  // Save answers to blank using both data and attr methods to ensure persistence
  $blank.data("answers", answers);
  $blank.attr("data-answers", JSON.stringify(answers));

  // Update the display of answers
  const $answersDisplay = $blank.find(".answers-display");
  if (!$answersDisplay.length) {
    toastr.error("Error updating answer display");
    return;
  }

  $answersDisplay.empty();

  if (answers.length > 0) {
    // Add primary answer with special styling
    $answersDisplay.append(`
      <div class="answer-value primary-answer">${answers[0].value}</div>
    `);

    // Add alternative answers
    if (answers.length > 1) {
      $answersDisplay.append(`
        <div class="alternative-answers-label">Alternative Answers:</div>
      `);

      for (let i = 1; i < answers.length; i++) {
        $answersDisplay.append(`
          <div class="answer-value">${answers[i].value}</div>
        `);
      }
    }

    // Update the cell in the table to show [answer] tag since we have an answer now
    const $table = $(`#question-${questionId} .accountence-table`);
    const $cell = $table.find(`td[data-cell-id="${cellRef}"]`);
    if ($cell.length) {
      // Make sure the cell has the blank-cell class and update content
      $cell.addClass("blank-cell");

      // Replace [blank] with [answer]
      $cell.html(
        '<span class="answer-indicator"><i class="fas fa-check-circle"></i> [answer]</span>'
      );
    }
  } else {
    // No answers provided, show default message
    $answersDisplay.append(`
      <div class="answer-value default-answer">No answer provided</div>
    `);

    // Revert back to [blank] if there's no answer
    const $cell = $(`.accountence-table td[data-cell-id="${cellRef}"]`);
    if ($cell.length) {
      $cell.html('<span class="blank-indicator">[blank]</span>');
    }
  }

  // Close the dialog
  $("#answer-field-dialog").fadeOut(200, function () {
    $(this).remove();
  });
});
