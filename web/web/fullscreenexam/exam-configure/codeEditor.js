// Code Editor Implementation
let editor = null;
let codeEditorContainer = null;
let currentLanguage = "javascript";
let currentTheme = "vs-dark";
let currentValue = "";
let currentCallback = null;

$(document).on("click", ".open-editor-btn", function () {
  const questionDiv = $(this).closest(".question");
  const language = questionDiv.find(".lang-select").val() || "javascript";
  const sampleCode =
    "// Write your solution here\n\nfunction solution() {\n  // Your code here\n  return true;\n}\n";

  // Show the editor panel
  $("#editor-attachmentPanel").css("width", "90%");
  $("#blurOverlay").css("display", "block");

  // Initialize the content in the editor attachment container
  $(".editor-attachment-main-container").empty();

  // Open code editor with the selected language
  openCodeEditor(sampleCode, language);
});

$(document).on("click", ".editor-attachment-close-btn", function () {
  $("#editor-attachmentPanel").css("width", "0");
  $("#blurOverlay").css("display", "none");
});

// Initialize the code editor
function initCodeEditor() {
  // Check if Monaco Editor is loaded
  if (typeof monaco === "undefined") {
    loadMonacoEditor(() => initCodeEditor());
    return;
  }

  const $editorContainer = $(".editor-attachment-main-container");

  // Clear the container first
  $editorContainer.empty();

  // Create UI elements
  createEditorUI($editorContainer);

  // Initialize Monaco Editor
  codeEditorContainer = document.getElementById("monaco-editor-container");
  editor = monaco.editor.create(codeEditorContainer, {
    value: currentValue || "// Your code here",
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

// Load Monaco Editor dynamically
function loadMonacoEditor(callback) {
  if (typeof monaco !== "undefined") {
    callback();
    return;
  }

  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.js";
  script.onload = () => {
    require.config({
      paths: {
        vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs",
      },
    });

    require(["vs/editor/editor.main"], function () {
      callback();
    });
  };
  document.body.appendChild(script);
}

// Create the editor UI
function createEditorUI($container) {
  const editorHTML = `
    <div class="code-editor-wrapper">
      <div class="code-editor-toolbar">
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
      </div>
      <div class="code-editor-layout">
        <div id="monaco-editor-container" class="code-editor-main"></div>
        <div class="code-editor-output">
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
      <div class="code-editor-footer">
        <div class="editor-status">
          <span id="editor-position">Line: 1, Column: 1</span>
          <span id="editor-mode">JavaScript</span>
        </div>
        <div class="editor-actions-secondary">
          <button id="run-code-btn" class="editor-btn-run">
            <i class="fas fa-play"></i> Run Code
          </button>
          <button id="cancel-code-btn" class="editor-btn-secondary">Cancel</button>
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

// Setup event listeners for the editor UI
function setupEventListeners() {
  // Language selector
  $("#language-select").on("change", function () {
    const newLanguage = $(this).val();
    if (editor && newLanguage !== currentLanguage) {
      currentLanguage = newLanguage;
      monaco.editor.setModelLanguage(editor.getModel(), newLanguage);
      $("#editor-mode").text(
        programmingLanguages.find((l) => l.id === newLanguage).name
      );
    }
  });

  // Theme selector
  $("#theme-select").on("change", function () {
    const newTheme = $(this).val();
    if (editor && newTheme !== currentTheme) {
      currentTheme = newTheme;
      monaco.editor.setTheme(newTheme);
    }
  });

  // Format code button
  $("#format-code-btn").on("click", function () {
    if (editor) {
      editor.getAction("editor.action.formatDocument").run();
    }
  });

  // Copy code button
  $("#copy-code-btn").on("click", function () {
    if (editor) {
      const code = editor.getValue();
      navigator.clipboard
        .writeText(code)
        .then(() => {
          toastr.success("Code copied to clipboard");
        })
        .catch(() => {
          toastr.error("Failed to copy code");
        });
    }
  });

  // Run code button
  $("#run-code-btn").on("click", function () {
    if (editor) {
      const code = editor.getValue();
      executeCode(code, currentLanguage);
    }
  });

  // Clear output button
  $("#clear-output-btn").on("click", function () {
    $("#code-output").text("// Output cleared");
  });   

  // Cancel button
  $("#cancel-code-btn, .editor-attachment-close-btn").on("click", function () {
    closeCodeEditor();
  });

  // Track cursor position
  if (editor) {
    editor.onDidChangeCursorPosition(function (e) {
      $("#editor-position").text(
        `Line: ${e.position.lineNumber}, Column: ${e.position.column}`
      );
    });
  }
}

// Open the code editor
function openCodeEditor(
  initialCode = "",
  language = "javascript",
  callback = null
) {
  currentValue = initialCode;
  currentLanguage = language;
  currentCallback = callback;

  $("#blurOverlay").show();
  $("#editor-attachmentPanel").show();

  initCodeEditor();
}

// Close the code editor
function closeCodeEditor() {
  $("#editor-attachmentPanel").hide();
  $("#blurOverlay").hide();

  if (editor) {
    editor.dispose();
    editor = null;
  }
}
