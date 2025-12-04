const GradeUI = {
  setupInitialLayout(onAddGrade) {
    const gradeTabContent = `
      <div class="d-flex justify-content-end align-items-center mb-4">
        <button id="add-grade-btn" class="add-grade-button">
          <i class="bx bx-plus-circle me-2"></i> Create Grade
        </button>
      </div>

      <div id="grades-container">
        <div class="text-center p-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>`;
    $("#grade-content-direct").html(gradeTabContent);
    $("#add-grade-btn").on("click", onAddGrade);
  },

  renderGrades(grades, onDelete) {
    const gradesContainer = $("#grades-container");
    gradesContainer.empty();

    if (!grades || grades.length === 0) {
      this.renderNoGradesMessage();
      return;
    }

    const tableHtml = `
      <div class="grade-table">
        <div class="grade-table-header">
          <div class="grade-column grade-name-column">Grade</div>
          <div class="grade-column grade-range-column">Score Range</div>
          <div class="grade-column grade-action-column">Action</div>
        </div>
        <div class="grade-table-body">
          ${grades
            .map((grade, index) => this._createGradeRow(grade, index))
            .join("")}
        </div>
      </div>`;
    gradesContainer.html(tableHtml);

    $(".delete-grade-btn").on("click", function () {
      const index = $(this).data("index");
      onDelete(index);
    });
  },

  _createGradeRow(grade, index) {
    return `
      <div class="grade-table-row">
        <div class="grade-column grade-name-column">${grade.name}</div>
        <div class="grade-column grade-range-column">${grade.min} - ${grade.max}</div>
        <div class="grade-column grade-action-column">
          <button class="delete-grade-btn" data-index="${index}">
            <i class="bx bx-trash"></i>
          </button>
        </div>
      </div>`;
  },

  renderNoGradesMessage(
    message = "No grades found. Add your first grade to get started."
  ) {
    $("#grades-container").html(`
      <div class="no-data-message">
        <i class="bx bx-info-circle"></i>
        <p>${message}</p>
      </div>`);
  },

  renderAddGradeForm(onSave, onCancel) {
    this.removeAddGradeForm();
    const newGradeForm = `
      <div class="grade-form-container">
        <div class="grade-form">
          <div class="grade-form-header"><h5>Add New Grade</h5></div>
          <div class="grade-form-body">
            <div class="form-row">
              <div class="form-group">
                <div class="lal" for="new-grade-name">Grade Name<span class="text-danger">*</span></div>
                <input type="text" id="new-grade-name" class="form-input" placeholder="e.g., A+" required>
              </div>
              <div class="form-group">
                <div class="lal" for="new-grade-min">Minimum Score<span class="text-danger">*</span></div>
                <input type="number" id="new-grade-min" class="form-input" placeholder="e.g., 90" required>
              </div>
              <div class="form-group">
                <div class="lal" for="new-grade-max">Maximum Score<span class="text-danger">*</span></div>
                <input type="number" id="new-grade-max" class="form-input" placeholder="e.g., 100" required>
              </div>
            </div>
          </div>
          <div class="grade-form-footer">
            <button id="cancel-add-grade" class="btn-cancel">Cancel</button>
            <button id="save-new-grade" class="btn-save">Save Grade</button>
          </div>
        </div>
      </div>`;
    $("body").append(newGradeForm);
    $("#cancel-add-grade").on("click", onCancel);
    $("#save-new-grade").on("click", onSave);
    setTimeout(() => $("#new-grade-name").focus(), 100);
  },

  getNewGradeFormData() {
    return {
      name: $("#new-grade-name").val(),
      min: parseInt($("#new-grade-min").val()),
      max: parseInt($("#new-grade-max").val()),
    };
  },

  removeAddGradeForm() {
    $(".grade-form-container").remove();
  },

  renderConfirmDeleteDialog(onConfirm, onCancel) {
    this.removeConfirmDeleteDialog();
    const confirmDialog = `
      <div class="confirm-dialog-container">
        <div class="confirm-dialog">
          <div class="confirm-dialog-header"><h5>Confirm Deletion</h5></div>
          <div class="confirm-dialog-body"><p>Are you sure you want to delete this grade? This action cannot be undone.</p></div>
          <div class="confirm-dialog-footer">
            <button id="cancel-delete" class="btn-cancel">Cancel</button>
            <button id="confirm-delete" class="btn-delete">Delete</button>
          </div>
        </div>
      </div>`;
    $("body").append(confirmDialog);
    $("#cancel-delete").on("click", onCancel);
    $("#confirm-delete").on("click", onConfirm);
  },

  removeConfirmDeleteDialog() {
    $(".confirm-dialog-container").remove();
  },

  setSaveButtonState(isSaving) {
    const button = $("#save-new-grade");
    if (isSaving) {
      button
        .prop("disabled", true)
        .html('<i class="bx bx-loader bx-spin me-2"></i>Saving...');
    } else {
      button.prop("disabled", false).html("Save Grade");
    }
  },
};

const GradeService = {
  fetchGrades(accountId, successCallback, errorCallback) {
    makeApiCall({
      url: `${base_url}/account/grade?accountId=${accountId}`,
      method: "GET",
      successCallback: (response) => {
        successCallback(response.data || []);
      },
      errorCallback: (error) => {
        console.error("Error loading grades:", error);
        errorCallback(error);
      },
    });
  },

  updateGrades(accountId, gradeData, successCallback, errorCallback) {
    const payload = {
      code: collegeCode,
      name: collegeName,
      grade: gradeData,
    };

    makeApiCall({
      url: `${base_url}/account?accountId=${accountId}`,
      method: "PUT",
      data: JSON.stringify(payload),
      successCallback,
      errorCallback: (error) => {
        console.error("Error updating grades:", error);
        errorCallback(error);
      },
    });
  },
};

const GradeController = {
  state: {
    grades: [],
  },

  init() {
    GradeUI.setupInitialLayout(this.handleAddGradeClick.bind(this));
    setTimeout(() => {
      this.loadGrades();
    }, 5000);
  },

  loadGrades() {
    showLoader(true);
    GradeService.fetchGrades(
      accountId,
      (grades) => {
        this.state.grades = grades;
        GradeUI.renderGrades(
          this.state.grades,
          this.handleDeleteGradeClick.bind(this)
        );
        showLoader(false);
      },
      (error) => {
        this.state.grades = [];
        GradeUI.renderGrades([], this.handleDeleteGradeClick.bind(this));
        GradeUI.renderNoGradesMessage(
          "Failed to load grades. Please try again."
        );
        showLoader(false);
      }
    );
  },

  handleAddGradeClick() {
    GradeUI.renderAddGradeForm(
      this.handleSaveNewGradeClick.bind(this),
      GradeUI.removeAddGradeForm
    );
  },

  handleSaveNewGradeClick() {
    const { name, min, max } = GradeUI.getNewGradeFormData();

    if (!name || name.trim() === "") {
      return displayToast("Grade name is required", "error");
    }
    if (isNaN(min) || isNaN(max)) {
      return displayToast("Min and max scores must be valid numbers", "error");
    }
    if (min >= max) {
      return displayToast("Min score must be less than max score", "error");
    }
    if (
      this.state.grades.some((g) => g.name.toLowerCase() === name.toLowerCase())
    ) {
      return displayToast("A grade with this name already exists", "error");
    }

    const newGrade = { name: name, min: min, max: max };
    const updatedGrades = [...this.state.grades, newGrade];

    GradeUI.setSaveButtonState(true);
    showLoader(true);

    GradeService.updateGrades(
      accountId,
      updatedGrades,
      () => {
        displayToast("Grade added successfully", "success");
        this.state.grades = updatedGrades;
        GradeUI.renderGrades(
          this.state.grades,
          this.handleDeleteGradeClick.bind(this)
        );
        GradeUI.removeAddGradeForm();
        GradeUI.setSaveButtonState(false);
        showLoader(false);
      },
      (error) => {
        displayToast("An error occurred. Please try again.", "error");
        GradeUI.setSaveButtonState(false);
        showLoader(false);
      }
    );
  },

  handleDeleteGradeClick(index) {
    const onConfirm = () => {
      const updatedGrades = [...this.state.grades];
      updatedGrades.splice(index, 1);
      showLoader(true);

      GradeService.updateGrades(
        accountId,
        updatedGrades,
        () => {
          displayToast("Grade deleted successfully", "success");
          this.state.grades = updatedGrades;
          GradeUI.renderGrades(
            this.state.grades,
            this.handleDeleteGradeClick.bind(this)
          );
          GradeUI.removeConfirmDeleteDialog();
          showLoader(false);
        },
        (error) => {
          displayToast("An error occurred. Please try again.", "error");
          GradeUI.removeConfirmDeleteDialog();
          showLoader(false);
        }
      );
    };

    GradeUI.renderConfirmDeleteDialog(
      onConfirm,
      GradeUI.removeConfirmDeleteDialog
    );
  },
};

