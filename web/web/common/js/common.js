let change = { ar: {}, en: {} };
const questionState = {};

function lightenHexColor(hex, percent) {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Convert hex to RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Increase brightness by the given percent
  r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
  g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
  b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

  // Convert back to hex and return
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function decodeJWT(token) {
  try {
    const [header, payload, signature] = token.split(".");

    const decodedPayload = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );

    return decodedPayload;
  } catch (e) {
    console.error("Invalid JWT token:", e);
    return null;
  }
}

// logout
$(document).on("click", "#logout-button", function () {
  const accountId = localStorage.getItem("accountId"); // Save accountId
  const collegeCode = localStorage.getItem("collegeCode");
  const collegeLogo = localStorage.getItem('collegeLogo');
  localStorage.clear(); // Clear everything
  if (accountId !== null && collegeCode !== null) {
    localStorage.setItem("accountId", accountId); 
    localStorage.setItem("collegeCode", collegeCode); 
    localStorage.setItem("collegeLogo", collegeLogo); 
  }
  window.location.href = "/fullscreenexam/";
});

function formatDateTimeGeneral(dateTime) {
  const date = new Date(dateTime.date);
  const hours = dateTime.hour.toString().padStart(2, "0");
  const minutes = dateTime.minute.toString().padStart(2, "0");
  const period = dateTime.format;
  return `${date.toLocaleDateString()} ${hours}:${minutes} ${period}`;
}

function setCollegeDetails() {
  const collegeName = localStorage.getItem("collegeName");
  const collegeLogo = localStorage.getItem("collegeLogo");
  const collegeCode = localStorage.getItem("collegeCode");

  $("#college-name").text(collegeName);
  $("#college-code").text(collegeCode);
  $("#college-logo").attr("src", collegeLogo);

  // Update footer
  $("#footer-college-name").text(collegeName);
  $("#current-year").text(new Date().getFullYear());
}

//login details to set logout container details
$(".user-name").text(localStorage.getItem("collegeName"));
$(".user-code").text(localStorage.getItem("collegeCode"));
$(".user-mail").text(localStorage.getItem("mail"));

//email trumbowyg editor strong tag disable
$(document).on("keydown", ".trumbowyg-editor", function (e) {
  const selection = window.getSelection();
  if (selection.rangeCount) {
    const range = selection.getRangeAt(0);
    const $parent = $(range.commonAncestorContainer);

    // Prevent deletion if strong tag is selected
    if (
      $parent.is("strong") ||
      $parent.parents("strong").length ||
      e.keyCode === 8 ||
      e.keyCode === 46
    ) {
      const $strong = $parent.closest("strong");
      if ($strong.length) {
        e.preventDefault();
        return false;
      }
    }
  }
});

function chooseLang(selectedLanguage, location = "", placeHolders = []) {
  var ids = [];
  var classes = [];

  $("*").each(function () {
    if ($(this).attr("id")) {
      ids.push($(this).attr("id"));
    }
    if ($(this).attr("class")) {
      $(this)
        .attr("class")
        .split(" ")
        .forEach(function (cls) {
          if (classes.indexOf(cls) === -1) {
            classes.push(cls);
          }
        });
    }
  });

  const windowPath = window.location.pathname;

  if (
    selectedLanguage === "ar" &&
    !windowPath.includes("exam-configure") &&
    !windowPath.includes("exam-list") &&
    !windowPath.includes("account-management") &&
    !windowPath.includes("student-management") &&
    !windowPath.includes("insights") &&
    !windowPath.includes("reports")
  ) {
    $("body").attr("dir", "rtl");
    $(".container").addClass("rtl-content");
  } else {
    $("body").attr("dir", "ltr");
    $(".container").removeClass("rtl-content");
  }

  $.getJSON(`${location}${selectedLanguage}.json`, function (data) {
    function recall(value, parentKey) {
      for (let [key, val] of Object.entries(value)) {
        let dynamicKey = parentKey ? `${parentKey}_${key}` : key;
        if (typeof val === "object" && val !== null) {
          recall(val, dynamicKey);
        } else {
          change[selectedLanguage][dynamicKey] = val;
        }
      }
    }
    if (!Object.keys(change[selectedLanguage]).length) recall(data, "");
    ids.forEach(function (id) {
      if (placeHolders.includes(id)) {
        $(`#${id}`).attr("placeholder", change[selectedLanguage][id]);
      } else if (change[selectedLanguage][id]) {
        $(`#${id}`).text(change[selectedLanguage][id]);
      }
    });

    $(".login_exam_card_exit_count").text(
      change[selectedLanguage]["login_exam_card_exit_count"]
    );
    $(".login_exam_card_register_validation").text(
      change[selectedLanguage]["login_exam_card_register_validation"]
    );
    $(".login_exam_card_register_button").text(
      change[selectedLanguage]["login_exam_card_register_button"]
    );
    $(".login_exam_card_reload_button").text(
      change[selectedLanguage]["login_exam_card_reload_button"]
    );
    $(".login_exam_card_will_start").text(
      change[selectedLanguage]["login_exam_card_will_start"]
    );
    $(".login_exam_card_report_button").text(
      change[selectedLanguage]["login_exam_card_report_button"]
    );
    $(".login_exam_card_reload_status").text(
      change[selectedLanguage]["login_exam_card_reload_status"]
    );
    $(".login_exam_card_active_exams_found").text(
      change[selectedLanguage]["login_exam_card_active_exams_found"]
    );
    $(".NOT_STARTED").text(change[selectedLanguage]["NOT_STARTED"]);
    $(".ON_GOING").text(change[selectedLanguage]["ON_GOING"]);
    $(".exit_count").text(change[selectedLanguage]["exit_count"]);
    $("#history-modal").attr("title", change[selectedLanguage]["exit_history"]);
    $("#login-email").attr(
      "placeholder",
      change[selectedLanguage]["login-email"]
    );
    $("#password").attr("placeholder", change[selectedLanguage]["password"]);
    $("#collegeCode").attr(
      "placeholder",
      change[selectedLanguage]["collegeCode"]
    );
    classes.forEach(function (cls) {
      if (cls)
        $(`.${cls}`).each(function () {
          if (change[selectedLanguage][cls]) {
            $(this).text(change[selectedLanguage][cls]);
          }
        });
    });
  });
}

function renderLanguage(location) {
  // Check for stored language preference
  const savedLanguage = localStorage.getItem("lang") || "en";

  // Set toggle based on saved language
  if (savedLanguage === "ar") {
    $("#lang-toggle").prop("checked", true);
  } else {
    $("#lang-toggle").prop("checked", false);
  }

  // Apply language on load
  chooseLang(savedLanguage, location);
  // Handle language toggle change
  $("#lang-toggle").change(function () {
    const selectedLanguage = this.checked ? "ar" : "en";
    let placeHolders = [
      "personal_information_fields_email_placeholder",
      "personal_information_fields_first_name_placeholder",
      "personal_information_fields_last_name_placeholder",
    ];
    chooseLang(selectedLanguage, location, placeHolders);
    localStorage.setItem("lang", selectedLanguage);
  });
}

$(document).ready(function () {
  const params = new URLSearchParams(window.location.search);
  const email = localStorage.getItem("mail");
  const collegeCode = localStorage.getItem("collegeCode");
  const collegeName = localStorage.getItem("collegeName");
  $("#user-details").empty();
  $("#user-details").html(`
     <div>${collegeName}</div>
     <div>${collegeCode}</div>
    <div>${email}</div>
    `);
  // if(!params.get("email")) $(".toggle-container-lang").empty()
});

function stringReplace(stringContent) {
  return stringContent
    ?.replace("<strong>Pass Code EN</strong>", "")
    ?.replace("<strong>Pass Code AR</strong>", "");
}

// Function to hash a password with salt using Web Crypto API
async function hashChecking(password, salt) {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password + salt);

  let hash = await crypto.subtle.digest("SHA-256", passwordData);

  for (let i = 1; i < HASH_COUNT; i++) {
    hash = await crypto.subtle.digest("SHA-256", hash);
  }

  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Function to verify a password against the stored hash
async function verifyPasswordChecking(inputPassword) {
  const inputHash = await hashChecking(inputPassword, SALT_KEY);

  return inputHash === KEY;
}

function lightenHexColor(hex, percent) {
  if (!hex) {
    console.warn("No hex color provided, using default color");
    return "#f0f7ff";
  }

  hex = hex.replace(/^#/, "");

  if (!/^[0-9A-F]{6}$/i.test(hex)) {
    console.warn("Invalid hex color provided:", hex);
    return "#f0f7ff";
  }

  try {
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  } catch (error) {
    console.error("Error lightening color:", error);
    return "#f0f7ff";
  }
}

function randomColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.floor(Math.random() * 30);
  const lightness = 45 + Math.floor(Math.random() * 10);

  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;

  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// In exam list convert date type string to date

function changeStringToDate(params) {
  const dateString = params.data.startDate;
  if (!dateString) return null;

  const regex = /(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s+(AM|PM)/;
  const match = dateString.match(regex);

  if (!match) return null;

  const [, day, month, year, hour, minute, ampm] = match;

  let hour24 = parseInt(hour);
  if (ampm === "PM" && hour24 !== 12) hour24 += 12;
  else if (ampm === "AM" && hour24 === 12) hour24 = 0;

  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    hour24,
    parseInt(minute)
  );
}
// OS detection function
function getOSInfo() {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  if (/Windows NT 10.0/i.test(userAgent)) return "Windows 10";
  if (/Windows NT 6.2/i.test(userAgent)) return "Windows 8";
  if (/Windows NT 6.1/i.test(userAgent)) return "Windows 7";
  if (platform === "iPad") return "iPad";
  else if (/Mac OS X/i.test(userAgent)) return "macOS";
  if (/Android/i.test(userAgent)) return "Android";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Unknown OS";
}

// Browser detection function
function getBrowserInfo() {
  const userAgent = navigator.userAgent;
  const vendor = navigator.vendor || "";
  const platform = navigator.platform;

  if (platform === "iPad") {
    if (/Edg/i.test(userAgent)) {
      const version = userAgent.match(/Edg\/(\d+)/);
      return `Edge ${version ? version[1] : "Unknown"}`;
    }
    if (/CriOS/i.test(userAgent)) {
      const version = userAgent.match(/Chrome\/(\d+)/);
      return `Chrome ${version ? version[1] : "Unknown"}`;
    }
    if (/FxiOS/i.test(userAgent)) {
      const version = userAgent.match(/FxiOS\/(\d+)/);
      return `Firefox ${version ? version[1] : "Unknown"}`;
    }
    if (/Mobile/i.test(userAgent) && !/Safari/i.test(userAgent)) {
      const version = userAgent.match(/Chrome\/(\d+)/);
      return `Chrome ${version ? version[1] : "Unknown"}`;
    }
  } else {
    if (/Edg/i.test(userAgent)) {
      const version = userAgent.match(/Edg\/(\d+)/);
      return `Edge ${version ? version[1] : "Unknown"}`;
    }
    if (/Chrome/i.test(userAgent)) {
      const version = userAgent.match(/Chrome\/(\d+)/);
      return `Chrome ${version ? version[1] : "Unknown"}`;
    }
    if (/Firefox/i.test(userAgent)) {
      const version = userAgent.match(/Firefox\/(\d+)/);
      return `Firefox ${version ? version[1] : "Unknown"}`;
    }
  }

  return "Unknown Browser";
}

function formatStatus(status) {
  return status
    .toLowerCase()
    .split("_")
    .map(
      (word, index) =>
        index === 0
          ? word.charAt(0).toUpperCase() + word.slice(1) // Capitalize first word
          : word // Keep second word lowercase to form "Ongoing", not "OnGoing"
    )
    .join("");
}

function lsData(key, defaultValue = "") {
  return localStorage.getItem(key) || defaultValue;
}

function roleAccess(role, isCheck = "") {
  return lsData(role) === isCheck;
}

const toLowerCase = (val) => (typeof val === 'string' ? val.toLowerCase() : val);


// Common function to fetch signed URLs for IR and UD question types
function getSignedUrl(attachmentUrl, $img, $contentOrHandlers) {
  makeApiCall({
    url: `${STUDENT_END_POINT}/attachment?url=${attachmentUrl}`,
    method: "GET",
    isApiKey: true,
    successCallback: function (response) {
      const signedUrl = response.data;

      // Handle PDF
      if ($contentOrHandlers?.appendPDF) {
        $contentOrHandlers.appendPDF(signedUrl);
        return;
      }

      // Handle Image
      $img
        .attr("src", signedUrl)
        .on("load", function () {
          $contentOrHandlers.find(".loading").remove();
          $img.show();
        })
        .on("error", function () {
          $contentOrHandlers.find(".loading").remove();
          $contentOrHandlers.append(
            '<div class="error">Failed to load image</div>'
          );
        });
    },
    errorCallback: function () {
      if ($contentOrHandlers?.onError) {
        $contentOrHandlers.onError();
      } else {
        $contentOrHandlers.find(".loading").remove();
        $contentOrHandlers.append(
          '<div class="error">Failed to load image</div>'
        );
      }
    },
  });
}

// Lazy load IR/UD images and PDFs on "Show more" click in report view
// ✅ Show more loader click handler
$(document).on("click", ".show-more-loader-btn", function () {
  const questionNum = $(this).data("question");
  const $container = $(`.file-container-${questionNum}`);
  const state = questionState[questionNum];

  if (!state || !Array.isArray(state.question.studentResponse)) {
    console.error(`Missing data for question ${questionNum}`);
    return;
  }

  const nextIndex = state.nextIndex || 0;
  const nextFile = state.question.studentResponse[nextIndex];

  if (state.nextIndex >= state.question.studentResponse.length-1) {
    $(this).prop("disabled", true).text("No more files");
  }

  const ext = nextFile.url.split(".").pop().toLowerCase();

  if (ext === "pdf") {
    const $pdfBox = $container.find(`#pdf-${questionNum}-${nextIndex}`);
    getSignedUrl(nextFile.url, null, {
      appendPDF: (signedUrl) => {
        $pdfBox.find(".loading").remove();
        $pdfBox.append(`<embed src="${signedUrl}" type="application/pdf"/>`);
        $pdfBox.show();
      },
      onError: () => {
        $pdfBox.find(".loading").remove();
        $pdfBox.append(`<div class="error">Failed to load PDF</div>`);
      },
    });
  } else {
    const $img = $container.find(`#image-${questionNum}-${nextIndex}`);
    if ($img.length) {
      getSignedUrl(nextFile.url, $img, $container);
    } else {
      console.warn("Image not found:", `#image-${questionNum}-${nextIndex}`);
    }
  }

  state.nextIndex = nextIndex + 1;
});

function displayToast(message, type) {
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: "5000",
  };
  if (type === "success") {
    toastr.success(message);
  } else if (type === "error") {
    toastr.error(message);
  }
}
let handleMenu = (value) => {
  let routePath = "";
  if (value === 1) {
    routePath = "dashboard";
  } else if (value === 2) {
    routePath = "video-management";
  } else if (value === 3) {
    routePath = "credit-dashboard";
  } else if (value === 4) {
    routePath = "course-grade-certificate";
  }
  if (!routePath) {
  return;
}
  // Store navigation state in window.name
  window.name = JSON.stringify({ navigate: routePath });
  // Navigate to the target page
  window.location.href = "../account-management/index.html";
};
const dateValueGetter = (params, fieldName) => {
  const dateValue = params.data?.[fieldName];
  if (!dateValue) return "";
  const date = new Date(dateValue);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
};

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
    
$(document).ready(function () {
  const params = new URLSearchParams(window.location.search);
  const examId = params.get("examId");
  const emailId = params.get("email");

  // Helper for query strings
  const reportsLink = `/fullscreenexam/reports/${examId ? `?examid=${examId}` : ""}`;
  
  // Common breadcrumb parts
  const examList = { link: "/fullscreenexam/exam-list/index.html", bread_crumbs_name: "Exam List" };
  const reports = { link: reportsLink, bread_crumbs_name: "Reports" };

  // Main breadcrumb map
  const breadcrumbMap = {
    "/fullscreenexam/account-management/index.html": [
      { link: "#", bread_crumbs_name: "Account Management" }
    ],
    "/fullscreenexam/exam-list/index.html": [ examList ],
    "/fullscreenexam/exam-configure/create.html": [ examList, { link: "#", bread_crumbs_name: "Create Exam" } ],
    "/fullscreenexam/exam-configure/exam-preview.html": [ examList, { link: "#", bread_crumbs_name: "Exam Preview" } ],
    "/fullscreenexam/reports/": [ examList,{link:"#",bread_crumbs_name: "Reports" } ],
    "/fullscreenexam/reports/detailed/": [ examList, reports, { link: "#", bread_crumbs_name: `Detailed Report - ${emailId}` } ],
    "/fullscreenexam/reports/anamoly/": [ examList, reports, { link: "#", bread_crumbs_name: `Anomaly Detection - ${emailId}` } ],
    "/fullscreenexam/reports/evaluation.html": [ examList, reports, { link: "#", bread_crumbs_name: "Evaluation" } ],
    "/fullscreenexam/student-management/index.html": [ { link: "#", bread_crumbs_name: "Student Management" } ],
    "/fullscreenexam/student-management/group.html": [ { link: "#", bread_crumbs_name: "Group Management" } ],
    "/fullscreenexam/register-student.html": [ { link: "#", bread_crumbs_name: "Register" } ],
    "/fullscreenexam/activity-log/": [ { link: "#", bread_crumbs_name: "Activity Log" } ],
    "/fullscreenexam/activity-log/index.html": [ { link: "#", bread_crumbs_name: "Activity Log" } ],
    "/fullscreenexam/insights/index.html": [ { link: "#", bread_crumbs_name: "Insights View" } ],
    "/fullscreenexam/insights/insight.html": [ { link: "/fullscreenexam/insights/index.html", bread_crumbs_name: "Insights View" }, { link: "#", bread_crumbs_name: "Detail Insights" } ],
    "/fullscreenexam/paper-scan/copy-scanner.html": [ { link: "#", bread_crumbs_name: "QR Code Generator" } ]
  };

  const currentPath = window.location.pathname;
  headerBreadcrumbsPath(breadcrumbMap[currentPath] || []);
});

// Update breadcrumb dynamically
function updateBreadcrumbWithClient(clientName) {
  headerBreadcrumbsPath([
    { link: "/fullscreenexam/account-management/index.html", bread_crumbs_name: "Account Management" },
    { link: "#", bread_crumbs_name: clientName }
  ]);
}

// Render breadcrumbs
function headerBreadcrumbsPath(links = []) {
  const $container = $("#bread-crumb-container").empty();
  const hasRegister = !links.some(item => item.bread_crumbs_name === "Register");
  const currentPath = window.location.pathname; // e.g. "/exam-configure/..."
  const hearderBreadCrumbHtml = `
    <div class="bread-crumb-header">
      <div class="bread-crumb-wrapper">
        <a href="/fullscreenexam/index.html" class="heading-screen">
          <i class="bx bxs-edit"></i>
          <span class="common-label-screener">Screener</span>
        </a>
        <div class="bread-crumb-link-wrapper">
          <a class="bread-crumbs-link" href="/fullscreenexam/">Quick Links</a>
          ${links.map((data, i) => {
              let extraClass = "";
     if (currentPath.includes("exam-configure") && i === links.length - 1) {
     extraClass = "breadcrumb-exam-name"; // Only last breadcrumb gets the class
      }
            return `
            <span class="separator"><i class="fas fa-chevron-right text-white"></i></span>
            <a href="${data.link}" class="bread-crumbs-link ${extraClass} ${i === links.length - 1 ? "current" : ""}">
              ${data.bread_crumbs_name}
            </a>
          `}).join("")}
        </div>
      </div>
      ${hasRegister ? userInfoHtml() : ""}
    </div>
  `;

  $container.append(hearderBreadCrumbHtml);

  if (hasRegister) {
    $(".user-name").text(localStorage.getItem("collegeName"));
    $(".user-code").text(localStorage.getItem("collegeCode"));
    $(".user-mail").text(localStorage.getItem("mail"));
  }
}

// Separated HTML for user info
function userInfoHtml() {
  return `
    <div>
      <div class="action-popover-logout d-flex align-items-center">
        <i class="bx bxs-user-circle"></i>
        <div class="popover-logout">
          <div class="border-bottom d-flex">
            <div><i class="bx bxs-user"></i></div>
            <div>
              <div class="user-name"></div>
              <div class="user-code"></div>
              <div class="user-mail"></div>
            </div>
          </div>
          <div id="logout-button"><i class="bx bx-log-in-circle"></i> Logout</div>
        </div>
      </div>
    </div>
  `;
}


/**
 * Function to initialize the SketchWidget with digital ink data.
 * Used in report and student report pages.
 */
function initializeSketchWidget(digitalInkData) {
  const containerElement = document.getElementById("sketch-widget-container");

  if (!containerElement) {
    return;
  }

  // Helper: calculate required height
  function getDrawingHeight(strokes) {
    let maxY = 0;
    (strokes || []).forEach(stroke => {
      if (stroke.points && Array.isArray(stroke.points)) {
        stroke.points.forEach(point => {
          if (point.y > maxY) maxY = point.y;
        });
      }
    });
    return maxY;
  }

  try {
    // Default height
    let requiredHeight = 400;

    if (Array.isArray(digitalInkData) && digitalInkData.length > 0) {
      const drawingHeight = getDrawingHeight(digitalInkData) + 50; // padding
      if (drawingHeight > requiredHeight) {
        requiredHeight = drawingHeight;
      }
    }

    // Apply dynamic height
    containerElement.style.height = requiredHeight + "px";

    // Initialize SketchWidget with dynamic height
    const widget = new SketchWidget(containerElement, {
      width: "100%",
      height: requiredHeight + "px",
      tools: ["pencil", "pen", "marker", "eraser", "lasso", "ruler"],
      colors: ["#000000", "#FF3B30", "#007AFF", "#34C759", "#FF9500", "#FFCC00"],
      exportFormat: "json",
      showToolbar: false,
      toolbarPosition: "floating",
      toolbarOrientation: "horizontal",
      toolbarDraggable: false,
      toolbarCollapsible: false,
      toolbarCollapsed: false,
      editable: false,
      readOnly: true,
    });

    // Wait for widget ready
    widget.waitForReady()
      .then(() => {
        if (Array.isArray(digitalInkData) && digitalInkData.length > 0) {
          widget.loadStrokes(digitalInkData);
        }
      })
      .catch((error) => {
        console.error("SketchWidget failed:", error);
      });

  } catch (error) {
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

function getVideoSignedUrl(url) {
  return new Promise((resolve, reject) => {
    makeApiCall({
      url: `${STUDENT_END_POINT}/attachment?url=${encodeURIComponent(url)}`,
      method: "GET",
      successCallback: (response) => {
        resolve(response.data);
      },
      errorCallback: (error) => {
        console.error("Error fetching signed url:", error);
        reject(error);
      },
    });
  });
}