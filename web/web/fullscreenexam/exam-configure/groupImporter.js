$(document).ready(function () {
  // Initialize the group importer button click event
  $("#group-import-btn").on("click", function () {
    // examId = getQueryParameter("id");
    openGroupImportPanel();
  });

  // Initialize click events for the document to handle outside clicks
  $(document).on("click", ".group-panel-backdrop", function () {
    closeGroupImportPanel();
  });

  // Close student details when clicking on backdrop
  $(document).on("click", ".student-details-backdrop", function () {
    closeStudentDetails();
  });

  // Search functionality for groups
  $(document).on("input", "#groupSearchInput", function () {
    const searchText = $(this).val().toLowerCase();
    $("#groupsList .group-item").each(function () {
      const groupName = $(this).find(".group-name").text().toLowerCase();
      if (groupName.includes(searchText)) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  });

  // Search functionality for attendees
  $(document).on("input", "#attendeeSearchInput", function () {
    const searchText = $(this).val().toLowerCase();
    if (window.attendeesGridApi) {
      window.attendeesGridApi.setGridOption("quickFilterText", searchText);
    }
  });

  // Group selection handler
  $(document).on("click", ".group-item", function () {
    const groupId = $(this).data("id");

    if ($(this).hasClass("selected")) {
      // Deselect group
      $(this).removeClass("selected");
      selectedGroups = selectedGroups.filter((g) => g !== groupId);
    } else {
      // Select group
      $(this).addClass("selected");
      selectedGroups.push(groupId);
    }

    updateSelectedCount();
    loadAttendersForSelectedGroups();
  });

  // Import selected attendees button
  $(document).on("click", "#importSelectedBtn", function () {
    if (selectedAttenders.length > 0) {
      importSelectedAttenders();
    } else {
      toastr.warning("Please select at least one attendee to import");
    }
  });

  // Import all attendees from selected groups button
  $(document).on("click", "#importAllBtn", function () {
    if (selectedGroups.length > 0) {
      importAllAttendersFromGroups();
    } else {
      toastr.warning("Please select at least one group");
    }
  });

  // Close panel button
  $(document).on("click", "#closeGroupPanelBtn", function () {
    closeGroupImportPanel();
  });

  // Close student details panel
  $(document).on("click", ".close-details", function () {
    closeStudentDetails();
  });
});

function openGroupImportPanel() {
  // Create and append the panel DOM structure
  const panelHtml = `
    <div class="group-panel-backdrop"></div>
    <div class="group-import-panel" id="groupImportPanel">
      <div class="panel-container">
        <div class="panel-header">
          <div class="group-header-content">
            <div class="header-title">
              <i class="bx bx-group"></i>
              <h3>Import Attendees from Groups</h3>
            </div>
            <button type="button" class="panel-close-btn" id="closeGroupPanelBtn">
              <i class="bx bx-x"></i>
            </button>
          </div>
        </div>
        
        <div class="panel-body">
          <div class="groups-container">
            <div class="container-header">
              <div class="section-title">
                <i class="bx bx-folder"></i> Groups
              </div>
              <div class="search-box">
                <input type="text" id="groupSearchInput" placeholder="Search groups...">
                <i class="bx bx-search"></i>
              </div>
            </div>
            <div class="groups-list" id="groupsList">
              <div class="loading-indicator">
                <i class="bx bx-loader-alt bx-spin"></i>
                <span>Loading groups...</span>
              </div>
            </div>
          </div>
          
          <div class="attendees-container">
            <div class="container-header">
              <div class="section-title">
                <i class="bx bx-user"></i> Attendees
              </div>
              <div class="search-box">
                <input type="text" id="attendeeSearchInput" placeholder="Search attendees...">
                <i class="bx bx-search"></i>
              </div>
            </div>
            <div class="attendees-grid-container">
              <div id="attendeesGrid" class="ag-theme-alpine"></div>
              <div class="no-selection-message" id="noSelectionMessage">
                <i class="bx bx-info-circle"></i>
                <p>Select a group to view attendees</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="panel-footer">
          <div class="selection-info">
            <span id="selectedCount">0 groups, 0 attendees selected</span>
          </div>
          <div class="action-buttons">
            <button id="importSelectedBtn" class="btn-import-selected">
              <i class="bx bx-user-plus"></i> Import Selected Attendees
            </button>
            <button id="importAllBtn" class="btn-import-all">
              <i class="bx bx-group"></i> Import All From Selected Groups
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing panel if any
  $("#groupImportPanel, .group-panel-backdrop").remove();

  // Append new panel to body
  $("body").append(panelHtml);

  // Show the panel with animation
  setTimeout(() => {
    $(".group-import-panel").addClass("open");
    $(".group-panel-backdrop").addClass("show");
  }, 50);

  // Load groups
  loadGroups();
}

function closeGroupImportPanel() {
  const panel = $(".group-import-panel");
  const backdrop = $(".group-panel-backdrop");

  panel.removeClass("open");
  backdrop.removeClass("show");

  setTimeout(() => {
    panel.remove();
    backdrop.remove();

    // Reset selections
    selectedGroups = [];
    selectedAttenders = [];
  }, 300);
}

function loadGroups() {
  makeApiCall({
    url: `${GROUP_END_POINT}/list`,
    method: "GET",
    successCallback: function (response) {
      renderGroups(response.data);
      allGroups = response.data;
      $("#groupsList .loading-indicator").hide();
    },
    errorCallback: function (xhr) {
      toastr.error(xhr.responseJSON?.message || "Failed to load groups");
      $("#groupsList .loading-indicator").hide();
      $("#groupsList").append(`
        <div class="error-message">
          <i class="bx bx-error-circle"></i>
          <p>Failed to load groups. Please try again.</p>
        </div>
      `);
    },
  });
}

function renderGroups(groups) {
  const groupsList = $("#groupsList");
  groupsList.empty();

  if (groups.length === 0) {
    groupsList.append(`
      <div class="no-groups-message">
        <i class="bx bx-folder-open"></i>
        <p>No groups available</p>
      </div>
    `);
    return;
  }

  groups.forEach((group) => {
    const groupItem = $(`
      <div class="group-item" data-id="${group._id}">
        <div class="group-icon">
          <i class="bx bx-group"></i>
        </div>
        <div class="group-details">
          <div class="group-name truncate-text" title="${group.name}">${
      group.name
    }</div>
          <div class="group-meta">
            <span class="student-count">
              <i class="bx bx-user"></i> ${group.attenderCount || 0} students
            </span>
          </div>
        </div>
        <div class="group-check">
          <i class="bx bx-check"></i>
        </div>
      </div>
    `);

    groupsList.append(groupItem);
  });
}

function loadAttendersForSelectedGroups() {
  if (selectedGroups.length === 0) {
    // No groups selected, hide attendees grid
    $("#attendeesGrid").hide();
    $("#noSelectionMessage").show();
    return;
  }

  // Show loading in grid
  $("#attendeesGrid").show();
  $("#noSelectionMessage").hide();

  // Create request data with groupIds array
  const requestData = {
    groupIds: selectedGroups,
  };

  makeApiCall({
    url: `${GROUP_END_POINT}/attender-by-group`,
    method: "POST",
    data: JSON.stringify(requestData),
    successCallback: function (response) {
      console.log("API Response:", response);
      // The actual attendees are in response.data.attenders
      if (response.data && response.data.attenders) {
        renderAttendersGrid(response.data);
      } else if (response.attenders) {
        renderAttendersGrid(response);
      } else {
        console.error("Unexpected response structure:", response);
        $("#attendeesGrid").hide();
        $("#noSelectionMessage").show().html(`
          <i class="bx bx-error-circle"></i>
          <p>Unexpected response format. Please try again.</p>
        `);
      }
    },
    errorCallback: function (xhr) {
      toastr.error(xhr.responseJSON?.message || "Failed to load attendees");
      $("#attendeesGrid").hide();
      $("#noSelectionMessage").show().html(`
        <i class="bx bx-error-circle"></i>
        <p>Failed to load attendees. Please try again.</p>
      `);
    },
  });
}

function renderAttendersGrid(data) {
  // Check the structure of the data and adjust accordingly
  let attendeesArray = [];

  if (data.attenders && Array.isArray(data.attenders)) {
    // If data has an attenders property (as per API docs), use that
    attendeesArray = data.attenders;
  } else if (Array.isArray(data)) {
    // If data is an array, use it directly
    attendeesArray = data;
  } else {
    // Fallback case - try to extract attendees from another structure
    // or show an error message
    console.error("Unexpected data structure:", data);
    $("#attendeesGrid").hide();
    $("#noSelectionMessage").show().html(`
      <i class="bx bx-error-circle"></i>
      <p>Failed to process attendee data. Please try again.</p>
    `);
    return;
  }

  const columnDefs = [
    {
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 60,
      pinned: "left",
      filter: false,
    },
    {
      headerName: "Name",
      field: "name",
      valueGetter: (params) => {
        const firstName = params.data.name?.first || "";
        const lastName = params.data.name?.last || "";
        return firstName + " " + lastName;
      },
      cellRenderer: (params) => {
        return `
          <div class="attendee-name-cell">
            <span title="${params.value}" class="${
          params.value.length > 15 ? "ellipsis-text" : ""
        }">${params.value}</span>
          </div>
        `;
      },
      flex: 1.2,
    },
    {
      headerName: "Email",
      field: "email",
      cellRenderer: (params) => {
        return `<div class="truncate-text attendee-name-cell" title="${
          params.value || ""
        }">
        <span title="${params.value}" class="${
          params.value.length > 27 ? "ellipsis-text-email" : ""
        }">${params.value || ""}<span/></div>`;
      },
      flex: 1.5,
    },
    {
      headerName: "Pass code",
      field: "id1",
      cellRenderer: (params) => {
        return `
          <div class="group-name-cell">
            <span>${params.value}</span>
          </div>
        `;
      },
      flex: 0.5,
    },
    {
      headerName: "Status",
      field: "status.registration",
      cellRenderer: (params) => {
        const status = params.value?.toLowerCase() || "not_registered";
        let icon = "";
        switch (params.value) {
          case REGISTERED:
            icon = "check-circle";
            break;
          case APPROVED:
            icon = "badge-check";
            break;
          case REJECTED:
            icon = "x-circle";
            break;
          default:
            icon = "time";
            break;
        }
        return `
          <div class="status-cell">
            <span class="status-badge status-${status}">
              <i class="bx bx-${icon}"></i>
              ${params.value || NOT_REGISTERED}
            </span>
          </div>
        `;
      },
      flex: 0.5,
    },
    {
      headerName: "Actions",
      cellRenderer: (params) => {
        return `
          <div class="actions-cell">
            <button class="view-details-btn" title="View Details">
              <i class="bx bx-info-circle"></i>
            </button>
          </div>
        `;
      },
      onCellClicked: (params) => {
        if (params.event.target.closest(".view-details-btn")) {
          // Call API to get complete student details
          fetchAndShowStudentDetails(params.data);
        }
      },
    },
  ];

  // Enhance data with group names
  const enhancedData = attendeesArray.map((attendee) => {
    // Find the group name for this attendee based on the group ID
    const groupId =
      attendee.groupId ||
      (attendee.groups && attendee.groups.length > 0
        ? attendee.groups[0].groupId
        : null);
    const group = allGroups.find((g) => g._id === groupId);
    return {
      ...attendee,
      groupName: group ? group.name : "Unknown Group",
      groupId: groupId,
    };
  });

  // Configure the grid options
  const gridOptions = {
    columnDefs: columnDefs,
    rowData: enhancedData,
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
    },
    domLayout: "normal",
    rowHeight: 60,
    headerHeight: 48,
    animateRows: true,
    rowSelection: "multiple",
    suppressRowClickSelection: true,
    onSelectionChanged: onAttendeeSelectionChanged,
    suppressCellFocus: true,
    getRowStyle: (params) => {
      if (selectedAttenders.includes(params.data._id)) {
        return { background: "rgba(0, 123, 255, 0.1)" };
      }
      return null;
    },
    suppressRowVirtualisation: true,
  };

  // Create and render the grid
  if (window.attendeesGridApi) {
    window.attendeesGridApi.destroy();
  }

  const gridDiv = document.getElementById("attendeesGrid");
  new agGrid.Grid(gridDiv, gridOptions);
  window.attendeesGridApi = gridOptions.api;

  // Restore selections after the grid is re-rendered
  if (window.attendeesGridApi) {
    const nodesToSelect = [];
    window.attendeesGridApi.forEachNode((node) => {
      if (selectedAttenders.includes(node.data._id)) {
        nodesToSelect.push(node);
      }
    });

    if (nodesToSelect.length > 0) {
      window.attendeesGridApi.setNodesSelected({
        nodes: nodesToSelect,
        newValue: true,
      });
    }
  }

  // Update grid size
  gridOptions.api.sizeColumnsToFit();
}

function onAttendeeSelectionChanged() {
  const selectedRows = window.attendeesGridApi.getSelectedRows();
  selectedAttenders = selectedRows.map((row) => row._id);
  updateSelectedCount();
}

function updateSelectedCount() {
  $("#selectedCount").text(
    `${selectedGroups.length} groups, ${selectedAttenders.length} attendees selected`
  );
}

function fetchAndShowStudentDetails(student) {
  showLoader(true);

  makeApiCall({
    url: `${ATTENDER_END_POINT}?id=${student._id}`,
    method: "GET",
    successCallback: function (response) {
      const studentData = response.data;
      renderStudentDetails(studentData);
      showLoader(false);
    },
    errorCallback: function (xhr) {
      toastr.error(
        xhr.responseJSON?.message || "Failed to load student details"
      );
      showLoader(false);
    },
  });
}

function renderStudentDetails(student) {
  // Close any existing student details panel
  $(".student-details-panel, .student-details-backdrop").remove();

  // Process the student's groups if they exist
  const studentGroups =
    student?.groups?.map((group) => {
      // Find the group name from allGroups
      const foundGroup = allGroups.find((g) => g._id === group.groupId);
      return {
        ...group,
        name: foundGroup ? foundGroup.name : "Unknown Group",
        addedAt: group.addedAt || new Date().toISOString(),
      };
    }) || [];

  // Create student details panel
  const studentPanel = `
    <div class="student-details-backdrop"></div>
    <div class="student-details-panel">
      <div class="student-details-header">
        <div class="student-profile">
          <div class="profile-avatar">
            ${
              student?.face?.length > 0
                ? `<img src="${student.face[0]}" alt="Student" class="avatar-image"/>`
                : `<div class="avatar-text">${(
                    student?.name?.first?.[0] || "?"
                  ).toUpperCase()}</div>`
            }
          </div>
          <div class="profile-info">
            <h4>${student?.name?.first || ""} ${student?.name?.last || ""}</h4>
            <span class="profile-email">${student?.email || ""}</span>
          </div>
        </div>
        <button class="close-details">
          <i class="bx bx-x"></i>
        </button>
      </div>
      <div class="details-content">
        <div class="detail-section">
          <div class="section-header">
            <i class="bx bx-user"></i>
            <h5>Personal Information</h5>
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">First Name</span>
              <span class="detail-value">${student?.name?.first || "-"}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Last Name</span>
              <span class="detail-value">${student?.name?.last || "-"}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email</span>
              <span class="detail-value">${student?.email || "-"}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <div class="section-header">
            <i class="bx bx-check-shield"></i>
            <h5>Registration Status</h5>
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="status-badge status-${
                student?.status?.registration?.toLowerCase() || "not_registered"
              }">${student?.status?.registration || NOT_REGISTERED}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-header">
            <i class="bx bx-id-card"></i>
            <h5>Credentials</h5>
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Pass code</span>
              <span class="detail-value">${student?.id1 || "1211"}</span>
            </div>
          </div>
        </div>

        ${
          studentGroups.length
            ? `
        <div class="detail-section groups-section">
          <div class="section-header">
            <i class="bx bx-group"></i>
            <h5>Groups</h5>
          </div>
          <div class="groups-grid">
            ${studentGroups
              .map(
                (group) => `
              <div class="group-item-for-card">
                <i class="bx bx-group"></i>
                <span>${group.name}</span>
                <span class="group-date">${new Date(
                  group.addedAt
                ).toLocaleDateString()}</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        `
            : ""
        }

        ${
          student?.attachments?.length
            ? `
        <div class="detail-section">
          <div class="section-header">
            <i class="bx bx-paperclip"></i>
            <h5>Attachments</h5>
          </div>
          <div class="group-attachments-grid">
            ${student.attachments
              .map(
                (url) => `
              <div class="group-attachment-item" onclick="viewAttachment('${url}')">
                ${renderAttachmentPreview(url)}
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        `
            : ""
        }
      </div>
    </div>
  `;

  // Append to body
  $("body").append(studentPanel);

  // Show with animation
  setTimeout(() => {
    $(".student-details-backdrop").addClass("show");
    $(".student-details-panel").addClass("open");
  }, 50);
}

function renderAttachmentPreview(url) {
  // Remove query parameters before checking the extension
  let urlWithoutQuery = url.split("?")[0].toLowerCase();

  if (urlWithoutQuery.endsWith(".pdf")) {
    return `
      <div class="group-attachment-preview pdf-preview">
        <i class="bx bxs-file-pdf" style="font-size: 48px; color: #dc3545;"></i>
      </div>
      <span>PDF Document</span>
    `;
  } else {
    return `
      <div class="group-attachment-preview">
        <img src="${url}" alt="Attachment"/>
      </div>
      <span>Attachment</span>
    `;
  }
}

function viewAttachment(url) {
  // Remove query parameters before checking the extension
  let urlWithoutQuery = url.split("?")[0].toLowerCase();
  let viewerContent;

  if (urlWithoutQuery.endsWith(".pdf")) {
    viewerContent = `
      <div class="viewer-content pdf-viewer">
        <button class="close-viewer" onclick="closeAttachmentViewer(this)">
          <i class="bx bx-x"></i>
        </button>
        <object data="${url}" type="application/pdf" width="100%" height="100%">
          <p>PDF preview not available. <a href="${url}" target="_blank" class="pdf-download-link">Download PDF</a></p>
        </object>
      </div>
    `;
  } else {
    viewerContent = `
      <div class="viewer-content">
        <button class="close-viewer" onclick="closeAttachmentViewer(this)">
          <i class="bx bx-x"></i>
        </button>
        <img src="${url}" alt="Attachment" />
      </div>
    `;
  }

  const viewerHtml = `    <div class="group-attachment-viewer">
      <div class="viewer-backdrop"></div>
      ${viewerContent}
    </div>
  `;

  // Remove any existing viewer
  $(".group-attachment-viewer").remove();

  $("body").append(viewerHtml);
  setTimeout(() => {
    $(".group-attachment-viewer").addClass("show");
    $(".viewer-backdrop").addClass("show");
  }, 50);
}

function closeAttachmentViewer(btn) {
  const viewer = $(btn).closest(".group-attachment-viewer");
  const backdrop = viewer.find(".viewer-backdrop");
  viewer.removeClass("show");
  backdrop.removeClass("show");
  setTimeout(() => {
    viewer.remove();
  }, 300);
}

function closeStudentDetails() {
  const panel = $(".student-details-panel");
  const backdrop = $(".student-details-backdrop");

  panel.removeClass("open");
  backdrop.removeClass("show");

  setTimeout(() => {
    panel.remove();
    backdrop.remove();
  }, 300);
}

function importSelectedAttenders() {
  const getExamId = new URLSearchParams(window.location.search).get("id");

  if (selectedAttenders.length === 0) {
    toastr.warning("Please select at least one attendee");
    return;
  }

  showLoader(true);

  // Get full details of selected attendees
  const selectedAttendersData = window.attendeesGridApi.getSelectedRows();

  // Check for duplicates
  const duplicateCheck = checkDuplicateAttenders(selectedAttendersData, false);
  if (duplicateCheck.hasDuplicates) {
    showLoader(false);
    toastr.error(duplicateCheck.getDuplicateMessage());
    return;
  }

  const formattedAttenders = selectedAttendersData.map((attendee) => ({
    mail: attendee.email.toLowerCase().trim(),
    id: (attendee.id1 || attendee._id).toString().trim(),
    id2: (attendee.id1 || attendee._id).toString().trim(),
  }));

  const requestData = {
    examId: examId,
    newAttenders: formattedAttenders,
  };

  makeApiCall({
    url: `${EXAM_END_POINT}/attender/import?entranceExamId=${getExamId}`,
    method: "POST",
    data: JSON.stringify(requestData),
    successCallback: function (response) {
      const importCount = selectedAttenders.length;
      toastr.success(
        `Successfully imported ${importCount} attendee${
          importCount !== 1 ? "s" : ""
        }`
      );
      showLoader(false);
      closeGroupImportPanel();

      // Refresh the attenders list in the main page
      if (typeof reloadAttendees === "function") {
        reloadAttendees(getExamId);
      } else {
        // Fallback if reloadAttendees function is not available
        location.reload();
      }
    },
    errorCallback: function (xhr) {
      toastr.error(xhr.responseJSON?.message || "Failed to import attendees");
      showLoader(false);
    },
  });
}

function importAllAttendersFromGroups() {
       const getExamId = new URLSearchParams(window.location.search).get("id");
  if (selectedGroups.length === 0) {
    toastr.warning("Please select at least one group");
    return;
  }

  showLoader(true);

  // First get all attendees for the selected groups
  const requestData = {
    groupIds: selectedGroups,
  };

  makeApiCall({
    url: `${GROUP_END_POINT}/attender-by-group`,
    method: "POST",
    data: JSON.stringify(requestData),
    successCallback: function (response) {
      // Get attendees from response
      let allAttenders = [];
      if (response.data && response.data.attenders) {
        allAttenders = response.data.attenders;
      } else if (response.attenders) {
        allAttenders = response.attenders;
      }

      if (allAttenders.length === 0) {
        toastr.warning("No attendees found in the selected groups");
        showLoader(false);
        return;
      }

      // Check for duplicates
      const duplicateCheck = checkDuplicateAttenders(allAttenders, true);
      if (duplicateCheck.hasDuplicates) {
        showLoader(false);
        toastr.error(duplicateCheck.getDuplicateMessage());
        return;
      }

      // Format attendees for import
      const formattedAttenders = allAttenders.map((attendee) => ({
        mail: attendee.email.toLowerCase().trim(),
        id: (attendee.id1 || attendee._id).toString().trim(),
        id2: (attendee.id1 || attendee._id).toString().trim(),
      }));

      // Import all attendees
      makeApiCall({
        url: `${EXAM_END_POINT}/attender/import?entranceExamId=${getExamId}`,
        method: "POST",
        data: JSON.stringify({
          newAttenders: formattedAttenders,
        }),
        successCallback: function (importResponse) {
          toastr.success(
            `Successfully imported ${formattedAttenders.length} attendees`
          );
          showLoader(false);
          closeGroupImportPanel();

          // Refresh the attenders list in the main page
          if (typeof reloadAttendees === "function") {
            reloadAttendees(getExamId);
          } else {
            // Fallback if reloadAttendees function is not available
            location.reload();
          }
        },
        errorCallback: function (xhr) {
          toastr.error(
            xhr.responseJSON?.message ||
              "Failed to import attendees from groups"
          );
          showLoader(false);
        },
      });
    },
    errorCallback: function (xhr) {
      toastr.error(
        xhr.responseJSON?.message || "Failed to get attendees from groups"
      );
      showLoader(false);
    },
  });
}

// Add this common function at the top level of your file
function checkDuplicateAttenders(newAttenders, checkWithinGroup = true) {
  let existingEmails = [];
  let duplicateEmails = new Set();
  let emailSet = new Set();

  // First check for duplicates within the new attenders if required
  if (checkWithinGroup) {
    newAttenders.forEach((attendee) => {
      const normalizedEmail = (attendee.email || attendee.mail)
        .toLowerCase()
        .trim();
      if (emailSet.has(normalizedEmail)) {
        duplicateEmails.add(normalizedEmail);
      }
      emailSet.add(normalizedEmail);
    });
  }

  // Then check against currentGridData
  if (currentGridData && currentGridData.length) {
    newAttenders.forEach((attendee) => {
      const normalizedEmail = (attendee.email || attendee.mail)
        .toLowerCase()
        .trim();
      if (
        currentGridData.some(
          (row) => row.mail?.toLowerCase().trim() === normalizedEmail
        )
      ) {
        existingEmails.push(normalizedEmail);
      }
    });
  }

  // Return the results
  return {
    hasDuplicates: existingEmails.length > 0 || duplicateEmails.size > 0,
    existingEmails,
    duplicateEmails: Array.from(duplicateEmails),
    getDuplicateMessage() {
      let message = "";
      if (existingEmails.length > 0) {
        message += `Following emails already exist in the system: ${existingEmails.join(
          ", "
        )}. `;
      }
      if (duplicateEmails.size > 0) {
        message += `Following emails are duplicated in the selection: ${Array.from(
          duplicateEmails
        ).join(", ")}. `;
      }
      if (message) {
        message += "Please remove these emails and try again.";
      }
      return message;
    },
  };
}
