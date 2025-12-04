let accountId;
let attenderId;
let collegeCode;
let collegeName;
let courseData = [];
let allProgramData = [];
let certData = [];
let courseGridInitialized = false;
let programId = 0;
let selectedCourseIds = [];
let selectedProgramIds = [];
let url;
let templates = [];

const CourseUI = {
  formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) return "";
    return date.toISOString().split("T")[0];
  },

  getTodayFormatted() {
    return this.formatDate(new Date());
  },

  getTomorrowFormatted() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.formatDate(tomorrow);
  },

  initializeTabs() {

    $("#course-tab").addClass("active");
    $("#course-content").addClass("show active");

    $(".course-grade-tab")
      .off("click")
      .on("click", function () {
        $(".course-grade-tab").removeClass("active");
        $(this).addClass("active");

        const targetId = $(this).data("target");
        $(".course-grade-content").removeClass("show active");
        $(targetId).addClass("show active");
      });
  },

  initializeDirectTabs() {
    $(".course-grade-content[id$='-direct']").hide();
    $("#course-content-direct").show();

    $(".course-grade-tab[id$='-direct']").removeClass("active");
    $("#course-tab-direct").addClass("active");

    $(".course-grade-tab[id$='-direct']")
      .off("click")
      .on("click", function () {
        $(".course-grade-tab[id$='-direct']").removeClass("active");
        $(this).addClass("active");

        const targetId = $(this).data("target");
        $(".course-grade-content[id$='-direct']").hide();
        $(targetId).show();
      });
  },

  setupCourseTabContent(suffix = "direct") {
    const targetId = `#course-content-${suffix}`;

    const courseTabContent = `
      <div class="course-card">
        <div class="course-management-header">
          <div class="course-management-body">
            <div class="search-input">
              <i class="bx bx-search-alt search-icon-abs"></i>
              <input type="text" id="courses-grid-search-${suffix}" class="form-control search-input-pad" placeholder="Search courses...">
              <button id="clear-courses-search-${suffix}" class="btn btn-sm clear-search-btn">
                <i class="bx bx-x"></i>
              </button>
            </div>
            <button id="add-course-btn-${suffix}" class="add-course-button">
              <i class="bx bx-plus-circle"></i> Create Course
            </button>
          </div>
        </div>

        <div id="course-system-display-${suffix}" class="course-system-display">
          <div id="courses-container-${suffix}">
          </div>
        </div>
      </div>
    `;

    $(targetId).html(courseTabContent);

    $(`#add-course-btn-${suffix}`).on("click", () =>
      CourseController.showCourseForm()
    );
  },

  showCourseForm(course = null) {
    $(".course-form-container").remove();

    const isEdit = course !== null;
    const formTitle = isEdit ? "Edit Course" : "Add New Course";
    const saveButtonText = isEdit ? "Update Course" : "Save Course";

    const courseCode = isEdit ? course.code : "";
    const courseName = isEdit ? course.name : "";
    const startDateFormatted =
      isEdit && course.startDate
        ? this.formatDate(new Date(course.startDate))
        : this.getTodayFormatted();

    const endDateFormatted =
      isEdit && course.endDate
        ? this.formatDate(new Date(course.endDate))
        : this.getTomorrowFormatted();

    selectedProgramIds = [];
    if (isEdit) {
      selectedProgramIds = course.programs
        .map((program) => {
          const id = program._id;
          const matched = allProgramData.find((program) => program._id === id);
          return matched ? { _id: matched._id, name: matched.name } : null;
        })
        .filter(Boolean);
    }

    const courseForm = `
      <div class="course-form-container">
        <div class="course-form">
          <div class="course-form-header">
            <h5>${formTitle}</h5>
          </div>
          <div class="course-form-body">
            <div class="form-row">
              <div class="form-group">
                <div class="piece">
                  <div class="lal" for="course-code">Course Code <span class="text-danger">*</span></div>
                  <input type="text" id="course-code" class="form-input" placeholder="e.g., 101ca" value="${courseCode}" required>

                  <div class="lal" for="course-name">Course Name <span class="text-danger">*</span></div>
                  <input type="text" id="course-name" class="form-input" placeholder="e.g., Mathematics" value="${courseName}" required>

                  <div class="dates d-flex">
                    <div class="date-field">
                      <div class="lal" for="course-start-date">Start Date <span class="text-danger">*</span></div>
                      <input type="date" id="course-start-date" class="dates-input" value="${startDateFormatted}" required>
                    </div>
                    <div class="date-field">
                      <div class="lal" for="course-end-date">End Date <span class="text-danger">*</span></div>
                      <input type="date" id="course-end-date" class="dates-input" value="${endDateFormatted}" required>
                    </div>
                  </div>
                </div>
                <div class="piece">
                  <div class="d-flex align-items-center gap-3 justify-content-between">
                    <div class="lal" for="course-map-program">Programs</div>

                    <div class="program-map-container position-relative">
                      <div class="position-relative">
                        <input type="text" id="course-program-name" class="form-input pl-5" placeholder="Search Programs">
                        <i class="bx bx-search search-icon"></i>
                      </div>
                      <div id="course-program-search-dropdown" class="course-search-dropdown"></div>
                    </div>
                  </div>

                  <div id="selected-program-badges" class="mt-2 d-flex gap-2"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="course-form-footer">
            <button id="cancel-course-form" class="btn-cancel">Cancel</button>
            <button id="save-course" class="btn-save" data-is-edit="${isEdit}" ${
      isEdit ? `data-course-id="${course._id}"` : ""
    }>${saveButtonText}</button>
          </div>
        </div>
      </div>
    `;

    $("body").append(courseForm);

    this.renderSelectedProgramBadges();

    this.setupCourseFormEventHandlers();

    setTimeout(() => {
      $("#course-code").focus();
    }, 100);
  },

  renderSelectedProgramBadges() {
    const $badgeContainer = $("#selected-program-badges");
    $badgeContainer.empty();

    selectedProgramIds.forEach((program) => {
      $badgeContainer.append(`
        <span class="program-badge" data-id="${program._id}">
          ${program.name}
          <span class="remove-program">×</span>
        </span>
      `);
    });
  },

  setupCourseFormEventHandlers() {
    $("#selected-program-badges")
      .off("click", ".remove-program")
      .on("click", ".remove-program", function () {
        const badge = $(this).closest(".program-badge");
        const idToRemove = badge.data("id");
        selectedProgramIds = selectedProgramIds.filter(
          (program) => program._id !== idToRemove
        );
        badge.remove();
      });

    $("#cancel-course-form")
      .off("click")
      .on("click", () => {
        $(".course-form-container").remove();
      });

    $("#save-course")
      .off("click")
      .on("click", function () {
        const isEdit =
          $(this).data("is-edit") === true ||
          $(this).data("is-edit") === "true";
        const courseId = $(this).data("course-id");
        CourseController.saveAndUpdateCourse(isEdit, courseId);
      });
  },

  showError(message) {
    const errorElement = $(".course-form .error-message");
    if (errorElement.length === 0) {
      $(".course-form-body").prepend(
        `<div class="error-message text-danger mb-3">${message}</div>`
      );
    } else {
      errorElement.text(message);
    }
  },

  setupCourseSearch(suffix = "") {
    const searchInputId = `courses-grid-search${suffix ? "-" + suffix : ""}`;
    const clearButtonId = `clear-courses-search${suffix ? "-" + suffix : ""}`;
    const gridId = `coursesGrid${suffix ? suffix : ""}`;

    if (!$(`#${searchInputId}`).length) {
      return;
    }

    const gridDiv = document.getElementById(gridId);
    if (!gridDiv) {
      console.error(`Grid #${gridId} not found for search setup`);
      return;
    }

    if (!gridDiv.api) {
      setTimeout(() => this.setupCourseSearch(suffix), 200);
      return;
    }

    let searchTimeout;
    $(`#${searchInputId}`)
      .off("input")
      .on("input", function () {
        clearTimeout(searchTimeout);
        const searchValue = $(this).val();

        searchTimeout = setTimeout(() => {
          try {
            if (searchValue) {
              const filterModel = {
                name: {
                  type: "contains",
                  filter: searchValue,
                },
              };
              gridDiv.api.setFilterModel(filterModel);
            } else {
              gridDiv.api.setFilterModel(null);
            }
          } catch (err) {
            console.error("Error applying filter:", err);
          }
        }, 300);
      });

    $(`#${clearButtonId}`)
      .off("click")
      .on("click", function () {
        $(`#${searchInputId}`).val("");
        try {
          gridDiv.api.setFilterModel(null);
        } catch (err) {
          console.error(`Error clearing filter for ${gridId}:`, err);
        }
      });
  },

  displayCourses(courseData, suffix) {
    const containerId = `courses-container${suffix ? "-" + suffix : ""}`;
    const coursesContainer = $(`#${containerId}`);

    coursesContainer.empty();

    if (!courseData || courseData.length === 0) {
      this.ensureNoCourseMessage();
      return;
    }

    const gridId = `coursesGrid${suffix ? suffix : ""}`;

    coursesContainer.html(`
      <div class="ag-grid-scroll-wrapper">
        <div class="ag-theme-alpine" id="${gridId}"></div>
        <div id="${gridId}-no-data" class="course-no-data-found-msg">
          No Course found
        </div>
      </div>
    `);

    this.initializeAgGrid(gridId, courseData, suffix);
  },

  initializeAgGrid(gridId, courseData, suffix) {
    const gridDiv = document.getElementById(gridId);
    if (!gridDiv) {
      console.error(`Grid div #${gridId} not found in initializeAgGrid`);
      return;
    }

    const columnDefs = [
      {
        field: "code",
        headerName: "Course Code",
        flex: 2,
        minWidth: 200,
        filter: true,
      },
      {
        field: "name",
        headerName: "Course Name",
        flex: 2,
        minWidth: 200,
        filter: true,
      },
      {
        field: "startDate",
        headerName: "Start Date",
        flex: 2,
        minWidth: 200,
        filter: true,
        valueFormatter: (params) =>
          params.value ? new Date(params.value).toLocaleDateString() : "",
      },
      {
        field: "endDate",
        headerName: "End Date",
        flex: 2,
        minWidth: 200,
        filter: true,
        valueFormatter: (params) =>
          params.value ? new Date(params.value).toLocaleDateString() : "",
      },
      {
        field: "actions",
        headerName: "Actions",
        minWidth: 150,
        sortable: false,
        filter: false,
        cellRenderer: function (params) {
          return `
            <div class="d-flex gap-3 justify-content-center w-100">
              <button class="edit-course-btn" data-index="${params.data.index}">
                <i class="bx bx-edit"></i>
              </button>
              <button class="delete-course-btn" data-index="${params.data.index}">
                <i class="bx bx-trash"></i>
              </button>
            </div>
          `;
        },
      },
    ];

    const rowData = courseData.map((course, index) => ({
      id: course._id,
      code: course.code,
      name: course.name,
      startDate: course.startDate,
      endDate: course.endDate,
      index: index,
    }));

    try {
      const gridOptions = {
        columnDefs: columnDefs,
        rowData: rowData,
        pagination: true,
        paginationPageSize: 20,
        defaultColDef: {
          flex: 1,
          minWidth: 100,
          resizable: true,
          sortable: true,
          filter: true,
        },
        overlayNoRowsTemplate:
          '<span class="overlayNoRowsTemplate">No Course found.</span>',
        domLayout: "autoHeight",
        suppressColumnVirtualisation: true,

        onGridReady: (params) => {
          gridDiv.api = params.api;

          if (suffix === "direct") {
            setTimeout(() => {
              this.setupCourseSearch(suffix);
            }, 200);
          }

          if (rowData.length === 0) {
            params.api.showNoRowsOverlay();
          } else {
            params.api.hideOverlay();
          }
        },

        onModelUpdated: (params) => {
          const rowCount = params.api.getDisplayedRowCount();
          if (rowCount === 0) {
            params.api.showNoRowsOverlay();
          } else {
            params.api.hideOverlay();
          }
        },
      };

      new agGrid.Grid(gridDiv, gridOptions);

      $(`#${gridId}`)
        .off("click")
        .on("click", function (e) {
          if ($(e.target).closest(".edit-course-btn").length) {
            const index = $(e.target).closest(".edit-course-btn").data("index");
            CourseController.editCourse(index);
          }

          if ($(e.target).closest(".delete-course-btn").length) {
            const index = $(e.target)
              .closest(".delete-course-btn")
              .data("index");
            CourseController.deleteCourse(index);
          }
        });
    } catch (err) {
      console.error("Error initializing AG Grid:", err);
    }
  },

  ensureNoCourseMessage() {
    const coursesContainer = $("#courses-container-direct");
    coursesContainer.empty(); // Clear any previous content
    coursesContainer.html(`
      <div id="coursesGrid-no-data" class="no-data-found-msg">
        <i class="bx bx-info-circle"></i>
        <p>No Courses yet.</p>
        <small>Click the "Create Course" button to Create.</small>
      </div>
    `);
  },

  showDeleteConfirmDialog(course, onConfirm) {
    const confirmDialog = `
      <div class="confirm-dialog-container">
        <div class="confirm-dialog">
          <div class="confirm-dialog-header">
            <h5>Confirm Deletion</h5>
          </div>
          <div class="confirm-dialog-body">
            <p>Are you sure you want to delete the course "${course.name}"? This action cannot be undone.</p>
          </div>
          <div class="confirm-dialog-footer">
            <button id="cancel-delete-course" class="btn-cancel">Cancel</button>
            <button id="confirm-delete-course" class="btn-delete" data-course-id="${course._id}">Delete</button>
          </div>
        </div>
      </div>
    `;

    $("body").append(confirmDialog);

    $("#cancel-delete-course").on("click", () => {
      $(".confirm-dialog-container").remove();
    });

    $("#confirm-delete-course").on("click", function () {
      const courseId = $(this).data("course-id");
      onConfirm(courseId);
      $(".confirm-dialog-container").remove();
    });
  },
};

const CourseController = {
  init() {
    accountId = localStorage.getItem("accountId");
    CourseUI.initializeDirectTabs();
    CourseUI.setupCourseTabContent("direct");
    setTimeout(() => {
      this.loadCourseData("direct");
    }, 1000);

    this.setupProgramSearch();
  },

  setupProgramSearch() {
    $(document).on("input", "#course-program-name", function () {
      const query = $(this).val().toLowerCase();
      const dropdown = $("#course-program-search-dropdown");
      dropdown.empty();

      if (!query) return;

      const matched = allProgramData.filter(
        (program) =>
          program.name.toLowerCase().includes(query) &&
          !selectedProgramIds.some(
            (selectprogram) => selectprogram._id === program._id
          )
      );

      matched.forEach((program) => {
        dropdown.append(`
          <div class="course-dropdown-item" data-id="${program._id}" data-name="${program.name}">
            ${program.name}
          </div>
        `);
      });
    });

    $(document).on(
      "click",
      "#course-program-search-dropdown .course-dropdown-item",
      function () {
        const programId = $(this).data("id");
        const programName = $(this).data("name");

        if (!selectedProgramIds.find((program) => program._id === programId)) {
          selectedProgramIds.push({ _id: programId, name: programName });
          CourseUI.renderSelectedProgramBadges();
        }

        $("#course-program-search-dropdown").empty();
        $("#course-program-name").val("");
      }
    );
  },

  loadCourseData(suffix) {
    showLoader(true);
    CourseService.fetchCourses(
      accountId,
      (data) => {
        courseData = data;
        if (courseData.length === 0) {
          CourseUI.ensureNoCourseMessage();
        } else {
          CourseUI.displayCourses(courseData, suffix);
        }
        showLoader(false);
      },
      (error) => {
        displayToast("Failed to load courses", "error");
        showLoader(false);
      }
    );
  },

  showCourseForm(course = null) {
    CourseUI.showCourseForm(course);
  },

  editCourse(index) {
    const course = courseData[index];
    if (!course) {
      displayToast("Course not found", "error");
      return;
    }
    this.showCourseForm(course);
  },

  deleteCourse(index) {
    const course = courseData[index];
    if (!course) {
      displayToast("Course not found", "error");
      return;
    }

    CourseUI.showDeleteConfirmDialog(course, (courseId) => {
      showLoader(true);
      CourseService.deleteCourse(
        accountId,
        courseId,
        () => {
          displayToast("Course Deleted successfully", "success");
          this.loadCourseData("direct");
          showLoader(false);
        },
        (error) => {
          displayToast("Failed to delete course. Please try again.", "error");
          showLoader(false);
        }
      );
    });
  },

  saveAndUpdateCourse(isEdit = false, courseId = null) {
    const courseName = $("#course-name").val().trim();
    const code = $("#course-code").val().trim();
    const startDate = $("#course-start-date").val();
    const endDate = $("#course-end-date").val();

    if (!courseName) {
      CourseUI.showError("Course name is required");
      return;
    }

    if (!code) {
      CourseUI.showError("Course code is required");
      return;
    }

    if (courseData && courseData.length > 0) {
      const isDuplicate = courseData.some((course) => {
        const isSameCourse = isEdit && course._id === courseId;
        const sameName = course.name.toLowerCase() === courseName.toLowerCase();
        const sameCode = course.code.toLowerCase() === code.toLowerCase();

        if (!isSameCourse && (sameName || sameCode)) {
          if (sameName) {
            CourseUI.showError("A course with this name already exists");
          } else if (sameCode) {
            CourseUI.showError("A course with this code already exists");
          }
          return true;
        }
        return false;
      });

      if (isDuplicate) return;
    }

    const $saveButton = $("#save-course");
    $saveButton
      .prop("disabled", true)
      .html(
        '<i class="bx bx-loader bx-spin me-2"></i>' +
          (isEdit ? "Updating..." : "Saving...")
      );

    showLoader(true);

    const payload = {
      code,
      courseName,
      startDate,
      endDate,
    };

    if (Array.isArray(selectedProgramIds) && selectedProgramIds.length > 0) {
      payload.programs = selectedProgramIds.map((program) => ({
        _id: program._id,
      }));
    }

    if (isEdit && courseId) {
      payload._id = courseId;
    }

    CourseService.saveOrUpdateCourse(
      accountId,
      payload,
      isEdit,
      () => {
        const successMessage = isEdit
          ? "Course Updated Successfully"
          : "Course Added Successfully";
        displayToast(successMessage, "success");
        $(".course-form-container").remove();
        this.loadCourseData("direct");
        showLoader(false);
      },
      (error) => {
        const errorMessage = isEdit
          ? "Updating Course failed"
          : "Adding Course failed";
        displayToast(errorMessage, "error");
        CourseUI.showError(
          `Failed to ${isEdit ? "update" : "add"} course. Please try again.`
        );
        $saveButton
          .prop("disabled", false)
          .html(isEdit ? "Update Course" : "Save Course");
        showLoader(false);
      }
    );
  },
};

const CourseService = {
  fetchCourses(accountId, successCallback, errorCallback) {
    makeApiCall({
      url: `${base_url}/account/course?accountId=${accountId}`,
      method: "GET",
      successCallback: (response) => {
        successCallback(response.data);
      },
      errorCallback: (error) => {
        console.error("Failed to load courses", error);
        errorCallback(error);
      },
    });
  },

  deleteCourse(accountId, courseId, successCallback, errorCallback) {
    makeApiCall({
      url: `${base_url}/account/course?accountId=${accountId}&courseId=${courseId}`,
      method: "DELETE",
      successCallback,
      errorCallback: (error) => {
        console.error("Error deleting course:", error);
        errorCallback(error);
      },
    });
  },

  saveOrUpdateCourse(
    accountId,
    courseData,
    isEdit,
    successCallback,
    errorCallback
  ) {
    const courseId = isEdit ? courseData._id : null;
    const url = isEdit
      ? `${base_url}/account/course?accountId=${accountId}&courseId=${courseId}`
      : `${base_url}/account/course?accountId=${accountId}`;

    makeApiCall({
      url: url,
      method: "PUT",
      data: JSON.stringify(courseData),
      successCallback,
      errorCallback: (error) => {
        console.error(`Error ${isEdit ? "updating" : "adding"} course:`, error);
        errorCallback(error);
      },
    });
  },
};
