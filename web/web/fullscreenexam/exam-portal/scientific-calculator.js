// Calculator State
let isOpen = false;
let isDegreeMode = true;
let isInverseMode = false;
let memory = 0;
let lastAnswer = 0;
let currentExpression = "";

// Create Calculator DOM
const calculatorContainer = document.createElement("div");
calculatorContainer.className = "scientific-calculator-container";
calculatorContainer.innerHTML = `
    <div class="calculator-header">
        <div class="mode-indicators">
            <button class="mode-btn" id="deg-rad-btn">DEG</button>
            <button class="mode-btn" id="inv-btn">INV</button>
        </div>
        <button class="calculator-close-button">&times;</button>
    </div>
    <div class="calculator-display">
        <input type="text" class="calc-display-input">
    </div>
    <div class="calculator-buttons">
        <div class="calc-row">
            <button class="calc-btn" data-value="mod">mod</button>
            <button class="calc-btn" data-value="exp">exp</button>
            <button class="calc-btn" data-value="log">log</button>
            <button class="calc-btn" data-value="10^">10^</button>
            <button class="calc-btn" data-value="x^2">x²</button>
        </div>
        <div class="calc-row">
            <button class="calc-btn" data-value="sinh">sinh</button>
            <button class="calc-btn" data-value="cosh">cosh</button>
            <button class="calc-btn" data-value="tanh">tanh</button>
            <button class="calc-btn" data-value="(">(</button>
            <button class="calc-btn" data-value=")">)</button>
        </div>
        <div class="calc-row">
            <button class="calc-btn" data-value="sinh-1">sinh⁻¹</button>
            <button class="calc-btn" data-value="cosh-1">cosh⁻¹</button>
            <button class="calc-btn" data-value="tanh-1">tanh⁻¹</button>
            <button class="calc-btn" data-value="log_x">logₓ</button>
            <button class="calc-btn" data-value="ln">ln</button>
        </div>
        <div class="calc-row">
            <button class="calc-btn" data-value="π">π</button>
            <button class="calc-btn" data-value="e">e</button>
            <button class="calc-btn" data-value="e^">e^</button>
            <button class="calc-btn" data-value="log10">log₁₀</button>
            <button class="calc-btn" data-value="e^x">e^x</button>
        </div>
        <div class="calc-row">
            <button class="calc-btn inv-visible" data-value="sin">sin</button>
            <button class="calc-btn inv-hidden" data-value="sin-1">sin⁻¹</button>
            <button class="calc-btn inv-visible" data-value="cos">cos</button>
            <button class="calc-btn inv-hidden" data-value="cos-1">cos⁻¹</button>
            <button class="calc-btn inv-visible" data-value="tan">tan</button>
            <button class="calc-btn inv-hidden" data-value="tan-1">tan⁻¹</button>
        </div>
        <div class="calc-row">
            <button class="calc-btn" data-value="x^y">x^y</button>
            <button class="calc-btn" data-value="x^3">x³</button>
            <button class="calc-btn" data-value="√">√</button>
            <button class="calc-btn" data-value="y√x">ʸ√x</button>
            <button class="calc-btn" data-value="|x|">|x|</button>
        </div>
        <div class="calc-row">
            <button class="calc-btn" data-value="MR">MR</button>
            <button class="calc-btn" data-value="MS">MS</button>
            <button class="calc-btn" data-value="MC">MC</button>
            <button class="calc-btn" data-value="M+">M+</button>
            <button class="calc-btn" data-value="M-">M-</button>
        </div>
        <div class="calc-row">
            <button class="calc-btn" data-value="7">7</button>
            <button class="calc-btn" data-value="8">8</button>
            <button class="calc-btn" data-value="9">9</button>
            <button class="calc-btn" data-value="/">÷</button>
            <button class="calc-btn" data-value="AC">AC</button>
        </div>
        <div class="calc-row">
            <button class="calc-btn" data-value="4">4</button>
            <button class="calc-btn" data-value="5">5</button>
            <button class="calc-btn" data-value="6">6</button>
            <button class="calc-btn" data-value="*">×</button>
            <button class="calc-btn" data-value="C">C</button>
        </div>
        <div class="calc-row">
            <button class="calc-btn" data-value="1">1</button>
            <button class="calc-btn" data-value="2">2</button>
            <button class="calc-btn" data-value="3">3</button>
            <button class="calc-btn" data-value="-">-</button>
            <button class="calc-btn" data-value="1/x">1/x</button>
        </div>
        <div class="calc-row">
            <button class="calc-btn" data-value="0">0</button>
            <button class="calc-btn" data-value=".">.</button>
            <button class="calc-btn" data-value="=">=</button>
            <button class="calc-btn" data-value="+">+</button>
            <button class="calc-btn" data-value="ANS">ANS</button>
        </div>
    </div>
`;
document.body.appendChild(calculatorContainer);

// Calculator Functions
const display = calculatorContainer.querySelector(".calc-display-input");

function updateDisplay(value, cursorAdjust = 0) {
  // Get current cursor position
  const cursorPos = display.selectionStart || currentExpression.length;
  
  // Insert value at cursor position
  const beforeCursor = currentExpression.substring(0, cursorPos);
  const afterCursor = currentExpression.substring(cursorPos);
  currentExpression = beforeCursor + value + afterCursor;
  
  // Update display
  display.value = currentExpression;
  
  // If cursorAdjust is provided, position cursor accordingly
  // (useful for functions like sin() where we want cursor between parentheses)
  const newCursorPos = cursorPos + value.length + cursorAdjust;
  display.setSelectionRange(newCursorPos, newCursorPos);
  
  // Make sure the display has focus so the cursor is visible
  display.focus();
}

function clearDisplay() {
  currentExpression = "";
  display.value = "";
}

function deleteLastChar() {
  currentExpression = currentExpression.slice(0, -1);
  display.value = currentExpression;
}

const calculatorPopup = document.querySelector(".scientific-calculator-container");
const closeButton = calculatorContainer.querySelector(".calculator-close-button");

// Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  // Make sure we have a reference to #show-calculator if it exists
  const showCalculatorBtn = document.querySelector("#show-calculator");
  if (showCalculatorBtn) {
    showCalculatorBtn.addEventListener("click", () => {
      calculatorContainer.style.display = "block";
      isOpen = true;
    });
  }

  // Add event listener to close button directly from our container reference
  closeButton.addEventListener("click", () => {
    calculatorContainer.style.display = "none";
    isOpen = false;

    // Also update the toggle state when calculator is closed
    const calculatorToggle = document.querySelector("#calculator-toggle");
    if (calculatorToggle) {
      calculatorToggle.checked = false;
    }
  });

  // Wait for the toggle to be available in the DOM
  setTimeout(() => {
    const calculatorToggle = document.querySelector("#calculator-toggle");
    if (calculatorToggle) {
      calculatorToggle.addEventListener("change", function () {
        if (this.checked) {
          // Show calculator directly when toggle is enabled
          calculatorContainer.style.display = "block";
          isOpen = true;
        } else {
          // Hide calculator when toggle is disabled
          calculatorContainer.style.display = "none";
          isOpen = false;
        }
      });
    }
  }, 1000); // Give time for the DOM to be fully loaded
});

document.addEventListener("click", (event) => {
    const calculatorToggle = document.querySelector("#calculator-toggle");
    if (
        !calculatorContainer.contains(event.target) &&
        !event.target.matches("#show-calculator") && 
        !event.target.matches("#calculator-toggle")  
    ) {
        calculatorContainer.style.display = "none";
        if (calculatorToggle) {
            calculatorToggle.checked = false;
        }
    }
});

// Get references to buttons from the container directly
const degRadBtn = calculatorContainer.querySelector("#deg-rad-btn");
const invBtn = calculatorContainer.querySelector("#inv-btn");

degRadBtn.addEventListener("click", function () {
  isDegreeMode = !isDegreeMode;
  this.textContent = isDegreeMode ? "DEG" : "RAD";
  this.classList.toggle("active-mode");
});

invBtn.addEventListener("click", function () {
  isInverseMode = !isInverseMode;
  this.classList.toggle("active-mode");
  calculatorContainer
    .querySelectorAll(".inv-visible, .inv-hidden")
    .forEach((el) => {
      el.classList.toggle("inv-visible");
      el.classList.toggle("inv-hidden");
    });
});

// Allow the display to be focused and handle keyboard input
display.addEventListener("click", function(e) {
  // Allow the user to position the cursor
  e.preventDefault();
  this.focus();
});

display.addEventListener("keydown", function(e) {
  // If Enter is pressed, evaluate the expression
  if (e.key === "Enter") {
    e.preventDefault();
    // Trigger the "=" button click
    calculatorContainer.querySelector('.calc-btn[data-value="="]').click();
    return;
  }
  
  // Allow number input and deletion
  if (/[0-9.]/.test(e.key) || e.key === "Backspace" || e.key === "Delete" || 
      e.key === "ArrowLeft" || e.key === "ArrowRight") {
    // Allow these keys
    return;
  } else if (['+', '-', '*', '/', '(', ')', '^'].includes(e.key)) {
    // Allow basic operators
    e.preventDefault();
    updateDisplay(e.key);
    return;
  } else {
    // Block other keys
    e.preventDefault();
  }
});

calculatorContainer
  .querySelector(".calculator-buttons")
  .addEventListener("click", (e) => {
    if (!e.target.matches(".calc-btn")) return;

    const value = e.target.dataset.value;

    switch (value) {
      case "AC":
        clearDisplay();
        break;
      case "C":
        if (currentExpression.length > 0) {
          deleteLastChar();
        } else {
          clearDisplay();
        }
        break;
      case "1/x":
        try {
          const num = parseFloat(currentExpression);
          if (num !== 0) {
            currentExpression = (1 / num).toString();
            display.value = currentExpression;
          } else {
            display.value = "Error";
            setTimeout(() => {
              clearDisplay();
            }, 1000);
          }
        } catch (error) {
          display.value = "Error";
          setTimeout(() => {
            clearDisplay();
          }, 1000);
        }
        break;
      case "|x|":
        try {
          const num = parseFloat(currentExpression);
          currentExpression = Math.abs(num).toString();
          display.value = currentExpression;
        } catch (error) {
          display.value = "Error";
          setTimeout(() => {
            clearDisplay();
          }, 1000);
        }
        break;
      case "sin":
      case "cos":
      case "tan":
      case "sinh":
      case "cosh":
      case "tanh":
      case "sin-1":
      case "cos-1":
      case "tan-1":
      case "sinh-1":
      case "cosh-1":
      case "tanh-1":
      case "log":
      case "ln":
        // Add function with parentheses and position cursor between them
        updateDisplay(value + "()", -1);
        break;
      case "=":
        try {
          // Process the expression with proper function handling
          let expr = currentExpression;
          
          // Replace mathematical constants
          expr = expr
            .replace(/π/g, "Math.PI")
            .replace(/e(?!\^)/g, "Math.E");
          
          // Handle trigonometric functions
          if (isDegreeMode) {
            expr = expr
              .replace(/sin\(([^)]*)\)/g, (match, p1) => `Math.sin((${p1 || 0}) * Math.PI / 180)`)
              .replace(/cos\(([^)]*)\)/g, (match, p1) => `Math.cos((${p1 || 0}) * Math.PI / 180)`)
              .replace(/tan\(([^)]*)\)/g, (match, p1) => `Math.tan((${p1 || 0}) * Math.PI / 180)`)
              .replace(/sin-1\(([^)]*)\)/g, (match, p1) => `(Math.asin(${p1 || 0}) * 180 / Math.PI)`)
              .replace(/cos-1\(([^)]*)\)/g, (match, p1) => `(Math.acos(${p1 || 0}) * 180 / Math.PI)`)
              .replace(/tan-1\(([^)]*)\)/g, (match, p1) => `(Math.atan(${p1 || 0}) * 180 / Math.PI)`);
          } else {
            expr = expr
              .replace(/sin\(([^)]*)\)/g, (match, p1) => `Math.sin(${p1 || 0})`)
              .replace(/cos\(([^)]*)\)/g, (match, p1) => `Math.cos(${p1 || 0})`)
              .replace(/tan\(([^)]*)\)/g, (match, p1) => `Math.tan(${p1 || 0})`)
              .replace(/sin-1\(([^)]*)\)/g, (match, p1) => `Math.asin(${p1 || 0})`)
              .replace(/cos-1\(([^)]*)\)/g, (match, p1) => `Math.acos(${p1 || 0})`)
              .replace(/tan-1\(([^)]*)\)/g, (match, p1) => `Math.atan(${p1 || 0})`);
          }
          
          // Handle hyperbolic functions
          expr = expr
            .replace(/sinh\(([^)]*)\)/g, (match, p1) => `Math.sinh(${p1 || 0})`)
            .replace(/cosh\(([^)]*)\)/g, (match, p1) => `Math.cosh(${p1 || 0})`)
            .replace(/tanh\(([^)]*)\)/g, (match, p1) => `Math.tanh(${p1 || 0})`)
            .replace(/sinh-1\(([^)]*)\)/g, (match, p1) => `Math.asinh(${p1 || 0})`)
            .replace(/cosh-1\(([^)]*)\)/g, (match, p1) => `Math.acosh(${p1 || 0})`)
            .replace(/tanh-1\(([^)]*)\)/g, (match, p1) => `Math.atanh(${p1 || 0})`);
          
          // Handle logarithmic and other functions
          expr = expr
            .replace(/log\(([^)]*)\)/g, (match, p1) => `Math.log10(${p1 || 0})`)
            .replace(/ln\(([^)]*)\)/g, (match, p1) => `Math.log(${p1 || 0})`)
            .replace(/log10/g, "Math.log10(10)")
            .replace(/√\(([^)]*)\)/g, (match, p1) => `Math.sqrt(${p1 || 0})`)
            .replace(/√([^(])/g, `Math.sqrt($1)`)
            .replace(/10\^([^)]+)/g, "Math.pow(10,$1)")
            .replace(/e\^([^)]+)/g, "Math.exp($1)")
            .replace(/x\^2/g, (match) => `Math.pow(${currentExpression},2)`)
            .replace(/x\^3/g, (match) => `Math.pow(${currentExpression},3)`)
            .replace(/x\^y/g, "Math.pow")
            // Basic operators
            .replace(/÷/g, "/")
            .replace(/×/g, "*")
            .replace(/mod/g, "%");
          
          console.log("Evaluating:", expr);
          const result = eval(expr);
          lastAnswer = result;
          currentExpression = result.toString();
          display.value = currentExpression;
        } catch (error) {
          console.error("Calculation error:", error);
          display.value = "Error";
          setTimeout(() => {
            clearDisplay();
          }, 1000);
        }
        break;
      case "ANS":
        updateDisplay(lastAnswer.toString());
        break;
      case "MR":
        updateDisplay(memory.toString());
        break;
      case "MS":
        try {
          memory = parseFloat(currentExpression) || 0;
          // Show a small indicator or flash to confirm memory storage
          display.style.backgroundColor = "#f0f8ff";
          setTimeout(() => {
            display.style.backgroundColor = "#fff";
          }, 300);
        } catch (error) {
          display.value = "Error";
          setTimeout(() => {
            clearDisplay();
          }, 1000);
        }
        break;
      case "MC":
        memory = 0;
        // Show indicator
        display.style.backgroundColor = "#fff0f0";
        setTimeout(() => {
          display.style.backgroundColor = "#fff";
        }, 300);
        break;
      case "M+":
        try {
          memory += parseFloat(currentExpression) || 0;
          // Show indicator
          display.style.backgroundColor = "#f0fff0";
          setTimeout(() => {
            display.style.backgroundColor = "#fff";
          }, 300);
        } catch (error) {
          display.value = "Error";
          setTimeout(() => {
            clearDisplay();
          }, 1000);
        }
        break;
      case "M-":
        try {
          memory -= parseFloat(currentExpression) || 0;
          // Show indicator  
          display.style.backgroundColor = "#fff0f0";
          setTimeout(() => {
            display.style.backgroundColor = "#fff";
          }, 300);
        } catch (error) {
          display.value = "Error";
          setTimeout(() => {
            clearDisplay();
          }, 1000);
        }
        break;
      default:
        updateDisplay(value);
    }
  });