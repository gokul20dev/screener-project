$(document).ready(function () {
  // Load Trumbowyg CSS if not already loaded
  if (!$('link[href*="trumbowyg"]').length) {
    $('<link rel="stylesheet" type="text/css" href="../../common/commonLibaries/htmleditor/dist/ui/trumbowyg.min.css">').appendTo('head');
  }

  // Add custom CSS for AI prompt editor
  const customCSS = `
    <style>
      .ai-prompt-input-container .text-editor {
        width: 100%;
        background-color: white;
        border-radius: 8px;
        margin-bottom: 10px;
      }
      
      .ai-prompt-input-container .trumbowyg-box,
      .ai-prompt-input-container .ck-editor {
        border: 1px solid #e5e7eb !important;
        border-radius: 8px !important;
      }
      
      .ai-prompt-input-container .trumbowyg-editor {
        min-height: 100px !important;
        padding: 10px !important;
      }
      
      .ai-prompt-input-container .ck-editor__editable {
        min-height: 100px !important;
        padding: 10px !important;
      }
      
             .ai-prompt-input-container .trumbowyg-button-pane {
         background: #f8f9fa !important;
         border-bottom: 1px solid #e5e7eb !important;
       }
       
       .ai-settings-section {
         background: #f8f9fa;
         padding: 15px;
         border-radius: 8px;
         margin-bottom: 15px;
         border: 1px solid #e5e7eb;
       }
       
       .ai-settings-section h4 {
         margin: 0 0 15px 0;
         color: #374151;
         font-size: 16px;
         font-weight: 600;
       }
       
       .ai-settings-grid {
         display: grid;
         grid-template-columns: 1fr 1fr;
         gap: 15px;
       }
       
       .ai-setting-group {
         display: flex;
         flex-direction: column;
       }
       
       .ai-setting-group label {
         font-weight: 500;
         margin-bottom: 5px;
         color: #374151;
         font-size: 14px;
       }
       
       .ai-setting-group select {
         padding: 8px 12px;
         border: 1px solid #d1d5db;
         border-radius: 6px;
         background: white;
         font-size: 14px;
       }
       
       .ai-checkbox-group {
         grid-column: span 2;
       }
       
       .ai-checkbox-label {
         display: flex;
         align-items: center;
         font-weight: 400 !important;
         margin: 0 !important;
         cursor: pointer;
       }
       
       .ai-checkbox-label input[type="checkbox"] {
         margin-right: 8px;
         margin-bottom: 0;
       }
       
       .ai-content-section {
         margin-bottom: 15px;
       }
       
       .ai-content-display {
         background: #fff;
         border: 1px solid #e5e7eb;
         border-radius: 8px;
         padding: 15px;
         margin-bottom: 15px;
       }
       
       .ai-content-display h4 {
         margin: 0 0 10px 0;
         color: #374151;
         font-size: 16px;
         font-weight: 600;
       }
       
       .ai-content-text {
         max-height: 200px;
         overflow-y: auto;
         padding: 10px;
         background: #f9fafb;
         border-radius: 6px;
         font-size: 14px;
         line-height: 1.5;
       }
       
       .ai-generate-controls {
         display: flex;
         align-items: center;
         gap: 15px;
       }
       
       .ai-modal-generate {
         background: #2563eb;
         color: white;
         border: none;
         padding: 10px 20px;
         border-radius: 6px;
         font-weight: 500;
         cursor: pointer;
         display: flex;
         align-items: center;
         gap: 8px;
       }
       
       .ai-modal-generate:disabled {
         background: #9ca3af;
         cursor: not-allowed;
       }
       
       .ai-content-header {
         display: flex;
         justify-content: space-between;
         align-items: center;
         margin-bottom: 10px;
       }
       
       .ai-show-full-content-btn {
         background: #2563eb;
         color: white;
         border: none;
         padding: 5px 10px;
         border-radius: 4px;
         font-size: 12px;
         cursor: pointer;
         display: flex;
         align-items: center;
         gap: 5px;
       }
       
       .ai-show-full-content-btn:hover {
         background: #1d4ed8;
       }
       
       .ai-content-preview {
         max-height: 150px;
         overflow-y: auto;
         padding: 10px;
         background: #f9fafb;
         border-radius: 6px;
         font-size: 14px;
         line-height: 1.5;
       }
       
       .ai-settings-header {
         display: flex;
         justify-content: space-between;
         align-items: center;
         margin-bottom: 10px;
         cursor: pointer;
       }
       
       .ai-settings-toggle {
         background: none;
         border: none;
         color: #6b7280;
         cursor: pointer;
         padding: 5px;
         border-radius: 4px;
       }
       
       .ai-settings-toggle:hover {
         background: #f3f4f6;
       }
       
       .ai-settings-content {
         transition: max-height 0.3s ease;
         overflow: hidden;
       }
       
       .ai-settings-content.collapsed {
         max-height: 0;
       }
       
       .ai-settings-content.expanded {
         max-height: 500px;
       }
       
       .ai-full-content-body {
         height: calc(100vh - 80px);
         display: flex;
         flex-direction: column;
       }
       
       .ai-full-content-info {
         background: #f8f9fa;
         padding: 15px;
         border-bottom: 1px solid #e5e7eb;
         display: flex;
         justify-content: space-between;
         align-items: center;
         flex-wrap: wrap;
         gap: 10px;
       }
       
       .ai-content-meta {
         display: flex;
         gap: 20px;
         font-size: 14px;
         color: #374151;
       }
       
       .ai-content-actions {
         display: flex;
         gap: 10px;
       }
       
       .ai-content-action-btn {
         background: #2563eb;
         color: white;
         border: none;
         padding: 6px 12px;
         border-radius: 4px;
         font-size: 12px;
         cursor: pointer;
         display: flex;
         align-items: center;
         gap: 5px;
       }
       
       .ai-content-action-btn:hover {
         background: #1d4ed8;
       }
       
       .ai-full-content-text {
         flex: 1;
         overflow-y: auto;
         padding: 20px;
         background: white;
         font-size: 14px;
         line-height: 1.6;
       }
       
       .ai-full-content-text p {
         margin-bottom: 15px;
         text-align: justify;
       }
       
       .ai-controls-row {
         display: flex;
         gap: 15px;
         align-items: end;
         margin-bottom: 15px;
         flex-wrap: wrap;
       }
       
       .ai-control-group {
         display: flex;
         flex-direction: column;
         min-width: 120px;
       }
       
       .ai-control-group label {
         font-size: 12px;
         font-weight: 500;
         margin-bottom: 4px;
         color: #374151;
       }
       
       .ai-control-group select {
         padding: 6px 8px;
         border: 1px solid #d1d5db;
         border-radius: 4px;
         font-size: 14px;
         background: white;
       }
       
       .ai-upload-label {
         cursor: pointer;
         color: #2563eb;
         padding: 6px 12px;
         border: 1px dashed #2563eb;
         border-radius: 4px;
         background: #f8f9fa;
         font-size: 14px;
         text-align: center;
         transition: all 0.2s;
       }
       
       .ai-upload-label:hover {
         background: #e3f2fd;
         border-color: #1d4ed8;
       }
       
       .ai-history-section {
         background: #f8f9fa;
         border-radius: 8px;
         margin: 5px 0;
         overflow: hidden;
       }
       
       .ai-history-header {
         display: flex;
         justify-content: space-between;
         align-items: center;
         padding: 10px 15px;
         background: #f2f3f7;
         cursor: pointer;
         border-radius:8px;
         border: 1px solid #d1d5db;
       }
       
       .ai-history-content {
         max-height: 0;
         overflow: hidden;
         transition: max-height 0.3s ease;
       }
       
       .ai-history-content.expanded {
         max-height: 300px;
       }

       #ai-history-content.expand{
        max-height: 300px;
       }
       
       .ai-history-item {
         padding: 10px 15px;
         border-bottom: 1px solid #e5e7eb;
         font-size: 12px;
       }
       
       .ai-history-item:last-child {
         border-bottom: none;
       }
       
       .ai-history-timestamp {
         color: #6b7280;
         font-weight: 500;
         margin-bottom: 5px;
       }
       
       .ai-history-prompt {
         background: #f9fafb;
         padding: 8px;
         border-radius: 4px;
         font-family: monospace;
         font-size: 11px;
         max-height: 100px;
         overflow-y: auto;
         white-space: pre-wrap;
         word-break: break-word;
       }
       
       .ai-manual-content-section {
         border: 1px solid #e5e7eb;
         border-radius: 8px;
         padding: 15px;
         margin-bottom: 15px;
         background: #f8f9fa;
       }
       
       .ai-manual-content-textarea {
         width: 100%;
         min-height: 100px;
         padding: 10px;
         border: 1px solid #d1d5db;
         border-radius: 4px;
         font-size: 14px;
         resize: vertical;
         font-family: inherit;
       }
       
       .ai-history-settings {
         font-size: 11px;
         color: #6b7280;
         margin-bottom: 8px;
         padding: 4px 8px;
         background: #f3f4f6;
         border-radius: 3px;
       }
       
       .ai-modal-generate {
         background: linear-gradient(135deg, #10b981 0%, #059669 100%);
         color: white;
         border: none;
         padding: 12px 24px;
         border-radius: 8px;
         font-size: 14px;
         font-weight: 600;
         cursor: pointer;
         display: flex;
         align-items: center;
         gap: 8px;
         transition: all 0.3s ease;
         box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
         position: relative;
         overflow: hidden;
       }
       
       .ai-modal-generate:not(:disabled):hover {
         background: linear-gradient(135deg, #059669 0%, #047857 100%);
         transform: translateY(-2px);
         box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
       }
       
       .ai-modal-generate:not(:disabled):active {
         transform: translateY(-1px);
         box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
       }
       
       .ai-modal-generate:disabled {
         background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
         cursor: not-allowed;
         transform: none;
         box-shadow: none;
       }
       
       .ai-control-group {
         position: relative;
       }
       
       .ai-control-group:hover .ai-tooltip {
         opacity: 1;
         visibility: visible;
         transform: translateY(-2px);
       }
       
       .ai-tooltip {
         position: absolute;
         bottom: 100%;
         left: 50%;
         transform: translateX(-50%) translateY(5px);
         background: rgba(0, 0, 0, 0.9);
         color: white;
         padding: 8px 12px;
         border-radius: 6px;
         font-size: 12px;
         white-space: nowrap;
         opacity: 0;
         visibility: hidden;
         transition: all 0.3s ease;
         z-index: 1000;
         pointer-events: none;
       }
       
       .ai-tooltip::after {
         content: '';
         position: absolute;
         top: 100%;
         left: 50%;
         transform: translateX(-50%);
         border: 5px solid transparent;
         border-top-color: rgba(0, 0, 0, 0.9);
       }
       
       .ai-history-header:hover {
         background: #d1d5db;
       }
       
       .ai-history-header i {
         transition: transform 0.3s ease;
       }
       
       .ai-show-full-content-btn {
         background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
         color: white;
         border: none;
         padding: 6px 12px;
         border-radius: 6px;
         font-size: 12px;
         cursor: pointer;
         transition: all 0.3s ease;
         display: flex;
         align-items: center;
         gap: 5px;
       }
       
       .ai-show-full-content-btn:hover {
         background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
         transform: translateY(-1px);
         box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
       }
       
       .ai-settings-toggle {
         background: transparent;
         border: 1px solid #d1d5db;
         color: #6b7280;
         padding: 6px 10px;
         border-radius: 6px;
         cursor: pointer;
         transition: all 0.3s ease;
         display: flex;
         align-items: center;
         gap: 5px;
         font-size: 12px;
       }
       
       .ai-settings-toggle:hover {
         background: #f3f4f6;
         border-color: #9ca3af;
         color: #374151;
       }
       
       .ai-content-action-btn:hover {
         background: #1d4ed8;
         transform: translateY(-1px);
         box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
       }
     </style>
   `;
  $('head').append(customCSS);

  // Attach click event listener to the AI Generate button that's already in the HTML
  $("#ai-generate-btn").on("click", openAiPromptSidepanel);
});

function openAiPromptSidepanel() {
  // Get available question types from the dropdown
  const availableQuestionTypes = [];
  $("#question-type option").each(function () {
    availableQuestionTypes.push({
      value: $(this).val(),
      name: $(this).text(),
    });
  });

  if (!availableQuestionTypes.length) {
    displayToast(
      "No question types available. Please set up question types first.",
      "error"
    );
    return;
  }

  // Create type selection options
  let typeOptions = "";
  availableQuestionTypes.forEach((type) => {
    let questionTypes = ["MCQ","SAQ","PRQ"]
  
  if(questionTypes.includes(type.value)){
  typeOptions += `<option value="${type.value}">${type.name}</option>`;
  }
  });

  // Create the AI sidepanel if it doesn't exist
  if (!$("#aiGeneratorPanel").length) {
    const $aiSidepanel = $("<div>", {
      id: "aiGeneratorPanel",
      class: "sidepanel",
    });

    const $aiContent = $("<div>", {
      class: "ai-sidepanel-content",
    });

    $aiContent.html(`
            <div class="ai-sidepanel-header">
                <h3>AI Question Generator</h3>
                <i class="bx bx-x ai-sidepanel-close-btn"></i>
            </div>
            <div class="ai-sidepanel-body">
                <div class="ai-history-section" id="ai-history-section">
                    <div class="ai-history-header" id="ai-history-toggle">
                        <span><i class="fas fa-history" style="color: #6366f1;"></i> Generation History (0)</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="ai-history-content" id="ai-history-content">
                        <div class="ai-history-empty">
                            <p style="padding: 15px; text-align: center; color: #6b7280; font-style: italic;">
                                No generation history yet. Generate questions to see prompt history here.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="ai-content-section">
                    <div class="ai-content-display" id="ai-content-display" style="display:none;">
                        <div class="ai-content-header">
                            <h4><i class="fas fa-file-alt" style="color: #ef4444; margin-right: 8px;"></i>Extracted Content</h4>
                            <button class="ai-show-full-content-btn" id="ai-show-full-content" style="display:none;">
                                <i class="fas fa-expand"></i> Show Full Content
                            </button>
                        </div>
                        <div class="ai-content-preview" id="ai-content-preview"></div>
                    </div>
                    
                    <div class="ai-manual-content-section" id="ai-manual-content-section">
                        <h4><i class="fas fa-edit" style="color: #8b5cf6; margin-right: 8px;"></i>Content Input</h4>
                        <p style="font-size: 12px; color: #6b7280; margin-bottom: 10px;">
                            <i class="fas fa-info-circle" style="color: #3b82f6; margin-right: 5px;"></i>
                            Paste or type content here to generate questions from
                        </p>
                        <textarea id="ai-manual-content" class="ai-manual-content-textarea" 
                                  placeholder="📝 Paste your content here or upload a PDF above..."
                                  title="Enter the content you want to generate questions from"></textarea>
                    </div>
                </div>
                
                <div class="ai-chat-messages">
                    <div class="ai-system-message">
                        <div class="ai-message-content">
                            <p>Welcome to the AI Question Generator!</p>
                            <p>📄 <strong>Upload a PDF</strong> to extract content and access advanced settings</p>
                            <p>✏️ <strong>Paste content</strong> in the text area above</p>
                            <p>⚙️ <strong>Select question type</strong> and number of questions</p>
                            <p>🚀 Add optional instructions and generate questions!</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="ai-sidepanel-footer">

            <div class = "ai-controls-accordian">
                        
                <div class="ai-controls-header" id="ai-controls-toggle">
                        <span><i class="fas fa-cog"></i> Advance Setting Config</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>

                <div class="ai-controls-row">
                    <div class="ai-control-group">
                        <label for="ai-question-type"><i class="fas fa-question-circle ai-questiontype-icon"></i>Question Type:</label>
                        <select id="ai-question-type">
                            <option value="MCQ" selected>📝 Multiple Choice (MCQ)</option>
                            ${typeOptions.replace('value="MCQ"', 'value="MCQ" style="display:none;"')}
                        </select>
                        <div class="ai-tooltip">Choose the type of questions to generate</div>
                   </div>
                    <div class="ai-control-group">
                        <label for="ai-question-count-footer"><i class="fas fa-hashtag ai-questioncount-icon"></i>Questions:</label>
                        <select id="ai-question-count-footer">
                            <option value="3" selected>3 Questions</option>
                            <option value="5">5 Questions</option>
                            <option value="10">10 Questions</option>
                        </select>
                        <div class="ai-tooltip">Number of questions to generate</div>
                    </div>
                    <div class="ai-control-group">
                        <label for="ai-blooms-level"><i class="fas fa-brain ai-blooms-level-icon"></i>Bloom's Level:</label>
                        <select id="ai-blooms-level">
                            <option value="remember">Remember</option>
                            <option value="understand" selected>Understand</option>
                            <option value="apply">Apply</option>
                            <option value="analyze">Analyze</option>
                            <option value="evaluate">Evaluate</option>
                            <option value="create">Create</option>
                        </select>
                        <div class="ai-tooltip">Cognitive level based on Bloom's Taxonomy</div>
                    </div>
                    <div class="ai-control-group">
                        <label for="ai-complexity-level"><i class="fas fa-layer-group ai-complexity-level-icon"></i>Complexity:</label>
                        <select id="ai-complexity-level">
                            <option value="basic">Basic</option>
                            <option value="intermediate" selected>Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                        <div class="ai-tooltip">Question difficulty level</div>
                    </div>
                   </div>


                <div class="ai-controls-row ai-advanced-settings">

                    <div class="ai-control-group">
                        <label for="ai-upload-pdf" class="ai-upload-label">
                            <i class="fas fa-cloud-upload-alt"></i> Upload PDF
                        </label>
                        <input type="file" id="ai-upload-pdf" accept="application/pdf" style="display:none;">
                        <div class="ai-tooltip">Upload a PDF file to extract content automatically</div>
                    </div>

                
                    <div class="ai-control-group ai-checkbox-group">
                        <label class="ai-checkbox-label">
                            <input type="checkbox" id="ai-include-reasoning"> 
                            <i class="fas fa-lightbulb ai-include-reasoning-icon" ></i>Include Reasoning
                        </label>
                        <div class="ai-tooltip">Add explanations for correct answers</div>
                    </div>
                    <div class="ai-control-group ai-checkbox-group">
                        <label class="ai-checkbox-label">
                            <input type="checkbox" id="ai-case-based"> 
                            <i class="fas fa-clipboard-list ai-checkbox-label-icon"></i>Case-Based
                        </label>
                        <div class="ai-tooltip">Generate scenario-based questions</div>
                    </div>
                </div>

                </div>
                <div class="ai-prompt-input-container">
                    <label for="ai-prompt-input"><i class="fas fa-lightbulb ai-prompt-input-icon"></i>Additional Instructions (Optional):</label>
                    <div class="text-editor">
                        <textarea id="ai-prompt-input" class="ai-prompt-editor" 
                                  placeholder="💡 Enter specific instructions or topics (e.g., 'Focus on practical applications', 'Include real-world examples')"
                                  title="Add specific instructions to customize the generated questions"></textarea>
                    </div>
                    <div class="ai-generate-controls">
                        <button class="ai-modal-generate" disabled title="Generate AI-powered questions based on your content and settings"><i class="fas fa-magic"></i> Generate Questions</button>
                        <div class="ai-loader">
                            <div class="ai-spinner"></div>
                        </div>
                    </div>
                </div>
            </div>
        `);

    $aiSidepanel.append($aiContent);
    $("body").append($aiSidepanel);
  } else {
    // Reset the chat messages
    $(".ai-chat-messages").html(`
            <div class="ai-system-message">
                <div class="ai-message-content">
                    <p>Welcome to the AI Question Generator! I can help you create different types of questions for your exam.</p>
                    <p>Please select the question type and enter your prompt below.</p>
                </div>
            </div>
        `);
  }

  // Show the blur overlay and sidepanel
  $("#blurOverlay").show();
  $("#aiGeneratorPanel").addClass("open");

  // Initialize HTML editor for the prompt input
  setTimeout(() => {
    initializeAiPromptEditor();
    initializeHistoryToggle();
    initializeEventHandlers();
    initializeControlsAccordion()
  }, 100);

  // Initialize history toggle
  initializeHistoryToggle();
  initializeControlsAccordion()

  // Initialize HTML editor for AI prompt input
  function initializeAiPromptEditor() {
    const element = $("#ai-prompt-input");
    const elementValue = element.val();

    if (typeof isEnableWirisEditor !== 'undefined' && isEnableWirisEditor) {
      // Use CKEditor when isEnableWirisEditor is true
      if (typeof ClassicEditor !== 'undefined') {
        ClassicEditor.create(element[0], {
          toolbar: {
            items: [
              "undo", "redo", "|",
              "bold", "italic", "|",
              "numberedList", "bulletedList", "|",
              "subscript", "superscript", "specialCharacters", "|",
            ],
          },
          image: {
            toolbar: ["imageTextAlternative", "imageStyle:full", "imageStyle:side"],
          },
          table: {
            contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
          },
        })
          .then((editor) => {
            editor.setData(elementValue);
            editor.model.document.on("change:data", () => {
              element.val(editor.getData());
              updateGenerateButton();
            });
            element.data("ckeditorInstance", editor);
          })
          .catch((error) => {
            console.error("CKEditor initialization failed:", error);
            // Fallback to simple textarea
            element.focus();
          });
      }
    } else {
      // Use Trumbowyg editor when isEnableWirisEditor is false or undefined
      if (typeof $.fn.trumbowyg !== 'undefined') {
        element.trumbowyg({
          semantic: false,
          removeformatPasted: true,
          autogrow: true,
          btns: [
            ["undo", "redo"],
            ["formatting"],
            ["strong", "em", "underline", "del"],
            ["superscript", "subscript"],
            ["link"],
            ["justifyLeft", "justifyCenter", "justifyRight", "justifyFull"],
            ["unorderedList", "orderedList"],
            ["horizontalRule"],
            ["removeformat"],
          ],
        });

        element.trumbowyg("html", elementValue);

        element.on("tbwchange", function () {
          element.val(element.trumbowyg("html"));
          updateGenerateButton();
        });
      } else {
        // Fallback to simple textarea
        element.focus();
      }
    }
  }

  // Initialize history toggle functionality
  function initializeHistoryToggle() {
    $("#ai-history-toggle").off("click").on("click", function () {
      const content = $("#ai-history-content");
      const icon = $(this).find("i:last-child");

      if (content.hasClass("expanded")) {
        content.removeClass("expanded");
        icon.removeClass("fa-chevron-up").addClass("fa-chevron-down");
      } else {
        content.addClass("expanded");
        icon.removeClass("fa-chevron-down").addClass("fa-chevron-up");
      }
    });
  }
  function initializeControlsAccordion() {
    // Ensure all accordions start closed
    $(".ai-controls-row").removeClass("expanded").hide();

    $("#ai-controls-toggle").off("click").on("click", function () {
      const $accordionItem = $(this).closest(".ai-controls-accordian");
      const $rows = $accordionItem.find(".ai-controls-row");
      const $icon = $(this).find("i");

      const isExpanded = $rows.first().is(":visible");

      if (isExpanded) {
        $rows.slideUp().removeClass("expanded");
        $icon.removeClass("fa-chevron-up").addClass("fa-chevron-down");
      } else {
        $rows.slideDown().addClass("expanded");
        $icon.removeClass("fa-chevron-down").addClass("fa-chevron-up");
      }
    });
  }





  // Initialize additional event handlers
  function initializeEventHandlers() {
    // Manual content textarea change handler
    $("#ai-manual-content").off("input").on("input", function () {
      updateGenerateButton();
    });

    // Question type change handler
    $("#ai-question-type, #ai-question-count-footer").off("change").on("change", function () {
      updateGenerateButton();
    });

    // Generate button click handler
    $(".ai-modal-generate").off("click").on("click", function () {
      if (!$(this).prop("disabled")) {
        generateQuestions();
      }
    });
  }



  // Dynamically load PDF.js if not present
  if (!window.pdfjsLib) {
    var script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = function () {
      attachPdfUploadHandler();
    };
    document.head.appendChild(script);
  } else {
    attachPdfUploadHandler();
  }

  function attachPdfUploadHandler() {
    // PDF Upload handler
    $("#ai-upload-pdf").off("change").on("change", function (e) {
      const file = e.target.files[0];
      if (file && file.type === "application/pdf") {
        // Show processing message
        $(".ai-upload-label").html('<i class="fas fa-spinner fa-spin"></i> Processing PDF...');

        const reader = new FileReader();
        reader.onload = function (ev) {
          const typedarray = new Uint8Array(ev.target.result);

          // Enhanced PDF.js configuration for multi-language support
          const loadingTask = pdfjsLib.getDocument({
            data: typedarray,
            // Enable text extraction for complex scripts
            useSystemFonts: true,
            // Improve text extraction accuracy
            verbosity: 0,
            // Enable CMap for better Unicode support
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true
          });

          loadingTask.promise.then(function (pdf) {
            let textPromises = [];
            for (let i = 1; i <= pdf.numPages; i++) {
              textPromises.push(
                pdf.getPage(i).then(function (page) {
                  return page.getTextContent({
                    // Enhanced text extraction options
                    normalizeWhitespace: true,
                    disableCombineTextItems: false
                  }).then(function (textContent) {
                    // Enhanced text processing for multi-language support
                    return processMultiLanguageText(textContent);
                  });
                })
              );
            }
            Promise.all(textPromises).then(function (texts) {
              const fullText = texts.join('\n\n');

              // Detect language of the extracted text
              const detectedLanguage = detectLanguage(fullText);

              // Console log the extracted content with language info
              console.log('=== PDF Content Extracted (Multi-Language) ===');
              console.log('File name:', file.name);
              console.log('File size:', (file.size / 1024).toFixed(2) + ' KB');
              console.log('Number of pages:', pdf.numPages);
              console.log('Text length:', fullText.length, 'characters');
              console.log('Detected language:', detectedLanguage);
              console.log('Contains Arabic:', /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(fullText));
              console.log('Contains Tamil:', /[\u0B80-\u0BFF]/.test(fullText));
              console.log('Full text content:');
              console.log(fullText);
              console.log('===============================================');

              // Display extracted content separately
              displayExtractedContent(fullText, file.name, pdf.numPages);

              // Settings are now always visible in footer

              // Update manual content textarea with extracted content
              $("#ai-manual-content").val(fullText);

              // Clear the prompt input since we now have content
              // setEditorContent("");

              // Reset upload button text and clear file input
              $(".ai-upload-label").html('<i class="fas fa-file-upload"></i> Upload PDF');
              $("#ai-upload-pdf").val(''); // Clear the file input

              // Update generate button state
              updateGenerateButton();

              // Show success message to user
              const languageInfo = detectedLanguage === 'mixed' ? 'Mixed languages detected' :
                detectedLanguage === 'arabic' ? 'Arabic text detected' :
                  detectedLanguage === 'tamil' ? 'Tamil text detected' :
                    detectedLanguage === 'english' ? 'English text detected' :
                      'Language detection unclear';

              alert(`PDF content extracted successfully!\n\nFile: ${file.name}\nPages: ${pdf.numPages}\nCharacters: ${fullText.length}\nLanguage: ${languageInfo}\n\nContent has been loaded and settings are now available.`);
            });
          }).catch(function (error) {
            console.error('Error loading PDF:', error);
            // Reset upload button text and clear file input
            $(".ai-upload-label").html('<i class="fas fa-file-upload"></i> Upload PDF');
            $("#ai-upload-pdf").val(''); // Clear the file input
            alert("Error reading PDF file. Please try again.");
          });
        };
        reader.readAsArrayBuffer(file);
      } else {
        // Reset upload button text and clear file input
        $(".ai-upload-label").html('<i class="fas fa-file-upload"></i> Upload PDF');
        $("#ai-upload-pdf").val(''); // Clear the file input
        alert("Please upload a valid PDF file.");
      }
    });

    // Click handler for label
    // $(".ai-upload-label").off("click").on("click", function() {
    //   $("#ai-upload-pdf").click();
    // });
  }





  // Add event listeners
  $(".ai-sidepanel-close-btn").off("click").on("click", closeAiSidepanel);
  $("#ai-prompt-input, #ai-question-type, #ai-blooms-level, #ai-complexity-level, #ai-include-reasoning, #ai-case-based")
    .off("input change")
    .on("input change", updateGenerateButton);
  $(".ai-modal-generate").off("click").on("click", generateQuestions);

  // Settings are now always visible in footer - no toggle needed



  // Allow pressing Enter to submit
  $("#ai-prompt-input")
    .off("keydown")
    .on("keydown", function (e) {
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !$(".ai-modal-generate").prop("disabled")
      ) {
        e.preventDefault();
        generateQuestions();
      }
    });
}

// Enable/disable generate button based on input and type selection
function updateGenerateButton() {
  const $generateBtn = $(".ai-modal-generate");

  // Check if we have content from PDF, manual content, or user prompt
  const hasContent = $("#ai-content-display").data('fullContent') || false;
  const hasManualContent = $("#ai-manual-content").val().trim() !== "";

  let hasUserPrompt = false;
  if ($("#ai-prompt-input").data("ckeditorInstance")) {
    hasUserPrompt = $("#ai-prompt-input").data("ckeditorInstance").getData().trim() !== "";
  } else if ($("#ai-prompt-input").data("trumbowyg")) {
    hasUserPrompt = $("#ai-prompt-input").trumbowyg("html").trim() !== "";
  } else {
    hasUserPrompt = $("#ai-prompt-input").val().trim() !== "";
  }

  const hasType = $("#ai-question-type").val() !== "";
  const questionCount = $("#ai-question-count-footer").val() || "3";

  // Check if we have any content source and a question type
  const canGenerate = (hasContent || hasManualContent || hasUserPrompt) && hasType;

  if (canGenerate) {
    $generateBtn.prop("disabled", false);
    $generateBtn.removeClass("ai-btn-disabled").addClass("ai-btn-enabled");
    $generateBtn.html(`<i class="fas fa-magic"></i> Generate ${questionCount} Questions`);
    $generateBtn.attr("title", "Generate AI-powered questions based on your content and settings");
  } else {
    $generateBtn.prop("disabled", true);
    $generateBtn.removeClass("ai-btn-enabled").addClass("ai-btn-disabled");

    // Provide helpful feedback based on what's missing
    if (!hasType) {
      $generateBtn.html(`<i class="fas fa-exclamation-circle"></i> Select Question Type`);
      $generateBtn.attr("title", "Please select a question type to continue");
    } else if (!hasContent && !hasManualContent && !hasUserPrompt) {
      $generateBtn.html(`<i class="fas fa-file-upload"></i> Add Content or Instructions`);
      $generateBtn.attr("title", "Please upload a PDF, add content, or provide instructions");
    } else {
      $generateBtn.html(`<i class="fas fa-magic"></i> Generate Questions`);
      $generateBtn.attr("title", "Generate AI-powered questions");
    }
  }

  // Always show the button
  $generateBtn.show();
}

// Generate questions function - moved to global scope for accessibility
function generateQuestions() {
  const $promptInput = $("#ai-prompt-input");

  // Get user prompt from editor or textarea
  let userPrompt = "";
  if ($promptInput.data("ckeditorInstance")) {
    userPrompt = $promptInput.data("ckeditorInstance").getData().trim();
  } else if ($promptInput.data("trumbowyg")) {
    userPrompt = $promptInput.trumbowyg("html").trim();
  } else {
    userPrompt = $promptInput.val().trim();
  }

  // Get content from multiple sources
  const extractedContent = $("#ai-content-display").data('fullContent') || "";
  const manualContent = $("#ai-manual-content").val().trim();
  const content = extractedContent || manualContent;

  const questionType = $("#ai-question-type").val();

  // Check if we have any content source or user prompt
  if ((!content && !userPrompt) || !questionType) {
    return;
  }

  // Get generation settings
  const settings = {
    questionType: questionType,
    content: content,
    userPrompt: userPrompt,
    bloomsLevel: $("#ai-blooms-level").val() || "understand",
    complexity: $("#ai-complexity-level").val() || "intermediate",
    questionCount: parseInt($("#ai-question-count-footer").val()) || 3,
    includeReasoning: $("#ai-include-reasoning").is(':checked'),
    caseBased: $("#ai-case-based").is(':checked')
  };

  // Validate settings (using functions from ai-prompt-generator.js)
  const validation = typeof validatePromptSettings === 'function' ?
    validatePromptSettings(settings) : { isValid: true, errors: [] };
  if (!validation.isValid) {
    alert("Settings validation failed:\n" + validation.errors.join('\n'));
    return;
  }

  // Generate the AI prompt using the prompt generator
  const aiPrompt = typeof generateAIPrompt === 'function' ?
    generateAIPrompt(settings) : createFallbackPrompt(settings);

  // Add to generation history for debugging
  addToGenerationHistory(aiPrompt, settings);

  // Add user message to chat
  const questionTypeName = $("#ai-question-type option:selected").text();
  const bloomsName = $("#ai-blooms-level option:selected").text().split(' - ')[0];
  const complexityName = $("#ai-complexity-level option:selected").text().split(' - ')[0];

  addChatMessage(
    `
        <p><strong>Question Type:</strong> ${questionTypeName}</p>
        <p><strong>Bloom's Level:</strong> ${bloomsName}</p>
        <p><strong>Complexity:</strong> ${complexityName}</p>
        <p><strong>Count:</strong> ${settings.questionCount}</p>
        ${settings.includeReasoning ? '<p><strong>Include Reasoning:</strong> Yes</p>' : ''}
        ${settings.caseBased ? '<p><strong>Case-Based:</strong> Yes</p>' : ''}
        ${userPrompt ? `<p><strong>Instructions:</strong> ${userPrompt}</p>` : ''}
    `,
    true
  );

  // Clear input
  if ($promptInput.data("ckeditorInstance")) {
    $promptInput.data("ckeditorInstance").setData("");
  } else if ($promptInput.data("trumbowyg")) {
    $promptInput.trumbowyg("html", "");
  } else {
    $promptInput.val("");
  }

  // Show loader and hide generate button
  $(".ai-loader").html(`
      <div class="ai-spinner"></div>
      <span>Generating ${settings.questionCount} Questions...</span>
    `).css("display", "flex");
  $(".ai-modal-generate").hide();

  // Prepare request body with the generated prompt
  const requestBody = {
    temperature: 0.6,
    data: "",
    input: aiPrompt,
  };

  // Make the API request using jQuery AJAX
  Ai_model_name = "gemini-2.5-pro";

  $.ajax({
    url: "https://gemini-pro-chatbot-1030409224402.asia-south1.run.app/vertexai_custom_model/chat_bot?userModel=" + Ai_model_name,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(requestBody),
    success: function (data) {
      // Hide loader and show generate button
      $(".ai-loader").css("display", "none");
      $(".ai-modal-generate").show();
      $(".ai-modal-generate").prop("disabled", true);

      // Check if the response is in 'responce' or 'reply'
      const responseText = data.responce || data.reply;

      if (!responseText) {
        addChatMessage(
          "The API response doesn't contain valid data. Please try again.",
          false,
          true
        );
        return;
      }

      // Parse response to extract JSON - handle both markdown and regular JSON formats
      let jsonString = responseText;

      // Extract JSON from markdown code block if present
      if (responseText.includes("```json")) {
        const jsonStart = responseText.indexOf(
          "[",
          responseText.indexOf("```json")
        );
        const jsonEnd = responseText.lastIndexOf("]") + 1;
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          jsonString = responseText.substring(jsonStart, jsonEnd);
        }
      } else {
        // Regular JSON response
        const jsonStart = responseText.indexOf("[");
        const jsonEnd = responseText.lastIndexOf("]") + 1;
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          jsonString = responseText.substring(jsonStart, jsonEnd);
        }
      }

      try {
        const questions = JSON.parse(jsonString);

        // Display questions in the chat
        renderQuestionsInChat(questions);
      } catch (error) {
        // Handle JSON parsing error
        addChatMessage(
          "Failed to parse generated questions. Please try again with a different prompt.",
          false,
          true
        );
        console.error(
          "JSON parsing error:",
          error,
          "Text to parse:",
          jsonString
        );
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      // Hide loader and show generate button
      $(".ai-loader").css("display", "none");
      $(".ai-modal-generate").show();

      addChatMessage(
        "An error occurred while generating questions. Please try again later.",
        false,
        true
      );
      console.error("Error:", textStatus, errorThrown);
    },
  });
}

// Helper function to convert plain text to HTML with multi-language support
function convertTextToHtml(text) {
  if (!text) return '';

  // Detect language for proper formatting
  const detectedLanguage = detectLanguage(text);
  const isRTL = detectedLanguage === 'arabic';

  // Split text into paragraphs and convert to HTML
  const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');
  let htmlContent = '';

  paragraphs.forEach(paragraph => {
    // Clean up the paragraph text
    const cleanParagraph = paragraph.replace(/\n/g, ' ').trim();
    if (cleanParagraph) {
      // Add direction and language-specific styling to each paragraph
      const direction = isRTL ? 'rtl' : 'ltr';
      const textAlign = isRTL ? 'right' : 'left';
      const langAttr = detectedLanguage === 'arabic' ? 'ar' :
        detectedLanguage === 'tamil' ? 'ta' : 'en';

      htmlContent += `<p dir="${direction}" style="text-align: ${textAlign}; margin-bottom: 1em;" lang="${langAttr}">${cleanParagraph}</p>`;
    }
  });

  return htmlContent || `<p dir="${isRTL ? 'rtl' : 'ltr'}" style="text-align: ${isRTL ? 'right' : 'left'};">${text.replace(/\n/g, '<br>')}</p>`;
}

// Function to display extracted content separately with multi-language support
function displayExtractedContent(content, fileName, pageCount) {
  const contentDisplay = $("#ai-content-display");
  const contentPreview = $("#ai-content-preview");

  // Detect language and set appropriate direction
  const detectedLanguage = detectLanguage(content);
  const isRTL = detectedLanguage === 'arabic';
  const direction = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';

  // Convert content to HTML paragraphs for better display
  const htmlContent = convertTextToHtml(content);

  // Format preview content (first 500 characters)
  const previewContent = content.substring(0, 500) + (content.length > 500 ? '...' : '');

  // Language indicator
  const languageIndicator = detectedLanguage === 'arabic' ? '🇸🇦 Arabic' :
    detectedLanguage === 'tamil' ? '🇮🇳 Tamil' :
      detectedLanguage === 'english' ? '🇺🇸 English' :
        detectedLanguage === 'mixed' ? '🌐 Mixed Languages' :
          '❓ Unknown';

  contentPreview.html(`
      <div style="margin-bottom: 10px; font-size: 12px; color: #6b7280; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
        <div>
          <strong>File:</strong> ${fileName} | <strong>Pages:</strong> ${pageCount} | <strong>Characters:</strong> ${content.length.toLocaleString()} | <strong>Language:</strong> ${languageIndicator}
        </div>
        <div style="display: flex; gap: 8px; margin-top: 5px;">
          <button id="ai-copy-content-btn" class="ai-content-action-btn" style="padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #ffffff; color: #374151; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px;">
            <i class="fas fa-copy"></i> Copy
          </button>
          <button id="ai-download-content-btn" class="ai-content-action-btn" style="padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #ffffff; color: #374151; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px;">
            <i class="fas fa-download"></i> Download
          </button>
        </div>
      </div>
      <div style="white-space: pre-wrap; color: #374151; direction: ${direction}; text-align: ${textAlign}; font-family: ${isRTL ? 'Arial, Tahoma, sans-serif' : 'inherit'}; line-height: 1.6;">${previewContent}</div>
    `);

  // Show content display
  contentDisplay.show();

  // Show settings section after PDF upload
  $("#ai-settings-section").show();

  // Store full content for use in generation
  contentDisplay.data('fullContent', content);
  contentDisplay.data('htmlContent', htmlContent);
  contentDisplay.data('fileName', fileName);
  contentDisplay.data('pageCount', pageCount);
  contentDisplay.data('detectedLanguage', detectedLanguage);
  contentDisplay.data('isRTL', isRTL);

  // Add event listeners for copy and download buttons
  $("#ai-copy-content-btn").off("click").on("click", function () {
    const contentToCopy = $("#ai-content-display").data('fullContent');
    if (contentToCopy) {
      navigator.clipboard.writeText(contentToCopy).then(() => {
        $(this).html('<i class="fas fa-check"></i> Copied!');
        setTimeout(() => {
          $(this).html('<i class="fas fa-copy"></i> Copy');
        }, 2000);
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = contentToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        $(this).html('<i class="fas fa-check"></i> Copied!');
        setTimeout(() => {
          $(this).html('<i class="fas fa-copy"></i> Copy');
        }, 2000);
      });
    }
  });

  $("#ai-download-content-btn").off("click").on("click", function () {
    const contentToDownload = $("#ai-content-display").data('fullContent');
    const fileNameToUse = $("#ai-content-display").data('fileName');
    if (contentToDownload && fileNameToUse) {
      const blob = new Blob([contentToDownload], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileNameToUse.replace('.pdf', '')}_extracted_content.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  });

  // Update generate button state
  updateGenerateButton();
}

// Fallback prompt creation function if ai-prompt-generator.js fails to load
function createFallbackPrompt(settings) {
  const {
    questionType,
    content,
    userPrompt,
    bloomsLevel = 'understand',
    complexity = 'intermediate',
    questionCount = 1,
    includeReasoning = false,
    caseBased = false
  } = settings;

  // Start with base prompt including Bloom's taxonomy level
  let prompt = `Create ${questionCount} high-quality ${questionType} question(s) at the "${bloomsLevel}" level of Bloom's Taxonomy with ${complexity} complexity.`;

  // Add Bloom's level specific guidance
  switch (bloomsLevel) {
    case 'remember':
      prompt += `\n\nFocus on: Recall of facts, basic concepts, definitions, and terminology.`;
      break;
    case 'understand':
      prompt += `\n\nFocus on: Comprehension, explanation of ideas, interpretation, and summarization.`;
      break;
    case 'apply':
      prompt += `\n\nFocus on: Application of knowledge in new situations, using information to solve problems.`;
      break;
    case 'analyze':
      prompt += `\n\nFocus on: Breaking down information, identifying relationships, and examining components.`;
      break;
    case 'evaluate':
      prompt += `\n\nFocus on: Making judgments, critiquing, and justifying decisions or conclusions.`;
      break;
    case 'create':
      prompt += `\n\nFocus on: Synthesizing information, generating new ideas, and producing original work.`;
      break;
  }

  // Add content if provided
  if (content) {
    prompt += `\n\nBASE ALL QUESTIONS ON THIS CONTENT:\n"""\n${content}\n"""`;
    prompt += `\n\nEnsure questions directly relate to and test understanding of the provided content.`;
  }

  // Add user instructions with special emphasis
  if (userPrompt) {
    prompt += `\n\n🎯 SPECIAL INSTRUCTIONS (FOLLOW THESE CAREFULLY):\n${userPrompt}`;
    prompt += `\n\nPlease incorporate these specific instructions into your question generation process.`;
  }

  // Add case-based instruction
  if (caseBased) {
    prompt += `\n\n📋 CASE-BASED REQUIREMENT: Create realistic scenario-based questions that present practical situations requiring application of knowledge.`;
  }

  // Add reasoning requirement
  if (includeReasoning) {
    prompt += `\n\n💡 REASONING REQUIREMENT: Include detailed explanations for correct answers that help students understand the underlying concepts.`;
  }

  // Add quality guidelines
  prompt += `\n\n✅ QUALITY GUIDELINES:
- Questions should be clear, unambiguous, and grammatically correct
- Avoid trick questions or overly complex language
- Ensure appropriate difficulty level for the target audience
- Make questions pedagogically sound and educationally valuable`;

  // Add specific format instructions based on question type
  prompt += `\n\n📋 OUTPUT FORMAT REQUIREMENTS:`;
  switch (questionType) {
    case 'MCQ':
      prompt += `\nReturn a JSON array with objects containing:
- type: "MCQ"
- question: "Clear question text"
- choices: Array of {key: "A/B/C/D", label: "Choice text", isCorrect: boolean}
- correctAnswerKey: "A/B/C/D"
${includeReasoning ? '- explanation: "Detailed explanation of why the answer is correct"' : ''}`;
      break;
    case 'FTB':
      prompt += `\nReturn a JSON array with objects containing:
- type: "FTB"
- question: "Question with _____ blanks"
- blanks: Array of {identity: number, values: [{value: "answer", isCorrect: true}]}
- questionText: "Complete question text"
${includeReasoning ? '- explanation: "Explanation of the correct answers"' : ''}`;
      break;
    case 'SAQ':
      prompt += `\nReturn a JSON array with objects containing:
- type: "SAQ"
- question: "Open-ended question"
- correctAnswer: "Sample correct answer"
- maxMarks: number
- keywords: Array of important keywords
${includeReasoning ? '- explanation: "Detailed explanation and marking criteria"' : ''}`;
      break;
    case 'TF':
      prompt += `\nReturn a JSON array with objects containing:
- type: "TF"
- question: "True/False question"
- correctAnswer: boolean
- statement: "The statement being evaluated"
${includeReasoning ? '- explanation: "Explanation of why the statement is true/false"' : ''}`;
      break;
    case 'MAQ':
      prompt += `\nReturn a JSON array with objects containing:
- type: "MAQ"
- question: "Multiple answer question"
- choices: Array of choice objects
- correctAnswerKeys: Array of correct choice keys
- minSelections: minimum number to select
- maxSelections: maximum number to select
${includeReasoning ? '- explanation: "Explanation of all correct answers"' : ''}`;
      break;
    case 'ORD':
      prompt += `\nReturn a JSON array with objects containing:
- type: "ORD"
- question: "Ordering question"
- items: Array of {id: number, text: "item text", correctOrder: number}
${includeReasoning ? '- explanation: "Explanation of the correct sequence"' : ''}`;
      break;
    case 'MTF':
      prompt += `\nReturn a JSON array with objects containing:
- type: "MTF"
- question: "Match the following"
- leftColumn: Array of items to match from
- rightColumn: Array of items to match to
- correctMatches: Object mapping left to right items
${includeReasoning ? '- explanation: "Explanation of all correct matches"' : ''}`;
      break;
    default:
      prompt += `\nReturn a JSON array with proper structure for ${questionType} questions.`;
  }

  prompt += `\n\n⚠️ IMPORTANT: Return ONLY the JSON array, no additional text or markdown formatting.`;

  return prompt;
}

// Multi-language text processing function
function processMultiLanguageText(textContent) {
  if (!textContent || !textContent.items) {
    return '';
  }

  let processedText = '';
  let currentLine = '';
  let lastY = null;
  let isRTL = false;

  // Sort items by position for better text flow
  const sortedItems = textContent.items.sort((a, b) => {
    // Sort by Y position first (top to bottom), then by X position
    const yDiff = Math.abs(b.transform[5] - a.transform[5]);
    if (yDiff > 5) { // Different lines
      return b.transform[5] - a.transform[5];
    }
    // Same line, sort by X position
    return a.transform[4] - b.transform[4];
  });

  sortedItems.forEach((item, index) => {
    const text = item.str;
    const y = item.transform[5];
    const x = item.transform[4];

    // Skip empty strings
    if (!text.trim()) return;

    // Detect if text contains RTL characters (Arabic)
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    const tamilRegex = /[\u0B80-\u0BFF]/;

    if (arabicRegex.test(text)) {
      isRTL = true;
    }

    // Check if we're on a new line
    if (lastY !== null && Math.abs(y - lastY) > 5) {
      // New line detected
      if (currentLine.trim()) {
        processedText += currentLine.trim() + '\n';
      }
      currentLine = '';
    }

    // Add current text to line
    if (currentLine && !currentLine.endsWith(' ') && !text.startsWith(' ')) {
      currentLine += ' ';
    }
    currentLine += text;

    lastY = y;
  });

  // Add the last line
  if (currentLine.trim()) {
    processedText += currentLine.trim();
  }

  // Clean up the text
  processedText = cleanMultiLanguageText(processedText, isRTL);

  return processedText;
}

// Function to clean and normalize multi-language text
function cleanMultiLanguageText(text, isRTL = false) {
  if (!text) return '';

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ');

  // Handle RTL text (Arabic)
  if (isRTL) {
    // Remove unnecessary RTL/LTR marks
    text = text.replace(/[\u200E\u200F\u202A-\u202E]/g, '');

    // Fix common Arabic text issues
    text = text.replace(/\s+([،؛؟!])/g, '$1'); // Remove space before punctuation
    text = text.replace(/([،؛؟!])\s+/g, '$1 '); // Ensure single space after punctuation
  }

  // Handle Tamil text
  const tamilRegex = /[\u0B80-\u0BFF]/;
  if (tamilRegex.test(text)) {
    // Tamil-specific text cleaning
    text = text.replace(/\u0BCD\s+/g, '\u0BCD'); // Fix Tamil virama spacing
  }

  // General text cleaning
  text = text.replace(/\n\s*\n/g, '\n\n'); // Normalize paragraph breaks
  text = text.replace(/^\s+|\s+$/g, ''); // Trim

  return text;
}

// Detect language of the extracted text
function detectLanguage(text) {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  const tamilRegex = /[\u0B80-\u0BFF]/;
  const englishRegex = /[a-zA-Z]/;

  const arabicMatches = (text.match(arabicRegex) || []).length;
  const tamilMatches = (text.match(tamilRegex) || []).length;
  const englishMatches = (text.match(englishRegex) || []).length;

  const total = arabicMatches + tamilMatches + englishMatches;

  if (total === 0) return 'unknown';

  const arabicPercent = (arabicMatches / total) * 100;
  const tamilPercent = (tamilMatches / total) * 100;
  const englishPercent = (englishMatches / total) * 100;

  if (arabicPercent > 30) return 'arabic';
  if (tamilPercent > 30) return 'tamil';
  if (englishPercent > 50) return 'english';

  return 'mixed';
}

// Add prompt to generation history for debugging
function addToGenerationHistory(prompt, settings) {
  const timestamp = new Date().toLocaleString();
  const historyContent = $("#ai-history-content");
  const historyEmpty = historyContent.find(".ai-history-empty");

  // Remove empty message if it exists
  if (historyEmpty.length) {
    historyEmpty.remove();
  }

  // Create history item
  const historyItem = $(`
    <div class="ai-history-item">
      <div class="ai-history-timestamp">${timestamp}</div>
      <div class="ai-history-settings">
        <strong>Type:</strong> ${settings.questionType} | 
        <strong>Count:</strong> ${$("#ai-question-count-footer").val() || settings.questionCount} | 
        <strong>Bloom's:</strong> ${settings.bloomsLevel} | 
        <strong>Complexity:</strong> ${settings.complexity}
      </div>
      <div class="ai-history-prompt">${prompt}</div>
    </div>
  `);

  // Add to history (newest first)
  historyContent.prepend(historyItem);

  // Update history count
  const historyCount = historyContent.find(".ai-history-item").length;
  $("#ai-history-toggle span").html(`<i class="fas fa-history" style="color: #6366f1;"></i> Generation History (${historyCount})`);

  // Limit history to last 10 items
  const historyItems = historyContent.find(".ai-history-item");
  if (historyItems.length > 10) {
    historyItems.slice(10).remove();
  }
}

function addChatMessage(message, isUser = false, isError = false) {
  const $messagesContainer = $(".ai-chat-messages");

  const className = isUser
    ? "ai-user-message"
    : isError
      ? "ai-error-message"
      : "ai-assistant-message";

  const $messageDiv = $("<div>", {
    class: className,
  });

  let avatar = "";
  if (isUser) {
    avatar = '<div class="ai-avatar"><i class="fas fa-user"></i></div>';
  } else if (!isError) {
    avatar = '<div class="ai-avatar"><img src="../../common/imgs/heba-logo.gif" alt="AI" class="ai-avatar-img" style="background: white; padding: 2px;"></div>';
  }

  $messageDiv.html(`
        ${avatar}
        <div class="ai-message-content">${message}</div>
    `);

  $messagesContainer.append($messageDiv);

  // Scroll to bottom
  $messagesContainer.scrollTop($messagesContainer[0].scrollHeight);
}

function closeAiSidepanel() {
  // Clear history items
  $("#ai-history-content").empty();

  // Append empty state message
  $("#ai-history-content").html(`
    <div class="ai-history-empty">
      <p style="padding: 15px; text-align: center; color: #6b7280; font-style: italic;">
        No generation history yet. Generate questions to see prompt history here.
      </p>
    </div>
  `);

  // Reset history toggle count
  $("#ai-history-toggle span").html(`<i class="fas fa-history" style="color: #6366f1;"></i> Generation History (0)`);

  // Close the panel
  $("#blurOverlay").hide();
  $("#aiGeneratorPanel").removeClass("open");
}




function generateQuestions() {
  const $promptInput = $("#ai-prompt-input");

  // Get user prompt from editor or textarea
  let userPrompt = "";
  if ($promptInput.data("ckeditorInstance")) {
    userPrompt = $promptInput.data("ckeditorInstance").getData().trim();
  } else if ($promptInput.data("trumbowyg")) {
    userPrompt = $promptInput.trumbowyg("html").trim();
  } else {
    userPrompt = $promptInput.val().trim();
  }

  // Get content from multiple sources
  const extractedContent = $("#ai-content-display").data('fullContent') || "";
  const manualContent = $("#ai-manual-content").val().trim();
  const content = extractedContent || manualContent;

  const questionType = $("#ai-question-type").val();

  // Check if we have any content source or user prompt
  if ((!content && !userPrompt) || !questionType) {
    return;
  }

  // Get generation settings
  const settings = {
    questionType: questionType,
    content: content,
    userPrompt: userPrompt,
    bloomsLevel: $("#ai-blooms-level").val() || "understand",
    complexity: $("#ai-complexity-level").val() || "intermediate",
    questionCount: parseInt($("#ai-question-count-footer").val()) || 3,
    includeReasoning: $("#ai-include-reasoning").is(':checked'),
    caseBased: $("#ai-case-based").is(':checked')
  };

  // Validate settings (using functions from ai-prompt-generator.js)
  const validation = typeof validatePromptSettings === 'function' ?
    validatePromptSettings(settings) : { isValid: true, errors: [] };
  if (!validation.isValid) {
    alert("Settings validation failed:\n" + validation.errors.join('\n'));
    return;
  }

  // Generate the AI prompt using the prompt generator
  const aiPrompt = typeof generateAIPrompt === 'function' ?
    generateAIPrompt(settings) : createFallbackPrompt(settings);

  // Add to generation history for debugging
  addToGenerationHistory(aiPrompt, settings);

  // Add user message to chat
  const questionTypeName = $("#ai-question-type option:selected").text();
  const bloomsName = $("#ai-blooms-level option:selected").text().split(' - ')[0];
  const complexityName = $("#ai-complexity-level option:selected").text().split(' - ')[0];

  addChatMessage(
    `
          <p><strong>Question Type:</strong> ${questionTypeName}</p>
          <p><strong>Bloom's Level:</strong> ${bloomsName}</p>
          <p><strong>Complexity:</strong> ${complexityName}</p>
          <p><strong>Count:</strong> ${settings.questionCount}</p>
          ${settings.includeReasoning ? '<p><strong>Include Reasoning:</strong> Yes</p>' : ''}
          ${settings.caseBased ? '<p><strong>Case-Based:</strong> Yes</p>' : ''}
          ${userPrompt ? `<p><strong>Instructions:</strong> ${userPrompt}</p>` : ''}
      `,
    true
  );

  // Clear input
  if ($promptInput.data("ckeditorInstance")) {
    $promptInput.data("ckeditorInstance").setData("");
  } else if ($promptInput.data("trumbowyg")) {
    $promptInput.trumbowyg("html", "");
  } else {
    $promptInput.val("");
  }

  // Show loader and hide generate button
  $(".ai-loader").html(`
      <div class="ai-spinner"></div>
      <span>Generating ${settings.questionCount} Questions...</span>
    `).css("display", "flex");
  $(".ai-modal-generate").hide();

  // Prepare request body with the generated prompt
  const requestBody = {
    temperature: 0.6,
    data: "",
    input: aiPrompt,
  };

  // Make the API request using jQuery AJAX
  Ai_model_name = "gemini-2.5-pro";

  $.ajax({
    url: "https://gemini-pro-chatbot-1030409224402.asia-south1.run.app/vertexai_custom_model/chat_bot?userModel=" + Ai_model_name,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(requestBody),
    success: function (data) {
      // Hide loader and show generate button
      $(".ai-loader").css("display", "none");
      $(".ai-modal-generate").show();
      $(".ai-modal-generate").prop("disabled", true);

      // Check if the response is in 'responce' or 'reply'
      const responseText = data.responce || data.reply;

      if (!responseText) {
        addChatMessage(
          "The API response doesn't contain valid data. Please try again.",
          false,
          true
        );
        return;
      }

      // Parse response to extract JSON - handle both markdown and regular JSON formats
      let jsonString = responseText;

      // Extract JSON from markdown code block if present
      if (responseText.includes("```json")) {
        const jsonStart = responseText.indexOf(
          "[",
          responseText.indexOf("```json")
        );
        const jsonEnd = responseText.lastIndexOf("]") + 1;
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          jsonString = responseText.substring(jsonStart, jsonEnd);
        }
      } else {
        // Regular JSON response
        const jsonStart = responseText.indexOf("[");
        const jsonEnd = responseText.lastIndexOf("]") + 1;
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          jsonString = responseText.substring(jsonStart, jsonEnd);
        }
      }

      try {
        const questions = JSON.parse(jsonString);

        // Display questions in the chat
        renderQuestionsInChat(questions);
      } catch (error) {
        // Handle JSON parsing error
        addChatMessage(
          "Failed to parse generated questions. Please try again with a different prompt.",
          false,
          true
        );
        console.error(
          "JSON parsing error:",
          error,
          "Text to parse:",
          jsonString
        );
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      // Hide loader and show generate button
      $(".ai-loader").css("display", "none");
      $(".ai-modal-generate").show();

      addChatMessage(
        "An error occurred while generating questions. Please try again later.",
        false,
        true
      );
      console.error("Error:", textStatus, errorThrown);
    },
  });
}

function renderQuestionsInChat(questions) {
  if (!questions || !questions.length) {
    addChatMessage(
      "No questions were generated. Please try again with a different prompt.",
      false,
      true
    );
    return;
  }

  // Create question preview
  let questionsPreview = '<div class="ai-questions-preview">';

  // Add each question to the preview
  questions.forEach((question, index) => {
    questionsPreview += `
            <div class="ai-preview-question" data-question-index="${index}">
                <div class="ai-question-header">
                    <h4>Question ${index + 1} (${question.type})</h4>
                    <div class="ai-question-header-right">
                        <button class="ai-single-import" title="Import this question" data-index="${index}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="ai-question-text">${question.question}</div>
        `;

    // Add question-type specific content
    if (question.type === "MCQ") {
      questionsPreview += '<div class="ai-question-choices">';
      question.choices.forEach((choice) => {
        const isCorrect = choice.isCorrect;
        questionsPreview += `
                    <div class="ai-question-choice ${isCorrect ? "correct" : ""
          }">
                        <span class="ai-choice-key">${choice.key}</span>
                        <span class="ai-choice-label">${choice.label}</span>
                        ${isCorrect
            ? '<span class="ai-correct-badge">Correct</span>'
            : ""
          }
                    </div>
                `;
      });
      questionsPreview += "</div>";
    } else if (question.type === "FTB") {
      questionsPreview += '<div class="ai-question-blanks">';
      question.blanks.forEach((blank) => {
        const correctValue =
          blank.values.find((val) => val.isCorrect)?.value ||
          blank.values[0].value;
        questionsPreview += `
                    <div class="ai-blank-item">
                        <span class="ai-blank-label">Blank ${blank.identity}:</span>
                        <span class="ai-blank-value">${correctValue}</span>
                    </div>
                `;
      });
      questionsPreview += "</div>";
    } else if (question.type === "SAQ") {
      questionsPreview += `
                <div class="ai-question-answer">
                    <div class="ai-answer-label">Sample Answer:</div>
                    <div class="ai-answer-text">${question.correctAnswer}</div>
                </div>
            `;
    }

    questionsPreview += "</div>";
  });

  // Add action button - import all button
  questionsPreview += `
        <div class="ai-questions-actions">
            <button class="ai-action-import" title="Import All Questions">
                Import All
            </button>
        </div>
    </div>`;

  // Add to chat
  addChatMessage(questionsPreview);

  // Add event listener for import all button
  $(".ai-action-import").on("click", function () {
    importGeneratedQuestions(questions);
    addChatMessage("All questions successfully imported!", false);

    // Close sidepanel after a short delay
    setTimeout(() => {
      closeAiSidepanel();
    }, 1500);
  });

  // Add event listener for single question import
  $(".ai-single-import").on("click", function () {
    const index = $(this).data("index");
    const singleQuestion = [questions[index]];

    importGeneratedQuestions(singleQuestion);

    // Add a success message
    addChatMessage(`Question ${index + 1} successfully imported!`, false);

    // Mark the question as imported
    $(this)
      .prop("disabled", true)
      .html('<i class="fas fa-check"></i>')
      .addClass("imported");
  });
}

function importGeneratedQuestions(questions) {
  try {
    // Map AI model output format to the format expected by addImportedQuestions
    const mappedQuestions = questions.map((q) => {
      let mappedQuestion = {
        type: q.type,
        question: q.question,
        marks: 1, // Set default mark to 1
      };

      // Add type-specific properties
      if (q.type === "MCQ") {
        mappedQuestion.choices = q.choices;
        mappedQuestion.correctChoices = q.choices
          .filter((choice) => choice.isCorrect)
          .map((choice) => choice.key);
      } else if (q.type === "FTB") {
        mappedQuestion.blanks = q.blanks;
      } else if (q.type === "SAQ") {
        mappedQuestion.correctAnswer = q.correctAnswer;
      }

      return mappedQuestion;
    });

    addImportedQuestions(mappedQuestions);

    // Show success message
    displayToast(
      "Questions successfully imported from AI generator",
      "success"
    );
  } catch (error) {
    console.error("Error importing questions:", error);
    displayToast("An error occurred while importing questions", "error");
  }
}
