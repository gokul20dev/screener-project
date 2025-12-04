const ProgramUI = {
  formatDateForInput(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date)) return "";
    return date.toISOString().split("T")[0];
  },

  formatDateForDisplay(dateStr) {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date)) return "—";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  showProgramList(allProgramData) {
    const $programContainer = $("#program-hierarchy-direct");
    const $noProgramMessage = $("#no-programs-found-direct");

    $programContainer.empty();

    if (!allProgramData || allProgramData.length === 0) {
      this.ensureNoProgramMessage();
      return;
    }

    $noProgramMessage.remove();

    let newProgramRow = "";

    $.each(allProgramData, (_, data) => {
      const startDateFormatted = this.formatDateForDisplay(data.startDate);
      const endDateFormatted = this.formatDateForDisplay(data.endDate);

      newProgramRow += `
        <div class="program-row program-card-item" 
             id="${data._id}"
             data-name="${data.name}" 
             data-code="${data.code || ""}" 
             data-start="${data.startDate || ""}" 
             data-end="${data.endDate || ""}">
          <div class="accordion-header">
            <div class="program-toggle">
              <i class="bx bx-chevron-right accordion-arrow fs-3 text-primary fw-bold"></i>
              <strong>${data.name}</strong>
            </div>
            <div class="program-actions">
              <i class="bx bx-edit edit-program" data-program-id="${data._id
        }" title="Edit"></i>
              <i class="bx bx-trash delete-program" data-program-id="${data._id
        }" title="Delete"></i>
            </div>
          </div>
          <div class="accordion-body">
            <div>Code ${data.code || "—"}</div>
            <div>Start Date ${startDateFormatted}</div>
            <div>End Date ${endDateFormatted}</div>
          </div>
        </div>
      `;
    });

    $programContainer.append(newProgramRow);
  },

  ensureNoProgramMessage() {
    const $noProgramMessage = $("#no-programs-found-direct");
    if ($noProgramMessage.length === 0) {
      $("#program-hierarchy-direct").after(`
        <div id="no-programs-found-direct" class="no-program-found">
          <i class="bx bx-info-circle"></i>
          <p>No program yet.</p>
          <small>Click the "Create Program" button to Create.</small>
        </div>
      `);
    }
  },

  setupProgramTabContent() {
    const targetId = "#program-content-direct";

    const programTabContent = `
      <div class="program-card scrollable-program-card">
        <div class="program-management-header">
          <div class="d-flex align-items-center gap-3 ms-auto">
            <div class="search-input position-relative">
              <i class="bx bx-search-alt search-icon-abs"></i>
              <input type="text" id="program-grid-search-direct" class="form-control search-input-pad" placeholder="Search programs...">
              <button id="clear-program-search-direct" class="btn btn-sm clear-search-btn">
                <i class="bx bx-x"></i>
              </button>
            </div>
            <button id="add-program-btn-direct" class="add-program-button">
              <i class="bx bx-plus-circle"></i> Create program
            </button>
          </div>
        </div>
        <div class="scroll-area">
          <div id="program-system-display-direct" class="program-system-display">

              <div id="program-hierarchy-direct" class="program-hierarchy">
              </div>
              <div class="text-center p-4">
              </div>

          </div>
        </div>
      </div>
    `;

    $(targetId).html(programTabContent);
  },

  showProgramForm(programData = null, programId = null) {
    $(".program-form-container").remove();

    const startDate = programData?.startDate
      ? this.formatDateForInput(programData.startDate)
      : this.formatDateForInput(new Date());

    const endDate = programData?.endDate
      ? this.formatDateForInput(programData.endDate)
      : this.formatDateForInput(new Date(Date.now() + 86400000));

    const formTitle = programData ? "Edit Program" : "Add Program";
    const buttonId = programData ? "update-program" : "save-new-program";
    const buttonText = programData ? "Update Program" : "Save Program";

    const form = `
      <div class="program-form-container">
        <div class="program-form">
          <div class="program-form-header">
            <h5>${formTitle}</h5>
          </div>
          <div class="program-form-body">
            <div class="form-row">
              <div class="form-group">
                <div class="piece">
                  <div class="lal" for="new-program-code">Program Code<span class="text-danger">*</span></div>
                  <input type="text" id="new-program-code" class="form-input" placeholder="e.g., 1001Bsc" value="${programData ? programData.code : ""
      }" required>

                  <div class="lal" for="new-program-name">Program Name<span class="text-danger">*</span></div>
                  <input type="text" id="new-program-name" class="form-input" placeholder="e.g., B.com" value="${programData ? programData.name : ""
      }" required>

                  <div class="dates d-flex">
                    <div class="date-field">
                      <div class="lal" for="program-start-date">Start Date<span class="text-danger">*</span></div>
                      <input type="date" id="program-start-date" class="dates-input" value="${startDate}" required>
                    </div>
                    <div class="date-field">
                      <div class="lal" for="program-end-date">End Date<span class="text-danger">*</span></div>
                      <input type="date" id="program-end-date" class="dates-input" value="${endDate}" required>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="program-form-footer">
            <button id="cancel-program-form" class="btn-cancel">Cancel</button>
            <button id="${buttonId}" class="btn-save" ${programId ? `data-program-id="${programId}"` : ""
      }>
              ${buttonText}
            </button>
          </div>
        </div>
      </div>
    `;

    $("body").append(form);
    setTimeout(() => $("#new-program-code").focus(), 100);
  },

  showFormError(message) {
    const errorElement = $(".program-form .error-message");
    if (errorElement.length === 0) {
      $(".program-form-body").prepend(
        `<div class="error-message text-danger mb-3">${message}</div>`
      );
    } else {
      errorElement.text(message);
    }
  },

  showDeleteConfirmDialog(programName, onConfirm, onCancel) {
    const confirmDialog = `
      <div class="confirm-dialog-container">
        <div class="confirm-dialog">
          <div class="confirm-dialog-header">
            <h5>Confirm Deletion</h5>
          </div>
          <div class="confirm-dialog-body">
            <p>Are you sure you want to delete the program "<strong>${programName}</strong>"? This action cannot be undone.</p>
          </div>
          <div class="confirm-dialog-footer">
            <button id="cancel-delete-program" class="btn-cancel">Cancel</button>
            <button id="confirm-delete-program" class="btn-delete">Delete</button>
          </div>
        </div>
      </div>
    `;

    $("body").append(confirmDialog);
    $("#cancel-delete-program").on("click", onCancel);
    $("#confirm-delete-program").on("click", onConfirm);
  },
};

const ProgramService = {
  fetchPrograms(accountId, successCallback, errorCallback) {
    makeApiCall({
      url: `${base_url}/account/program?accountId=${accountId}`,
      method: "GET",
      successCallback: (response) => {
        allProgramData = response.data || [];
        successCallback(response.data || []);
      },
      errorCallback: (error) => {
        console.error("Error loading programs:", error);
        errorCallback(error);
      },
    });
  },

  saveProgram(accountId, programData, successCallback, errorCallback) {
    makeApiCall({
      url: `${base_url}/account/program?accountId=${accountId}`,
      method: "POST",
      data: JSON.stringify(programData),
      successCallback,
      errorCallback: (error) => {
        console.error("Error adding program:", error);
        errorCallback(error);
      },
    });
  },

  updateProgram(programId, programData, successCallback, errorCallback) {
    makeApiCall({
      url: `${base_url}/account/program?programId=${programId}`,
      method: "PUT",
      data: JSON.stringify(programData),
      successCallback,
      errorCallback: (error) => {
        console.error("Error updating program:", error);
        errorCallback(error);
      },
    });
  },

  deleteProgram(accountId, programId, successCallback, errorCallback) {
    makeApiCall({
      url: `${base_url}/account/program?accountId=${accountId}&programId=${programId}`,
      method: "DELETE",
      successCallback,
      errorCallback: (error) => {
        console.error("Error deleting program:", error);
        errorCallback(error);
      },
    });
  },
};

const ProgramController = {
  state: {
    programs: [],
  },

  init() {
    ProgramUI.setupProgramTabContent();
    this.setupEventHandlers();
    this.loadProgramData();
  },

  setupEventHandlers() {
    $("#add-program-btn-direct").on("click", () => {
      ProgramUI.showProgramForm();
      this.setupFormHandlers();
    });

    $("#program-grid-search-direct").on("input", (e) => {
      const searchValue = $(e.target).val().trim().toLowerCase();
      this.handleProgramSearch(searchValue);
    });

    $("#clear-program-search-direct").on("click", () => {
      $("#program-grid-search-direct").val("");
      ProgramUI.showProgramList(this.state.programs);
    });
  },

  bindProgramCardEvents() {
    $(".accordion-header").off("click").on("click", (e) => {
      if (!$(e.target).closest(".program-actions").length) {
        const $header = $(e.currentTarget);
        $header.siblings(".accordion-body").slideToggle(200);
        const $arrow = $header.find(".accordion-arrow");
        $arrow.toggleClass("bx-chevron-right bx-chevron-down");
      }
    });

    $(".edit-program").off("click").on("click", (e) => {
      const programId = $(e.target).data("program-id");
      const program = this.state.programs.find((p) => p._id === programId);
      if (program) {
        ProgramUI.showProgramForm(program, programId);
        this.setupFormHandlers();
      }
    });

    $(".delete-program").off("click").on("click", (e) => {
      const programId = $(e.target).data("program-id");
      const program = this.state.programs.find((p) => p._id === programId);
      if (program) {
        this.handleDeleteProgram(program);
      }
    });
  },

  setupFormHandlers() {
    $("#cancel-program-form").on("click", () => {
      $(".program-form-container").remove();
    });

    $("#save-new-program, #update-program").on("click", (e) => {
      const programId = $(e.target).data("program-id");
      this.handleSaveProgram(programId);
    });
  },

  loadProgramData() {
    showLoader(true);
    ProgramService.fetchPrograms(
      accountId,
      (programs) => {
        this.state.programs = programs;
        ProgramUI.showProgramList(programs);
        this.bindProgramCardEvents(); //bind after render
        showLoader(false);
      },
      (error) => {
        displayToast("Error on loading programs", "error");
        ProgramUI.showProgramList([]);
        this.bindProgramCardEvents(); //  BIND after render
        showLoader(false);
      }
    );
  },

  handleProgramSearch(searchValue) {
    if (!searchValue) {
      ProgramUI.showProgramList(this.state.programs);
      return;
    }

    const filteredPrograms = this.state.programs.filter(
      (program) =>
        (program.name && program.name.toLowerCase().includes(searchValue)) ||
        (program.code && program.code.toLowerCase().includes(searchValue)) ||
        (program.startDate &&
          ProgramUI.formatDateForInput(program.startDate).includes(
            searchValue
          )) ||
        (program.endDate &&
          ProgramUI.formatDateForInput(program.endDate).includes(searchValue))
    );

    ProgramUI.showProgramList(filteredPrograms);
  },

  handleSaveProgram(programId = null) {
    const programName = $("#new-program-name").val().trim();
    const programCode = $("#new-program-code").val().trim();
    const startDate = $("#program-start-date").val();
    const endDate = $("#program-end-date").val();
    const isUpdate = programId !== null;

    if (!this.validateProgramData(programName, programCode, programId)) {
      return;
    }

    const programData = {
      name: programName,
      code: programCode,
      startDate: startDate || "",
      endDate: endDate || "",
    };

    showLoader(true);
    const buttonId = isUpdate ? "#update-program" : "#save-new-program";
    $(buttonId)
      .prop("disabled", true)
      .html(
        `<i class="bx bx-loader bx-spin me-2"></i>${isUpdate ? "Updating..." : "Saving..."
        }`
      );

    if (isUpdate) {
      ProgramService.updateProgram(
        programId,
        programData,
        () => this.handleSaveSuccess("Program updated successfully"),
        () => this.handleSaveError("Program update failed", buttonId, isUpdate)
      );
    } else {
      ProgramService.saveProgram(
        accountId,
        programData,
        () => this.handleSaveSuccess("Program added successfully"),
        () => this.handleSaveError("Adding Program failed", buttonId, isUpdate)
      );
    }
  },

  handleSaveSuccess(message) {
    displayToast(message, "success");
    $(".program-form-container").remove();
    this.loadProgramData();
  },

  handleSaveError(message, buttonId, isUpdate) {
    displayToast(message, "error");
    $(buttonId)
      .prop("disabled", false)
      .html(isUpdate ? "Update Program" : "Save Program");
    showLoader(false);
  },

  validateProgramData(name, code, programId) {
    if (!name) {
      ProgramUI.showFormError("Please enter a program name.");
      return false;
    }

    if (!code) {
      ProgramUI.showFormError("Please enter a program code.");
      return false;
    }

    const duplicate = this.state.programs.find(
      (program) =>
        program._id !== programId &&
        (program.name.toLowerCase() === name.toLowerCase() ||
          program.code.toLowerCase() === code.toLowerCase())
    );

    if (duplicate) {
      ProgramUI.showFormError(
        duplicate.name.toLowerCase() === name.toLowerCase()
          ? "A program with this name already exists"
          : "A program with this code already exists"
      );
      return false;
    }

    return true;
  },

  handleDeleteProgram(program) {
    ProgramUI.showDeleteConfirmDialog(
      program.name,
      () => {
        showLoader(true);
        ProgramService.deleteProgram(
          accountId,
          program._id,
          () => {
            displayToast("Program Deleted successfully", "success");
            this.loadProgramData();
            $(".confirm-dialog-container").remove();
          },
          () => {
            displayToast("Program deletion failed", "error");
            showLoader(false);
            $(".confirm-dialog-container").remove();
          }
        );
      },
      () => $(".confirm-dialog-container").remove()
    );
  },
};

