let currentStudentId = null;
let gridOptions;
let defaultGroups = [];
let studentToDelete = null;
let allStudents = []; // Store all students for filtering
const defaultAvatar = "../../common/imgs/avatar1.webp";
const defaultIdProof = "../../common/imgs/avatar2.webp";
let studentDataList = 0;
let studentDataFilter = [];
let currentSearchText = ''; // Add this line to store current search text

$(document).ready(function () {
  // Load groups and students on page load
  if (localStorage.getItem("enableGroupCreation") == "true") {
    $(".group-filter").show();
    $(".groups-section").show();
    loadGroups();
  }
  loadStudents();

  // Handle dropdown toggle
  $(".dropdown-header").click(function (e) {
    e.stopPropagation();
    $(".custom-dropdown").toggleClass("open");
  });

  // Close dropdown when clicking outside
  $(document).click(function () {
    $(".custom-dropdown").removeClass("open");
  });

  // Prevent dropdown from closing when clicking inside
  $(".dropdown-container").click(function (e) {
    e.stopPropagation();
  });

  // Handle search input
  $(".search-input").on("input", function () {
    const searchText = $(this).val().toLowerCase();
    $(".dropdown-option").each(function () {
      const text = $(this).text().toLowerCase();
      $(this).toggle(text.includes(searchText));
    });
  });

  // Initialize Select2 for group filter
  $("#groupFilter")
    .select2({
      placeholder: "Group",
      allowClear: true,
      width: "100%",
      minimumResultsForSearch: 0,
      dropdownParent: $(".group-filter"),
      language: {
        noResults: function () {
          return "No groups found";
        },
      },
    })
    .on("select2:opening", function () {
      // Add title to dropdown when opening
      setTimeout(() => {
        const dropdown = $(".select2-dropdown");
        if (!dropdown.find(".select2-dropdown-title").length) {
          dropdown.prepend(
            '<div class="select2-dropdown-title">All Groups</div>'
          );
        }
      }, 0);
    });

  // Add event listener for group filter
  $("#groupFilter").on("change", function () {
    const selectedGroupId = $(this).val();
    filterStudentsByGroup(selectedGroupId);
  });

  // Add event listener for search field
  $("#studentSearch").on("input", function () {
    const searchText = $(this).val().toLowerCase();
    currentSearchText = searchText; // Store the search text
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

  $("#add-new-student").on("click", function () {
    $("#modalTitle").text("Add New Student");
    $(".image-preview-section").hide();
    $("#studentModal").modal("show");
    const groupContainer = $("#studentGroupsContainer");
    groupContainer.empty();
    defaultGroups.forEach((group) => {
      const groupChip = $(` 
        <div class="group-chip"   data-group-id="${
          group._id
        }" data-group-name="${group.name.toLowerCase()}">
          <span class="group-name">${group.name}</span>
          <span class="group-action">
           <i class="fas fa-plus-circle"></i>
          </span>
        </div>
      `);
      groupChip.click(function () {
        $(this).toggleClass("selected");
        const actionIcon = $(this).find(".group-action i");
        if ($(this).hasClass("selected")) {
          // $(this).addClass("selected");
          actionIcon.removeClass("fa-plus-circle").addClass("fa-check-circle");
        } else {
          // $(this).removeClass("selected");
          actionIcon.removeClass("fa-check-circle").addClass("fa-plus-circle");
        }
      });
      groupContainer.append(groupChip);
    });
  });

  // Image preview functionality
  function setupImagePreview() {
    const imageModal = $("#imageModal");
    const expandedImage = $("#expandedImage");
    const closeBtn = $(".image-modal-close");

    // Handle click on preview images
    $(".image-preview").click(function () {
      const img = $(this).find("img");
      const obj = $(this).find("object");
      resetExpandedImage();
      if (img.length > 0) {
        $("#expandedImage").attr("src", img.attr("src")).show();
      } else if (obj.length > 0) {
        $("#expandedImage").replaceWith(
          `<object id="expandedImage" data="${obj.attr("data")}" type="application/pdf" width="90%" height="90%">
            <p>PDF preview not available. <a href="${obj.attr("data")}" target="_blank">Download PDF</a>.</p>
          </object>`
        );
      }
      imageModal.addClass("show");
    });

    // Close modal on clicking close button or outside
    closeBtn.click(() => imageModal.removeClass("show"));
    imageModal.click(function (e) {
      if (e.target === this) {
        imageModal.removeClass("show");
      }
    });

    // Handle file uploads with preview
    $("#faceUpload").on("change", function (e) {
      let file = e.target.files[0];
      if (file) {
        const allowedPhotoTypes = [
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/jpg",
        ];
        if (!allowedPhotoTypes.includes(file.type)) {
          toastr.error(
            "Invalid file type. Please upload an image (PNG, JPG, JPEG, or WEBP)."
          );
          this.value = "";
          return;
        }
        let reader = new FileReader();
        reader.onload = function (e) {
          $("#studentPhoto").attr("src", e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });

    $("#idProofUpload").on("change", function (e) {
      let file = e.target.files[0];
      if (file) {
        const allowedDocTypes = [
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/jpg",
        ];
        if (!allowedDocTypes.includes(file.type)) {
          toastr.error(
            "Invalid file type for document. Please upload a PDF, PNG, JPG, JPEG, or WEBP file."
          );
          this.value = "";
          return;
        }

        if (file.type.startsWith("image/")) {
          let reader = new FileReader();
          reader.onload = function (e) {
            $("#idPreview").html(renderAttachmentPreview(e.target.result, file.type));
          };
          reader.readAsDataURL(file);
        } else if (file.type === "application/pdf") {
          let fileUrl = URL.createObjectURL(file);
          $("#idPreview").html(renderAttachmentPreview(fileUrl, file.type));
        }

      }
    });
  }

  // Call setup function after document ready
  setupImagePreview();

  $("#studentForm").on("submit", async function (e) {
    e.preventDefault();
    showLoader(true);
    const code = localStorage.getItem("collegeCode");
    const studentData = {
      firstName: $("#firstName").val(),
      lastName: $("#lastName").val(),
      email: $("#email").val(),
      id1: $("#id1").val(),
      id2: $("#id2").val(),
      status: {
        registration: $("#registrationStatus").val(),
      },
      face: {
        fileName: "",
        fileType: "",
      },
      attachment: {
        fileName: "",
        fileType: "",
      },
      code,
    };

    if (localStorage.getItem("enableGroupCreation") == "true") {
      const groupIds = getSelectedGroups();
      if (groupIds.length) {
        studentData.groupIds = groupIds;
      }
    }

    const uploadAttenderId = currentStudentId;

    if (currentStudentId) {
      const faceFile = $("#faceUpload")[0].files[0];
      if (faceFile) {
        try {
          const uploadResultFace = await uploadFileForQuestion(
            uploadAttenderId,
            {
              file: faceFile,
            }
          );
          // const signedFaceUrl = await updateUploadedFileWithSignedUrl(
          //   uploadResultFace
          // );
          if (uploadResultFace.url) {
            const parts = faceFile?.name?.split(".");
            const baseName =
              parts?.slice(0, parts.length - 1).join(".") || parts[0];
            const extension = parts[parts.length - 1];
            studentData.face.fileName = baseName;
            studentData.face.fileType = extension;
          }
        } catch (error) {
          toastr.error(
            "Error uploading face image: " +
              (error.responseJSON?.message || error)
          );
          showLoader(false);
          return;
        }
      }

      const docFile = $("#idProofUpload")[0].files[0];
      if (docFile) {
        try {
          const uploadResultDoc = await uploadFileForQuestion(
            uploadAttenderId,
            {
              file: docFile,
            }
          );
          // const signedDocUrl = await updateUploadedFileWithSignedUrl(
          //   uploadResultDoc
          // );
          if (uploadResultDoc.url) {
            const parts = docFile?.name?.split(".");
            const baseName =
              parts?.slice(0, parts.length - 1).join(".") || parts[0];
            const extension = parts[parts.length - 1];
            studentData.attachment.fileName = baseName;
            studentData.attachment.fileType = extension;
          }
        } catch (error) {
          toastr.error(
            "Error uploading document: " +
              (error.responseJSON?.message || error)
          );
          showLoader(false);
          return;
        }
      }

      updateStudent(currentStudentId, studentData);
    } else {
      createStudent(studentData);
    }
  });

  // Reset modal when closed
  $("#studentModal").on("hidden.bs.modal", function () {
    currentStudentId = null;
    clearStudentForm();
    $("#modalTitle").text("Add New Student");
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
    if (studentToDelete) {
      showLoader(true);
      makeApiCall({
        url: `${ATTENDER_END_POINT}?id=${studentToDelete}`,
        method: "DELETE",
        successCallback: function (response) {
          $("#deleteConfirmationModal").modal("hide");
          loadStudents();
          toastr.success("Student deleted successfully", "Removed");
          showLoader(false);
        },
        errorCallback: function (xhr) {
          toastr.error(
            xhr.responseJSON?.message || "Failed to delete student",
            "Error"
          );
          showLoader(false);
        },
      });
    }
    // Reset after operation
    $("#deleteVerification").val("").removeClass("is-invalid");
    studentToDelete = null;
  });

  // Reset delete state when modal closes.
  $("#deleteConfirmationModal").on("hidden.bs.modal", function () {
    $("#deleteVerification").val("").removeClass("is-invalid");
    $("#confirmDeleteBtn").prop("disabled", true);
    studentToDelete = null;
  });
});


function resetExpandedImage() {
  $("#expandedImage").replaceWith('<img id="expandedImage" src="" alt="Expanded view" />');
}

function renderAttachmentPreview(url, fileType) {
  if (!url) {
    return `<img src="${defaultIdProof}" alt="Default ID" class="img-fluid default-id-preview" />`;
  }

  // Always clear previous structure to avoid leftover scrolls from <object>
  if (fileType === "application/pdf") {
    return `
      <div class="attachment-wrapper">
        <object data="${url}" type="application/pdf" width="100%" height="100%">
          <p>PDF preview not available. <a href="${url}" target="_blank">Download PDF</a>.</p>
        </object>
      </div>`;
  }

  // Reset any pdf-related styling when image is uploaded
  return `
    <div class="attachment-wrapperimg">
      <img src="${url}" alt="Attachment" class="img-fluid" />
    </div>`;
}

function handleDelete(studentId) {
  studentToDelete = studentId;
  $("#deleteConfirmationModal").modal("show");
}

function clearStudentForm() {
  $("#studentForm")[0].reset();
  $("#studentPhoto").attr("src", defaultAvatar);
  $("#idPhotoPreview").html(renderAttachmentPreview(null));
}

function handleEdit(studentId) {
  currentStudentId = studentId;
  showLoader(true);

  makeApiCall({
    url: `${ATTENDER_END_POINT}?id=${studentId}`,
    method: "GET",
    successCallback: function (response) {
      const student = response.data;

      // Populate basic data
      $("#firstName").val(student?.name?.first || "");
      $("#lastName").val(student?.name?.last || "");
      $("#email").val(student?.email || "");
      $("#id1").val(student?.id1 || "");
      $("#registrationStatus").val(
        student?.status?.registration || NOT_REGISTERED
      );

      // Update profile photo
      const photoPreview = $("#studentPhoto");
      const faceData = student?.face;
      if (faceData?.length > 0) {
        photoPreview.attr("src", faceData[0]);
      } else {
        photoPreview.attr("src", defaultAvatar);
      }

      // Update the attachment preview
      const idPhotoPreview = $("#idPreview");
      const attachmentData = student?.attachments;
      const attachmentUrl =
        attachmentData && attachmentData[0] && attachmentData[0]
          ? attachmentData[0]
          : null;

      // Update the preview content
      idPhotoPreview.html(renderAttachmentPreview(attachmentUrl));

      // Load and set selected groups
      if (localStorage.getItem("enableGroupCreation") == "true") {
        loadGroupsForEditModal(student?.groups || []);
      }

      $("#modalTitle").text("Edit Student");
      $("#studentModal").modal("show");
      $(".image-preview-section").css("display", "flex");
      showLoader(false);
    },
    errorCallback: function (xhr) {
      toastr.error(
        xhr.responseJSON?.message || "Failed to load student details",
        "Error"
      );
      showLoader(false);
    },
  });
}

function formatGroupOption(group) {
  if (!group.id) {
    return group.text; // Return as is for the placeholder
  }

  const count = $(group.element).data("count");
  return $(`<div class="group-badge">
    ${group.text}
    <span class="group-count">${count || 0}</span>
  </div>`);
}

function formatGroupSelection(group) {
  if (!group.id) {
    return group.text; // Return as is for the placeholder
  }

  const count = $(group.element).data("count");
  return $(`<div class="group-badge">
    ${group.text}
    <span class="group-count">${count || 0}</span>
  </div>`);
}

function loadGroups() {
  makeApiCall({
    url: GROUP_END_POINT + "/list",
    method: "GET",
    successCallback: function (response) {
      const groups = response.data || [];
      const dropdownOptions = $(".dropdown-options");
      defaultGroups = groups;
      // Clear existing options
      dropdownOptions.empty();

      // Add "All" option
      const allOption = $(`
        <div class="dropdown-option selected" data-value="">
          <i class="fas fa-check"></i>
          <span>All</span>
        </div>
      `);

      // Handle "All" option selection
      allOption.click(function () {
        $(".header-text").text("All Groups");
        $(".dropdown-option").removeClass("selected");
        $(this).addClass("selected");
        $(".custom-dropdown").removeClass("open");
        filterStudentsByGroup(""); // Show all students
      });

      dropdownOptions.append(allOption);

      // Add groups
      groups.forEach((group) => {
        const option = $(`
          <div class="dropdown-option" data-value="${group._id}">
            <i class="fas fa-check"></i>
            <span>${group.name}</span>
          </div>
        `);

        // Handle option selection with toggle
        option.click(function () {
          const value = $(this).data("value");
          const text = $(this).find("span").text();

          if ($(this).hasClass("selected")) {
            // If already selected, unselect and show all
            $(".header-text").text("All Groups");
            $(this).removeClass("selected");
            allOption.addClass("selected");
            filterStudentsByGroup("");
          } else {
            // Select this option
            $(".header-text").text(text);
            $(".dropdown-option").removeClass("selected");
            $(this).addClass("selected");
            filterStudentsByGroup(value);
          }

          // Close dropdown
          $(".custom-dropdown").removeClass("open");
        });

        dropdownOptions.append(option);
      });
    },
    errorCallback: function (xhr) {
      toastr.error(
        xhr.responseJSON?.message || "Failed to load groups",
        "Error"
      );
    },
  });
}

function loadStudents() {
  showLoader(true);
  makeApiCall({
    url: ATTENDER_END_POINT,
    method: "GET",
    successCallback: function (response) {
      allStudents = response.data; // Store all students
      renderStudents(response.data);
      studentDataList = response.data.length;
      studentDataFilter = response.data;
      
      // Apply the current search filter after loading new data
      if (gridOptions && gridOptions.api && currentSearchText) {
        gridOptions.api.setQuickFilter(currentSearchText);
      }
      
      showLoader(false);
    },
    errorCallback: function (xhr) {
      toastr.error(
        xhr.responseJSON?.message || "Failed to load students",
        "Error"
      );
      showLoader(false);
    },
  });
}

function filterStudentsByGroup(groupId) {
  if (!groupId) {
    // If no group selected or unselected, show all students
    renderStudents(allStudents);
    return;
  }

  // Filter students by group
  const filteredStudents = allStudents.filter(
    (student) =>
      student.groups &&
      student.groups.some((group) => group.groupId === groupId)
  );

  renderStudents(filteredStudents);
}

function renderStudents(students) {
  const columnDefs = [
    {
      headerName: "Name",
      field: "name",
      headerClass: "table-ag-class",
      filter: true,
      valueGetter: (params) => {
        const first = params.data?.name?.first || "-";
        const last = params.data?.name?.last || "";
        return `${first} ${last}`.trim();
      },
      cellStyle: {
        border:"none",
        fontWeight: "500",
        display: "flex",
        alignItems: "center",
        color: "#666",
      },
    },
    {
      headerName: "Email",
      field: "email",
      headerClass: "table-ag-class",
      filter: true,
      cellStyle: {
        color: "#2980b9",
        display: "flex",
        alignItems: "center",
        fontWeight: "500",
        border:"none",
      },
      flex: 1.5,
    },
    {
      headerName: "PassCode",
      field: "id1",
      headerClass: "table-ag-class",
      filter: true,
      cellStyle: {
        fontFamily: "'Courier New', monospace",
        color: "#666",
        display: "flex",
        alignItems: "center",
        fontWeight: "500",
        border:"none",
      },
      flex: 0.6,
    },
    {
      headerName: "Last Login",
      field: "lastLogin",
      headerClass: "table-ag-class",
      filter: true,
      valueFormatter: (params) => {
        return params.value ? new Date(params.value).toLocaleString() : "-";
      },
      cellStyle: {
        color: "#666",
        display: "flex",
        alignItems: "center",
        fontWeight: "500",
        border:"none",
      },
    },
    {
      headerName: "Created At",
      field: "createdAt",
      headerClass: "table-ag-class",
      filter: "agTextColumnFilter",
      valueGetter: (params) => dateValueGetter(params, "createdAt"),
      valueFormatter: (params) => params.value || "-",
      cellStyle: {
        display: "flex",
        alignItems: "center",
        color: "#666",
        fontWeight: "500",
        border: "none",
      },
      filterParams: {
        textFormatter: (val) => val?.toLowerCase().trim(),
        debounceMs: 100,
        textCustomComparator: (filter, value, filterText) => {
          return value?.toLowerCase().includes(filterText.toLowerCase());
        }
      }
    },
    {
      headerName: "Modified At",
      field: "updatedAt",
      headerClass: "table-ag-class",
      filter: "agTextColumnFilter",
      valueGetter: (params) => dateValueGetter(params, "updatedAt"),
      valueFormatter: (params) => params.value || "-",
      cellStyle: {
        display: "flex",
        alignItems: "center",
        color: "#666",
        fontWeight: "500",
        border: "none",
      },
      filterParams: {
        textFormatter: (val) => val?.toLowerCase().trim(),
        debounceMs: 100,
        textCustomComparator: (filter, value, filterText) => {
          return value?.toLowerCase().includes(filterText.toLowerCase());
        }
      }
    },
    {
      headerName: "Registration Status",
      field: "status.registration",
      headerClass: "table-ag-class",
      filter: true,
      cellRenderer: (params) => {
        const status =
          params.data.status.registration?.toLowerCase() || "pending";
        const studentId = params.data._id;

        setTimeout(() => {
          $(`.approve-btn[data-id="${studentId}"]`)
            .off("click")
            .on("click", () => {
              const studentData = {
                email: params.data?.email,
                status: { registration: "APPROVED" },
              };
              updateStudent(studentId, studentData);
            });

          $(`.reject-btn[data-id="${studentId}"]`)
            .off("click")
            .on("click", () => {
              const studentData = {
                email: params.data?.email,
                status: { registration: "REJECTED" },
              };
              updateStudent(studentId, studentData);
            });
        }, 0);

        if (status === "approved") {
          return `
          <div class="action-container">
            <div class="action-menu-main">
              <span class="status-badge status-${status} ar-toggle-pop">${status}</span>
            </div>
            <div class="action-dropdown">
              <div class="reject-btn Reject py-1" data-id="${studentId}">Reject <i class='bx bx-x'></i></div>
            </div>
          </div>
          `;
        }

        if (status === "registered") {
          return `
          <div class="action-container">
            <div class="action-menu-main">
              <span class="status-badge status-${status} ar-toggle-pop">${status}</span>
            </div>
            <div class="action-dropdown">
              <div class="approve-btn py-1 Approve" data-id="${studentId}">Approve <i class='bx bx-check'></i></div>
              <div class="reject-btn py-1 Reject" data-id="${studentId}">Reject <i class='bx bx-x'></i></div>
            </div>
          </div>
          `;
        }

        return `<span class="status-badge status-${status} ar-toggle-pop">${status}</span>`;
      },
      cellStyle: {
        display: "flex",
        alignItems: "center",
        color: "#666",
        fontWeight: "500",
        border:"none",
      },
    },
    {
      headerName: "Actions",
      headerClass: "table-ag-class",
      cellStyle: { display: "flex", alignItems: "center", border:"none" },
      cellRenderer: (params) => {
        const btnGroup = $('<div class="action-buttons d-flex gap-2"></div>');
        const editBtn = $(
          '<button class="button edit"><i class="fas fa-edit"></i></button>'
        );
        const deleteBtn = $(
          '<button class="delete button"><i class="fas fa-trash"></i></button>'
        );

        editBtn.on("click", () => handleEdit(params.data._id));
        deleteBtn.on("click", () => handleDelete(params.data._id));
        return btnGroup.append(editBtn, deleteBtn)[0];
      },
    },
  ];

  gridOptions = {
    columnDefs: columnDefs,
    rowData: students,
    animateRows: true,
    pagination: true,
    paginationPageSize: 100,
    paginationPageSizeSelector:true,
    enableFilter: true,
    rowHeight: 70,
    headerHeight: 45,
    popupParent: document.body,
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
    },
    domLayout : "normal",
    overlayNoRowsTemplate: '<span class="overoverlayNoRowsTemplates">No students found.</span>',
    suppressColumnVirtualisation: true,
  };

  const gridDiv = document.querySelector("#studentsGrid");

  // Clean up any existing grid instance
  if (gridDiv.api) {
    gridDiv.api.destroy();
  }

  new agGrid.Grid(gridDiv, gridOptions);
  gridDiv.api = gridOptions.api;
  gridDiv.columnApi = gridOptions.columnApi;

  // Ensure overlay is hidden at load
setTimeout(() => {
  if (students.length === 0) {
    gridOptions.api.showNoRowsOverlay();
  } else {
    gridOptions.api.hideOverlay();
  }
}, 50);
}

function updateStudent(id, studentData) {
  makeApiCall({
    url: `${ATTENDER_END_POINT}?id=${id}&email=${studentData?.email}`,
    method: "PUT",
    data: JSON.stringify({ ...studentData, id }),
    successCallback: function (response) {
      $("#studentModal").modal("hide");
      clearStudentForm();
      loadStudents();
      toastr.success("Student details updated", "Success");
      showLoader(false);
    },
    errorCallback: function (xhr) {
      toastr.error(
        xhr.responseJSON?.message || "Failed to update student",
        "Error"
      );
      showLoader(false);
    },
  });
}

function validateUserExits(studentData){
  return studentDataFilter.some(user=>user.email === studentData.email)
}

function createStudent(studentData) {
  if(validateUserExits(studentData)){
    showLoader(false);
    return toastr.error("Already User Exits")
  }
  else  makeApiCall({
    url: ATTENDER_END_POINT,
    method: "POST",
    data: JSON.stringify(studentData),
    successCallback: function (response) {
      $("#studentModal").modal("hide");
      clearStudentForm();
      loadStudents();
      const name = `${studentData.firstName} ${studentData.lastName}`.trim();
      toastr.success(`Student ${name} created`, "Success");
      showLoader(false);
    },
    errorCallback: function (xhr) {
      toastr.error(
        xhr.responseJSON?.message || "Failed to create student",
        "Error"
      );
      showLoader(false);
    },
  });
}

$(document).on("mouseenter", ".action-container", function (e) {
  e.stopPropagation();
  const $menu = $(this).find(".action-menu-main");
  const dropdown = $menu.siblings(".action-dropdown");
  const row = $(this).closest(".ag-row");
  const totalRows = studentDataList;
  const rowIndex = row.index();

  $(".action-dropdown").not(dropdown).removeClass("active").hide();
  $(".ag-row").removeClass("has-open-dropdown");

  if (dropdown.is(":visible")) {
    dropdown.removeClass("active").hide();
    row.removeClass("has-open-dropdown");
  } else if (totalRows <= rowIndex) {
    dropdown.css({
      top: 30,
      right: 155,
      zIndex: 9999,
    });
    dropdown.addClass("active").show();
    row.addClass("has-open-dropdown");
  } else {
    dropdown.css({
      top: 30,
      right: 155,
      zIndex: 9999,
    });
    dropdown.addClass("active").show();
    row.addClass("has-open-dropdown");
  }
});

$(document).on("mouseleave", ".action-container", function (e) {
  e.stopPropagation();
  const dropdown = $(this).siblings(".action-dropdown");
  const row = $(this).closest(".ag-row");
  $(".action-dropdown").not(dropdown).removeClass("active").hide();
  $(".ag-row").removeClass("has-open-dropdown");
  dropdown.removeClass("active").hide();
  row.removeClass("has-open-dropdown");
});

function loadGroupsForEditModal(selectedGroups = []) {
  makeApiCall({
    url: GROUP_END_POINT + "/list",
    method: "GET",
    successCallback: function (response) {
      const groups = response.data || [];
      const groupContainer = $("#studentGroupsContainer");
      groupContainer.empty();

      groups.forEach((group) => {
        const isSelected = selectedGroups.some(
          (sg) => sg.groupId === group._id
        );
        const groupChip = $(`
          <div class="group-chip ${
            isSelected ? "selected" : ""
          }" data-group-id="${
          group._id
        }" data-group-name="${group.name.toLowerCase()}">
            <span class="group-name">${group.name}</span>
            <span class="group-action">
              ${
                isSelected
                  ? '<i class="fas fa-check-circle"></i>'
                  : '<i class="fas fa-plus-circle"></i>'
              }
            </span>
          </div>
        `);

        groupChip.click(function () {
          $(this).toggleClass("selected");
          const actionIcon = $(this).find(".group-action i");
          if ($(this).hasClass("selected")) {
            actionIcon
              .removeClass("fa-plus-circle")
              .addClass("fa-check-circle");
          } else {
            actionIcon
              .removeClass("fa-check-circle")
              .addClass("fa-plus-circle");
          }
        });

        groupContainer.append(groupChip);
      });

      // Initialize search functionality
      initializeGroupSearch();
    },
    errorCallback: function (xhr) {
      toastr.error(
        xhr.responseJSON?.message || "Failed to load groups",
        "Error"
      );
    },
  });
}

$("#groupSearchInput").on("input", function () {
  const searchText = $(this).val().toLowerCase().trim();

  // Re-fetch group chips each time input changes
  const groupChips = $(".group-chip");

  groupChips.each(function () {
    const groupName = $(this).data("group-name");
    if (groupName.includes(searchText)) {
      $(this).removeClass("filtered-out");
    } else {
      $(this).addClass("filtered-out");
    }
  });

  // Show "no results" message if no matches
  const visibleGroups = groupChips.not(".filtered-out").length;
  let noResultsMsg = $("#noGroupResults");

  if (visibleGroups === 0 && searchText !== "") {
    if (noResultsMsg.length === 0) {
      noResultsMsg = $(`
        <div id="noGroupResults" class="text-muted text-center w-100 py-2">
          No matching groups found
        </div>`);
      $("#studentGroupsContainer").append(noResultsMsg);
    }
    noResultsMsg.show();
  } else {
    noResultsMsg.hide();
  }
});


function initializeGroupSearch() {
  const searchInput = $("#groupSearchInput");
  const groupChips = $(".group-chip");

  // Clear search on modal close
  $("#studentModal").on("hidden.bs.modal", function () {
    searchInput.val("");
    groupChips.removeClass("filtered-out");
  });

  // Handle search input
  searchInput.on("input", function () {
    const searchText = $(this).val().toLowerCase().trim();

    groupChips.each(function () {
      const groupName = $(this).data("group-name");
      if (groupName.includes(searchText)) {
        $(this).removeClass("filtered-out");
      } else {
        $(this).addClass("filtered-out");
      }
    });

    // Show "no results" message if no matches
    const visibleGroups = groupChips.not(".filtered-out").length;
    let noResultsMsg = $("#noGroupResults");

    if (visibleGroups === 0 && searchText !== "") {
      if (noResultsMsg.length === 0) {
        noResultsMsg = $(
          '<div id="noGroupResults" class="text-muted text-center w-100 py-2">No matching groups found</div>'
        );
        $("#studentGroupsContainer").append(noResultsMsg);
      }
      noResultsMsg.show();
    } else {
      noResultsMsg.hide();
    }
  });

  // Add keyboard navigation
  searchInput.on("keydown", function (e) {
    const visibleChips = $(".group-chip:not(.filtered-out)");
    const focused = $(".group-chip.focused");

    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        if (focused.length === 0) {
          visibleChips.first().addClass("focused");
        } else {
          const next = focused.nextAll(":not(.filtered-out)").first();
          if (next.length) {
            focused.removeClass("focused");
            next.addClass("focused");
          }
        }
        break;

      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        if (focused.length === 0) {
          visibleChips.last().addClass("focused");
        } else {
          const prev = focused.prevAll(":not(.filtered-out)").first();
          if (prev.length) {
            focused.removeClass("focused");
            prev.addClass("focused");
          }
        }
        break;

      case "Enter":
        e.preventDefault();
        if (focused.length) {
          focused.click();
        }
        break;

      case "Escape":
        e.preventDefault();
        $(this).val("").trigger("input");
        $(".group-chip").removeClass("focused");
        break;
    }
  });

  // Remove focus when clicking outside
  $(document).click(function (e) {
    if (!$(e.target).closest(".groups-section").length) {
      $(".group-chip").removeClass("focused");
    }
  });
}

function getSelectedGroups() {
  return $(".group-chip.selected")
    .map(function () {
      return $(this).data("group-id");
    })
    .get();
}
