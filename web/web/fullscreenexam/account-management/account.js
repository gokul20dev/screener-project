
//goble start variable;
let allClients = [];
let adminUsers = [];
let selectedClientId = null;
let actionType = null;
let actionAttenderId = null;
let actionExamId = null;
const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// let baseUrl =
//   "https://digiscreener-stagingapi.gcp.digivalitsolutions.com/api/v1";

let timezones = [];
let adminType = localStorage.getItem("role");
let aiGeneratorDesiredState = false;
let currentAiGeneratorState = false;
let clientsGrid = null;
let examsGrid = null;
let attendersGrid = null;
let exams = [];
let duplicateEmailFound = false;

let logoErrorUrl = "../../common/imgs/school.png";

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
      console.log("Error detecting timezone:", e);
      return standardTimezones[0];
    }
  };

  // Set default timezone based on system
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

//utils
const commonStyles = {
  position: "absolute",
  backgroundColor: "#ea8181",
  color: "white",
  borderRadius: "5px",
  fontSize: "40px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "350px",
  height: "50px",
  zIndex: 9999,
  left: "42%",
  bottom: "3%",
  transform: "translateY(0px)",
  transition: "transform 0.5s ease",
};

$(document).on("change", "#send-email-all", function () {
  const isChecked = $(this).prop("checked");
  if (isChecked) {
    $("#email-reminder").show();
  } else {
    $("#email-reminder").hide();
    $("#send-email-reminder").prop("checked", false);
    $("#send-email-exam-reminder").prop("checked", false);
    $("#send-email-registration-reminder").prop("checked", false);
    $("#email-hours").val("");
    $('#email-reminder-hours-container').hide();
  }
});

// Email reminder checkbox handler
$(document).on("change", "#send-email-reminder", function () {
  const isChecked = $(this).prop("checked");
  if (isChecked) {
    $("#email-reminder-hours-container").show();
  } else {
    $("#email-reminder-hours-container").hide();
  }
});

//Open Menu Toggle
$("#toggle-menu").on("click", function () {
  const $openMenu = $(this);
  const $navBar = $(".nav-bar");
  const $topic = $(".topic");
  const $navLink = $(".nav-link-custom");

  const condition = $openMenu.hasClass("left");
  $navBar.css("width", condition ? "5%" : "15%");
  $topic.css("visibility", condition ? "hidden" : "visible");
  $navLink.css("display", condition ? "none" : "block");
  $openMenu.removeClass("left right").addClass(condition ? "right" : "left");
  if (condition) {
    $openMenu.removeClass("bxs-chevron-left").addClass("bxs-chevron-right");
  } else {
    $openMenu.removeClass("bxs-chevron-right").addClass("bxs-chevron-left");
  }
});

//Ripple Effect on Button Clicks
$(".add-client-btn").on("click", function (event) {
  const $button = $(this);
  const x = event.clientX - $button.offset().left;
  const y = event.clientY - $button.offset().top;

  const $ripples = $("<span>")
    .addClass("button-upper-hover")
    .css({ left: x, top: y });

  $button.append($ripples);
  setTimeout(() => $ripples.remove(), 1000);
});

/*-----------------functions Start-------------------------*/

function handleLoaded(callback) {
  const $loader = $("#loaders");
  $loader.show();

  setTimeout(function () {
    $loader.hide();
    callback();
  }, 500);
}

const handleNavigate = (_id, clientName) => {
  const $mainLayout = $("#main-layout");
  const $manageLayout = $("#manage-layout");
  selectedClientId = _id;
  updateBreadcrumbWithClient(clientName)
  $mainLayout.hide();
  fillUpBasicDetails();
  $manageLayout.show();
  getUsers();
};

const handleBread = (value) => {
  const $manageLayout = $("main ul li a");
  const staticValues = ["basic-details", "features", "default-settings"];

  staticValues.forEach((e, index) => {
    const $element = $("#" + e);
    const $link = $manageLayout.eq(index + 1);

    if (e === value) {
      $element.show();
      $link.css("color", "#41b9b4");
    } else {
      $element.hide();
      $link.css("color", "#898989");
    }
  });
};

const handleMenusubmenu = (value, type) => {
  const $element =
    type === "subMenu"
      ? $("#sub-menu ul li:nth-child(" + value + ")")
      : $(".main-menu ul li:nth-child(" + value + ")");
  const $allElement = $(".main-menu ul li");
  const $pages = $(".page");
  const $manageLayout = $("#manage-layout");
  $manageLayout.hide();
  $pages.each(function (index) {
    $(this).toggle(index + 1 === value);
  });

  $allElement.removeClass("active-menu").find("i");
  $element.addClass("active-menu").find("i");
  if (value === 2) {
    loadVideoManagementClients();
  }
  if (value === 3) {
    loadCreditsDashboard();
  }
  if (value === 4) {
    GradeController.init();
    CourseController.init();
    ProgramController.init();
    certificateController.init();
  }
};

const openAddClient = (id) => {
  $("#create-client-name").val("");
  $("#create-client-code").val("");
  $("#create-language-code").val("");
  $("#create-language-name").val("");
  $("#create-layout-code").val("");
  $("#test-email").val("");
  $(id).toggleClass("visible");
};

function updateLabel() {
  const $input = $("#sebFile");
  const $label = $("#file-label");
  const fileName = $input[0].files[0]
    ? $input[0].files[0].name
    : "No file selected";
  $label.text(fileName);
}

function addEmails() {
  let adminEmails = $("#admin-emails");
  let length = $("#admin-emails .d-flex").length;

  const accountAdmin = localStorage.getItem("accountAdmin");
  const isAccountAdminCheckbox =
    adminType === "superAdmin" || accountAdmin === "true"
      ? `<input class="basic-input-check" type="checkbox" id="${length}isAccountAdmin" />
       <label class="lite-grey" for="${length}isAccountAdmin">AccountAdmin</label>`
      : "";

  adminEmails.append(` <div class="d-flex align-items-center gap-2">
                <input type="email" class="form-control mt-1" id="admin-mail" placeholder="User Mail">
              <input type="email" class="form-control mt-1" id="admin-code" placeholder="User Password">
              <input class="basic-input-check" type="checkbox" id="${length}isAdmin" placeholder="Logo"/>
              <label class="lite-grey" for="${length}isAdmin">Admin</label>
              ${isAccountAdminCheckbox}
              <i class="fa-solid fa-xmark" id="remove-admin-user"></i>
            </div>`);
       
}
$(document).on("click", "#remove-admin-user", function () {
  $(this).closest(".d-flex").remove();
});

function showDeletePopup({ id, name, type, index = null }) {
  let title = "";
  let confirmationText = "";
  let descriptionText = "";
  if (type === "language") {
    title = "Delete Language";
    confirmationText = `Are you sure you want to delete the language <strong>"${name}"</strong>?`;
    descriptionText = `All labels associated with this language will be permanently removed.`;
  } else if (type === "admin") {
    title = "Delete User";
    confirmationText = `Are you sure you want to delete this user: <strong>${name}</strong>?`;
  } else if (type === "college") {
    title = "Delete Institute";
    confirmationText = `Are you sure you want to delete this institute: <strong>${name}</strong>?`;
    descriptionText = `
      <p>Type <strong>"${name}"</strong> to confirm this action.</p>
      <input type="text" id="delete-confirm-input" placeholder='Type "${name}"' class="form-control mt-2'"/>
      <p id="delete-error-msg" class="delete-popup-error-msg"></p>
    `;
  }

  const popupHtml = `
    <div class="accountmanagement-common-delete-popup" id="delete-popup-${type}">
      <div class="admin-popup-box">
        <div class="modal-header-section">
          <h4 class="modal-title">
            <i class="bx bx-error-circle delete-popup-error-circle"></i>
            ${title}
          </h4>
        </div>
        <div class="modal-content-section">
          <div class="warning-section">
            <i class="bx bx-info-circle"></i>
            <span>This action cannot be undone!</span>
          </div>
          <p class="confirmation-text">${confirmationText}</p>
          ${descriptionText}
        </div>
        <div class="modal-footer-section">
       
          <button class="outline-btn" id="cancel-delete-btn" data-type="${type}">Cancel</button>
       <button 
  type="button"
  class="client-create-btn bg-danger confirm-delete-btn"
  data-id="${id}"
  data-type="${type}"
  data-index="${index ?? ""}"
  data-name="${name}"
>
  <i class="bx bx-trash"></i>
  Delete ${
    type === "college" ? "Institute" : type === "admin" ? "User" : "Language"
  }
</button>
        </div>
      </div>
    </div>
  `;

  // Remove existing popups of any type
  $(`[id^="delete-popup-"]`).remove();

  // Append new popup
  $("body").append(popupHtml);

  $("#cancel-delete-btn").click(function () {
    closeDeletePopup();
  });

  $(".confirm-delete-btn").click(function () {
    const $btn = $(this);
    const id = $btn.data("id");
    const type = $btn.data("type");
    const name = $btn.data("name");
    const index = $btn.data("index");

    if (type === "language") {
      $(`#delete-accordian-${index}`).remove();
      closeDeletePopup();
      deleteLanguage(selectedClientId, id);
    } else if (type === "admin") {
      // Optional: Add loader to button
      $btn.prop("disabled", true).text("Deleting...");

      // Find and remove the user's container (adjust selector as needed)
      $(`.admin-user-row[data-id="${id}"]`).remove();

      // Close the popup
      closeDeletePopup();

      // Call delete logic
      deleteUser(id);
    } else if (type === "college") {
      const typed = $("#delete-confirm-input").val().trim();
      const errorEl = $("#delete-error-msg");

      if (id && typed === name) {
        errorEl.hide();
        closeDeletePopup();
        deleteClient(id);
      } else {
        errorEl
          .html(
            `You must type the correct client code <strong>${name}</strong> to confirm deletion.`
          )
          .show();
      }
    }
  });

  // Add show animation
  setTimeout(() => {
    $(`#delete-popup-${type}`).addClass("visible");
  }, 10);
}

function closeDeletePopup() {
  $(".accountmanagement-common-delete-popup").remove();
}

function addLabel(element) {
  // Remove empty state if it exists
  $(`#${element} .empty-labels-state`).remove();

  const newLabelHtml = `
    <div class="label-item new-label">
      <input type="text" class="form-control" id="label" placeholder="Enter label key">
      <input type="text" class="form-control" id="value" placeholder="Enter label value">
      <button type="button" class="remove-label-btn" onclick="removeLabel(this)">
        <i class="bx bx-trash"></i>
      </button>
    </div>
  `;
  $(`#${element}`).append(newLabelHtml);
}

function removeLabel(button) {
  const labelItem = $(button).closest(".label-item");
  const labelsContainer = labelItem.closest(".labels-container");

  labelItem.remove();

  // Check if no labels remain and show empty state
  if (labelsContainer.find(".label-item").length === 0) {
    const containerIndex = labelsContainer.attr("id").replace("label-", "");
    labelsContainer.append(`
      <div class="empty-labels-state" id="empty-state-${containerIndex}">
        <i class="bx bx-tag"></i>
        <h4>No Labels Yet</h4>
        <p>Click "Add Label" to create your first label</p>
      </div>
    `);
  }
}

const addLabelManage =
  (isToggle = false) =>
  () => {
    let labelsArray = $("#labelsArray");
    labelsArray.empty();

    // Add container wrapper
    labelsArray.append('<div class="language-cards-container"></div>');
    let cardsContainer = labelsArray.find(".language-cards-container");

    const findClient = getSameAccountData();
    const languages = findClient?.settings?.language?.languages;

    if (!languages || languages.length === 0) {
      cardsContainer.append(`
        <div class="empty-labels-state">
          <i class="bx bx-label"></i>
          <h4>No Languages Available</h4>
          <p>Add a language to start managing labels</p>
        </div>
      `);
      if (isToggle) openAddClient("#create-language");
      return;
    }

    languages.forEach((value, parentIndex) => {
      let labelsHtml = "";
      const labels = value?.labels || [];

      labels.forEach((item, itemIndex) => {
        labelsHtml += `
          <div class="label-item" id="delete-label-${parentIndex}-${itemIndex}">
            <input type="text" class="form-control" value="${
              item?.k || ""
            }" id="label" placeholder="Enter label key">
            <input type="text" class="form-control" value="${
              item?.v || ""
            }" id="value" placeholder="Enter label value">
            <button type="button" class="remove-label-btn" data-index="${parentIndex}-${itemIndex}" id="remove-label">
              <i class="bx bx-trash"></i>
            </button>
          </div>
        `;
      });

      if (labels.length === 0) {
        labelsHtml = `
          <div class="empty-labels-state" id="empty-state-${parentIndex + 1}">
            <i class="bx bx-tag"></i>
            <h4>No Labels Yet</h4>
            <p>Click "Add Label" to create your first label</p>
          </div>
        `;
      }

      cardsContainer.append(`
        <div class="language-accordion ${
          labels.length > 0 ? "expanded" : ""
        }" data-language-id="${value?._id}" id=delete-accordian-${parentIndex}>
      <span class="language-status-badge ${
        value.isActive ? "active" : "inactive"
      }" style="${value.isActive ? "" : "display: none;"}">
  Active
</span>
          <div class="language-accordion-header" data-toggle="accordion">
            <div class="language-header-left">
              <button class="accordion-toggle-btn">
                <i class="bx bx-chevron-right accordion-icon"></i>
              </button>
              <div class="language-title-section">
                <h3 class="language-title">${value?.name} (${value?.code})</h3>
              </div>
            </div>
            <div class="language-header-actions">
              <button class="remove-language-btn" data-accordian-index="${parentIndex}" data-id="${
        value?._id
      }" data-name="${value?.name}" title="Delete Language">
                <i class="bx bx-trash"></i>
              </button>
            </div>
          </div>
          <div class="language-accordion-body">
            <div class="labels-container" id="label-${parentIndex + 1}">
              ${labelsHtml}
            </div>
            <div class="accordion-body-actions">
              <div class="toggle-container">
                <span class="toggle-label">Make Active</span>
                <label class="toggle-switch">
                  <input type="checkbox" class="status-toggle-input" ${
                    value.isActive ? "checked" : ""
                  } data-id="${value?._id}">
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="button-group">
                <button class="add-label-btn" onclick="addLabel('label-${
                  parentIndex + 1
                }')">
                  <i class="bx bx-plus"></i>
                  Add Label
                </button>
                <button class="save-labels-btn" data-index="${
                  parentIndex + 1
                }" data-id="${value?._id}" id="save-labels">
                  <i class="bx bx-check"></i>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      `);
    });

    // Handle single language accordion width
    const languageAccordions = cardsContainer.find(".language-accordion");
    if (languageAccordions.length === 1) {
      cardsContainer.addClass("single-language");
    } else {
      cardsContainer.removeClass("single-language");
    }

    // Add accordion toggle functionality
    $(document)
      .off("click", ".accordion-toggle-btn, .language-accordion-header")
      .on(
        "click",
        ".accordion-toggle-btn, .language-accordion-header",
        function (e) {
          e.preventDefault();
          e.stopPropagation();

          const $accordion = $(this).closest(".language-accordion");
          const $body = $accordion.find(".language-accordion-body");
          const $icon = $accordion.find(".accordion-icon");

          $accordion.toggleClass("expanded");

          if ($accordion.hasClass("expanded")) {
            $body.show();
            $icon.css("transform", "rotate(90deg)");
          } else {
            $body.hide();
            $icon.css("transform", "rotate(0deg)");
          }
        }
      );

    $(document).on("click", "#open-label-info-sp", function () {
      $(".label-info-side-panel").removeClass("hidden");
    });

    // Close the side panel
    $(document).on("click", "#close-label-info-sp", function () {
      $(".label-info-side-panel").addClass("hidden");
    });

    // Add status toggle functionality
    $(document)
      .off("change", ".status-toggle-input")
      .on("change", ".status-toggle-input", function () {
        const $this = $(this);
        const isActive = $this.is(":checked");
        const languageId = $this.data("id");

        const $currentBadge = $this
          .closest(".language-accordion")
          .find(".language-status-badge");

        if (isActive) {
          // 1. Uncheck and deactivate all others
          $(".status-toggle-input").not(this).prop("checked", false);

          $(".language-status-badge")
            .removeClass("active")
            .addClass("inactive")
            .hide();

          // 2. Activate current one
          $currentBadge
            .removeClass("inactive")
            .addClass("active")
            .text("Active")
            .show();

          // 3. Update all others to inactive in backend/state
          $(".status-toggle-input")
            .not(this)
            .each(function () {
              const otherId = $(this).data("id");
              updateLabelActive(otherId, { isActive: false });
            });
        } else {
          $currentBadge.hide();
        }

        // 4. Update current toggle
        updateLabelActive(languageId, { isActive });
      });

    // Add delete confirmation functionality
    $(document)
      .off("click", ".remove-language-btn")
      .on("click", ".remove-language-btn", function (e) {
        let index = $(this).data("accordian-index");
        e.preventDefault();
        e.stopPropagation();

        const languageId = $(this).data("id");
        const languageName = $(this).data("name");
        showDeletePopup({
          id: languageId,
          name: languageName,
          type: "language",
          index,
        });
      });

    if (isToggle) openAddClient("#create-language");
  };

function filterTable() {
  const searchInput = $("#table-search").val();
  const clientList = $("#client-list");
  const filteredData = allClients.filter(function (item) {
    return (
      item.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      item.code.toLowerCase().includes(searchInput.toLowerCase())
    );
  });
  clientList.empty();

  // no client found
  if (filteredData.length === 0) {
    clientList.append(`
      <tr>
        <td colspan="12" class="text-center text-muted py-3 fs-6">No clients found</td>
      </tr>
    `);
    return;
  }
  filteredData.forEach(function (item) {
    clientList.append(`
      <tr>
        <td>
          ${item?.code} 
        </td>
        <td>
        ${
          item?.settings?.logo?.url
            ? `<img
            class="admin-image"
            alt="admin"
            width="35"
            height="35"
            src="${item?.settings?.logo?.url}"
            onerror="this.src='${logoErrorUrl}'"
          />`
            : ""
        }
         
          <span class="ms-3">${item?.name}</span>
        </td>
        <td>${item?.userCount || 0}</td>  
        <td>${item?.entranceExamCount || 0}</td>
        <td>${item?.adminCount || 0}</td>
        <td class="d-flex align-items-center justify-content-center gap-2" id="admin-actions">
          <button type="button" class="manage-btn" id="manage-btn" data-id="${
            item?._id
          }" data-name="${item?.name}">Manage</button>
        </td>
      </tr>
    `);
    if (adminType === "superAdmin") {
      const deleteIcon = document.createElement("i");
      deleteIcon.classList.add("bx", "bx-trash", "mx-3", "cursor-pointer");
      deleteIcon.setAttribute("data-id", item._id);
      deleteIcon.setAttribute("id", "deleteClient");
      $("#client-list tr td").last().append(deleteIcon);
    }
  });
}
function getSameAccountData() {
  return allClients.find((data) => data._id === selectedClientId);
}

function fillUpBasicDetails() {
  const findClient = getSameAccountData();
  const registrationContent =
    findClient?.settings?.content?.registrationContent;
  const invitationContent = findClient?.settings?.content?.invitationContent;
  const reportContent = findClient?.settings?.content?.reportContent;
  const regSubject = findClient?.settings?.content?.registrationSubject;
  const invSubject = findClient?.settings?.content?.invitationSubject;
  const repSubject = findClient?.settings?.content?.reportSubject;
  const fileName = findClient?.settings?.logo?.url
    ?.split("/")[5]
    ?.split("?")[0]
    .replaceAll("%", "");

  const host = findClient?.settings?.emailConfiguration?.host;
  const port = findClient?.settings?.emailConfiguration?.port;
  const username = findClient?.settings?.emailConfiguration?.username;
  const password = findClient?.settings?.emailConfiguration?.password;
  const from = findClient?.settings?.emailConfiguration?.from;
  const isDigivalEmail =
    findClient?.settings?.emailConfiguration?.isDigivalEmail;

  localStorage.setItem(
    "enableInsight",
    findClient?.settings?.features?.enableInsight
  );
  localStorage.setItem(
    "enableGroupCreation",
    findClient?.settings?.features?.enableGroupCreation
  );

  if (isDigivalEmail) {
    $("#host-name").prop("disabled", isDigivalEmail);
    $("#port-number").prop("disabled", isDigivalEmail);
    $("#username").prop("disabled", isDigivalEmail);
    $("#password-email-configuration").prop("disabled", isDigivalEmail);
    $("#from-email-configuration").prop("disabled", isDigivalEmail);
  }

  $("#client-name").val(findClient?.name);
  $("#client-code").val(findClient?.code);
  $("#client-theme-primary").val(
    findClient?.settings?.colors?.primary || "#1877F2"
  );
  $("#client-theme-secondary").val(
    findClient?.settings?.colors?.secondary || "#8BCEF7"
  );
  $("#anomaly-detection").prop(
    "checked",
    findClient?.settings?.features?.enableAnomalyDetection
  );
  $("#grouping-creation").prop(
    "checked",
    findClient?.settings?.features?.enableGroupCreation
  );
  $("#insight-creation").prop(
    "checked",
    findClient?.settings?.features?.enableInsight
  );
  $("#certificate-creation").prop(
    "checked",
    findClient?.settings?.features?.enableCertificateCreation
  );
  $("#heba-creation").prop(
    "checked",
    findClient?.settings?.features?.enableHEBAItemCreation
  );
  $("#capture-image").prop(
    "checked",
    findClient?.settings?.exam?.enableCaptureImage
  );

  $("#upload-documents-registration").prop(
    "checked",
    findClient?.settings?.exam?.enableUploadDocuments
  );

  // $("#upload-image").prop(
  //   "checked",
  //   findClient?.settings?.exam?.enableUploadImage
  // );

  $("#scandnq").prop("checked", findClient?.settings?.exam?.enableScAndNq);

  $("#ai-question-generator").prop(
    "checked",
    findClient?.settings?.exam?.enableAIQuestionGenerator
  );

  $("#detailed-report").prop(
    "checked",
    findClient?.settings?.exam?.enableDetailedReport
  );

  $("#report-publish").prop(
    "checked",
    findClient?.settings?.exam?.enableReportPublish
  );

  $("#max-users").val(findClient?.settings?.features?.maxUsers || 0);
  $("#max-exams").val(findClient?.settings?.features?.totalExams || 0);
  $("input[name='start'][value='autoStart']").prop(
    "checked",
    findClient?.settings?.exam?.canAutoStartExam
  );
  if (findClient?.settings?.exam?.canAutoStartExam) {
    $("#time-zone").css({ display: "block" });
  }
  $("input[name='start'][value='manualStart']").prop(
    "checked",
    !findClient?.settings?.exam?.canAutoStopExam
  );
  $("#exam-taker").prop(
    "checked",
    findClient?.settings?.exam?.allowStudentsWithoutRegistration
  );
  $("#late-start").prop(
    "checked",
    findClient?.settings?.exam?.canReduceLateEntryTime
  );
  $("#logo").attr("src", findClient?.settings?.logo?.url);
  $("#profile-logo").attr("src", findClient?.settings?.logo?.url);
  $("#client-logo").fileName = fileName;

  //mail content Update editor content
  $("#registration-content-editor").trumbowyg("html", registrationContent);
  $("#invitation-content-editor").trumbowyg("html", invitationContent);
  $("#report-content-editor").trumbowyg("html", reportContent);

  // Update subject fields
  $("#registration-subject").val(regSubject);
  $("#invitation-subject").val(invSubject);
  $("#report-subject").val(repSubject);
  $("#time-zone")
    .find("#user-filter-input")
    .val(findClient?.settings?.exam?.timeZone);

  //step 4
  addLabelManage(false)();

  // Find and set the timezone from client settings
  const clientTimezone = findClient?.settings?.exam?.timeZone;
  if (clientTimezone) {
    const matchedTimezone = timezones.find(
      (tz) => tz.identifier === clientTimezone
    );
    if (matchedTimezone) {
      const displayValue = `${matchedTimezone.offset} ${matchedTimezone.name}`;
      $("#user-filter-input").val(displayValue);
      $("#user-filter-input").data("identifier", matchedTimezone.identifier);
    }
  }

  // Set up item type checkboxes
  const itemTypes = findClient?.settings?.exam?.enableItemTypes || ["MCQ"];
  $("#MCQ-checkbox").prop("checked", itemTypes.includes("MCQ"));
  $("#SAQ-checkbox").prop("checked", itemTypes.includes("SAQ"));
  $("#FTB-checkbox").prop("checked", itemTypes.includes("FTB"));
  $("#IR-checkbox").prop("checked", itemTypes.includes("IR"));
  $("#UD-checkbox").prop("checked", itemTypes.includes("UD"));
  $("#PRQ-checkbox").prop("checked", itemTypes.includes("PRQ"));
  $("#OR-checkbox").prop("checked", itemTypes.includes("OR"));
  $("#TF-checkbox").prop("checked", itemTypes.includes("TF"));
  $("#MTF-checkbox").prop("checked", itemTypes.includes("MTF"));
  $("#TAB-checkbox").prop("checked", itemTypes.includes("TAB"));

  // Make sure at least one is checked
  if (!itemTypes.length) {
    $("#MCQ-checkbox").prop("checked", true);
  }

  $("#host-name").val(host);
  $("#port-number").val(port);
  $("#username").val(username);
  $("#password-email-configuration").val(password);
  $("#from-email-configuration").val(from);
  $("#digival-email-toggle").prop("checked", isDigivalEmail);

  $("#email-hours").val(
    findClient?.settings?.features?.reminder?.emailReminder || 1
  );

  if (findClient?.settings?.features?.reminder?.canSendReminder) {
    $("#email-reminder-hours-container").show();
  } else {
    $("#email-reminder-hours-container").hide();
  }

  if (findClient?.settings?.features?.reminder?.canSendEmail) {
    $("#send-email-all").prop(
      "checked",
      findClient?.settings?.features?.reminder?.canSendEmail
    );
    $("#email-reminder").show();
  } else {
    $("#send-email-all").prop("checked", false);
    $("#email-reminder").hide();
  }

  $("#send-email-reminder").prop(
    "checked",
    findClient?.settings?.features?.reminder?.canSendReminder
  );
  $("#send-email-exam-reminder").prop(
    "checked",
    findClient?.settings?.features?.reminder?.canSendExamReminder
  );
  $("#send-email-registration-reminder").prop(
    "checked",
    findClient?.settings?.features?.reminder?.canSendRegistrationReminder
  );
}

/*-----------------functions Start-------------------------*/

//call get apis like compound did mount
$(document).ready(function () {
  const isSuperAdmin = roleAccess("role", "superAdmin");
  if (!isSuperAdmin) $("#clientSearch").hide();
  // Clear the search field on page load to prevent auto-filling with email
  $("#table-search").val("");
  getClients()();
  initializeTabs();
  addEmailContentManage();

  $("#back-to-clients").on("click", function () {
    // Hide exam section, show client section
    $("#video-exam-section").addClass("d-none");
    $("#video-client-section").removeClass("d-none");
  });

  $("#video-client-search").on("input", function () {
    filterVideoClients();
  });

  $("#removeVideoSearch").on("click", function () {
    $("#video-client-search").val("");
    filterVideoClients();
  });

  $("#clients-grid-search").on("input", function () {
    const searchValue = $(this).val();
    const gridDiv = document.querySelector("#clientsGrid");

    if (gridDiv && gridDiv.gridOptions && gridDiv.gridOptions.api) {
      const gridApi = gridDiv.gridOptions.api;

      // Apply quick filter
      gridApi.setGridOption("quickFilterText", searchValue);

      // Delay to ensure grid updates filter results
      setTimeout(() => {
        const filteredRows = [];
        gridApi.forEachNodeAfterFilter((node) => filteredRows.push(node));

        if (filteredRows.length === 0) {
          gridApi.showNoRowsOverlay();
        } else {
          gridApi.hideOverlay();
        }
      }, 50);
    }
  });

  $("#clear-clients-search").on("click", function () {
    $("#clients-grid-search").val("");
    const gridDiv = document.querySelector("#clientsGrid");

    if (gridDiv && gridDiv.gridOptions && gridDiv.gridOptions.api) {
      const gridApi = gridDiv.gridOptions.api;
      gridApi.setGridOption("quickFilterText", "");

      setTimeout(() => {
        const filteredRows = [];
        gridApi.forEachNodeAfterFilter((node) => filteredRows.push(node));

        if (filteredRows.length === 0) {
          gridApi.showNoRowsOverlay();
        } else {
          gridApi.hideOverlay();
        }
      }, 50);
    }
  });

  $("#exams-grid-search").on("input", function () {
    const searchValue = $(this).val();
    const gridDiv = document.querySelector("#examsGrid");

    if (gridDiv && gridDiv.gridOptions && gridDiv.gridOptions.api) {
      const gridApi = gridDiv.gridOptions.api;

      gridApi.setGridOption("quickFilterText", searchValue);

      // Show or hide the overlay based on result
      setTimeout(() => {
        if (gridApi.getDisplayedRowCount() === 0) {
          gridApi.showNoRowsOverlay();
        } else {
          gridApi.hideOverlay();
        }
      }, 50);
    }
  });

  $("#clear-exams-search").on("click", function () {
    $("#exams-grid-search").val("");
    const gridDiv = document.querySelector("#examsGrid");

    if (gridDiv && gridDiv.gridOptions && gridDiv.gridOptions.api) {
      const gridApi = gridDiv.gridOptions.api;

      gridApi.setGridOption("quickFilterText", "");

      // Re-check overlay after clearing
      setTimeout(() => {
        if (gridApi.getDisplayedRowCount() === 0) {
          gridApi.showNoRowsOverlay();
        } else {
          gridApi.hideOverlay();
        }
      }, 50);
    }
  });

  $("#attenders-grid-search").on("input", function () {
    const searchValue = $(this).val();
    const gridDiv = document.querySelector("#attendersGrid");

    if (gridDiv && gridDiv.gridOptions && gridDiv.gridOptions.api) {
      const gridApi = gridDiv.gridOptions.api;

      gridApi.setGridOption("quickFilterText", searchValue);

      setTimeout(() => {
        if (gridApi.getDisplayedRowCount() === 0) {
          gridApi.showNoRowsOverlay();
        } else {
          gridApi.hideOverlay();
        }
      }, 100);
    }
  });

  $("#clear-attenders-search").on("click", function () {
    $("#attenders-grid-search").val("");
    const gridDiv = document.querySelector("#attendersGrid");

    if (gridDiv && gridDiv.gridOptions && gridDiv.gridOptions.api) {
      const gridApi = gridDiv.gridOptions.api;

      gridApi.setGridOption("quickFilterText", "");

      setTimeout(() => {
        if (gridApi.getDisplayedRowCount() === 0) {
          gridApi.showNoRowsOverlay();
        } else {
          gridApi.hideOverlay();
        }
      }, 50);
    }
  });

  // Load video management clients when switching to that tab
  $(".main-menu ul li:nth-child(2)").on("click", function () {
    loadVideoManagementClients();
    // Store reference to the clients grid for search filtering
    window.clientsGridApi =
      document.querySelector("#clientsGrid").gridOptions.api;
  });

  // Recordings Event Handlers
  $(document).on("click", ".view-recordings-btn", function () {
    const examId = $(this).data("id");
    getRecordingsByExam(examId);
  });

  $("#back-to-exams").on("click", function () {
    // Hide recordings section, show exam section
    $("#video-recordings-section").addClass("d-none");
    $("#video-exam-section").removeClass("d-none");
  });

  // Handler for viewing recordings for a specific attender
  $(document).on("click", ".view-recordings-details-btn", function () {
    const attenderId = $(this).data("id");
    const examId = $(this).data("exam-id");
    getAttenderRecordings(attenderId, examId);
  });

  $("#digival-email-toggle").on("change", function () {
    $(".host-name-error").text("");
    $(".port-number-error").text("");
    $(".username-error").text("");
    $(".password-error").text("");
    $(".form-email-error").text("");
  });

  $("#host-name").on("input", function () {
    $(".host-name-error").text("");
  });

  $("#port-number").on("input", function () {
    $(".port-number-error").text("");
  });

  $("#username").on("input", function () {
    $(".username-error").text("");
  });

  $("#password-email-configuration").on("input", function () {
    $(".password-error").text("");
  });

  $("#from-email-configuration").on("input", function () {
    $(".form-email-error").text("");
  });

  $("#test-email").on("input", function () {
    $(".test-email-error").text("");
  });

  $(document).on("click", ".play-recording-btn", function () {
    const videoUrl = $(this).data("url");
    // Open a modal or redirect to a player page to play the video
    if (videoUrl) {
      window.open(videoUrl, "_blank");
    } else {
      const $message = $("#api-success");
      $message.find(".error-message").text("Video URL not available.");
      $message.css(commonStyles);
      setTimeout(() => {
        $message.css({ ...commonStyles, transform: "translateY(500px)" });
      }, 2000);
    }
  });

  $(document).on("click", ".download-recording-btn", function () {
    const videoUrl = $(this).data("url");
    if (videoUrl) {
      // Create a temporary anchor to trigger download
      const a = document.createElement("a");
      a.href = videoUrl;
      a.download = "recording.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  });

  // Make sure MCQ is checked by default
  if (
    !$("#MCQ-checkbox").prop("checked") &&
    !$("#SAQ-checkbox").prop("checked") &&
    !$("#FTB-checkbox").prop("checked") &&
    !$("#IR-checkbox").prop("checked") &&
    !$("#UD-checkbox").prop("checked") &&
    !$("#PRQ-checkbox").prop("checked") &&
    !$("#OR-checkbox").prop("checked") &&
    !$("#TF-checkbox").prop("checked") &&
    !$("#MTF-checkbox").prop("checked") &&
    !$("#TAB-checkbox").prop("checked")
  ) {
    $("#MCQ-checkbox").prop("checked", true);
  }
});

//call get apisUpload Equal

const getClients =
  (isToggle = false, cb = () => {}) =>
  () => {
    const callback = (data) => {
      if (isToggle) openAddClient("#add-client-popup");
      allClients = data?.data;
      const isEnabled = allClients.some(
        (client) => client.settings?.features?.enableCertificateCreation
      );
      if (isEnabled) {
        certificateController.renderCourseTabs(allClients);
      }
      const clientList = $("#client-list");
      clientList.empty();
      cb && cb();
      data?.data.forEach(function (item) {
        clientList.append(`<tr>
                <td>
                  ${item?.code} 
                </td>
                <td>
                  ${
                    item?.settings?.logo?.url
                      ? `<img
            class="admin-image"
            alt="admin"
            width="35"
            height="35"
            src="${item?.settings?.logo?.url}"
            onerror="this.src='${logoErrorUrl}'"
          />`
                      : ""
                  }
                  <span class="ms-3">${item?.name}</span>
    </td>
                <td>${item?.userCount || 0}</td>
                <td>${item?.entranceExamCount || 0}</td>
                <td>${item?.adminCount || 0}</td>
                <td class="d-flex align-items-center justify-content-center gap-2" id="admin-actions">
                  <button type="button" class="manage-btn" id="manage-btn" data-name="${
                    item?.name
                  }" data-id="${item?._id}" >Manage</button>
                </td>
              </tr>`);
        if (adminType === "superAdmin") {
          const deleteIcon = document.createElement("i");
          deleteIcon.classList.add("bx", "bx-trash", "mx-3", "cursor-pointer");
          deleteIcon.setAttribute("data-id", item._id);
          deleteIcon.setAttribute("id", "deleteClient");
          deleteIcon.setAttribute("data-code", item.code);
          $("#client-list tr td").last().append(deleteIcon);
        }
      });
    };
    apiCall({
      url: `${ACCOUNT_END_POINT}/admin-count`,
      type: "GET",
      callback,
      callSuccessMessage: false,
    });
  };

$(document).on("click", "#delete-admin-user", function () {
  const id = $(this).data("id");
  const email = $(this).data("email");
  showDeletePopup({ id: id, name: email, type: "admin" });
});

const getUsers = () => {
  const callback = (data) => {
    adminUsers = data?.data;
    $("#admin-emails").empty();
    data?.data?.forEach((user, index) => {
      const accountAdmin = localStorage.getItem("accountAdmin");
      const isAccountAdminCheckbox =
        adminType === "superAdmin" || accountAdmin === "true"
          ? `<input class="" type="checkbox" ${
              user?.isAccountAdmin ? "Checked" : ""
            } id="${index}isAccountAdmin" />
           <label class="lite-grey" for="${index}isAccountAdmin">AccountAdmin</label>`
          : "";

      const userHTML = `
        <div class="d-flex gap-2 align-items-center admin-user-row" data-id="${
          user._id
        }">
          <input type="text" class="form-control mt-1" id="admin-mail" data-id="${
            user._id
          }" value="${user.email}" disabled/>
            <input type="text" class="form-control mt-1" id="admin-code" value="${
              user.password
            }" placeholder="Password">
           <input class="" type="checkbox" ${
             user?.isAdmin ? "Checked" : ""
           } id="${index}isAdmin" />
            <label class="lite-grey" for="${index}isAdmin">Admin</label>
           ${isAccountAdminCheckbox}
            <i class="bx bx-trash " id="delete-admin-user" data-email="${
              user.email
            }" data-id="${user._id}"></i>
        </div>
      `;
      $("#admin-emails").append(userHTML);
    });
  };
  apiCall({
    url: `${base_url}/user/with-password?accountId=${selectedClientId}`,
    type: "GET",
    callback,
    callSuccessMessage: false,
  });
};

// Video Management Functions
const loadVideoManagementClients = () => {
  // Clear previous data
  if (clientsGrid) {
    clientsGrid.destroy();
    clientsGrid = null;
  }
  if (examsGrid) {
    examsGrid.destroy();
    examsGrid = null;
  }
  if (attendersGrid) {
    attendersGrid.destroy();
    attendersGrid = null;
  }

  // Reset sections
  $("#video-client-section").removeClass("d-none");
  $("#video-exam-section").addClass("d-none");
  $("#video-recordings-section").addClass("d-none");

  // Show video management container
  $("#video-management-container").show();

  // Load clients data
  const callback = (data) => {
    allClients = data?.data || [];
    displayVideoClients(allClients);
  };

  makeApiCall({
    url: `${ACCOUNT_END_POINT}/admin-count`,
    method: "GET",
    successCallback: callback,
    errorCallback: (error) => {
      console.error("Error fetching clients:", error);
    },
  });

  // Initialize search functionality
  $("#clients-grid-search").off("input").on("input", filterVideoClients);
  $("#clear-clients-search")
    .off("click")
    .on("click", () => {
      $("#clients-grid-search").val("");
      filterVideoClients();
    });

  // Back button handlers
  $("#back-to-clients")
    .off("click")
    .on("click", () => {
      $("#video-client-section").removeClass("d-none");
      $("#video-exam-section").addClass("d-none");
      $("#video-recordings-section").addClass("d-none");
    });

  $("#back-to-exams")
    .off("click")
    .on("click", () => {
      $("#video-client-section").addClass("d-none");
      $("#video-exam-section").removeClass("d-none");
      $("#video-recordings-section").addClass("d-none");
    });
};

const loadCreditsDashboard = () => {
  $("#credits-dashboard-container").show();

  initializeCreditsDashboard();
};

const displayVideoClients = (clients) => {
  const $loader = $("#loaders");
  $loader.show();

  // Use AG Grid for clients list
  const columnDefs = [
    {
      field: "code",
      headerName: "Institute Code",
      minWidth: 150,
      suppressSizeToFit: true,
    },
    {
      field: "name",
      headerName: "Institute Name",
      flex: 2,
      minWidth: 250,
      cellRenderer: (params) => {
        if (!params.data) return "";
        return `
          <div style="display: flex; align-items: center;">
            <img class="admin-image" alt="admin" width="35" height="35" onerror="this.src='${logoErrorUrl}'" src="${params.data.logo}" style="margin-right: 10px;" />
            <span>${params.value}</span>
          </div>
        `;
      },
    },
    {
      field: "totalExams",
      headerName: "No Of Exams",
      minWidth: 120,
      suppressSizeToFit: true,
    },
    {
      field: "actions",
      headerName: "Action",
      minWidth: 150,
      suppressSizeToFit: true,
      filter: false,
      cellRenderer: (params) => {
        if (!params.data) return "";
        return `
          <button type="button" class="manage-btn view-exams-btn" data-id="${params.data.id}" data-code="${params.data.code}">
            View Exams
          </button>
        `;
      },
    },
  ];

  // Format data for AG Grid
  const rowData = allClients.map((item) => ({
    id: item._id,
    code: item.code,
    name: item.name,
    logo: item.settings?.logo?.url || "../../common/imgs/Digival.png",
    totalExams: item?.entranceExamCount || 0,
  }));

  // Initialize AG Grid
  const gridOptions = {
    columnDefs: columnDefs,
    rowData: rowData,
    pagination: true,
    paginationPageSize: 100,
    domLayout: "normal",
    animateRows: true,
    rowHeight: 60,
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      resizable: true,
      sortable: true,
      filter: true,
      suppressMovable: true,
    },
    overlayNoRowsTemplate:
      '<div class="text-center p-5 text-muted">No clients found</div>',
    domLayout: "autoHeight",
    suppressColumnVirtualisation: true,
  };

  // Create new grid
  const gridDiv = document.querySelector("#clientsGrid");
  if (clientsGrid) {
    clientsGrid.destroy();
  }
  clientsGrid = new agGrid.Grid(gridDiv, gridOptions);

  // Add event listener for View Exams button
  gridDiv.addEventListener("click", function (event) {
    if (event.target.classList.contains("view-exams-btn")) {
      const clientId = event.target.getAttribute("data-id");
      const clientCode = event.target.getAttribute("data-code");
      getExamsByClient(clientId, clientCode);
    }
  });

  $loader.hide();
};

const getExamsByClient = (clientId, clientCode) => {
  const $loader = $("#loaders");
  $loader.show();

  // Show selected client name
  $("#selected-client-name").text(`${clientCode} - Exams`);

  // Hide client section, show exam section
  $("#video-client-section").addClass("d-none");
  $("#video-exam-section").removeClass("d-none");

  makeApiCall({
    url: `${EXAM_END_POINT}/list?accountId=${clientId}`,
    method: "GET",
    successCallback: function (response) {
      exams = response.data.data;
      displayExams(exams);
      $loader.hide();
    },
    errorCallback: function (error) {
      console.error("Error fetching exams:", error);
      $("#video-exam-list").html(
        `<tr><td colspan="4" class="text-center">Error loading exams: ${error}</td></tr>`
      );
      $loader.hide();
    },
  });
};

const displayExams = (exams) => {
  document.querySelector("#examsGrid").innerHTML = "";
  // Filter exams to only show those with ON_GOING or ENDED status
  const filteredExams = exams.filter(
    (exam) => exam.examStatus === "ON_GOING" || exam.examStatus === "ENDED"
  );

  // Define column definitions for exams grid
  const columnDefs = [
    {
      field: "name",
      headerName: "Exam Name",
      flex: 2,
      minWidth: 200,
    },
    {
      field: "date",
      headerName: "Date",
      minWidth: 180,
      suppressSizeToFit: true,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 150,
      suppressSizeToFit: true,
      cellRenderer: (params) => {
        if (!params.data) return document.createTextNode("");
        const span = document.createElement("span");
        if (params.value === "ON_GOING") {
          span.className = "status-badge-success";
          span.textContent = "ON_GOING";
        } else if (params.value === "ENDED") {
          span.className = "status-badge-primary";
          span.textContent = "ENDED";
        } else {
          span.textContent = params.value;
        }
        return span;
      },
    },
    {
      field: "actions",
      headerName: "Action",
      minWidth: 150,
      suppressSizeToFit: true,
      filter: false,
      cellRenderer: (params) => {
        if (!params.data) return "";
        return `
          <button type="button" class="manage-btn view-recordings-btn" data-id="${params.data.id}">
            View Attenders
          </button>
        `;
      },
    },
  ];

  // Check if there are any exams to display
  let rowData = [];
  if (!filteredExams || filteredExams.length === 0) {
    // Create empty grid with message
    const gridDiv = document.querySelector("#examsGrid");
    const gridOptions = {
      columnDefs: columnDefs,
      rowData: [],
      pagination: true,
      paginationPageSize: 20,
      domLayout: "normal",
      animateRows: true,
      rowHeight: 60,
      defaultColDef: {
        flex: 1,
        minWidth: 100,
        resizable: true,
        sortable: true,
        filter: true,
        suppressMovable: true,
      },
      overlayNoRowsTemplate:
        '<div class="text-center p-5 text-muted">No active or completed exams found for this client</div>',
    };
    new agGrid.Grid(gridDiv, gridOptions);
    gridDiv.gridOptions = gridOptions;
    gridDiv.gridOptions.api.showNoRowsOverlay();
    return;
  }

  // Format exam data for AG Grid
  rowData = filteredExams.map((exam) => {
    const startDate = new Date(exam.session.start.date);
    const formattedDate = `${formatDate(startDate)} ${
      exam.session.start.hour
    }:${exam.session.start.minute.toString().padStart(2, "0")} ${
      exam.session.start.format
    }`;

    return {
      id: exam._id,
      name: exam.name,
      date: formattedDate,
      status: exam.examStatus,
    };
  });

  // Initialize AG Grid for exams
  const gridOptions = {
    columnDefs: columnDefs,
    rowData: rowData,
    pagination: true,
    paginationPageSize: 100,
    domLayout: "normal",
    animateRows: true,
    popupParent: document.getElementById("video-management-container"),
    rowHeight: 60,
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      resizable: true,
      sortable: true,
      filter: true,
      suppressMovable: true,
    },
    overlayNoRowsTemplate:
      '<div class="text-center p-5 text-muted">No active or completed exams found for this client</div>',
  };

  // Create new grid
  const gridDiv = document.querySelector("#examsGrid");
  new agGrid.Grid(gridDiv, gridOptions);

  // Store grid options on element for access in other functions
  gridDiv.gridOptions = gridOptions;

  // Add event listener for View Recordings button
  gridDiv.addEventListener("click", function (event) {
    if (event.target.classList.contains("view-recordings-btn")) {
      const examId = event.target.getAttribute("data-id");
      getRecordingsByExam(examId);
    }
  });
};

// Helper function to format date similar to examlist.js
function formatDate(date) {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

const getRecordingsByExam = (examId) => {
  const $loader = $("#loaders");
  $loader.show();

  // Get the exam name from the grid data
  const gridDiv = document.querySelector("#examsGrid");
  let examName = "Exam";
  if (gridDiv && gridDiv.gridOptions && gridDiv.gridOptions.api) {
    const rowNode = gridDiv.gridOptions.api.getRowNode(function (node) {
      return node.data.id === examId;
    });
    if (rowNode && rowNode.data) {
      examName = rowNode.data.name;
    }
  }

  // Update header text
  $("#selected-exam-name").text(`${examName} - Attenders`);

  // Hide exam section, show recordings section
  $("#video-exam-section").addClass("d-none");
  $("#video-recordings-section").removeClass("d-none");

  $("#force-process-all-btn").on("click", function () {
    actionType = "process-all";
    actionExamId = examId;

    $("#password-confirmation-popup").addClass("visible");
    $("#confirmation-password").val("").focus();
    $("#password-error").addClass("d-none");
  });

  // Use makeApiCall from commonApi.js to fetch attenders for the exam
  makeApiCall({
    url: `${EXAM_ATTENDER_END_POINT}/anomaly?entranceExamId=${examId}`,
    method: "GET",
    disableLoading: true,
    successCallback: (data) => {
      $loader.hide();
      displayAttenders(data?.data?.attender?.data, examId);
    },
    errorCallback: (error) => {
      $loader.hide();
      showErrorMessage("Failed to retrieve attenders data");
    },
  });
};

const displayAttenders = (attenders, examId) => {
  // Define cell editor for anomaly category dropdown
  document.querySelector("#attendersGrid").innerHTML = "";

  // Define column definitions for attenders grid
  const columnDefs = [
    {
      field: "email",
      headerName: "Email",
      flex: 1.4,
      minWidth: 200,
    },
    {
      field: "examStatus",
      headerName: "Exam Status",
      minWidth: 150,
      suppressSizeToFit: true,

      cellRenderer: (params) => {
        if (!params.data) return "";
        if (params.value === "ENDED") {
          return '<span class="status-badge-primary">Completed</span>';
        } else if (params.value === "ON_GOING") {
          return '<span class="status-badge-success">On Going</span>';
        } else {
          return '<span class="status-badge-secondary">Not Started</span>';
        }
      },

      valueFormatter: (params) => {
        if (!params.value) return "";
        if (params.value === "ENDED") return "Completed";
        if (params.value === "ON_GOING") return "On Going";
        return "Not Started";
      },

      getQuickFilterText: (params) => {
        const displayText =
          params.value === "ENDED"
            ? "Completed"
            : params.value === "ON_GOING"
            ? "On Going"
            : "Not Started";
        return `${params.value} ${displayText}`;
      },

      filterParams: {
        textFormatter: (value) => {
          if (value === "ENDED") return "completed";
          if (value === "ON_GOING") return "ongoing";
          if (value === "NOT_STARTED") return "not started";
          return value?.toString().toLowerCase() || "";
        },
      },
    },
    {
      field: "anomalyStatus",
      headerName: "Anomaly Status",
      minWidth: 150,
      suppressSizeToFit: true,

      cellRenderer: (params) => {
        if (!params.data) return "";
        if (params.value === "PROCESSED") {
          return '<span class="status-badge-primary">Processed</span>';
        } else if (params.value === "PROCESSING") {
          return '<span class="status-badge-success">Processing</span>';
        } else {
          return '<span class="status-badge-secondary">Pending</span>';
        }
      },

      valueFormatter: (params) => {
        if (!params.value) return "";
        if (params.value === "PROCESSED") return "Processed";
        if (params.value === "PROCESSING") return "Processing";
        return "Pending";
      },

      getQuickFilterText: (params) => {
        const displayText =
          params.value === "PROCESSED"
            ? "Processed"
            : params.value === "PROCESSING"
            ? "Processing"
            : "Pending";
        return `${params.value} ${displayText}`;
      },

      filterParams: {
        textFormatter: (value) => {
          if (value === "PROCESSED") return "processed";
          if (value === "PROCESSING") return "processing";
          if (value === "NOT_STARTED") return "pending";
          return value?.toString().toLowerCase() || "";
        },
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 150,
      suppressSizeToFit: true,
      filter: false,
      cellRenderer: (params) => {
        if (!params.data) return "";

        const dataAttributes = `data-id="${params.data.id}" data-exam-id="${params.data.examId}"`;

        const forceProcessTitle = "Force Process";
        const viewVideoTitle = "View Video";

        return `
          <div class="d-flex gap-2 justify-content-center">
            <button 
              class="manage-btn force-process-btn" 
              ${dataAttributes}
              title="${forceProcessTitle}">
              <i class="bx bx-analyse me-1"></i>Process
            </button>
            <button 
              class="manage-btn view-video-btn" 
              ${dataAttributes}
              title="${viewVideoTitle}">
              <i class="bx bx-video me-1"></i>Video
            </button>
          </div>
        `;
      },
    },
  ];

  // Initialize grid options
  const gridOptions = {
    columnDefs: columnDefs,
    pagination: true,
    paginationPageSize: 20,
    domLayout: "normal",
    enableFilter: true,
    popupParent: document.getElementById("video-recordings-section"),
    animateRows: true,
    rowHeight: 60,
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      resizable: true,
      sortable: true,
      filter: true,
      suppressMovable: true,
    },
    onGridReady: (params) => {
      gridOptions.api = params.api;
      gridOptions.columnApi = params.columnApi;
    },
    overlayNoRowsTemplate:
      '<div class="text-center p-5 text-muted">No attenders found for this exam</div>',
    // Add cell edit handler
    onCellValueChanged: function (params) {
      if (
        params.column.colId === "anomalyCategory" &&
        params.oldValue !== params.newValue
      ) {
        updateAttenderAnomalyCategory(params.data.id, params.newValue);
      }
    },
  };

  // Check if there are any attenders to display
  if (!attenders || attenders.length === 0) {
    const gridDiv = document.querySelector("#attendersGrid");
    new agGrid.Grid(gridDiv, gridOptions);
    gridDiv.gridOptions = gridOptions;
    gridDiv.gridOptions.api.showNoRowsOverlay();
    return;
  }

  // Format attender data for AG Grid
  const rowData = attenders.map((attender) => {
    return {
      id: attender._id,
      examId: examId,
      email: attender.mail,
      examStatus: attender.status?.exam || "NOT_STARTED",
      anomalyStatus: attender.anomalyStatus || "NOT_STARTED",
    };
  });

  // Add row data to grid options
  gridOptions.rowData = rowData;

  // Create new grid
  const gridDiv = document.querySelector("#attendersGrid");
  new agGrid.Grid(gridDiv, gridOptions);

  gridDiv.gridOptions = gridOptions;

  // Initialize variables to store action details for use after password confirmation

  // Add event listeners for the buttons
  gridDiv.addEventListener("click", function (event) {
    const target = event.target;

    // Prevent multiple calls by checking if already processing
    if (target.classList.contains("processing")) {
      return;
    }

    if (
      target.classList.contains("view-video-btn") ||
      target.classList.contains("force-process-btn")
    ) {
      actionAttenderId = target.getAttribute("data-id");
      actionExamId = target.getAttribute("data-exam-id");
      if (target.classList.contains("view-video-btn")) {
        actionType = "view-video";

        target.classList.add("processing");
      } else {
        actionType = "force-process";
      }

      $("#password-confirmation-popup").addClass("visible");
      $("#confirmation-password").val("").focus();
      $("#password-error").addClass("d-none");
    }
  });
};

// Update the force process function to navigate to anamoly_process page
const forceProcessAnomaly = (attenderId, examId) => {
  window.location.href = `/anamoly_process/?attenderId=${attenderId}`;
};

// Helper functions for showing status messages
const showModalMessage = (message) => {
  // Check if modal exists, if not create it
  let modal = document.getElementById("status-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "status-modal";
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    modal.style.padding = "15px 25px";
    modal.style.borderRadius = "5px";
    modal.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
    modal.style.zIndex = "9999";
    document.body.appendChild(modal);
  }

  modal.textContent = message;
  modal.style.display = "block";
};

const hideModalMessage = () => {
  const modal = document.getElementById("status-modal");
  if (modal) {
    modal.style.display = "none";
  }
};

// Filter function for video clients
const filterVideoClients = () => {
  const searchInput = $("#video-client-search").val().toLowerCase();

  // Get a reference to the grid API
  const gridDiv = document.querySelector("#clientsGrid");
  if (!gridDiv || !gridDiv.gridOptions || !gridDiv.gridOptions.api) {
    return; // Grid not initialized yet
  }

  const gridApi = gridDiv.gridOptions.api;

  if (searchInput === "") {
    // If search is empty, clear filter
    gridApi.setQuickFilter("");
  } else {
    // Apply filter
    gridApi.setQuickFilter(searchInput);
  }
};

//call post apis
const createClient = () => {
  const name = $("#create-client-name").val();
  const code = $("#create-client-code").val();
  apiCall({
    url: `${ACCOUNT_END_POINT}`,
    type: "POST",
    data: { name, code },
    callback: getClients(true),
  });
};

const createUser = (data) => {
  apiCall({
    url: `${base_url}/user`,
    type: "POST",
    data,
    callback: getUsers,
  });
};

const createLabel = (languageId, data) => {
  apiCall({
    url: `${ACCOUNT_END_POINT}/label?accountId=${selectedClientId}&languageId=${languageId}`,
    type: "POST",
    data,
    callback: getClients(false, addLabelManage()),
  });
};

//call delete apis
const deleteClient = (_id) => {
  apiCall({
    url: `${ACCOUNT_END_POINT}?accountId=${_id}`,
    type: "delete",
    callback: getClients(false),
  });
};

const deleteLanguage = (_id, languageId) => {
  apiCall({
    url: `${ACCOUNT_END_POINT}/language?accountId=${_id}&languageId=${languageId}`,
    type: "delete",
    callback: () => {
      getClients(false, addLabelManage());
      // Re-evaluate single language width after deletion
      setTimeout(() => {
        const cardsContainer = $("#labelsArray").find(
          ".language-cards-container"
        );
        const languageAccordions = cardsContainer.find(".language-accordion");
        if (languageAccordions.length === 1) {
          cardsContainer.addClass("single-language");
        } else {
          cardsContainer.removeClass("single-language");
        }
      }, 100);
    },
  });
};

const deleteUser = (_id) => {
  apiCall({
    url: `${base_url}/user?userId=${_id}`,
    type: "delete",
    callback:getUsers,
  });
};

//call put apis
const updateClient = (_id, data) => {
  apiCall({
    url: `${ACCOUNT_END_POINT}?accountId=${_id}`,
    type: "put",
    data,
    callback: () => {
      if (
        data?.hasOwnProperty("enableInsight") ||
        data?.hasOwnProperty("enableGroupCreation")
      ) {
        localStorage.setItem("enableInsight", data.enableInsight);
        localStorage.setItem("enableGroupCreation", data.enableGroupCreation);
      }
      getClients(false);
    },
  });
};

const updateUser = (_id, data) => {
  apiCall({
    url: `${base_url}/user?userId=${_id}`,
    type: "put",
    data,
    // callback: getClients(false),
  });
};

const updateEmailConfiguration = (_id, data) => {
  apiCall({
    url: `${ACCOUNT_END_POINT}?accountId=${_id}`,
    type: "put",
    data,
  });
};

const sendEmail = (_id, email) => {
  apiCall({
    url: `${ACCOUNT_END_POINT}/email?accountId=${_id}&email=${email}`,
    type: "post",
    callback: () => {
      openAddClient("#test-email-popup");
      const $message = $("#api-success");
      $message
        .find(".error-message")
        .text("Email sent successfully. Please check your inbox.");
      $message.css({ ...commonStyles, backgroundColor: "#8BE68B" });
      setTimeout(() => {
        $message.css({
          ...commonStyles,
          backgroundColor: "#8BE68B",
          transform: "translateY(500px)",
        });
      }, 2000);
    },
  });
};

const updateLabelActive = (id, data) => {
  const { isActive } = data;
  const callback = () => {
    const $button1 = $(`#active-label-btn[data-id='${id}']`);
    const $button2 = $(`#d-active-label-btn[data-id='${id}']`);
    if (isActive) $button1.text("De-Activate").attr("id", "d-active-label-btn");
    else $button2.text("Activate").attr("id", "active-label-btn");
  };
  apiCall({
    url: `${ACCOUNT_END_POINT}/language?accountId=${selectedClientId}&languageId=${id}`,
    type: "put",
    data,
    callback,
  });
};

function uploadFileForQuestion(attender_id, attachmentFile, fileName) {
  showLoader(true);
  return new Promise((resolve, reject) => {
    const file = attachmentFile.file;
    if (!file) {
      return reject("No file selected");
    }
    const parts = fileName.split(".");
    const baseName = parts.slice(0, parts.length - 1).join(".") || parts[0];
    const extension = parts[parts.length - 1];
    const params = {
      app: CONFIG.APP,
      id: attender_id,
      fileName: baseName,
      fileType: extension,
      contentType: file.type,
      bucket: CONFIG.BUCKET,
      folderName: CONFIG.FOLDERNAME,
      cloudStorageProvider: CONFIG.CLOUD_SERVICE,
    };
    $.ajax({
      url: `${CONFIG.API.ENDPOINTS.CHUNK_UPLOAD}?${$.param(params)}`,
      type: "GET",
      success: function (response) {
        if (response && response.data && response.data.url) {
          const uploadUrl = response.data.url;
          $.ajax({
            url: uploadUrl,
            type: "PUT",
            data: file,
            contentType: file.type,
            processData: false,
            success: function () {
              showLoader(false);
              resolve({ url: uploadUrl });
            },
            error: function (err) {
              showLoader(false);
              reject("Error uploading file to signed URL: " + err.statusText);
            },
          });
        }
      },
      error: function (err) {
        reject("Error getting signed URL: " + err.statusText);
        showLoader(false);
      },
    });
  });
}

function updateUploadedFileWithSignedUrl(uploadResult) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `${CONFIG.API.ENDPOINTS.CHUNK_UPLOAD}/signed-urls`,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify({
        urls: [uploadResult.url],
        bucket: CONFIG.BUCKET,
        expiryTime: CONFIG.EXPIRY_TIME,
      }),
      success: function (response) {
        resolve(response.data.urls[0]);
      },
      error: function (err) {
        reject(err);
      },
    });
  });
}

const updateLanguage = (_id, data) => {
  apiCall({
    url: `${ACCOUNT_END_POINT}/language?accountId=${_id}`,
    type: "post",
    data,
    callback: getClients("", addLabelManage(true)),
  });
};

// Document Ready
$(document).ready(function () {
  if (adminType === "superAdmin") {
    $("#client-btn").show();
    $("#counting").show();
    $(".show-client-text").hide();
  } else {
    $("#client-btn").hide();
    $("#counting").hide();
    $(".show-client-text").hide();
  }
  $(".page").first().show();
  $(`#max-users`).keypress(function (e) {
    var charCode = e.which ? e.which : e.keyCode;
    if (String.fromCharCode(charCode).match(/[^0-9]/g)) return false;
  });
  $("#max-users").on("paste", function (event) {
    event.preventDefault();
    $("#max-users").val("");
  });
  $("#max-exams").on("paste", function (event) {
    event.preventDefault();
    $("#max-exams").val("");
  });
  $(`#max-exams`).keypress(function (e) {
    var charCode = e.which ? e.which : e.keyCode;
    if (String.fromCharCode(charCode).match(/[^0-9]/g)) return false;
  });
  $("#table-search").on("input", function () {
    filterTable();
  });
  $("#removeSearch").on("click", function () {
    $("#table-search").val("");
    filterTable();
  });
  $("#client-list").on("click", "#deleteClient", function () {
    const clientId = $(this).data("id");
    const clientCode = $(this).data("code");
    // deleteConfirmationCollege(clientId,clientCode)
    showDeletePopup({ id: clientId, name: clientCode, type: "college" });
  });
  $("#client-list").on("click", "#manage-btn", function () {
    const navigateId = $(this).data("id");
    const name = $(this).data("name");
    if (navigateId) handleNavigate(navigateId, name);
  });
  $("#create-language").on("click", "#add-new-language", function () {
    handleLabelNation();
  });
  $("#labelsArray").on("click", "#removeLabel", function () {
    const languageId = $(this).data("id");
    if (languageId) deleteLanguage(selectedClientId, languageId);
  });
  $("#labelsArray").on("click", "#save-labels", function () {
    const labelNumber = $(this).data("index");
    const id = $(this).data("id");
    if (labelNumber && id) handleInsideLabel(labelNumber, id);
  });
  $("#labelsArray").on("click", "#active-label-btn", function () {
    const id = $(this).data("id");
    if (id) updateLabelActive(id, { isActive: true });
  });
  $("#labelsArray").on("click", "#d-active-label-btn", function () {
    const id = $(this).data("id");
    if (id) updateLabelActive(id, { isActive: false });
  });
  $("#labelsArray").on("click", "#remove-label", function () {
    const index = $(this).data("index");
    if (index) {
      $(`#delete-label-${index}`).remove();
    } else {
      // For dynamically added labels without specific index
      $(this).closest(".label-item").remove();
    }
  });
  // Prevent editing of strong tags in the Trumbowyg editor
  $(".trumbowyg-editor").on("keydown", "strong", function (e) {
    e.preventDefault(); // Prevent any key actions
  });
  setTimeZones();
  $("#user-filter-input").on("click", function () {
    $("#time-zone").find("ul").show();
  });
  $("#time-zone").find("ul").hide();
  $(document).on("click", function (e) {
    if (!$(e.target).closest("#time-zone").length) {
      if ($("#time-zone").find("ul").is(":visible")) {
        $("#time-zone").find("ul").hide();
      }
    }
  });
  const content = $(`#registration-content-editor`).trumbowyg("html");
  $(`#registration-content-editor`).trumbowyg("empty");
  $(`#registration-content-editor`).trumbowyg("html", content);
});

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

//Close Popup when Clicking Outside
$(window).on("click", function (event) {
  const $popup = $("#add-client-popup");
  const $cropImage = $("#crop-image-popup");
  const $profileImage = $("#view-profile-photo");
  const $passwordPopup = $("#password-confirmation-popup");
  const $testEmailPopup = $("#test-email-popup");

  if ($(event.target).is($popup)) {
    return $popup.removeClass("visible");
  }
  if ($(event.target).is($cropImage)) {
    return $cropImage.removeClass("visible");
  }
  if ($(event.target).is($profileImage)) {
    return $profileImage.removeClass("visible");
  }
  if ($(event.target).is($passwordPopup)) {
    return $passwordPopup.removeClass("visible");
  }
  if ($(event.target).is($testEmailPopup)) {
    return $testEmailPopup.removeClass("visible");
  }
});

/*tabs*/
const tabsOptions = document.querySelectorAll(".tabs button");
const activeStatus = document.querySelector(".tabs .active");
const tabContents = document.querySelectorAll(".tab-content .tab-pane");

function initializeTabs() {
  const $tabs = $(".tabs");
  const $tabButtons = $tabs.find("button");
  const $tabPanes = $(".tab-pane");

  // Create and append the active indicator if it doesn't exist
  let $activeIndicator = $tabs.find(".active");
  if ($activeIndicator.length === 0) {
    $activeIndicator = $("<div>").addClass("active");
    $tabs.append($activeIndicator);
  }

  // Remove bootstrap attributes
  $tabButtons.removeAttr("data-bs-toggle data-bs-target aria-selected");

  function setActiveTab($button) {
    if (!$button || !$button.length) return;

    // Update button colors
    $tabButtons.css("color", "#898989");
    $button.css("color", "#1877f2");

    // Calculate the correct position and width for the indicator
    const buttonOffset = $button.position().left;
    const buttonWidth = $button.outerWidth();
    // Animate the indicator to its new position
    $activeIndicator.css({
      left: buttonOffset + "px",
      width: buttonWidth + "px",
      bottom: "0", // Ensure indicator stays at bottom
      position: "absolute", // Ensure absolute positioning
      height: "2px", // Set a specific height for the indicator
      backgroundColor: "#1877f2", // Set the indicator color
      transition: "all 0.3s ease", // Smooth transition
    });

    // Show corresponding content
    const targetId = $button.attr("id").replace("-tab", "");
    $tabPanes.hide();
    $(`#${targetId}`).show();
  }

  // Handle tab clicks
  $tabButtons.on("click", function (e) {
    e.preventDefault();
    setActiveTab($(this));
  });

  // Show first tab by default
  setActiveTab($tabButtons.first());
}

$(document).ready(function () {
  $("#digival-email-toggle").on("change", function () {
    const value = $(this).prop("checked");
    $("#host-name").prop("disabled", value);
    $("#port-number").prop("disabled", value);
    $("#username").prop("disabled", value);
    $("#password-email-configuration").prop("disabled", value);
    $("#from-email-configuration").prop("disabled", value);
  });
  var $image = $("#logo");
  // var $crop_image = $("#cropImage");
  // var cropper;
  // var fileName;
  // var files;

  $("#client-logo").on("change", async function (e) {
    // openAddClient("#crop-image-popup");
    var reader = new FileReader();
    reader.onload = function (event) {
      $image.attr("src", event.target.result);
    };
    reader.readAsDataURL(this.files[0]);
    // $crop_image.attr("src", event.target.result);
    // if (cropper) cropper.destroy();
    const uploadResult = await uploadFileForQuestion(
      selectedClientId,
      {
        file: e?.target?.files[0],
      },
      e?.target?.files[0]?.name
    );
    const parts = e?.target?.files[0]?.name.split(".");
    const baseName = parts.slice(0, parts.length - 1).join(".") || parts[0];
    const extension = parts[parts.length - 1];
    if (uploadResult) {
      $image.data("fileInfo", { fileName: baseName, extension: extension });
    }
    // cropper = new Cropper($crop_image[0], {
    //   aspectRatio: 16 / 9,
    //   viewMode: 1,
    // });
  });
  // reader.readAsDataURL(this.files[0]);
  // });
  // $("#getCroppedImage").on("click", async function () {
  // var canvas = cropper.getCroppedCanvas();
  // var croppedImage = canvas.toDataURL("image/png");

  // function base64ToBlob(base64Data, mimeType) {
  //   var byteString = atob(base64Data.split(",")[1]);
  //   var arrayBuffer = new ArrayBuffer(byteString.length);
  //   var uintArray = new Uint8Array(arrayBuffer);
  //   for (var i = 0; i < byteString.length; i++) {
  //     uintArray[i] = byteString.charCodeAt(i);
  //   }
  //   return new Blob([uintArray], { type: mimeType });
  // }
  // var blob = base64ToBlob(croppedImage, "image/png");
  // $image.attr("src", files);
  // const uploadResult = await uploadFileForQuestion(
  //   selectedClientId,
  //   {
  //     file: files,
  //   },
  //   fileName
  // );
  // const url = await updateUploadedFileWithSignedUrl(uploadResult);
  // const parts = fileName.split(".");
  // const baseName = parts.slice(0, parts.length - 1).join(".") || parts[0];
  // const extension = parts[parts.length - 1];
  // if (uploadResult) {
  //   $image.data("fileInfo", { fileName: baseName, extension: extension });
  // }
  // openAddClient("#crop-image-popup");
});
// });

function apiCall({
  url = "",
  data = "",
  type = "",
  callback = () => {},
  errCallback = () => {},
  successMessage = `  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ffffff" viewBox="0 4 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                      </svg>
                      <span>Saved successfully</span>`, // optional success toast
}) {
  return makeApiCall({
    url,
    method: type,
    ...(data && { data: JSON.stringify(data) }),
    successCallback: (response) => {
      if (successMessage && type === "put") {
        showErrorMessage(successMessage, "#22c55e");
      }
      callback(response);
    },
    errorCallback: errCallback,
    disableLoading: false,
    retryCount: 0,
    isApiKey: false,
  });
}

//basic details data
const handleBasic = () => {
  let signedUrl = $("#logo").data("fileInfo");
  let emailList = [];
  let users = [];
  let name = $("#client-name").val();
  let code = $("#client-code").val();
  let primary = $("#client-theme-primary").val();
  let secondary = $("#client-theme-secondary").val();
  let hasEmptyField = false;
  const accountAdmin = localStorage.getItem("accountAdmin");
  const canManageAccountAdmin =
    adminType === "superAdmin" || accountAdmin === "true";
  if (!name || !code)
    return showErrorMessage(
      !name ? "Please provide Client name" : "Please provide Client code"
    );

  $("#admin-emails .d-flex").each(function (index) {
    let email = $(this).find("#admin-mail").val();
    let id = $(this).find("#admin-mail").data("id");
    let password = $(this).find("#admin-code").val();
    let isAdmin = $(this).find(`#${index}isAdmin`).prop("checked");

    if (email.trim() === "" || password.trim() === "") {
      hasEmptyField = true;
      // Replace with your toast function
      showErrorMessage("Please provide both email and password");
      return false; // Breaks out of .each loop
    }
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailPattern.test(email.trim())) {
      showErrorMessage("Please enter a valid email address");
      hasEmptyField = true;
      return false;
    }

    // 🔁 Check for duplicate email
    if (emailList.includes(email)) {
      hasEmptyField = true;
      duplicateEmailFound = true;
      showErrorMessage("Duplicate email found");
      return false;
    }
    emailList.push(email);

    let isAccountAdmin = false;
    if (canManageAccountAdmin) {
      isAccountAdmin = $(this).find(`#${index}isAccountAdmin`).prop("checked");
    }

    if (!adminUsers?.some((item) => item?.email === email)) {
      const userData = { email, password, isAdmin };
      if (canManageAccountAdmin) {
        userData.isAccountAdmin = isAccountAdmin;
      }
      users.push(userData);
    } else if (
      adminUsers?.some(
        (item) =>
          item?._id === id &&
          (email !== item?.email ||
            password !== item?.password ||
            isAdmin !== item?.isAdmin ||
            (canManageAccountAdmin && isAccountAdmin !== item?.isAccountAdmin))
      )
    ) {
      const updateData = { email, password, isAdmin };
      if (canManageAccountAdmin) {
        updateData.isAccountAdmin = isAccountAdmin;
      }
      updateUser(id, updateData);
    }
  });
  if (hasEmptyField) return;
  const data = {
    name,
    code,
    fileName: signedUrl?.fileName,
    fileType: signedUrl?.extension,
    colors: { primary, secondary },
  };
  updateClient(selectedClientId, data);
  if (users.length) createUser({ users, accountId: selectedClientId });
};

const handleFeatures = () => {
  let enableAnomalyDetection = $("#anomaly-detection").prop("checked");
  let enableGroupCreation = $("#grouping-creation").prop("checked");
  let enableInsight = $("#insight-creation").prop("checked");
  let enableHEBAItemCreation = $("#heba-creation").prop("checked");
  let enableCertificateCreation = $("#certificate-creation").prop("checked");
  let maxUsers = $("#max-users").val();
  let totalExams = $("#max-exams").val();

  let canSendReminder = $("#send-email-reminder").prop("checked");
  let canSendEmail = $("#send-email-all").prop("checked");
  let canSendExamReminder = $("#send-email-exam-reminder").prop("checked");
  let canSendRegistrationReminder = $("#send-email-registration-reminder").prop(
    "checked"
  );
  let emailReminder = $("#email-hours").val();

  // Validate email type selection before saving
  if (canSendEmail && !canSendExamReminder && !canSendRegistrationReminder) {
    showErrorMessage("Please select at least one email type (Exam Email or Registration Email)");
    return;
  }

  const data = {
    enableAnomalyDetection,
    enableHEBAItemCreation,
    enableGroupCreation,
    enableInsight,
    enableCertificateCreation,
    maxUsers,
    totalExams,
    emailReminder,
    canSendReminder,
    canSendExamReminder,
    canSendEmail,
    canSendRegistrationReminder,
  };
  updateClient(selectedClientId, data);
};

const handleSettings = () => {
  let examStart = $("input[name='start']:checked").val();
  let allowStudentsWithoutRegistration = $("#exam-taker").prop("checked");
  let canReduceLateEntryTime = $("#late-start").prop("checked");
  let timeZone = $("#user-filter-input").data("identifier");
  let enableScAndNq = $("#scandnq").prop("checked");
  let enableDetailedReport = $("#detailed-report").prop("checked");
  let enableReportPublish = $("#report-publish").prop("checked");
  let enableUploadDocuments = $("#upload-documents-registration").prop(
    "checked"
  );
  let enableCaptureImage = $("#capture-image").prop("checked");
  let enableUploadImage = $("#upload-image").prop("checked");

  const enableItemTypes = [
    $("#MCQ-checkbox").prop("checked") && "MCQ",
    $("#SAQ-checkbox").prop("checked") && "SAQ",
    $("#FTB-checkbox").prop("checked") && "FTB",
    $("#IR-checkbox").prop("checked") && "IR",
    $("#UD-checkbox").prop("checked") && "UD",
    $("#PRQ-checkbox").prop("checked") && "PRQ",
    $("#OR-checkbox").prop("checked") && "OR",
    $("#TF-checkbox").prop("checked") && "TF",
    $("#MTF-checkbox").prop("checked") && "MTF",
    $("#TAB-checkbox").prop("checked") && "TAB",
  ].filter(Boolean);

  // Validate that at least one item type is checked
  if (enableItemTypes.length === 0) {
    const $message = $("#api-success");
    $message
      .find(".error-message")
      .text("Please select at least one item type.");
    $message.css(commonStyles);
    setTimeout(() => {
      $message.css({ ...commonStyles, transform: "translateY(500px)" });
    }, 2000);
    return;
  }

  // let sebConfigFile = $("#sebConfigFile");
  // let sebFile = $("#sebFile");
  function checkExamStart(value) {
    return examStart === value ? true : false;
  }
  const data = {
    canAutoStartExam: checkExamStart("autoStart"),
    canAutoStopExam: checkExamStart("autoStart"),
    allowStudentsWithoutRegistration,
    canReduceLateEntryTime,
    timeZone,
    enableScAndNq,
    enableDetailedReport,
    enableReportPublish,
    enableUploadDocuments,
    enableCaptureImage,
    enableUploadImage,
    enableItemTypes,
  };
  updateClient(selectedClientId, data);
};
const handleLabelNation = () => {
  const codeInput = $("#create-language-code");
  const layoutInput = $("#create-layout-code");

  const code = codeInput.val()?.trim();
  const name = $("#create-language-name").val();
  const layout = layoutInput.val()?.trim().toUpperCase();

  const codeInfoSpan = $("#create-language-code-info");
  const layoutInfoSpan = $("#create-layout-code-info");

  const validLayouts = ["LTR", "RTL", "TTB", "BTT"];

  // Clear previous errors
  $(".input-error-message").text("");
  $(".basic-input").removeClass("input-error");

  // Validate layout
  if (!validLayouts.includes(layout)) {
    layoutInfoSpan.text("Invalid layout. Use: LTR, RTL, TTB, or BTT.");
    layoutInput.addClass("input-error");
    return;
  }

  const data = { name, code, layout, isActive: true };
  updateLanguage(selectedClientId, data);
};

const handleInsideLabel = (labelIndex, languageId) => {
  let labels = [];
  $(`#label-${labelIndex} .label-item`).each(function () {
    let k = $(this).find("#label").val();
    let v = $(this).find("#value").val();
    if (k && v) {
      // Only add labels that have both key and value
      labels.push({ k, v });
    }
  });
  createLabel(languageId, { labels });
};
setTimeout(() => {
        // Read navigation state from window.name
        let pendingTask = null;
        try {
            if (window.name) {
                pendingTask = JSON.parse(window.name);
                // Clear window.name after reading
                window.name = "";
            }
        } catch (e) {
        }
        // Trigger the appropriate submenu based on the navigation state
        if (pendingTask && pendingTask.navigate) {
            if (pendingTask.navigate === "dashboard") {
                handleMenusubmenu(1,"subMenu");
            } else if (pendingTask.navigate === "video-management") {
                handleMenusubmenu(2,"subMenu");
            } else if (pendingTask.navigate === "credit-dashboard") {
                handleMenusubmenu(3,"subMenu");
            } else if (pendingTask.navigate === "course-grade-certificate") {
                handleMenusubmenu(4,"subMenu");
            }
        }
}, 200);

const handleEmailConfiguration = () => {
  const host = $("#host-name").val();
  const port = $("#port-number").val();
  const username = $("#username").val();
  const password = $("#password-email-configuration").val();
  const from = $("#from-email-configuration").val();
  const isDigivalEmail = $("#digival-email-toggle").prop("checked");
  const data = { host, port, username, password, from, isDigivalEmail };
  if (formValidation()) updateEmailConfiguration(selectedClientId, data);
};

const sendTestEmail = () => {
  const email = $("#test-email").val();
  if (!email)
    $(".test-email-error")
      .text("Please Enter Email")
      .css({ fontSize: "13px", marginTop: "5px", color: "red" });
  else if (!email_regex.test(email)) {
    $(".test-email-error")
      .text("Invalid Email")
      .css({ fontSize: "13px", marginTop: "5px", color: "red" });
  } else sendEmail(selectedClientId, email);
};

// Add these functions for email content API calls
const getEmailContent = () => {
  apiCall({
    url: `${ACCOUNT_END_POINT}/content`,
    type: "GET",
    callback: (data) => {
      // Use the variables from variable.js as fallbacks
      const registrationContent =
        data?.registrationContent || registrationEmailContent;
      const invitationContent =
        data?.invitationContent || invitationEmailContent;
      const reportContent = data?.reportContent || reportEmailContent;
      const regSubject = data?.registrationSubject || registrationSubject;
      const invSubject = data?.invitationSubject || invitationSubject;
      const repSubject = data?.reportSubject || reportSubject;

      // Update editor content
      $("#registration-content-editor").trumbowyg("html", registrationContent);
      $("#invitation-content-editor").trumbowyg("html", invitationContent);
      $("#report-content-editor").trumbowyg("html", reportContent);

      // Update subject fields
      $("#registration-subject").val(regSubject);
      $("#invitation-subject").val(invSubject);
      $("#report-subject").val(repSubject);
    },
    callSuccessMessage: false,
  });
};

const updateEmailContent = () => {
  const activeTabData = $(".email-tab.active").data("target");
  const registrationContent = $("#registration-content-editor").trumbowyg(
    "html"
  );
  const invitationContent = $("#invitation-content-editor").trumbowyg("html");
  const reportContent = $("#report-content-editor").trumbowyg("html");
  const registrationSubject = $("#registration-subject").val();
  const invitationSubject = $("#invitation-subject").val();
  const reportSubject = $("#report-subject").val();
  if (activeTabData === "#registration-content") {
    if (!registrationSubject || registrationSubject.trim() === "") {
      showErrorMessage("Email subject is required for registration.");
      return;
    }
    if (!registrationContent || registrationContent.trim() === "") {
      showErrorMessage("Email content cannot be empty for registration.");
      return;
    }
  } else if (activeTabData === "#invitation-content") {
    if (!invitationSubject || invitationSubject.trim() === "") {
      showErrorMessage("Email subject is required for invitation.");
      return;
    }
    if (!invitationContent || invitationContent.trim() === "") {
      showErrorMessage("Email content cannot be empty for invitation.");
      return;
    }
  } else if (activeTabData === "#report-content") {
    if (!reportSubject || reportSubject.trim() === "") {
      showErrorMessage("Email subject is required for report.");
      return;
    }
    if (!reportContent || reportContent.trim() === "") {
      showErrorMessage("Email content cannot be empty for report.");
      return;
    }
  }

  apiCall({
    url: `${ACCOUNT_END_POINT}/content`,
    type: "PUT",
    data: {
      registrationContent,
      invitationContent,
      reportContent,
      registrationSubject,
      invitationSubject,
      reportSubject,
    },
    callback: () => {},
  });
};

// Update the addEmailContentManage function
const addEmailContentManage = () => {
  const initializeEditors = () => {
    // First destroy any existing editors
    $(
      "#registration-content-editor, #invitation-content-editor, #report-content-editor"
    ).each(function () {
      if ($(this).data("trumbowyg")) {
        $(this).trumbowyg("destroy");
      }
    });

    const editorOptions = {
      btns: [
        ["viewHTML"],
        ["formatting"],
        ["link"],
        ["justifyLeft", "justifyCenter", "justifyRight"],
        ["unorderedList", "orderedList"],
        ["fullscreen"],
      ],
      removeformatPasted: true,
      autogrow: true,
      minHeight: 250,
      pastePlain: true,
      tagsToRemove: ["script", "link", "iframe"],
      initializationCallback: function (editor) {
        editor.find("strong").attr("contenteditable", "false");
      },
    };

    // Initialize each editor separately
    $("#registration-content-editor").trumbowyg(editorOptions);
    $("#invitation-content-editor").trumbowyg(editorOptions);
    $("#report-content-editor").trumbowyg(editorOptions);

    // Set initial content
    $("#registration-content-editor").trumbowyg(
      "html",
      registrationEmailContent
    );
    $("#invitation-content-editor").trumbowyg("html", invitationEmailContent);
    $("#report-content-editor").trumbowyg("html", reportEmailContent);

    // Set initial subject values
    $("#registration-subject").val(registrationSubject);
    $("#invitation-subject").val(invitationSubject);
    $("#report-subject").val(reportSubject);

    // Make sure editors are visible
    $(".trumbowyg-editor").css("display", "block");
  };

  // Handle tab switching
  $(".email-tab")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      const target = $(this).data("target");

      // Update active states
      $(".email-tab").removeClass("active");
      $(this).addClass("active");

      // Hide all content first
      $(".email-content").hide();

      // Show selected content and ensure editor is visible
      const $targetContent = $(target);
      $targetContent.show();
      $targetContent.find(".trumbowyg-editor").css("display", "block");

      // Refresh the editor to ensure proper rendering
      const editorId = $targetContent
        .find("[id$='-content-editor']")
        .attr("id");
      if (editorId) {
        const content = $(`#${editorId}`).trumbowyg("html");
        $(`#${editorId}`).trumbowyg("empty");
        $(`#${editorId}`).trumbowyg("html", content);
      }
    });

  // Add reset format handler
  $("#reset-format")
    .off("click")
    .on("click", function () {
      const activeTab = $(".email-tab.active").data("target");

      switch (activeTab) {
        case "#registration-content":
          $("#registration-content-editor").trumbowyg(
            "html",
            registrationEmailContent
          );
          $("#registration-subject").val(registrationSubject);
          break;
        case "#invitation-content":
          $("#invitation-content-editor").trumbowyg(
            "html",
            invitationEmailContent
          );
          $("#invitation-subject").val(invitationSubject);
          break;
        case "#report-content":
          $("#report-content-editor").trumbowyg("html", reportEmailContent);
          $("#report-subject").val(reportSubject);
          break;
      }
    });

  // Update save handler
  $("#save-email").off("click").on("click", updateEmailContent);

  // Initialize editors
  initializeEditors();

  // Show registration tab by default and hide others
  $(".email-content").hide();
  $("#registration-content")
    .show()
    .find(".trumbowyg-editor")
    .css("display", "block");
  $('.email-tab[data-target="#registration-content"]').addClass("active");
};

const getAttenderRecordings = async (attenderId, examId) => {
  const $loader = $("#loaders");
  $loader.show();

  if (!getAttenderRecordings.cache) {
    getAttenderRecordings.cache = {};
  }

  try {
    let signedUrl;

    if (getAttenderRecordings.cache[attenderId]) {
      console.log("Using cached signed URL");
      signedUrl = getAttenderRecordings.cache[attenderId];
    } else {
      console.log("Fetching signed URL for attenderId:", attenderId);
      signedUrl = await fetchSignedUrl(attenderId);

      if (signedUrl) {
        getAttenderRecordings.cache[attenderId] = signedUrl;
      }
    }

    if (signedUrl) {
      showVideoPopup(signedUrl);
    } else {
      showErrorMessage("No video URL available for this recording");
    }
  } catch (error) {
    console.error("Error fetching video:", error);
    showErrorMessage("Error loading video: " + error.message);
  } finally {
    $loader.hide();
  }
};

const showVideoPopup = (videoUrl) => {
  // Remove any existing video popup
  $("#video-popup-container").remove();

  // Create popup container
  const popupContainer = document.createElement("div");
  popupContainer.id = "video-popup-container";
  popupContainer.style.position = "fixed";
  popupContainer.style.top = "0";
  popupContainer.style.left = "0";
  popupContainer.style.width = "100%";
  popupContainer.style.height = "100%";
  popupContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  popupContainer.style.display = "flex";
  popupContainer.style.justifyContent = "center";
  popupContainer.style.alignItems = "center";
  popupContainer.style.zIndex = "10000";

  // Create popup content
  const popupContent = document.createElement("div");
  popupContent.style.position = "relative";
  popupContent.style.width = "80%";
  popupContent.style.maxWidth = "1200px";
  popupContent.style.backgroundColor = "#000";
  popupContent.style.borderRadius = "8px";
  popupContent.style.overflow = "hidden";
  popupContent.style.boxShadow = "0 0 20px rgba(0, 0, 0, 0.5)";

  // Create close button
  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.style.position = "absolute";
  closeButton.style.top = "10px";
  closeButton.style.right = "10px";
  closeButton.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  closeButton.style.color = "#fff";
  closeButton.style.border = "none";
  closeButton.style.borderRadius = "50%";
  closeButton.style.width = "30px";
  closeButton.style.height = "30px";
  closeButton.style.fontSize = "20px";
  closeButton.style.cursor = "pointer";
  closeButton.style.zIndex = "10001";
  closeButton.onclick = () => {
    $("#video-popup-container").remove();
  };

  // Create video element
  const video = document.createElement("video");
  video.controls = true;
  video.autoplay = true;
  video.style.width = "100%";
  video.style.maxHeight = "80vh";
  video.style.backgroundColor = "#000";

  // Create source element
  const source = document.createElement("source");
  source.src = videoUrl;
  source.type = "video/mp4";

  // Add error handling
  video.onerror = () => {
    showErrorMessage(
      "Error loading video. The video may be unavailable or in an unsupported format."
    );
    $("#video-popup-container").remove();
  };

  // Assemble the elements
  video.appendChild(source);
  popupContent.appendChild(video);
  popupContent.appendChild(closeButton);
  popupContainer.appendChild(popupContent);
  document.body.appendChild(popupContainer);

  // Close popup when clicking outside the video
  popupContainer.addEventListener("click", (event) => {
    if (event.target === popupContainer) {
      $("#video-popup-container").remove();
    }
  });

  // Add keyboard support (ESC to close)
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      $("#video-popup-container").remove();
    }
  });
};

// Helper function to show error messages
const showErrorMessage = (message, bgColor) => {
  // Check if the error message element exists, create it if not
  let errorMessage = document.getElementById("error-message");
  if (!errorMessage) {
    errorMessage = document.createElement("div");
    errorMessage.id = "error-message";
    errorMessage.style.position = "fixed";
    errorMessage.style.bottom = "20px";
    errorMessage.style.left = "50%";
    errorMessage.style.transform = "translateX(-50%)";
    errorMessage.style.color = "white";
    errorMessage.style.padding = "10px 20px";
    errorMessage.style.borderRadius = "4px";
    errorMessage.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
    errorMessage.style.zIndex = "9999";
    errorMessage.style.opacity = "0";
    errorMessage.style.transition = "opacity 0.3s ease";
    document.body.appendChild(errorMessage);
  }
  errorMessage.style.backgroundColor = bgColor || "#ea8181";

  // Show the error message
  errorMessage.innerHTML = message;
  errorMessage.style.opacity = "1";

  // Hide the error message after 3 seconds
  setTimeout(() => {
    errorMessage.style.opacity = "0";
  }, 3000);
};

// Add this right after the displayAttenders function definition to ensure cursor-pointer works
$(document).ready(function () {
  // Add a global style for cursor-pointer class if it's not already defined
  if (!document.getElementById("cursor-pointer-style")) {
    const style = document.createElement("style");
    style.id = "cursor-pointer-style";
    style.innerHTML = `
      .cursor-pointer {
        cursor: pointer !important;
      }
      .action-icon {
        cursor: pointer !important;
        transition: transform 0.3s ease, color 0.3s ease !important;
      }
      .action-icon:hover {
        transform: scale(1.2) !important;
      }
    `;
    document.head.appendChild(style);
  }
});

async function fetchSignedUrl(attenderId) {
  // Prevent duplicate calls
  if (fetchSignedUrl.inProgress && fetchSignedUrl.inProgress[attenderId]) {
    console.log("Fetch already in progress for this attenderId");
    return fetchSignedUrl.inProgress[attenderId];
  }

  // Initialize the in-progress tracking object if needed
  if (!fetchSignedUrl.inProgress) {
    fetchSignedUrl.inProgress = {};
  }

  // Create a promise for this request and store it
  fetchSignedUrl.inProgress[attenderId] = new Promise(
    async (resolve, reject) => {
      const url = `${EXAM_ATTENDER_END_POINT}/signed-url?attenderId=${attenderId}`;
      try {
        console.log("Making API call to fetch signed URL");
        const response = await fetch(url, {
          method: "GET",
          headers: apiHeaders,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const signedUrlData = await response.json();
        resolve(signedUrlData?.data?.signedUrl);
      } catch (error) {
        console.error("Error fetching signed url:", error);
        reject(error);
      } finally {
        // Clear the in-progress status when done
        delete fetchSignedUrl.inProgress[attenderId];
      }
    }
  );

  return fetchSignedUrl.inProgress[attenderId];
}

function formValidation() {
  if ($("#digival-email-toggle").prop("checked")) return true;
  let isVerified = true;
  const data_types = [undefined, null, "", false];
  const host = $("#host-name").val();
  const port = $("#port-number").val();
  const username = $("#username").val();
  const password = $("#password-email-configuration").val();
  const from = $("#from-email-configuration").val();
  const data = [
    { value: host, key: ".host-name-error", message: "Host Name Is Required" },
    {
      value: port,
      key: ".port-number-error",
      message: "Port Number Is Required",
    },
    {
      value: username,
      key: ".username-error",
      message: "UserName Is Required",
    },
    {
      value: password,
      key: ".password-error",
      message: "Password Is Required",
    },
    {
      value: from,
      type: "email",
      key: ".form-email-error",
      message: "From Name Is Required",
    },
  ];
  data.forEach((value) => {
    if (data_types.includes(value.value)) {
      $(value.key)
        .text(value.message)
        .css({ fontSize: "13px", marginTop: "5px", color: "red" });
      isVerified = false;
    } else $(value.key).text("");

    if (value?.type === "email" && value.value) {
      if (!email_regex.test(value.value)) {
        $(value.key)
          .text("Invalid Email")
          .css({ fontSize: "13px", marginTop: "5px", color: "red" });
        isVerified = false;
      }
    }
  });
  return isVerified;
}

// AI Question Generator toggle password handling
$(document).on("change", "#ai-question-generator", function () {
  // Save the current and desired states
  currentAiGeneratorState = !$(this).prop("checked");
  aiGeneratorDesiredState = $(this).prop("checked");

  // Revert the checkbox state until password verification
  $(this).prop("checked", currentAiGeneratorState);

  // Set modal title and message
  $("#ai-modal-title").text(
    aiGeneratorDesiredState
      ? "Enable AI Question Generator"
      : "Disable AI Question Generator"
  );
  $("#ai-modal-message").text(
    "Please enter your password to confirm this action:"
  );

  // Clear previous errors and input
  $("#ai-password").val("");
  $("#ai-password-error").addClass("d-none");

  // Show password popup
  $("#ai-password-popup").addClass("visible");

  // Focus the password field for improved UX
  setTimeout(() => {
    $("#ai-password").focus();
  }, 100);
});

// Handle AI Password confirmation button click
$(document).on("click", "#ai-confirm-button", function (e) {
  e.preventDefault();
  validateAiPassword();
});

// Handle pressing Enter in the password field
$(document).on("keypress", "#ai-password", function (e) {
  if (e.which === 13) {
    e.preventDefault(); // Prevent form submission if inside a form
    validateAiPassword();
  }
});

// Handle cancel button
$(document).on("click", "#ai-cancel-button", function (e) {
  e.preventDefault();

  // Close the popup
  closeAiPasswordPopup();
});

// Close when clicking outside the popup
$(document).on("click", "#ai-password-popup", function (event) {
  if ($(event.target).is($("#ai-password-popup"))) {
    closeAiPasswordPopup();
  }
});

// Function to validate password for AI Question Generator
function validateAiPassword() {
  const password = $("#ai-password").val();
  const adminEmail = localStorage.getItem("mail");

  if (!adminEmail) {
    $("#ai-password-error")
      .removeClass("d-none")
      .text("Admin email not found. Please try logging in again.");
    return;
  }

  if (!password || password.length === 0) {
    $("#ai-password-error")
      .removeClass("d-none")
      .text("Please enter your password.");
    return;
  }

  // Show loading indicator during verification
  $("#ai-confirm-button").prop("disabled", true).text("Verifying...");

  // Use the verifyPassword function directly from common.js
  verifyPasswordChecking(password)
    .then((isValid) => {
      if (isValid) {
        // Password is valid - apply the desired state to the checkbox
        $("#ai-question-generator").prop("checked", aiGeneratorDesiredState);

        // Save the setting to the server if Save button is not going to be used
        const saveButtonVisible = $("#settings-btn").is(":visible");
        const name = $("#client-name").val();
        const code = $("#client-code").val();
        if (!saveButtonVisible) {
          // Save the setting automatically
          const data = {
            enableAIQuestionGenerator: aiGeneratorDesiredState,
            name: name,
            code: code,
          };
          updateClient(selectedClientId, data);
        }

        aiGeneratorDesiredState = false;
        currentAiGeneratorState = false;

        // Close the popup
        closeAiPasswordPopup();
      } else {
        // Password is invalid - show error message
        $("#ai-password-error")
          .removeClass("d-none")
          .text("Invalid password. Please try again.");

        // Clear the password field and restore button
        $("#ai-password").val("").focus();
        $("#ai-confirm-button").prop("disabled", false).text("Confirm");

        // Hide error message after 3 seconds
        setTimeout(() => {
          $("#ai-password-error").addClass("d-none");
        }, 3000);
      }
    })
    .catch((error) => {
      console.error("Password verification error:", error);

      // Show error message
      $("#ai-password-error")
        .removeClass("d-none")
        .text("Authentication error. Please try again.");

      // Restore button state
      $("#ai-confirm-button").prop("disabled", false).text("Confirm");

      // Clear password field
      $("#ai-password").val("");

      // Hide error after 3 seconds
      setTimeout(() => {
        $("#ai-password-error").addClass("d-none");
      }, 3000);
    });
}

// Function to close the AI password popup
function closeAiPasswordPopup() {
  $("#ai-password-popup").removeClass("visible");
  $("#ai-password").val("");
  $("#ai-password-error").addClass("d-none");
  $("#ai-confirm-button").prop("disabled", false).text("Confirm");
}

// Handle form submission via the submit button or pressing Enter
$(document).on("submit", "#ai-password-form", function (e) {
  e.preventDefault();
  validateAiPassword();
});

function forceProcessAllAttenders(examId) {
  const url = `/anamoly_process/?examId=${examId}`;
  window.open(url, "_blank");
}

$("#confirm-password-button").on("click", function () {
  validatePasswordAndPerformAction();
});

$("#confirmation-password").on("keypress", function (e) {
  if (e.which === 13) {
    validatePasswordAndPerformAction();
  }
});

$("#cancel-password-confirmation").on("click", function () {
  closePasswordPopup();
});

$("#password-confirmation-popup").on("click", function (event) {
  if ($(event.target).is($("#password-confirmation-popup"))) {
    closePasswordPopup();
  }
});

function validatePasswordAndPerformAction() {
  const password = $("#confirmation-password").val();

  const adminEmail = localStorage.getItem("mail");

  if (!adminEmail) {
    $("#password-error")
      .removeClass("d-none")
      .text("Admin email not found. Please try logging in again.");
    return;
  }

  if (!password || password.length === 0) {
    $("#password-error")
      .removeClass("d-none")
      .text("Please enter your password.");
    return;
  }

  $("#confirm-password-button").prop("disabled", true).text("Verifying...");

  makeApiCall({
    url: `${USER_END_POINT}/login`,
    method: "POST",
    data: JSON.stringify({
      email: adminEmail,
      password: password,
      accountId: localStorage.getItem("accountId"),
    }),
    successCallback: function (response) {
      closePasswordPopup();

      $("#confirm-password-button").prop("disabled", false).text("Confirm");

      if (actionType === "view-video") {
        getAttenderRecordings(actionAttenderId, actionExamId).finally(() => {
          const buttons = document.querySelectorAll(".view-video-btn");
          buttons.forEach((btn) => {
            if (btn.getAttribute("data-id") === actionAttenderId) {
              btn.classList.remove("processing");
            }
          });
        });
      } else if (actionType === "force-process") {
        forceProcessAnomaly(actionAttenderId, actionExamId);
      } else if (actionType === "process-all") {
        forceProcessAllAttenders(actionExamId);
      }
    },
    errorCallback: function (error) {
      $("#password-error")
        .removeClass("d-none")
        .text("Invalid password. Please try again.");
      $("#confirm-password-button").prop("disabled", false).text("Confirm");
    },
  });
}

function closePasswordPopup() {
  $("#password-confirmation-popup").removeClass("visible");
  $("#confirmation-password").val("");
  $("#password-error").addClass("d-none");
  $("#confirm-password-button").prop("disabled", false).text("Confirm");

  setTimeout(() => {
    if (actionType === "view-video") {
      const buttons = document.querySelectorAll(".view-video-btn");
      buttons.forEach((btn) => {
        if (btn.getAttribute("data-id") === actionAttenderId) {
          btn.classList.remove("processing");
        }
      });
    }

    actionAttenderId = null;
    actionExamId = null;
    actionType = null;
  }, 100);
}
