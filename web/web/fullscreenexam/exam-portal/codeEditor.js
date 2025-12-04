// Code Editor Implementation
let editor = null;
let codeEditorContainer = null;
let currentLanguage = "javascript";
let currentTheme = "vs-dark";
let currentValue = "";
let currentCallback = null;

// Initialize the code editor
function initCodeEditor() {
  const $editorContainer = $(".editor-attachment-main-container");

  // Clear the container first
  $editorContainer.empty();

  // Create UI elements
  createEditorUI($editorContainer);

  // Initialize Monaco Editor
  codeEditorContainer = document.getElementById("monaco-editor-container");
  editor = monaco.editor.create(codeEditorContainer, {
    value: currentValue,
    language: currentLanguage,
    theme: currentTheme,
    automaticLayout: true,
    minimap: {
      enabled: true,
    },
    scrollBeyondLastLine: false,
    lineNumbers: "on",
    renderLineHighlight: "all",
    fontFamily: 'Consolas, "Courier New", monospace',
    fontSize: 14,
    tabSize: 2,
    roundedSelection: true,
    autoIndent: "full",
  });

  // Add resize listener
  window.addEventListener("resize", () => {
    if (editor) {
      editor.layout();
    }
  });

  // Setup event listeners
  setupEventListeners();
}

// Create the editor UI
function createEditorUI($container) {
  const editorHTML = `
    <div class="code-editor-wrapper" id="prq-code-editor">
      <div class="code-editor-toolbar" id="editor-toolbar">
        <div class="editor-controls">
          <div class="language-selector">
            <label for="language-select">Language:</label>
            <select id="language-select" class="code-select">
              ${programmingLanguages
                .map(
                  (lang) =>
                    `<option value="${lang.id}" ${
                      lang.id === currentLanguage ? "selected" : ""
                    }>${lang.name}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="theme-selector">
            <label for="theme-select">Theme:</label>
            <select id="theme-select" class="code-select">
              ${themes
                .map(
                  (theme) =>
                    `<option value="${theme.id}" ${
                      theme.id === currentTheme ? "selected" : ""
                    }>${theme.name}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="editor-actions">
            <button id="format-code-btn" class="editor-btn" title="Format Code">
              <i class="fas fa-align-left"></i>
            </button>
            <button id="copy-code-btn" class="editor-btn" title="Copy Code">
              <i class="fas fa-copy"></i>
            </button>
          </div>
        </div>
        
        <button id="run-code-btn" class="editor-btn-run">
          <i class="fas fa-play"></i> Run Code
        </button>
      </div>
      <div class="code-editor-layout" id="editor-main-layout">
        <div id="monaco-editor-container" class="code-editor-main"></div>
        <div class="code-editor-output" id="output-panel">
          <div class="output-header">
            <h3>Output</h3>
            <button id="clear-output-btn" class="editor-btn">
              <i class="fas fa-trash"></i> Clear
            </button>
          </div>
          <div id="output-container">
            <pre id="code-output">// Run code to see output here</pre>
          </div>
          <div id="code-loader" style="display: none;">
            <div class="spinner"></div>
            <span>Running code...</span>
          </div>
        </div>
      </div>
      <div class="code-editor-footer" id="editor-footer">
        <div class="editor-status">
          <span id="editor-position">Line: 1, Column: 1</span>
          <span id="editor-mode">JavaScript</span>
        </div>
      </div>
    </div>
  `;

  $container.html(editorHTML);
}

// Get file extension for language
function getFileExtension(language) {
  const extensions = {
    javascript: "js",
    typescript: "ts",
    python: "py",
    java: "java",
    c: "c",
    cpp: "cpp",
    csharp: "cs",
    php: "php",
    html: "html",
    css: "css",
    sql: "sql",
  };

  return extensions[language] || "txt";
}

// Execute code using Piston API
async function executeCode(code, language) {
  const outputContainer = document.getElementById("code-output");
  const loader = document.getElementById("code-loader");

  // Show loader
  loader.style.display = "flex";
  outputContainer.innerText = "Sending code to execution service...";

  try {
    const pistonLang = PISTON_LANGUAGE_MAP[language];

    if (!pistonLang) {
      outputContainer.innerText =
        "❌ Error: Unsupported language for execution.";
      loader.style.display = "none";
      return;
    }

    // For non-runnable languages, show special message
    if (language === "html" || language === "css") {
      setTimeout(() => {
        outputContainer.innerHTML = `<div style="color: #FFA500">
          <p>HTML and CSS cannot be executed directly.</p>
          <p>Preview functionality will be available in a future update.</p>
        </div>`;
        loader.style.display = "none";
      }, 1000);
      return;
    }

    const response = await fetch(PISTON_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: pistonLang.language,
        version: pistonLang.version,
        files: [
          {
            name: `code.${getFileExtension(language)}`,
            content: code,
          },
        ],
      }),
    });

    const result = await response.json();

    if (result.run && result.run.output !== undefined) {
      // Show compiler errors if any
      if (result.compile && result.compile.stderr) {
        outputContainer.innerHTML = `<div style="color: #FF6347">❌ Compilation Error:</div>
          <pre style="color: #FF6347">${escapeHtml(
            result.compile.stderr
          )}</pre>`;
      } else if (result.run.stderr) {
        outputContainer.innerHTML = `<div style="color: #FF6347">❌ Runtime Error:</div>
          <pre style="color: #FF6347">${escapeHtml(result.run.stderr)}</pre>`;
      } else {
        outputContainer.innerHTML = result.run.output
          ? `<div style="color: #4CAF50">✅ Program Output:</div>
             <pre>${escapeHtml(result.run.output)}</pre>`
          : `<div style="color: #4CAF50">✅ Program executed successfully with no output.</div>`;
      }
    } else {
      outputContainer.innerHTML = `<div style="color: #FF6347">❌ Error: No output received from execution service.</div>`;
    }
  } catch (error) {
    outputContainer.innerHTML = `<div style="color: #FF6347">❌ Error: ${error.message}</div>`;
  }

  // Hide loader
  loader.style.display = "none";
}

// Escape HTML for safe output display
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Setup event listeners for code editor UI
function setupEventListeners() {
  if (!editor) return;

  // Theme selection
  $("#theme-select").on("change", function () {
    const newTheme = $(this).val();
    monaco.editor.setTheme(newTheme);
    currentTheme = newTheme;
  });

  // Language selection (only enabled if not locked to a specific language)
  $("#language-select").on("change", function () {
    const newLanguage = $(this).val();
    monaco.editor.setModelLanguage(editor.getModel(), newLanguage);
    currentLanguage = newLanguage;
    $("#editor-mode").text(getProgrammingLanguageName(newLanguage));
  });

  // Run code button
  $("#run-code-btn").on("click", function () {
    const code = editor.getValue();
    executeCode(code, currentLanguage);
  });

  // Format code button
  $("#format-code-btn").on("click", function () {
    editor.getAction("editor.action.formatDocument").run();
  });

  // Copy code button
  $("#copy-code-btn").on("click", function () {
    const code = editor.getValue();
    navigator.clipboard.writeText(code).then(() => {
      // Show toast notification
      codeEditorToast("Code copied to clipboard");
    });
  });

  // Clear output button
  $("#clear-output-btn").on("click", function () {
    $("#code-output").html("// Run code to see output here");
  });

  // Track cursor position
  editor.onDidChangeCursorPosition(function (e) {
    $("#editor-position").text(
      `Line: ${e.position.lineNumber}, Column: ${e.position.column}`
    );
  });

  // Update editor content on change
  editor.onDidChangeModelContent(function () {
    currentValue = editor.getValue();
  });
}

// Show a toast notification
function codeEditorToast(message, duration = 3000) {
  // Remove any existing toast
  $(".code-editor-toast").remove();

  // Create and append toast
  const toast = $(`
    <div class="code-editor-toast">
      <div class="toast-content">
        <i class="fas fa-check-circle toast-icon"></i>
        <span class="toast-message">${message}</span>
      </div>
    </div>
  `);

  $("body").append(toast);

  // Animate in
  setTimeout(() => {
    toast.addClass("show");

    // Animate out after duration
    setTimeout(() => {
      toast.removeClass("show");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }, 10);
}

// Get programming language display name
function getProgrammingLanguageName(langId) {
  const lang = programmingLanguages.find((l) => l.id === langId);
  return lang ? lang.name : langId.charAt(0).toUpperCase() + langId.slice(1);
}

// Render code editor for programming questions
function renderCodeEditor(question, callback) {
  // Store the question index for updating answers array
  const questionIndex = currentQuestionIndex;

  currentCallback =
    callback ||
    function (code) {
      // Default callback just updates the studentResponse
      question.studentResponse = code;
    };

  // Set current language from question
  if (question.programmingLanguage) {
    currentLanguage = question.programmingLanguage.toLowerCase();
  }

  // Set current value from studentResponse if available
  // currentValue = question.studentResponse || getDefaultCodeTemplate(currentLanguage);
  currentValue = question.studentResponse;

  // Load Monaco Editor if not already loaded
  if (typeof monaco === "undefined") {
    setupMonacoEditor(() => {
      initCodeEditor();
      setupReadOnlyLanguageSelector(question.programmingLanguage);
      setupEditorChangeListener(questionIndex);
    });
  } else {
    initCodeEditor();
    setupReadOnlyLanguageSelector(question.programmingLanguage);
    setupEditorChangeListener(questionIndex);
  }
}

// Setup language selector based on question requirements
function setupReadOnlyLanguageSelector(language) {
  if (language) {
    // If language is specified in the question, disable the selector
    $("#language-select").val(language.toLowerCase());
    $("#language-select").prop("disabled", true);

    // Update the mode display
    $("#editor-mode").text(getProgrammingLanguageName(language.toLowerCase()));
  } else {
    // If no language is specified, enable the selector
    $("#language-select").prop("disabled", true);
  }
}

function setupMonacoEditor(callback) {
  if (typeof monaco === "undefined") {
    require(["vs/editor/editor.main"], function () {
      if (callback && typeof callback === "function") {
        callback();
      }
    });
  } else {
    if (callback && typeof callback === "function") {
      callback();
    }
  }
}

// Get default code template based on language
function getDefaultCodeTemplate(language) {
  const templates = {
    javascript: `// JavaScript Start coding here`,

    python: `# Python Start coding here`,

    java: `// Java Start coding here`,

    c: `// C Start coding here`,

    cpp: `// C++ Start coding here`,

    csharp: `// C# Start coding here`,

    php: `// PHP Start coding here`,

    html: `// HTML Start coding here`,

    css: `// CSS Start coding here`,

    sql: `// SQL Start coding here`,
  };

  return templates[language] || `// Start coding here`;
}

// Get student response to save to backend
function getCodeEditorResponse() {
  if (editor) {
    return editor.getValue();
  }
  return currentValue;
}

// Setup listener for editor content changes
function setupEditorChangeListener(questionIndex) {
  if (!editor) return;

  // Listen for content changes in the editor
  editor.onDidChangeModelContent(function () {
    const code = editor.getValue();
    currentValue = code;

    // Update the answers array
    answers[questionIndex] = code;
    isAnswerChanged = true;

    // Mark question as selected but unsaved in the UI
    $(`.filter-numbers button[data-index=${questionIndex}]`).addClass(
      "selected"
    );
    $(`.filter-numbers button[data-index=${questionIndex}]`).attr(
      "data-answer-saved",
      "false"
    );

    // Call the callback function if defined
    if (currentCallback) {
      currentCallback(code);
    }
  });
}
