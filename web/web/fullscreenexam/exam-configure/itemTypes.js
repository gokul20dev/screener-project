function checkAndHideAddMatchBtn(questionId, blankCount) {
  const $btn = $(`.add-match-btn[data-id="${questionId}"]`);
  if (blankCount > 8) {
    $btn.hide();
  }
}

$(document).on("click", ".edit-or-item", function () {
  const $question = $(this).closest(".question"); // scope to current question
  const editingItemId = $(this).data("item-id");
  const itemText = $(`#ordering-item-text-${editingItemId}`).text();
  $question.find(".ordering-item-input").val(itemText).focus();
  $question.find(".save-edit-or-item-btn").show();
  $question.find(".add-ordering-item-btn").hide();

  // Optional: store the editingItemId in the save button for this question
  $question.find(".save-edit-or-item-btn").data("id", editingItemId);
});

$(document).on("click", ".save-edit-or-item-btn", function () {
  const $question = $(this).closest(".question");
  const itemId = $(this).data("id"); // get item ID from data attribute
  const itemText = $question.find(".ordering-item-input").val().trim();

  if (itemId && itemText) {
    $(`.ordering-item-${itemId} .ordering-item-text`).text(itemText);
  }
  // Reset UI
  $(this).hide();
  $question.find(".add-ordering-item-btn").show();
  $question.find(".ordering-item-input").val("");
});

//UD
function addDuQuestion(questionData) {
  questionCount++;
  let choicesHtml = "";
  let shouldEvaluate = "checked";
  let marksValue =
    questionData && typeof questionData.marks === "number"
      ? questionData.marks
      : 1;

  if (questionData) {
    if (!questionData.shouldEvaluate) {
      shouldEvaluate = "notchecked";
    }
  }

  const attachments = questionData?.attachments || [];
  centerOrRight(questionCount);
  const questionHtml = `
            <div class="question " data-qtype="UD"  data-realid="${questionData && questionData._id ? questionData._id : "new"
    }" id="question-${questionCount}">
                <div class="question-header mt-2 qtntoggle">
                  <span class="speech-bubble-badge">
                    UD <i class="fas fa-chevron-down"></i>
                  </span>
                  <h5>Question<span class='qcnt'>${questionCount}</span></h5>
                  <h5>
                     
                      <span class="toggle-icon ">▼</span>
                  </h5>
                                     <div class="tag-container">
                    ${(questionData?.tags || [])
      .map((tag) => {
        const matchedTag = allTags?.find(
          (t) => t.id === tag._id
        );

        return matchedTag
          ? `<div class="tag-item" data-name="${matchedTag.name
          }" data-id="${matchedTag.id}">
                            <span class="tag-chip" style="--tag-bg: ${lightenHexColor(
            matchedTag.color,
            75
          )}; --tag-color: ${matchedTag.color}">
                              ${matchedTag.name}
                              <i class="fas fa-times tag-close"></i>
                            </span>

                          </div>`
          : "";
      })
      .join("")}

                    <!-- Removed default tag item -->
                    ${enableInsight
      ? `<div class="tag-input ">
                      <input type="text" placeholder="Add Tag" />
                      <div class="tag-suggestions"></div>
                      <button class="tag-button">
                        <i class="fas fa-plus"></i>
                        Map
                      </button>
                    </div>`
      : ""
    }
          
                  </div>
                </div>
                <div class="question-content">
                    <div class="editor-attachment-container">
                        <div class="text-editor">
                            <textarea class="qeditor qeditor-${questionCount}"  id="question-text-${questionCount}" name="question-text-${questionCount}" placeholder="Enter question here...">${questionData ? questionData.question : ""
    }</textarea>
                        </div>
                    </div>
                    <div class="question-footer">
                        <div class="marks-container">
                          <input type="number" class="mark${questionCount}" id="mark${questionCount}" step="0.01" value="${marksValue}">
                          <span class="unit">Mark</span>
                        </div>
                        <div class="attachment-container">
                          <div class="setting-btn-container">
                            <div class="setting-btn" data-id="${questionCount}"><i class="bx bx-cog font-size-25" title="Setting"></i></div>
                            <div id="settings-panel" class="settings-popup" style="display: none">
                                <div class="settings-content">
                                  <div class='shuffle-settig'>
                                      <div>Evaluate Answer</div>
                                      <label class="toggle-switch">
                                          <input class="shouldEv"  ${shouldEvaluate}  data-question-count="${questionCount}"  type="checkbox"/>
                                          <span class="slider"></span>
                                      </label>
                                  </div>
                                </div>
                            </div>
                          </div>
                            <div style="position: relative; display: inline-block;">
                                <div id="attachment-container-${questionCount}" data-question-count="${questionCount}" data-question-id="${questionData && questionData._id ? questionData._id : "new"
    }" data-attachments='${JSON.stringify(
      attachments
    )}' class="attactment-upload">
                                  <i class='bx bx-folder-open font-size-25'></i>
                                    ${attachments.length > 0
      ? `
                                        <div class="attachment-count-bubble">
                                            ${attachments.length}
                                        </div>
                                    `
      : ""
    }
                              </div>
                          </div>
                          <div class="remove-question-btn" data-id="${questionCount}" title="Delete question">
                              <i class="bx bx-trash font-size-25"></i>
                          </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  $("#questions-container").append(questionHtml);

  // const editorType = "ckeditor";
  // applyEditor(`#question-text-${questionCount}`, editorType);
  oldMarksValues[questionCount] = marksValue;

  // Add attachment container click handler
  $(`#attachment-container-${questionCount}`).click(function () {
    $("#attachmentPanel").css("width", "90%");
    $("#blurOverlay").css("display", "block");
    const questionId = $(this).data("question-id");
    const questionCount = $(this).data("question-count");
    const attachments = JSON.parse($(this).attr("data-attachments") || "[]");
    const $attachmentList = $(".attachment-main-container");
    $attachmentList.empty();
    renderAttachmentsContainer(
      attachments,
      $attachmentList,
      questionId,
      questionCount
    );
  });
}

//IR
function addIrQuestion(questionData) {
  questionCount++;
  let choicesHtml = "";
  let shouldEvaluate = "checked";
  let marksValue =
    questionData && typeof questionData.marks === "number"
      ? questionData.marks
      : 1;

  if (questionData) {
    if (!questionData.shouldEvaluate) {
      shouldEvaluate = "notchecked";
    }
  }

  const attachments = questionData?.attachments || [];
  centerOrRight(questionCount);
  const questionHtml = `
            <div class="question" data-qtype="IR"  data-realid="${questionData && questionData._id ? questionData._id : "new"
    }" id="question-${questionCount}">
                <div class="question-header mt-2 qtntoggle" >
                  <span class="speech-bubble-badge">
                    IR <i class="fas fa-chevron-down"></i>
                  </span>
                 <h5> Question<span class='qcnt'> ${questionCount}</span></h5>
                  <h5 >
                      
                      <span class="toggle-icon">▼</span>
                  </h5>
                   <div class="tag-container">
                    ${(questionData?.tags || [])
      .map((tag) => {
        const matchedTag = allTags?.find(
          (t) => t.id === tag._id
        );

        return matchedTag
          ? `<div class="tag-item" data-name="${matchedTag.name
          }" data-id="${matchedTag.id}">
                            <span class="tag-chip" style="--tag-bg: ${lightenHexColor(
            matchedTag.color,
            75
          )}; --tag-color: ${matchedTag.color}">
                              ${matchedTag.name}
                              <i class="fas fa-times tag-close"></i>
                            </span>

                          </div>`
          : "";
      })
      .join("")}

                    <!-- Removed default tag item -->

                    ${enableInsight
      ? `<div class="tag-input ">
                      <input type="text" placeholder="Add Tag" />
                      <div class="tag-suggestions"></div>
                      <button class="tag-button">
                        <i class="fas fa-plus"></i>
                        Map
                      </button>
                    </div>`
      : ""
    }
          
                  </div>

                </div>
                
 
                  
              

                <div class="question-content">
                    <div class="editor-attachment-container">
                        <div class="text-editor">
                            <textarea class="qeditor qeditor-${questionCount}"  id="question-text-${questionCount}" name="question-text-${questionCount}" placeholder="Enter question here...">${questionData ? questionData.question : ""
    }</textarea>
                        </div>
                    </div>
                    <div class="question-footer">
                        <div class="marks-container">
                          <input type="number" class="mark${questionCount}" id="mark${questionCount}" step="0.01" value="${marksValue}">
                          <span class="unit">Mark</span>
                        </div>
                        <div class="attachment-container">
                          <div class="setting-btn-container">
                            <div class="setting-btn" data-id="${questionCount}"><i class="bx bx-cog font-size-25" title="Setting"></i></div>
                            <div id="settings-panel" class="settings-popup" style="display: none">
                                <div class="settings-content">
                                  <div class='shuffle-settig'>
                                      <div>Evaluate Answer</div>
                                      <label class="toggle-switch">
                                          <input class="shouldEv"  ${shouldEvaluate} data-question-count="${questionCount}"   type="checkbox"/>
                                          <span class="slider"></span>
                                      </label>
                                  </div>
                                </div>
                            </div>
                          </div>
                            <div style="position: relative; display: inline-block;">
                                <div id="attachment-container-${questionCount}" data-question-count="${questionCount}" data-question-id="${questionData && questionData._id ? questionData._id : "new"
    }" data-attachments='${JSON.stringify(
      attachments
    )}' class="attactment-upload">
                                  <i class='bx bx-folder-open font-size-25'></i>
                                    ${attachments.length > 0
      ? `
                                        <div class="attachment-count-bubble">
                                            ${attachments.length}
                                        </div>
                                    `
      : ""
    }
                              </div>
                          </div>
                          <div class="remove-question-btn" data-id="${questionCount}" title="Delete question">
                               <i class="bx bx-trash font-size-25"></i>
                          </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  $("#questions-container").append(questionHtml);

  // const editorType = "ckeditor";
  // applyEditor(`#question-text-${questionCount}`, editorType);
  oldMarksValues[questionCount] = marksValue;

  // Add attachment container click handler
  $(`#attachment-container-${questionCount}`).click(function () {
    $("#attachmentPanel").css("width", "90%");
    $("#blurOverlay").css("display", "block");
    const questionId = $(this).data("question-id");
    const questionCount = $(this).data("question-count");
    const attachments = JSON.parse($(this).attr("data-attachments") || "[]");
    const $attachmentList = $(".attachment-main-container");
    $attachmentList.empty();
    renderAttachmentsContainer(
      attachments,
      $attachmentList,
      questionId,
      questionCount
    );
  });
}

//SAQ
function addSaqQuestion(questionData) {
  questionCount++;
  let choicesHtml = "";
  let shouldEvaluate = "checked";
  let marksValue =
    questionData && typeof questionData.marks === "number"
      ? questionData.marks
      : 1;

  if (questionData) {
    if (
      questionData.shouldEvaluate !== undefined &&
      !questionData.shouldEvaluate
    ) {
      shouldEvaluate = "notchecked";
    }
  }

  const attachments = questionData?.attachments || [];
  centerOrRight(questionCount);

  const questionHtml = `
            <div class="question" data-qtype="SAQ"  data-realid="${questionData && questionData._id ? questionData._id : "new"
    }" id="question-${questionCount}">
                <div class="question-header">
                  <span class="speech-bubble-badge">
                    SAQ <i class="fas fa-chevron-down"></i>
                  </span>
<div class="qtntoggle">
                    <h5 class=' mt-2'>
                        Question<span class='qcnt'> ${questionCount}</span>
                        <span class="toggle-icon">▼</span>
                        
                    </h5>

                    <div class="tag-container">
                    ${(questionData?.tags || [])
      .map((tag) => {
        const matchedTag = allTags?.find(
          (t) => t.id === tag._id
        );

        return matchedTag
          ? `<div class="tag-item" data-name="${matchedTag.name
          }" data-id="${matchedTag.id}">
                            <span class="tag-chip" style="--tag-bg: ${lightenHexColor(
            matchedTag.color,
            75
          )}; --tag-color: ${matchedTag.color}">
                              ${matchedTag.name}
                              <i class="fas fa-times tag-close"></i>
                            </span>

                          </div>`
          : "";
      })
      .join("")}

                    

                    ${enableInsight
      ? `<div class="tag-input ">
                      <input type="text" placeholder="Add Tag" />
                      <div class="tag-suggestions"></div>
                      <button class="tag-button">
                        <i class="fas fa-plus"></i>
                        Map
                      </button>
                    </div>`
      : ""
    }
          
                  </div>
                </div>
                <div class="question-content">
                    <div class="editor-attachment-container">
                        <div class="text-editor">
                            <textarea class="qeditor qeditor-${questionCount}"  id="question-text-${questionCount}" name="question-text-${questionCount}" placeholder="Enter question here...">${questionData ? questionData.question : ""
    }</textarea>
                        </div>
                    </div>
                    <div id="response-tool-info-${questionCount}" class="response-tool-info-message" style="display: none;">
                      <div class="info-content">
                          <i class="fas fa-info-circle"></i>
                        <span class="info-text"></span>
                      </div>
                    </div>
                    <div class="question-footer">
                        <div class="marks-container">
                          <input type="number" class="mark${questionCount}" id="mark${questionCount}" step="0.01" value="${marksValue}">
                          <span class="unit">Mark</span>
                        </div>
                        <div class="attachment-container">
                          <div class="setting-btn-container">
                            <div class="setting-btn" data-id="${questionCount}"><i class="bx bx-cog font-size-25" title="Setting"></i></div>
                            <div id="settings-panel" class="settings-popup" style="display: none">
                                <div class="settings-content">
                                  <div class='shuffle-settig'>
                                      <div>Evaluate Answer</div>
                                      <label class="toggle-switch">
                                          <input class="shouldEv"  ${shouldEvaluate} data-question-count="${questionCount}"  type="checkbox"/>
                                          <span class="slider"></span>
                                      </label>
                                  </div>
                                  <div class='student-response-tool'>
                                      <div class='student-response-tool-label'>Student Response Tool</div>
                                      <div class='response-tool-options'>
                                          <div class='response-tool-option' data-tool="digital-writing">
                                              <input type="radio" id="digital-writing-${questionCount}" name="response-tool-${questionCount}" value="digital-writing" />
                                              <label for="digital-writing-${questionCount}">
                                                  Digital Writing
                                                  <span class="response-tool-info">
                                                      <span class="response-tool-info-icon">i</span>
                                                      <div class="response-tool-tooltip">
                                                          Students can write their answers digitally using a text editor or drawing pad within the exam interface.
                                                      </div>
                                                  </span>
                                              </label>
                                          </div>
                                          <div class='response-tool-option'>
                                              <input type="radio" id="qr-upload-${questionCount}" name="response-tool-${questionCount}" value="qr-upload" />
                                              <label for="qr-upload-${questionCount}">
                                                  Scan QR & Upload
                                                  <span class="response-tool-info">
                                                      <span class="response-tool-info-icon">i</span>
                                                      <div class="response-tool-tooltip">
                                                          Students can scan a QR code to access upload functionality for submitting files, images, or documents as their answer.
                                                      </div>
                                                  </span>
                                              </label>
                                          </div>
                                          <div class='response-tool-option'>
                                              <input type="radio" id="webcam-capture-${questionCount}" name="response-tool-${questionCount}" value="webcam-capture" />
                                              <label for="webcam-capture-${questionCount}">
                                                  Capture using Webcam
                                                  <span class="response-tool-info">
                                                      <span class="response-tool-info-icon">i</span>
                                                      <div class="response-tool-tooltip">
                                                          Students can use their webcam to capture photos or videos as their response, useful for practical demonstrations or visual answers.
                                                      </div>
                                                  </span>
                                              </label>
                                          </div>
                                          <div class='response-tool-option'>
                                              <input type="radio" id="audio-response-${questionCount}" name="response-tool-${questionCount}" value="audio-response" />
                                              <label for="audio-response-${questionCount}">
                                                  Audio Response
                                                  <span class="response-tool-info">
                                                      <span class="response-tool-info-icon">i</span>
                                                      <div class="response-tool-tooltip">
                                                          Students can record audio responses using their microphone, perfect for language assessments, verbal explanations, or presentations.
                                                      </div>
                                                  </span>
                                              </label>
                                          </div>
                                      </div>
                                  </div>
                                </div>
                            </div>
                          </div>
                            <div style="position: relative; display: inline-block;">
                                <div id="attachment-container-${questionCount}" data-question-count="${questionCount}" data-question-id="${questionData && questionData._id ? questionData._id : "new"
    }" data-attachments='${JSON.stringify(
      attachments
    )}' class="attactment-upload">
                                  <i class='bx bx-folder-open font-size-25'></i>
                                    ${attachments.length > 0
      ? `
                                        <div class="attachment-count-bubble">
                                            ${attachments.length}
                                        </div>
                                    `
      : ""
    }
                              </div>
                          </div>
                          <div class="remove-question-btn" data-id="${questionCount}" title="Delete question">
                               <i class="bx bx-trash font-size-25"></i>
                          </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  $("#questions-container").append(questionHtml);

  // const editorType = "ckeditor";
  // applyEditor(`#question-text-${questionCount}`, editorType);
  oldMarksValues[questionCount] = marksValue;

  // Restore Student Response Tool state if data exists (SAQ)
  if (
    questionData &&
    questionData.meta &&
    questionData.meta["student-responce-type"]
  ) {
    const studentResponseType = questionData.meta["student-responce-type"];
    const questionElement = $(`#question-${questionCount}`);

    // First, ensure all tools are unselected (radio button behavior)
    const allToolsInQuestion = questionElement.find(".response-tool-option");
    allToolsInQuestion.removeClass("selected enabled");
    allToolsInQuestion.find('input[type="radio"]').prop("checked", false);

    // Then select only one tool based on saved data (priority order: digital-writing > scan-and-edit > webcam-capture)
    if (studentResponseType["digital-writing"] === true) {
      // Select digital writing option
      const digitalWritingOption = questionElement.find(
        '.response-tool-option[data-tool="digital-writing"]'
      );
      digitalWritingOption.addClass("enabled");
      digitalWritingOption.find('input[type="radio"]').prop("checked", true);
      questionElement.attr("data-response-tool", "digital-writing");
    } else if (studentResponseType["scan-and-edit"] === true) {
      // Select QR upload option
      const qrUploadOption = questionElement
        .find('input[value="qr-upload"]')
        .closest(".response-tool-option");
      qrUploadOption.addClass("selected");
      qrUploadOption.find('input[type="radio"]').prop("checked", true);
      questionElement.attr("data-response-tool", "qr-upload");
    } else if (studentResponseType["webcam-capture"] === true) {
      // Select webcam capture option
      const webcamOption = questionElement
        .find('input[value="webcam-capture"]')
        .closest(".response-tool-option");
      webcamOption.addClass("selected");
      webcamOption.find('input[type="radio"]').prop("checked", true);
      questionElement.attr("data-response-tool", "webcam-capture");
    } else if (studentResponseType["audio-response"] === true) {
      // Select audio response option
      const audioOption = questionElement
        .find('input[value="audio-response"]')
        .closest(".response-tool-option");
      audioOption.addClass("selected");
      audioOption.find('input[type="radio"]').prop("checked", true);
      questionElement.attr("data-response-tool", "audio-response");
    }
  }

  // Add attachment container click handler
  $(`#attachment-container-${questionCount}`).click(function () {
    $("#attachmentPanel").css("width", "90%");
    $("#blurOverlay").css("display", "block");
    const questionId = $(this).data("question-id");
    const questionCount = $(this).data("question-count");
    const attachments = JSON.parse($(this).attr("data-attachments") || "[]");
    const $attachmentList = $(".attachment-main-container");
    $attachmentList.empty();
    renderAttachmentsContainer(
      attachments,
      $attachmentList,
      questionId,
      questionCount
    );
  });

  initializeResponseToolInfo(questionCount);
}

//PRQ
function addPrqQuestion(questionData) {
  questionCount++;
  let shouldEvaluate = "checked";

  if (questionData) {
    if (!questionData.shouldEvaluate) {
      shouldEvaluate = "notchecked";
    }
  }

  const marksValue =
    typeof questionData?.marks === "number" ? questionData.marks : 1;
  const language = questionData?.programmingLanguage || "c";
  const attachments = questionData?.attachments || [];

  if (questionData && !questionData.shouldEvaluate) {
    shouldEvaluate = "notchecked";
  }

  centerOrRight(questionCount);

  const questionHtml = `
      <div class="question" data-qtype="PRQ" data-realid="${questionData?._id || "new"
    }" id="question-${questionCount}">
        <div class="question-header">
          <span class="speech-bubble-badge">PRQ <i class="fas fa-chevron-down"></i></span>
          <div class="qtntoggle">
            <h5 class='mt-2'>Question<span class='qcnt'> ${questionCount}</span>
              <span class="toggle-icon">▼</span>
            </h5>

                              <div class="tag-container">
                    ${(questionData?.tags || [])
      .map((tag) => {
        const matchedTag = allTags?.find(
          (t) => t.id === tag._id
        );

        return matchedTag
          ? `<div class="tag-item" data-name="${matchedTag.name
          }" data-id="${matchedTag.id}">
                            <span class="tag-chip" style="--tag-bg: ${lightenHexColor(
            matchedTag.color,
            75
          )}; --tag-color: ${matchedTag.color}">
                              ${matchedTag.name}
                              <i class="fas fa-times tag-close"></i>
                            </span>

                          </div>`
          : "";
      })
      .join("")}

                    

                    ${enableInsight
      ? `<div class="tag-input ">
                      <input type="text" placeholder="Add Tag" />
                      <div class="tag-suggestions"></div>
                      <button class="tag-button">
                        <i class="fas fa-plus"></i>
                        Map
                      </button>
                    </div>`
      : ""
    }
          
                  </div>
          </div>
        </div>
  
        <div class="question-content">
          <div class="editor-attachment-container">
            <div class="text-editor">
              <textarea class="qeditor qeditor-${questionCount}" id="question-text-${questionCount}" name="question-text-${questionCount}" placeholder="Enter question here...">${questionData?.question || ""
    }</textarea>
            </div>
            </div>
            <div id="response-tool-info-${questionCount}" class="response-tool-info-message" style="display: none;">
                <div class="info-content">
                    <i class="fas fa-info-circle"></i>
                    <span class="info-text"></span>
                </div>
            </div>
          <div>
            <button class="open-editor-btn">Open Editor</button>
          </div>
  
          <div class="question-footer">
            <div class="marks-container">
              <input type="number" class="mark${questionCount}" id="mark${questionCount}" step="0.01" value="${marksValue}">
              <span class="unit">Mark</span>
            </div>
  
            <div class="attachment-container">

              <div class="language-selector">
                <select id="lang-select-${questionCount}" class="lang-select custom-select">
                  ${programmingLanguages
      .map(
        (lang) =>
          `<option value="${lang.id}" ${language === lang.id ? "selected" : ""
          }>${lang.name}</option>`
      )
      .join("")}
                </select>
              </div>

              <div class="setting-btn-container">
                <div class="setting-btn" data-id="${questionCount}"><i class="bx bx-cog font-size-25" title="Setting"></i></div>
                  <div id="settings-panel" class="settings-popup" style="display: none">
                    <div class="settings-content">
                        <div class='shuffle-settig'>
                          <div>Evaluate Answer</div>
                          <label class="toggle-switch">
                            <input class="shouldEv"  ${shouldEvaluate} data-question-count="${questionCount}"   type="checkbox"/>
                            <span class="slider"></span>
                          </label>
                        </div>
                        <div class='student-response-tool'>
                            <div class='student-response-tool-label'>Student Response Tool</div>
                            <div class='response-tool-options'>
                                <div class='response-tool-option'>
                                    <input type="radio" id="qr-upload-${questionCount}" name="response-tool-${questionCount}" value="qr-upload" />
                                    <label for="qr-upload-${questionCount}">
                                        Scan QR & Upload
                                        <span class="response-tool-info">
                                            <span class="response-tool-info-icon">i</span>
                                            <div class="response-tool-tooltip">
                                                Students can scan a QR code to access upload functionality for submitting files, images, or documents as their answer.
                                            </div>
                                        </span>
                                    </label>
                                </div>
                                <div class='response-tool-option'>
                                    <input type="radio" id="webcam-capture-${questionCount}" name="response-tool-${questionCount}" value="webcam-capture" />
                                    <label for="webcam-capture-${questionCount}">
                                        Capture using Webcam
                                        <span class="response-tool-info">
                                            <span class="response-tool-info-icon">i</span>
                                            <div class="response-tool-tooltip">
                                                Students can use their webcam to capture photos or videos as their response, useful for practical demonstrations or visual answers.
                                            </div>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
  
              <div style="position: relative; display: inline-block;">
                <div id="attachment-container-${questionCount}" data-question-count="${questionCount}" data-question-id="${questionData?._id || "new"
    }" data-attachments='${JSON.stringify(
      attachments
    )}' class="attactment-upload">
                  <i class='bx bx-folder-open font-size-25'></i>
                  ${attachments.length > 0
      ? `<div class="attachment-count-bubble">${attachments.length}</div>`
      : ""
    }
                </div>
              </div>
  
              <div class="remove-question-btn" data-id="${questionCount}" title="Delete question">
                <i class="bx bx-trash font-size-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

  $("#questions-container").append(questionHtml);

  // const editorType = "ckeditor";
  // applyEditor(`#question-text-${questionCount}`, editorType);
  oldMarksValues[questionCount] = marksValue;

  // Restore Student Response Tool state if data exists (PRQ)
  if (
    questionData &&
    questionData.meta &&
    questionData.meta["student-responce-type"]
  ) {
    const studentResponseType = questionData.meta["student-responce-type"];
    const questionElement = $(`#question-${questionCount}`);

    // First, ensure all tools are unselected (radio button behavior)
    const allToolsInQuestion = questionElement.find(".response-tool-option");
    allToolsInQuestion.removeClass("selected enabled");
    allToolsInQuestion.find('input[type="radio"]').prop("checked", false);

    // Then select only one tool based on saved data (priority order: digital-writing > scan-and-edit > webcam-capture)
    if (studentResponseType["digital-writing"] === true) {
      // Select digital writing option
      const digitalWritingOption = questionElement.find(
        '.response-tool-option[data-tool="digital-writing"]'
      );
      digitalWritingOption.addClass("enabled");
      digitalWritingOption.find('input[type="radio"]').prop("checked", true);
      questionElement.attr("data-response-tool", "digital-writing");
    } else if (studentResponseType["scan-and-edit"] === true) {
      // Select QR upload option
      const qrUploadOption = questionElement
        .find('input[value="qr-upload"]')
        .closest(".response-tool-option");
      qrUploadOption.addClass("selected");
      qrUploadOption.find('input[type="radio"]').prop("checked", true);
      questionElement.attr("data-response-tool", "qr-upload");
    } else if (studentResponseType["webcam-capture"] === true) {
      // Select webcam capture option
      const webcamOption = questionElement
        .find('input[value="webcam-capture"]')
        .closest(".response-tool-option");
      webcamOption.addClass("selected");
      webcamOption.find('input[type="radio"]').prop("checked", true);
      questionElement.attr("data-response-tool", "webcam-capture");
    }
  }

  // Attachment handler
  $(`#attachment-container-${questionCount}`).click(function () {
    $("#attachmentPanel").css("width", "90%");
    $("#blurOverlay").css("display", "block");
    const questionId = $(this).data("question-id");
    const qCount = $(this).data("question-count");
    const attachments = JSON.parse($(this).attr("data-attachments") || "[]");
    const $attachmentList = $(".attachment-main-container");
    $attachmentList.empty();
    renderAttachmentsContainer(
      attachments,
      $attachmentList,
      questionId,
      qCount
    );
  });

  initializeResponseToolInfo(questionCount);
}

//MCQ
function addMcqQuestion(questionData) {
  questionCount++;
  const globalShuffleOptions = $("#shuffle-options-toggle").prop("checked");
  let shouldShuffleOptions = globalShuffleOptions ? "checked" : "notchecked";
  let shouldEvaluate = "checked";

  let marksValue =
    questionData && typeof questionData.marks === "number"
      ? questionData.marks
      : 1;

  let choicesHtml = "";
  if (questionData) {
    questionData.choices.forEach((choice) => {
      choicesHtml += createChoiceHtml(
        questionData,
        questionCount,
        choice.key,
        choice.label,
        questionData?.correctChoices?.length > 0 &&
        questionData?.correctChoices[0] === choice.key
      );
    });
    if (questionData.shouldShuffleOptions !== undefined) {
      shouldShuffleOptions = questionData.shouldShuffleOptions ? "checked" : "notchecked";
    }
    if (
      questionData.shouldEvaluate !== undefined &&
      !questionData.shouldEvaluate
    ) {
      shouldEvaluate = "notchecked";
      marksValue = 0;
    } else {
      marksValue = questionData.marks || 1;
    }
  } else {
    choicesHtml = `
                ${createChoiceHtml(questionData, questionCount, "A")}
                ${createChoiceHtml(questionData, questionCount, "B")}
                ${createChoiceHtml(questionData, questionCount, "C")}
                ${createChoiceHtml(questionData, questionCount, "D")}
            `;
  }

  centerOrRight(questionCount);
  const attachments = questionData?.attachments || [];

  const questionHtml = `
                <div class="question" data-qtype="MCQ"  data-realid="${questionData && questionData._id ? questionData._id : "new"
    }" id="question-${questionCount}">
                <div class="question-header">
                  <span class="speech-bubble-badge">
                    MCQ <i class="fas fa-chevron-down"></i> 
                  </span>

                  <div class="qtntoggle">
                    <h5 class=' mt-2'>
                        Question<span class='qcnt'> ${questionCount}</span>
                        <span class="toggle-icon">▼</span>
                        
                    </h5>

                    <div class="tag-container">
                    ${(questionData?.tags || [])
      .map((tag) => {
        const matchedTag = allTags?.find(
          (t) => t.id === tag._id
        );

        return matchedTag
          ? `<div class="tag-item" data-name="${matchedTag.name
          }" data-id="${matchedTag.id}">
                            <span class="tag-chip" style="--tag-bg: ${lightenHexColor(
            matchedTag.color,
            75
          )}; --tag-color: ${matchedTag.color}">
                              ${matchedTag.name}
                              <i class="fas fa-times tag-close"></i>
                            </span>

                          </div>`
          : "";
      })
      .join("")}

                    

                    ${enableInsight
      ? `<div class="tag-input ">
                      <input type="text" placeholder="Add Tag" />
                      <div class="tag-suggestions"></div>
                      <button class="tag-button">
                        <i class="fas fa-plus"></i>
                        Map
                      </button>
                    </div>`
      : ""
    }
          
                  </div>

                  
                </div>
                <div class="question-content ">
                    <div class=" editor-attachment-container " >
                        <div class="text-editor">
                            <textarea class="qeditor qeditor-${questionCount}"  id="question-text-${questionCount}" name="question-text-${questionCount}" style="flex: 0 0 90%;" placeholder="Enter question here...">${questionData ? questionData.question : ""
    }</textarea>
                        </div>
                    </div>
                    <label>Choices</label>
                    <div class="choices" id="choices-${questionCount}">
                        ${choicesHtml.replace(
      /<textarea/g,
      '<textarea placeholder="Enter choice text..."'
    )}
                    </div>
                    <div class="question-footer">
                        <div class="marks-container">
                          <input type="number" class="mark${questionCount}" id="mark${questionCount}" step="0.01" value="${marksValue}">
                          <span class="unit">Mark</span>
                        </div>
                        <div class="attachment-container">
                          <div class="add-choice-btn" data-id="${questionCount}"><i class="bx bx-plus-circle font-size-25"  title="add Choice"></i></div>
                          <div class="setting-btn-container">
                            <div class="setting-btn" data-id="${questionCount}"><i class="bx bx-cog font-size-25" title="Setting"></i></div>
                            <div id="settings-panel" class="settings-popup" style="display: none">
                                <div class="settings-content">
                                  <div class='shuffle-settig'>
                                      <div>Shuffle Options</div>
                                      <label class="toggle-switch">
                                          <input class="shuffleOption" ${shouldShuffleOptions} type="checkbox"/>
                                          <span class="slider"></span>
                                      </label>
                                  </div>
                                  <div class='shuffle-settig'>
                                      <div>Evaluate Answer</div>
                                      <label class="toggle-switch">
                                          <input class="shouldEv" ${shouldEvaluate} data-question-count="${questionCount}"  type="checkbox"/>
                                          <span class="slider"></span>
                                      </label>
                                  </div>
                                </div>
                            </div>
                          </div>
                          <div style="cursor: pointer; position: relative; display: inline-block;">
                              <div id="attachment-container-${questionCount}" data-question-count="${questionCount}" data-question-id="${questionData && questionData._id ? questionData._id : " new"
    }" data-attachments='${JSON.stringify(
      attachments
    )}' class="attactment-upload">
                                  <i class='bx bx-folder-open font-size-25'></i>
                                  ${attachments.length > 0
      ? `
                                  <div class="attachment-count-bubble">
                                      ${attachments.length}
                                  </div>
                                  `
      : ""
    }
                              </div>
                          </div>
                          <div class="remove-question-btn" data-id="${questionCount}" title="Delete question">
                              <i class="bx bx-trash font-size-25"></i>
                          </div>
                        </div>
                    </div>
            </div>
        `;
  $("#questions-container").append(questionHtml);

  // Apply the editor to the question text
  // const editorType = "ckeditor";
  // applyEditor(`#question-text-${questionCount}`, editorType);
  // $(`#choices-${questionCount} .choice-editor`).each(function () {
  //   applyEditor(this, editorType);
  // });
  oldMarksValues[questionCount] = marksValue;

  $(`#attachment-container-${questionCount}`).click(function () {
    $("#attachmentPanel").css("width", "90%");
    $("#blurOverlay").css("display", "block");

    const questionId = $(this).data("question-id");
    const questionCount = $(this).data("question-count");

    // Get attachments array
    const attachments = JSON.parse($(this).attr("data-attachments") || "[]");
    const $attachmentList = $(".attachment-main-container");

    // Clear existing content
    $attachmentList.empty();

    renderAttachmentsContainer(
      attachments,
      $attachmentList,
      questionId,
      questionCount
    );
  });
}

//TF
function addTFQuestion(questionData) {
  questionCount++;
  let shouldEvaluate = "checked";
  if (questionData) {
    if (!questionData.shouldEvaluate) {
      shouldEvaluate = "notchecked";
    }
  }
  let marksValue =
    questionData && typeof questionData.marks === "number"
      ? questionData.marks
      : 1;

  const attachments = questionData?.attachments || [];
  // Default correct answer (if available from existing data, otherwise default to True)
  const correctAnswer = questionData?.correctChoices[0] || "true";
  centerOrRight(questionCount);
  const questionHtml = `
                <div class="question" data-qtype="TF"  data-realid="${questionData && questionData._id ? questionData._id : "new"
    }" id="question-${questionCount}">
                <div class="question-header">
                  <span class="speech-bubble-badge">
                    TF <i class="fas fa-chevron-down"></i> 
                  </span>

                  <div class="qtntoggle">
                    <h5 class='mt-2'>
                        Question<span class='qcnt'> ${questionCount}</span>
                        <span class="toggle-icon">▼</span>
                    </h5>

                    <div class="tag-container">
                    ${(questionData?.tags || [])
      .map((tag) => {
        const matchedTag = allTags?.find(
          (t) => t.id === tag._id
        );

        return matchedTag
          ? `<div class="tag-item" data-name="${matchedTag.name
          }" data-id="${matchedTag.id}">
                            <span class="tag-chip" style="--tag-bg: ${lightenHexColor(
            matchedTag.color,
            75
          )}; --tag-color: ${matchedTag.color}">
                              ${matchedTag.name}
                              <i class="fas fa-times tag-close"></i>
                            </span>
                          </div>`
          : "";
      })
      .join("")}

                    ${enableInsight
      ? `<div class="tag-input">
                      <input type="text" placeholder="Add Tag" />
                      <div class="tag-suggestions"></div>
                      <button class="tag-button">
                        <i class="fas fa-plus"></i>
                        Map
                      </button>
                    </div>`
      : ""
    }
                  </div>
                </div>
                <div class="question-content">
                    <div class="editor-attachment-container">
                        <div class="text-editor">
                            <textarea class="qeditor qeditor-${questionCount}" id="question-text-${questionCount}" name="question-text-${questionCount}" style="flex: 0 0 90%;" placeholder="Enter question here...">${questionData ? questionData.question : ""
    }</textarea>
                        </div>
                    </div>
                    <div class="true-false-label-container">
                        <label class="option-heading">Select the correct answer:</label>
                    </div>

                    <div id="true-or-false-container-${questionCount}" class="true-or-false-container">
                      <div class="true-or-false-option ${correctAnswer === "true" ? "selected" : ""
    }">
                        <input type="radio" name="true-or-false-${questionCount}" id="true-or-false-option-${questionCount}-1" ${correctAnswer === "true" ? "checked" : ""
    } value="true" />
                        <label data-name="true" for="true-or-false-option-${questionCount}-1">True</label>
                      </div>

                      <div class="true-or-false-option ${correctAnswer === "false" ? "selected" : ""
    }">
                        <input type="radio" name="true-or-false-${questionCount}" id="true-or-false-option-${questionCount}-2" ${correctAnswer === "false" ? "checked" : ""
    } value="false" />
                        <label data-name="false" for="true-or-false-option-${questionCount}-2">False</label>
                      </div>
                    </div>
                    
                    <div class="question-footer">
                        <div class="marks-container">
                          <input type="number" class="mark${questionCount}" id="mark${questionCount}" step="0.01" value="${marksValue}">
                          <span class="unit">Mark</span>
                        </div>
                        <div class="attachment-container">
                           <div class="setting-btn-container">
                            <div class="setting-btn" data-id="${questionCount}"><i class="bx bx-cog font-size-25" title="Setting"></i></div>
                             <div id="settings-panel" class="settings-popup" style="display: none">
                                <div class="settings-content">
                                  <div class='shuffle-settig'>
                                      <div>Evaluate Answer</div>
                                      <label class="toggle-switch">
                                          <input class="shouldEv"  ${shouldEvaluate} data-question-count="${questionCount}"  type="checkbox"/>
                                          <span class="slider"></span>
                                      </label>
                                  </div>
                                </div>
                            </div>
                          </div>
                          <div style="cursor: pointer; position: relative; display: inline-block;">
                              <div id="attachment-container-${questionCount}" data-question-count="${questionCount}" data-question-id="${questionData && questionData._id ? questionData._id : " new"
    }" data-attachments='${JSON.stringify(
      attachments
    )}' class="attactment-upload">
                                  <i class='bx bx-folder-open font-size-25'></i>
                                  ${attachments.length > 0
      ? `
                                  <div class="attachment-count-bubble">
                                      ${attachments.length}
                                  </div>
                                  `
      : ""
    }
                              </div>
                          </div>
                          <div class="remove-question-btn" data-id="${questionCount}" title="Delete question">
                              <i class="bx bx-trash font-size-25"></i>
                          </div>
                        </div>
                    </div>
            </div>
        `;
  $("#questions-container").append(questionHtml);

  // const editorType = "ckeditor";
  // applyEditor(`#question-text-${questionCount}`, editorType);

  oldMarksValues[questionCount] = marksValue;

  $(`#attachment-container-${questionCount}`).click(function () {
    $("#attachmentPanel").css("width", "90%");
    $("#blurOverlay").css("display", "block");

    const questionId = $(this).data("question-id");
    const questionCount = $(this).data("question-count");

    // Get attachments array
    const attachments = JSON.parse($(this).attr("data-attachments") || "[]");
    const $attachmentList = $(".attachment-main-container");

    // Clear existing content
    $attachmentList.empty();

    renderAttachmentsContainer(
      attachments,
      $attachmentList,
      questionId,
      questionCount
    );
  });

  $(document).on("click", ".true-or-false-option", function () {
    const option = $(this);

    const otherOption = option.siblings(".true-or-false-option").not(option);

    option.addClass("selected");
    otherOption.removeClass("selected");
    option.find("input").prop("checked", true);
    otherOption.find("input").prop("checked", false);
  });
}

//OR - Ordering question
function addOrQuestion(questionData) {
  questionCount++;
  let shouldEvaluate = "checked";
  const marksValue =
    typeof questionData?.marks === "number" ? questionData.marks : 1;
  const attachments = questionData?.attachments || [];
  const correctOrder = questionData?.correctOrder || [];
  if (questionData && !questionData.shouldEvaluate) {
    shouldEvaluate = "notchecked";
  }
  centerOrRight(questionCount);

  const questionHtml = `
      <div class="question" data-qtype="OR" data data-realid="${questionData?._id || "new"
    }" id="question-${questionCount}">
        <div class="question-header">
          <span class="speech-bubble-badge">OR <i class="fas fa-chevron-down"></i></span>
          <div class="qtntoggle">
            <h5 class='mt-2'>Question<span class='qcnt'> ${questionCount}</span>
              <span class="toggle-icon">▼</span>
            </h5>

            <div class="tag-container">
              ${(questionData?.tags || [])
      .map((tag) => {
        const matchedTag = allTags?.find((t) => t.id === tag._id);
        return matchedTag
          ? `<div class="tag-item" data-name="${matchedTag.name
          }" data-id="${matchedTag.id}">
                      <span class="tag-chip" style="--tag-bg: ${lightenHexColor(
            matchedTag.color,
            75
          )}; --tag-color: ${matchedTag.color}">
                        ${matchedTag.name}
                        <i class="fas fa-times tag-close"></i>
                      </span>
                    </div>`
          : "";
      })
      .join("")}

              ${enableInsight
      ? `<div class="tag-input ">
                    <input type="text" placeholder="Add Tag" />
                    <div class="tag-suggestions"></div>
                    <button class="tag-button">
                      <i class="fas fa-plus"></i>
                      Map
                    </button>
                  </div>`
      : ""
    }
            </div>
          </div>
        </div>
  
        <div class="question-content">
          <div class="editor-attachment-container">
            <div class="text-editor">
              <textarea class="qeditor qeditor-${questionCount}" id="question-text-${questionCount}" name="question-text-${questionCount}" placeholder="Enter question here...">${questionData?.question || ""
    }</textarea>
            </div>
          </div>
          
          <!-- Ordering Items Container -->
          <div class="ordering-items-container" id="ordering-items-${questionCount}">
            <h6>Create and Arrange Items in Correct Order</h6>
            <div class="ordering-items-header">
              <input type="text" class="ordering-item-input" placeholder="Type an answer and press enter or click the plus icon">
              <button class="btn btn-primary save-edit-or-item-btn" title="Add item">
               save
              </button>
              <button class="btn btn-primary add-ordering-item-btn" data-qid="${questionCount}" title="Add item">
                <i class="fas fa-plus"></i>
              </button>
            </div>
            <div class="ordering-items-list" id="ordering-items-list-${questionCount}">
              ${(questionData?.correctOrder || []).length > 0
      ? questionData.correctOrder
        .map((order, index) => {
          const itemId = `order-${Date.now()}-${index}`;

          return `
                   <div class="ordering-item ordering-item-${itemId}" data-item-id="${index}" title="Drag to reorder">
         <div class="drag-handle ordering-item-drag-handle">
                   <div class="drag-handle-icon"><i class="fas fa-grip-lines"></i></div>
          <div class="item-content">
            <div class="ordering-item-text" id="ordering-item-text-${itemId}">${order}</div>
          </div>
          <div class="item-actions">
            <button class="edit-or-item" data-item-id="${itemId}" data-text="${order}" title="edit item">
              <i class="fas fa-edit"></i>
            </button> 
            <button class="remove-ordering-item-btn" title="Remove item">
              <i class="fas fa-trash remove-ordering-item-icon"></i>
            </button>
          </div>
         </div>
        </div>
                        `;
        })
        .join("")
      : `<div class="empty-ordering-list-message">
                  <i class="fas fa-info-circle"></i> 
                  <p>Please add at least one item to create an ordering question.</p>
                  <p>Type an item above and press Enter or click the plus button.</p>
                </div>`
    }
            </div>
            <div class="ordering-instructions text-muted mt-2">
              <small><i class="fas fa-info-circle"></i> Drag items to arrange them in the correct order. The sequence shown here will be considered the correct answer.</small>
            </div>
          </div>
  
          <div class="question-footer">
            <div class="marks-container">
              <input type="number" class="mark${questionCount}" id="mark${questionCount}" step="0.01" value="${marksValue}">
              <span class="unit">Mark</span>
            </div>
  
            <div class="attachment-container">
              <div class="setting-btn-container">
                <div class="setting-btn" data-id="${questionCount}"><i class="bx bx-cog font-size-25" title="Setting"></i></div>
                <div id="settings-panel" class="settings-popup" style="display: none">
                  <div class="settings-content">
                      <div class='shuffle-settig'>
                        <div>Evaluate Answer</div>
                        <label class="toggle-switch">
                          <input class="shouldEv" ${shouldEvaluate} data-question-count="${questionCount}"  type="checkbox"/>
                          <span class="slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
  
              <div style="position: relative; display: inline-block;">
                <div id="attachment-container-${questionCount}" data-question-count="${questionCount}" data-question-id="${questionData?._id || "new"
    }" data-attachments='${JSON.stringify(
      attachments
    )}' class="attactment-upload">
                  <i class='bx bx-folder-open font-size-25'></i>
                  ${attachments.length > 0
      ? `<div class="attachment-count-bubble">${attachments.length}</div>`
      : ""
    }
                </div>
              </div>
  
              <div class="remove-question-btn" data-id="${questionCount}" title="Delete question">
                <i class="bx bx-trash font-size-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

  $("#questions-container").append(questionHtml);

  // const editorType = "ckeditor";
  // applyEditor(`#question-text-${questionCount}`, editorType);
  oldMarksValues[questionCount] = marksValue;

  // Initialize the sortable for ordering items
  $(`#ordering-items-list-${questionCount}`).sortable({
    handle: ".drag-handle", // Use the drag handle section instead of the entire item
    placeholder: "ordering-item-placeholder",
    cursor: "grabbing",
    tolerance: "pointer",
    axis: "y",
    revert: 200,
    scroll: true,
    helper: function (e, item) {
      // Create a helper that maintains width
      const helper = $(item).clone();
      helper.width($(item).width());
      helper.height($(item).height());
      return helper;
    },
    opacity: 0.85,
    start: function (e, ui) {
      // Add class to show item is being dragged
      ui.helper.addClass("dragging-item");
      // Create a nice placeholder with instructions
      ui.placeholder.html('<div class="placeholder-text">Drop here</div>');
      // Match the height of the original item
      ui.placeholder.css("height", ui.item.outerHeight());
    },
    stop: function (e, ui) {
      // Remove dragging class
      ui.item.removeClass("dragging-item");
    },
    update: function (event, ui) {
      // Update correctOrder array when items are reordered
      const orderedItems = [];
      $(`#ordering-items-list-${questionCount} .ordering-item`).each(
        function () {
          orderedItems.push($(this).find(".ordering-item-text").text());
        }
      );

      // Store the correct order as a data attribute on the container
      $(`#ordering-items-${questionCount}`).data("correctOrder", orderedItems);

      // Explicitly store as data-* attribute as well for persistence
      $(`#ordering-items-${questionCount}`).attr(
        "data-correct-order",
        JSON.stringify(orderedItems)
      );

      console.log("Items reordered, new order:", orderedItems);
    },
  });

  // Make sure touch devices can also drag and drop
  $(`#ordering-items-list-${questionCount}`).disableSelection();

  // Add a visual indicator for touch devices
  if ("ontouchstart" in window) {
    $(`#ordering-items-${questionCount}`).addClass("touch-device");
  }

  // Use improved event delegation for removing items
  $(document).on(
    "click",
    ".ordering-items-list .remove-ordering-item-btn",
    function () {
      $(".add-ordering-item-btn").show();
      $(".save-edit-or-item-btn").hide();
      // $(".ordering-item-input").val("");
      const $item = $(this).closest(".ordering-item");
      const questionCount = $(this)
        .closest(".ordering-items-list")
        .attr("id")
        .replace("ordering-items-list-", "");

      $item.remove();

      // Update correct order after removal
      const updatedItems = [];
      $(`#ordering-items-list-${questionCount} .ordering-item`).each(
        function () {
          updatedItems.push($(this).find(".ordering-item-text").text());
        }
      );

      // Store as jQuery data attribute
      $(`#ordering-items-${questionCount}`).data("correctOrder", updatedItems);

      // Also store as HTML data-* attribute for persistence
      $(`#ordering-items-${questionCount}`).attr(
        "data-correct-order",
        JSON.stringify(updatedItems)
      );

      // Check if list is now empty, if so, add the empty message back
      if (
        $(`#ordering-items-list-${questionCount} .ordering-item`).length === 0
      ) {
        const emptyMessage = `
            <div class="empty-ordering-list-message">
              <i class="fas fa-info-circle"></i> 
              <p>Please add at least one item to create an ordering question.</p>
              <p>Type an item above and press Enter or click the plus button.</p>
            </div>
          `;
        $(`#ordering-items-list-${questionCount}`).append(emptyMessage);
      }

      console.log("Item removed, new order:", updatedItems);
    }
  );

  // Add item on Enter key press in input with event delegation
  $(document).on("keypress", ".ordering-item-input", function (e) {
    if (e.which === 13) {
      e.preventDefault();
      const inputField = $(this);
      const itemText = inputField.val().trim();
      const container = inputField.closest(".ordering-items-container");
      const questionCount = container.attr("id").replace("ordering-items-", "");

      if (!itemText) return;

      if (editingItemId) {
        // EDIT MODE: Save edited item
        $(`.ordering-item-${editingItemId} .ordering-item-text`).text(itemText);
        editingItemId = null;
        $(".save-edit-or-item-btn").hide();
        $(".add-ordering-item-btn").show();
      } else {
        // ADD MODE: Add new item
        const itemId = new Date().getTime();
        const newItem = `
        <div class="ordering-item ordering-item-${itemId}" data-item-id="${itemId}" title="Drag to reorder">
         <div class="drag-handle ordering-item-drag-handle">
                   <div class="drag-handle-icon"><i class="fas fa-grip-lines"></i></div>
          <div class="item-content">
            <div class="ordering-item-text" id="ordering-item-text-${itemId}">${itemText}</div>
          </div>
          <div class="item-actions">
            <button class="edit-or-item" data-item-id="${itemId}" data-text="${itemText}" title="edit item">
              <i class="fas fa-edit"></i>
            </button> 
            <button class="remove-ordering-item-btn" title="Remove item">
              <i class="fas fa-trash"></i>
            </button>
          </div>
         </div>
        </div>
      `;
        $(`#ordering-items-list-${questionCount}`).append(newItem);
      }

      inputField.val("");

      // Update correct order
      const orderedItems = [];
      $(`#ordering-items-list-${questionCount} .ordering-item`).each(
        function () {
          orderedItems.push($(this).find(".ordering-item-text").text());
        }
      );

      container
        .data("correctOrder", orderedItems)
        .attr("data-correct-order", JSON.stringify(orderedItems));
    }
  });

  // Change from direct binding to event delegation for better reliability
  // Add item on plus button click - replaced with event delegation
$(document).on("keydown", ".ordering-item-input", function (e) {
  if (e.key === "Enter" || e.which === 13) {
    e.preventDefault();
    const $question = $(this).closest(".question");

    const $saveBtn = $question.find(".save-edit-or-item-btn:visible");
    if ($saveBtn.length) {
      $saveBtn.trigger("click"); // Save if in edit mode
      return;
    }

    const $addBtn = $question.find(".add-ordering-item-btn:visible");
    if ($addBtn.length) {
      $addBtn.trigger("click"); // Otherwise, add new
    }
  }
});



  
  $(document).on(
    "click",
    `.ordering-items-container .add-ordering-item-btn`,
    function () {
      const questionCount = $(this).data("qid");
      const inputField = $(
        `#ordering-items-${questionCount} .ordering-item-input`
      );
      const itemText = inputField.val().trim();

      if (itemText) {
        // Remove empty list message if present
        $(
          `#ordering-items-list-${questionCount} .empty-ordering-list-message`
        ).remove();

        const itemId = new Date().getTime();
        const newItem = `
        <div class="ordering-item ordering-item-${itemId}" data-item-id="${itemId}" title="Drag to reorder">
         <div class="drag-handle ordering-item-drag-handle">
                   <div class="drag-handle-icon"><i class="fas fa-grip-lines"></i></div>
          <div class="item-content">
            <div class="ordering-item-text" id="ordering-item-text-${itemId}">${itemText}</div>
          </div>
          <div class="item-actions">
            <button class="edit-or-item" data-item-id="${itemId}" data-text="${itemText}" title="edit item">
              <i class="fas fa-edit"></i>
            </button> 
            <button class="remove-ordering-item-btn" title="Remove item">
              <i class="fas fa-trash"></i>
            </button>
          </div>
         </div>
        </div>
        `;

        $(`#ordering-items-list-${questionCount}`).append(newItem);
        inputField.val("");

        // Update correct order
        const orderedItems = [];
        $(`#ordering-items-list-${questionCount} .ordering-item`).each(
          function () {
            orderedItems.push($(this).find(".ordering-item-text").text());
          }
        );

        // Save the correct order to the data attribute
        $(`#ordering-items-${questionCount}`).data(
          "correctOrder",
          orderedItems
        );

        // Explicitly store as data-* attribute as well to ensure persistence
        $(`#ordering-items-${questionCount}`).attr(
          "data-correct-order",
          JSON.stringify(orderedItems)
        );

        // Remove any existing handler for the newly added item's remove button
        $(
          `#ordering-items-list-${questionCount} .ordering-item[data-item-id="${itemId}"] .remove-ordering-item-btn`
        ).off("click");
      }
    }
  );

  // Attachment handler
  $(`#attachment-container-${questionCount}`).click(function () {
    $("#attachmentPanel").css("width", "90%");
    $("#blurOverlay").css("display", "block");
    const questionId = $(this).data("question-id");
    const qCount = $(this).data("question-count");
    const attachments = JSON.parse($(this).attr("data-attachments") || "[]");
    const $attachmentList = $(".attachment-main-container");
    $attachmentList.empty();
    renderAttachmentsContainer(
      attachments,
      $attachmentList,
      questionId,
      qCount
    );
  });
}

//MTF
function addMTFQuestion(questionData) {
  questionCount++;
  let shouldEvaluate = "checked";
    const globalShuffleOptions = $("#shuffle-options-toggle").prop("checked");
    let shouldShuffleOptions = globalShuffleOptions ? "checked" : "notchecked";
  if (questionData) {
    if (!questionData.shouldEvaluate) {
      shouldEvaluate = "notchecked";
    }
  }

  let marksValue =
    questionData && typeof questionData?.marks === "number"
      ? questionData.marks
      : 1;

  let questionText = questionData?.question || "";

  if (questionText.endsWith("</p>")) {
    questionText = questionText.slice(0, -4);
  }

  let questionTitle = "";
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
  var counter = 1;
  while ((matchResult = regex.exec(content)) !== null) {
    var answerText = matchResult[2].trim();
    if (answerText) {
      extractedMatches.push(answerText);
    }
    counter++;
  }
  if (extractedMatches.length > 0) {
    questionText = "<p>" + questionTitle + "</p>";
  }

  if (questionData) {
        if (questionData.shouldShuffleOptions !== undefined) {
      shouldShuffleOptions = questionData.shouldShuffleOptions ? "checked" : "notchecked";
    }
    if (
      questionData.shouldEvaluate !== undefined &&
      !questionData.shouldEvaluate
    ) {
      shouldEvaluate = "notchecked";
      marksValue = 0;
    } 
  }

  const attachments = questionData?.attachments || [];

  const matches = questionData?.blanks || [];

  centerOrRight(questionCount);

  const questionHtml = `
            <div class="question" data-qtype="MTF"  data-realid="${questionData && questionData._id ? questionData._id : "new"
    }" id="question-${questionCount}">
                <div class="question-header">
                  <span class="speech-bubble-badge">
                    MTF <i class="fas fa-chevron-down"></i>
                  </span>
                  <div class="qtntoggle">
                      <h5 class='mt-2 question-header-title'>
                        Question<span class='qcnt'> ${questionCount}</span>
                        <span class="toggle-icon">▼</span>
                      </h5>
                      <div class="tag-container">
                        ${(questionData?.tags || [])
      .map((tag) => {
        const matchedTag = allTags?.find(
          (t) => t.id === tag._id
        );

        return matchedTag
          ? `<div class="tag-item" data-name="${matchedTag.name
          }" data-id="${matchedTag.id}">
                                <span class="tag-chip" style="--tag-bg: ${lightenHexColor(
            matchedTag.color,
            75
          )}; --tag-color: ${matchedTag.color}">
                                  ${matchedTag.name}
                                  <i class="fas fa-times tag-close"></i>
                                </span>

                              </div>`
          : "";
      })
      .join("")}

                        <!-- Removed default tag item -->

                        ${enableInsight
      ? `<div class="tag-input ">
                          <input type="text" placeholder="Add Tag" />
                          <div class="tag-suggestions"></div>
                          <button class="tag-button">
                            <i class="fas fa-plus"></i>
                            Map
                          </button>
                        </div>`
      : ""
    }
              
                      </div>
                  </div>
                </div>
                <div class="question-content">
                    <div class="editor-attachment-container">
                        <div class="text-editor">
                            <textarea class="qeditor qeditor-${questionCount}"  id="question-text-${questionCount}" name="question-text-${questionCount}" placeholder="Enter question with matches...">${questionData ? questionTitle : ""
    }</textarea>
                        </div>
                    </div>
                    <div class="matches-answers" id="matches-answers-${questionCount}">
                    <h6 class="match-answer-heading">Enter Question with correct answer</h6>
                        ${matches.length > 0
      ? matches
        .map(
          (match, matchIndex) => `
                          <div class="match-container" data-match-id="match-${questionCount}-${matchIndex + 1
            }"> 
                              <span class="match-number">${matchIndex + 1
            }</span>
                              <div class="match-question-answer-container">
                                  <input type="text" class="match-question" value="${extractedMatches[matchIndex] || ""
            }" placeholder="Enter question">
                                  <span class="match-arrow"><i class="fas fa-arrow-right"></i></span>
                                  <input type="text" class="match-answer" value="${match?.values[0]?.value
            }" placeholder="Enter answer">
                              </div>
                                            <button type="button" class="remove-match-btn">
                                                      <i class="fas fa-times"></i>
                                                  </button>
                          </div>    `
        )
        .join("")
      : `
                                              <div class="match-container" data-match-id="match-${questionCount}-1"> 
                                                  <span class="match-number">1</span>
                                                                                    <div class="match-question-answer-container">
                                      <input type="text" class="match-question" placeholder="Enter question">
                                      <span class="match-arrow"><i class="fas fa-arrow-right"></i></span>
                                      <input type="text" class="match-answer"  placeholder="Enter answer">
                                  </div>
                                  <button type="button" class="remove-match-btn">
                                      <i class="fas fa-times"></i>
                                  </button>
                              </div>`
    }
                    </div>
                    <div class="question-footer">
                        <div class="marks-container">
                          <input type="number" class="mark${questionCount}" id="mark${questionCount}" step="0.01" value="${marksValue}">
                          <span class="unit">Mark</span>
                        </div>
                        <div class="attachment-container">
                          <div class="add-match-btn" data-id="${questionCount}"><i class="bx bx-plus-circle font-size-25" title="add match"></i></div>
                          <div class="setting-btn-container">
                            <div class="setting-btn" data-id="${questionCount}"><i class="bx bx-cog font-size-25" title="Setting"></i></div>
                              <div id="settings-panel" class="settings-popup" style="display: none">
                                  <div class="settings-content">
                                           <div class='shuffle-settig'>
                                      <div>Shuffle Options</div>
                                      <label class="toggle-switch">
                                          <input class="shuffleOption" ${shouldShuffleOptions} type="checkbox"/>
                                          <span class="slider"></span>
                                      </label>
                                  </div>
                                    <div class='shuffle-settig'>
                                        <div>Evaluate Answer</div>
                                        <label class="toggle-switch">
                                            <input class="shouldEv" data-question-count="${questionCount}"  ${shouldEvaluate}   type="checkbox"/>
                                            <span class="slider"></span>
                                        </label>
                                    </div>
                                  </div>
                              </div>
                            </div>
                            <div style="position: relative; display: inline-block;">
                                <div id="attachment-container-${questionCount}" data-question-count="${questionCount}" data-question-id="${questionData && questionData._id ? questionData._id : "new"
    }" data-attachments='${JSON.stringify(
      attachments
    )}' class="attactment-upload">
                                    <i class='bx bx-folder-open font-size-25'></i>
                                    ${attachments.length > 0
      ? `
                                        <div class="attachment-count-bubble">
                                            ${attachments.length}
                                        </div>
                                      `
      : ""
    }
                                </div>
                            </div>
                          <div class="remove-question-btn" data-id="${questionCount}" title="Delete question">
                              <i class="bx bx-trash font-size-25"></i>
                          </div>
                        </div>
                    </div>
                </div>
              
            </div>
        `;
  $("#questions-container").append(questionHtml);
  oldMarksValues[questionCount] = marksValue;

  // Initialize editor with proper error handling
  // applyEditor(`#question-text-${questionCount}`, "ckeditor", true);

  $(`#attachment-container-${questionCount}`).click(function () {
    $("#attachmentPanel").css("width", "90%");
    $("#blurOverlay").css("display", "block");

    const questionId = $(this).data("question-id");
    const questionCount = $(this).data("question-count");

    // Get attachments array
    const attachments = JSON.parse($(this).attr("data-attachments") || "[]");
    const $attachmentList = $(".attachment-main-container");

    // Clear existing content
    $attachmentList.empty();

    renderAttachmentsContainer(
      attachments,
      $attachmentList,
      questionId,
      questionCount
    );
  });
  checkAndHideAddMatchBtn(questionCount, matches.length);
  $(this).siblings(".match-count").text(`matches: ${matches.length}`);

  // Initialize the state of remove buttons
  if (typeof updateMatchRemoveButtons === "function") {
    updateMatchRemoveButtons(questionCount);
  }
}

//FTB
function addFtbQuestion(questionData) {
  questionCount++;
  const globalShuffleOptions = $("#shuffle-options-toggle").prop("checked");
  let shouldShuffleOptions = globalShuffleOptions ? "checked" : "notchecked";
  let shouldEvaluate = "checked";
  let marksValue =
    questionData && typeof questionData?.marks === "number"
      ? questionData.marks
      : 1;

  if (questionData) {
    if (questionData.shouldShuffleOptions !== undefined) {
      shouldShuffleOptions = questionData.shouldShuffleOptions ? "checked" : "notchecked";
    }
    if (!questionData.shouldEvaluate) {
      shouldEvaluate = "notchecked";
    }
  }

  const attachments = questionData?.attachments || [];

  const blanks = questionData?.blanks || [];

  centerOrRight(questionCount);

  const questionHtml = `
            <div class="question" data-qtype="FTB"  data-realid="${questionData && questionData._id ? questionData._id : "new"
    }" id="question-${questionCount}">
                <div class="question-header">
                  <span class="speech-bubble-badge">
                    FTB <i class="fas fa-chevron-down"></i>
                  </span>
                  <div class="qtntoggle">
                      <h5 class='mt-2 question-header-title'>
                        Question<span class='qcnt'> ${questionCount}</span>
                        <span class="toggle-icon">▼</span>
                      </h5>
                      <div class="tag-container">
                        ${(questionData?.tags || [])
      .map((tag) => {
        const matchedTag = allTags?.find(
          (t) => t.id === tag._id
        );

        return matchedTag
          ? `<div class="tag-item" data-name="${matchedTag.name
          }" data-id="${matchedTag.id}">
                                <span class="tag-chip" style="--tag-bg: ${lightenHexColor(
            matchedTag.color,
            75
          )}; --tag-color: ${matchedTag.color}">
                                  ${matchedTag.name}
                                  <i class="fas fa-times tag-close"></i>
                                </span>

                              </div>`
          : "";
      })
      .join("")}

                        

                        ${enableInsight
      ? `<div class="tag-input ">
                          <input type="text" placeholder="Add Tag" />
                          <div class="tag-suggestions"></div>
                          <button class="tag-button">
                            <i class="fas fa-plus"></i>
                            Map
                          </button>
                        </div>`
      : ""
    }
              
                      </div>
                  </div>
                </div>
                <div class="question-content">
                    <div class="editor-attachment-container">
                        <div class="text-editor">
                            <textarea class="qeditor qeditor-${questionCount}"  id="question-text-${questionCount}" name="question-text-${questionCount}" placeholder="Enter question with blanks...">${questionData ? questionData.question : ""
    }</textarea>
                        </div>
                    </div>
                    <div class="blanks-answers" id="blanks-answers-${questionCount}">
                        ${blanks
      .map(
        (blank, index) => `
                        <div class="blank-answer" data-blank-id="blank-${questionCount}-${blank.identity
          }">
                            <div class="accordion-header">
                                <div class="accordion-toggle">
                                    <span>Blank ${index + 1}</span>
                                    <i class="fas fa-chevron-down"></i>
                                </div>
                                <div class="remove-blank-btn" data-id="${questionCount}">
                                    <i class="fas fa-times"></i>
                                </div>
                            </div>
                            <div class="accordion-body">
                                <div class="blank-answer-header">
                                    <label class="header-label-blank-answer">Answer Type:</label>
                                    <select class="answer-type" data-blank-id="blank-${questionCount}-${blank.identity
          }">
                                        <option value="text" ${blank.type === "text"
            ? "selected"
            : ""
          }>Text Input</option>
                                        <option value="dropdown" ${blank.type === "dropdown"
            ? "selected"
            : ""
          }>Options</option>
                                    </select>
                                    
                                </div>
                                <div class="answer-input-container">
                                    ${blank.type === "text"
            ? `
                                    <div class="text-answers-container">
                                      ${blank.values.length
              ? blank.values
                .map(
                  (value, fieldIndex) => `
                                              <div class="text-answer-group">
                                                  <input type="text" class="blank-input text-type" 
                                                        value="${value.value}"
                                                        placeholder="Enter correct answer"
                                                        data-blank-id="blank-${questionCount}-${blank.identity
                    }"
                                                        data-question-id="${questionCount}">
                                                  ${fieldIndex ===
                      blank.values.length - 1
                      ? `<button type="button" class="add-text-answer-btn">
                                                          <i class="fas fa-plus"></i>
                                                        </button>`
                      : `<button type="button" class="remove-text-answer-btn">
                                                          <i class="fas fa-times"></i>
                                                        </button>`
                    }
                                              </div>`
                )
                .join("")
              : `
                                            <div class="text-answer-group">
                                                <input type="text" class="blank-input text-type" 
                                                      value=""
                                                      placeholder="Enter correct answer"
                                                      data-blank-id="blank-${questionCount}-${blank.identity}"
                                                      data-question-id="${questionCount}">
                                                <button type="button" class="add-text-answer-btn">
                                                    <i class="fas fa-plus"></i>
                                                </button>
                                            </div>
                                          `
            }
                                    </div>`
            : `
                                    <div class="dropdown-options" style="display:block;">
                                        <div class="options-container">
                                            ${blank.values
              .map(
                (value, idx) => `
                                            <div class="option-item">
                                                <input type="text" 
                                                    class="option-text" 
                                                    value="${value.value}"
                                                    placeholder="Option ${idx + 1
                  }">
                                                <div class="option-item-others">
                                                    <input type="radio" 
                                                        name="correctOption-${questionCount}-${blank.identity
                  }" 
                                                        class="correct-option"
                                        
                                                        ${value.isCorrect
                    ? "checked"
                    : ""
                  }>
                                                    <p>Correct</p>
                                                </div>
                                                <div class="remove-options-divider"></div>
                                                <div class="remove-option-btn">
                                                    <i class="bx bx-trash"></i>
                                                </div>
                                            </div>`
              )
              .join("")}
                                        </div>
                                        <button type="button" class="add-option-btn">Add Option</button>
                                    </div>
                                    `
          }
                                </div>
                            </div>
                        </div>
                        `
      )
      .join("")}
                    </div>
                    <div class="question-footer">
                        <div class="marks-container">
                          <input type="number" class="mark${questionCount}" id="mark${questionCount}" step="0.01" value="${marksValue}">
                          <span class="unit">Mark</span>
                        </div>
                        <div class="attachment-container">
                          <div class="add-blank-btn" data-id="${questionCount}"><i class="bx bx-plus-circle font-size-25" title="add blank"></i></div>
                          <div class="setting-btn-container">
                            <div class="setting-btn" data-id="${questionCount}"><i class="bx bx-cog font-size-25" title="Setting"></i></div>
                            <div id="settings-panel" class="settings-popup" style="display: none">
                                <div class="settings-content">
                                  <div class='shuffle-settig'>
                                      <div>Shuffle Options</div>
                                      <label class="toggle-switch">
                                          <input class="shuffleOption" ${shouldShuffleOptions} type="checkbox"/>
                                          <span class="slider"></span>
                                      </label>
                                  </div>
                                  <div class='shuffle-settig'>
                                      <div>Evaluate Answer</div>
                                      <label class="toggle-switch">
                                          <input class="shouldEv"  ${shouldEvaluate} data-question-count="${questionCount}"   type="checkbox"/>
                                          <span class="slider"></span>
                                      </label>
                                  </div>
                                </div>
                            </div>
                          </div>
                            <div style="position: relative; display: inline-block;">
                                <div id="attachment-container-${questionCount}" data-question-count="${questionCount}" data-question-id="${questionData && questionData._id ? questionData._id : "new"
    }" data-attachments='${JSON.stringify(
      attachments
    )}' class="attactment-upload">
                                  <i class='bx bx-folder-open font-size-25'></i>
                                    ${attachments.length > 0
      ? `
                                        <div class="attachment-count-bubble">
                                            ${attachments.length}
                                        </div>
                                    `
      : ""
    }
                              </div>
                          </div>
                          <div class="remove-question-btn" data-id="${questionCount}" title="Delete question">
                              <i class="bx bx-trash font-size-25"></i>
                          </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  $("#questions-container").append(questionHtml);
  oldMarksValues[questionCount] = marksValue;

  // Initialize editor with proper error handling
  // applyEditor(`#question-text-${questionCount}`, "ckeditor", true);

  $(`#attachment-container-${questionCount}`).click(function () {
    $("#attachmentPanel").css("width", "90%");
    $("#blurOverlay").css("display", "block");

    const questionId = $(this).data("question-id");
    const questionCount = $(this).data("question-count");

    // Get attachments array
    const attachments = JSON.parse($(this).attr("data-attachments") || "[]");
    const $attachmentList = $(".attachment-main-container");

    // Clear existing content
    $attachmentList.empty();

    renderAttachmentsContainer(
      attachments,
      $attachmentList,
      questionId,
      questionCount
    );
  });

  $(this).siblings(".blank-count").text(`Blanks: ${blanks.length}`);
}

// ... existing code ...
function addTabQuestion(questionData) {
  questionCount++;
  let shouldEvaluate = "checked";
  let marksValue =
    questionData && typeof questionData?.marks === "number"
      ? questionData.marks
      : 1;

  if (questionData) {
    if (!questionData.shouldShuffleOptions) {
      shouldShuffleOptions = "notchecked";
    }
    if (!questionData.shouldEvaluate) {
      shouldEvaluate = "notchecked";
    }
  }

  const attachments = questionData?.attachments || [];
  const blanks = questionData?.blanks || [];
  const table = questionData?.table || [];
  centerOrRight(questionCount);

  const questionHtml = `
    <div class="question" data-qtype="TAB" data-tab-blanks= ${JSON.stringify(
    blanks
  )} data-tab-table=${JSON.stringify(table)} data-realid="${questionData && questionData._id ? questionData._id : "new"
    }" id="question-${questionCount}">
      <div class="question-header mt-2 qtntoggle">
        <span class="speech-bubble-badge">
          TAB <i class="fas fa-chevron-down"></i>
        </span>
        <h5>Question<span class='qcnt'>${questionCount}</span></h5>
        <h5>
          <span class="toggle-icon">▼</span>
        </h5>
        <div class="tag-container">
          ${(questionData?.tags || [])
      .map((tag) => {
        const matchedTag = allTags?.find((t) => t.id === tag._id);
        return matchedTag
          ? `<div class="tag-item" data-name="${matchedTag.name
          }" data-id="${matchedTag.id}">
                  <span class="tag-chip" style="--tag-bg: ${lightenHexColor(
            matchedTag.color,
            75
          )}; --tag-color: ${matchedTag.color}">
                    ${matchedTag.name}
                    <i class="fas fa-times tag-close"></i>
                  </span>
                </div>`
          : "";
      })
      .join("")}
          ${enableInsight
      ? `<div class="tag-input">
                <input type="text" placeholder="Add Tag" />
                <div class="tag-suggestions"></div>
                <button class="tag-button">
                  <i class="fas fa-plus"></i>
                  Map
                </button>
              </div>`
      : ""
    }
        </div>
      </div>
      <div class="question-content">
        <div class="editor-attachment-container">
          <div class="text-editor">
            <textarea class="qeditor qeditor-${questionCount}" id="question-text-${questionCount}" name="question-text-${questionCount}" placeholder="Enter question here...">${questionData ? questionData.question : ""
    }</textarea>
          </div>
        </div>
        
        <!-- Table Controls -->
        <div class="table-controls">
          <div style="padding: 15px; border-top: 1px solid #eee; display: flex; justify-content: center;">
            <button class="add-table-answer-field-btn" data-question-id="${questionCount}">
              <i class="fas fa-plus-circle"></i> Add Answer Field
            </button>
          </div>
          <button class="add-table-btn" data-id="${questionCount}">
            <i class="fas fa-table"></i> Insert Table
          </button>
        </div>
        
        <div class="question-footer">
          <div class="marks-container">
            <input type="number" class="mark${questionCount}" id="mark${questionCount}" step="0.01" value="${marksValue}">
            <span class="unit">Mark</span>
          </div>
          <div class="attachment-container">
            <div class="setting-btn-container">
              <div class="setting-btn" data-id="${questionCount}">
                <i class="bx bx-cog font-size-25" title="Setting"></i>
              </div>
              <div id="settings-panel" class="settings-popup" style="display: none">
                <div class="settings-content">
                  <div class='shuffle-settig'>
                    <div>Evaluate Answer</div>
                    <label class="toggle-switch">
                      <input class="shouldEv" ${shouldEvaluate} data-question-count="${questionCount}"  type="checkbox"/>
                      <span class="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div style="position: relative; display: inline-block;">
              <div id="attachment-container-${questionCount}" data-question-count="${questionCount}" data-question-id="${questionData && questionData._id ? questionData._id : "new"
    }" data-attachments='${JSON.stringify(
      attachments
    )}' class="attactment-upload">
                <i class='bx bx-folder-open font-size-25'></i>
                ${attachments.length > 0
      ? `
                    <div class="attachment-count-bubble">
                      ${attachments.length}
                    </div>
                  `
      : ""
    }
              </div>
            </div>
            <div class="remove-question-btn" data-id="${questionCount}" title="Delete question">
              <i class="bx bx-trash font-size-25"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  $("#questions-container").append(questionHtml);

  // Apply the editor for the question text
  // const editorType = "ckeditor";
  // applyEditor(`#question-text-${questionCount}`, editorType);
  oldMarksValues[questionCount] = marksValue;

  // Create table from backend data if available
  if (questionData && questionData.table && questionData.table.length > 0) {
    const tableData = questionData.table[0];

    // First, create a proper mapping of cell locations
    const cellMap = {};
    const blankCells = {};

    // Map the blank cell identities
    if (blanks && blanks.length > 0) {
      blanks.forEach((blank) => {
        blankCells[blank.identity] = blank;
      });
    }

    // Generate table HTML from backend data
    let tableHtml =
      '<div class="accountence-table-container">' +
      '<table class="accountence-table">';

    // Determine how many rows and columns to create based on the data
    let numRows = 0;
    let numColumns = 0;

    // If we have rows and columns data, use them (new format: rows and columns are single numbers)
    if (tableData.rows !== undefined && !isNaN(tableData.rows)) {
      numRows = parseInt(tableData.rows);
    }

    if (tableData.columns !== undefined && !isNaN(tableData.columns)) {
      numColumns = parseInt(tableData.columns);
    }

    // Fallback: determine size from cells if rows/columns not provided
    if (numRows <= 0 || numColumns <= 0) {
      const cellCount = tableData.cells ? tableData.cells.length : 0;
      // If more than 4 cells, use 3 columns, else use cells count
      numColumns = numColumns || (cellCount > 4 ? 3 : cellCount);
      numRows = numRows || Math.ceil(cellCount / numColumns);
    }

    let cellIndex = 0;
    const cellCount = tableData.cells ? tableData.cells.length : 0;

    // Create the table rows and cells
    for (let r = 0; r < numRows && cellIndex < cellCount; r++) {
      tableHtml += "<tr>";

      for (let c = 0; c < numColumns && cellIndex < cellCount; c++) {
        // Generate a cell ID for reference (A1, B1, etc.)
        const cellId = String.fromCharCode(65 + c) + (r + 1);

        // Default empty cell content
        let cellClass = "editable-cell";
        let cellContent = "&nbsp;";

        // Use cell data from backend
        if (cellIndex < cellCount && tableData.cells[cellIndex]) {
          const cellData = tableData.cells[cellIndex];

          // Check if this is a blank cell
          const isBlank = cellData.value === "[blank]";

          if (isBlank) {
            cellClass += " blank-cell";
            cellContent = '<span class="blank-indicator">[blank]</span>';
          } else if (cellData.value) {
            cellContent = cellData.value;
          }

          cellIndex++;
        }

        tableHtml += `<td class="${cellClass}" data-cell-id="${cellId}" data-row-index="${r}" data-col-index="${c}">${cellContent}</td>`;
      }

      tableHtml += "</tr>";
    }

    tableHtml += "</table></div>";

    // Add the table to the question
    const tableContainer = `
      <div class="table-section" id="table-section-${questionCount}">
        ${tableHtml}
      </div>
    `;

    // Insert the table container after the editor
    $(`#question-${questionCount} .editor-attachment-container`).after(
      tableContainer
    );

    // Add the answer fields section
    const answerFieldsSection = `
      <div class="answer-fields-section" id="answer-fields-${questionCount}">
        <div class="answer-fields-header">
          <i class="fas fa-pen"></i>
          <span>Answer Fields</span>
          <span class="tab-blank-count">${blanks.length}</span>
        </div>
        
        <div class="answer-fields-info">
          <div>
            <i class="fas fa-info-circle"></i>
            <span>Add blanks in the editor using [blank] tags. Each blank added in the table will appear here for answer configuration.</span>
          </div>
        </div>
        
        <div id="tab-blanks-container-${questionCount}" class="tab-blanks-container">
          ${blanks.length === 0
        ? `
            <div class="no-blanks-message">
              <i class="fas fa-info-circle"></i>
              <span>No blanks have been added yet. Add [blank] tags in the table cells to create answer fields.</span>
            </div>
          `
        : ""
      }
        </div>
      </div>
    `;

    $(`#table-section-${questionCount}`).after(answerFieldsSection);
    let $question = $(`#question-${questionCount}`);
    // Create blank fields from the questionData.blanks
    if (blanks.length > 0) {
      // Set to keep track of processed blanks to avoid duplicates
      const processedBlankRefs = new Set();

      // Create answer fields for each blank
      blanks.forEach((blank) => {
        const cellRef = blank.identity;

        // Skip if we've already processed this cell reference (handle duplicates)
        if (processedBlankRefs.has(cellRef)) {
          return;
        }
        processedBlankRefs.add(cellRef);

        const blankId = Date.now() + Math.floor(Math.random() * 1000);
        const fullBlankId = `tab-blank-${questionCount}-${blankId}`;

        // Get primary and alternative answers
        const primaryAnswer = blank.values.find((v) => v.isCorrect);
        const alternativeAnswers = blank.values.filter((v) => !v.isCorrect);

        // Create HTML for answers display
        let answersDisplay = "";
        if (primaryAnswer) {
          answersDisplay += `<div class="answer-value primary-answer">${primaryAnswer.value}</div>`;

          if (alternativeAnswers.length > 0) {
            answersDisplay += `<div class="alternative-answers-label">Alternative Answers:</div>`;
            alternativeAnswers.forEach((alt) => {
              answersDisplay += `<div class="answer-value">${alt.value}</div>`;
            });
          }
        } else {
          answersDisplay = `<div class="answer-value default-answer">
            <i class="fas fa-info-circle"></i> No answer provided
          </div>`;
        }

        // Create the blank item HTML
        const blankHtml = `
          <div class="blank-item" id="blank-${fullBlankId}" data-blank-id="${fullBlankId}" data-cell-ref="${cellRef}">
            <div class="blank-header">
              <div class="cell-reference-container">
                <span class="cell-tag">Cell</span>
                <div class="cell-reference">${cellRef}</div>
              </div>
              <div class="blank-actions">
                <button class="edit-blank-btn" data-question-id="${questionCount}" data-cell-ref="${cellRef}" data-blank-id="${fullBlankId}" title="Edit answers">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="remove-table-blank-btn" data-question-id="${questionCount}" data-cell-ref="${cellRef}" data-blank-id="${fullBlankId}" title="Remove this answer field">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <div class="blank-content">
              <div class="answers-display">
                ${answersDisplay}
              </div>
            </div>
          </div>
        `;

        // Add the blank to the container
        $(`#tab-blanks-container-${questionCount}`).append(blankHtml);

        // Store the answers data
        const $blank = $(`#blank-${fullBlankId}`);
        $blank.data("answers", blank.values);
        $blank.attr("data-answers", JSON.stringify(blank.values));

        // Find the cell in the table using the cell reference

        let $cell = $question.find(
          `.accountence-table td[data-cell-id="${cellRef}"]`
        );

        if ($cell.length) {
          $cell.addClass("blank-cell");
          if (primaryAnswer) {
            // console.log(primaryAnswer)
            $cell.html(
              '<span class="answer-indicator"><i class="fas fa-check-circle"></i> [answer]</span>'
            );
          } else {
            $cell.html('<span class="blank-indicator">[blank]</span>');
          }
        }
      });
    }

    // Mark all cells in the table that should be blanks (in case we missed any)

    $question.find(`.accountence-table td.editable-cell`).each(function () {
      const cellRef = $(this).data("cell-id");
      if (blankCells[cellRef] !== undefined) {
        $(this).addClass("blank-cell");
        if (
          !$(this).find(".blank-indicator").length &&
          !$(this).find(".answer-indicator").length
        ) {
          $(this).html('<span class="blank-indicator">[blank]</span>');
        }
      }
    });
  }

  // Add attachment container click handler
  $(`#attachment-container-${questionCount}`).click(function () {
    $("#attachmentPanel").css("width", "90%");
    $("#blurOverlay").css("display", "block");
    const questionId = $(this).data("question-id");
    const questionCount = $(this).data("question-count");
    const attachments = JSON.parse($(this).attr("data-attachments") || "[]");
    const $attachmentList = $(".attachment-main-container");
    $attachmentList.empty();
    renderAttachmentsContainer(
      attachments,
      $attachmentList,
      questionId,
      questionCount
    );
  });

  // Add event handler for "Add Blank" button
  $(document).on("click", `.add-blank-btn-${questionCount}`, function () {
    const blankId = Date.now();
    const blankHtml = generateTabBlankHtml(
      { identity: blankId },
      questionCount
    );
    $(`#blanks-answers-${questionCount}`).append(blankHtml);

    // Update blank count
    const blankCount = $(
      `#blanks-answers-${questionCount} .blank-answer`
    ).length;
    $(`#blanks-answers-${questionCount} .blank-count`).text(blankCount);
  });
}

function generateTabBlanksHtml(blanks, questionCount) {
  if (!blanks || blanks.length === 0) {
    return `
      <div class="no-blanks-message">
        <i class="fas fa-info-circle"></i>
        No blanks have been added yet. Add [blank] tags in the table cells to create answer fields.
      </div>
      <button class="add-table-answer-field-btn add-blank-btn-${questionCount}">
        <i class="fas fa-plus-circle"></i> Add Answer Field
      </button>
    `;
  }

  let blanksHtml = "";
  blanks.forEach((blank) => {
    blanksHtml += generateTabBlankHtml(blank, questionCount);
  });

  return `
    ${blanksHtml}
    <button class="add-table-answer-field-btn add-blank-btn-${questionCount}">
      <i class="fas fa-plus-circle"></i> Add Answer Field
    </button>
  `;
}

function generateTabBlankHtml(blank, questionCount) {
  const blankId = blank.identity;
  const values = blank.values || [];
  const answerType = blank.type || "text";

  let answerContent = "";
  if (
    answerType === "text" ||
    answerType === "number" ||
    answerType === "formula"
  ) {
    answerContent = `
      <div class="answer-type-content text-type-content">
        <div class="text-answer-group">
          ${values
        .map(
          (value) => `
            <div class="text-answer">
              <input type="text" class="text-type" value="${value.value || ""}">
              <button class="remove-text-btn"><i class="fas fa-times"></i></button>
            </div>
          `
        )
        .join("")}
          ${values.length === 0
        ? `
            <div class="text-answer">
              <input type="text" class="text-type" value="">
              <button class="remove-text-btn"><i class="fas fa-times"></i></button>
            </div>
          `
        : ""
      }
        </div>
        <button class="add-text-btn">
          <i class="fas fa-plus"></i> Add Answer Option
        </button>
      </div>
    `;
  } else {
    // Dropdown options
    answerContent = `
      <div class="answer-type-content dropdown-type-content">
        <div class="options-container">
          ${values
        .map(
          (value, index) => `
            <div class="option-item">
              <input type="text" class="option-text" value="${value.value || ""
            }">
              <label class="option-correct">
                <input type="checkbox" class="correct-option" ${value.isCorrect ? "checked" : ""
            }>
                <span class="checkmark"></span>
              </label>
              <button class="remove-option-btn"><i class="fas fa-times"></i></button>
            </div>
          `
        )
        .join("")}
          ${values.length === 0
        ? `
            <div class="option-item">
              <input type="text" class="option-text" value="">
              <label class="option-correct">
                <input type="checkbox" class="correct-option">
                <span class="checkmark"></span>
              </label>
              <button class="remove-option-btn"><i class="fas fa-times"></i></button>
            </div>
          `
        : ""
      }
        </div>
        <button class="add-option-btn">
          <i class="fas fa-plus"></i> Add Option
        </button>
      </div>
    `;
  }

  return `
    <div class="blank-answer" data-blank-id="blank-${questionCount}-${blankId}">
      <div class="blank-header">
        <div class="blank-title">
          <i class="fas fa-pen"></i>
          <span>Answer Field</span>
        </div>
        <div class="cell-reference-container">
          <label for="cell-ref-${questionCount}-${blankId}">Cell Reference:</label>
          <input type="text" id="cell-ref-${questionCount}-${blankId}" class="cell-reference" placeholder="e.g. A2" value="${blank.cellRef || ""
    }">
        </div>
        <div class="answer-type-container">
          <label for="answer-type-${questionCount}-${blankId}">Answer Type:</label>
          <select id="answer-type-${questionCount}-${blankId}" class="answer-type">
            <option value="text" ${answerType === "text" ? "selected" : ""
    }>Text</option>
            <option value="number" ${answerType === "number" ? "selected" : ""
    }>Number</option>
            <option value="formula" ${answerType === "formula" ? "selected" : ""
    }>Formula</option>
            <option value="dropdown" ${answerType === "dropdown" ? "selected" : ""
    }>Options</option>
          </select>
        </div>
      </div>
      ${answerContent}
    </div>
  `;
}

function updateResponseToolInfo(questionCount, selectedTool) {
  const infoElement = document.getElementById(
    `response-tool-info-${questionCount}`
  );
  const infoTextElement = infoElement?.querySelector(".info-text");

  if (!infoElement || !infoTextElement) return;

  const toolMessages = {
    "digital-writing": {
      text: "Students will use digital writing tools (text editor or drawing pad) to provide their answer.",
      icon: "fas fa-edit",
      color: "#007bff",
    },
    "qr-upload": {
      text: "Students will scan a QR code to upload files, images, or documents as their answer.",
      icon: "fas fa-qrcode",
      color: "#007bff",
    },
    "webcam-capture": {
      text: "Students will use their webcam to capture photos or videos as their response.",
      icon: "fas fa-camera",
      color: "#007bff",
    },
    "audio-response": {
      text: "Students will record audio responses using their microphone for verbal answers.",
      icon: "fas fa-microphone",
      color: "#007bff",
    },
  };

  if (selectedTool && toolMessages[selectedTool]) {
    const tool = toolMessages[selectedTool];
    infoTextElement.textContent = tool.text;

    const iconElement = infoElement.querySelector(".info-content i");
    if (iconElement) {
      iconElement.className = tool.icon;
    }

    infoElement.style.display = "block";
  } else {
    infoElement.style.display = "none";
  }
}

function initializeResponseToolInfo(questionCount) {
  requestAnimationFrame(() => {
    const selectedRadio = document.querySelector(
      `input[name="response-tool-${questionCount}"]:checked`
    );
    if (selectedRadio) {
      updateResponseToolInfo(questionCount, selectedRadio.value);
    }
  });
}
