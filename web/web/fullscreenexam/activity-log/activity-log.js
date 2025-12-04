let logs = [];
let activityLogData = [];
let activityResponse = {};
let expandedLogIds = new Set(); // Track expanded rows
let liveUpdates = false;
let perPageCount = 10;
let pageChangeCount = 1;
let fetchedUsers = []
let fetchedClients = [];
let fetchedAction = []
let selectedAction = []
let selectedEmails = [];
let selectedColleges = []

// Document ready
$(document).ready(function () {

  const isRole = localStorage.getItem("role");
  if (isRole !== SUPERADMIN) {
    $("#collegeDropdown").remove();
  }

  if (!(isRole === SUPERADMIN || isRole === ADMIN)) {
    $("#emailDropdown").remove();
  } else {
    loadUsers();
  }
  loadClients();


  initializeComponents();
  getActivityLogList();
  setupEventListeners();
});

// ==========================
// Initialize UI components
// ==========================
function initializeComponents() {
  // Load users initially (populates email dropdown)


  // Show dropdown on focus
  $("#email-filter").on("focus", function () {
    $(".email-dropdown-wrapper").addClass("show-dropdown");
    renderEmailDropdown(fetchedUsers);
  });


  // Filter on typing
  $("#email-filter").on("input", function () {
    const query = $(this).val().toLowerCase();
    const filtered = fetchedUsers.filter(user =>
      user.email.toLowerCase().includes(query)
    );
    renderEmailDropdown(filtered);
  });

  // Clear all selections
  $("#clear-email-selection").on("click", function () {
    selectedEmails = [];
    $("#selected-email").empty();
    $("#email-filter").val("");
    $(".email-dropdown-wrapper").removeClass("show-dropdown");
    applyFilters()
  });

  // College dropdown focus
  $("#college-filter").on("focus", function () {
    $(".college-dropdown-wrapper").addClass("show-dropdown");
    renderCollegeDropdown(fetchedClients); // pass the fetched colleges here
  });

  $("#college-filter").on("input", function () {
    const query = $(this).val().toLowerCase();
    const filtered = fetchedClients.filter(client =>
      client.name.toLowerCase().includes(query)
    );
    renderCollegeDropdown(filtered);
  });
  $("#clear-college-selection").on("click", function () {
    selectedColleges = [];
    $("#selected-college").empty();
    $("#college-filter").val("");
    $(".college-dropdown-wrapper").removeClass("show-dropdown");
    applyFilters()
  });


  // Show dropdown on focus
  $("#action-filter").on("focus", function () {
    $(".action-dropdown-wrapper").addClass("show-dropdown");
    renderActionDropdown(fetchedAction);
  });

  // Filter on typing
  $("#action-filter").on("input", function () {
    const query = $(this).val().toLowerCase();
    const filtered = fetchedAction.filter(action =>
      action.toLowerCase().includes(query)   // use name for display
    );
    renderActionDropdown(filtered);
  });

  // Clear all selections
  $("#clear-action-selection").on("click", function () {
    selectedAction = [];
    $("#selected-action").empty();
    $("#action-filter").val("");
    $(".action-dropdown-wrapper").removeClass("show-dropdown");
    applyFilters()
  });

  $("#log-activity-clear-btn").on("click", function () {
    selectedEmails = [];
    $("#selected-email").empty();
    $("#email-filter").val("");
    $("#email-list").empty().removeClass("show-dropdown");
    selectedColleges = [];
    $("#selected-college").empty();
    $("#college-filter").val("");
    $("#college-list").empty().removeClass("show-dropdown");
    selectedAction = [];
    $("#selected-action").empty();
    $("#action-filter").val("");
    $("#action-list").empty().removeClass("show-dropdown");

    $("#dateFilter").val("last24Hours").trigger("change");

    // ✅ clear custom range inputs
    $("#startDate").val("");
    $("#endDate").val("");
    $("#customDateRange").addClass("hidden");
    applyFilters()
  })

  // Date filter change
  $("#dateFilter").change(function () {
    $("#last7DaysBtn").removeClass("active-date-btn");
    const value = $(this).val();
    const now = new Date();

    if (value === "custom") {
      $("#customDateRange").removeClass("hidden");
    } else {
      $("#customDateRange").addClass("hidden");
      let start, end;
      if (value === "last24Hours") {
        $("#startDate").val("");
        $("#endDate").val("");
      }
      else if (value === "today") {
        // Both start and end = today
        start = now.toISOString().split("T")[0];
        end = start;
      } else if (value === "week") {
        // Monday as week start (can adjust to Sunday if you prefer)
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        start = firstDayOfWeek.toISOString().split("T")[0];
        end = now.toISOString().split("T")[0];
      } else if (value === "month") {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // This ensures YYYY-MM-DD in your *local* timezone
        const formatDate = (d) => d.toLocaleDateString("en-CA"); // "en-CA" gives 2025-10-01
        start = formatDate(firstDayOfMonth);
        end = formatDate(now);
      }

      if (start && end) {
        $("#startDate").val(start);
        $("#endDate").val(end);
      }
    }

    applyFilters();
  });

  // Last 7 days
  $("#last7DaysBtn").click(function () {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    $("#startDate").val(weekAgo.toISOString().split("T")[0]);
    $("#endDate").val(now.toISOString().split("T")[0]);

    // ✅ Add active class
    $("#last7DaysBtn").addClass("active-date-btn");

    applyFilters();
  });

  // Clear dates
  $("#clearDatesBtn").click(function () {
    $("#last7DaysBtn").removeClass("active-date-btn");
    $("#startDate").val("");
    $("#endDate").val("");
    applyFilters();
  });
}


// ==========================
// Load clients (colleges) from API
// ==========================
function loadClients(searchQuery = "") {
  console.log("log1")
  let url = ACCOUNT_END_POINT + `/all-accounts?limit=200&pageNo=1`;
  if (searchQuery) {
    url += `&search=${encodeURIComponent(searchQuery)}`;
  }

  makeApiCall({
    method: "GET",
    url: url,
    successCallback: function (response) {
      const clients = response?.data?.accounts
      fetchedClients = clients; // cache result
      renderTable();
    },
    errorCallback: function (error) {
      console.error("Failed to load clients:", error);
      showNotification("Failed to load clients", "error");
    },
  });
}

// ==========================
// Load users (email list) from API
// ==========================
function loadUsers(searchQuery = "") {
  let url = ACTIVITY_LOG_END_POINT + `/user?limit=200&pageNo=1`;
  makeApiCall({
    method: "GET",
    url: url,
    successCallback: function (response) {
      const users = response?.data?.users;
      fetchedUsers = users // cache
    },
    errorCallback: function (error) {
      showNotification("Failed to load users", "error");
    },
  });
}

// ==========================
// API call to get logs
// ==========================
function getActivityLogList() {
  console.log("log3")
  let url =
    ACTIVITY_LOG_END_POINT +
    `/user-log?limit=${perPageCount}&pageNo=${pageChangeCount}`;


  // Collect filters from UI
  const searchQuery = $("#searchInput").val();
  const dateFilter = $("#dateFilter").val();
  const startDate = $("#startDate").val();
  const endDate = $("#endDate").val();
  filterDateInfo(startDate, endDate)
  if (searchQuery) {
    url += `&search=${encodeURIComponent(searchQuery)}`;
  }

  if (dateFilter) {
    url += `&dateFilter=${encodeURIComponent(dateFilter)}`;
  }
  if (startDate) {
    url += `&startDate=${encodeURIComponent(startDate)}`;
  }
  if (endDate) {
    url += `&endDate=${encodeURIComponent(endDate)}`;
  }

  // send only arrays in body
  const bodyData = {
    email: selectedEmails?.map(e => e.email) || [],
    accountId: selectedColleges?.map(c => c._id) || [],
    actions: selectedAction || []
  };
  makeApiCall({
    method: "POST",
    url: url,
    data: JSON.stringify(bodyData),
    successCallback: function (data) {
      // loadClients()
      logs = data?.data?.logs || [];
      updateDashboard(data?.data || {});
      activityResponse = data?.data || {};
      activityLogData = activityResponse || [];
      nextPageCount(activityLogData);
      renderTable();
    },
    errorCallback: function (error) {
      showNotification("Failed to load activity logs", "error");
    },
  });
}

// ==========================
// Dashboard statistics
// ==========================
function updateDashboard(data) {
  $("#totalEvents").text(data.totalCount || 0);
  $("#successfulEvents").text(data.successCount || 0);
  $("#warningEvents").text(data.warningCount || 0);
  $("#errorEvents").text(data.errorCount || 0);
}
// Close dropdown when clicking outside
$(document).on("click", function (e) {
  if (!$(e.target).closest("#emailDropdown").length) {
    $(".email-dropdown-wrapper").removeClass("show-dropdown");
  }
  if (!$(e.target).closest("#collegeDropdown").length) {
    $(".college-dropdown-wrapper").removeClass("show-dropdown")
  }
  if (!$(e.target).closest("#actionDropdown").length) {
    $(".action-dropdown-wrapper").removeClass("show-dropdown")
  }
});


function renderEmailDropdown(users) {
  $("#email-list").empty();

  if (!users || users.length === 0) {
    $("#email-list").append(`<div class="dropdown-empty">No users found</div>`);
    return;
  }

  users.forEach(user => {
    if (!selectedEmails.some(e => e.userId === user._id)) {
      const item = $(`<div class="dropdown-item">${user.email}</div>`);

      // On selecting an email
      item.on("click", function (e) {
        e.stopPropagation();
        addSelectedEmail(user);
        $("#email-filter").val(""); // clear input after select
        item.remove();
        applyFilters()
      });

      $("#email-list").append(item);
    }
  });
}

function addSelectedEmail(user) {
  // Prevent duplicates
  if (!selectedEmails.some(e => e.userId === user._id)) {
    selectedEmails.push({ userId: user._id, email: user.email });

    const tag = $(`
      <div class="email-tag-wrapper"> 
        <span class="email-tag">${user.email}</span>
      </div>
    `);

    // Remove tag on click
    tag.find(".email-tag").on("click", function (e) {
      e.stopPropagation();
      selectedEmails = selectedEmails.filter(e => e.userId !== user._id);
      tag.remove();
      renderEmailDropdown(fetchedUsers);
      applyFilters()
    });
    $("#selected-email").append(tag);
  }
}

function renderCollegeDropdown(users) {
  $("#college-list").empty();

  if (!users || users.length === 0) {
    $("#college-list").append(`<div class="dropdown-empty">No users found</div>`);
    return;
  }

  users.forEach(user => {
    // check by ID, not by name
    if (!selectedColleges.some(c => c._id === user._id)) {
      const item = $(`<div class="dropdown-item">${user.name}</div>`);

      // On selecting a college
      item.on("click", function (e) {
        e.stopPropagation();
        addSelectedCollege(user);
        $("#college-filter").val(""); // clear input after select
        item.remove()
        applyFilters()
      });

      $("#college-list").append(item);
    }
  });
}

function addSelectedCollege(college) {
  if (!selectedColleges.some(c => c._id === college._id)) {
    selectedColleges.push({ _id: college._id, name: college.name });

    const tag = $(`
      <div class="college-tag-wrapper"> 
        <span class="college-tag">${college.name}</span>
      </div>
    `);

    // Remove tag on click
    tag.find(".college-tag").on("click", function (e) {
      e.stopPropagation();
      selectedColleges = selectedColleges.filter(c => c._id !== college._id);
      tag.remove();
      renderCollegeDropdown(fetchedClients);
      applyFilters()
    });

    $("#selected-college").append(tag);
  }
}

function renderActionDropdown(actions) {
  $("#action-list").empty();

  if (!actions || actions.length === 0) {
    $("#action-list").append(`<div class="dropdown-empty">No actions found</div>`);
    return;
  }

  actions.forEach(action => {
    if (!selectedAction.includes(action)) {
      const item = $(`<div class="dropdown-item">${action}</div>`);

      // On selecting an action
      item.on("click", function (e) {
        e.stopPropagation();
        addSelectedAction(action);
        $("#action-filter").val(""); // clear input after select
        item.remove()
        applyFilters()
      });

      $("#action-list").append(item);
    }
  });
}

function addSelectedAction(action) {
  if (!selectedAction.includes(action)) {
    selectedAction.push(action); // store id for backend

    const tag = $(`
     <div class="action-tag-wrapper"> 
        <span class="action-tag">${action}</span>
      </div>
    `);

    // Remove tag on click
    tag.find(".action-tag").on("click", function (e) {
      e.stopPropagation();
      selectedAction = selectedAction.filter(actionEle => actionEle !== action);
      tag.remove();
      renderActionDropdown(fetchedAction);

      applyFilters()
    });

    $("#selected-action").append(tag);
  }
}


function updateFilterCount(idSelector, count) {
  if (count > 0) {
    $(idSelector).parent().addClass("show-filter-counts")
  } else {
    $(idSelector).parent().removeClass("show-filter-counts")
  }
  $(idSelector).text(count);
}

// ==========================
// Pagination
// ==========================
function nextPageCount(activityData) {
  let PageCountHtml = `
    <span>${pageChangeCount === 1 ? 1 : perPageCount * (pageChangeCount - 1)
    }</span> to <span>${pageChangeCount * perPageCount >= activityData.totalCount
      ? activityData.totalCount
      : pageChangeCount * perPageCount
    }</span> of <span>${activityData.totalCount}</span>`;

  let nextPageHtml = `
    <button id="first-page"><i class="fa-solid fa-angles-left"></i></button>
    <button id="previous-page"><i class="fa-solid fa-chevron-left"></i></button>
    <div>page ${activityData.currentPage} of ${activityData.totalPages}</div>
    <button id="next-page"><i class="fa-solid fa-chevron-right"></i></button>
    <button id="last-page"><i class="fa-solid fa-angles-right"></i></button>
  `;

  $("#page-count-fun").html(PageCountHtml);
  $("#page-click-fun").html(nextPageHtml);


  // ==========================
  // Pagination click function
  // ==========================

  $("#first-page").click(function () {
    if (pageChangeCount > 1) {
      pageChangeCount = 1;
      getActivityLogList();
    }
  });

  $("#last-page").click(function () {
    if (pageChangeCount !== Math.ceil(activityResponse.totalCount / perPageCount)) {
      pageChangeCount = Math.ceil(activityResponse.totalCount / perPageCount);
      getActivityLogList();
    }
  });

  $("#previous-page").click(function () {
    if (pageChangeCount > 1) {
      pageChangeCount--;
      getActivityLogList();
    }
  });

  $("#next-page").click(function () {
    const totalPages = Math.ceil((activityResponse.totalCount || 0) / perPageCount);

    if (pageChangeCount < totalPages) {
      pageChangeCount++;
      getActivityLogList();
    }
  });

}

// ==========================
// Event listeners
// ==========================
function setupEventListeners() {
  // Search
  $("#searchInput").on("input", debounce(applyFilters, 300));

  // Date inputs
  $("#startDate, #endDate").on("change", function () {
    $("#last7DaysBtn").removeClass("active-date-btn");
    applyFilters()
  });

  // Live updates
  $("#liveUpdatesBtn").click(function () {
    liveUpdates = !liveUpdates;
    updateLiveUpdatesButton();
  });

  // Export
  $("#exportBtn").click(exportLogs);

  // Row limit change
  $("#row-limit").on("change", function () {
    perPageCount = parseInt($(this).val(), 10);
    pageChangeCount = 1;
    getActivityLogList();
  });
}

// ==========================
// Helpers
// ==========================
function applyFilters() {
  pageChangeCount = 1;
  getActivityLogList();
  updateFilterCount("#email-filter-counts", selectedEmails.length)
  updateFilterCount("#college-filter-counts", selectedColleges.length)
  updateFilterCount("#action-filter-counts", selectedAction.length)

}

function filterDateInfo(startDate, endDate) {
  if (startDate && endDate) {
    let dateRangeText = `${formatDate(startDate)} to ${formatDate(endDate)}`
    $("#date-range-info").html(dateRangeText)
  } else {
    const last24H = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const nowDate = new Date()
    let dateRangeText = `${formatDate(last24H)} to ${formatDate(nowDate)}`
    $("#date-range-info").html(dateRangeText)
  }
}

function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// ==========================
// Table rendering
// ==========================
function renderTable() {
  const tbody = $("#logTableBody");
  tbody.empty();

  if (!logs.length) {
    tbody.append(
      '<tr><td colspan="6" class="text-center py-4 text-gray-500">No logs found</td></tr>'
    );
    return;
  }

  logs.forEach((log) => {
    const logId = log.date + "-" + (log.data?.email || log.name || "");
    const formattedDate = formatDate(log.date, true);
    const status = getStatusFromMessage(log.message || "");
    const statusClass = getStatusClass(status);
    const statusIcon = getStatusIcon(status);
    const actionIcon = getActionIcon(log.action);
    const email = log?.email || log.data?.email || "N/A";
    const isExpanded = expandedLogIds.has(logId);
    const client = fetchedClients.find(c => c._id === log.data.accountId);
    const clientName = client ? client.name : "N/A";

    if (!fetchedAction.includes(log.action)) {
      fetchedAction.push(log.action);
    }
    const row = `
      <tr class="auditlog-row ${statusClass} ${isExpanded ? "row-expanded" : ""}" data-log-id="${logId}">
        <td class="auditlog-cell cell-expand">
          <i class="fas fa-chevron-right expand-icon ${isExpanded ? "icon-rotated" : ""}" data-log-id="${logId}"></i>
        </td>
        <td class="auditlog-cell cell-date">
          <div class="cell-date-content">
            ${formattedDate}
          </div>
        </td>
        <td class="auditlog-cell cell-action">
          <div class="cell-action-content">
            <div class="action-icon-wrapper">
              <i class="fas ${actionIcon}"></i>
            </div>
            ${log.action}
          </div>
        </td>
        <td class="auditlog-cell cell-email">${email}</td>
        <td class="auditlog-cell cell-action">${clientName}</td>
        <td class="auditlog-cell cell-status">
          <div class="cell-status-content">
            <i class="fas ${statusIcon} status-icon ${getStatusColor(status)}"></i>
            <span class="status-text">${status}</span>
          </div>
        </td>
      </tr>
    `;

    tbody.append(row);

    if (isExpanded) {
      const detailRow = createDetailRow(log, logId);
      tbody.append(detailRow);
    }
  });

  // Expand handlers
  $(".expand-icon").off("click").on("click", function (e) {
    e.stopPropagation();
    const logId = $(this).data("log-id");
    toggleLogDetails(logId);
  });

  $("#logTableBody tr[data-log-id]").off("click").on("click", function () {
    const logId = $(this).data("log-id");
    toggleLogDetails(logId);
  });
}

// ==========================
// Accordion functionality
// ==========================
function toggleLogDetails(logId) {
  const icon = $(`.expand-icon[data-log-id="${logId}"]`);
  const log = logs.find(
    (l) => l.date + "-" + (l.data?.email || l.name || "") === logId
  );
  if (!log) return;

  if (expandedLogIds.has(logId)) {
    // Closing
    expandedLogIds.delete(logId);
    icon.removeClass("icon-rotated");
    $(`#detail-row-${logId.replace(/[^a-zA-Z0-9]/g, "-")}`).remove();
  } else {
    // Close other open logs
    expandedLogIds.forEach((id) => {
      $(`.expand-icon[data-log-id="${id}"]`).removeClass("icon-rotated");
      $(`#detail-row-${id.replace(/[^a-zA-Z0-9]/g, "-")}`).remove();
    });
    expandedLogIds.clear();

    // Open new one
    expandedLogIds.add(logId);
    icon.addClass("icon-rotated");
    const detailRow = createDetailRow(log, logId);
    $(`tr[data-log-id="${logId}"]`).after(detailRow);
  }
}



// ==========================
// Detail row creation
// ==========================
function createDetailRow(log, logId) {
  let detailsHtml = '';

  // Add basic information
  detailsHtml += `
    <div class="flex justify-between">
      <dt class="text-sm text-gray-800">IP Address</dt>
      <dd class="text-sm font-medium text-gray-600">${log.ip || 'N/A'}</dd>
    </div>
    <div class="flex justify-between">
      <dt class="text-sm text-gray-800">Host</dt>
      <dd class="text-sm font-medium text-gray-600">${log.host || 'N/A'}</dd>
    </div>
    <div class="flex justify-between">
      <dt class="text-sm text-gray-800">Method</dt>
      <dd class="text-sm font-medium text-gray-600">${log.method || 'N/A'}</dd>
    </div>
    <div class="flex justify-between">
      <dt class="text-sm text-gray-800">URL</dt>
      <dd class="text-sm font-medium text-gray-600">${log.baseUrl || ''}${log.url || ''}</dd>
    </div>
  `;

  // Add data object properties
  if (log.data && typeof log.data === 'object') {
    Object.entries(log.data).forEach(([key, value]) => {
      let displayValue = value;
      if (typeof value === 'object') {
        displayValue = JSON.stringify(value, null, 2);
      }
      detailsHtml += `
        <div class="flex justify-between">
          <dt class="text-sm text-gray-800 capitalize">${key.replace(/([A-Z])/g, ' $1').trim()}</dt>
          <dd class="text-sm font-medium text-gray-600 break-all max-w-xs">${String(displayValue)}</dd>
        </div>
      `;
    });
  }

  const safeLogId = logId.replace(/[^a-zA-Z0-9]/g, '-');

  return `
    <tr id="detail-row-${safeLogId}" class="detail-row">
      <td colspan="6" class="px-6 py-4">
        <div class="detail-content p-6">
          <h4 class="text-lg font-semibold text-gray-600 mb-4">Event Details</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 class="text-sm font-medium text-gray-500 mb-2">Basic Information</h5>
              <dl class="space-y-2">
                ${detailsHtml}
              </dl>
            </div>
            <div>
              <h5 class="text-sm font-medium text-gray-500 mb-2">Additional Details</h5>
              <dl class="space-y-2">
                 <div class="flex justify-between">
                  <dt class="text-sm text-gray-800">Message</dt>
                  <dd class="text-sm font-medium text-gray-600">${log.message || 'N/A'}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-800">User Name</dt>
                  <dd class="text-sm font-medium text-gray-600">${log.name || 'N/A'}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-800">Browser</dt>
                  <dd class="text-sm font-medium text-gray-600">${log.browser || 'N/A'}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-sm text-gray-800">Role</dt>
                  <dd class="text-sm font-medium text-gray-600">${log.role || 'N/A'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </td>
    </tr>
  `;
}

// ==========================
// Notification system
// ==========================
function showNotification(message, type) {
  // Remove any existing notification
  $('.notification').remove();

  // Create new notification
  const notification = $(`
    <div class="notification notification-${type}">
      ${message}
      <span class="close-notification">&times;</span>
    </div>
  `);

  // Add to document
  $('body').append(notification);

  // Show notification
  setTimeout(() => {
    notification.addClass('show');
  }, 10);

  // Add click event to close button
  notification.find('.close-notification').on('click', function () {
    notification.removeClass('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.removeClass('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

// ==========================
// Utility functions
// ==========================
function formatDate(dateString, withTime) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString || "N/A";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strHours = String(hours).padStart(2, "0");
  if (withTime) {
    return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
  } else {
    return `${day}/${month}/${year}`;
  }

}

function getStatusFromMessage(message) {
  message = message || "";
  if (message.includes("SUCCESS")) return "success";
  if (message.includes("WARNING")) return "warning";
  if (message.includes("ERROR")) return "error";
  return "info";
}

function getStatusClass(status) {
  switch (status) {
    case "success":
      return "auditlog-status-success";
    case "warning":
      return "auditlog-status-warning";
    case "error":
      return "auditlog-status-error";
    default:
      return "auditlog-status-default";
  }
}

function getStatusColor(status) {
  switch (status) {
    case "success":
      return "status-color-success";
    case "warning":
      return "status-color-warning";
    case "error":
      return "status-color-error";
    default:
      return "status-color-default";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "success":
      return "fa-check-circle";
    case "warning":
      return "fa-exclamation-triangle";
    case "error":
      return "fa-times-circle";
    default:
      return "fa-clock";
  }
}

function getActionIcon(action) {
  const iconMap = {
    login: "fa-key",
    logout: "fa-sign-out-alt",
    assessment_created: "fa-file-alt",
    assessment_submitted: "fa-file-alt",
    user_role_changed: "fa-cog",
    system_error: "fa-exclamation-circle",
    assessment_edited: "fa-file-alt",
    user_deleted: "fa-user",
    assessment_deleted: "fa-file-alt",
    "update-entrance-exam": "fa-edit",
  };
  return iconMap[action] || "fa-server";
}

function updateLiveUpdatesButton() {
  const btn = $("#liveUpdatesBtn");
  const indicator = $("#liveIndicator");
  if (liveUpdates) {
    btn.removeClass("live-updates-inactive").addClass("live-updates-active");
    indicator.removeClass("indicator-inactive").addClass("indicator-active");
  } else {
    btn.removeClass("live-updates-active").addClass("live-updates-inactive");
    indicator.removeClass("indicator-active").addClass("indicator-inactive");
  }
}

function exportLogs() {
  alert("Export functionality would download a CSV file with current logs.");
}