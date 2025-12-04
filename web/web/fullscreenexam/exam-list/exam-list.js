let currentAction = "";
let currentExamId = "";
let exam_list = [];
let gridOptionsForPlan = {};
let gridOptionsForToday = {};
let gridOptionsForComplete = {};
let gridOptionsForGoing = {};
let tabs = { all: 0, today: 0, ongoing: 0, completed: 0 };
let currentTab = "all";
let activeActionAnchor = null;
let activeDropdown = null;

$(document).ready(function () {
  // Handle menu item clicks
  $(".main-menu li a").on("click", function () {
    // Remove active class from all menu items
    $(".main-menu li").removeClass("active-menu bg-lite-green");
    // Add active class to clicked menu item
    $(this).parent().addClass("active-menu bg-lite-green");
  });

  $(document).on("click", ".start-stop-btn", function (e) {
    e.stopPropagation();
    e.preventDefault();
    handleStartStop.call(this);
  });
  $(document).on("click", ".edit-btn", function (e) {
    e.stopPropagation();
    e.preventDefault();
    handleEdit.call(this);
  });
  $(document).on("click", ".delete-btn", function (e) {
    e.stopPropagation();
    e.preventDefault();
    handleDelete.call(this);
  });
  $(document).on("click", ".report-btn", function (e) {
    e.stopPropagation();
    e.preventDefault();
    handleReport.call(this);
  });
  $(document).on("click", ".report-btn-complete", function (e) {
    e.stopPropagation();
    e.preventDefault();
    handleReport.call(this);
  });
  $(document).on("click", ".data-btn", function (e) {
    e.stopPropagation();
    e.preventDefault();
    handleData.call(this);
  });
  $(document).on("click", ".generate-btn", function (e) {
    e.stopPropagation();
    e.preventDefault();
    handleGenerateReport.call(this);
  });
  $(document).on("click", ".add-people-btn", function (e) {
    e.stopPropagation();
    e.preventDefault();
    addPeople.call(this);
  });
  $(document).on("click", ".clone-btn", function (e) {
    e.stopPropagation();
    e.preventDefault();
    handleClone.call(this);
  });
  $(document).on("click", ".view-btn", function (e) {
    e.stopPropagation();
    e.preventDefault();
    handleView.call(this);
  });

  const tabsOptions = document.querySelectorAll(".tabs button");
  const activeStatus = document.querySelector(".tabs .active");
  const tabContents = document.querySelectorAll(".tab-content .tab-pane");

  const setActiveTab = (index) => {
    const selectedTab = tabsOptions[index];
    const tabsContainer = selectedTab.parentElement;
    const tabRect = selectedTab.getBoundingClientRect();
    const containerRect = tabsContainer.getBoundingClientRect();

    const leftOffset = tabRect.left - containerRect.left;
    const tabWidth = tabRect.width;

    activeStatus.style.left = `${leftOffset}px`;
    activeStatus.style.width = `${tabWidth}px`;

    if (index === 0) {
      currentTab = "all";
    }
    if (index === 1) {
      currentTab = "today";
    }
    if (index === 2) {
      currentTab = "ongoing";
    }
    if (index === 3) {
      currentTab = "completed";
    }

    tabContents.forEach((content) => content.classList.remove("active"));
    const targetTab = document.querySelector(
      selectedTab.getAttribute("data-bs-target")
    );
    targetTab.classList.add("active");
  };

  // Initialize the first tab as active after a short delay to ensure elements are rendered
  setTimeout(() => {
    setActiveTab(0);
    tabsOptions[0].style.color = "#2F80ED";
  }, 100);

  // Add window resize handler to recalculate active tab position
  window.addEventListener('resize', () => {
    const activeTabIndex = Array.from(tabsOptions).findIndex(tab =>
      tab.style.color === "rgb(47, 128, 237)"
    );
    if (activeTabIndex !== -1) {
      setActiveTab(activeTabIndex);
    }
  });

  for (let i = 0; i < tabsOptions.length; i++) {
    tabsOptions[i].onclick = () => {
      setActiveTab(i);
      tabsOptions.forEach((btn) => (btn.style.color = "#898989"));
      tabsOptions[i].style.color = "#2F80ED";
    };
  }

  function fetchExams(searchText = "", callback) {

    // showAdvanceLoader('exam-list');
    showAssessmentLoader(true);

    makeApiCall({
      url: `${EXAM_END_POINT}/list`, // prevent cache
      method: "GET",
      disableLoading: true,
      successCallback: function (response) {
        let exams = response.data.data;

        // Filter manually based on searchText
        if (searchText) {
          const searchLower = searchText.toLowerCase();
          exams = exams.filter(exam =>
            Object.values(exam).some(
              value =>
                typeof value === "string" &&
                value.toLowerCase().includes(searchLower)
            )
          );
        }

        renderExams(exams, () => {
          if (callback) callback();
        });

        hideAdvanceLoader();
        showAssessmentLoader(false);
      },
      errorCallback: function (error) {
        showToast("Error fetching exams: " + error);
        console.error("Error fetching exams:", error);
        updateTabCounts(0, 0, 0, 0); // Reset counts to 0 on error
        // hideAdvanceLoader();
        showAssessmentLoader(false);
      },
    });
  }

  function setting() {
    makeApiCall({
      url: `${EXAM_END_POINT}/setting`,
      method: "GET",
      successCallback: function (response) {
        if (response.data && response.data.length > 0) {
          var labels = response.data[0].labels;

          // Set the values in the input boxes
          if (labels.length > 0) {
            $("#labelName1").val(labels[0].name);
            $("#labelValue1").val(labels[0].alias);
          }
          if (labels.length > 1) {
            $("#labelName2").val(labels[1].name);
            $("#labelValue2").val(labels[1].alias);
          }

          updateExternalVariables(labels);
        }
      },
      errorCallback: function (error) {
        showToast("Error fetching exams: " + error);

      },
    });
  }

  function handleEdit() {
    const examId = $(this).data("id");
    const examStatus = $(this).data("status");
    window.location.href = `../exam-configure/create.html?id=${examId}&stepper=1`;
  }

  function handleView() {
    const examId = $(this).data("id");
    window.location.href = `../exam-configure/exam-preview.html?examId=${examId}`;
  }

  function addPeople() {
    const examId = $(this).data("id");
    window.location.href = `../exam-configure/create.html?id=${examId}&step=link-to-step-3&stepper=3`;
  }

  function handleClone() {
    const examId = $(this).data("id");
    const cloneUrl = `${EXAM_END_POINT}/clone?entranceExamId=${examId}`;

    makeApiCall({
      url: cloneUrl,
      method: "POST",
      data: JSON.stringify({ name: "exam" }),
      successCallback: function (response) {
        showToast("Exam cloned successfully!", "success");
        updateTabCounts(0, 0, 0, 0); // Reset counts before refresh
        setTimeout(fetchExams, 1000);
      },
      errorCallback: function (error) {
        showToast("Error cloning exam: " + error, "error");
      },
    });
  }

  function handleStartStop() {
    const examId = $(this).data("id");
    const currentStatus = $(this).data("status");
    if (currentStatus === "ON_GOING") {
      currentAction = "stop";
      currentExamId = examId;
      $("#confirmationMessage").text(
        `Are you sure you want to stop the exam? Type 'STOP' to confirm.`
      );
      $('#confirmationModal').modal({
        backdrop: 'static',
        keyboard: false
      });
      $("#confirmationModal").css({
        top: '30%'
      });

    } else {
      startExam(examId);
    }
  }

  function startExam(examId) {
    const apiEndpoint = `${EXAM_END_POINT}/start?entranceExamId=${examId}`;

    makeApiCall({
      url: apiEndpoint,
      method: "PUT",
      successCallback: function (response) {
        $('#main-table-search').val('')
        showToast("Exam started successfully!", "success");
        updateTabCounts(0, 0, 0, 0); // Reset counts before refresh
        setTimeout(fetchExams, 1000);
      },
      errorCallback: function (error) {
        showToast("Error starting exam: " + error, "error");
      },
    });
  }

  $(document).on("click", "#exam-list-refresh-btn", function () {
    const searchText = $("#main-table-search").val().toLowerCase().trim();
    fetchExams(searchText);
  });


  function confirmStop() {
    const apiEndpoint = `${EXAM_END_POINT}/close?entranceExamId=${currentExamId}`;

    makeApiCall({
      url: apiEndpoint,
      method: "PUT",
      successCallback: function (response) {
        showToast("Exam stopped successfully!", "success");
        updateTabCounts(0, 0, 0, 0); // Reset counts before refresh
        setTimeout(fetchExams, 1000);
        $("#confirmationModal").modal("hide");
        $("#confirmationInput").val("");
      },
      errorCallback: function (error) {
        showToast("Error stopping exam: " + error, "error");
      },
    });
  }

  function handleDelete() {
    currentAction = "delete";
    currentExamId = $(this).data("id");
    $("#confirmationMessage").text(
      'Are you sure you want to delete the exam? Type "DELETE" to confirm.'
    );
    $('#confirmationModal').modal({
      backdrop: 'static',
      keyboard: false
    });
    $("#confirmationModal").css({
      top: '30%'
    });
  }

  function confirmDelete() {
    const deleteUrl = `${EXAM_END_POINT}?entranceExamId=${currentExamId}`;

    makeApiCall({
      url: deleteUrl,
      method: "DELETE",
      successCallback: function (response) {
        showToast("Exam deleted successfully!", "success");
        updateTabCounts(0, 0, 0, 0); // Reset counts before refresh
        setTimeout(fetchExams, 2000);
        $("#confirmationModal").modal("hide");
        $("#confirmationInput").val("");
      },
      errorCallback: function (error) {
        showToast("Error deleting exam: " + error, "error");
      },
    });

    //     url: deleteUrl,
    //     type: 'DELETE',
    //     headers: apiheaders,
    //     success: function (response) {
    //         showToast('Exam deleted successfully!');
    //         setTimeout(fetchExams, 2000);
    //         $('#confirmationModal').modal('hide');
    //         $('#confirmationInput').val('');
    //     },
    //     error: function (error) {
    //         showToast('Error deleting exam: ' + error.responseJSON.message);
    //         console.error('Error deleting exam:', error);
    //     }
    // });
  }

  function handleReport() {
    const examId = $(this).data("id");
    window.location.href = `../reports/?examid=${examId}`;
  }

  function handleData() {
    const examId = $(this).data("id");
    window.location.href = `../reports/reportdata.html?examid=${examId}`;
  }

  function handleGenerateReport() {
    const $button = $(this);
    const examId = $button.data("id");
    const apiEndpoint = `${EXAM_END_POINT}/generate-report?entranceExamId=${examId}`;

    makeApiCall({
      url: apiEndpoint,
      method: "POST",
      successCallback: function (response) {
        if (response.message === "Report Updated Successfully") {
          $button
            .prop("disabled", true)
            .removeClass("btn-info")
            .addClass("btn-secondary");

          showToast(
            "Your report is updated. Please wait 30 seconds while your report is being generated."
          );

          setTimeout(() => {
            $button
              .prop("disabled", false)
              .removeClass("btn-secondary")
              .addClass("btn-info");
          }, 60000);
        }
      },
      errorCallback: function (error) {
        showToast("Error generating report: " + (error || "Unknown error"));
      },
    });
  }

  function getTimezoneDisplay(timezoneIdentifier) {
    const timezone = standardTimezones.find(
      (tz) => tz.identifier === timezoneIdentifier
    );
    if (timezone) {
      return `${timezone.offset}`;
    }
    return "";
  }

  function formatDate(date) {
    return `${("0" + date.getDate()).slice(
      -2
    )}-${("0" + (date.getMonth() + 1)).slice(-2)}-${date.getFullYear()}`;
  }

  // Function to update tab counts
  function updateTabCounts(allCount, todayCount, ongoingCount, completedCount) {
    $("#all-count").text(allCount);
    $("#today-count").text(todayCount);
    $("#ongoing-count").text(ongoingCount);
    $("#completed-count").text(completedCount);
  }

  function renderExams(data) {

    const gridDivPlan = document.querySelector("#myPlannedGrid");
    const gridDivToday = document.querySelector("#myTodayGrid");
    const gridDivComplete = document.querySelector("#myCompletedGrid");
    const gridDivGoing = document.querySelector("#myonGoingGrid");

    gridDivPlan.innerHTML = "";
    gridDivToday.innerHTML = "";
    gridDivComplete.innerHTML = "";
    gridDivGoing.innerHTML = "";

    const plannedExams = data.filter((exam) => exam.status !== "COMPLETED");

    const completedExams = data.filter((exam) => exam.examStatus === "ENDED");
    const ongoingExams = data.filter((exam) => exam.examStatus === "ON_GOING");
    exam_list = plannedExams;

    const plan = plannedExams.map((exam, index) => {
      const startDate = new Date(exam.session.start.date);
      const timezoneInfo = getTimezoneDisplay(exam.settings?.timeZone);

      const formattedStartDate = `${formatDate(startDate)} ${exam.session.start.hour
        }:${exam.session.start.minute.toString().padStart(2, "0")} ${exam.session.start.format
        } ${timezoneInfo}`;
      return {
        index: index + 1,
        name: exam.name,
        startDate: formattedStartDate,
        questions: exam.questions,
        totalAttendees: exam.totalAttendees,
        status: exam.status,
        examStatus: exam.examStatus,
        createdBy: exam.createdBy?.email || 'N/A',
        _id: exam._id,
      };
    });

    const today = plannedExams.filter((exam) => {
      const startDate = new Date(exam.session.start.date).setHours(0, 0, 0, 0);
      const endDate = new Date(exam.session.end.date).setHours(0, 0, 0, 0);
      const today = new Date().setHours(0, 0, 0, 0);
      return startDate <= today && endDate >= today;
    });

    const todayExams = today.map((exam, index) => {
      const startDate = new Date(exam.session.start.date);
      const endDate = new Date(exam.session.end.date);
      const timezoneInfo = getTimezoneDisplay(exam.settings?.timeZone);

      const formattedStartDate = `${formatDate(startDate)} ${exam.session.start.hour
        }:${exam.session.start.minute.toString().padStart(2, "0")} ${exam.session.start.format
        } ${timezoneInfo}`;
      const formattedEndDate = `${formatDate(endDate)} ${exam.session.end.hour
        }:${exam.session.end.minute.toString().padStart(2, "0")} ${exam.session.end.format
        } ${timezoneInfo}`;

      return {
        index: index + 1,
        name: exam.name,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        questions: exam.questions,
        totalAttendees: exam.totalAttendees,
        status: exam.status,
        examStatus: exam.examStatus,
        createdBy: exam.createdBy?.email || 'N/A',
        _id: exam._id,
      };
    });


    const onGoing = ongoingExams.map((exam, index) => {
      const startDate = new Date(exam.session.start.date);
      const endDate = new Date(exam.session.end.date);
      const timezoneInfo = getTimezoneDisplay(exam.settings?.timeZone);

      const formattedStartDate = `${formatDate(startDate)} ${exam.session.start.hour
        }:${exam.session.start.minute.toString().padStart(2, "0")} ${exam.session.start.format
        } ${timezoneInfo}`;
      const formattedEndDate = `${formatDate(endDate)} ${exam.session.end.hour
        }:${exam.session.end.minute.toString().padStart(2, "0")} ${exam.session.end.format
        } ${timezoneInfo}`;

      return {
        index: index + 1,
        name: exam.name,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        questions: exam.questions,
        totalAttendees: exam.totalAttendees,
        examStatus: exam.examStatus, // Include examStatus to determine actions
        status: exam.status, // Include status to enable/disable buttons
        createdBy: exam.createdBy?.email || 'N/A',
        _id: exam._id, // Keep _id to use in actions
      };
    });

    const complete = completedExams.map((exam, index) => {
      const startDate = new Date(exam.session.start.date);
      const endDate = new Date(exam.session.end.date);
      const timezoneInfo = getTimezoneDisplay(exam.settings?.timeZone);

      const formattedStartDate = `${formatDate(startDate)} ${exam.session.start.hour
        }:${exam.session.start.minute.toString().padStart(2, "0")} ${exam.session.start.format
        } ${timezoneInfo}`;
      const formattedEndDate = `${formatDate(endDate)} ${exam.session.end.hour
        }:${exam.session.end.minute.toString().padStart(2, "0")} ${exam.session.end.format
        } ${timezoneInfo}`;
      return {
        index: index + 1,
        name: exam.name,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        questions: exam.questions,
        totalAttendees: exam.totalAttendees,
        createdBy: exam.createdBy?.email || 'N/A',
        _id: exam._id, // keep _id to use in actions
      };
    });
    const columnDefsForPlan = [
      {
        headerName: "No.",
        field: "index",
        colId: "actionColumn",
        headerClass: "table-ag-class",
        headerTooltip: "No.",
        maxWidth: 50,
        flex: 0.2,
      },
      {
        headerName: `${globalLabels[labelItems.EXAM] ?? "Exam"} Name`,
        field: "name",
        colId: "actionColumn",
        flex: 1,
        headerClass: "table-ag-class",
        headerTooltip: `${globalLabels[labelItems.EXAM] ?? "Exam"} Name`,
        filter: true,
        cellStyle: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: "1.2",
        },
      },
      {
        headerName: "Start Date",
        field: "startDate",
        colId: "actionColumn",
        headerClass: "table-ag-class",
        flex: 1.5,
        headerTooltip: "Start Date",
        filter: true,
        cellStyle: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: "1",
        },

        // This converts your string to Date object for proper sorting
        valueGetter: (params) => {
          return changeStringToDate(params)
        },

        // This keeps your original display format
        cellRenderer: (params) => {
          return `<div>${params.data.startDate}</div>`;
        }
      },
      {
        headerName: "Questions",
        field: "questions",
        flex: 0.5,
        colId: "actionColumn",
        headerClass: "table-ag-class",
        headerTooltip: "Questions",
        filter: true,
      },
      {
        headerName: "Total Attendees",
        field: "totalAttendees",
        headerTooltip: "Total Attendees",
        flex: 0.5,
        colId: "actionColumn",
        headerClass: "table-ag-class",
        filter: true,
      },
      {
        headerName: "Created By",
        field: "createdBy",
        headerTooltip: "Created By",
        flex: 1.2,
        colId: "actionColumn",
        headerClass: "table-ag-class",
        filter: true,
        cellStyle: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: "1.2",
        },
      },
      {
        headerName: "Status",
        colId: "actionColumn",
        headerTooltip: "Status",
        headerClass: "table-ag-class",
        field: "status",
        flex: 0.6,
        filter: true,
        cellRenderer: (params) => {
          const statusClass =
            params.value === "FINALIZED" ? "" : "text-success";
          return `<span class="d-flex age-cell-basic ${statusClass} align-items-center gap-1"><i class="bx bx-check-circle"></i>${params.value?.toLowerCase()}</span>`;
        },
      },
      {
        headerName: `${globalLabels[labelItems.EXAM] ?? "Exam"} Status`,
        headerClass: "table-ag-class",
        colId: "actionColumn",
        field: "examStatus",
        headerTooltip: `${globalLabels[labelItems.EXAM] ?? "Exam"} Status`,
        flex: 0.6,
        filter: true,
        cellRenderer: (params) => {
          return `<span class="age-cell-exam-status ${params.value
            .toLowerCase()
            .replaceAll("_", "")}-badge  badges">${params.value
              .toLowerCase()
              .replaceAll("_", " ")}</span>`;
        },
      },
      {
        headerName: "Actions",
        headerTooltip: "Actions",
        cellRenderer: (params) => {
          const exam = params.data;
          const examStatus = exam.examStatus !== 'ON_GOING'
          const startStopLabel =
            exam.examStatus === "ON_GOING" ? "Stop" : "Start";
          const startStopIcon =
            exam.examStatus === "ON_GOING" ? "fa-stop" : "fa-play";
          return `
          <div class="action-container">
            <i class="bx bx-dots-vertical-rounded action-menu-main" ></i>
            <div class="action-dropdown">
                          <div class="view-btn act-pointer" data-id="${exam._id}">Exam Overview<i class="fas fa-eye"></i></div>
                          <div class="edit-btn act-pointer" data-id="${exam._id}" data-status="${exam.status}">Edit <i class="fas fa-edit"></i></div>
                          <div class="start-stop-btn act-pointer" data-id="${exam._id}" data-status="${exam.examStatus}" title="${startStopLabel}">${startStopLabel} <i class="fas ${startStopIcon}"></i></div>
                          <div class="report-btn act-pointer" data-id="${exam._id}">Report <i class="fas fa-chart-bar"></i></div>
                          <div class="clone-btn act-pointer" data-id="${exam._id}">Clone <i class="fas fa-clone"></i></div>
                          <div class="add-people-btn act-pointer" data-id="${exam._id}">Add More People <i class="fas fa-user-plus"></i></div>
                         ${examStatus ? `<div class="delete-btn act-pointer" data-id="${exam._id}">Delete <i class="fas fa-trash"></i></div>` : ''}
            </div>
          </div>`;
        },
        autoHeight: true,
        headerClass: "table-ag-class",
        width: 100,
      },
    ];

    const columnDefsForToday = [
      {
        headerName: "No.",
        field: "index",
        colId: "actionColumn",
        headerClass: "table-ag-class",
        maxWidth: 50,
        headerTooltip: "No. ",
        flex: 0.5,
      },
      {
        headerName: `${globalLabels[labelItems.EXAM] ?? "Exam"} Name`,
        field: "name",
        colId: "actionColumn",
        headerTooltip: `${globalLabels[labelItems.EXAM] ?? "Exam"} Name`,
        flex: 1,
        headerClass: "table-ag-class",
        filter: true,
        cellStyle: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: "1.2",
        },
      },
      {
        headerName: "Start Date",
        field: "startDate",
        colId: "actionColumn",
        headerClass: "table-ag-class",
        flex: 1.5,
        headerTooltip: "Start Date",
        filter: true,
        cellStyle: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: "1",
        },

        // This converts your string to Date object for proper sorting
        valueGetter: (params) => {
          return changeStringToDate(params)
        },

        // This keeps your original display format
        cellRenderer: (params) => {
          return `<div>${params.data.startDate}</div>`;
        }
      },
      {
        headerName: "Questions",
        headerTooltip: "Questions",
        field: "questions",
        flex: 0.5,
        colId: "actionColumn",
        headerClass: "table-ag-class",
        filter: true,
      },
      {
        headerName: "Total Attendees",
        headerTooltip: "Total Attendees",
        field: "totalAttendees",
        flex: 0.5,
        colId: "actionColumn",
        headerClass: "table-ag-class",
        filter: true,
      },
      {
        headerName: "Created By",
        field: "createdBy",
        headerTooltip: "Created By",
        flex: 1.2,
        colId: "actionColumn",
        headerClass: "table-ag-class",
        filter: true,
        cellStyle: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: "1.2",
        },
      },
      {
        headerName: "Status",
        colId: "actionColumn",
        headerTooltip: "Status",
        headerClass: "table-ag-class",
        field: "status",
        filter: true,
        cellRenderer: (params) => {
          const statusClass =
            params.value === "FINALIZED" ? "" : "text-success";
          return `<span class="d-flex age-cell-basic ${statusClass} align-items-center gap-1"><i class="bx bx-check-circle"></i>${params.value?.toLowerCase()}</span>`;
        },
      },
      {
        headerName: `${globalLabels[labelItems.EXAM] ?? "Exam"} Status`,
        headerClass: "table-ag-class",
        headerTooltip: `${globalLabels[labelItems.EXAM] ?? "Exam"} Status`,
        colId: "actionColumn",
        field: "examStatus",
        filter: true,
        cellRenderer: (params) => {
          return `<span class="age-cell-exam-status ${params.value
            .toLowerCase()
            .replaceAll("_", "")}-badge  badges">${params.value
              .toLowerCase()
              .replaceAll("_", " ")}</span>`;
        },
      },
      {
        headerName: "Actions",
        headerTooltip: "Actions",
        cellRenderer: (params) => {
          const exam = params.data;
          const examStatus = exam.examStatus !== "ON_GOING"
          const startStopLabel =
            exam.examStatus === "ON_GOING" ? "Stop" : "Start";
          const startStopIcon =
            exam.examStatus === "ON_GOING" ? "fa-stop" : "fa-play";
          return `
          <div class="action-container" data-number="2">
            <i class="bx bx-dots-vertical-rounded action-menu-main" ></i>
            <div class="action-dropdown">
                          <div class="view-btn act-pointer" data-id="${exam._id}">Exam Overview<i class="fas fa-eye"></i></div>
                          <div class="edit-btn act-pointer" data-id="${exam._id}"  data-status="${exam.status}">Edit <i class="fas fa-edit"></i></div>
                          <div class="start-stop-btn act-pointer" data-id="${exam._id}" data-status="${exam.examStatus}" title="${startStopLabel}">${startStopLabel} <i class="fas ${startStopIcon}"></i></div>
                          <div class="report-btn act-pointer" data-id="${exam._id}">Report <i class="fas fa-chart-bar"></i></div>
                          <div class="clone-btn act-pointer" data-id="${exam._id}">Clone <i class="fas fa-clone"></i></div>
                          <div class="add-people-btn act-pointer" data-id="${exam._id}">Add More People <i class="fas fa-user-plus"></i></div>
                                                   ${examStatus ? `<div class="delete-btn act-pointer" data-id="${exam._id}">Delete <i class="fas fa-trash"></i></div>` : ''}
            </div>
          </div>`;
        },
        autoHeight: true,
        headerClass: "table-ag-class",
        width: 100,
      },
    ];

    const columnDefsForOnGoing = [
      {
        headerName: "No.",
        field: "index",
        headerTooltip: "No. ",
        colId: "actionColumn",
        maxWidth: 50,
        headerClass: "table-ag-class",
        flex: 0.2,
      },
      {
        headerName: `${globalLabels[labelItems.EXAM] ?? "Exam"} Name`,
        headerTooltip: `${globalLabels[labelItems.EXAM] ?? "Exam"} Name`,
        field: "name",
        headerClass: "table-ag-class",
        flex: 1,
        colId: "actionColumn",
        filter: true,
      },
      {
        headerName: "Start Date",
        field: "startDate",
        colId: "actionColumn",
        headerClass: "table-ag-class",
        flex: 1.5,
        headerTooltip: "Start Date",
        filter: true,
        cellStyle: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: "1",
        },

        // This converts your string to Date object for proper sorting
        valueGetter: (params) => {
          return changeStringToDate(params)
        },

        // This keeps your original display format
        cellRenderer: (params) => {
          return `<div>${params.data.startDate}</div>`;
        }
      },
      {
        headerName: "Questions",
        headerTooltip: "Questions",
        field: "questions",
        flex: 0.5,
        colId: "actionColumn",
        headerClass: "table-ag-class",
        filter: true,
      },
      {
        headerName: "Total Attendees",
        headerTooltip: "Total Attendees",
        field: "totalAttendees",
        flex: 0.5,
        colId: "actionColumn",
        headerClass: "table-ag-class",
        filter: true,
      },
      {
        headerName: "Created By",
        field: "createdBy",
        headerTooltip: "Created By",
        flex: 1.2,
        colId: "actionColumn",
        headerClass: "table-ag-class",
        filter: true,
        cellStyle: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: "1.2",
        },
      },
      {
        headerName: "Actions",
        headerTooltip: "Actions",
        headerClass: "table-ag-class",
        flex: 0.5,
        maxWidth: 100,
        cellRenderer: (params) => {
          const exam = params.data;
          const startStopLabel = exam.examStatus === "ON_GOING" ? "Stop" : "Start";
          const startStopIcon = exam.examStatus === "ON_GOING" ? "fa-stop" : "fa-play";
          const showStartStopButton = exam.status === "FINALIZED" ? "" : "disabled";
          return `
          <div class="action-container">
            <i class="bx bx-dots-vertical-rounded action-menu-main"></i>
            <div class="action-dropdown">
              <div class="view-btn act-pointer" data-id="${exam._id}">Exam Overview<i class="fas fa-eye"></i></div>
              <div class="report-btn act-pointer" data-id="${exam._id}">View Live Reports <i class="fas fa-chart-bar"></i></div>
              <div class="start-stop-btn act-pointer ${showStartStopButton}" data-id="${exam._id}" data-status="${exam.examStatus}">${startStopLabel} <i class="fas ${startStopIcon}"></i></div>
            </div>
          </div>`;
        },
      },
    ];

    const columnDefsForComplete = [
      {
        headerName: "No.",
        headerTooltip: "No.",
        field: "index",
        colId: "actionColumn",
        maxWidth: 50,
        headerClass: "table-ag-class",
        flex: 0.2,
      },
      {
        headerName: `${globalLabels[labelItems.EXAM] ?? "Exam"} Name`,
        headerTooltip: `${globalLabels[labelItems.EXAM] ?? "Exam"} Name`,
        field: "name",
        flex: 1,
        colId: "actionColumn",
        headerClass: "table-ag-class",
        filter: true,
      },
      {
        headerName: "Start Date",
        field: "startDate",
        colId: "actionColumn",
        headerClass: "table-ag-class",
        flex: 1.5,
        headerTooltip: "Start Date",
        filter: true,
        cellStyle: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: "1",
        },

        // This converts your string to Date object for proper sorting
        valueGetter: (params) => {
          return changeStringToDate(params)
        },

        // This keeps your original display format
        cellRenderer: (params) => {
          return `<div>${params.data.startDate}</div>`;
        }
      },
      {
        headerName: "Questions",
        headerTooltip: "Questions",
        field: "questions",
        flex: 0.5,
        colId: "actionColumn",
        headerClass: "table-ag-class",
        filter: true,
      },
      {
        headerName: "Total Attendees",
        headerTooltip: "Total Attendees",
        field: "totalAttendees",
        flex: 0.5,
        colId: "actionColumn",
        headerClass: "table-ag-class",
        filter: true,
      },
      {
        headerName: "Created By",
        field: "createdBy",
        headerTooltip: "Created By",
        flex: 1.2,
        colId: "actionColumn",
        headerClass: "table-ag-class",
        filter: true,
        cellStyle: {
          whiteSpace: "normal",
          wordBreak: "break-word",
          lineHeight: "1.2",
        },
      },
      {
        headerName: "Actions",
        headerTooltip: "Actions",
        flex: 0.6,
        maxWidth: 120,
        cellRenderer: (params) => {
          const exam = params.data;
          return `
            <div class="action-container">
              <i class="bx bx-dots-vertical-rounded action-menu-main"></i>
              <div class="action-dropdown">
                <div class="view-btn act-pointer" data-id="${exam._id}">Exam Overview<i class="fas fa-eye"></i></div>
                <div class="report-btn-complete act-pointer" data-id="${exam._id}">View Reports <i class="fas fa-chart-bar"></i></div>
              </div>
            </div>
          `;
        },
      },
    ];

    gridOptionsForPlan = {
      theme: "legacy",
      rowModelType: "clientSide",
      columnDefs: columnDefsForPlan,
      rowData: plan,
      rowHeight: 70,
      enableFilter: true,
      onRowClicked: (params) => {
        const make = $(params.event.target).attr("role") === "gridcell";
        if (make) {
          params.event.stopPropagation();
          const examId = params.data._id;
          window.location.href = `../exam-configure/create.html?id=${examId}&stepper=1`;
        }
      },
      onGridReady: function () {
        tabs.all = Math.min(
          gridOptionsForPlan.api.paginationGetPageSize(),
          gridOptionsForPlan.api.getDisplayedRowCount()
        );
      },
      defaultColDef: {
        padding: 50,
        width: 100,
        enableRangeSelection: true,
        enableCharts: true,
        resizable: true,
        clipboard: {
          enabled: true,
        },
        getContextMenuItems: function (params) {
          var result = [
            "copy",
            "copyWithHeaders",
            "paste",
            "separator",
            {
              name: "Copy Row Data",
              action: function () {
                var selectedRow = params.node.data;
                var rowData = JSON.stringify(selectedRow);
                navigator.clipboard.writeText(rowData).then(
                  function () {
                    alert("Row data copied to clipboard: " + rowData);
                  },
                  function (err) {
                    console.error("Could not copy text: ", err);
                  }
                );
              },
            },
          ];
          return result;
        },
      },
      paginationPageSize: 100,
      domLayout: 'normal',
      suppressHorizontalScroll: false,
      suppressColumnVirtualisation: true,
      overlayLoadingTemplate:
        '<span class="ag-overlay-loading-center">Loading Attendees List .Please Wait...</span>',
      overlayNoRowsTemplate:
        '<span class="ag-overlay-loading-center">No data to display</span>',
      pagination: true, // Optional: if you want pagination
      domLayout: "autoHeight", // Optional: if you want auto-adjusting height based on the rows
    };

    gridOptionsForToday = {
      theme: "legacy",
      rowModelType: "clientSide",
      columnDefs: columnDefsForToday,
      rowData: todayExams,
      rowHeight: 70,
      enableFilter: true,
      onRowClicked: (params) => {
        const make = $(params.event.target).attr("role") === "gridcell";
        if (make) {
          params.event.stopPropagation();
          const examId = params.data._id;
          window.location.href = `../exam-configure/create.html?id=${examId}&stepper=1`;
        }
      },
      onGridReady: function () {
        tabs.today = Math.min(
          gridOptionsForToday.api.paginationGetPageSize(),
          gridOptionsForToday.api.getDisplayedRowCount()
        );
      },
      defaultColDef: {
        padding: 50,
        width: 100,
        enableRangeSelection: true,
        enableCharts: true,
        resizable: true,
        clipboard: {
          enabled: true,
        },
        getContextMenuItems: function (params) {
          var result = [
            "copy",
            "copyWithHeaders",
            "paste",
            "separator",
            {
              name: "Copy Row Data",
              action: function () {
                var selectedRow = params.node.data;
                var rowData = JSON.stringify(selectedRow);
                navigator.clipboard.writeText(rowData).then(
                  function () {
                    alert("Row data copied to clipboard: " + rowData);
                  },
                  function (err) {
                    console.error("Could not copy text: ", err);
                  }
                );
              },
            },
          ];
          return result;
        },
      },
      paginationPageSize: 100,
      suppressHorizontalScroll: false,
      suppressColumnVirtualisation: true,
      overlayLoadingTemplate:
        '<span class="ag-overlay-loading-center">Loading Attendees List .Please Wait...</span>',
      overlayNoRowsTemplate:
        '<span class="ag-overlay-loading-center">No data to display</span>',
      pagination: true, // Optional: if you want pagination
      domLayout: "autoHeight", // Optional: if you want auto-adjusting height based on the rows
    };

    gridOptionsForGoing = {
      theme: "legacy",
      rowModelType: "clientSide",
      columnDefs: columnDefsForOnGoing,
      rowData: onGoing,
      rowHeight: 70,
      onRowClicked: (params) => {
        const make = $(params.event.target).attr("role") === "gridcell";
        if (make) {
          params.event.stopPropagation();
          const examId = params.data._id;
          window.location.href = `../exam-configure/create.html?id=${examId}&stepper=1`;
        }
      },
      onGridReady: function () {
        tabs.ongoing = Math.min(
          gridOptionsForGoing.api.paginationGetPageSize(),
          gridOptionsForGoing.api.getDisplayedRowCount()
        );
      },
      defaultColDef: {
        padding: 50,
        width: 100,
        enableRangeSelection: true,
        enableCharts: true,
        resizable: true,
        clipboard: {
          enabled: true,
        },
        getContextMenuItems: function (params) {
          var result = [
            "copy",
            "copyWithHeaders",
            "paste",
            "separator",
            {
              name: "Copy Row Data",
              action: function () {
                var selectedRow = params.node.data;
                var rowData = JSON.stringify(selectedRow);
                navigator.clipboard.writeText(rowData).then(
                  function () {
                    alert("Row data copied to clipboard: " + rowData);
                  },
                  function (err) {
                    console.error("Could not copy text: ", err);
                  }
                );
              },
            },
          ];
          return result;
        },
      },
      paginationPageSize: 100,
      suppressHorizontalScroll: false,
      suppressColumnVirtualisation: true,
      overlayLoadingTemplate:
        '<span class="ag-overlay-loading-center">Loading Attendees List .Please Wait...</span>',
      overlayNoRowsTemplate:
        '<span class="ag-overlay-loading-center">No data to display</span>',
      pagination: true, // Optional: if you want pagination
      domLayout: "autoHeight", // Optional: if you want auto-adjusting height based on the rows
    };

    gridOptionsForComplete = {
      theme: "legacy",
      rowModelType: "clientSide",
      columnDefs: columnDefsForComplete,
      rowData: complete,
      rowHeight: 70,
      onRowClicked: (params) => {
        const make = $(params.event.target).attr("role") === "gridcell";
        if (make) {
          params.event.stopPropagation();
          const examId = params.data._id;
          window.location.href = `../exam-configure/create.html?id=${examId}&stepper=1`;
        }
      },
      onGridReady: function () {
        tabs.completed = Math.min(
          gridOptionsForComplete.api.paginationGetPageSize(),
          gridOptionsForComplete.api.getDisplayedRowCount()
        );
      },
      defaultColDef: {
        flex: 1,
        padding: 50,
        width: 100,
        enableRangeSelection: true,
        enableCharts: true,
        resizable: true,

        clipboard: {
          enabled: true,
        },
        getContextMenuItems: function (params) {
          var result = [
            "copy",
            "copyWithHeaders",
            "paste",
            "separator",
            {
              name: "Copy Row Data",
              action: function () {
                var selectedRow = params.node.data;
                var rowData = JSON.stringify(selectedRow);
                navigator.clipboard.writeText(rowData).then(
                  function () {
                    alert("Row data copied to clipboard: " + rowData);
                  },
                  function (err) {
                    console.error("Could not copy text: ", err);
                  }
                );
              },
            },
          ];
          return result;
        },
      },
      paginationPageSize: 100,
      suppressHorizontalScroll: false,
      suppressColumnVirtualisation: true,
      overlayLoadingTemplate:
        '<span class="ag-overlay-loading-center">Loading Attendees List .Please Wait...</span>',
      overlayNoRowsTemplate:
        '<span class="ag-overlay-loading-center">No data to display</span>',
      pagination: true, // Optional: if you want pagination
      domLayout: "autoHeight", // Optional: if you want auto-adjusting height based on the rows
    };

    new agGrid.Grid(gridDivPlan, gridOptionsForPlan);
    new agGrid.Grid(gridDivToday, gridOptionsForToday);
    new agGrid.Grid(gridDivGoing, gridOptionsForGoing);
    new agGrid.Grid(gridDivComplete, gridOptionsForComplete);

    // Update tab counts
    updateTabCounts(plannedExams.length, todayExams.length, onGoing.length, complete.length);
  }

  $("#close").click(function () {
    $("#confirmationModal").modal("hide");
  });
  $("#CancelAction").click(function () {
    $("#confirmationModal").modal("hide");
  });
  $("#Cancel-setting").click(function () {
    $("#settingsModal").modal("hide");
  });
  $("#close-setting").click(function () {
    $("#settingsModal").modal("hide");
  });

  $("#confirmAction").click(function () {
    const confirmationInput = $("#confirmationInput").val().toUpperCase();
    if (currentAction === "delete" && confirmationInput === "DELETE") {
      confirmDelete();
    } else if (currentAction === "stop" && confirmationInput === "STOP") {
      confirmStop();
    } else {
      showToast("Confirmation input is not valid. Try again.");
    }
  });

  $(".tab-button").click(function () {
    $(".tab-button").removeClass("active");
    $(this).addClass("active");

    const tab = $(this).data("tab");
    $(".tab-content").hide();
    $(`#${tab}`).show();
  });

  $("#new-exam").click(function () {
    window.location.href = `../exam-configure/create.html?stepper=1`;
  });

  $("#settings").click(function () {
    $("#settingsModal").modal("show");
  });

  // Handle menu item clicks
  $("#settingsMenu a").on("click", function (e) {
    e.preventDefault();

    var target = $(this).data("target");

    // Hide all sections
    $(".settings-section").hide();

    // Show the selected section
    $("#" + target + "-section").show();

    // Set active class for menu item
    $("#settingsMenu a").removeClass("active");
    $(this).addClass("active");
  });

  // Initialize the first section as visible
  $("#settingsMenu a:first").click();

  $("#save-setting").on("click", function () {
    const apiEndpoint = `${EXAM_END_POINT}/setting`;

    var labels = [
      {
        name: $("#labelName1").val(),
        alias: $("#labelValue1").val(),
      },
      {
        name: $("#labelName2").val(),
        alias: $("#labelValue2").val(),
      },
    ];

    var data = {
      labels: labels,
    };

    makeApiCall({
      url: apiEndpoint,
      type: "PUT",
      headers: apiheaders,
      data: JSON.stringify(data),
      successCallback: function (response) {
        showToast("Label updated successfully!");
        updateTabCounts(0, 0, 0, 0); // Reset counts before refresh
        setTimeout(fetchExams, 1000);
        $("#settingsModal").modal("hide");
        $("#confirmationInput").val("");
      },
      errorCallback: function (error) {
        showToast("Error stopping exam: " + error);
      },
    });

    // $.ajax({
    //     url: apiEndpoint,
    //     type: 'PUT',
    //     headers: apiheaders,
    //     contentType: 'application/json',
    //     data: JSON.stringify(data),
    //     success: function (response) {
    //         showToast('Label updated successfully!');
    //         setTimeout(fetchExams, 1000);
    //         $('#settingsModal').modal('hide');
    //         $('#confirmationInput').val('');
    //     },
    //     error: function (error) {
    //         showToast('Error stopping exam: ' + error.responseJSON.message);
    //         console.error('Error stopping exam:', error);
    //     }
    // });
  });

  fetchExams();
  setCollegeDetails();
  // setting();

  $(document).on("click", ".edit-btn", handleEdit);

  $(".tab-button").first().click();
  $("#main-table-search").on("input", function () {
    const searchText = $(this).val().toLowerCase().trim();
    if (searchText === "") {
      // If cleared, fetch and show full data
      fetchExams(""); // this will fetch and show everything
      return;
    }
    // Get the currently active grid API based on the currentTab
    let activeGridApi = null;

    switch (currentTab) {
      case "all":
        activeGridApi = gridOptionsForPlan.api;
        break;
      case "today":
        activeGridApi = gridOptionsForToday.api;
        break;
      case "ongoing":
        activeGridApi = gridOptionsForGoing.api;
        break;
      case "completed":
        activeGridApi = gridOptionsForComplete.api;
        break;
    }

    if (!activeGridApi) return;

    // Apply quick filter to the active grid
    activeGridApi.setGridOption("quickFilterText", searchText);

    // Show "No rows to show" message if no matches after filtering
    if (searchText && activeGridApi.getDisplayedRowCount() === 0) {
      activeGridApi.showNoRowsOverlay();
    } else {
      activeGridApi.hideOverlay();
    }
  });
});

// Toggle action dropdown on click for reliable positioning in AG Grid
function hideAllActionDropdowns() {
  if (activeDropdown && activeActionAnchor) {
    // move dropdown back to its container for DOM cleanliness
    $(activeActionAnchor).append(activeDropdown);
  }
  $(".action-dropdown").removeClass("active").hide().css({ position: "", top: "", left: "", right: "" });
  activeActionAnchor = null;
  activeDropdown = null;
  $(".ag-row").removeClass("has-open-dropdown");
}

$(document).on("click", ".action-menu-main", function (e) {
  e.stopPropagation();
  const $container = $(this).closest(".action-container");
  const dropdown = $container.find(".action-dropdown");
  const row = $container.closest(".ag-row");

  // If already visible, close it
  if (dropdown.is(":visible")) {
    hideAllActionDropdowns();
    return;
  }

  // Close any other open dropdowns first
  hideAllActionDropdowns();

  const rect = $container[0].getBoundingClientRect();
  activeActionAnchor = $container[0];

  // Move dropdown to body so transforms/overflow from ag-grid do not affect it
  dropdown.appendTo("body");
  activeDropdown = dropdown;

  // Temporarily show (hidden) to measure size
  dropdown.css({ display: "block", visibility: "hidden" });
  const ddHeight = dropdown.outerHeight() || 220;
  const ddWidth = dropdown.outerWidth() || 200;

  const bottomSpace = window.innerHeight - rect.bottom;
  const topSpace = rect.top;
  const margin = 10; // space from viewport edges
  // Recompute based on desired behavior: prefer opening downward; if not enough space, open upward; if still not enough, clamp to edge without internal scrollbars
  let openUpwards = bottomSpace < ddHeight + margin && topSpace > ddHeight;

  // Compute left so dropdown stays in viewport; align right edge with container
  let left = Math.min(
    window.innerWidth - ddWidth - 8,
    Math.max(8, rect.right - ddWidth)
  );

  // Compute top position
  let top = openUpwards ? rect.top - ddHeight - margin : rect.bottom + margin;

  // Clamp to viewport so no internal scrollbar is needed
  if (!openUpwards && top + ddHeight > window.innerHeight - margin) {
    // Not enough space below; move upward but keep within viewport
    openUpwards = true;
    top = Math.max(margin, rect.top - ddHeight - margin);
  }
  if (openUpwards && top < margin) {
    top = margin;
  }

  // Apply fixed positioning so it's not clipped by grid containers
  dropdown
    .css({ position: "fixed", left: `${left}px`, top: `${top}px`, right: "", zIndex: 12000, display: "block", visibility: "visible" })
    .toggleClass("drop-up", openUpwards)
    .toggleClass("drop-down", !openUpwards)
    .addClass("active");

  // trap focus inside dropdown for accessibility; focus first actionable item
  const firstItem = dropdown.find('div[tabindex], button, a').get(0) || dropdown.children().get(0);
  if (firstItem) {
    try { firstItem.focus(); } catch (e) { }
  }

  row.addClass("has-open-dropdown");
});

function repositionActiveDropdown() {
  if (!activeActionAnchor) return;
  const dropdown = activeDropdown || $(activeActionAnchor).find(".action-dropdown");
  if (!dropdown || !dropdown.is(":visible")) return;
  const rect = activeActionAnchor.getBoundingClientRect();

  dropdown.css({ display: "block", visibility: "hidden" });
  const ddHeight = dropdown.outerHeight() || 220;
  const ddWidth = dropdown.outerWidth() || 200;
  dropdown.css({ visibility: "", display: "block" });

  const bottomSpace = window.innerHeight - rect.bottom;
  const topSpace = rect.top;
  const margin = 10;
  let openUpwards = bottomSpace < ddHeight + margin && topSpace > ddHeight;
  let left = Math.min(
    window.innerWidth - ddWidth - 8,
    Math.max(8, rect.right - ddWidth)
  );
  let top = openUpwards ? rect.top - ddHeight - margin : rect.bottom + margin;
  if (!openUpwards && top + ddHeight > window.innerHeight - margin) {
    openUpwards = true;
    top = Math.max(margin, rect.top - ddHeight - margin);
  }
  if (openUpwards && top < margin) {
    top = margin;
  }
  dropdown.css({ left: `${left}px`, top: `${top}px` });
}

$(window).on("scroll resize", repositionActiveDropdown);
$(document).on("scroll", ".ag-body-viewport", repositionActiveDropdown);

$(document).click(function () {
  hideAllActionDropdowns();
});

$(document).on("click", ".action-dropdown", function (e) {
  e.stopPropagation();
});

function formatDate(date) {
  return `${("0" + date.getDate()).slice(-2)}-${(
    "0" +
    (date.getMonth() + 1)
  ).slice(-2)}-${date.getFullYear()}`;
}

function showToast(message, type = 'info') {
  let iconHtml = '';
  let textColor = '';
  let bgColor = '';

  if (type === 'success') {
    iconHtml = '<i class="bi bi-check-circle-fill fs-3 me-3 text-success"></i>';
    textColor = 'color: #28a745;';
  } else if (type === 'error') {
    iconHtml = '<i class="bi bi-x-circle-fill fs-3 me-3 text-danger"></i>';
    textColor = 'color: #dc3545;';
  } else {
    iconHtml = '<i class="bi bi-info-circle-fill fs-3 me-3 text-info"></i>';
    textColor = 'color: #0dcaf0;';
  }

  const toast = $(
    '<div class="toast mt-3 ' + type + '" role="alert" aria-live="assertive" aria-atomic="true">' +
    '<div class="toast-header d-flex align-items-center w-100">' +
    iconHtml +
    '<div class="d-flex flex-column flex-grow-1">' +
    '<strong class="notify-title fs-5" style="' + textColor + '">Notification</strong>' +
    '<div class="toast-body p-0 fs-6">' + message + '</div>' +
    '</div>' +
    '<button type="button" class="btn-close ms-3" data-bs-dismiss="toast" aria-label="Close"></button>' +
    '</div>' +
    '</div>'
  );

  $("#toast-container").append(toast);
  toast.toast({ delay: 3000 });
  toast.toast("show");
}


(function () {
  history.pushState(null, null, location.href);

  window.addEventListener("popstate", function (event) {
    location.reload(true);
  });
})();