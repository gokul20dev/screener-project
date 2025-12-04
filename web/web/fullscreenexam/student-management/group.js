let gridOptions;
let currentGroupId = null;
let groupToDelete = null;
let groupDataList = 0;
let groups = [];
let currentSearchText = '';

$(document).ready(function () {
  // Load groups on page load
  loadGroups();

  // Add Group button click handler
  $("#addGroupBtn").click(function () {
    $("#modalTitle").text("Create Group");
    clearGroupForm();
    $("#groupModal").modal("show");
  });

  // Add event listener for search field
  $("#groupSearch").on("input", function () {
    const searchText = $(this).val().toLowerCase();
    currentSearchText = searchText;
    if (gridOptions && gridOptions.api) {
      gridOptions.api.setQuickFilter(searchText);

      // Slight delay to allow AG Grid to process the filter
    setTimeout(() => {
      const rowCount = gridOptions.api.getDisplayedRowCount();
      if (rowCount === 0) {
        gridOptions.api.showNoRowsOverlay();
      } else {
        gridOptions.api.hideOverlay();
      }
    }, 50);
    }
  });

  // Form submission handler
  $("#groupForm").on("submit", async function (e) {
    e.preventDefault();
    showLoader(true);

    const groupData = {
      name: $("#groupName").val(),
      description: $("#groupDescription").val(),
    };

    if (!groupData.name) {
      toastr.error("Group name is required");
      showLoader(false);
      return;
    }

    if (currentGroupId) {
      updateGroup(currentGroupId, groupData);
    } else {
      createGroup(groupData);
    }
  });

  // Reset modal when closed
  $("#groupModal").on("hidden.bs.modal", function () {
    currentGroupId = null;
    clearGroupForm();
    $("#modalTitle").text("Create Group");
  });

  // Delete modal handlers
  $("#deleteConfirmationModal").on("shown.bs.modal", function () {
    $("#deleteVerification").trigger("focus");
  });

  $("#deleteVerification").on("input", function () {
    const isValid = $(this).val().toLowerCase() === "delete";
    $("#confirmDeleteBtn").prop("disabled", !isValid);
    $(this).toggleClass("is-invalid", !isValid);
  });

  $("#confirmDeleteBtn").click(function () {
    if (groupToDelete) {
      showLoader(true);
      makeApiCall({
        url: `${GROUP_END_POINT}?id=${groupToDelete}`,
        method: "DELETE",
        successCallback: function (response) {
          $("#deleteConfirmationModal").modal("hide");
          loadGroups();
          toastr.success(response.message || "Group deleted successfully");
          showLoader(false);
        },
        errorCallback: function (xhr) {
          toastr.error(xhr.responseJSON?.message || "Failed to delete group");
          showLoader(false);
        },
      });
    }
    // Reset after operation
    $("#deleteVerification").val("").removeClass("is-invalid");
    groupToDelete = null;
  });

  // Reset delete state when modal closes
  $("#deleteConfirmationModal").on("hidden.bs.modal", function () {
    $("#deleteVerification").val("").removeClass("is-invalid");
    $("#confirmDeleteBtn").prop("disabled", true);
    groupToDelete = null;
  });
});

function loadGroups() {
  makeApiCall({
    url: `${GROUP_END_POINT}/list`,
    method: "GET",
    successCallback: function (response) {
      renderGroups(response.data);
      groupDataList = response.data.length;
      groups = response.data;
      
      if (gridOptions && gridOptions.api && currentSearchText) {
        gridOptions.api.setQuickFilter(currentSearchText);
      }
      
      showLoader(false);
    },
    errorCallback: function (xhr) {
      toastr.error(xhr.responseJSON?.message || "Failed to load groups");
      showLoader(false);
    },
  });
}

function renderGroups(groups) {
  const columnDefs = [
    {
      headerName: "Group Name",
      field: "name",
      headerClass: "table-ag-class",
      cellRenderer: (params) => {
        return `<div class="truncate-text" title="${params.value}">${params.value}</div>`;
      },
      cellStyle: {
        fontWeight: "500",
        color: "#666",
        width: "100%",
        overflow: "hidden",
      },
    },
    {
      headerName: "Description",
      field: "description",
      headerClass: "table-ag-class",
      cellRenderer: (params) => {
        return `<div class="truncate-text" title="${params.value || ""}">${
          params.value || ""
        }</div>`;
      },
      cellStyle: {
        color: "#666",
        fontWeight: "500",
        width: "100%",
        overflow: "hidden",
      },
      flex: 1.5,
    },
    {
      headerName: "Students Count",
      field: "attenderCount",
      headerClass: "table-ag-class",
      valueGetter: (params) => params.data.attenderCount || 0,
      cellRenderer: (params) => {
        return `<div class="truncate-text" title="${params.value}">${params.value}</div>`;
      },
      cellStyle: {
        color: "#666",
        fontWeight: "500",
        width: "100%",
        overflow: "hidden",
      },
    },
    {
      headerName: "Created At",
      field: "createdAt",
      headerClass: "table-ag-class",
      valueGetter: (params) => dateValueGetter(params, "createdAt") ,
      cellRenderer: (params) => {
        return `<div class="truncate-text" title="${params.value}">${params.value}</div>`;
      },
      cellStyle: {
        color: "#666",
        fontWeight: "500",
        width: "100%",
        overflow: "hidden",
      },
    },
    {
      headerName: "Modified At",
      field: "updatedAt",
      headerClass: "table-ag-class",
      valueGetter: (params) => dateValueGetter(params, "updatedAt"),
      cellRenderer: (params) => {
        return `<div class="truncate-text" title="${params.value}">${params.value}</div>`;
      },
      cellStyle: {
        color: "#666",
        fontWeight: "500",
        width: "100%",
        overflow: "hidden",
      },
    },
    {
      headerName: "Actions",
      headerClass: "table-ag-class",
      cellStyle: { display: "flex", alignItems: "center" },
      cellRenderer: (params) => {
        const btnGroup = $('<div class="action-buttons d-flex gap-2"></div>');
        const viewBtn = $(
          '<button class="button view"><i class="bx bx-show"></i></button>'
        );
        const editBtn = $(
          '<button class="button edit"><i class="bx bx-edit"></i></button>'
        );
        const deleteBtn = $(
          '<button class="delete button"><i class="bx bx-trash"></i></button>'
        );

        viewBtn.on("click", () => handleViewStudents(params.data._id));
        editBtn.on("click", () => handleEdit(params.data._id));
        deleteBtn.on("click", () => handleDelete(params.data._id));
        return btnGroup.append(viewBtn, editBtn, deleteBtn)[0];
      },
    },
  ];

  gridOptions = {
    columnDefs: columnDefs,
    rowData: groups,
    animateRows: true,
    pagination: true,
    paginationPageSize: 20,
    rowHeight: 70,
    headerHeight: 45,
    rowSelection: "multiple",
    suppressRowHoverHighlight: true,
    popupParent: document.body,
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
    },
    overlayNoRowsTemplate: '<span class="overoverlayNoRowsTemplates">No Groups found.</span>',
  };

  const gridDiv = document.querySelector("#groupsGrid");

  // Clean up any existing grid instance
  if (gridDiv.api) {
    gridDiv.api.destroy();
  }

  new agGrid.Grid(gridDiv, gridOptions);
  gridDiv.api = gridOptions.api;
  gridDiv.columnApi = gridOptions.columnApi;
}

function handleEdit(groupId) {
  currentGroupId = groupId;

  // Get specific group details
  makeApiCall({
    url: `${GROUP_END_POINT}?id=${groupId}`,
    method: "GET",
    successCallback: function (response) {
      const group = response.data;

      $("#groupName").val(group.name || "");
      $("#groupDescription").val(group.description || "");

      $("#modalTitle").text("Edit Group");
      $("#groupModal").modal("show");
    },
    errorCallback: function (xhr) {
      toastr.error(xhr.responseJSON?.message || "Failed to load group details");
    },
  });
}

function handleDelete(groupId) {
  groupToDelete = groupId;
  $("#deleteConfirmationModal").modal("show");
}

function clearGroupForm() {
  $("#groupForm")[0].reset();
}

function createGroup(groupData) {
  makeApiCall({
    url: GROUP_END_POINT,
    method: "POST",
    data: JSON.stringify(groupData),
    successCallback: function (response) {
      $("#groupModal").modal("hide");
      clearGroupForm();
      loadGroups();
      toastr.success(response.message || "Group created successfully");
      showLoader(false);
    },
    errorCallback: function (xhr) {
      toastr.error(xhr.responseJSON?.message || "Failed to create group");
      showLoader(false);
    },
  });
}

function updateGroup(groupId, groupData) {
  makeApiCall({
    url: `${GROUP_END_POINT}?id=${groupId}`,
    method: "PUT",
    data: JSON.stringify(groupData),
    successCallback: function (response) {
      $("#groupModal").modal("hide");
      clearGroupForm();
      loadGroups();
      toastr.success(response.message || "Group updated successfully");
      showLoader(false);
    },
    errorCallback: function (xhr) {
      toastr.error(xhr.responseJSON?.message || "Failed to update group");
      showLoader(false);
    },
  });
}

function handleViewStudents(groupId) {
  showLoader(true);
  makeApiCall({
    url: `${GROUP_END_POINT}/attenders?id=${groupId}`,
    method: "GET",
    successCallback: function (response) {
      showLoader(false);
      // Create and show modal with students list
      showStudentsModal(response.data);
    },
    errorCallback: function (xhr) {
      showLoader(false);
      toastr.error(xhr.responseJSON?.message || "Failed to load students");
    },
  });
}

function closeStudentPanel() {
  const panel = document.getElementById("viewStudentsPanel");
  const backdrop = document.querySelector(".panel-backdrop");
  panel.classList.remove("open");
  backdrop.classList.remove("show");
  setTimeout(() => {
    panel.remove();
    backdrop.remove();
  }, 300);
}

function showStudentsModal(data) {
  // Create sliding panel HTML
  const slidingPanelHtml = `
    <div class="panel-backdrop"></div>
    <div class="sliding-panel" id="viewStudentsPanel">
      <div class="sliding-panel-content">
        <div class="panel-header">
          <div class="header-content">
            <div class="header-title">
              <i class='bx bx-group'></i>
              <h3>Students in Group</h3>
            </div>
            <button type="button" class="panel-close-btn" onclick="closeStudentPanel()">
              <i class='bx bx-x'></i>
            </button>
          </div>
          <div class="panel-subheader">
            <div class="stats-container">
              <div class="stat-item">
                <span class="stat-label">Total Students</span>
                <span class="stat-value">${data.totalAttenders}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Registered</span>
                <span class="stat-value">${
                  data.attenders.filter(
                    (s) => s.status?.registration === REGISTERED
                  ).length
                }</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Approved</span>
                <span class="stat-value">${
                  data.attenders.filter(
                    (s) => s.status?.registration === APPROVED
                  ).length
                }</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Rejected</span>
                <span class="stat-value">${
                  data.attenders.filter(
                    (s) => s.status?.registration === REJECTED
                  ).length
                }</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Not Registered</span>
                <span class="stat-value">${
                  data.attenders.filter(
                    (s) => s.status?.registration === NOT_REGISTERED
                  ).length
                }</span>
              </div>
            </div>
            <div class="search-container">
              <i class='bx bx-search search-icon'></i>
              <input type="text" id="studentSearch" placeholder="Search students..." />
            </div>
          </div>
        </div>
        <div class="panel-body">
          <div id="studentsGrid" class="ag-theme-alpine" style="width: 100%; height: calc(100vh - 230px);"></div>
        </div>
      </div>
    </div>
  `;

  // Remove existing panel if any
  $("#viewStudentsPanel, .panel-backdrop").remove();

  // Add new panel to body
  $("body").append(slidingPanelHtml);

  // Initialize AG Grid for students
  const gridOptions = {
    columnDefs: [
      {
        headerName: "Name",
        field: "name",
        filter: true,
        valueGetter: (params) => {
          const firstName = params.data.name?.first || "";
          const lastName = params.data.name?.last || "";
          return firstName + " " + lastName;
        },
        flex: 1.2,
        cellRenderer: (params) => {
          return `
            <div class="name-cell">
              <span>${params.value}</span>
            </div>
          `;
        },
      },
      {
        headerName: "Email",
        field: "email",
        flex: 1.5,
        filter : true,
      },
      {
        headerName: "Status",
        field: "status.registration",
        filter: true,
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
                <i class='bx bx-${icon}'></i>
                ${params.value || NOT_REGISTERED}
              </span>
            </div>
          `;
        },
        flex: 1,
      },
      {
        headerName: "",
        cellRenderer: (params) => {
          return `
            <div class="actions-cell">
              <button class="view-details-btn" title="View Details">
                <i class="bx bx-info-circle"></i>
              </button>
            </div>
          `;
        },
        width: 100,
        onCellClicked: (params) => showStudentDetails(params.data),
      },
    ],
    rowData: data.attenders,
    enableFilter: true,
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
    },
    rowHeight: 60,
    headerHeight: 48,
    popupParent: document.querySelector("#viewStudentsPanel"),
    animateRows: true,
    rowClass: "student-row",
    domLayout : "normal",
    suppressMovableColumns: true,
  };

  // Create and render the grid
  new agGrid.Grid(document.getElementById("studentsGrid"), gridOptions);

  // Add search functionality
  $("#studentSearch").on("input", function () {
    gridOptions.api.setQuickFilter($(this).val());
  });

  // Show the panel with a slight delay to trigger transition
  setTimeout(() => {
    document.getElementById("viewStudentsPanel").classList.add("open");
    document.querySelector(".panel-backdrop").classList.add("show");
  }, 50);
}

function showStudentDetails(student) {
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
  // Find group names for each group ID
  const studentGroups =
    student?.groups?.map((group) => {
      const foundGroup = groups.find((g) => g._id === group.groupId);
      return {
        ...group,
        name: foundGroup?.name || "Unknown Group",
      };
    }) || [];

  const detailsHtml = `
    <div class="student-details-modal">
      <div class="details-header">
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
        <button class="close-details" onclick="closeDetailsModal(this)">
          <i class='bx bx-x'></i>
        </button>
      </div>
      <div class="details-content">
        <div class="detail-section">
          <div class="section-header">
            <i class='bx bx-user'></i>
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
            <i class='bx bx-check-shield'></i>
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
            <i class='bx bx-id-card'></i>
            <h5>Crendentials</h5>
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Pass code</span>
              <span class="detail-value">${student?.id1 || "-"}</span>
            </div>
          </div>
        </div>

        ${
          student?.attachments?.length
            ? `
        <div class="detail-section">
          <div class="section-header">
            <i class='bx bx-paperclip'></i>
            <h5>Attachments</h5>
          </div>
          <div class="attachments-grid">
            ${student.attachments
              .map(
                (url) => `
              <div class="attachment-item" onclick="viewAttachment('${url}')">
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

        ${
          studentGroups.length
            ? `
        <div class="detail-section">
          <div class="section-header">
            <i class='bx bx-group'></i>
            <h5>Groups</h5>
          </div>
          <div class="groups-grid">
            ${studentGroups
              .map(
                (group) => `
              <div class="group-item">
                <i class='bx bx-group'></i>
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
      </div>
    </div>
  `;

  // Remove any existing details modal
  $(".student-details-modal").remove();

  // Add new details modal
  $("#viewStudentsPanel .panel-body").append(detailsHtml);

  // Show the modal with animation
  setTimeout(() => {
    $(".student-details-modal").addClass("show");
  }, 50);
}

function renderAttachmentPreview(url) {
  // Remove query parameters before checking the extension
  let urlWithoutQuery = url.split("?")[0].toLowerCase();

  if (urlWithoutQuery.endsWith(".pdf")) {
    return `
      <div class="attachment-preview pdf-preview">
        <i class='bx bxs-file-pdf' style="font-size: 48px; color: #dc3545;"></i>
      </div>
      <span>PDF Document</span>
    `;
  } else {
    return `
      <div class="attachment-preview">
        <img src="${url}" alt="Attachment" onerror="this.src='path/to/default-image.png'"/>
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
          <i class='bx bx-x'></i>
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
          <i class='bx bx-x'></i>
        </button>
        <img src="${url}" alt="Attachment" />
      </div>
    `;
  }

  const viewerHtml = `
    <div class="attachment-viewer">
      <div class="viewer-backdrop"></div>
      ${viewerContent}
    </div>
  `;

  // Remove any existing viewer
  $(".attachment-viewer").remove();

  $("body").append(viewerHtml);
  setTimeout(() => {
    $(".attachment-viewer").addClass("show");
    $(".viewer-backdrop").addClass("show");
  }, 50);
}

function closeAttachmentViewer(btn) {
  const viewer = $(btn).closest(".attachment-viewer");
  const backdrop = viewer.find(".viewer-backdrop");
  viewer.removeClass("show");
  backdrop.removeClass("show");
  setTimeout(() => {
    viewer.remove();
  }, 300);
}

function closeDetailsModal(btn) {
  const modal = $(btn).closest(".student-details-modal");
  modal.removeClass("show");
  setTimeout(() => {
    modal.remove();
  }, 300);
}