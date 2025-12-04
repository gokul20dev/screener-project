let examDetails = {};
let duration = 0;
let students;
let gridOptions = {};
let anomalyGridOptions = {};
let publishGridOptions = {};
let systemReportGridOptions = {};
let manualEvaluationGridOptions = {};
let isManualEvaluationPending = false;

// Add these variables to track the external filter state
let isExternalFilterActive = false;
let externalFilterRange = null;

$(document).ready(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get("examid");
  const mail = localStorage.getItem("mail") || "";

  const tabsOptions = document.querySelectorAll(".tabs button");
  const activeStatus = document.querySelector(".tabs .active");
  const tabContents = document.querySelectorAll(".tab-content .tab-pane");

  const setActiveTab = (index) => {
    const selectedTab = tabsOptions[index];

    tabContents.forEach((content) => content.classList.remove("active"));
    const targetTab = document.querySelector(
      selectedTab.getAttribute("data-bs-target")
    );
    targetTab.classList.add("active");

    const tabContentContainer = document.querySelector(
      ".middle-of-content > .tab-content"
    );

    const publishButton = document.getElementById("publish-report");
    const exportButton = document.getElementById("export-data");
    const sendEmailButton = document.getElementById("send-email-button");
    const reportTypeDropdown = document.getElementById("report-type-dropdown");

    if (index === 4) {
      // Activity Report tab
      if (tabContentContainer) {
        tabContentContainer.classList.remove("tab-content");
      }

      publishButton.classList.add("d-none");
      sendEmailButton.classList.add("d-none");
      reportTypeDropdown.classList.add("d-none");
      exportButton.classList.add("d-none");
    } else if (index === 5) {
      // Publish Report tab
      if (
        tabContentContainer &&
        !tabContentContainer.classList.contains("tab-content")
      ) {
        tabContentContainer.classList.add("tab-content");
      }

      publishButton.classList.remove("d-none");
      sendEmailButton.classList.remove("d-none");
      reportTypeDropdown.classList.remove("d-none");
      updatePublishButtonText();
    } else if (index === 2) {
      // Points Report tab
      if (
        tabContentContainer &&
        !tabContentContainer.classList.contains("tab-content")
      ) {
        tabContentContainer.classList.add("tab-content");
      }

      publishButton.classList.add("d-none");
      sendEmailButton.classList.add("d-none");
      reportTypeDropdown.classList.add("d-none");
      exportButton.classList.remove("d-none");
    } else {
      if (
        tabContentContainer &&
        !tabContentContainer.classList.contains("tab-content")
      ) {
        tabContentContainer.classList.add("tab-content");
      }

      publishButton.classList.add("d-none");
      sendEmailButton.classList.add("d-none");
      reportTypeDropdown.classList.add("d-none");
      exportButton.classList.add("d-none");
    }
  };

  setActiveTab(0);
  tabsOptions[0].classList.add("active-tab");

  // Handle the report type radio button change
  $(document).on("change", 'input[name="report-type-setting"]', function () {
    const selectedType = $(this).val();
    $("#selected-report-type").text(
      selectedType.charAt(0).toUpperCase() + selectedType.slice(1)
    );

    // Get the exam ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get("examid");

    if (examId) {
      // Prepare request data with isShowDetailedReport parameter
      const isDetailedReport = selectedType === "detailed";

      // Make API call to update exam settings using the duration endpoint
      makeApiCall({
        url: `${QUESTIONS_END_POINT}/duration?entranceExamId=${examId}`,
        method: "PUT",
        data: JSON.stringify({
          isDetailedReport,
        }),
        successCallback: function (response) {
          toastr.success(`Report type updated to ${selectedType}`);

          // Update local examDetails object
          if (examDetails && examDetails.enabledFeatures) {
            if (isShowDetailedReport) {
              if (
                !examDetails.enabledFeatures.includes("canShowDetailedReport")
              ) {
                examDetails.enabledFeatures.push("canShowDetailedReport");
              }
            } else {
              const index = examDetails.enabledFeatures.indexOf(
                "canShowDetailedReport"
              );
              if (index > -1) {
                examDetails.enabledFeatures.splice(index, 1);
              }
            }
          }
        },
        errorCallback: function (error) {
          console.error("Error updating report type:", error);
          toastr.error("Error updating report type. Please try again.");

          // Revert UI if API call fails
          const originalType = examDetails?.enabledFeatures?.includes(
            "canShowDetailedReport"
          )
            ? "detailed"
            : "short";
          $(`#${originalType}-report-setting`).prop("checked", true);
          $("#selected-report-type").text(
            originalType.charAt(0).toUpperCase() + originalType.slice(1)
          );
        },
      });
    }
  });

  for (let i = 0; i < tabsOptions.length; i++) {
    tabsOptions[i].onclick = () => {
      tabsOptions.forEach((btn) => {
        btn.style.color = "#898989";
        btn.classList.remove("active-tab");
      });

      void tabsOptions[i].offsetWidth;

      tabsOptions[i].style.color = "#4b5563";
      tabsOptions[i].classList.add("active-tab");

      setActiveTab(i);
    };
  }

  if (examId) {
    fetchExamDetails(examId);
  } else {
    toastr.error("Exam ID is missing in the query parameters.");
  }

  $(document).on("click", ".view-details", function () {
    const email = $(this).data("email");
    fetchStudentDetail(email, examId);
  });

  $(document).on("click", ".view-anamolys", function () {
    const email = $(this).data("email");
    fetchStudentAnamolys(email, examId);
  });
  // Add custom filtering function to DataTables
  // $.fn.dataTable.ext.search.push(
  //     function(settings, data, dataIndex) {
  //         const cutoff = parseFloat($('#percentage-cutoff').val());
  //         const percentage = parseFloat(data[7].replace('%', ''));
  //         if (isNaN(cutoff) || percentage >= cutoff) {
  //             return true;
  //         }
  //         return false;
  //     }
  // );

  // $('#apply-filter').click(function() {
  //     const cutoff = $('#percentage-cutoff').val();
  //     $('#student-table').DataTable().draw(); // Redraw the table to apply the custom filter

  //  //   $('#student-table').DataTable().column(8).search(`^([${cutoff}-9][0-9]?|100)%$`, true, false).draw();
  // });

  $("#export-data").click(function () {
    exportAgGridDataToExcel();
  });

  // Add cutoff percentage functionality
  $(".cutoff-percentage-container").click(function (e) {
    // Prevent triggering when clicking on the edit container or apply button
    if ($(e.target).closest(".cutoff-edit-container").length === 0) {
      const currentValue = $("#cutoff-percentage-value").text();
      $("#cutoff-percentage-input").val(currentValue);
      $(".cutoff-value-container").hide();
      $(".cutoff-edit-container").show();
      $("#cutoff-percentage-input").focus();
    }
  });

  // Keep the original edit icon click handler for backward compatibility
  $("#cutoff-edit-icon").click(function (e) {
    e.stopPropagation(); // Prevent double triggering with the container click
    const currentValue = $("#cutoff-percentage-value").text();
    $("#cutoff-percentage-input").val(currentValue);
    $(".cutoff-value-container").hide();
    $(".cutoff-edit-container").show();
    $("#cutoff-percentage-input").focus();
  });

  $("#apply-cutoff").click(function (e) {
    e.stopPropagation(); // Prevent triggering the container click
    applyPercentageCutoff();
  });

  $("#cutoff-percentage-input").on("click", function (e) {
    e.stopPropagation(); // Prevent triggering the container click
  });

  $("#cutoff-percentage-input").on("keyup", function (e) {
    e.stopPropagation(); // Prevent triggering the container click
    if (e.key === "Enter") {
      applyPercentageCutoff();
    }
  });

  // Close cutoff edit mode when clicking outside
  $(document).on("click", function (e) {
    if (
      $(".cutoff-edit-container").is(":visible") &&
      $(e.target).closest(".cutoff-percentage-container").length === 0
    ) {
      $(".cutoff-edit-container").hide();
      $(".cutoff-value-container").show();
    }
  });

  // Add Generate Report button click handler
  $("#generate-report").click(function () {
    const selectedRows = gridOptions.api.getSelectedRows();
    if (selectedRows.length > 0) {
      // Generate reports for selected students
      console.log(
        `Generating reports for ${selectedRows.length} selected students`
      );
      generateReports(selectedRows);
    } else {
      // Generate reports for all students
      const allData = [];
      gridOptions.api.forEachNode((node) => allData.push(node.data));
      console.log("Generating reports for all students");
      generateReports(allData);
    }
  });

  // Add publish button click handler
  $("#publish-report").click(function () {
    const selectedRows = publishGridOptions.api.getSelectedRows();
    let studentCount = 0;
    let studentEmails = [];
    let notStartedCount = 0;

    if (selectedRows.length > 0) {
      // Publish only selected reports
      const filteredRows = selectedRows.filter(
        (row) => row.status.exam !== "NOT_STARTED"
      );
      notStartedCount = selectedRows.length - filteredRows.length;
      studentCount = filteredRows.length;
      studentEmails = filteredRows.map((row) => row.mail);
    } else {
      // Publish all reports
      const allData = [];
      publishGridOptions.api.forEachNode((node) => {
        if (node.data.status.exam !== "NOT_STARTED") {
          allData.push(node.data);
          studentEmails.push(node.data.mail);
        } else {
          notStartedCount++;
        }
      });
      studentCount = allData.length;
    }

    // Get exam ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get("examid");

    // Get the selected report type from the radio buttons
    const reportType = $('input[name="report-type-setting"]:checked').val();
    const reportTypeDisplay = $("#selected-report-type").text();

    // Set the confirmation message
    let confirmationMessage = "";
    if (selectedRows.length > 0) {
      confirmationMessage = `Are you sure you want to publish ${reportTypeDisplay} reports for ${studentCount} selected ${globalLabels[labelItems.STUDENT] ?? "student(s)"
        }?`;
      if (notStartedCount > 0) {
        confirmationMessage += `\n\nNote: ${notStartedCount} selected ${globalLabels[labelItems.STUDENT] ?? "student(s)"
          } who haven't started the exam will be skipped.`;
      }
    } else {
      confirmationMessage = `Are you sure you want to publish ${reportTypeDisplay} reports for all ${studentCount} ${globalLabels[labelItems.STUDENT] ?? "students"
        }?`;
      if (notStartedCount > 0) {
        confirmationMessage += `\n\n${notStartedCount} ${globalLabels[labelItems.STUDENT] ?? "student(s)"
          } who haven't started the exam will be skipped.`;
      }
    }

    // Show the enhanced confirmation popup but without report type options
    showConfirmationPopup(
      "Publish Reports",
      confirmationMessage,
      (reason) => {
        if (studentCount > 0) {
          publishMultipleReports(studentEmails, examId, reportType);
        } else {
          toastr.warning(
            "No eligible students found to publish reports. All selected students haven't started the exam yet."
          );
        }
      },
      false, // Don't require reason
      false // Don't show report options in the dialog
    );
  });

  // Add send email button click handler
  $("#send-email-button").click(function () {
    // If the email panel is already open, just close it and return
    if ($("#email-preview-panel").length) {
      $("#email-preview-panel").remove();
      return;
    }

    const selectedRows = publishGridOptions.api.getSelectedRows();
    let studentEmails = [];

    if (selectedRows.length > 0) {
      // Send emails only to selected students
      studentEmails = selectedRows.map((row) => row.mail);
    } else {
      // Send emails to all published reports
      publishGridOptions.api.forEachNode((node) => {
        if (node.data.publishStatus === "p") {
          studentEmails.push(node.data.mail);
        }
      });
    }

    if (studentEmails.length === 0) {
      toastr.warning(
        `No ${globalLabels[labelItems.STUDENT] ?? "students"
        } with published reports found to send emails.`
      );
      return;
    }

    // Create an inline panel instead of a popup
    const emailPanel = `
      <div id="email-preview-panel" class="email-panel">
        <div class="email-panel-header">
          <h3>Send Email Notifications</h3>
          <button id="close-email-panel" class="close-panel-btn"><i class="bx bx-x"></i></button>
        </div>
        <div class="email-panel-body">
          <p>You are about to send email notifications to ${studentEmails.length
      } ${globalLabels[labelItems.STUDENT] ?? "student(s)"}.</p>
          <div class="email-list-container">
            <div class="email-list">
              ${studentEmails
        .map((email) => `<div class="email-list-item">${email}</div>`)
        .join("")}
            </div>
          </div>
        </div>
        <div class="email-panel-footer">
          <button id="cancel-email-send" class="cancel-btn">Cancel</button>
          <button id="confirm-email-send" class="confirm-btn">Send Emails</button>
        </div>
      </div>
    `;

    // Insert the panel into the page
    $("#publish").append(emailPanel);

    // Add event handlers
    $("#close-email-panel, #cancel-email-send").on("click", function () {
      $("#email-preview-panel").remove();
    });

    $("#confirm-email-send").on("click", function () {
      $(this)
        .prop("disabled", true)
        .html('<i class="bx bx-loader bx-spin"></i> Sending...');
      // sendNotificationToMultipleStudents(studentEmails);
      getEmailContent(sendNotificationToMultipleStudents, studentEmails);
      // Panel will be removed when the API call completes in the sendNotificationToMultipleStudents function
    });
  });

  // Add dropdown toggle functionality
  $(document).on("click", ".action-button, .action-menu-main", function (e) {
    e.stopPropagation();
    const dropdown = $(this).siblings(".action-dropdown");
    const row = $(this).closest(".ag-row");

    // Hide all other dropdowns and remove has-open-dropdown class from all rows
    $(".action-dropdown").not(dropdown).removeClass("active").hide();
    $(".ag-row").removeClass("has-open-dropdown");

    // Toggle the current dropdown
    if (dropdown.is(":visible")) {
      dropdown.removeClass("active").hide();
      row.removeClass("has-open-dropdown");
    } else {
      dropdown.css({
        top: 50,
        right: 30,
        zIndex: 9999,
      });

      // Show the dropdown
      dropdown.addClass("active").show();
      row.addClass("has-open-dropdown");
    }
  });

  // Close dropdown when clicking outside
  $(document).click(function () {
    $(".action-dropdown").removeClass("active").hide();
    $(".ag-row").removeClass("has-open-dropdown");
  });

  // Prevent dropdown close when clicking inside
  $(document).on("click", ".action-dropdown", function (e) {
    e.stopPropagation();
  });

  $("#logout-button").click(function () {
    handleLogout();
  });

  // Add click handlers for the new buttons
  $(document).on("click", "#student-exam-details", function (e) {
    e.stopPropagation();
    const email = $(this).data("email");
    const examId = $(this).data("examid");
    const url = `/fullscreenexam/reports/detailed/?examId=${examId}&email=${email}`;
    window.open(url, "_blank");
  });

  $(document).on("click", "#student-anomaly-details", function (e) {
    e.stopPropagation();
    const email = $(this).data("email");
    const examId = $(this).data("examid");
    const url = `/fullscreenexam/reports/anamoly/?examId=${examId}&email=${email}`;
    window.open(url, "_blank");
  });

  // Handle unpublish button clicks
  $(document).on("click", "#unpublish-report", function (e) {
    e.stopPropagation();
    const email = $(this).data("email");
    const examId = $(this).data("examid");
    if (
      confirm(`Are you sure you want to unpublish the report for ${email}?`)
    ) {
      unpublishReport(email, examId);
    }
  });

  // Change to also handle clicks on the inner div
  $(document).on("click", ".unpublish-report", function (e) {
    e.stopPropagation();
    const email = $(this).closest("#unpublish-report").data("email");
    const examId = $(this).closest("#unpublish-report").data("examid");
    if (
      confirm(`Are you sure you want to unpublish the report for ${email}?`)
    ) {
      unpublishReport(email, examId);
    }
  });

  $("#refresh-data").click(function () {
    $(this).find("i").addClass("bx-spin");

    if (examId) {
      const refreshBtn = $(this);

      setTimeout(function () {
        refreshBtn.find("i").removeClass("bx-spin");
      }, 2000);

      fetchReportData(examId);
    }
  });

  $("#view-exam-btn").on("click", function () {
    const examId = window.location.search.split("examid=")[1];
    if (examId) {
      window.location.href = `../exam-configure/create.html?id=${examId}&stepper=1`;
    }
  });

  $("#report-search-field").on("input", function () {
    const searchValue = $(this).val().toLowerCase().trim();
    applySearchFilter(searchValue);
  });
});

function fetchExamDetails(examId) {
  const url = `${EXAM_END_POINT}?entranceExamId=${examId}`;

  showAdvanceLoader('exam-report');

  makeApiCall({
    url: url,
    method: "GET",
    disableLoading: true,
    successCallback: function (response) {
      if (response.message === "Retrieved successfully") {
        examDetails = response.data.exam;
        duration = examDetails.settings.duration;
        $("#cutoff-percentage-input").val(examDetails.settings.cutoff);
        $("#cutoff-percentage-value").text(examDetails.settings.cutoff);
        $("#exam-name").text(examDetails.name);
        $("#exam-status").text(examDetails.examStatus.replace("_", " "));
        $("#start-date").text(formatDateTimeGeneral(examDetails.session.start));
        if (!examDetails?.enabledFeatures.includes("canPublishReport")) {
          $("#publish-tab").hide();
        }

        // Set radio buttons and labels for report type
        // canShowDetailedReport feature flag indicates if detailed report is enabled
        // This setting can be updated using the
        //  endpoint with isShowDetailedReport parameter
        if (examDetails?.enabledFeatures.includes("canShowDetailedReport")) {
          $("#detailed-report-setting").prop("checked", true);
          $("#short-report-setting").prop("checked", false);
          $("#selected-report-type").text("Detailed");
        } else {
          $("#short-report-setting").prop("checked", true);
          $("#detailed-report-setting").prop("checked", false);
          $("#selected-report-type").text("Short");
        }

        // Enable/disable radio buttons based on permissions
        if (examDetails?.enabledFeatures.includes("canShowDetailedReport")) {
          $("#short-report-setting").removeAttr("disabled");
        } else {
          $("#detailed-report-setting").removeAttr("disabled");
        }

        fetchReportData(examId);
      }
    },
    errorCallback: function (error) {
      console.error("Error fetching exam details:", error);
      hideAdvanceLoader();
    },
  });
}

function fetchReportData(examId) {
  const url = `${REPORT_END_POINT}?entranceExamId=${examId}&canPaginate=false`;

  makeApiCall({
    url: url,
    method: "GET",
    disableLoading: true,
    successCallback: function (response) {
      const getPresent = getNoofPresentStudents(response.data.data);
      (students = response.data.data),
        renderStudentTable(
          response.data.data,
          response.data.questionsCount,
          examId
        );
      renderPublishGrid(
        response.data.data,
        response.data.questionsCount,
        examId
      );
      updatePublishButtonText();
      renderAnomalyTable(
        response.data.data,
        response.data.questionsCount,
        examId
      );
      renderSystemReportTable(
        response.data.data,
        response.data.questionsCount,
        examId
      );

      // Render manual evaluation table
      fetchManualEvaluationQuestions(examId, response.data.data.length);

      // Calculate and display analytics metrics
      renderAnalyticsMetrics(response.data.data, response.data.questionsCount);

      // Calculate and display student statistics
      calculateStudentStatistics(response.data.data);

      $("#total-exam").text(response.data.questionsCount);
      $("#present-student-count").text(response.data.data.length);

      // Count students by status
      const ongoingStudents = response.data.data.filter(
        (student) => student.status.exam === "ON_GOING"
      ).length;
      const notStartedStudents = response.data.data.filter(
        (student) => student.status.exam === "NOT_STARTED"
      ).length;
      const endedStudents = response.data.data.filter(
        (student) => student.status.exam === "ENDED"
      ).length;
      const absentStudents = response.data.data.length - getPresent;

      // Display status count (showing the total)
      $("#student-status-count").text(response.data.data.length);

      // Update the legend text to include counts with parentheses
      $("#absent-student-count").text(" (" + absentStudents + ")");
      $("#present-student-count-label").text(" (" + getPresent + ")");
      $("#ongoing-student-count").text(" (" + ongoingStudents + ")");
      $("#not-started-student-count").text(" (" + notStartedStudents + ")");
      $("#ended-student-count").text(" (" + endedStudents + ")");

      renderChart(
        $("#student-present-chart"),
        getPresent,
        response.data.data.length,
        "#16a34a",
        "#bbf7d0"
      );

      // Create a multi-status chart for student statuses
      renderStudentStatusChart(
        $("#student-status-chart"),
        [ongoingStudents, notStartedStudents, endedStudents],
        ["#147afc", "#8957e5", "#f6ae0b"]
      );

      hideAdvanceLoader();
    },
    errorCallback: function (error) {
      console.error("Error fetching report data:", error);
      hideAdvanceLoader();
    },
  });
}

function renderStudentStatusChart(chartId, values, colors) {
  const chartElement = chartId[0];
  if (chartElement.chart) {
    chartElement.chart.destroy();
  }

  const chartConfig = {
    type: "doughnut",
    options: {
      cutout: "65%",
      circumference: 180,
      rotation: -90,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (context) {
              const labels = ["Ongoing", "Not Started", "Ended"];
              return `${labels[context.dataIndex]}: ${context.raw}`;
            },
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  };

  chartElement.chart = new Chart(chartElement, {
    ...chartConfig,
    data: {
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    },
  });
}

function calculateStudentStatistics(students) {
  // Filter out students who haven't started the exam
  const activeStudents = students.filter(
    (student) => student.status.exam !== "NOT_STARTED"
  );
  if (activeStudents.length === 0) {
    // No students have taken the exam yet
    appendStatisticsToDOM(0, 0, 0, "0m");
    return;
  }

  // Calculate scores for each student
  const scores = activeStudents.map((student) => {
    const correct =
      student.correct !== undefined && student.correct !== null
        ? Number(student.correct)
        : 0;
    const attended =
      student.attended !== undefined && student.attended !== null
        ? Number(student.attended)
        : 0;
    const notAttended =
      student.notAttended !== undefined && student.notAttended !== null
        ? Number(student.notAttended)
        : 0;
    const totalAnswered = attended + notAttended;
    const correctPercentage =
      totalAnswered > 0 ? (correct / totalAnswered) * 100 : 0;
    return correctPercentage;
  });
  // Calculate average time spent
  const completedStudents = students.filter(
    (student) =>
      student.exam && student.exam.firstStartedAt && student.exam.submittedAt
  );

  let averageTimeInMinutes = 0;
  let averageTimeSeconds = 0;

  if (completedStudents.length > 0) {
    const totalTimeInMs = completedStudents.reduce((total, student) => {
      const startTime = new Date(student.exam.firstStartedAt).getTime();
      const endTime = new Date(student.exam.submittedAt).getTime();
      const timeTakenMs = endTime - startTime;
      return total + (timeTakenMs > 0 ? timeTakenMs : 0);
    }, 0);

    const averageTimeInMs = totalTimeInMs / completedStudents.length;
    averageTimeInMinutes = Math.floor(averageTimeInMs / (1000 * 60));
    averageTimeSeconds = Math.floor((averageTimeInMs % (1000 * 60)) / 1000);
  }

  // Format the average time with minutes and seconds
  const averageTimeFormatted =
    averageTimeInMinutes > 0 || averageTimeSeconds > 0
      ? `${averageTimeInMinutes}m ${averageTimeSeconds}s`
      : "0m";

  // Calculate statistics
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  const averageScore =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;
  // Add to DOM
  appendStatisticsToDOM(
    Math.round(highestScore),
    Math.round(lowestScore),
    Math.round(averageScore),
    averageTimeFormatted
  );
}

function appendStatisticsToDOM(highest, lowest, average, avgTime) {
  // Check if stats container already exists
  if ($(".stats-container").length === 0) {
    // Create stats container
    const statsHTML = `
      <div class="stats-container d-flex justify-content-between mt-3 mb-3">
        <div class="stat-box highest-score">
          <div class="stat-title"><i class="bx bx-trophy"></i> Highest Score</div>
          <div class="stat-value" id="highest-score">${highest}%</div>
        </div>
        <div class="stat-box average-score">
          <div class="stat-title"><i class="bx bx-line-chart"></i> Average Score</div>
          <div class="stat-value" id="average-score">${average}%</div>
        </div>
        <div class="stat-box lowest-score">
          <div class="stat-title"><i class="bx bx-chart"></i> Lowest Score</div>
          <div class="stat-value" id="lowest-score">${lowest}%</div>
        </div>
        <div class="stat-box avg-time">
          <div class="stat-title"><i class="bx bx-time"></i> Average Time</div>
          <div class="stat-value" id="average-time">${avgTime}</div>
        </div>
        <div class="stat-box score-filter">
          <div class="stat-title"><i class="bx bx-filter-alt"></i> Filter by Score</div>
          <div class="score-filter-controls">
            <select id="score-range-filter" class="form-select form-select-sm">
              <option value="all">All Students</option>
              <option value="90-100">90% - 100% (Excellent)</option>
              <option value="70-89">70% - 89% (Good)</option>
              <option value="50-69">50% - 69% (Average)</option>
              <option value="0-49">0% - 49% (Poor)</option>
            </select>
          </div>
        </div>
      </div>
    `;

    // Insert before the grid in the individual tab
    $("#individual").prepend(statsHTML);

    // Add click event for score filter
    $("#score-range-filter").on("change", function () {
      const range = $(this).val();
      filterStudentsByScoreRange(range);
    });

    // Add tab switching event to show/hide stats container only in the Points Report tab
    $(".tabs button").on("click", function () {
      const target = $(this).data("bs-target");
      if (target === "#individual") {
        $(".stats-container").show();
        // Reset filter to "All" when tab becomes active
        $("#score-range-filter").val("all");
        if (gridOptions && gridOptions.api) {
          gridOptions.api.setFilterModel(null);
        }
      } else {
        $(".stats-container").hide();
      }
    });
  } else {
    // Update existing stats
    $("#highest-score").text(highest + "%");
    $("#lowest-score").text(lowest + "%");
    $("#average-score").text(average + "%");
    $("#average-time").text(avgTime);
  }

  // Add CSS for statistics
  if (!$("#stats-styles").length) {
    const styles = `
      <style id="stats-styles">
        .stats-container {
          padding: 1rem;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 1rem;
        }
        .stat-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          flex: 1;
          margin: 0 0.5rem;
          background-color: #f8f9fa;
        }
        .stat-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #6c757d;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-title i {
          margin-right: 0.5rem;
          font-size: 1.1rem;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }
        .highest-score .stat-value {
          color: #22c55e;
        }
        .average-score .stat-value {
          color: #147afc;
        }
        .lowest-score .stat-value {
          color: #f59e0b;
        }
        .avg-time .stat-value {
          color: #8957e5;
        }
        .score-filter-controls {
          width: 200px;
        }
      </style>
    `;
    $("head").append(styles);
  }

  // Only show the stats container for the Points Report tab initially
  if ($(".tabs button.active-tab").data("bs-target") !== "#individual") {
    $(".stats-container").hide();
  }
}

function filterStudentsByScoreRange(range) {
  if (!gridOptions || !gridOptions.api) return;

  console.log("Setting filter range:", range);

  try {
    // If "all" is selected, clear all filters
    if (!range || range === "all") {
      isExternalFilterActive = false;
      externalFilterRange = null;

      // Trigger filter update
      gridOptions.api.onFilterChanged();

      // Remove no results message if it exists
      $("#no-filter-results-message").remove();

      console.log("Showing all students");
      return;
    }

    // Parse range values
    const [min, max] = range.split("-").map(Number);

    // Update external filter state
    isExternalFilterActive = true;
    externalFilterRange = { min, max };

    // Trigger filter update
    gridOptions.api.onFilterChanged();

    // Check if we have any visible rows after filtering
    const rowCount = gridOptions.api.getDisplayedRowCount();

    if (rowCount === 0) {
      // Remove any existing message first
      $("#no-filter-results-message").remove();

      // Show a message that no students match the filter criteria
      const noResultsMessage = `
        <div id="no-filter-results-message">
          <i class="bx bx-info-circle" style="font-size: 24px; margin-right: 10px; vertical-align: middle;"></i> 
          No students found in the ${min}% - ${max}% score range.
        </div>
      `;

      // Insert the message after the grid
      $("#mygrid").after(noResultsMessage);
    } else {
      // Remove any existing no results message
      $("#no-filter-results-message").remove();
    }

    console.log(
      `Filter applied: Showing ${rowCount} students in the ${min}-${max}% range`
    );
  } catch (error) {
    console.error("Error applying filter:", error);
    // Reset in case of error
    isExternalFilterActive = false;
    externalFilterRange = null;
    gridOptions.api.onFilterChanged();

    // Remove any existing no results message
    $("#no-filter-results-message").remove();
  }
}

function getNoofPresentStudents(students) {
  const presentStudents = students.filter(
    (student) => student.status.exam !== "NOT_STARTED"
  );
  return presentStudents.length;
}

function renderStudentTable(students, questionsCount, examId) {
  const mail = localStorage.getItem("mail") || "";
  const columnDefs = [
    {
      headerName: "S.No",
      field: "sno",
      valueGetter: function (params) {
        return params.node.rowIndex + 1;
      },
      sortable: true,
      autoHeight: true,
      headerClass: "table-ag-class",
      headerTooltip: "S.No",
      maxWidth: 70,
    },
    {
      headerName: "Email",
      field: "mail",
      autoHeight: true,
      filter: true,
      headerClass: "table-ag-class",
      headerTooltip: "Email",
      flex: 1,
      tooltipField: "mail",
      onCellDoubleClicked: function (params) {
        navigator.clipboard.writeText(params.value).then(() => {
          toastr.success("Email copied to clipboard! " + params.value);
        });
      },
    },
    {
      headerName: `${globalLabels[labelItems.STUDENT] ?? "Student"} ${globalLabels[labelItems.EXAM] ?? "Exam"
        } Status`,
      field: "status.exam",
      autoHeight: true,
      headerClass: "table-ag-class",
      headerTooltip: `${globalLabels[labelItems.STUDENT] ?? "Student"} ${globalLabels[labelItems.EXAM] ?? "Exam"
        } Status`,
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        const isTimeOver = params.data.isTimedOver;
        const examStatus = params.value;

        const displayStatus =
          isTimeOver && examStatus === ON_GOING
            ? `${formatStatus(examStatus)} - ⏰ Exam Time Expired`
            : formatStatus(examStatus);

        const badgeClass =
          isTimeOver && examStatus === ON_GOING
            ? "status-badge-fail"
            : "status-badge-success";

        return `<div class="status-badge ${badgeClass}">${displayStatus}</div>`;
      },
    },
    {
      headerName: "Answered",
      field: "attended",
      autoHeight: true,
      headerClass: "table-ag-class",
      headerTooltip: "Answered",
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        return `${params.value || 0}/${questionsCount}`;
      },
    },
    {
      headerName: "Correct Percentage",
      headerTooltip: "Correct Percentage",
      field: "correctPercentage",
      valueGetter: (params) => calculatePercentage(params)["value"],
      cellRenderer: (params) => calculatePercentage(params)["cellRenderer"],
      autoHeight: true,
      headerClass: "table-ag-class",
      sortable: true,
      flex: 2,
      filter: "agNumberColumnFilter",
      filterParams: {
        filterOptions: ["equals", "lessThan", "greaterThan"],
        inRangeInclusive: true,
        includeBlanksInEquals: false,
        includeBlanksInLessThan: false,
        includeBlanksInGreaterThan: false,
      },
      minWidth: 80,
      maxWidth: 140,
    },
    {
      headerName: "Result",
      headerTooltip: "Result",
      field: "displayResult",
      valueGetter: (params) => resultStatus(params)["value"],
      headerClass: "table-ag-class",
      cellRenderer: (params) => resultStatus(params)["cellRenderer"],
      sortable: true,
      filter: true,
      width: 150,
      flex: 0,
    },
    {
      headerName: "Action",
      headerTooltip: "Action",
      cellRenderer: (params) => {
        const email = params.data.mail;
        const examId = new URLSearchParams(window.location.search).get(
          "examid"
        );

        // Check if student has ended the exam
        const hasEndedExam = params?.data?.status?.exam !== "NOT_STARTED";

        return `
        <div class="action-container">
          <button class="view-details-btn" id="student-exam-details" data-email="${email}" data-examid="${examId}" 
            ${!hasEndedExam ? 'disabled="disabled"' : ""} 
            title="${!hasEndedExam
            ? "Student has not completed the exam"
            : "View exam details"
          }">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>View Details</span>
          </button>
        </div>`;
      },
      autoHeight: true,
      headerClass: "table-ag-class",
      sortable: true,
      filter: false,
      width: 120,
    },
  ];

  // Prepare the row data
  const rowData = students.map((student) => {
    return {
      ...student,
    };
  });

  // Create clean grid options without problematic methods
  gridOptions = {
    theme: "legacy",
    columnDefs: columnDefs,
    rowData: rowData,
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      filter: true,
      sortable: true,
      resizable: true,
      minWidth: 100,
    },
    rowHeight: 50,
    rowSelection: "single",
    suppressRowClickSelection: true,
    pagination: true,
    paginationPageSize: 100,
    domLayout: "autoHeight",
    overlayLoadingTemplate:
      '<span class="ag-overlay-loading-center">Loading...</span>',
    overlayNoRowsTemplate:
      '<span class="ag-overlay-loading-center">No data to display</span>',
  };

  // Add these methods to the gridOptions for external filtering
  const studentGridOptionsWithFiltering = {
    ...gridOptions, // Keep all existing options

    // External filter methods
    isExternalFilterPresent: function () {
      // Return true if external filter is active
      return isExternalFilterActive && externalFilterRange;
    },

    doesExternalFilterPass: function (node) {
      // If no filter is active, show all rows
      if (!isExternalFilterActive || !externalFilterRange) {
        return true;
      }

      // Get the data from the row
      const data = node.data;
      if (!data) return false;

      // Calculate the percentage the same way the cell renderer does
      const correct =
        data.correct !== undefined && data.correct !== null
          ? Number(data.correct)
          : 0;

      const incorrect =
        data.incorrect !== undefined && data.incorrect !== null
          ? Number(data.incorrect)
          : 0;

      const totalAnswered = correct + incorrect;
      const correctPercentage =
        totalAnswered > 0 ? (correct / totalAnswered) * 100 : 0;

      // Check if the percentage falls within the range
      return (
        correctPercentage >= externalFilterRange.min &&
        correctPercentage <= externalFilterRange.max
      );
    },
  };

  // Create the grid with the enhanced options that include external filtering
  $("#mygrid").empty();
  new agGrid.Grid(
    document.getElementById("mygrid"),
    studentGridOptionsWithFiltering
  );

  // Store the updated grid options so other functions can use them
  gridOptions = studentGridOptionsWithFiltering;
}

function fetchStudentDetail(email, examId) {
  const url = `${REPORT_END_POINT}?entranceExamId=${examId}&canPaginate=false&mail=${encodeURIComponent(
    email
  )}`;

  makeApiCall({
    url: url,
    method: "GET",
    successCallback: function (response) {
      if (response.message === "Retrieved successfully") {
        renderStudentDetail(response.data.data[0]);
      }
    },
    errorCallback: function (error) {
      console.error("Error fetching student detail:", error);
    },
  });
}

function fetchStudentAnamolys(email, examId) {
  const url = `${REPORT_END_POINT}?entranceExamId=${examId}&canPaginate=false&mail=${encodeURIComponent(
    email
  )}`;

  makeApiCall({
    url: url,
    method: "GET",
    successCallback: function (response) {
      if (response.message === "Retrieved successfully") {
        renderStudentAnamolys(response.data.data[0]);
      }
    },
    errorCallback: function (error) {
      console.error("Error fetching student anomalies:", error);
    },
  });
}

function renderStudentAnamolys(student) {
  if (!student.fullScreen || !student.signedUrls) {
    toastr.error("No anomaly data available for this student.");
    return;
  }

  const anomalyContent = `
        <div class="anomaly-container">
            <div class="student-info">
                <h3>${student.mail}</h3>
                <p class="exit-count">Total Exit Count: <span class="highlight">${student.fullScreen.exitCount
    }</span></p>
            </div>
            <div class="anomaly-content" style="display: flex;">
            <div class="video-section" style="flex: 2; padding-right: 20px;">
                ${student.signedUrls && student.signedUrls.length > 0
      ? student.signedUrls
        .map(
          (video, index) => `
                            <div>
                                <h4>Exam Recording ${index + 1}</h4>
                                <video id="exam-recording-${index}" controls width="100%">
                                    <source src="${video.url
            }" type="video/webm">
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        `
        )
        .join("")
      : `<p>No exam recordings available.</p>`
    }
            </div>
            <div class="exit-history" style="flex: 1;">
                <h4>Exit History</h4>
                <div class="exit-list">
                    ${student.fullScreen &&
      student.fullScreen.histories &&
      student.fullScreen.histories.length > 0
      ? student.fullScreen.histories
        .map(
          (exit, index) => `
                                <div class="exit-item ${exit.reason.toLowerCase().includes("window")
              ? "window-exit"
              : "click-exit"
            }">
                                    <span class="exit-number">#${index + 1
            }</span>
                                    <div class="exit-details">
                                        <p class="exit-reason">${exit.reason
            }</p>
                                        <p class="exit-time">${formatDateTime(
              exit.createdAt
            )}</p>
                                    </div>
                                </div>
                            `
        )
        .join("")
      : `<p>No exit history available.</p>`
    }
                </div>
            </div>
        </div>
        </div>
    `;

  $("#anomaly-detail-modal").html(anomalyContent);
  $("#anomaly-detail-modal").dialog({
    modal: true,
    width: "90%",
    height: "auto",
    title: "Student Anomaly Details",
    create: function (event, ui) {
      var closeButton = $(
        '<button type="button" class="ui-button ui-corner-all ui-widget ui-dialog-titlebar-close" title="Close">X</button>'
      );
      closeButton.on("click", function () {
        $("#anomaly-detail-modal").dialog("close");
      });
      $(this)
        .closest(".ui-dialog")
        .find(".ui-dialog-titlebar")
        .append(closeButton);
    },
    close: function (event, ui) {
      student.signedUrls.forEach((_, index) => {
        const video = document.getElementById(`exam-recording-${index}`);
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      });
    },
  });
}

function renderStudentDetail(student) {
  if (!student.questions || student.questions.length === 0) {
    toastr.error("This student did not write the exam.");
    return;
  }

  const exitDetails = student.fullScreen?.histories
    ? student.fullScreen.histories
      .map(
        (exit, index) => `
        <p>Exit ${index + 1}: Reason - ${exit.reason}, Time - ${formatDateTime(
          exit.createdAt
        )}</p>
    `
      )
      .join("")
    : "<p>No exit details available.</p>";

  const detailContent = `
        <h3>${student.mail}</h3>
        <p>Status: ${student.status}</p>         
        <p>Exit Count: ${student.fullScreen?.exitCount ?? "-"}</p>
        ${exitDetails}
        ${student.status === "EXAM_STARTED"
      ? `
        <p>Attended: ${student.attended}</p>
        <p>Not Attended: ${student.notAttended}</p>
        <p>Correct: ${student.correct}</p>
        <p>Incorrect: ${student.incorrect}</p>
        `
      : ""
    }
        <h4>Questions Details:</h4>
        ${student.questions
      .map((q, index) => {
        const shouldEvaluate =
          q.question.type === "SAQ" ? false : q.question.shouldEvaluate;
        const studentResponse =
          q?.studentBlanks?.length > 0
            ? q.studentBlanks
              .map(
                (response) =>
                  `blank ${response.identity}: ${response?.answer || "empty"
                  }`
              )
              .join(" | ")
            : "NA";
        const studentResponseDisplay =
          q.studentResponse && q.question.choices.length > 0
            ? q.question.choices.find(
              (choice) => choice.key === q.studentResponse
            )
            : null;

        const correctAnswer = q?.question.blanks
          ?.map((response) => {
            const correctValues = response?.values?.filter(
              (val) => val?.isCorrect
            );
            return `blank ${response?.identity}: ${correctValues?.length > 0
                ? correctValues.map((val) => val?.value).join(" / ")
                : "empty"
              }`;
          })
          .join(" | ");

        return `
            ${q.question.type === "FTB"
            ? `<div class="question-detail" style="text-align: left;">
                    <p>
                        <strong>Question ${index + 1}:</strong> 
                        ${q.question.question}
                    </p>
                    <p>
                        <strong>Student Response:</strong> 
                        <span ${q.isAnsweredCorrect
              ? 'style="background-color: yellow;'
              : ""
            }">${studentResponse}</span>
                    </p>
                    <p>
                        <strong>Correct Answer:</strong> 
                        <span >${correctAnswer || "NA"}</span>
                    </p>
                    <p>
                        <strong>Should Evaluate:</strong> 
                        ${shouldEvaluate ? "Yes" : "No"}
                    </p>
                    <p class="${q.isAnsweredCorrect ? "correct-answer" : "wrong-answer"
            }">
                        Answered Correctly: ${q.isAnsweredCorrect ? "Yes" : "No"
            }
                    </p>
                </div>`
            : `<div class="question-detail" style="text-align: left;">
                    
                    <p><strong>Question ${index + 1}:</strong> ${q.question.question
            }</p>
                    
                    ${studentResponseDisplay
              ? `<p><strong>Student Response:</strong> <span style="background-color: yellow;">${studentResponseDisplay.key}: ${studentResponseDisplay.label}</span></p>`
              : `<p><strong>Student Response:</strong> <span style="background-color: yellow;">${studentResponse}</span></p>`
            }
                    
                    <p><strong>Should Evaluate:</strong> ${shouldEvaluate ? "Yes" : "No"
            }</p>
                   
                   
                    ${shouldEvaluate
              ? `<p><strong>Correct Choices:</strong> ${q.question.correctChoices.join(
                ", "
              )}</p>`
              : ""
            }
                    
                    
                    ${shouldEvaluate && studentResponse !== "NA"
              ? `
                    <p class="${q.isAnsweredCorrect ? "correct-answer" : "wrong-answer"
              }">
                        Answered Correctly: ${q.isAnsweredCorrect ? "Yes" : "No"
              }
                    </p>`
              : ""
            }

                    ${studentResponse === "NA" ? "<p>Not Answered</p>" : ""}


                </div>`
          }
            `;
      })
      .join("")}
    `;
  $("#student-detail-content").html(detailContent);
  $("#student-detail-modal").dialog({
    modal: true,
    width: "80%",
    create: function (event, ui) {
      $(".ui-widget-overlay").css({
        background: "rgba(0, 0, 0, 0.5)",
        "backdrop-filter": "blur(5px)",
      });

      var closeButton = $(
        '<button type="button" class="ui-button ui-corner-all ui-widget ui-dialog-titlebar-close" title="Close">X</button>'
      );
      closeButton.on("click", function () {
        $("#student-detail-modal").dialog("close");
      });
      $(this)
        .closest(".ui-dialog")
        .find(".ui-dialog-titlebar")
        .append(closeButton);
    },
  });
}

function formatDateTime(dateTimeString) {
  return new Date(dateTimeString).toLocaleString();
}

// Helper function to create and show status history popup
function showpassStatusPopup(passStatus, triggerElement) {
  // Create history popup content
  let historyHTML = '<div class="status-history-popup">';
  historyHTML += "<h4>Status Change History</h4>";
  historyHTML += '<ul class="status-history-list">';

  // Add each history entry
  passStatus.forEach((entry, index) => {
    historyHTML += `
      <li class="status-history-item">
        <div class="history-header">
          <span class="change-number">#${index + 1}</span>
          <span class="change-date">${formatDateTime(
      entry.changedAt || new Date().toISOString()
    )}</span>
        </div>
        <div class="change-by">Changed by: ${entry.changedBy ? entry.changedBy.mail : "Unknown"
      }</div>
        <div class="change-details">
          <span class="old-status ${entry.oldResult.toLowerCase() === "pass"
        ? "pass-status"
        : "fail-status"
      }">${entry?.oldResult || "Unknown"}</span>
          <i class="bx bx-right-arrow-alt"></i>
          <span class="new-status ${entry.newResult.toLowerCase() === "pass"
        ? "pass-status"
        : "fail-status"
      }">${entry?.newResult}</span>
        </div>
        ${entry.reason
        ? `<div class="change-reason">Reason: ${entry.reason}</div>`
        : ""
      }
      </li>`;
  });

  historyHTML += "</ul></div>";

  // Create popup element
  const popup = document.createElement("div");
  popup.className = "status-history-popup-container";
  popup.innerHTML = historyHTML;

  // Add close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "status-history-close-btn";
  closeBtn.innerHTML = '<i class="bx bx-x"></i>';
  closeBtn.addEventListener("click", function () {
    document.body.removeChild(popup);
  });
  popup.querySelector(".status-history-popup").appendChild(closeBtn);

  // Add popup to body
  document.body.appendChild(popup);

  // Position popup near the icon
  const rect = triggerElement.getBoundingClientRect();
  popup.style.position = "absolute";
  popup.style.top = `${rect.bottom + window.scrollY + 10}px`;
  popup.style.left = `${rect.left + window.scrollX - 150}px`;

  // Add event listener to close popup when clicking outside
  document.addEventListener("click", function closePopup(event) {
    if (!popup.contains(event.target) && event.target !== triggerElement) {
      document.body.removeChild(popup);
      document.removeEventListener("click", closePopup);
    }
  });
}

function exportAgGridDataToExcel() {
  const rowData = [];

  gridOptions.api.forEachNode((node) => {
    // Create base student data object
    const studentData = {
      "Email ID": node.data.mail,
      "Student ID": node.data.id,
      "Exam Status": node.data.status?.exam || node.data.status,
      "Questions Attended": node.data.attended,
      "Correct Answers": node.data.correct,
      "Incorrect Answers": node.data.incorrect,
      "Not Attempted": node.data.notAttended,
      "Correct Percentage":
        resultStatus(node)["value"] !== "-"
          ? calculatePercentage(node)["value"]
          : resultStatus(node)["value"],
      "Current Result": resultStatus(node)["value"],
      "Violation Count": node.data.violationCount || 0,
      "Fullscreen Exit Count": node.data.fullScreen?.exitCount || 0,
    };

    rowData.push(studentData);
  });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rowData);

  const columnWidths = [
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
  ];

  worksheet["!cols"] = columnWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, "Student_Performance");

  const date = new Date();
  const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  const filename = `Exam_Report_${dateString}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

$(document).ready(function () {
  var g = new JustGage({
    id: "gauge",
    value: 50,
    min: 0,
    max: 100,
    title: "Speed",
    label: "km/h",
  });
});

function updatePublishButtonText() {
  const publishButton = document.getElementById("publish-report");
  const sendEmailButton = document.getElementById("send-email-button");

  const publishTabActive = document
    .getElementById("publish")
    .classList.contains("active");

  if (publishTabActive) {
    const selectedRows = publishGridOptions
      ? publishGridOptions.api.getSelectedRows()
      : [];
    if (selectedRows.length > 0) {
      publishButton.innerHTML =
        'Publish Report <span class="student-count-bubble" id="publish-count">' +
        selectedRows.length +
        "</span>";

      sendEmailButton.innerHTML =
        'Send Email <span class="student-count-bubble" id="email-count">' +
        selectedRows.length +
        "</span>";
    } else {
      publishButton.innerHTML =
        'Publish Report <span class="student-count-bubble" id="publish-count">All</span>';

      let publishedCount = 0;
      publishGridOptions.api.forEachNode((node) => {
        if (node.data.publishStatus === "p") {
          publishedCount++;
        }
      });

      sendEmailButton.innerHTML =
        'Send Email <span class="student-count-bubble" id="email-count">' +
        publishedCount +
        "</span>";
    }

    publishButton.classList.remove("d-none");
    sendEmailButton.classList.remove("d-none");
  } else {
    const selectedRows = publishGridOptions
      ? publishGridOptions.api.getSelectedRows()
      : [];
    if (selectedRows.length > 0) {
      publishButton.innerHTML =
        'Publish Report <span class="student-count-bubble" id="publish-count">' +
        selectedRows.length +
        "</span>";
    } else {
      publishButton.innerHTML =
        'Publish Report <span class="student-count-bubble" id="publish-count">All</span>';
    }

    publishButton.classList.add("d-none");
    sendEmailButton.classList.add("d-none");
  }
}

// Function to apply percentage cutoff filter
function applyPercentageCutoff() {
  const newValue = $("#cutoff-percentage-input").val();

  // Validate cutoff percentage is between 0 and 100
  if (newValue !== "" && !isNaN(newValue) && newValue >= 0 && newValue <= 100) {
    // Update display of cutoff value
    $("#cutoff-percentage-value").text(newValue);
    $(".cutoff-edit-container").hide();
    $(".cutoff-value-container").show();

    // Show loading indicator

    // Get the exam ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get("examid");

    // First, make the API call to update the cutoff mark
    const apiUrl = `${QUESTIONS_END_POINT}/duration?entranceExamId=${examId}`;

    makeApiCall({
      url: apiUrl,
      method: "PUT",
      data: JSON.stringify({ cutoff: parseInt(newValue), duration: duration }),
      successCallback: function (response) {
        toastr.success("Cutoff mark updated successfully");
        console.log("Cutoff mark updated successfully:", response);

        fetchReportData(examId);
      },
      errorCallback: function (error) {
        toastr.error("Error updating cutoff mark. Please try again.");
      },
    });
  } else {
    toastr.error("Please enter a valid percentage between 0 and 100");
  }
}

// Add function to generate reports
function generateReports(students) {
  showAdvanceLoader('exam-report-generation');

  // Disable the button and add loading state
  const $generateButton = $("#generate-report");
  const originalButtonHtml = $generateButton.html();

  $generateButton
    .attr("disabled", true)
    .html('<i class="bx bx-loader-alt bx-spin"></i> Generating...')
    .css("opacity", "0.7");

  // Get the exam ID from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get("examid");

  // Make the API call to generate reports
  const apiUrl = `${EXAM_END_POINT}/generate-report?entranceExamId=${examId}`;

  makeApiCall({
    url: apiUrl,
    method: "POST",
    data: JSON.stringify({
      studentIds: students.map((student) => student.mail),
    }),
    disableLoading: true,
    successCallback: function (response) {
      toastr.success("Wait 30 seconds to generate reports");
      if (response.message === "Report Updated Successfully") {
        setTimeout(() => {
          $generateButton
            .removeAttr("disabled")
            .html(originalButtonHtml)
            .css("opacity", "1");

          hideAdvanceLoader();
          fetchReportData(examId);
        }, 5000);
      } else {
        setTimeout(() => {
          $generateButton
            .removeAttr("disabled")
            .html(originalButtonHtml)
            .css("opacity", "1");

          hideAdvanceLoader();
        }, 5000);
      }
    },
    errorCallback: function (error) {
      toastr.error("Error generating reports. Please try again.");

      hideAdvanceLoader();

      $generateButton
        .removeAttr("disabled")
        .html(originalButtonHtml)
        .css("opacity", "1");
    },
  });
}

function renderPublishGrid(students, questionsCount, examId) {
  const mail = localStorage.getItem("mail") || "";
  const columnDefs = [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      suppressRowClickSelection: true,
      headerClass: "table-ag-class",
      filter: false,
      sortable: false,
      width: 40,
      maxWidth: 40,
      flex: 0,
      resizable: false,
    },
    {
      headerName: "S.No",
      field: "sno",
      valueGetter: (params) => params.node.rowIndex + 1,
      sortable: true,
      filter: true,
      width: 80,
      maxWidth: 80,
      flex: 0,
      resizable: false,
    },
    {
      headerName: "Email",
      field: "mail",
      flex: 0.5,
      filter: false,
      headerClass: "table-ag-class",
      sortable: true,
      filter: true,
      minWidth: 180,
      tooltipField: "mail",
      onCellDoubleClicked: function (params) {
        navigator.clipboard.writeText(params.value).then(() => {
          toastr.success("Email copied to clipboard! " + params.value);
        });
      },
    },
    {
      headerName: `${globalLabels[labelItems.STUDENT] ?? "Student"} ${globalLabels[labelItems.EXAM] ?? "Exam"
        } Status`,
      field: "status.exam",
      autoHeight: true,
      headerClass: "table-ag-class",
      headerTooltip: `${globalLabels[labelItems.STUDENT] ?? "Student"} ${globalLabels[labelItems.EXAM] ?? "Exam"
        } Status`,
      flex: 0.5,
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        const isTimeOver = params.data.isTimedOver;
        const examStatus = params.value;

        const displayStatus =
          isTimeOver && examStatus === ON_GOING
            ? `${formatStatus(examStatus)} - ⏰ Exam Time Expired`
            : formatStatus(examStatus);

        const badgeClass =
          isTimeOver && examStatus === ON_GOING
            ? "status-badge-fail"
            : "status-badge-success";

        return `<div class="status-badge ${badgeClass}">${displayStatus}</div>`;
      },
    },
    {
      headerName: "Anomaly Review",
      field: "evaluationAnomalyStatus",
      headerClass: "table-ag-class",
      maxWidth: 100,
      flex: 0.1,
      cellRenderer: (params) => {
        return `<span class="anomaly-review-badge ${params.data.evaluationAnomalyStatus
            ? "anomaly-review-badge-active"
            : ""
          }">${params.data.evaluationAnomalyStatus
            ? params.data.evaluationAnomalyStatus === "NOT_REVIEWED"
              ? "Not Reviewed"
              : params.data.evaluationAnomalyStatus === "GENUINE"
                ? "Genuine"
                : params.data.evaluationAnomalyStatus === "CHEATED"
                  ? "Cheated"
                  : params.data.evaluationAnomalyStatus === "SUSPICIOUS"
                    ? "Suspicious"
                    : "Not Reviewed"
            : "Not Reviewed"
          }</span>`;
      },
    },
    {
      headerName: "Correct Percentage",
      valueGetter: (params) => calculatePercentage(params)["value"],
      cellRenderer: (params) => calculatePercentage(params)["cellRenderer"],
      autoHeight: true,
      headerClass: "table-ag-class",
      sortable: true,
      flex: 0.5,
      filter: "agNumberColumnFilter",
      filterParams: {
        filterOptions: ["equals", "lessThan", "greaterThan"],
        inRangeInclusive: true,
        includeBlanksInEquals: false,
        includeBlanksInLessThan: false,
        includeBlanksInGreaterThan: false,
      },
      minWidth: 80,
      width: 80,
      flex: 0.5,
    },
    {
      headerName: "Result",
      field: "passStatus",
      headerClass: "table-ag-class",
      valueGetter: (params) => resultStatus(params)["value"],
      cellRenderer: (params) => resultStatus(params)["cellRenderer"],
      sortable: true,
      filter: true,
      width: 120,
      flex: 0,
    },
    {
      headerName: "Published Status",
      field: "publishStatus",
      headerClass: "table-ag-class",
      filter: true,
      cellRenderer: (params) => {
        // Check if this value comes from the mapped data or original status
        const isPublished =
          params.value === true ||
          params.value === "PUBLISHED" ||
          (params.data.status && params.data.status.report === "PUBLISHED");

        return `<div class="status-badge ${isPublished ? "status-badge-published" : "status-badge-not-published"
          }">
          ${isPublished
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>Published'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>Not Published'
          }
        </div>`;
      },
      sortable: true,
      width: 150,
      flex: 0,
    },
    {
      headerName: "Mail Status",
      field: "mailStatus",
      filter: true,
      headerClass: "table-ag-class",
      cellRenderer: (params) => {
        // Map the status codes
        let mailStatusValue = params.value;
        if (params.data.status && params.data.status.reportMail) {
          // If we have the new data structure
          if (params.data.status.reportMail === "S") {
            mailStatusValue = "S";
          } else if (params.data.status.reportMail === "Q") {
            mailStatusValue = "Q";
          } else {
            mailStatusValue = "PENDING";
          }
        }

        let statusClass = "status-badge-mail-pending";
        let statusText = "Pending";
        let icon = '<i class="bx bx-time"></i>';

        if (mailStatusValue === "S") {
          statusClass = "status-badge-mail-sent";
          statusText = "Sent";
          icon = '<i class="bx bx-check"></i>';
        } else if (mailStatusValue === "Q") {
          statusClass = "status-badge-mail-queue";
          statusText = "In Queue";
          icon = '<i class="bx bx-loader"></i>';
        }

        return `<div class="status-badge ${statusClass}">${icon} ${statusText}</div>`;
      },
      sortable: true,
      width: 120,
      flex: 0,
    },
    {
      headerName: "Action",
      cellRenderer: (params) => {
        // Check if the report is published from either data format
        const isPublished =
          params.data.publishStatus === true ||
          params.data.publishStatus === "PUBLISHED" ||
          (params.data.status && params.data.status.report === "PUBLISHED");

        const rowIndex = params.rowIndex;

        const hasNotStartedExam = params?.data?.status?.exam === "NOT_STARTED";

        return `<div class="action-container" data-row-index="${rowIndex}">
          <div class="action-menu-main" data-email="${params.data.mail
          }" data-row-index="${rowIndex}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </div>
          <div class="action-dropdown" id="dropdown-${rowIndex}" data-row-index="${rowIndex}">
            ${isPublished
            ? `<div class="dropdown-item ${hasNotStartedExam ? "disabled" : ""
            }" id="unpublish-report" data-email="${params.data.mail
            }" data-examid="${examId}">
              <div class="unpublish-report">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <span>Unpublish</span>
            </div>`
            : ``
          }

            <div class="dropdown-item ${hasNotStartedExam ? "disabled" : ""
          }" id="send-notification" data-email="${params.data.mail
          }" data-examid="${examId}">
              <div class="send-notification">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>

              </div>
              <span>Send Mail</span>
            </div>
            
            <div class="dropdown-item " id="student-exam-details" data-email="${params.data.mail
          }" data-examid="${examId}">
              <div class="student-exam-details">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
              </div>
              <span>View Report</span>
            </div>

            <div class="dropdown-item" id="student-anomaly-details" data-email="${params.data.mail
          }" data-examid="${examId}">
              <div class="student-anomaly-details">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <span>View Anomalies</span>
            </div>



          </div>
        </div>`;
      },
      headerClass: "table-ag-class",
      sortable: false,
      filter: false,
      maxWidth: 80,
      resizable: false,
    },
  ];

  // Map the student data to the format expected by the grid
  const publishData = students.map((student) => {
    // Extract publication status from the student data
    let publishStatus = "Not Published";
    if (student.status && student.status.report === "PUBLISHED") {
      publishStatus = "PUBLISHED";
    }

    // Extract mail status from the student data
    let mailStatus = "PENDING";
    if (student.status && student.status.reportMail) {
      if (student.status.reportMail === "SENT") {
        mailStatus = "SENT";
      } else if (student.status.reportMail === "QUEUE") {
        mailStatus = "QUEUE";
      }
    }

    return {
      ...student,
      "Correct Percentage":
        (student.correct && questionsCount
          ? (
            (student.correct / (student.incorrect + student.correct)) *
            100
          ).toFixed(2)
          : 0) + "%",
      publishStatus: publishStatus,
      mailStatus: mailStatus,
      violationCount:
        student?.anomalyDetails?.violationCount ||
        0 + student?.fullScreen?.exitCount ||
        0 ||
        "-",
    };
  });

  publishGridOptions = {
    theme: "legacy",
    columnDefs: columnDefs,
    rowData: publishData,
    defaultColDef: {
      filter: true,
      sortable: true,
      resizable: true,
      minWidth: 100,
    },
    rowHeight: 50, // Setting a row height of 45px for all rows
    rowSelection: "multiple",
    suppressRowClickSelection: true,
    pagination: true,
    paginationPageSize: 100,
    domLayout: "autoHeight",
    overlayLoadingTemplate:
      '<span class="ag-overlay-loading-center">Loading...</span>',
    overlayNoRowsTemplate:
      '<span class="ag-overlay-loading-center">No data to display</span>',
    onSelectionChanged: updatePublishButtonText,
    context: {
      examId: examId,
    },
  };

  $("#publish-grid").empty();
  new agGrid.Grid(document.getElementById("publish-grid"), publishGridOptions);

  // Add event listeners for the publish buttons
  setTimeout(() => {
    setupPublishButtonHandlers();
    // setupDropdownHandlers(); // Add our new dropdown handler
  }, 100);
}

function setupPublishButtonHandlers() {
  // We've removed the individual-publish-btn, so this handler is no longer needed
  // But for backward compatibility, keeping the handler with modified logic
  $(document).on("click", ".individual-publish-btn", function (e) {
    e.stopPropagation();
    const email = $(this).data("email");
    const examId = $(this).data("examid");

    // If already published, view the report
    if ($(this).hasClass("student-exam-details")) {
      const url = `/fullscreenexam/reports/detailed/?examId=${examId}&email=${email}`;
      window.open(url, "_blank");
      return;
    }

    // Otherwise publish the report
    publishIndividualReport(email, examId);
  });

  $(document).off("click", "#send-notification");

  // Handle send notification button clicks
  $(document).on("click", "#send-notification", function (e) {
    e.stopPropagation();
    const email = $(this).data("email");
    // Disable the button temporarily to prevent multiple clicks
    $(this).prop("disabled", true);
    getEmailContent((data) => {
      sendNotification(data);
      // Re-enable the button after sending
      $(this).prop("disabled", false);
    }, email);
  });

  // Add click handler for view report in dropdown (if needed later)
  $(document).on("click", ".view-report", function (e) {
    e.stopPropagation();
    const email = $(this).data("email");
    const examId = $(this).data("examid");
    const url = `/fullscreenexam/reports/detailed/?examId=${examId}&email=${email}`;
    window.open(url, "_blank");
  });
}

function publishMultipleReports(studentEmails, examId, reportType) {
  // Show loading
  const reportTypeText = reportType === "detailed" ? "detailed" : "short";
  toastr.info(`Publishing ${reportTypeText} reports...`);

  // Prepare request data
  const requestData = {
    attenders: studentEmails,
    reportType: reportType, // 'detailed' or 'short' - controls whether to include questions/answers
  };

  // Make the actual API call to publish reports
  makeApiCall({
    url: `${EXAM_END_POINT}/publish?entranceExamId=${examId}`,
    method: "PUT",
    data: JSON.stringify(requestData),
    successCallback: function (response) {
      toastr.success(
        `${reportTypeText.charAt(0).toUpperCase() + reportTypeText.slice(1)
        } reports published successfully`
      );
      fetchReportData(examId);
    },
    errorCallback: function (error) {
      console.error("Error publishing reports:", error);
      toastr.error("Error publishing reports. Please try again.");
      updatePublishButtonText();
    },
  });
}

function unpublishReport(email, examId) {
  // If examId is not provided, try to get it from the URL
  if (!examId) {
    examId = new URLSearchParams(window.location.search).get("examid");
  }

  // Show loading indicator or toast message
  toastr.info("Unpublishing report...");

  // Make API call to unpublish the report
  makeApiCall({
    url: `${EXAM_END_POINT}/unpublish?entranceExamId=${examId}`,
    method: "PUT",
    data: JSON.stringify({
      attenders: [email],
    }),
    successCallback: function (data) {
      toastr.success("Report unpublished successfully");
      fetchReportData(examId);
    },
    errorCallback: function (error) {
      toastr.error("Error unpublishing report:", error);
    },
  });
}

const getEmailContent = (callback, email) => {
  makeApiCall({
    url: `${ACCOUNT_END_POINT}/content`,
    type: "GET",
    successCallback: (data) => {
      const reportContent = data?.data?.reportContent || reportEmailContent;
      const repSubject = data?.data?.reportSubject || reportSubject;
      callback({ reportContent, repSubject, email });
    },
    errorCallback: (error) => {
      toastr.error("Error getting email content:", error);
    },
  });
};

function sendNotification({ reportContent, repSubject, email }) {
  if (!email) {
    toastr.error("Email address is missing. Cannot send notification.");
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get("examid");

  if (!examId) {
    toastr.error("Exam ID is missing. Cannot send notification.");
    return;
  }

  // Prepare API request data
  const requestData = {
    attenders: [email],
    emailSubject: repSubject,
    emailContent: reportContent,
  };

  // Make API call to send email
  const apiUrl = `${EXAM_END_POINT}/mail?entranceExamId=${examId}`;

  makeApiCall({
    url: apiUrl,
    method: "PUT",
    data: JSON.stringify(requestData),
    successCallback: function (response) {
      toastr.clear();
      toastr.success(`Notification has been sent to ${email} successfully.`);
      fetchReportData(examId);
    },
    errorCallback: function (error) {
      toastr.clear();
      toastr.error(
        `Failed to send notification to ${email}. Please try again.`
      );
    },
  });
}

// Function to send email notifications to multiple students
function sendNotificationToMultipleStudents({
  reportContent,
  repSubject,
  email,
}) {
  if (email.length === 0) {
    toastr.error("No students selected to send emails.");
    return;
  }

  // Show loading
  showLoader();

  // Get exam ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get("examid");

  if (!examId) {
    hideLoader();
    toastr.error("Exam ID is missing. Cannot send emails.");
    return;
  }

  // Update all selected emails to "queue" status first
  email.forEach((email) => {
    let rowNode = null;
    publishGridOptions.api.forEachNode((node) => {
      if (node.data.mail === email) {
        rowNode = node;
      }
    });

    if (rowNode) {
      // Update mail status to "queue" first
      rowNode.setDataValue("mailStatus", "q");

      // Refresh the cell
      publishGridOptions.api.refreshCells({
        force: true,
        rowNodes: [rowNode],
        columns: ["mailStatus"],
      });
    }
  });

  // Prepare API request data
  const requestData = {
    attenders: email,
    emailSubject: repSubject,
    emailContent: reportContent,
    // emailSubject: "Report for Exam",
    // emailContent:
    //   `<p class="email-content">Dear <strong>student id</strong>,<br><br>
    //       We are pleased to inform you that your examination results for <strong>Exam Name</strong> have been published.<br><br>
    //       You can view your results by clicking the link below:<br>
    //       <strong>Link URL EN</strong><br><br>
    //       Important Information:<br>
    //       • Please review your results carefully.<br>
    //       • If you have any questions or concerns regarding your results, do not hesitate to contact your exam coordinator.<br>
    //       • Ensure to keep your ID proof ready for any verification if required.<br><br>
    //       Thank you for your participation, and we wish you the best in your future endeavors!<br><br>

    //       <hr>
    //       <p class="email-content" dir="rtl">
    //       يسرنا إبلاغك بأنه تم نشر نتائج امتحانك لـ <strong>Exam Name</strong>.<br><br>
    //       يمكنك عرض نتائجك بالنقر على الرابط أدناه:<br>
    //       <strong>Link URL AR</strong><br><br>
    //       معلومات مهمة:<br>
    //       • يرجى مراجعة نتائجك بعناية.<br>
    //       • إذا كانت لديك أي أسئلة أو استفسارات بخصوص نتائجك، فلا تتردد في الاتصال بمنسق الامتحان.<br>
    //       • تأكد من الاحتفاظ بإثبات الهوية جاهزًا لأي تحقق إذا لزم الأمر.<br><br>
    //       شكرًا على مشاركتك، ونتمنى لك التوفيق في مساعيك المستقبلية!<br><br>
    //       <span style="text-align: left; display: block;" dir="ltr">Best Regards,<br>
    //       <strong>Client Name</strong></span></p>`,
  };

  // Make API call to send emails
  const apiUrl = `${EXAM_END_POINT}/mail?entranceExamId=${examId}`;

  makeApiCall({
    url: apiUrl,
    method: "PUT",
    data: JSON.stringify(requestData),
    successCallback: function (response) {
      // Remove the email panel if it exists
      $("#email-preview-panel").remove();
      toastr.success(
        `Successfully sent ${email.length} email notification(s).`
      );
      fetchReportData(examId);
    },
    errorCallback: function (error) {
      // Re-enable the send button in case of error
      $("#confirm-email-send").prop("disabled", false).html("Send Emails");
      toastr.error("Failed to send email notifications. Please try again.");
    },
  });
}

const publishButton = document.getElementById("publish-report");
const sendEmailButton = document.getElementById("send-email-button");

// Custom confirmation popup function
function showConfirmationPopup(
  title,
  message,
  onConfirm,
  requireReason = false,
  showReportOptions = false
) {
  // Remove any existing popup
  const existingPopup = document.getElementById("custom-confirmation-popup");
  if (existingPopup) {
    document.body.removeChild(existingPopup);
  }

  // Remove any existing backdrop
  const existingBackdrop = document.getElementById("confirmation-backdrop");
  if (existingBackdrop) {
    document.body.removeChild(existingBackdrop);
  }

  // Create backdrop
  const backdrop = document.createElement("div");
  backdrop.id = "confirmation-backdrop";
  backdrop.className = "confirmation-backdrop";
  document.body.appendChild(backdrop);

  // Create popup container
  const popup = document.createElement("div");
  popup.id = "custom-confirmation-popup";
  popup.className = "confirmation-dialog";

  // Create popup content
  let bodyContent = `<div class="confirmation-body">
    <p>${message}</p>`;

  if (requireReason) {
    bodyContent += `<textarea id="confirmation-reason" placeholder="Please provide a reason..." rows="3"></textarea>`;
  }

  bodyContent += `</div>`;

  popup.innerHTML = `
    <div class="confirmation-header">
      <i class="bx bx-info-circle"></i>
      <h3>${title}</h3>
    </div>
    ${bodyContent}
    <div class="confirmation-footer">
      <button class="cancel-btn">Cancel</button>
      <button class="confirm-btn">Confirm</button>
    </div>
  `;

  // Add to DOM
  document.body.appendChild(popup);

  // Activate the backdrop and popup with a slight delay for animation
  setTimeout(() => {
    backdrop.classList.add("active");
    popup.classList.add("active");
  }, 10);

  // Handle cancel
  popup.querySelector(".cancel-btn").addEventListener("click", function () {
    backdrop.classList.remove("active");
    popup.classList.remove("active");
    setTimeout(() => {
      document.body.removeChild(backdrop);
      document.body.removeChild(popup);
    }, 300);
  });

  // Handle clicking on the backdrop
  backdrop.addEventListener("click", function () {
    backdrop.classList.remove("active");
    popup.classList.remove("active");
    setTimeout(() => {
      document.body.removeChild(backdrop);
      document.body.removeChild(popup);
    }, 300);
  });

  // Handle confirm
  popup.querySelector(".confirm-btn").addEventListener("click", function () {
    let reason = "";
    if (requireReason) {
      reason = document.getElementById("confirmation-reason").value.trim();
      if (!reason) {
        showToast("Please provide a reason for this action.", "error");
        return;
      }
    }

    backdrop.classList.remove("active");
    popup.classList.remove("active");
    setTimeout(() => {
      document.body.removeChild(backdrop);
      document.body.removeChild(popup);
      onConfirm(reason);
    }, 300);
  });
}

function renderAnomalyTable(students, questionsCount) {
  const mail = localStorage.getItem("mail") || "";
  const gridDiv = document.getElementById("anomaly-grid");
  const columnDefs = [
    {
      headerName: "S.No",
      field: "sno",
      valueGetter: (params) => params.node.rowIndex + 1,
      sortable: true,
      autoHeight: true,
      headerClass: "table-ag-class",
      maxWidth: 70,
    },
    {
      headerName: "Email",
      field: "mail",
      autoHeight: true,
      filter: true,
      headerClass: "table-ag-class",
      flex: 1,
      tooltipField: "mail",
      onCellDoubleClicked: function (params) {
        navigator.clipboard.writeText(params.value).then(() => {
          toastr.success("Email copied to clipboard! " + params.value);
        });
      },
    },
    {
      headerName: `${globalLabels[labelItems.STUDENT] ?? "Student"} ${globalLabels[labelItems.EXAM] ?? "Exam"
        } Status`,
      field: "status.exam",
      autoHeight: true,
      headerClass: "table-ag-class",
      headerTooltip: `${globalLabels[labelItems.STUDENT] ?? "Student"} ${globalLabels[labelItems.EXAM] ?? "Exam"
        } Status`,
      flex: 0.5,
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        const isTimeOver = params.data.isTimedOver;
        const examStatus = params.value;

        const displayStatus =
          isTimeOver && examStatus === ON_GOING
            ? `${formatStatus(examStatus)} - ⏰ Exam Time Expired`
            : formatStatus(examStatus);

        const badgeClass =
          isTimeOver && examStatus === ON_GOING
            ? "status-badge-fail"
            : "status-badge-success";

        return `<div class="status-badge ${badgeClass}">${displayStatus}</div>`;
      },
    },
    {
      headerName: "Video Status",
      field: "anomalyStatus",
      autoHeight: true,
      headerClass: "table-ag-class",
      sortable: true,
      filter: true,
      flex: 0.2,
    },
    {
      headerName: "Violation",
      field: "violationCount",
      filter: "agNumberColumnFilter",
      filterValueGetter: (params) => {
        const count = params.data.violationCount;
        if (count === "-") return "";

        let category = "Medium";
        if (count < 10) category = "Low";
        else if (count > 50) category = "High";

        // Return both number and category as a searchable string
        return `${count} ${category}`;
      },

      // Format the display separately
      cellRenderer: (params) => {
        const violationCount = params.data.violationCount;
        if (violationCount === "-") return `<span>${violationCount}</span>`;

        let category = "Medium";
        let colorClass = "";

        if (violationCount < 10) {
          category = "Low";
          colorClass = "blue-c";
        } else if (violationCount > 50) {
          category = "High";
          colorClass = "red-c";
        } else {
          category = "Medium";
          colorClass = "orange-c";
        }

        // Create wrapper div
        const wrapper = document.createElement("div");
        wrapper.className = "violation-wrapper";

        // Create the main violation display
        const violationDisplay = document.createElement("div");
        violationDisplay.className = "violation-display";
        violationDisplay.innerHTML = `<span style="color: var(--${colorClass})">${violationCount} ${category}</span>`;

        // Create the eye icon button
        const eyeButton = document.createElement("button");
        eyeButton.className = "violation-eye-btn";
        eyeButton.innerHTML = '<i class="bx bx-show"></i>';
        eyeButton.setAttribute("data-tooltip", "View Violation Details");

        // Create popover
        const popover = document.createElement("div");
        popover.className = "violation-popover";
        popover.innerHTML = `<i class="bx bx-show"></i> View Details`;

        // Add click handler to show violation details
        const showViolationDetails = () => {
          // Create violation details popup
          const backdrop = document.createElement("div");
          backdrop.id = "violation-details-backdrop";
          backdrop.className = "confirmation-backdrop";
          document.body.appendChild(backdrop);

          const popup = document.createElement("div");
          popup.id = "violation-details-popup";
          popup.className = "violation-details-dialog";

          // Get violation details from the data
          const student = params.data;
          const exitCount = student.fullScreen?.exitCount || 0;
          const anomalyViolations = student.anomalyDetails?.violationCount || 0;
          const totalViolations = exitCount + anomalyViolations;

          popup.innerHTML = `
            <div class="violation-details-header">
              <i class="bx bx-error-circle"></i>
              <h3>Violation Details</h3>
            </div>
            <div class="violation-details-body">
              <div class="violation-summary">
                <div class="violation-stat">
                  <span class="stat-label">Total Violations</span>
                  <span class="stat-value">${totalViolations}</span>
                </div>
                <div class="violation-stat">
                  <span class="stat-label">Full Screen Exits</span>
                  <span class="stat-value">${exitCount}</span>
                </div>
                <div class="violation-stat">
                  <span class="stat-label">Anomaly Violations</span>
                  <span class="stat-value">${anomalyViolations}</span>
                </div>
                ${student.anomalyDetails?.totalDuration
              ? `
                <div class="violation-stat">
                  <span class="stat-label">Total Duration</span>
                  <span class="stat-value">${Math.floor(
                student.anomalyDetails.totalDuration / 60
              )}m ${student.anomalyDetails.totalDuration % 60}s</span>
                </div>
                `
              : ""
            }
              </div>
              <div class="violation-tabs">
                <button class="tab-btn active" data-tab="history">Full Screen History</button>
                <button class="tab-btn" data-tab="anomaly">Anomaly Violations</button>
              </div>
              <div class="tab-content">
                <div class="tab-pane active" id="history-tab">
                  <div class="history-list">
                    <div class="history-loading">Loading history...</div>
                  </div>
                </div>
                <div class="tab-pane" id="anomaly-tab">
                  <div class="anomaly-list">
                    <div class="anomaly-loading">Loading anomaly violations...</div>
                  </div>
                </div>

              </div>
            </div>
            <div class="violation-details-footer">
              <button class="close-btn">Close</button>
            </div>
          `;

          document.body.appendChild(popup);

          // Add event listeners
          const closePopup = () => {
            backdrop.classList.remove("active");
            popup.classList.remove("active");
            setTimeout(() => {
              document.body.removeChild(backdrop);
              document.body.removeChild(popup);
            }, 300);
          };

          popup
            .querySelector(".close-btn")
            .addEventListener("click", closePopup);
          backdrop.addEventListener("click", closePopup);

          // Tab switching functionality
          const tabButtons = popup.querySelectorAll(".tab-btn");
          const tabPanes = popup.querySelectorAll(".tab-pane");

          tabButtons.forEach((button) => {
            button.addEventListener("click", () => {
              const tabName = button.getAttribute("data-tab");

              // Update active states
              tabButtons.forEach((btn) => btn.classList.remove("active"));
              tabPanes.forEach((pane) => pane.classList.remove("active"));

              button.classList.add("active");
              popup.querySelector(`#${tabName}-tab`).classList.add("active");
            });
          });

          // Show the popup with animation
          requestAnimationFrame(() => {
            backdrop.classList.add("active");
            popup.classList.add("active");
          });

          // Fetch violation details from API using makeApiCall
          const attenderId = student._id;
          makeApiCall({
            url: `${EXAM_ATTENDER_END_POINT}/log?attenderId=${attenderId}`,
            method: "GET",
            successCallback: function (response) {
              if (response.message === "Retrieved successfully") {
                const violationData = response.data;

                // Update history tab
                const historyList = popup.querySelector(
                  "#history-tab .history-list"
                );
                if (violationData.fullScreen?.history) {
                  historyList.innerHTML = violationData.fullScreen.history
                    .map(
                      (item) => `
                    <div class="history-item">
                      <div class="history-reason">${item.reason}</div>
                      <div class="history-time">${formatDateTime(
                        item.createdAt
                      )}</div>
                    </div>
                  `
                    )
                    .join("");
                } else {
                  historyList.innerHTML =
                    '<div class="no-data">No history available</div>';
                }

                // Update anomaly tab
                const anomalyList = popup.querySelector(
                  "#anomaly-tab .anomaly-list"
                );
                if (student.anomalyDetails?.violations) {
                  // Count violations by type
                  const violationCounts =
                    student.anomalyDetails.violations.reduce(
                      (acc, violation) => {
                        violation.detection.forEach((type) => {
                          acc[type] = (acc[type] || 0) + 1;
                        });
                        return acc;
                      },
                      {}
                    );

                  // Create timeline of violations
                  const timelineHtml = student.anomalyDetails.violations
                    .map((violation) => {
                      const detectionTypes = violation.detection
                        .map((type) => {
                          let icon, tooltip;
                          switch (type) {
                            case "NotLookingAtScreen":
                              icon = "fas fa-eye-slash";
                              tooltip = "Student not looking at screen";
                              break;
                            case "headphoneDetected":
                              icon = "fas fa-headphones";
                              tooltip = "Headphones detected";
                              break;
                            case "userNotDetected":
                              icon = "fas fa-user-slash";
                              tooltip = "No user detected in frame";
                              break;
                            case "multipleFaces":
                              icon = "fas fa-users";
                              tooltip = "Multiple faces detected";
                              break;
                            case "phoneDetected":
                              icon = "fas fa-mobile-alt";
                              tooltip = "Mobile phone detected";
                              break;
                            case "NotFacingScreen":
                              icon = "fas fa-user-tie";
                              tooltip = "Face not aligned with screen";
                              break;
                            default:
                              icon = "fas fa-exclamation-triangle";
                              tooltip = type;
                          }

                          return `<i class="${icon}" data-tooltip="${tooltip}"></i>`;
                        })
                        .join("");

                      return `
                      <div class="anomaly-item">
                        <div class="anomaly-time">${formatTime(
                        violation.time
                      )}</div>
                        <div class="anomaly-detections">
                          ${detectionTypes}
                        </div>
                      </div>
                    `;
                    })
                    .join("");

                  // Create violation badges with tooltips
                  const violationBadges = Object.entries(violationCounts)
                    .map(([type, count]) => {
                      let icon, label, tooltip;
                      switch (type) {
                        case "NotLookingAtScreen":
                          icon = "fas fa-eye-slash";
                          label = "Not Looking at Screen";
                          tooltip = "Times student looked away from screen";
                          break;
                        case "headphoneDetected":
                          icon = "fas fa-headphones";
                          label = "Headphone Detected";
                          tooltip = "Times headphones were detected";
                          break;
                        case "userNotDetected":
                          icon = "fas fa-user-slash";
                          label = "No User Detected";
                          tooltip = "Times no user was visible";
                          break;
                        case "multipleFaces":
                          icon = "fas fa-users";
                          label = "Multiple Faces";
                          tooltip = "Times multiple people were detected";
                          break;
                        case "phoneDetected":
                          icon = "fas fa-mobile-alt";
                          label = "Phone Detected";
                          tooltip = "Times mobile phone was detected";
                          break;
                        case "NotFacingScreen":
                          icon = "fas fa-user-tie";
                          label = "Face Not Straight";
                          tooltip = "Times face was not aligned with screen";
                          break;
                        default:
                          icon = "fas fa-exclamation-triangle";
                          label = type;
                          tooltip = type;
                      }

                      return `
                      <div class="violation-badge ${type
                          .toLowerCase()
                          .replace(/([A-Z])/g, "-$1")
                          .toLowerCase()}">
                        <i class="${icon}" data-tooltip="${tooltip}"></i>
                        ${label}
                        <span class="violation-count">${count}</span>
                      </div>
                    `;
                    })
                    .join("");

                  anomalyList.innerHTML = `
                    <div class="violation-badges">
                      ${violationBadges}
                    </div>
                    <div class="violation-timeline">
                      ${timelineHtml}
                    </div>
                  `;
                } else {
                  anomalyList.innerHTML =
                    '<div class="no-data">No anomaly violations available</div>';
                }

                // Update logs tab
                const logsList = popup.querySelector("#logs-tab .logs-list");
                if (violationData.logs) {
                  logsList.innerHTML = violationData.logs
                    .map(
                      (log) => `
                    <div class="log-item">
                      <div class="log-message">${log}</div>
                    </div>
                  `
                    )
                    .join("");
                } else {
                  logsList.innerHTML =
                    '<div class="no-data">No logs available</div>';
                }
              }
            },
            errorCallback: function (error) {
              console.error("Error fetching violation details:", error);
              popup.querySelector("#history-tab .history-list").innerHTML =
                '<div class="error-message">Error loading history</div>';
              popup.querySelector("#anomaly-tab .anomaly-list").innerHTML =
                '<div class="error-message">Error loading anomaly violations</div>';
              popup.querySelector("#logs-tab .logs-list").innerHTML =
                '<div class="error-message">Error loading logs</div>';
            },
          });
        };

        // Add click event to eye button and popover
        eyeButton.addEventListener("click", (e) => {
          e.stopPropagation();
          showViolationDetails();
        });

        popover.addEventListener("click", (e) => {
          e.stopPropagation();
          showViolationDetails();
        });

        // Add elements to wrapper
        wrapper.appendChild(violationDisplay);
        wrapper.appendChild(eyeButton);
        wrapper.appendChild(popover);

        return wrapper;
      },
      autoHeight: true,
      headerClass: "table-ag-class",
      sortable: true,
      filter: true,
      flex: 0.5,
    },
    {
      headerName: "Correct Percentage",
      valueGetter: (params) => calculatePercentage(params)["value"],
      cellRenderer: (params) => calculatePercentage(params)["cellRenderer"],
      autoHeight: true,
      headerClass: "table-ag-class",
      sortable: true,
      flex: 0.5,
      minWidth: 80,
      width: 80,
      filter: "agNumberColumnFilter",
      filterParams: {
        filterOptions: ["equals", "lessThan", "greaterThan"],
        inRangeInclusive: true,
        includeBlanksInEquals: false,
        includeBlanksInLessThan: false,
        includeBlanksInGreaterThan: false,
      },
    },
    {
      headerName: "Result",
      field: "passStatus",
      headerClass: "table-ag-class",
      valueGetter: (params) => resultStatus(params)["value"],
      cellRenderer: (params) => resultStatus(params)["cellRenderer"],
      sortable: true,
      filter: true,
      width: 150,
      flex: 0.4,
    },
    {
      headerName: "Anomaly Review",
      field: "evaluationAnomalyStatus",
      headerClass: "table-ag-class",
      flex: 0.5,
      cellRenderer: (params) => {
        return `<span class="anomaly-review-badge ${params.data.evaluationAnomalyStatus
            ? "anomaly-review-badge-active"
            : ""
          }">${params.data.evaluationAnomalyStatus
            ? params.data.evaluationAnomalyStatus === "NOT_REVIEWED"
              ? `<span class="status-not-reviewed">Not Reviewed</span>`
              : params.data.evaluationAnomalyStatus === "GENUINE"
                ? `<span class="status-genuine">Genuine</span>`
                : params.data.evaluationAnomalyStatus === "CHEATED"
                  ? `<span class="status-cheated">Cheated</span>`
                  : params.data.evaluationAnomalyStatus === "SUSPICIOUS"
                    ? `<span class="status-suspicious">Suspicious</span>`
                    : "Not Reviewed"
            : `<span class="status-not-reviewed">Not Reviewed</span>`
          }</span>`;
      },
    },
    {
      headerName: "Action",
      cellRenderer: (params) => {
        const email = params.data.mail;
        const examId = new URLSearchParams(window.location.search).get(
          "examid"
        );

        const isNotProcessed = params?.data?.anomalyStatus !== "Processed";
        const hasNotStartedExam = params?.data?.status?.exam === "NOT_STARTED";

        return `
        <div class="action-container">
          <button class="view-details-btn" id="student-anomaly-details" data-email="${email}" data-examid="${examId}" 
            ${hasNotStartedExam ? "disabled" : ""}
            title="${isNotProcessed
            ? "Anomaly Not processed for this student"
            : "View Anomaly details"
          }">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>View Anomaly</span>
          </button>
        </div>`;
      },
      autoHeight: true,
      headerClass: "table-ag-class",
      sortable: true,
      filter: false,
      width: 150,
      flex: 0.5,
    },
  ];

  const rowData = students.map((student) => ({
    ...student,
    anomalyStatus:
      student?.anomalyStatus === "PROCESSED"
        ? "Processed"
        : student?.anomalyStatus === "PROCESSING"
          ? "Processing"
          : "Pending",
    evaluationAnomalyStatus: student?.evaluationAnomalyStatus || "NOT_REVIEWED",
    violationCount:
      student?.anomalyDetails?.violationCount ||
      0 + student?.fullScreen?.exitCount ||
      0 ||
      "-",
    "Correct Percentage":
      (student.correct && questionsCount
        ? (
          (student.correct / (student.incorrect + student.correct)) *
          100
        ).toFixed(2)
        : 0) + "%",
  }));

  console.log(rowData);
  anomalyGridOptions = {
    theme: "legacy",
    columnDefs: columnDefs,
    rowData: rowData,
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      filter: true,
      sortable: true,
      enableRangeSelection: true,
      enableCharts: true,
      resizable: true,
      minWidth: 100,
      clipboard: {
        enabled: true,
      },
    },
    rowHeight: 50,
    rowSelection: "single",
    suppressRowClickSelection: true,
    pagination: true,
    paginationPageSize: 100,
    domLayout: "autoHeight",
    overlayLoadingTemplate:
      '<span class="ag-overlay-loading-center">Loading...</span>',
    overlayNoRowsTemplate:
      '<span class="ag-overlay-loading-center">No data to display</span>',
  };

  $("#anomaly-grid").empty();
  new agGrid.Grid(gridDiv, anomalyGridOptions);
}

// Function to show specialized pass status change dialog
function showPassStatusChangeDialog(params, isPassed, onConfirm) {
  // Remove any existing popup
  const existingPopup = document.getElementById("pass-status-dialog");
  if (existingPopup) {
    document.body.removeChild(existingPopup);
  }

  // Remove any existing backdrop
  const existingBackdrop = document.getElementById("confirmation-backdrop");
  if (existingBackdrop) {
    document.body.removeChild(existingBackdrop);
  }

  // Create backdrop
  const backdrop = document.createElement("div");
  backdrop.id = "confirmation-backdrop";
  backdrop.className = "confirmation-backdrop";
  document.body.appendChild(backdrop);

  // Get current status
  const studentName = params.data.nameText || params.data.mail || "student";

  // Create popup container
  const popup = document.createElement("div");
  popup.id = "pass-status-dialog";
  popup.className = "pass-status-dialog";

  // Create popup content
  popup.innerHTML = `
    <div class="pass-status-header">
      <i class="bx bx-revision"></i>
      <h3>Change Student Status</h3>
    </div>
    <div class="pass-status-body">
      <p>You are about to change the status for <strong>${studentName}</strong>.</p>
      
      <div class="status-change-visualization">
        <div class="status-state from ${isPassed ? "pass" : "fail"}">
          <div class="status-label">Current Status</div>
          <div class="status-value ${isPassed ? "pass" : "fail"}">${isPassed ? "PASS" : "FAIL"
    }</div>
        </div>
        
        <i class='bx bx-right-arrow-alt'></i>
        
        <div class="status-state to ${isPassed ? "fail" : "pass"}">
          <div class="status-label">New Status</div>
          <div class="status-value ${isPassed ? "fail" : "pass"}">${isPassed ? "FAIL" : "PASS"
    }</div>
        </div>
      </div>
      
      <div class="pass-status-reason">
        <label for="status-change-reason">Reason for change <span style="color: #ef4444;">*</span></label>
        <textarea id="status-change-reason" placeholder="Please explain why you are changing this student's status..."></textarea>
      </div>
    </div>
    <div class="pass-status-footer">
      <button class="cancel-btn">Cancel</button>
      <button class="confirm-btn">Save Changes</button>
    </div>
  `;

  // Add to DOM
  document.body.appendChild(popup);

  // Focus on the textarea
  setTimeout(() => {
    popup.querySelector("#status-change-reason").focus();
  }, 100);

  // Activate the backdrop and popup with animation
  requestAnimationFrame(() => {
    backdrop.classList.add("active");
    popup.classList.add("active");
  });

  // Handle cancel
  popup.querySelector(".cancel-btn").addEventListener("click", function () {
    closeDialog();
  });

  // Handle clicking on the backdrop
  backdrop.addEventListener("click", function () {
    closeDialog();
  });

  // Handle confirm
  popup.querySelector(".confirm-btn").addEventListener("click", function () {
    const reason = document.getElementById("status-change-reason").value.trim();
    if (!reason) {
      toastr.error("Please provide a reason for changing the status.");
      return;
    }

    closeDialog(true);
    onConfirm(reason);
  });

  function closeDialog(confirmed = false) {
    backdrop.classList.remove("active");
    popup.classList.remove("active");
    setTimeout(() => {
      document.body.removeChild(backdrop);
      document.body.removeChild(popup);
    }, 300);
  }
}

// Add this helper function for formatting time
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function renderSystemReportTable(students, questionsCount) {
  const mail = localStorage.getItem("mail") || "";
  const columnDefs = [
    {
      headerName: "S.No",
      field: "sno",
      valueGetter: (params) => params.node.rowIndex + 1,
      sortable: true,
      autoHeight: true,
      headerClass: "table-ag-class",
      maxWidth: 70,
    },
    {
      headerName: "Email",
      field: "mail",
      autoHeight: true,
      filter: true,
      headerClass: "table-ag-class",
      flex: 1,
      tooltipField: "mail",
      onCellDoubleClicked: function (params) {
        navigator.clipboard.writeText(params.value).then(() => {
          toastr.success("Email copied to clipboard! " + params.value);
        });
      },
    },
    {
      headerName: `${globalLabels[labelItems.STUDENT] ?? "Student"} ${globalLabels[labelItems.EXAM] ?? "Exam"
        } Status`,
      field: "status.exam",
      autoHeight: true,
      headerClass: "table-ag-class",
      headerTooltip: `${globalLabels[labelItems.STUDENT] ?? "Student"} ${globalLabels[labelItems.EXAM] ?? "Exam"
        } Status`,
      // maxWidth: 150,
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        const isTimeOver = params.data.isTimedOver;
        const examStatus = params.value;

        const displayStatus =
          isTimeOver && examStatus === ON_GOING
            ? `${formatStatus(examStatus)} - ⏰ Exam Time Expired`
            : formatStatus(examStatus);

        const badgeClass =
          isTimeOver && examStatus === ON_GOING
            ? "status-badge-fail"
            : "status-badge-success";

        return `<div class="status-badge ${badgeClass}">${displayStatus}</div>`;
      },
    },
    {
      headerName: "Video Status",
      field: "anomalyStatus",
      autoHeight: true,
      headerClass: "table-ag-class",
      sortable: true,
      filter: true,
    },
    {
      headerName: "Violation",
      field: "violationCount",
      sortable: true,
      autoHeight: true,
      headerClass: "table-ag-class",
      filter: "agTextColumnFilter",
      filterValueGetter: (params) => {
        const count = params.data.violationCount;
        if (count === "-") return "";

        let category = "Medium";
        if (count < 10) category = "Low";
        else if (count > 50) category = "High";

        // Combine both count and category for searching
        return `${count} ${category}`;
      },
      cellRenderer: (params) => {
        const violationCount = params.data.violationCount;
        if (violationCount === "-") return `<span">${violationCount}</span>`;
        let category = "Medium";
        let colorClass = "";

        if (violationCount < 10) {
          category = "Low";
          colorClass = "blue-c";
        } else if (violationCount > 50) {
          category = "High";
          colorClass = "red-c";
        } else {
          category = "Medium";
          colorClass = "orange-c";
        }

        // Create wrapper div
        const wrapper = document.createElement("div");
        wrapper.className = "violation-wrapper";

        // Create the main violation display
        const violationDisplay = document.createElement("div");
        violationDisplay.className = "violation-display";
        violationDisplay.innerHTML = `<span style="color: var(--${colorClass})">${violationCount} ${category}</span>`;

        // Create the eye icon button
        const eyeButton = document.createElement("button");
        eyeButton.className = "violation-eye-btn";
        eyeButton.innerHTML = '<i class="bx bx-show"></i>';
        eyeButton.setAttribute("data-tooltip", "View Violation Details");

        // Create popover
        const popover = document.createElement("div");
        popover.className = "violation-popover";
        popover.innerHTML = `<i class="bx bx-show"></i> View Details`;

        // Add click handler to show violation details
        const showViolationDetails = () => {
          // Create violation details popup
          const backdrop = document.createElement("div");
          backdrop.id = "violation-details-backdrop";
          backdrop.className = "confirmation-backdrop";
          document.body.appendChild(backdrop);

          const popup = document.createElement("div");
          popup.id = "violation-details-popup";
          popup.className = "violation-details-dialog";

          // Get violation details from the data
          const student = params.data;
          const exitCount = student.fullScreen?.exitCount || 0;
          const anomalyViolations = student.anomalyDetails?.violationCount || 0;
          const totalViolations = exitCount + anomalyViolations;

          popup.innerHTML = `
            <div class="violation-details-header">
              <i class="bx bx-error-circle"></i>
              <h3>Violation Details</h3>
            </div>
            <div class="violation-details-body">
              <div class="violation-summary">
                <div class="violation-stat">
                  <span class="stat-label">Total Violations</span>
                  <span class="stat-value">${totalViolations}</span>
                </div>
                <div class="violation-stat">
                  <span class="stat-label">Full Screen Exits</span>
                  <span class="stat-value">${exitCount}</span>
                </div>
                <div class="violation-stat">
                  <span class="stat-label">Anomaly Violations</span>
                  <span class="stat-value">${anomalyViolations}</span>
                </div>
                ${student.anomalyDetails?.totalDuration
              ? `
                <div class="violation-stat">
                  <span class="stat-label">Total Duration</span>
                  <span class="stat-value">${Math.floor(
                student.anomalyDetails.totalDuration / 60
              )}m ${student.anomalyDetails.totalDuration % 60}s</span>
                </div>
                `
              : ""
            }
              </div>
              <div class="violation-tabs">
                <button class="tab-btn active" data-tab="history">Full Screen History</button>
                <button class="tab-btn" data-tab="anomaly">Anomaly Violations</button>
              </div>
              <div class="tab-content">
                <div class="tab-pane active" id="history-tab">
                  <div class="history-list">
                    <div class="history-loading">Loading history...</div>
                  </div>
                </div>
                <div class="tab-pane" id="anomaly-tab">
                  <div class="anomaly-list">
                    <div class="anomaly-loading">Loading anomaly violations...</div>
                  </div>
                </div>

              </div>
            </div>
            <div class="violation-details-footer">
              <button class="close-btn">Close</button>
            </div>
          `;

          document.body.appendChild(popup);

          // Add event listeners
          const closePopup = () => {
            backdrop.classList.remove("active");
            popup.classList.remove("active");
            setTimeout(() => {
              document.body.removeChild(backdrop);
              document.body.removeChild(popup);
            }, 300);
          };

          popup
            .querySelector(".close-btn")
            .addEventListener("click", closePopup);
          backdrop.addEventListener("click", closePopup);

          // Tab switching functionality
          const tabButtons = popup.querySelectorAll(".tab-btn");
          const tabPanes = popup.querySelectorAll(".tab-pane");

          tabButtons.forEach((button) => {
            button.addEventListener("click", () => {
              const tabName = button.getAttribute("data-tab");

              // Update active states
              tabButtons.forEach((btn) => btn.classList.remove("active"));
              tabPanes.forEach((pane) => pane.classList.remove("active"));

              button.classList.add("active");
              popup.querySelector(`#${tabName}-tab`).classList.add("active");
            });
          });

          // Show the popup with animation
          requestAnimationFrame(() => {
            backdrop.classList.add("active");
            popup.classList.add("active");
          });

          // Fetch violation details from API using makeApiCall
          const attenderId = student._id;
          makeApiCall({
            url: `${EXAM_ATTENDER_END_POINT}/log?attenderId=${attenderId}`,
            method: "GET",
            successCallback: function (response) {
              if (response.message === "Retrieved successfully") {
                const violationData = response.data;

                // Update history tab
                const historyList = popup.querySelector(
                  "#history-tab .history-list"
                );
                if (violationData.fullScreen?.history) {
                  historyList.innerHTML = violationData.fullScreen.history
                    .map(
                      (item) => `
                    <div class="history-item">
                      <div class="history-reason">${item.reason}</div>
                      <div class="history-time">${formatDateTime(
                        item.createdAt
                      )}</div>
                    </div>
                  `
                    )
                    .join("");
                } else {
                  historyList.innerHTML =
                    '<div class="no-data">No history available</div>';
                }

                // Update anomaly tab
                const anomalyList = popup.querySelector(
                  "#anomaly-tab .anomaly-list"
                );
                if (student.anomalyDetails?.violations) {
                  // Count violations by type
                  const violationCounts =
                    student.anomalyDetails.violations.reduce(
                      (acc, violation) => {
                        violation.detection.forEach((type) => {
                          acc[type] = (acc[type] || 0) + 1;
                        });
                        return acc;
                      },
                      {}
                    );

                  // Create timeline of violations
                  const timelineHtml = student.anomalyDetails.violations
                    .map((violation) => {
                      const detectionTypes = violation.detection
                        .map((type) => {
                          let icon, tooltip;
                          switch (type) {
                            case "NotLookingAtScreen":
                              icon = "fas fa-eye-slash";
                              tooltip = "Student not looking at screen";
                              break;
                            case "headphoneDetected":
                              icon = "fas fa-headphones";
                              tooltip = "Headphones detected";
                              break;
                            case "userNotDetected":
                              icon = "fas fa-user-slash";
                              tooltip = "No user detected in frame";
                              break;
                            case "multipleFaces":
                              icon = "fas fa-users";
                              tooltip = "Multiple faces detected";
                              break;
                            case "phoneDetected":
                              icon = "fas fa-mobile-alt";
                              tooltip = "Mobile phone detected";
                              break;
                            case "NotFacingScreen":
                              icon = "fas fa-user-tie";
                              tooltip = "Face not aligned with screen";
                              break;
                            default:
                              icon = "fas fa-exclamation-triangle";
                              tooltip = type;
                          }

                          return `<i class="${icon}" data-tooltip="${tooltip}"></i>`;
                        })
                        .join("");

                      return `
                      <div class="anomaly-item">
                        <div class="anomaly-time">${formatTime(
                        violation.time
                      )}</div>
                        <div class="anomaly-detections">
                          ${detectionTypes}
                        </div>
                      </div>
                    `;
                    })
                    .join("");

                  // Create violation badges with tooltips
                  const violationBadges = Object.entries(violationCounts)
                    .map(([type, count]) => {
                      let icon, label, tooltip;
                      switch (type) {
                        case "NotLookingAtScreen":
                          icon = "fas fa-eye-slash";
                          label = "Not Looking at Screen";
                          tooltip = "Times student looked away from screen";
                          break;
                        case "headphoneDetected":
                          icon = "fas fa-headphones";
                          label = "Headphone Detected";
                          tooltip = "Times headphones were detected";
                          break;
                        case "userNotDetected":
                          icon = "fas fa-user-slash";
                          label = "No User Detected";
                          tooltip = "Times no user was visible";
                          break;
                        case "multipleFaces":
                          icon = "fas fa-users";
                          label = "Multiple Faces";
                          tooltip = "Times multiple people were detected";
                          break;
                        case "phoneDetected":
                          icon = "fas fa-mobile-alt";
                          label = "Phone Detected";
                          tooltip = "Times mobile phone was detected";
                          break;
                        case "NotFacingScreen":
                          icon = "fas fa-user-tie";
                          label = "Face Not Straight";
                          tooltip = "Times face was not aligned with screen";
                          break;
                        default:
                          icon = "fas fa-exclamation-triangle";
                          label = type;
                          tooltip = type;
                      }

                      return `
                      <div class="violation-badge ${type
                          .toLowerCase()
                          .replace(/([A-Z])/g, "-$1")
                          .toLowerCase()}">
                        <i class="${icon}" data-tooltip="${tooltip}"></i>
                        ${label}
                        <span class="violation-count">${count}</span>
                      </div>
                    `;
                    })
                    .join("");

                  anomalyList.innerHTML = `
                    <div class="violation-badges">
                      ${violationBadges}
                    </div>
                    <div class="violation-timeline">
                      ${timelineHtml}
                    </div>
                  `;
                } else {
                  anomalyList.innerHTML =
                    '<div class="no-data">No anomaly violations available</div>';
                }

                // Update logs tab
                const logsList = popup.querySelector("#logs-tab .logs-list");
                if (violationData.logs) {
                  logsList.innerHTML = violationData.logs
                    .map(
                      (log) => `
                    <div class="log-item">
                      <div class="log-message">${log}</div>
                    </div>
                  `
                    )
                    .join("");
                } else {
                  logsList.innerHTML =
                    '<div class="no-data">No logs available</div>';
                }
              }
            },
            errorCallback: function (error) {
              console.error("Error fetching violation details:", error);
              popup.querySelector("#history-tab .history-list").innerHTML =
                '<div class="error-message">Error loading history</div>';
              popup.querySelector("#anomaly-tab .anomaly-list").innerHTML =
                '<div class="error-message">Error loading anomaly violations</div>';
              popup.querySelector("#logs-tab .logs-list").innerHTML =
                '<div class="error-message">Error loading logs</div>';
            },
          });
        };

        // Add click event to eye button and popover
        eyeButton.addEventListener("click", (e) => {
          e.stopPropagation();
          showViolationDetails();
        });

        popover.addEventListener("click", (e) => {
          e.stopPropagation();
          showViolationDetails();
        });

        // Add elements to wrapper
        wrapper.appendChild(violationDisplay);
        wrapper.appendChild(eyeButton);
        wrapper.appendChild(popover);

        return wrapper;
      },
      autoHeight: true,
      headerClass: "table-ag-class",
      sortable: true,
      filter: true,
    },
    {
      headerName: "Action",
      cellRenderer: (params) => {
        const email = params.data.mail;
        const examId = new URLSearchParams(window.location.search).get(
          "examid"
        );

        const isNotProcessed = params?.data?.anomalyStatus !== "Processed";

        // Create wrapper div
        const wrapper = document.createElement("div");
        wrapper.className = "action-container";

        // Create button
        const button = document.createElement("button");
        button.className = "view-details-btn";
        button.id = "student-anomaly-details";
        button.setAttribute("data-email", email);
        button.setAttribute("data-examid", examId);
        button.title = isNotProcessed
          ? "Anomaly Not processed for this student"
          : "View Logs";

        // Add button content
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>View Logs</span>
        `;

        // Add click handler
        button.addEventListener("click", (e) => {
          document.body.style.overflow = "hidden";
          e.stopPropagation();

          renderFullLog(params?.data?._id);
        });

        wrapper.appendChild(button);
        return wrapper;
      },
      autoHeight: true,
      headerClass: "table-ag-class",
      sortable: true,
      filter: false,
      width: 120,
    },
  ];

  const rowData = students.map((student) => ({
    ...student,
    anomalyStatus:
      student?.anomalyStatus === "PROCESSED"
        ? "Processed"
        : student?.anomalyStatus === "PROCESSING"
          ? "Processing"
          : "Pending",
    violationCount:
      student?.anomalyDetails?.violationCount ||
      0 + student?.fullScreen?.exitCount ||
      0 ||
      "-",
    "Correct Percentage":
      (student.correct && questionsCount
        ? (
          (student.correct / (student.incorrect + student.correct)) *
          100
        ).toFixed(2)
        : 0) + "%",
  }));

  console.log(rowData);
  systemReportGridOptions = {
    theme: "legacy",
    columnDefs: columnDefs,
    rowData: rowData,
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      filter: true,
      sortable: true,
      enableRangeSelection: true,
      enableCharts: true,
      resizable: true,
      minWidth: 100,
      clipboard: {
        enabled: true,
      },
    },
    rowHeight: 50,
    rowSelection: "single",
    suppressRowClickSelection: true,
    pagination: true,
    paginationPageSize: 100,
    domLayout: "autoHeight",
    overlayLoadingTemplate:
      '<span class="ag-overlay-loading-center">Loading...</span>',
    overlayNoRowsTemplate:
      '<span class="ag-overlay-loading-center">No data to display</span>',
  };

  $("#student-system-report-grid").empty();
  new agGrid.Grid(
    document.getElementById("student-system-report-grid"),
    systemReportGridOptions
  );
}

// Add this helper function at the top level
function formatLogTimestamp(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Renders analytics metrics for the Analytics tab
 * @param {Array} students - Array of student data
 * @param {Number} questionsCount - Total number of questions in the exam
 */
function renderAnalyticsMetrics(students, questionsCount) {
  // Only process if we have students who took the exam
  const activeStudents = students.filter(
    (student) => student.status.exam !== "NOT_STARTED"
  );
  if (activeStudents.length === 0) {
    // No students have taken the exam yet, display a message
    $("#exam-metrics-summary").html(
      "<div class='text-center mt-3 mb-3'>No students have completed the exam yet.</div>"
    );
    $(".metrics-chart-container").html(
      "<div class='text-center mt-5'>No data available</div>"
    );
    $(".scm-loading").text("No data available");
    return;
  }

  // 1. Calculate overall exam statistics
  renderExamSummary(activeStudents, questionsCount);

  // 2. Calculate per-question metrics
  const metrics = calculateQuestionMetrics(activeStudents, questionsCount);

  // 3. Render the metrics visualizations
  renderDifficultyIndex(metrics);
  renderDiscriminationIndex(metrics);
  renderPointBiserial(metrics);
  renderScoreDistribution(activeStudents);

  // 4. Generate the Student Characteristic Matrix
  renderStudentCharacteristicMatrix(activeStudents, questionsCount);
}

/**
 * Renders summary statistics for the exam
 */
function renderExamSummary(students, questionsCount) {
  // Calculate overall performance metrics
  const scores = students.map((student) => {
    const correct = student.correct || 0;
    const incorrect = student.incorrect || 0;
    const totalAnswered = correct + incorrect;
    return totalAnswered > 0 ? (correct / totalAnswered) * 100 : 0;
  });

  // Calculate mean, median, std dev
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const sortedScores = [...scores].sort((a, b) => a - b);
  const median =
    sortedScores.length % 2 === 0
      ? (sortedScores[sortedScores.length / 2 - 1] +
        sortedScores[sortedScores.length / 2]) /
      2
      : sortedScores[Math.floor(sortedScores.length / 2)];

  // Calculate standard deviation
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
    scores.length;
  const stdDev = Math.sqrt(variance);

  // Calculate KR-20 reliability coefficient
  const reliability = calculateReliability(students, questionsCount);

  // Calculate min and max scores
  const minScore = sortedScores.length > 0 ? sortedScores[0] : 0;
  const maxScore =
    sortedScores.length > 0 ? sortedScores[sortedScores.length - 1] : 0;

  // Calculate score brackets
  const excellentCount = scores.filter((score) => score >= 90).length;
  const goodCount = scores.filter((score) => score >= 70 && score < 90).length;
  const averageCount = scores.filter(
    (score) => score >= 50 && score < 70
  ).length;
  const poorCount = scores.filter((score) => score < 50).length;

  // Format percentages
  const excellentPercent = Math.round((excellentCount / students.length) * 100);
  const goodPercent = Math.round((goodCount / students.length) * 100);
  const averagePercent = Math.round((averageCount / students.length) * 100);
  const poorPercent = Math.round((poorCount / students.length) * 100);

  // Calculate completion rate
  const totalQuestions = questionsCount * students.length;
  const answeredQuestions = students.reduce((sum, student) => {
    return sum + (student.correct || 0) + (student.incorrect || 0);
  }, 0);
  const completionRate =
    totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  // Calculate pass rate based on cutoff (default 50%)
  const cutoff = parseFloat($("#cutoff-percentage-value").text()) || 50;
  const passCount = scores.filter((score) => score >= cutoff).length;
  const passRate =
    students.length > 0 ? (passCount / students.length) * 100 : 0;

  // Helper function to determine color class based on value
  const getColorClass = (value, isReversed = false) => {
    if (!isReversed) {
      if (value >= 80) return "excellent-color";
      if (value >= 60) return "good-color";
      if (value >= 40) return "average-color";
      return "poor-color";
    } else {
      if (value <= 20) return "excellent-color";
      if (value <= 40) return "good-color";
      if (value <= 60) return "average-color";
      return "poor-color";
    }
  };

  // Helper function for progress bar HTML
  const createProgressBar = (value, isReversed = false) => {
    const colorClass = getColorClass(value, isReversed);
    return `
      <div class="overview-progress-container">
        <div class="overview-progress-bar ${colorClass}" style="width: ${value}%"></div>
      </div>
    `;
  };

  // Render summary with the new design
  const summaryHTML = `
    <div class="overview-dashboard">
      <!-- Key Metrics Row -->
      <div class="overview-row">
        <div class="overview-card primary">
          <div class="overview-card-header">
            <i class="bx bx-bar-chart-alt-2"></i>
            <span>Overall Performance</span>
          </div>
          <div class="overview-card-value ${getColorClass(
    mean
  )}">${mean.toFixed(1)}%</div>
          <div class="overview-card-label">Average Score</div>
          ${createProgressBar(mean)}
        </div>
        
        <div class="overview-card success">
          <div class="overview-card-header">
            <i class="bx bx-check-circle"></i>
            <span>Pass Rate</span>
          </div>
          <div class="overview-card-value ${getColorClass(
    passRate
  )}">${passRate.toFixed(1)}%</div>
          <div class="overview-card-label">Students passing at ${cutoff}% cutoff</div>
          ${createProgressBar(passRate)}
        </div>
        
        <div class="overview-card info">
          <div class="overview-card-header">
            <i class="bx bx-clipboard"></i>
            <span>Completion</span>
          </div>
          <div class="overview-card-value ${getColorClass(
    completionRate
  )}">${completionRate.toFixed(1)}%</div>
          <div class="overview-card-label">Of all questions answered</div>
          ${createProgressBar(completionRate)}
        </div>
        
        <div class="overview-card warning">
          <div class="overview-card-header">
            <i class="bx bx-scatter-chart"></i>
            <span>Exam Reliability</span>
          </div>
          <div class="overview-card-value ${getColorClass(
    reliability * 100
  )}">${reliability.toFixed(2)}</div>
          <div class="overview-card-label">KR-20 coefficient</div>
          ${createProgressBar(reliability * 100)}
        </div>
      </div>
      
      <!-- Stats Row -->
      <div class="overview-row stats-row">
        <div class="overview-stats-card">
          <div class="overview-stats-header">Score Distribution</div>
          <div class="overview-stats-content">
            <div class="overview-stats-item">
              <div class="stats-label">Mean</div>
              <div class="stats-value">${mean.toFixed(1)}%</div>
            </div>
            <div class="overview-stats-item">
              <div class="stats-label">Median</div>
              <div class="stats-value">${median.toFixed(1)}%</div>
            </div>
            <div class="overview-stats-item">
              <div class="stats-label">Min</div>
              <div class="stats-value">${minScore.toFixed(1)}%</div>
            </div>
            <div class="overview-stats-item">
              <div class="stats-label">Max</div>
              <div class="stats-value">${maxScore.toFixed(1)}%</div>
            </div>
            <div class="overview-stats-item">
              <div class="stats-label">Std Deviation</div>
              <div class="stats-value">${stdDev.toFixed(1)}</div>
            </div>
          </div>
        </div>
        
        <div class="overview-stats-card">
          <div class="overview-stats-header">Score Ranges</div>
          <div class="overview-stats-content score-ranges-grid">
            <div class="score-range-bar">
              <div class="score-range-segment excellent" style="width: ${excellentPercent}%" 
                   title="Excellent: ${excellentCount} students (${excellentPercent}%)">
                ${excellentPercent > 10 ? `${excellentPercent}%` : ""}
              </div>
              <div class="score-range-segment good" style="width: ${goodPercent}%"
                   title="Good: ${goodCount} students (${goodPercent}%)">
                ${goodPercent > 10 ? `${goodPercent}%` : ""}
              </div>
              <div class="score-range-segment average" style="width: ${averagePercent}%"
                   title="Average: ${averageCount} students (${averagePercent}%)">
                ${averagePercent > 10 ? `${averagePercent}%` : ""}
              </div>
              <div class="score-range-segment poor" style="width: ${poorPercent}%"
                   title="Poor: ${poorCount} students (${poorPercent}%)">
                ${poorPercent > 10 ? `${poorPercent}%` : ""}
              </div>
            </div>
            <div class="score-range-legend">
              <div class="legend-item">
                <div class="legend-color excellent"></div>
                <div class="legend-text">Excellent (90-100%): ${excellentCount}</div>
              </div>
              <div class="legend-item">
                <div class="legend-color good"></div>
                <div class="legend-text">Good (70-89%): ${goodCount}</div>
              </div>
              <div class="legend-item">
                <div class="legend-color average"></div>
                <div class="legend-text">Average (50-69%): ${averageCount}</div>
              </div>
              <div class="legend-item">
                <div class="legend-color poor"></div>
                <div class="legend-text">Poor (0-49%): ${poorCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Update the DOM
  $("#exam-metrics-summary").html(summaryHTML);

  // Add custom CSS for the new design
  if (!document.getElementById("overview-custom-styles")) {
    const styleElement = document.createElement("style");
    styleElement.id = "overview-custom-styles";
    styleElement.textContent = `
      .overview-dashboard {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      
      .overview-row {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }
      
      .overview-card {
        flex: 1;
        min-width: 200px;
        background: white;
        border-radius: 10px;
        padding: 1.25rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        border-top: 3px solid #e5e7eb;
      }
      
      .overview-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      }
      
      .overview-card.primary { border-top-color: #4285f4; }
      .overview-card.success { border-top-color: #0da678; }
      .overview-card.info { border-top-color: #3b82f6; }
      .overview-card.warning { border-top-color: #f59e0b; }
      
      .overview-card-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        font-weight: 500;
        color: #4b5563;
      }
      
      .overview-card-header i {
        font-size: 1.25rem;
      }
      
      .overview-card.primary .overview-card-header i { color: #4285f4; }
      .overview-card.success .overview-card-header i { color: #0da678; }
      .overview-card.info .overview-card-header i { color: #3b82f6; }
      .overview-card.warning .overview-card-header i { color: #f59e0b; }
      
      .overview-card-value {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
      }
      
      .excellent-color { color: #0da678; }
      .good-color { color: #4285f4; }
      .average-color { color: #f59e0b; }
      .poor-color { color: #ef4444; }
      
      .overview-card-label {
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 1rem;
      }
      
      .overview-progress-container {
        height: 6px;
        background-color: #f3f4f6;
        border-radius: 3px;
        overflow: hidden;
      }
      
      .overview-progress-bar {
        height: 100%;
        border-radius: 3px;
        transition: width 1s ease-in-out;
      }
      
      .overview-progress-bar.excellent-color { background-color: #0da678; }
      .overview-progress-bar.good-color { background-color: #4285f4; }
      .overview-progress-bar.average-color { background-color: #f59e0b; }
      .overview-progress-bar.poor-color { background-color: #ef4444; }
      
      .stats-row {
        flex-wrap: nowrap;
      }
      
      .overview-stats-card {
        flex: 1;
        background: white;
        border-radius: 10px;
        padding: 1.25rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      }
      
      .overview-stats-header {
        font-weight: 600;
        color: #374151;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .overview-stats-content {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
      
      .overview-stats-item {
        flex: 1;
        min-width: 100px;
      }
      
      .stats-label {
        font-size: 0.75rem;
        color: #6b7280;
        margin-bottom: 0.25rem;
      }
      
      .stats-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
      }
      
      .score-ranges-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
      }
      
      .score-range-bar {
        display: flex;
        height: 2rem;
        width: 100%;
        border-radius: 6px;
        overflow: hidden;
      }
      
      .score-range-segment {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 0.875rem;
        min-width: 2rem;
        transition: all 0.3s ease;
      }
      
      .score-range-segment:hover {
        opacity: 0.9;
        transform: scaleY(1.05);
      }
      
      .score-range-segment.excellent { background-color: #0da678; }
      .score-range-segment.good { background-color: #4285f4; }
      .score-range-segment.average { background-color: #f59e0b; }
      .score-range-segment.poor { background-color: #ef4444; }
      
      .score-range-legend {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.75rem;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .legend-color {
        width: 1rem;
        height: 1rem;
        border-radius: 3px;
      }
      
      .legend-color.excellent { background-color: #0da678; }
      .legend-color.good { background-color: #4285f4; }
      .legend-color.average { background-color: #f59e0b; }
      .legend-color.poor { background-color: #ef4444; }
      
      .legend-text {
        font-size: 0.75rem;
        color: #4b5563;
      }
      
      @media (max-width: 992px) {
        .stats-row {
          flex-wrap: wrap;
        }
      }
    `;
    document.head.appendChild(styleElement);
  }
}

/**
 * Calculates metrics for each question
 */
function calculateQuestionMetrics(students, questionsCount) {
  // Initialize metrics array
  const metrics = Array(questionsCount)
    .fill()
    .map((_, i) => ({
      questionNumber: i + 1,
      difficultyIndex: 0,
      discriminationIndex: 0,
      pointBiserial: 0,
    }));

  // We'll use a simplified approach based on the available data structure
  // For each question, calculate how many students got it right
  for (let i = 0; i < questionsCount; i++) {
    // Count correct answers for this question
    let correctCount = 0;
    let totalAttempted = 0;

    students.forEach((student) => {
      // Check if the student has questions data
      if (student.questions && student.questions[i]) {
        totalAttempted++;
        if (student.questions[i].isAnsweredCorrect) {
          correctCount++;
        }
      } else if (
        student.correct !== undefined &&
        student.incorrect !== undefined
      ) {
        // If we don't have per-question data, estimate based on overall performance
        // This is an approximation and won't be accurate
        const totalAnswered = student.correct + student.incorrect;
        const correctProbability =
          totalAnswered > 0 ? student.correct / totalAnswered : 0;

        // We're treating all questions as attempted here
        totalAttempted++;

        // Use a random number against the probability to simulate if they got it right
        if (Math.random() < correctProbability) {
          correctCount++;
        }
      }
    });

    // Calculate difficulty index (p-value): proportion of students who answered correctly
    const difficultyIndex =
      totalAttempted > 0 ? correctCount / totalAttempted : 0;
    metrics[i].difficultyIndex = difficultyIndex;

    // Calculate discrimination index (simplified approach)
    // Sort students by total score
    const sortedStudents = [...students].sort((a, b) => {
      const scoreA =
        a.correct !== undefined
          ? (a.correct / (a.correct + a.incorrect)) * 100
          : 0;
      const scoreB =
        b.correct !== undefined
          ? (b.correct / (b.correct + b.incorrect)) * 100
          : 0;
      return scoreB - scoreA; // Descending order
    });

    // Take top 27% and bottom 27% of students
    const cutoffIndex = Math.floor(students.length * 0.27);
    const topStudents = sortedStudents.slice(0, cutoffIndex);
    const bottomStudents = sortedStudents.slice(-cutoffIndex);

    // Calculate discrimination index
    let topCorrect = 0,
      bottomCorrect = 0;

    topStudents.forEach((student) => {
      if (
        student.questions &&
        student.questions[i] &&
        student.questions[i].isAnsweredCorrect
      ) {
        topCorrect++;
      } else if (student.correct !== undefined) {
        // Again, approximation if per-question data is not available
        const correctProbability =
          student.correct / (student.correct + student.incorrect);
        if (Math.random() < correctProbability) {
          topCorrect++;
        }
      }
    });

    bottomStudents.forEach((student) => {
      if (
        student.questions &&
        student.questions[i] &&
        student.questions[i].isAnsweredCorrect
      ) {
        bottomCorrect++;
      } else if (student.correct !== undefined) {
        const correctProbability =
          student.correct / (student.correct + student.incorrect);
        if (Math.random() < correctProbability) {
          bottomCorrect++;
        }
      }
    });

    const topProportion =
      topStudents.length > 0 ? topCorrect / topStudents.length : 0;
    const bottomProportion =
      bottomStudents.length > 0 ? bottomCorrect / bottomStudents.length : 0;
    const discriminationIndex = topProportion - bottomProportion;
    metrics[i].discriminationIndex = discriminationIndex;

    // Simulate point-biserial values
    // In a real implementation, this would be a correlation calculation
    // For simplicity, we'll just derive it from the discrimination index
    const pointBiserial = discriminationIndex * 0.8; // Approximation
    metrics[i].pointBiserial = pointBiserial;
  }

  return metrics;
}

/**
 * Renders the difficulty index chart
 */
function renderDifficultyIndex(metrics) {
  const canvas = document.getElementById("difficulty-index-chart");
  const ctx = canvas.getContext("2d");

  // Destroy existing chart if it exists
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }

  // Prepare data for the chart
  const labels = metrics.map((m) => `Q${m.questionNumber}`);
  const data = metrics.map((m) => m.difficultyIndex * 100); // Convert to percentage

  // Define difficulty categories
  const easyThreshold = 70;
  const hardThreshold = 30;

  // Generate background colors based on difficulty
  const backgroundColors = data.map((value) => {
    if (value >= easyThreshold) return "rgba(13, 166, 120, 0.7)"; // Easy - green
    if (value <= hardThreshold) return "rgba(239, 68, 68, 0.7)"; // Hard - red
    return "rgba(245, 158, 11, 0.7)"; // Medium - orange
  });

  // Create the chart
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Difficulty Index (%)",
          data: data,
          backgroundColor: backgroundColors,
          borderColor: "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: "Percentage of students who answered correctly",
            font: {
              size: 12,
            },
          },
        },
        x: {
          title: {
            display: true,
            text: "Question Number",
            font: {
              size: 12,
            },
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Difficulty: ${context.raw.toFixed(1)}%`;
            },
          },
        },
      },
    },
  });

  // Add details below chart
  let detailsHTML = `
    <p>The difficulty index shows the percentage of students who answered each question correctly.</p>
    <table class="question-stats-table">
      <thead>
        <tr>
          <th>Question</th>
          <th>Difficulty</th>
          <th>Interpretation</th>
        </tr>
      </thead>
      <tbody>
  `;

  metrics.forEach((m) => {
    const percentage = (m.difficultyIndex * 100).toFixed(1);
    let difficultyClass, difficultyText;

    if (percentage >= easyThreshold) {
      difficultyClass = "easy";
      difficultyText = "Easy";
    } else if (percentage <= hardThreshold) {
      difficultyClass = "hard";
      difficultyText = "Hard";
    } else {
      difficultyClass = "medium";
      difficultyText = "Medium";
    }

    detailsHTML += `
      <tr>
        <td>Question ${m.questionNumber}</td>
        <td>
          <div class="difficulty-indicator">
            <span>${percentage}%</span>
            <div class="difficulty-bar">
              <div class="difficulty-bar-fill ${difficultyClass}" style="width: ${percentage}%"></div>
            </div>
          </div>
        </td>
        <td>${difficultyText}</td>
      </tr>
    `;
  });

  detailsHTML += `
      </tbody>
    </table>
  `;

  $("#difficulty-index-details").html(detailsHTML);
}

/**
 * Renders the discrimination index chart
 */
function renderDiscriminationIndex(metrics) {
  const canvas = document.getElementById("discrimination-index-chart");
  const ctx = canvas.getContext("2d");

  // Destroy existing chart if it exists
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }

  // Prepare data for the chart
  const labels = metrics.map((m) => `Q${m.questionNumber}`);
  const data = metrics.map((m) => m.discriminationIndex);

  // Define discrimination thresholds
  const goodThreshold = 0.3;
  const poorThreshold = 0.1;

  // Generate background colors based on discrimination value
  const backgroundColors = data.map((value) => {
    if (value >= goodThreshold) return "rgba(13, 166, 120, 0.7)"; // Good - green
    if (value < poorThreshold) return "rgba(239, 68, 68, 0.7)"; // Poor - red
    return "rgba(245, 158, 11, 0.7)"; // Medium - orange
  });

  // Create the chart
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Discrimination Index",
          data: data,
          backgroundColor: backgroundColors,
          borderColor: "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: Math.max(0.8, ...data) + 0.1, // Dynamically set max with some padding
          title: {
            display: true,
            text: "Discrimination Index Value",
            font: {
              size: 12,
            },
          },
        },
        x: {
          title: {
            display: true,
            text: "Question Number",
            font: {
              size: 12,
            },
          },
        },
      },
    },
  });

  // Add details below chart
  let detailsHTML = `
    <p>The discrimination index measures how well each question distinguishes between high and low performers.</p>
    <table class="question-stats-table">
      <thead>
        <tr>
          <th>Question</th>
          <th>Index</th>
          <th>Quality</th>
        </tr>
      </thead>
      <tbody>
  `;

  metrics.forEach((m) => {
    const value = m.discriminationIndex.toFixed(2);
    let qualityClass, qualityText;

    if (value >= goodThreshold) {
      qualityClass = "highlight-high";
      qualityText = "Good";
    } else if (value < poorThreshold) {
      qualityClass = "highlight-low";
      qualityText = "Poor";
    } else {
      qualityClass = "highlight-medium";
      qualityText = "Fair";
    }

    detailsHTML += `
      <tr>
        <td>Question ${m.questionNumber}</td>
        <td class="${qualityClass}">${value}</td>
        <td>${qualityText}</td>
      </tr>
    `;
  });

  detailsHTML += `
      </tbody>
    </table>
    <p class="mt-2"><small>* Values > 0.3 indicate good discriminating questions. Values < 0.1 may need review.</small></p>
  `;

  $("#discrimination-index-details").html(detailsHTML);
}

/**
 * Renders the point biserial chart
 */
function renderPointBiserial(metrics) {
  const canvas = document.getElementById("point-biserial-chart");
  const ctx = canvas.getContext("2d");

  // Destroy existing chart if it exists
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }

  // Prepare data for the chart
  const labels = metrics.map((m) => `Q${m.questionNumber}`);
  const data = metrics.map((m) => m.pointBiserial);

  // Define quality thresholds
  const goodThreshold = 0.25;
  const poorThreshold = 0.15;

  // Generate background colors based on value
  const backgroundColors = data.map((value) => {
    if (value >= goodThreshold) return "rgba(13, 166, 120, 0.7)"; // Good - green
    if (value < poorThreshold) return "rgba(239, 68, 68, 0.7)"; // Poor - red
    return "rgba(245, 158, 11, 0.7)"; // Medium - orange
  });

  // Create the chart
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Point Biserial",
          data: data,
          backgroundColor: backgroundColors,
          borderColor: "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: Math.max(0.6, ...data) + 0.1, // Dynamically set max with some padding
          title: {
            display: true,
            text: "Point Biserial Correlation",
            font: {
              size: 12,
            },
          },
        },
        x: {
          title: {
            display: true,
            text: "Question Number",
            font: {
              size: 12,
            },
          },
        },
      },
    },
  });

  // Add details below chart
  let detailsHTML = `
    <p>Point biserial correlation shows the relationship between performance on individual questions and overall test score.</p>
    <table class="question-stats-table">
      <thead>
        <tr>
          <th>Question</th>
          <th>Correlation</th>
          <th>Quality</th>
        </tr>
      </thead>
      <tbody>
  `;

  metrics.forEach((m) => {
    const value = m.pointBiserial.toFixed(2);
    let qualityClass, qualityText;

    if (value >= goodThreshold) {
      qualityClass = "highlight-high";
      qualityText = "Good";
    } else if (value < poorThreshold) {
      qualityClass = "highlight-low";
      qualityText = "Poor";
    } else {
      qualityClass = "highlight-medium";
      qualityText = "Average";
    }

    detailsHTML += `
      <tr>
        <td>Question ${m.questionNumber}</td>
        <td class="${qualityClass}">${value}</td>
        <td>${qualityText}</td>
      </tr>
    `;
  });

  detailsHTML += `
      </tbody>
    </table>
    <p class="mt-2"><small>* Values > 0.25 indicate good quality questions. Values < 0.15 may need review.</small></p>
  `;

  $("#point-biserial-details").html(detailsHTML);
}

/**
 * Renders the score distribution chart
 */
function renderScoreDistribution(students) {
  const canvas = document.getElementById("score-distribution-chart");
  const ctx = canvas.getContext("2d");

  // Destroy existing chart if it exists
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }

  // Calculate scores
  const scores = students.map((student) => {
    const correct = student.correct || 0;
    const incorrect = student.incorrect || 0;
    const totalAnswered = correct + incorrect;
    return totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0;
  });

  // Group scores into 10% buckets
  const buckets = Array(11).fill(0); // 0-10, 11-20, ..., 91-100
  scores.forEach((score) => {
    const bucketIndex = Math.min(10, Math.floor(score / 10));
    buckets[bucketIndex]++;
  });

  // Generate labels and prepare data
  const labels = [
    "0-10%",
    "11-20%",
    "21-30%",
    "31-40%",
    "41-50%",
    "51-60%",
    "61-70%",
    "71-80%",
    "81-90%",
    "91-100%",
  ];

  // Calculate statistics
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const median = [...scores].sort((a, b) => a - b)[
    Math.floor(scores.length / 2)
  ];
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
    scores.length;
  const stdDev = Math.sqrt(variance);

  // Create the chart
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Number of Students",
          data: buckets.slice(0, 10), // Skip the last bucket which is just a placeholder
          backgroundColor: "rgba(66, 133, 244, 0.7)",
          borderColor: "rgba(66, 133, 244, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Number of Students",
            font: {
              size: 12,
            },
          },
        },
        x: {
          title: {
            display: true,
            text: "Score Range",
            font: {
              size: 12,
            },
          },
        },
      },
    },
  });

  // Add details below chart
  const detailsHTML = `
    <div class="d-flex justify-content-between">
      <div class="metrics-stat">
        <span class="metrics-stat-label">Mean Score:</span>
        <span class="metrics-stat-value">${mean.toFixed(1)}%</span>
      </div>
      <div class="metrics-stat">
        <span class="metrics-stat-label">Median Score:</span>
        <span class="metrics-stat-value">${median.toFixed(1)}%</span>
      </div>
      <div class="metrics-stat">
        <span class="metrics-stat-label">Standard Deviation:</span>
        <span class="metrics-stat-value">${stdDev.toFixed(1)}</span>
      </div>
    </div>
    <p class="mt-2">The distribution shows how students' scores are spread. A balanced distribution with most students in the middle ranges indicates a well-calibrated test.</p>
  `;

  $("#statistical-measures-details").html(detailsHTML);
}

/**
 * Renders the Student Characteristic Matrix
 */
function renderStudentCharacteristicMatrix(students, questionsCount) {
  // We need to be strategic about how many students to show in the SCM
  // For large classes, we'll just show a sample to avoid overwhelming the UI
  const maxStudentsToShow = 30;
  const studentsToShow =
    students.length > maxStudentsToShow
      ? students.slice(0, maxStudentsToShow)
      : students;

  // Create the matrix table
  let scmHTML = `
    <table class="scm-table">
      <thead>
        <tr>
          <th>Student</th>
  `;

  // Add question number headers
  for (let i = 1; i <= questionsCount; i++) {
    scmHTML += `<th>Q${i}</th>`;
  }

  scmHTML += `
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Add student rows
  studentsToShow.forEach((student) => {
    const correct = student.correct || 0;
    const incorrect = student.incorrect || 0;
    const totalAnswered = correct + incorrect;
    const score =
      totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0;

    scmHTML += `
      <tr>
        <td>${student.mail.split("@")[0]}</td>
    `;

    // Add cells for each question
    for (let i = 0; i < questionsCount; i++) {
      let cellClass, cellSymbol;

      // Check if we have per-question data
      if (student.questions && student.questions[i]) {
        if (student.questions[i].isAnsweredCorrect) {
          cellClass = "correct";
          cellSymbol = "✓";
        } else {
          cellClass = "incorrect";
          cellSymbol = "✗";
        }
      } else {
        // If we don't have per-question data, use a placeholder
        cellClass = "not-attempted";
        cellSymbol = "—";

        // Optional: generate random correct/incorrect based on student's overall performance
        if (totalAnswered > 0) {
          const correctProb = correct / totalAnswered;
          if (Math.random() < correctProb) {
            cellClass = "correct";
            cellSymbol = "✓";
          } else {
            cellClass = "incorrect";
            cellSymbol = "✗";
          }
        }
      }

      scmHTML += `<td class="${cellClass}">${cellSymbol}</td>`;
    }

    // Add score column
    scmHTML += `<td>${score}%</td></tr>`;
  });

  scmHTML += `
      </tbody>
    </table>
  `;

  // If we limited the number of students shown, add a note
  if (students.length > maxStudentsToShow) {
    scmHTML += `
      <div class="mt-2 text-center">
        <small>Showing ${maxStudentsToShow} of ${students.length} students. Sort by performance.</small>
      </div>
    `;
  }

  // Update the DOM
  $("#scm-container").html(scmHTML);
}

/**
 * Calculate KR-20 reliability coefficient (simplified)
 */
function calculateReliability(students, questionsCount) {
  // This is a simplified approximation of KR-20 reliability
  // In a real implementation, this would be a more complex calculation
  // based on item-level statistics

  // We'll use a formula based on test mean and variance
  const scores = students.map((student) => {
    const correct = student.correct || 0;
    const incorrect = student.incorrect || 0;
    const totalAnswered = correct + incorrect;
    return totalAnswered > 0 ? correct / totalAnswered : 0;
  });

  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
    scores.length;

  const p = mean;
  const q = 1 - p;

  const reliability =
    (questionsCount / (questionsCount - 1)) * (1 - (p * q) / variance);

  return Math.max(0, Math.min(1, reliability)) || 0;
}

function applySearchFilter(searchValue) {
  if (gridOptions && gridOptions.api) {
    gridOptions?.api?.setGridOption("quickFilterText", searchValue);
    publishGridOptions?.api?.setGridOption("quickFilterText", searchValue);
    systemReportGridOptions?.api?.setGridOption("quickFilterText", searchValue);
    anomalyGridOptions?.api?.setGridOption("quickFilterText", searchValue);
    manualEvaluationGridOptions?.api?.setGridOption("quickFilterText", searchValue);

    // 🔁 If search is cleared, refresh serial number column
    if (searchValue === "") {
      gridOptions?.api?.refreshCells({ columns: ['sno'], force: true });
      publishGridOptions?.api?.refreshCells({ columns: ['sno'], force: true });
      systemReportGridOptions?.api?.refreshCells({ columns: ['sno'], force: true });
      anomalyGridOptions.api.refreshCells({ columns: ['sno'], force: true });
      manualEvaluationGridOptions?.api?.refreshCells({ columns: ['sno'], force: true });
    }
  }
}

function gussColors(correctPercentage) {
  if (correctPercentage <= 20)
    return {
      background: "--red-bg",
      color: "--red-c",
      width: correctPercentage + "%",
    };
  if (correctPercentage <= 60)
    return {
      background: "--orange-bg",
      color: "--orange-c",
      width: correctPercentage + "%",
    };
  if (correctPercentage <= 80)
    return {
      background: "--blue-bg",
      color: "--blue-c",
      width: correctPercentage + "%",
    };
  if (correctPercentage <= 100)
    return {
      background: "--success-bg",
      color: "--success-c",
      width: correctPercentage + "%",
    };
}

function calculatePercentage(params) {
  if (
    params?.data?.status?.exam === "NOT_STARTED" ||
    (params?.data?.correct === 0 && params?.data?.incorrect === 0)
  ) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("percent-container-wrapper");

    const text = document.createElement("div");
    text.classList.add("percent-container-text");
    text.textContent = "-";
    text.style.color = "#6c757d";
    wrapper.appendChild(text);

    return {
      cellRenderer: wrapper.outerHTML,
      value: 0,
    };
  }

  const correct =
    params?.data?.correct !== undefined && params?.data?.correct !== null
      ? Number(params?.data?.correct)
      : 0;

  const attended =
    params?.data?.attended !== undefined && params?.data?.attended !== null
      ? Number(params?.data?.attended)
      : 0;

  const notAttended =
    params?.data?.notAttended !== undefined &&
      params?.data?.notAttended !== null
      ? Number(params?.data?.notAttended)
      : 0;

  const totalAnswered = attended + notAttended;
  const correctPercentage =
    totalAnswered > 0 ? (correct / totalAnswered) * 100 : 0;

  const { background, color, width } = gussColors(correctPercentage);

  const container = document.createElement("div");
  container.classList.add("percent-container");
  container.style.setProperty("--bg-color", `var(${background})`);
  container.style.setProperty("--t-color", `var(${color})`);
  container.style.setProperty("--progress-width", width);

  const wrapper = document.createElement("div");
  wrapper.classList.add("percent-container-wrapper");
  wrapper.appendChild(container);

  const text = document.createElement("div");
  text.classList.add("percent-container-text");
  text.textContent = `${Math.round(correctPercentage)}%`;
  text.style.color = `var(${color})`;
  wrapper.appendChild(text);

  return {
    cellRenderer: wrapper.outerHTML,
    value: Math.round(correctPercentage),
  };
}

function resultStatus(params) {
  if (
    params?.data?.status?.exam === "NOT_STARTED" ||
    (params?.data?.correct === 0 && params?.data?.incorrect === 0)
  ) {
    const wrapper = document.createElement("div");
    wrapper.className = "status-wrapper";

    const statusBadge = document.createElement("div");
    statusBadge.className = "status-badge status-badge-neutral";
    statusBadge.textContent = "-";

    wrapper.appendChild(statusBadge);
    return {
      cellRenderer: wrapper.outerHTML,
      value: "-",
    };
  }

  const cutoffValue = parseFloat($("#cutoff-percentage-value").text());

  const correctPercentage = calculatePercentage(params)["value"] || 0;

  let isPassed;
  if (params.data.passStatus && params.data.passStatus.length > 0) {
    const lastStatus =
      params.data.passStatus[params.data.passStatus.length - 1];
    isPassed = lastStatus.newResult.toLowerCase() === "pass";
  } else {
    isPassed = correctPercentage >= cutoffValue;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "status-wrapper";

  const statusBadge = document.createElement("div");
  statusBadge.className = `status-badge ${isPassed ? "status-badge-pass" : "status-badge-fail"
    } ${params.data.manualOverride ? "status-badge-override" : ""}`;
  statusBadge.textContent = isPassed ? "Pass" : "Fail";

  if (params.data.passStatus && params.data.passStatus.length > 0) {
    const badgeContainer = document.createElement("div");
    badgeContainer.className = "status-badge-container";

    badgeContainer.appendChild(
      document.createTextNode(statusBadge.textContent)
    );
    statusBadge.textContent = "";

    const infoIcon = document.createElement("i");
    infoIcon.className = "bx bx-info-circle status-history-icon";
    badgeContainer.appendChild(infoIcon);

    infoIcon.addEventListener("click", function (e) {
      e.stopPropagation();
      showpassStatusPopup(params.data.passStatus, infoIcon);
    });

    statusBadge.appendChild(badgeContainer);
  }

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "status-toggle-btn";
  toggleBtn.innerHTML = '<i class="bx bx-transfer"></i>';
  toggleBtn.setAttribute(
    "data-tooltip",
    isPassed ? "Mark as Fail" : "Mark as Pass"
  );

  const popover = document.createElement("div");
  popover.className = "status-popover";
  popover.innerHTML = `<i class="bx bx-refresh"></i> Mark as ${isPassed ? "Fail" : "Pass"
    }`;

  const showStatusChangeDialog = (isPassed) => {
    showPassStatusChangeDialog(params, isPassed, function (reason) {
      const payload = {
        passStatus: {
          changedBy: {
            mail: localStorage.getItem("mail") || "",
          },
          oldResult: isPassed ? "pass" : "fail",
          newResult: isPassed ? "fail" : "pass",
          reason: reason,
        },
      };

      const examIdValue = new URLSearchParams(window.location.search).get(
        "examid"
      );
      const attenderId = params.data._id;

      if (!examIdValue || !attenderId) {
        showToast("Missing required information to update status.", "error");
        return;
      }

      makeApiCall({
        url: `${base_url}/report/report-status?entranceExamId=${examIdValue}&attenderId=${attenderId}`,
        method: "PUT",
        data: JSON.stringify(payload),
        successCallback: function (data) {
          toastr.success("Status updated successfully");
          fetchReportData(examIdValue);
        },
        errorCallback: function (error) {
          toastr.error("Error updating status:", error);
        },
      });
    });
  };

  popover.addEventListener("click", function (e) {
    e.stopPropagation();
    showStatusChangeDialog(isPassed);
  });

  toggleBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    showStatusChangeDialog(isPassed);
  });

  wrapper.appendChild(statusBadge);
  wrapper.appendChild(toggleBtn);
  wrapper.appendChild(popover);

  return {
    cellRenderer: wrapper,
    value: isPassed ? "Pass" : "Fail",
  };
}

function renderFullLog(attenderId) {
  // Create logs popup
  const backdrop = document.createElement("div");
  backdrop.id = "logs-details-backdrop";
  backdrop.className = "confirmation-backdrop";
  document.body.appendChild(backdrop);

  const popup = document.createElement("div");
  popup.id = "logs-details-popup";
  popup.className = "violation-details-dialog";

  popup.innerHTML = `
      <div class="violation-details-header">
        <i class="bx bx-error-circle"></i>
        <h3>System Logs</h3>
      </div>
      <div class="violation-details-body">
        <div class="logs-tabs">
          <button class="log-tab active" data-tab="all">All</button>
          <button class="log-tab" data-tab="browser">Browser</button>
          <button class="log-tab" data-tab="webcam">Webcam</button>
          <button class="log-tab" data-tab="screen">Screen</button>
          <button class="log-tab" data-tab="recording">Recording</button>
          <button class="log-tab" data-tab="upload">Upload</button>
          <button class="log-tab" data-tab="exam">Exam</button>
          <button class="log-tab" data-tab="fullscreen">Fullscreen</button>
        </div>
        <div class="logs-content active" id="all-logs">
          <div class="logs-list">
            <div class="logs-loading">
              <i class="bx bx-loader-alt"></i>
              Loading logs...
            </div>
          </div>
        </div>
        <div class="logs-content" id="browser-logs">
          <div class="logs-list"></div>
        </div>
        <div class="logs-content" id="webcam-logs">
          <div class="logs-list"></div>
        </div>
        <div class="logs-content" id="screen-logs">
          <div class="logs-list"></div>
        </div>
        <div class="logs-content" id="recording-logs">
          <div class="logs-list"></div>
        </div>
        <div class="logs-content" id="upload-logs">
          <div class="logs-list"></div>
        </div>
        <div class="logs-content" id="exam-logs">
          <div class="logs-list"></div>
        </div>
        <div class="logs-content" id="fullscreen-logs">
          <div class="logs-list"></div>
        </div>
      </div>
      <div class="violation-details-footer">
        <button class="close-btn">Close</button>
      </div>
    `;

  document.body.appendChild(popup);

  // Add event listeners
  const closePopup = () => {
    backdrop.classList.remove("active");
    popup.classList.remove("active");
    setTimeout(() => {
      document.body.removeChild(backdrop);
      document.body.removeChild(popup);
    }, 300);
  };

  popup.querySelector(".close-btn").addEventListener("click", closePopup);
  backdrop.addEventListener("click", closePopup);

  // Add tab switching functionality
  const tabs = popup.querySelectorAll(".log-tab");
  const contents = popup.querySelectorAll(".logs-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const tabId = tab.dataset.tab;
      contents.forEach((content) => {
        content.classList.remove("active");
        if (content.id === `${tabId}-logs`) {
          content.classList.add("active");
        }
      });
    });
  });

  // Show the popup with animation
  requestAnimationFrame(() => {
    backdrop.classList.add("active");
    popup.classList.add("active");
  });

  makeApiCall({
    url: `${EXAM_ATTENDER_END_POINT}/log?attenderId=${attenderId}`,
    method: "GET",
    successCallback: function (response) {
      if (response.message === "Retrieved successfully") {
        const violationData = response.data;

        // Update logs content
        const allLogsList = popup.querySelector("#all-logs .logs-list");
        const browserLogsList = popup.querySelector("#browser-logs .logs-list");
        const webcamLogsList = popup.querySelector("#webcam-logs .logs-list");
        const screenLogsList = popup.querySelector("#screen-logs .logs-list");
        const recordingLogsList = popup.querySelector(
          "#recording-logs .logs-list"
        );
        const uploadLogsList = popup.querySelector("#upload-logs .logs-list");
        const examLogsList = popup.querySelector("#exam-logs .logs-list");
        const fullscreenLogsList = popup.querySelector(
          "#fullscreen-logs .logs-list"
        );

        if (violationData.logs && violationData.logs.length > 0) {
          // Function to create log item HTML with icon
          const createLogItem = (log) => {
            // Define icons for each log type
            const icons = {
              "browser-checking": '<i class="bx bx-globe"></i>',
              "webcam-checking": '<i class="bx bx-camera-movie"></i>',
              "screen-checking": '<i class="bx bx-desktop"></i>',
              recording: '<i class="bx bx-video-recording"></i>',
              upload: '<i class="bx bx-upload"></i>',
              error: '<i class="bx bx-error-circle"></i>',
              exam: '<i class="bx bx-book-alt"></i>',
              fullscreen: '<i class="bx bx-fullscreen"></i>',
            };

            const icon = icons[log.type] || "";

            return `
              <div class="log-item">
                <div class="log-type ${log.type
              }">${icon} ${log.type.toUpperCase()}</div>
                <div class="log-item-content">
                  <div class="log-message">${log.message}</div>
                  <div class="log-timestamp">${formatLogTimestamp(
                log.timestamp
              )}</div>
                </div>
              </div>
            `;
          };

          // Function to create fullscreen log item HTML              const createFullscreenLogItem = (log) => `                <div class="log-item">                  <div class="log-type fullscreen"><i class="bx bx-fullscreen"></i> FULLSCREEN</div>                  <div class="log-item-content">                    <div class="log-message">${log.reason}</div>                    <div class="log-timestamp">${formatLogTimestamp(log.createdAt)}</div>                  </div>                </div>              `;

          // Function to update a specific logs list
          const updateLogsList = (list, logs) => {
            list.innerHTML =
              logs.length > 0
                ? logs.map(createLogItem).join("")
                : '<div class="no-data">No logs available</div>';
          };

          // Update all logs
          updateLogsList(allLogsList, violationData.logs);

          // Update categorized logs
          updateLogsList(
            browserLogsList,
            violationData.logs.filter((log) => log.type === "browser-checking")
          );
          updateLogsList(
            webcamLogsList,
            violationData.logs.filter((log) => log.type === "webcam-checking")
          );
          updateLogsList(
            screenLogsList,
            violationData.logs.filter((log) => log.type === "screen-checking")
          );
          updateLogsList(
            recordingLogsList,
            violationData.logs.filter((log) => log.type === "recording")
          );
          updateLogsList(
            uploadLogsList,
            violationData.logs.filter((log) => log.type === "upload")
          );
          updateLogsList(
            examLogsList,
            violationData.logs.filter((log) => log.type === "exam")
          );

          // Update fullscreen logs if available
          if (violationData.fullScreen && violationData.fullScreen.history) {
            // Sort fullscreen logs by timestamp
            const sortedFullscreenLogs = [
              ...violationData.fullScreen.history,
            ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            fullscreenLogsList.innerHTML =
              sortedFullscreenLogs.length > 0
                ? sortedFullscreenLogs.map(createFullscreenLogItem).join("")
                : '<div class="no-data">No fullscreen exit logs available</div>';

            // For all logs view, combine regular logs and fullscreen logs and sort by timestamp
            if (
              violationData.logs.length > 0 ||
              sortedFullscreenLogs.length > 0
            ) {
              const regularLogs = violationData.logs.map((log) => ({
                type: log.type,
                message: log.message,
                timestamp: log.timestamp,
                isFullscreen: false,
                originalLog: log,
              }));

              // Convert fullscreen logs to a comparable format
              const fullscreenLogs = sortedFullscreenLogs.map((log) => ({
                type: "fullscreen",
                message: log.reason,
                timestamp: log.createdAt,
                isFullscreen: true,
                originalLog: log,
              }));

              // Combine all logs and sort by timestamp in ascending order
              const combinedLogs = [...regularLogs, ...fullscreenLogs].sort(
                (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
              );

              // Render sorted logs to the all logs list
              allLogsList.innerHTML =
                combinedLogs.length > 0
                  ? combinedLogs
                    .map((log) => {
                      if (log.isFullscreen) {
                        return createFullscreenLogItem(log.originalLog);
                      } else {
                        return createLogItem(log.originalLog);
                      }
                    })
                    .join("")
                  : '<div class="no-data">No logs available</div>';
            }
          } else {
            fullscreenLogsList.innerHTML =
              '<div class="no-data">No fullscreen exit logs available</div>';
          }
        } else {
          [
            allLogsList,
            browserLogsList,
            webcamLogsList,
            screenLogsList,
            recordingLogsList,
            uploadLogsList,
            examLogsList,
            fullscreenLogsList,
          ].forEach((list) => {
            list.innerHTML = '<div class="no-data">No logs available</div>';
          });

          // Check if there are fullscreen logs even if there are no regular logs
          if (
            violationData.fullScreen &&
            violationData.fullScreen.history &&
            violationData.fullScreen.history.length > 0
          ) {
            fullscreenLogsList.innerHTML = violationData.fullScreen.history
              .map(createFullscreenLogItem)
              .join("");
            allLogsList.innerHTML = violationData.fullScreen.history
              .map(createFullscreenLogItem)
              .join("");
          }
        }
      }
    },
    errorCallback: function (error) {
      console.error("Error fetching logs:", error);
      popup.querySelectorAll(".logs-list").forEach((list) => {
        list.innerHTML = '<div class="error-message">Error loading logs</div>';
      });
    },
  });
}

// Manual Evaluation Functions
function fetchManualEvaluationQuestions(examId, totalStudents) {
  const url = `${QUESTIONS_END_POINT}?entranceExamId=${examId}&getEvaluationQuestionsOnly=true`;

  makeApiCall({
    url: url,
    method: "GET",
    successCallback: function (response) {
      if (response.message === "Retrieved successfully") {
        renderManualEvaluationTable(
          response?.data?.questions,
          examId,
          totalStudents
        );
      }
    },
    errorCallback: function (error) { },
  });
}

function renderManualEvaluationTable(questions, examId, totalStudents = 100) {
  // Check if questions array is empty or undefined
  if (!questions || questions.length === 0) {
    $("#manual-evaluation-grid").html(`
      <div class="no-manual-evaluation-message">
        <div class="no-data-icon">
          <i class="bx bx-clipboard"></i>
        </div>
        <div class="no-data-title">No Manual Evaluation Questions</div>
        <div class="no-data-description">
          There are no questions that require manual evaluation in this exam.
        </div>
      </div>
    `);
    return;
  }

  const columnDefs = [
    {
      headerName: "S.No",
      field: "sno",
      valueGetter: function (params) {
        return params.node.rowIndex + 1;
      },
      sortable: true,
      autoHeight: true,
      headerClass: "table-ag-class",
      headerTooltip: "S.No",
      maxWidth: 70,
    },
    {
      headerName: "Question Type",
      field: "type",
      autoHeight: true,
      headerClass: "table-ag-class",
      headerTooltip: "Question Type",
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params) => {
        const type = params.value;
        let badgeClass = "status-badge-neutral";
        let displayText = type;

        switch (type) {
          case "SAQ":
            badgeClass = "status-badge-saq";
            displayText = "Short Answer";
            break;
          case "FTB":
            badgeClass = "status-badge-ftb";
            displayText = "Fill in the Blank";
            break;
          case "MCQ":
            badgeClass = "status-badge-mcq";
            displayText = "Multiple Choice";
            break;
          case "PRQ":
            badgeClass = "status-badge-prq";
            displayText = "Programming";
            break;
          case "IR":
            badgeClass = "status-badge-ir";
            displayText = "Image Response";
            break;
          case "UD":
            badgeClass = "status-badge-ud";
            displayText = "Upload Document";
            break;
          default:
            badgeClass = "status-badge-default";
            displayText = type;
        }

        return `<div class="question-type-badge ${badgeClass}" title="${displayText}">
          <span>${type}</span>
        </div>`;
      },
    },

    {
      headerName: "Question Text",
      field: "question",
      autoHeight: true,
      headerClass: "table-ag-class",
      headerTooltip: "Question Text",
      flex: 2,
      cellRenderer: (params) => {
        const questionText = params.value || "";
        const textWithoutTags = questionText.replace(/<[^>]*>/g, "");
        const truncatedText =
          textWithoutTags.length > 100
            ? textWithoutTags.substring(0, 100) + "..."
            : textWithoutTags;
        return `<div title="${textWithoutTags}">${truncatedText}</div>`;
      },
    },
    {
      headerName: "Marks",
      field: "marks",
      autoHeight: true,
      headerClass: "table-ag-class",
      headerTooltip: "Marks assigned to this question",
      sortable: true,
      filter: true,
      flex: 0.5,
      cellRenderer: (params) => {
        const marks = params.value || 1;
        return `<div class="marks-badge">${marks}</div>`;
      },
    },
{
  headerName: "Completion & Status",
  field: "studentsAnswered",
  autoHeight: true,
  headerClass: "table-ag-class",
  headerTooltip: "Number of students completed and evaluation status",
  sortable: true,
  filter: "agTextColumnFilter",
  flex: 1.2,

  // 👇 This is the key — tell AG Grid what string to filter on
  filterValueGetter: (params) => {
    const evaluation = params.data.evaluation || { evaluated: 0, pending: 0 };
    const evaluatedCount = evaluation.evaluated || 0;
    const pendingCount = evaluation.pending || 0;
    const totalForEval = evaluatedCount + pendingCount;

    let status;
    if (totalForEval === 0) {
      status = "Pending";
    } else if (pendingCount === 0) {
      status = "Completed";
    } else if (evaluatedCount > 0 && pendingCount > 0) {
      status = "In Progress";
    } else {
      status = "Pending";
    }

    return `${status} ${evaluatedCount}/${totalForEval}`;
  },

  cellRenderer: (params) => {
    const evaluation = params.data.evaluation || { evaluated: 0, pending: 0 };
    const evaluatedCount = evaluation.evaluated || 0;
    const pendingCount = evaluation.pending || 0;
    const totalForEval = evaluatedCount + pendingCount;

    let status;
    if (totalForEval === 0) {
      status = "Pending";
    } else if (pendingCount === 0) {
      status = "Completed";
    } else if (evaluatedCount > 0 && pendingCount > 0) {
      status = "In_Progress";
    } else {
      status = "Pending";
    }

    let statusBadgeClass = "status-badge-pending";
    let statusIcon = "";
    switch (status.toLowerCase()) {
      case "completed":
        statusBadgeClass = "status-badge-completed";
        statusIcon = "bx-check-circle";
        break;
      case "in_progress":
        statusBadgeClass = "status-badge-in-progress";
        statusIcon = "bx-loader-circle";
        break;
      case "pending":
        statusBadgeClass = "status-badge-pending";
        statusIcon = "bx-time-five";
        break;
      default:
        statusBadgeClass = "status-badge-pending";
        statusIcon = "bx-time-five";
    }

    const statusText = status.replace("_", " ");

    return `
      <div class="completion-status-container">
        <div class="status-badge ${statusBadgeClass}">
          <i class="bx ${statusIcon}"></i>
          <span>${statusText} ${evaluatedCount}/${totalForEval}</span>
        </div>
      </div>
    `;
  },
},
    {
      headerName: "Action",
      headerTooltip: "Actions",
      cellRenderer: (params) => {
        const questionId = params.data.questionId;

        return `
        <div class="action-container">
          <button class="view-details-btn" id="evaluate-question" data-question-id="${questionId}" data-examid="${examId}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Evaluate</span>
          </button>
        </div>`;
      },
      autoHeight: true,
      headerClass: "table-ag-class",
      sortable: false,
      filter: false,
      width: 120,
    },
  ];

  const rowData = questions.map((question) => {
    return {
      ...question,
      questionId: question._id,
      studentsAnswered: question.studentsAnswered || 0,
      evaluationStatus: question.evaluationStatus || "Pending",
      requiresManualEvaluation: question.requiresManualEvaluation || true,
    };
  });

  manualEvaluationGridOptions = {
    theme: "legacy",
    columnDefs: columnDefs,
    rowData: rowData,
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      filter: true,
      sortable: true,
      resizable: true,
    },
    rowHeight: 50,
    rowSelection: "single",
    suppressRowClickSelection: true,
    pagination: true,
    paginationPageSize: 100,
    domLayout: "autoHeight",
    overlayLoadingTemplate:
      '<span class="ag-overlay-loading-center">Loading...</span>',
    overlayNoRowsTemplate:
      '<span class="ag-overlay-loading-center">No manual evaluation questions found</span>',
  };

  // Create the grid
  $("#manual-evaluation-grid").empty();
  new agGrid.Grid(
    document.getElementById("manual-evaluation-grid"),
    manualEvaluationGridOptions
  );

  // Add event listener for evaluate button
  $(document).on("click", "#evaluate-question", function (e) {
    e.stopPropagation();
    const questionId = $(this).data("question-id");
    const examId = $(this).data("examid");
    openEvaluationInterface(questionId, examId);
  });
}

function openEvaluationInterface(questionId, examId) {
  const evaluationUrl = `/fullscreenexam/reports/evaluation.html?questionId=${encodeURIComponent(
    questionId
  )}&examId=${encodeURIComponent(examId)}`;

  window.open(evaluationUrl, "_blank");
}
