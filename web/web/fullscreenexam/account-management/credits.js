let creditUsageChart = null;
let transactionTypesChart = null;
let creditsData = null;
let historyData = [];
let examCalculationsData = null;
let isExamDetailsVisible = false;
let customTransactionTypes = [];
let timeUpdateInterval = null;
let actualCreditsUsed = 0;
let creditValidityInfo = null;

// Global variables
let selectedPeriod = 'month';
let currentMonth = new Date();
currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
let selectedDay = null;
let usageChart = null;
let currentData = null;
let originalData = null;


const accountAdmin = localStorage.getItem("accountAdmin");
const userRole = localStorage.getItem("role");

// Initialize credits dashboard
const initializeCreditsDashboard = () => {
  $("#credits-dashboard-container").show();

  const canAddCredits = accountAdmin === "true" || userRole === "superAdmin";

  if (canAddCredits) {
    $("#add-credits-btn").show();
  } else {
    $("#add-credits-btn").hide();
  }

  updateDashboardHeader();
  startTimeUpdater();
  initializeBootstrapTabs();

  isExamDetailsVisible = false;
  const tableContainer = $("#exam-calculations-table").closest(
    ".table-responsive"
  );
  tableContainer.hide();
  $("#toggle-exam-details").html(
    '<i class="bx bx-list-ul me-1"></i>Show Exam Details'
  );

  initializeCreditsEventListeners();
  loadCreditsData();

  setTimeout(() => {
    if (!creditValidityInfo) {
      testValidityDisplay();
    }
  }, 3000);
};

// Initialize Bootstrap tabs
const initializeBootstrapTabs = () => {
  console.log("Tabs initialized");
  $("#exam-calculation-tab").addClass("active").attr("aria-selected", "true");
  $("#history-tab")
    .removeClass("active")
    .attr("aria-selected", "false");

  $("#exam-calculation-content").addClass("show active").css("display", "block");
  $("#history-content")
    .removeClass("show active")
    .css("display", "none");
};

// Initialize event listeners
const initializeCreditsEventListeners = () => {
  const canAddCredits = accountAdmin === "true" || userRole === "superAdmin";

  $("#refresh-credits-btn")
    .off("click")
    .on("click", () => {
      loadCreditsData();
    });

  if (canAddCredits) {
    $("#add-credits-btn")
      .off("click")
      .on("click", () => {
        openAddCreditsModal();
      });

    $("#add-credits-form")
      .off("submit")
      .on("submit", (e) => {
        handleAddCreditsSubmit(e);
      });
  }

  $("#transaction-type-filter")
    .off("change")
    .on("change", (e) => {
      filterTransactionHistory(e.target.value);
    });

  $("#history-search")
    .off("input")
    .on("input", (e) => {
      searchTransactionHistory(e.target.value);
    });

  $("#exam-search")
    .off("input")
    .on("input", (e) => {
      searchExamCalculations(e.target.value);
    });

  $("#toggle-exam-details")
    .off("click")
    .on("click", () => {
      toggleExamDetails();
    });

  $("#apply-date-filter")
    .off("click")
    .on("click", () => {
      applyDateFilter();
    });

  $("#today-exam-details").off("click").on("click", function () {
    currentDateFilter()
  });

  $("#clear-date-filter")
    .off("click")
    .on("click", () => {
      clearDateFilter();
    });

  $("#exam-start-date-filter")
    .off("change")
    .on("change", (e) => {
      validateDateRange();
    });

  $("#exam-end-date-filter")
    .off("change")
    .on("change", (e) => {
      validateDateRange();
    });

  if (canAddCredits) {
    $("#credit-type")
      .off("change")
      .on("change", (e) => {
        handleTransactionTypeChange(e.target.value);
      });

    $("#credit-attachment")
      .off("change")
      .on("change", (e) => {
        const file = e.target.files[0];
        const fileInput = $(e.target).closest(".credits-file-input");
        const fileText = fileInput.find(".file-upload-text div").first();

        if (file) {
          fileText.text(`Selected: ${file.name}`);
          fileInput.addClass("file-selected");
        } else {
          fileText.text("Click to upload file");
          fileInput.removeClass("file-selected");
        }
      });

    $("#add-credits-popup")
      .off("click")
      .on("click", (e) => {
        if (e.target === e.currentTarget) {
          closeAddCreditsModal();
        }
      });

    $(".credits-pop-inside")
      .off("click")
      .on("click", (e) => {
        e.stopPropagation();
      });
  }

  $('#creditsTabs a[data-bs-toggle="tab"]')
    .off("shown.bs.tab")
    .on("shown.bs.tab", function (e) {
      const target = $(e.target).attr("href");

      if (target === "#exam-calculation-content") {
        if (!examCalculationsData) {
          loadExamCalculations();
        }
      }
    });

  $("#history-tab").on("click", (e) => {
    e.preventDefault();
    $("#history-content").removeClass("d-none").addClass("show active");
    $("#exam-calculation-content").removeClass("show active").addClass("d-none");
    $("#history-tab").addClass("active").attr("aria-selected", "true");
    $("#exam-calculation-tab").removeClass("active").attr("aria-selected", "false");
  });

  $("#exam-calculation-tab").on("click", (e) => {
    e.preventDefault();
    $("#exam-calculation-content").removeClass("d-none").addClass("show active");
    $("#history-content").removeClass("show active").addClass("d-none");
    $("#exam-calculation-tab").addClass("active").attr("aria-selected", "true");
    $("#history-tab").removeClass("active").attr("aria-selected", "false");

    if (!examCalculationsData) {
      loadExamCalculations();
    }
  });

  $(document).on("click", ".total-participants-info", function () {
    const attendees = JSON.parse($(this).attr("data-attendees-detail"));
    const examId = $(this).attr("data-entrance-exam-id");
    reloadAttendees(examId);


  });

  // Close modal on overlay or button
  $(document).on("click", ".close-modal, .custom-modal-overlay", function () {
    $("#attendeesModal").fadeOut(200);
  });


};

// Load all credits data
const loadCreditsData = () => {
  showLoading();

  const promises = [
    getCreditsStatistics().catch((error) => {
      console.error("Statistics failed:", error);
      return null;
    }),
    getCreditHistory().catch((error) => {
      console.error("History failed:", error);
      return null;
    }),
    getCreditsInfo().catch((error) => {
      console.error("Credits info failed:", error);
      return null;
    }),
    // Add exam calculations to get actual used credits
    loadExamCalculations().catch((error) => {
      console.error("Exam calculations failed:", error);
      return null;
    }),
  ];

  Promise.allSettled(promises)
    .then((results) => {
      hideLoading();

      const hasAnySuccess = results.some(
        (result) => result.status === "fulfilled" && result.value !== null
      );

      if (hasAnySuccess) {
        updateDashboard();

        if (creditsData) {
          updateStatisticsCards(creditsData);
          updateCharts(creditsData);
        }
      } else {
        showCreditsErrorMessage(
          "Failed to load credits data. Please check your connection and try again."
        );
      }
    })
    .catch((error) => {
      hideLoading();
      showCreditsErrorMessage("Failed to load credits data");
    });
};

// API Calls
const getCreditsInfo = () => {
  return new Promise((resolve, reject) => {
    makeApiCall({
      url: CREDIT_END_POINT,
      method: "GET",
      successCallback: (response) => {
        const responseData = response.data?.data || response.data || {};
        creditsData = responseData;

        const startDate = responseData.startDate || creditsData.startDate;
        const endDate = responseData.endDate || creditsData.endDate;

        if (startDate && endDate) {
          creditValidityInfo = {
            startDate: startDate,
            endDate: endDate,
          };
          updateValidityDisplay();
        }

        resolve(response.data);
      },
      errorCallback: (error) => {
        showCreditsErrorMessage("Failed to load credits information");
        reject(error);
      },
    });
  });
};

const getCreditsStatistics = () => {
  return new Promise((resolve, reject) => {
    makeApiCall({
      url: `${CREDIT_END_POINT}/statistics`,
      method: "GET",
      successCallback: (response) => {
        const statisticsData = response.data || response || {};

        creditsData = statisticsData;

        resolve(statisticsData);
      },
      errorCallback: (error) => {
        updateStatisticsCards({});
        updateCharts({});

        reject(error);
      },
    });
  });
};

const getCreditHistory = (type = "") => {
  return new Promise((resolve, reject) => {
    const url = type
      ? `${CREDIT_END_POINT}/history?type=${type}`
      : `${CREDIT_END_POINT}/history`;
    makeApiCall({
      url: url,
      method: "GET",
      successCallback: (response) => {
        let responseData = response.data || response || [];

        if (Array.isArray(responseData)) {
          historyData = responseData;
        } else if (
          responseData.history &&
          Array.isArray(responseData.history)
        ) {
          historyData = responseData.history;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          historyData = responseData.data;
        } else {
          historyData = [];
        }

        updateTransactionHistoryTable(historyData);

        if (!type && historyData.length > 0) {
          updateTransactionTypeFilter(historyData);
        }

        if (creditsData) {
          updateStatisticsCards(creditsData);
        }

        resolve(historyData);
      },
      errorCallback: (error) => {
        historyData = [];
        updateTransactionHistoryTable([]);

        if (creditsData) {
          updateStatisticsCards(creditsData);
        }

        reject(error);
      },
    });
  });
};


function reloadAttendees(examId) {
  const endpointUrl = `${EXAM_END_POINT}/attender?canPaginate=false&isRemoved=true&showAdditionalFields=true&entranceExamId=${examId}`;

  makeApiCall({
    url: endpointUrl,
    method: "GET",
    successCallback: function (response) {
      if (response.data && response.data.data) {
        console.log(response.data.data);
        openAttendeesModal(response.data.data);
      } else {
      }
    },
    errorCallback: function (error) {
      actualCreditsUsed = 0;

      if (creditsData) {
        updateStatisticsCards(creditsData);
        updateCharts(creditsData);
      }

      showCreditsErrorMessage("Failed to load exam calculations");
      reject(error);
    },
  });
}


const loadExamCalculations = (
  isExamDetails = false,
  startDate = null,
  endDate = null
) => {
  return new Promise((resolve, reject) => {
    let queryParams = [];

    if (isExamDetails) {
      queryParams.push("isExamDetails=true");
    }

    if (startDate) {
      queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
    }

    if (endDate) {
      queryParams.push(`endDate=${encodeURIComponent(endDate)}`);
    }

    const queryString =
      queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
    const url = `${CREDIT_END_POINT}/exams-calculation${queryString}`;

    makeApiCall({
      url: url,
      method: "GET",
      successCallback: (response) => {
        processData(response);

        examCalculationsData = response.data;

        const responseData = response.data || {};
        const innerData = responseData.data || {};

        let creditSummary = null;

        if (isExamDetails) {
          creditSummary = innerData.summary?.creditSummary || {};
        } else {
          creditSummary = innerData.creditSummary || {};
        }

        actualCreditsUsed = creditSummary.totalCreditsRequired || 0;

        if (isExamDetails && innerData.exams) {
          updateExamCalculationsTable(response.data);
        }

        updateExamSummaryCards(response.data);

        if (creditsData) {
          updateStatisticsCards(creditsData);
          updateCharts(creditsData);
        }

        resolve(response.data);
      },
      errorCallback: (error) => {
        actualCreditsUsed = 0;

        if (creditsData) {
          updateStatisticsCards(creditsData);
          updateCharts(creditsData);
        }

        showCreditsErrorMessage("Failed to load exam calculations");
        reject(error);
      },
    });
  });
};

const updateStatisticsCards = (data) => {
  const safeData = data || {};

  const totalTransactions =
    safeData.totalTransactions || (historyData ? historyData.length : 0);

  $("#total-credits").text(formatNumber(safeData.totalPurchased || 0));

  $("#total-credits").text(formatNumber(safeData.totalPurchased || 0));
  $("#total-transactions").text(formatNumber(totalTransactions));
  $("#credits-used").text(formatNumber(actualCreditsUsed || 0));
  $("#last-updated").text(
    formatCreditDate(safeData.lastUpdated || new Date().toISOString())
  );
};

const updateCharts = (data) => {
  const safeData = data || {};
  updateCreditUsageChart(safeData);
  updateTransactionTypesChart(safeData);
};

const updateCreditUsageChart = (data) => {
  const ctx = document.getElementById("creditUsageChart");
  if (!ctx) return;

  if (creditUsageChart) {
    creditUsageChart.destroy();
  }

  const safeData = data || {};
  const totalPurchased = safeData.totalPurchased || 0;
  const creditsUsed = actualCreditsUsed || 0;
  const creditsRemaining = Math.max(0, totalPurchased - creditsUsed);

  const hasData = totalPurchased > 0 || creditsUsed > 0;
  const chartData = hasData ? [creditsUsed, creditsRemaining] : [0, 1000];

  const chartLabels = hasData
    ? ["Credits Used", "Credits Remaining"]
    : ["No Data", "Sample Available"];

  const usagePercentage =
    totalPurchased > 0 ? (creditsUsed / totalPurchased) * 100 : 0;

  const usedColor = "#ef4444";
  const remainingColor = "#22c55e";

  const cutoutPercentage = hasData && creditsUsed > 0 ? "60%" : "70%";

  creditUsageChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: chartLabels,
      datasets: [
        {
          data: chartData,
          backgroundColor: [usedColor, remainingColor],
          borderWidth: [3, 2],
          borderColor: ["#dc2626", "#ffffff"],
          hoverBackgroundColor: ["#dc2626", "#16a34a"],
          hoverBorderWidth: [4, 3],
          hoverBorderColor: ["#b91c1c", "#ffffff"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
        },
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 15,
            usePointStyle: true,
            pointStyle: "circle",
            font: {
              size: 11,
              weight: "500",
            },
            boxWidth: 12,
            boxHeight: 12,
            borderWidth: 0,
            generateLabels: function (chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const dataset = data.datasets[0];
                  return {
                    text: label,
                    fillStyle: dataset.backgroundColor[i],
                    strokeStyle: "transparent",
                    lineWidth: 0,
                    pointStyle: "circle",
                    hidden: false,
                    index: i,
                  };
                });
              }
              return [];
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "white",
          bodyColor: "white",
          borderColor: "#3b82f6",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage =
                total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${formatNumber(
                value
              )} (${percentage}%)`;
            },
            afterBody: function () {
              if (hasData) {
                return [
                  `Total Purchased: ${formatNumber(totalPurchased)}`,
                  `Usage Rate: ${usagePercentage.toFixed(1)}%`,
                ];
              }
              return [];
            },
          },
        },
      },
      cutout: cutoutPercentage,
      elements: {
        arc: {
          borderRadius: hasData && creditsUsed > 0 ? 4 : 2,
        },
      },
    },
  });
};

const updateTransactionTypesChart = (data) => {
  const ctx = document.getElementById("transactionTypesChart");
  if (!ctx) return;

  if (transactionTypesChart) {
    transactionTypesChart.destroy();
  }

  const safeData = data || {};
  let transactionTypes = {};

  if (safeData.transactionsByType) {
    transactionTypes = safeData.transactionsByType;
  } else if (historyData && historyData.length > 0) {
    transactionTypes = historyData.reduce((acc, transaction) => {
      const type = transaction.type;
      if (!acc[type]) {
        acc[type] = { totalAmount: 0, count: 0 };
      }
      acc[type].totalAmount += transaction.purchased || 0;
      acc[type].count += 1;
      return acc;
    }, {});
  }

  let labels = Object.keys(transactionTypes);
  let values = labels.map((type) => transactionTypes[type]?.totalAmount || 0);

  if (labels.length === 0) {
    labels = ["Purchase", "Renewal"];
    values = [0, 0];
  }

  const formattedLabels = labels.map((label) =>
    formatTransactionTypeName(label)
  );

  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#ec4899",
    "#6366f1",
  ];

  transactionTypesChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: formattedLabels,
      datasets: [
        {
          label: "Credits Amount",
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderRadius: 8,
          borderSkipped: false,
          borderWidth: 0,
          barThickness: 60,
          maxBarThickness: 80,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "white",
          bodyColor: "white",
          borderColor: "#3b82f6",
          borderWidth: 1,
          callbacks: {
            label: function (context) {
              const type = labels[context.dataIndex];
              const typeInfo = transactionTypes[type];
              const count = typeInfo?.count || 0;
              return [
                `Credits: ${formatNumber(context.parsed.y)}`,
                `Transactions: ${count}`,
              ];
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "#f1f5f9",
          },
          ticks: {
            callback: function (value) {
              return formatNumber(value);
            },
          },
        },
        x: {
          grid: {
            display: false,
          },
          categoryPercentage: 0.8,
          barPercentage: 0.9,
        },
      },
    },
  });
};

const updateTransactionHistoryTable = (data) => {
  const tbody = document.getElementById("credits-history-tbody");
  if (!tbody) return;

  const canManageTransactions =
    accountAdmin === "true" || userRole === "superAdmin";

  // Update table headers
  const thead = document.querySelector("#credits-history-table thead tr");
  if (thead) {
    const headers = [
      "Date",
      "Type",
      "Credits",
      "Description",
      "Invoice",
      "Issued By",
      "Attachments",
    ];

    if (canManageTransactions) {
      headers.push("Actions");
    }

    thead.innerHTML = headers.map((header) => `<th>${header}</th>`).join("");
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${canManageTransactions ? 8 : 7}" class="text-center py-4">
          <div class="empty-state">
            <i class="bx bx-receipt bx-lg text-muted"></i>
            <p class="text-muted">No transaction history found</p>
            <small class="text-muted">Transactions will appear here once you add credits</small>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data
    .map((transaction) => {
      if (!transaction || typeof transaction !== "object") {
        return "";
      }

      const date = formatCreditsDate(transaction.createdAt);
      const typeBadge = getTypeBadge(transaction.type || "unknown");
      const amount = `
        <div class="amount-display">
          <i class="bx bx-coin"></i>
          <span class="amount-value">${(
          transaction.purchased || 0
        ).toLocaleString()}</span>
        </div>
      `;
      const description = transaction.description || "-";
      const invoice = transaction.invoiceNumber
        ? `<span class="invoice-number">${transaction.invoiceNumber}</span>`
        : "-";
      const issuedBy = transaction.issuedBy
        ? `<span class="issued-by-name">${transaction.issuedBy}</span>`
        : "-";
      const attachments = transaction.attachments?.length
        ? transaction.attachments
          .map(
            (att) =>
              `<a href="#" 
                    class="attachment-link" 
                    onclick="handleAttachmentClick(event, '${transaction._id
              }', '${att.fileName || "File"}')"
                    title="${att.alt || "Download attachment"}">${att.fileName || att.alt || "File"
              }</a>`
          )
          .join(", ")
        : '<span class="no-attachments">No attachments</span>';

      let actionColumn = "";
      if (canManageTransactions) {
        actionColumn = transaction.isRemoved
          ? '<span class="text-muted" style="font-size: 0.8rem;">Deleted</span>'
          : `<button 
               class="btn btn-outline-danger btn-sm" 
               onclick="openDeleteTransactionModal('${transaction._id || ""}')" 
               title="Delete Transaction"
               style="padding: 4px 8px; font-size: 0.75rem;">
               <i class="bx bx-trash"></i>
             </button>`;
      }

      let rowHtml = `
        <tr>
          <td>${date}</td>
          <td>${typeBadge}</td>
          <td>${amount}</td>
          <td>${description}</td>
          <td>${invoice}</td>
          <td>${issuedBy}</td>
          <td>${attachments}</td>`;

      if (canManageTransactions) {
        rowHtml += `<td>${actionColumn}</td>`;
      }

      rowHtml += `</tr>`;

      return rowHtml;
    })
    .filter((row) => row !== "")
    .join("");
};

const getTransactionTypeBadgeClass = (type) => {
  const typeMap = {
    purchase: "purchase",
    renewal: "renewal",
    bonus: "bonus",
    promotion: "bonus",
    credit: "bonus",
  };

  return typeMap[type.toLowerCase()] || "custom";
};

const getTransactionTypeIcon = (type) => {
  const iconMap = {
    purchase: "bx-shopping-bag",
    renewal: "bx-refresh",
    bonus: "bx-gift",
    promotion: "bx-star",
    credit: "bx-coin",
  };

  return iconMap[type.toLowerCase()] || "bx-tag";
};

const formatTransactionTypeName = (type) => {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

const openAttachment = (url) => {
  if (url && url !== "#") {
    window.open(url, "_blank");
  } else {
    showCreditsErrorMessage("Attachment URL not available");
  }
}


const openAttendeesModal = (attendees) => {
  console.log(attendees);
  const attendeesHtml = attendees.map((item, i) => `
    <div class="attendee-item">
      <strong>${i + 1}. ${item.mail}</strong> 
      <strong>${item.id}</strong>
    </div>
  `).join("");

  if ($("#attendeesModal").length === 0) {
    $("body").append(`
      <div id="attendeesModal" class="custom-modal">
        <div class="custom-modal-overlay"></div>
        <div class="custom-modal-content">
          <div class="custom-modal-header">
            <h5>Attendees</h5>
            <button class="close-modal">&times;</button>
          </div>
          <div class="custom-modal-body"></div>
        </div>
      </div>
    `);
  }

  $("#attendeesModal .custom-modal-body").html(attendeesHtml);
  $("#attendeesModal").fadeIn(200);
}


const updateExamCalculationsTable = (data) => {
  const tbody = $("#exam-calculations-tbody");
  tbody.empty();

  const responseData = data.data || data;
  const exams = responseData.exams || [];

  if (exams.length === 0) {
    tbody.append(`
      <tr>
        <td colspan="7" class="text-center py-4">
          <div class="empty-state">
            <i class="bx bx-calculator" style="font-size: 48px; color: #ccc; margin-bottom: 10px;"></i>
            <p class="text-muted mb-0">No exam data found</p>
            <small class="text-muted">Exam calculations will appear here once exams are created</small>
          </div>
        </td>
      </tr>
    `);
    return;
  }

  exams.forEach((exam, index) => {
    const formattedStatus = exam.examStatus
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    let statusClass = exam.examStatus.toLowerCase().replace(/[_\s]/g, "-");

    if (statusClass === "on-going") {
      statusClass = "ongoing";
    } else if (statusClass === "not-started") {
      statusClass = "notstarted";
    }
    const attendees_data = [
      { attendees_name: "Yogesh", attendees_email: "yogesh@gmail.com" },
      { attendees_name: "Ananya", attendees_email: "ananya@example.com" },
      { attendees_name: "Rahul", attendees_email: "rahul123@example.com" },
      { attendees_name: "Meera", attendees_email: "meera.k@example.com" },
      { attendees_name: "Arjun", attendees_email: "arjun.dev@example.com" }
    ];
    const totalAttenders = exam.totalAttenders;
    const totalCreditsForExam =
      exam.creditCalculation?.totalCreditsForExam || 0;
    const creditsPerExam = exam.creditCalculation?.creditsPerExam || 0;

    const efficiency =
      totalAttenders > 0 ? Math.round(totalCreditsForExam / totalAttenders) : 0;

    tbody.append(`
      <tr>
        <td>
          <div class="d-flex flex-column">
            <strong>${exam.name}</strong>
            <small class="text-muted">ID: ${exam._id || "N/A"}</small>
          </div>
        </td>
        <td>
          <span class="status-badge ${statusClass}">${formattedStatus}</span>
        </td>
        <td>
          <div class="d-flex align-items-center">
            <i class="bx bx-time me-1 text-primary"></i>
            <span>${exam.duration} min</span>
          </div>
           <small class="text-muted">${exam.duration <= 20 ? "Mock Exam" : ""}</small>
        </td>
        <td>
          <div class="d-flex flex-column">
            <strong>
  ${formatNumber(totalAttenders)}
  <button 
    data-attendees-detail='${JSON.stringify(attendees_data)}' data-entrance-exam-id='${exam._id}'
    class="total-participants-info btn btn-sm btn-link">
    <i class="fas fa-info-circle"></i>
  </button>
</strong>
            <small class="text-muted">Total participants</small>
          </div>
        </td>
        <td>
          <div class="d-flex align-items-center">
            <i class="bx bx-coin me-1 text-warning"></i>
            <span>${formatNumber(creditsPerExam)}</span>
          </div>
        </td>
        <td>
          <div class="d-flex flex-column">
            <strong class="text-primary">${formatNumber(
      totalCreditsForExam
    )}</strong>
            <small class="text-muted">${efficiency} per participant</small>
          </div>
        </td>
        <td>
          <div class="d-flex flex-column">
            <span>${formatCreditDate(exam.createdAt)}</span>
            <small class="text-muted">${formatTime(exam.createdAt)}</small>
          </div>
        </td>
      </tr>
    `);
  });
};

const updateExamSummaryCards = (data) => {
  const responseData = data.data || data;

  let summary, creditSummary;

  if (responseData.summary) {
    summary = responseData.summary;
    creditSummary = summary.creditSummary || {};
  } else {
    summary = responseData;
    creditSummary = responseData.creditSummary || {};
  }

  const breakdown = creditSummary.breakdown || {};

  $("#total-exams-count").text(summary.totalExams || 0);
  $("#total-attenders-count").text(summary.totalAttenders || 0);
  $("#total-credits-required").text(creditSummary.totalCreditsRequired || 0);
  $("#avg-credits-per-exam").text(
    creditSummary.averageCreditsPerExam || "0.00"
  );
  $("#short-exams-count").text(breakdown.shortExams?.count || 0);
  $("#long-exams-count").text(breakdown.longExams?.count || 0);
};

const filterTransactionHistory = (type) => {
  getCreditHistory(type);
};

const searchTransactionHistory = (searchTerm) => {
  if (!Array.isArray(historyData)) {
    updateTransactionHistoryTable([]);
    return;
  }

  const filteredData = historyData.filter((transaction) => {
    if (!transaction || typeof transaction !== "object") {
      return false;
    }

    const searchLower = searchTerm.toLowerCase();
    return (
      (transaction.description || "").toLowerCase().includes(searchLower) ||
      (transaction.invoiceNumber || "").toLowerCase().includes(searchLower) ||
      (transaction.type || "").toLowerCase().includes(searchLower) ||
      (transaction.issuedBy || "").toLowerCase().includes(searchLower)
    );
  });
  updateTransactionHistoryTable(filteredData);
};

const searchExamCalculations = (searchTerm) => {
  if (!examCalculationsData?.data?.exams) return;

  const filteredExams = examCalculationsData.data.exams.filter((exam) => {
    return (
      exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.examStatus.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredData = {
    data: {
      exams: filteredExams,
      summary: examCalculationsData.data.summary,
    },
  };

  updateExamCalculationsTable(filteredData);
};

const toggleExamDetails = () => {
  isExamDetailsVisible = !isExamDetailsVisible;
  const button = $("#toggle-exam-details");
  const tableContainer = $("#exam-calculations-table").closest(
    ".table-responsive"
  );
  const filtersContainer = $("#exam-filters-container");

  if (isExamDetailsVisible) {
    button.html('<i class="bx bx-list-ul me-1"></i>Hide Exam Details');
    tableContainer.show();

    filtersContainer.show();
    setTimeout(() => {
      filtersContainer.addClass("show");
    }, 50);

    const startDate = $("#exam-start-date-filter").val();
    const endDate = $("#exam-end-date-filter").val();

    loadExamCalculations(true, startDate || null, endDate || null)
      .then(() => {
        if (creditsData) {
          updateStatisticsCards(creditsData);
          updateCharts(creditsData);
        }
      })
      .catch((error) => {
        console.error("Error loading exam details:", error);
      });
  } else {
    button.html('<i class="bx bx-list-ul me-1"></i>Show Exam Details');
    tableContainer.hide();

    filtersContainer.removeClass("show");
    setTimeout(() => {
      filtersContainer.hide();
    }, 400);
  }
};


const currentDateFilter = () => {
  const $btn = $("#today-exam-details");
  const isActive = $btn.hasClass("btn-primary"); // check current state

  if (isActive) {
    // 🔹 Toggle OFF (remove filter)
    $btn.removeClass("btn-primary").addClass("btn-outline-secondary");
    $btn.html('<i class="bx bx-calendar me-1"></i>Today');

    // Call loadExamCalculations with no filter (or reset params)
    loadExamCalculations(isExamDetailsVisible, null).catch((error) => {
      console.error("Error removing date filter:", error);
      showCreditsErrorMessage("Failed to remove date filter");
    });
  } else {
    // 🔹 Toggle ON (apply today filter)
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];

    loadExamCalculations(isExamDetailsVisible, startDate || null)
      .then(() => {
        $btn.removeClass("btn-outline-secondary").addClass("btn-primary");
        $btn.html('<i class="bx bx-check me-1"></i>Today');
      })
      .catch((error) => {
        console.error("Error applying date filter:", error);
        showCreditsErrorMessage("Failed to apply date filter");
      });
  }
}


const applyDateFilter = () => {
  let startDate = $("#exam-start-date-filter").val();
  let endDate = $("#exam-end-date-filter").val();
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    showCreditsErrorMessage("Start date cannot be after end date");
    return;
  }

    if (endDate) {
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);
    endDate = end.toISOString().split("T")[0]; // format back to YYYY-MM-DD
  }

  const isExamDetails = isExamDetailsVisible;
  loadExamCalculations(isExamDetails, startDate || null, endDate || null)
    .then(() => {
      const applyButton = $("#apply-date-filter");
      if (startDate || endDate) {
        applyButton.removeClass("btn-outline-primary").addClass("btn-primary");
        applyButton.html('<i class="bx bx-check me-1"></i>Filtered');
      }
    })
    .catch((error) => {
      console.error("Error applying date filter:", error);
      showCreditsErrorMessage("Failed to apply date filter");
    });
};

const clearDateFilter = () => {
  $("#exam-start-date-filter").val("");
  $("#exam-end-date-filter").val("");
  // ✅ Only disable today filter if it's active
  const $btn = $("#today-exam-details");
  if ($btn.hasClass("btn-primary")) {
    currentDateFilter(); 
  }

  const applyButton = $("#apply-date-filter");
  applyButton.removeClass("btn-primary").addClass("btn-outline-primary");
  applyButton.html('<i class="bx bx-filter me-1"></i>Filter');

  const isExamDetails = isExamDetailsVisible;
  loadExamCalculations(isExamDetails, null, null)
    .then(() => { })
    .catch((error) => {
      showCreditsErrorMessage("Failed to clear date filter");
    });
};

const validateDateRange = () => {
  const startDate = $("#exam-start-date-filter").val();
  const endDate = $("#exam-end-date-filter").val();
  const applyButton = $("#apply-date-filter");

  if (startDate && endDate) {
    if (new Date(startDate) > new Date(endDate)) {
      applyButton.prop("disabled", true);
      $("#exam-end-date-filter").css("border-color", "#ef4444");
      return false;
    } else {
      applyButton.prop("disabled", false);
      $("#exam-end-date-filter").css("border-color", "#e2e8f0");
      return true;
    }
  } else {
    applyButton.prop("disabled", false);
    $("#exam-end-date-filter").css("border-color", "#e2e8f0");
    return true;
  }
};

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num);
};

const formatCreditDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
  });
};

const showLoading = () => {
  $(".stats-content h4").html('<div class="loading-spinner"></div>');
};

const hideLoading = () => {
  $(".loading-spinner").remove();
};

const showCreditsErrorMessage = (message) => {
  const $message = $("#api-success");
  $message.find(".error-message").text(message);
  $message.css({
    transform: "translateY(0px)",
    backgroundColor: "#ff6b6b",
    color: "white",
  });
  setTimeout(() => {
    $message.css({
      transform: "translateY(-500px)",
    });
  }, 3000);
};

const updateDashboard = () => {
  updateDashboardHeader();
};

const startTimeUpdater = () => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
  }

  timeUpdateInterval = setInterval(() => {
    updateDashboardHeader();
  }, 1000);
};

const updateDashboardHeader = () => {
  const now = new Date();
  const timeString = now.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });

  $(".current-time").text(timeString);
};

const openAddCreditsModal = () => {
  const canAddCredits = accountAdmin === "true" || userRole === "superAdmin";

  if (!canAddCredits) {
    showCreditsErrorMessage(
      "You don't have permission to add credits. Only account administrators can perform this action."
    );
    return;
  }

  $("#add-credits-popup").addClass("visible");
  resetAddCreditsForm();

  if (historyData && historyData.length > 0) {
    updateTransactionTypeOptions();
  }

  setTimeout(() => {
    $("#credit-type").focus();
  }, 200);
};

const closeAddCreditsModal = () => {
  $("#add-credits-popup").removeClass("visible");
  setTimeout(() => {
    resetAddCreditsForm();
  }, 200);
};

const resetAddCreditsForm = () => {
  $("#add-credits-form")[0].reset();
  $("#credit-error").removeClass("show");
  $("#custom-type-container").removeClass("show");
  $("#custom-type-input").attr("required", false);

  $("#credit-start-date").val("").off("change");
  $("#credit-end-date").val("").removeAttr("min");

  $("#credit-amount").val("");
  $("#credit-invoice").val("");
  $("#credit-issued-by").val("");
  $("#credit-description").val("");

  const fileInput = $(".credits-file-input");
  const fileText = fileInput.find(".file-upload-text div").first();
  fileText.text("Click to upload file");
  fileInput.removeClass("file-selected");

  const submitBtn = $("#submit-credits-btn");
  submitBtn
    .prop("disabled", false)
    .removeClass("credits-btn-loading")
    .html('<i class="bx bx-plus"></i>Add Credits');
};

const handleAddCreditsSubmit = (e) => {
  e.preventDefault();

  let type = $("#credit-type").val();
  const amount = parseInt($("#credit-amount").val());
  const description = $("#credit-description").val().trim();
  const invoiceNumber = $("#credit-invoice").val().trim();
  const issuedBy = $("#credit-issued-by").val().trim();
  const startDate = $("#credit-start-date").val();
  const endDate = $("#credit-end-date").val();
  const attachmentFile = $("#credit-attachment")[0].files[0];
  const customTypeInput = $("#custom-type-input").val().trim();

  if (type === "custom") {
    if (!customTypeInput) {
      showCreditError("Please enter a custom transaction type name.");
      return;
    }
    type = addCustomTransactionType(customTypeInput);
  }

  if (!type) {
    showCreditError("Please select a transaction type.");
    return;
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    showCreditError("Please enter a valid credit amount greater than 0.");
    return;
  }

  if (amount > 1000000) {
    showCreditError("Credit amount cannot exceed 1,000,000.");
    return;
  }

  if (!issuedBy || issuedBy.trim() === "") {
    showCreditError("Please enter who issued the credits.");
    return;
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      showCreditError("End date must be after start date.");
      return;
    }
  }

  const submitBtn = $("#submit-credits-btn");
  submitBtn
    .prop("disabled", true)
    .addClass("credits-btn-loading")
    .html("Processing...");

  $("#credit-error").removeClass("show");

  if (attachmentFile) {
    const accountId = getUserAccountId() || "unknown";

    const timestamp = Date.now();
    const fileExtension = attachmentFile.name.split(".").pop();
    const baseFileName = attachmentFile.name.split(".").slice(0, -1).join(".");
    const newFileName = `${baseFileName}_${timestamp}.${fileExtension}`;

    const modifiedFile = new File([attachmentFile], newFileName, {
      type: attachmentFile.type,
      lastModified: attachmentFile.lastModified,
    });

    const attachmentFileObj = {
      file: modifiedFile,
    };

    uploadFileForQuestion(accountId, attachmentFileObj, newFileName)
      .then((uploadResult) => {
        const fileUrl = uploadResult.url.split("?")[0];

        submitCreditData(
          type,
          amount,
          description,
          invoiceNumber,
          issuedBy,
          startDate,
          endDate,
          fileUrl,
          newFileName
        );
      })
      .catch((error) => {
        console.error("File upload failed:", error);
        showCreditError("Failed to upload attachment: " + error);
        resetSubmitButton();
      });
  } else {
    submitCreditData(
      type,
      amount,
      description,
      invoiceNumber,
      issuedBy,
      startDate,
      endDate,
      null,
      null
    );
  }
};

const submitCreditData = (
  type,
  amount,
  description,
  invoiceNumber,
  issuedBy,
  startDate,
  endDate,
  fileUrl,
  fileName
) => {
  const creditData = {
    type: type,
    purchased: amount,
  };

  if (description) {
    creditData.description = description;
  }

  if (invoiceNumber) {
    creditData.invoiceNumber = invoiceNumber;
  }

  if (issuedBy) {
    creditData.issuedBy = issuedBy;
  }

  if (startDate) {
    creditData.startDate = new Date(startDate).toISOString();
  }

  if (endDate) {
    creditData.endDate = new Date(endDate).toISOString();
  }

  if (fileUrl && fileName) {
    const fileExtension = fileName.split(".").pop().toLowerCase();

    creditData.attachments = [
      {
        fileName: fileName.split(".")[0],
        fileType: fileExtension,
      },
    ];
  }

  submitNewCredit(creditData);
};

const getUserAccountId = () => {
  if (window.selectedClientData && window.selectedClientData.accountId) {
    return window.selectedClientData.accountId;
  }

  if (window.userData && window.userData.accountId) {
    return window.userData.accountId;
  }

  const storedAccountId =
    localStorage.getItem("accountId") || sessionStorage.getItem("accountId");
  if (storedAccountId) {
    return storedAccountId;
  }

  return "default-account";
};

const resetSubmitButton = () => {
  const submitBtn = $("#submit-credits-btn");
  submitBtn
    .prop("disabled", false)
    .removeClass("credits-btn-loading")
    .html('<i class="bx bx-plus"></i>Add Credits');
};

const handleTransactionTypeChange = (selectedType) => {
  const customContainer = $("#custom-type-container");
  const customInput = $("#custom-type-input");

  if (selectedType === "custom") {
    customContainer.addClass("show");
    customInput.attr("required", true);
    setTimeout(() => {
      customInput.focus();
    }, 300);
  } else {
    customContainer.removeClass("show");
    customInput.attr("required", false);
    customInput.val("");
  }
};

const getAllTransactionTypes = () => {
  const defaultTypes = ["purchase", "renewal"];
  return [...defaultTypes, ...customTransactionTypes];
};

const addCustomTransactionType = (typeName) => {
  const normalizedType = typeName.toLowerCase().replace(/\s+/g, "_");

  if (!customTransactionTypes.includes(normalizedType)) {
    customTransactionTypes.push(normalizedType);
    updateTransactionTypeOptions();
    return normalizedType;
  }
  return normalizedType;
};

const updateTransactionTypeOptions = () => {
  const modalSelect = $("#credit-type");

  const customOption = modalSelect.find('option[value="custom"]');
  modalSelect.find('option[value!=""][value!="custom"]').remove();

  const allTypes = getAllTransactionTypes();
  allTypes.forEach((type) => {
    const formattedType = formatTransactionTypeName(type);
    modalSelect.append(`<option value="${type}">${formattedType}</option>`);
  });

  customOption.appendTo(modalSelect);
};

const updateTransactionTypeFilter = (data) => {
  const filterSelect = $("#transaction-type-filter");
  const currentValue = filterSelect.val();

  const uniqueTypes = [
    ...new Set(
      data
        .filter((transaction) => transaction && transaction.type)
        .map((transaction) => transaction.type)
    ),
  ];

  uniqueTypes.forEach((type) => {
    if (!getAllTransactionTypes().includes(type)) {
      customTransactionTypes.push(type);
    }
  });

  filterSelect.find("option:not(:first)").remove();

  uniqueTypes.forEach((type) => {
    const formattedType = formatTransactionTypeName(type);
    filterSelect.append(`<option value="${type}">${formattedType}</option>`);
  });

  if (currentValue && uniqueTypes.includes(currentValue)) {
    filterSelect.val(currentValue);
  }
};

const cleanupCreditsDashboard = () => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
    timeUpdateInterval = null;
  }

  creditsData = null;
  historyData = null;
  examCalculationsData = null;
  actualCreditsUsed = 0;
  creditValidityInfo = null;

  if (window.creditUsageChart) {
    window.creditUsageChart.destroy();
    window.creditUsageChart = null;
  }
  if (window.transactionTypesChart) {
    window.transactionTypesChart.destroy();
    window.transactionTypesChart = null;
  }

  const validityInfoElement = document.getElementById("validity-info");
  if (validityInfoElement) {
    validityInfoElement.style.display = "none";
  }
};

$(document).ready(() => {
  $("#add-credits-form").on("submit", handleAddCreditsSubmit);

  $(window).on("beforeunload", () => {
    cleanupCreditsDashboard();
  });
});

const updateValidityDisplay = () => {
  const validityInfoElement = document.getElementById("validity-info");
  const validityTextElement = document.getElementById("validity-text");
  const validityDatesElement = document.getElementById("validity-dates");

  const startDate = new Date(creditValidityInfo.startDate);
  const endDate = new Date(creditValidityInfo.endDate);
  const now = new Date();

  const startDateStr = startDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const endDateStr = endDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  let statusText = "";
  let statusClass = "";

  if (now < startDate) {
    statusText = "Pending";
    statusClass = "pending";
  } else if (now > endDate) {
    statusText = "Expired";
    statusClass = "expired";
  } else {
    const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 7) {
      statusText = "Expiring Soon";
      statusClass = "expiring-soon";
    } else {
      statusText = "Active";
      statusClass = "active";
    }
  }

  validityTextElement.textContent = `Credit Validity: ${statusText}`;
  validityDatesElement.textContent = `${startDateStr} - ${endDateStr}`;

  validityInfoElement.className = `validity-info ${statusClass}`;
  validityInfoElement.style.display = "flex";
};

const testValidityDisplay = () => {
  creditValidityInfo = {
    startDate: "2024-01-01T00:00:00.000Z",
    endDate: "2024-12-31T23:59:59.000Z",
  };

  updateValidityDisplay();
};

const formatCreditsDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTypeBadge = (type) => {
  const badgeClass = getTransactionTypeBadgeClass(type);
  const typeIcon = getTransactionTypeIcon(type);
  const formattedType = formatTransactionTypeName(type);

  return `
    <span class="type-badge ${badgeClass}">
      <i class="bx ${typeIcon}"></i>
      ${formattedType}
    </span>
  `;
};

let currentTransactionToDelete = null;

const openDeleteTransactionModal = (transactionId) => {
  currentTransactionToDelete = transactionId;
  $("#delete-reason").val("");
  $("#delete-error").addClass("d-none");
  $("#delete-transaction-popup").addClass("visible");
};

const closeDeleteTransactionModal = () => {
  currentTransactionToDelete = null;
  $("#delete-reason").val("");
  $("#delete-error").addClass("d-none");
  $("#delete-transaction-popup").removeClass("visible");
};

const deleteTransaction = async () => {
  const reason = $("#delete-reason").val().trim();

  if (!reason) {
    $("#delete-error")
      .removeClass("d-none")
      .text("Please enter a valid deletion reason.");
    $("#delete-reason").focus();
    return;
  }

  if (reason.length < 10) {
    $("#delete-error")
      .removeClass("d-none")
      .text("Deletion reason must be at least 10 characters long.");
    $("#delete-reason").focus();
    return;
  }

  if (!currentTransactionToDelete) {
    $("#delete-error")
      .removeClass("d-none")
      .text("Invalid transaction selected for deletion.");
    return;
  }

  try {
    const deleteBtn = $("#confirm-delete-transaction");
    deleteBtn
      .prop("disabled", true)
      .html('<i class="bx bx-loader-alt bx-spin me-1"></i>Deleting...');

    const response = await new Promise((resolve, reject) => {
      makeApiCall({
        url: `${CREDIT_END_POINT}`,
        method: "DELETE",
        data: JSON.stringify({
          id: currentTransactionToDelete,
          deletedReason: reason,
        }),
        successCallback: (response) => {
          resolve(response);
        },
        errorCallback: (error) => {
          reject(error);
        },
      });
    });

    closeDeleteTransactionModal();

    showErrorMessage("Transaction deleted successfully!", "#22c55e");

    await loadCreditsData();
  } catch (error) {
    let errorMessage = "Failed to delete transaction. Please try again.";

    if (error.responseJSON?.message) {
      errorMessage = error.responseJSON.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    $("#delete-error").removeClass("d-none").text(errorMessage);
  } finally {
    $("#confirm-delete-transaction")
      .prop("disabled", false)
      .html('<i class="bx bx-trash me-1"></i>Delete Transaction');
  }
};

$(document).ready(() => {
  $("#cancel-delete-transaction").on("click", closeDeleteTransactionModal);

  $("#confirm-delete-transaction").on("click", deleteTransaction);

  $("#delete-reason").on("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      deleteTransaction();
    }
  });

  $("#delete-reason").on("input", () => {
    $("#delete-error").addClass("d-none");
    const currentLength = $("#delete-reason").val().length;
    $("#char-count").text(currentLength);

    const counter = $("#char-count").parent();
    if (currentLength > 450) {
      counter.css("color", "#ef4444");
    } else if (currentLength > 400) {
      counter.css("color", "#f59e0b");
    } else {
      counter.css("color", "#6b7280");
    }
  });

  $("#delete-transaction-popup").on("click", (e) => {
    if (e.target === e.currentTarget) {
      closeDeleteTransactionModal();
    }
  });

  $("#delete-transaction-popup .pop-inside").on("click", (e) => {
    e.stopPropagation();
  });
});

const submitNewCredit = (creditData) => {
  makeApiCall({
    url: `${CREDIT_END_POINT}`,
    method: "POST",
    data: JSON.stringify(creditData),
    successCallback: (response) => {
      resetSubmitButton();

      closeAddCreditsModal();
      showErrorMessage(
        response.message || "Credits added successfully!",
        "#22c55e"
      );

      loadCreditsData();
    },
    errorCallback: (error) => {
      resetSubmitButton();

      let errorMessage = "Failed to add credits. Please try again.";

      if (error.responseJSON) {
        errorMessage = error.responseJSON.message || errorMessage;
      } else if (error.responseText) {
        try {
          const errorData = JSON.parse(error.responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = error.responseText || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      showCreditError(errorMessage);
    },
  });
};

const showCreditError = (message) => {
  const errorDiv = $("#credit-error");
  const errorText = errorDiv.find(".error-text");

  errorText.text(message);
  errorDiv.addClass("show");

  setTimeout(() => {
    errorDiv[0].scrollIntoView({ behavior: "smooth", block: "center" });
  }, 100);
};

const getAttachmentSignedUrl = async (transactionId) => {
  try {
    const response = await new Promise((resolve, reject) => {
      makeApiCall({
        url: `${CREDIT_END_POINT}/attachment?id=${transactionId}`,
        method: "GET",
        successCallback: (response) => {
          resolve(response);
        },
        errorCallback: (error) => {
          reject(error);
        },
      });
    });

    if (response?.data?.attachments?.[0]?.url) {
      return response.data.attachments[0].url;
    }
    throw new Error("No attachment URL found");
  } catch (error) {
    console.error("Error getting attachment URL:", error);
    showCreditsErrorMessage("Failed to get attachment URL");
    return null;
  }
};

const handleAttachmentClick = async (event, transactionId, attachmentName) => {
  event.preventDefault();

  try {
    const signedUrl = await getAttachmentSignedUrl(transactionId);
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    }
  } catch (error) {
    console.error("Error opening attachment:", error);
    showCreditsErrorMessage("Failed to open attachment");
  }
};






// Process original data to create mock data structure
function processData(apiResponse) {
  console.log("API Response:", apiResponse); // Debug log
  const exams = apiResponse.data?.data?.exams || [];
  const summary = apiResponse.data?.data?.summary || {};

  // Filter exams based on selected period
  const filteredExams = filterExamsByPeriod(exams, selectedPeriod);

  // Group exams by date
  const examsByDate = {};
  exams.forEach(exam => {
    const date = exam.session.start.date.split('T')[0];
    if (!examsByDate[date]) {
      examsByDate[date] = [];
    }
    examsByDate[date].push(exam);
  });

  // Create calendar data
  const calendarData = {};
  Object.keys(examsByDate).forEach(date => {
    const dayExams = examsByDate[date];
    const totalParticipants = dayExams.reduce((sum, exam) => sum + exam.totalAttenders, 0);
    const examCount = dayExams.length;

    calendarData[date] = {
      exams: examCount,
      participants: totalParticipants,
      intensity: Math.min(Math.floor(examCount / 2) + 1, 5),
      assessments: dayExams.map(exam => ({
        id: exam._id,
        name: exam.name,
        participants: exam.totalAttenders,
        duration: `${exam.duration} min`,
        status: exam.examStatus.toLowerCase().replace('_', ' ')
      }))
    };
  });

  // Calculate completion rate (ENDED + ON_GOING) / total
  const endedExams = filteredExams.filter(exam => exam.examStatus === 'ENDED').length;
  const onGoingExams = filteredExams.filter(exam => exam.examStatus === 'ON_GOING').length;
  const completionRate = filteredExams.length > 0 ? Math.round(((endedExams + onGoingExams) / filteredExams.length) * 100) : 0;

  // Calculate average duration
  const totalDuration = filteredExams.reduce((sum, exam) => sum + exam.duration, 0);
  const avgDuration = filteredExams.length > 0 ? Math.round(totalDuration / filteredExams.length) : 0;
  const avgDurationStr = `${avgDuration} min`;

  // Find peak hour (most exams in an hour)
  const hourCounts = {};
  filteredExams.forEach(exam => {
    const hour = exam.session.start.hour;
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  let peakHour = 'N/A';
  let maxCount = 0;
  Object.keys(hourCounts).forEach(hour => {
    if (hourCounts[hour] > maxCount) {
      maxCount = hourCounts[hour];
      peakHour = `${hour}:00 PM`;
    }
  });

  // Create chart data based on period
  let chartData = [];
  switch (selectedPeriod) {
    case 'today':
      chartData = generateHourlyChartData(examsByDate);
      break;
    case 'week':
      chartData = generateDailyChartData(examsByDate);
      break;
    case 'month':
      chartData = generateWeeklyChartData(examsByDate);
      break;
    case 'year':
      chartData = generateMonthlyChartData(examsByDate);
      break;
    case 'custom':
      chartData = generateCustomRangeChartData(examsByDate);
      break;
    default:
      chartData = generateWeeklyChartData(examsByDate);
  }

  // Calculate summary stats based on filtered data
  const totalExams = filteredExams.length;
  const totalParticipants = filteredExams.reduce((sum, exam) => sum + exam.totalAttenders, 0);
  const avgParticipantsPerExam = totalExams > 0 ? (totalParticipants / totalExams).toFixed(1) : "0";

  return {
    stats: {
      exams: totalExams,
      participants: totalParticipants,
      completionRate: completionRate,
      avgTime: avgDurationStr
    },
    details: {
      activeExams: onGoingExams,
      completedExams: endedExams,
      avgParticipantsPerExam: avgParticipantsPerExam,
      peakHour: peakHour,
      growthRate: '+12%'
    },
    chartData: chartData,
    calendarData: calendarData
  };
}

// Filter exams by period
function filterExamsByPeriod(exams, period) {
  // debugger
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'week':
      const dayOfWeek = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - dayOfWeek), 23, 59, 59);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case 'custom':
      const customStartDate = $('#start-date').val();
      const customEndDate = $('#end-date').val();
      if (customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999); // End of day
      } else {
        return exams; // No filter if dates not set
      }
      break;
    default:
      return exams;
  }

  return exams.filter(exam => {
    const examDate = new Date(exam.session.start.date);
    return examDate >= startDate && examDate <= endDate;
  });
}

// Generate hourly chart data
function generateHourlyChartData(examsByDate) {
  const todayStr = new Date().toISOString().split('T')[0]; // e.g., "2025-09-30"
  const dayExams = examsByDate[todayStr] || [];

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return hours.map(hour => {
    const examsAtHour = dayExams.filter(exam => {
      const examHour = new Date(exam.session.start.date).getHours();
      return examHour === hour;
    });

    return {
      time: `${hour}:00`,
      exams: examsAtHour.length,
      participants: examsAtHour.reduce((sum, exam) => sum + exam.totalAttenders, 0)
    };
  }).filter(item => item.exams > 0 || item.participants > 0);
}

// Generate daily chart data
function generateDailyChartData(examsByDate) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Always anchor to *this week's Sunday*
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - dayOfWeek);

  return days.map((day, index) => {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + index);
    const dateStr = currentDate.toISOString().split('T')[0];

    const dayExams = examsByDate[dateStr] || [];
    const exams = dayExams.length || 0;  // force 0
    const participants = dayExams.reduce((sum, exam) => sum + exam.totalAttenders, 0) || 0;

    return {
      day: day,
      exams: exams,
      participants: participants
    };
  });
}


// Generate weekly chart data
function generateWeeklyChartData(examsByDate) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  // ✅ total days in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks = [];
  let weekIndex = 1;

for (let day = 1; day <= daysInMonth; day += 7) {
  const weekStart = new Date(year, month, day);
  weekStart.setHours(0, 0, 0, 0); // start of day

  const weekEndDay = Math.min(day + 6, daysInMonth);
  const weekEnd = new Date(year, month, weekEndDay);
  weekEnd.setHours(23, 59, 59, 999); // end of day

  let weekExams = 0;
  let weekParticipants = 0;

  Object.keys(examsByDate).forEach(date => {
    const examDate = new Date(date);
    if (examDate >= weekStart && examDate <= weekEnd) {
      weekExams += examsByDate[date].length;
      weekParticipants += examsByDate[date].reduce(
        (sum, exam) => sum + exam.totalAttenders,
        0
      );
    }
  });

  weeks.push({
    week: `Week ${weekIndex} (${formatDate(new Date(weekStart))} – ${formatDate(weekEnd)})`,
    exams: weekExams,
    participants: weekParticipants
  });

  weekIndex++;
}


  return weeks;
}


// Generate monthly chart data
function generateMonthlyChartData(examsByDate) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const year = now.getFullYear();

  return months.map((month, index) => {
    let monthExams = 0;
    let monthParticipants = 0;

    Object.keys(examsByDate).forEach(date => {
      const examDate = new Date(date);
      if (examDate.getMonth() === index && examDate.getFullYear() === year) {
        monthExams += examsByDate[date].length;
        monthParticipants += examsByDate[date].reduce((sum, exam) => sum + exam.totalAttenders, 0);
      }
    });

    return {
      month: month,
      exams: monthExams,
      participants: monthParticipants
    };
  });
}

// Generate custom range chart data
function generateCustomRangeChartData(examsByDate) {
  const startDateStr = $('#start-date').val();
  const endDateStr = $('#end-date').val();
  if (!startDateStr || !endDateStr) return [];

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const result = [];

  // Helper: convert date to local YYYY-MM-DD
  const toLocalDateStr = (date) => date.toLocaleDateString('en-CA');


  const sumExams = (datesArray) => {
    let exams = 0, participants = 0;
    datesArray.forEach(date => {
      const dateStr = toLocalDateStr(date);
      const dayExams = examsByDate[dateStr] || [];
      exams += dayExams.length;
      participants += dayExams.reduce((sum, e) => sum + e.totalAttenders, 0);
    });
    return { exams, participants };
  };

  if (durationDays <= 30) {
    // Day-wise
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const { exams, participants } = sumExams([new Date(d)]);
      result.push({ date: formatDate(d), exams, participants });
    }
  } else if (durationDays <= 90) {
    // Weekly
    let weekStart = new Date(start);
    while (weekStart <= end) {
      let weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > end) weekEnd = new Date(end);

      const { exams, participants } = sumExams([ ...Array(Math.ceil((weekEnd-weekStart)/(1000*60*60*24)+1))
        .keys()
      ].map(i => { const d = new Date(weekStart); d.setDate(d.getDate()+i); return d;} ));

      result.push({
        date:`${formatDate(weekStart)} - ${formatDate(weekEnd)}`,
        exams,
        participants
      });

      weekStart.setDate(weekStart.getDate() + 7);
    }
  }  else if (durationDays <= 365) {
    // Monthly
    let monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    while (monthStart <= end) {
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0); // last day of month
      const effectiveEnd = monthEnd > end ? new Date(end) : monthEnd;

      const datesInMonth = [];
      for (let d = new Date(monthStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
        datesInMonth.push(new Date(d));
      }

      const { exams, participants } = sumExams(datesInMonth);
      result.push({
        date: formatMonth(monthStart),
        exams,
        participants
      });

      monthStart.setMonth(monthStart.getMonth() + 1);
    }
  } else if (durationDays <= 365 * 3) {
    // Quarterly
    let quarterStart = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);
    while (quarterStart <= end) {
      const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
      const effectiveEnd = quarterEnd > end ? new Date(end) : quarterEnd;

      const datesInQuarter = [];
      for (let d = new Date(quarterStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
        datesInQuarter.push(new Date(d));
      }

      const { exams, participants } = sumExams(datesInQuarter);
      result.push({
        date: `Q${Math.floor(quarterStart.getMonth() / 3) + 1} ${quarterStart.getFullYear()}`,
        exams,
        participants
      });

      quarterStart.setMonth(quarterStart.getMonth() + 3);
    }
  } else {
    // Yearly
    let yearStart = new Date(start.getFullYear(), 0, 1);
    while (yearStart <= end) {
      const yearEnd = new Date(yearStart.getFullYear(), 11, 31);
      const effectiveEnd = yearEnd > end ? new Date(end) : yearEnd;

      const datesInYear = [];
      for (let d = new Date(yearStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
        datesInYear.push(new Date(d));
      }

      const { exams, participants } = sumExams(datesInYear);
      result.push({
        date: `${yearStart.getFullYear()}`,
        exams,
        participants
      });

      yearStart.setFullYear(yearStart.getFullYear() + 1);
    }
  }

  return result;
}

  function formatDate (date) {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }); // e.g., 15 Jul
};

function formatMonth (date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); // e.g., Jul 2025
};

$(document).ready(function () {
  $('#current-date').text(new Date().toLocaleDateString());

  // Load dashboard exam data immediately
  fetchExamData()
    .then((response) => {
      originalData = response;
      currentData = processData(response);

      updateMetrics();
      initializeChart();
      renderCalendar();
      bindEventHandlers();
    })
    .catch((err) => {
      console.error("❌ Dashboard exams failed to load:", err);
      alert("Could not load dashboard exam data");
    });
});

// New lightweight API call
const fetchExamData = (startDate = null, endDate = null) => {
  return new Promise((resolve, reject) => {
    let queryParams = [];

    // Always fetch exam details
    queryParams.push("isExamDetails=true");

    if (startDate) {
      queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
    }

    if (endDate) {
      queryParams.push(`endDate=${encodeURIComponent(endDate)}`);
    }

    const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
    const url = `${CREDIT_END_POINT}/exams-calculation${queryString}`;

    makeApiCall({
      url,
      method: "GET",
      successCallback: (response) => resolve(response),
      errorCallback: (error) => reject(error),
    });
  });
};
// Bind event handlers
function bindEventHandlers() {
  // Period selector buttons
  $('.period-button').on('click', function () {
    const period = $(this).data('period');
    if (period) {
      selectedPeriod = period;
      updatePeriodSelector();

      // For custom range, don't fetch new data immediately
      if (period !== 'custom') {
        currentData = processData(originalData);
        updateMetrics();
        updateChart();
        updateReportPeriod();
      }
    }
  });

  // Custom range button
 $('#custom-range-button').on('click', function (e) {
 e.stopPropagation()
  const container = $('#custom-range-container');
  if (container.hasClass('is-hidden')) {
    container.removeClass('is-hidden').addClass('is-visible');
  } else {
    container.removeClass('is-visible').addClass('is-hidden');
  }
});

$('#period-selector').on('click',function () {
  const container = $('#custom-range-container');
   if (container.hasClass('is-visible')) {
    container.removeClass('is-visible').addClass('is-hidden');
  }
})


  // Apply range button
  $('#apply-range').on('click', function () {
      console.log("Updating period seldsvdfsvffvector to:", selectedPeriod);
    const startDate = $('#start-date').val();
    const endDate = $('#end-date').val(); 
    if (startDate && endDate) {
      selectedPeriod = 'custom';
      updatePeriodSelector();
      $('#custom-range-container').addClass('is-hidden').removeClass('is-visible');
      $('#report-period').text('Custom Range');
      currentData = processData(originalData);
      updateMetrics();
      updateChart();
    }
  });

          // Update period selector UI
// Update period selector UI
function updatePeriodSelector() {

  if (selectedPeriod === 'month') {
    $('#calendar-view').show();
    renderCalendar();
  } else {
    $('#calendar-view').hide();
  }

  $('.period-button').removeClass('is-active');
  if (selectedPeriod !== 'custom') {
    $(`.period-button[data-period="${selectedPeriod}"]`).addClass('is-active');
  } else {
    console.log("hfui erifhi fuhewoiuh ")
    $('#custom-range-button').addClass('is-active');
  }
}

  // Calendar navigation
  $('#prev-month').on('click', function () {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    currentData = processData(originalData);
    renderCalendar();
  });

  $('#next-month').on('click', function () {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    currentData = processData(originalData);
    renderCalendar();
  });

  $('#today-button').on('click', function () {
    currentMonth = new Date();
    renderCalendar();
  });

  // Side panel
  $('#close-side-panel').on('click', function (e) {
    e.stopPropagation();
    closeSidePanel();
  });

  $('#panel-overlay').on('click', function () {
    closeSidePanel();
  });

  // $('#side-panel-backdrop').on('click', function(e) {
  //     if (e.target === this) {
  //         closeSidePanel();
  //     }
  // });

  // Prevent closing when clicking inside the panel
  $('#side-panel').on('click', function (e) {
    e.stopPropagation();
  });
}


// Update report period text
function updateReportPeriod() {
  const periodText = selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1);
  $('#report-period').text(periodText);
}

// Update metrics
function updateMetrics() {
  const container = $('#metrics-container');
  container.empty();
  console.log(currentData.stats.exams.toLocaleString())
  console.log(currentData.stats.exams)
  container.append(`
  <div class="metric-card">
  <div class="metric-header">
    <div>
      <p class="metric-title">Total Assessments</p>
      <p class="metric-value metric-value-indigo">
        ${currentData.stats.exams.toLocaleString()}
      </p>
    </div>
    <div class="metric-icon-box metric-icon-indigo">
      <i class="fas fa-file-alt fa-2x"></i>
    </div>
  </div>
</div>

<div class="metric-card">
  <div class="metric-header">
    <div>
      <p class="metric-title">Total Participants</p>
      <p class="metric-value metric-value-emerald">
        ${currentData.stats.participants.toLocaleString()}
      </p>
    </div>
    <div class="metric-icon-box metric-icon-emerald">
      <i class="fas fa-users fa-2x"></i>
    </div>
  </div>
  <div class="metric-footer">
    <p>
      Avg. per assessment:
      <span class="metric-highlight">${currentData.details.avgParticipantsPerExam}</span>
    </p>
  </div>
</div>
              
            `);
}

// Initialize chart
function initializeChart() {
  const ctx = document.getElementById('usage-chart').getContext('2d');
  usageChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Assessments',
        data: [],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: '#6366f1',
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#4f46e5',
        fill: true,
        tension: 0.4
      }, {
        label: 'Participants',
        data: [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: '#10b981',
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#059669',
        fill: true,
        tension: 0.4
      }]
    },
options: {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#6b7280' }
    },
    y: {
      grid: { color: '#f0f0f0', drawBorder: false },
      ticks: {
        color: '#6b7280',
        callback: (val) => `${val}%` // show % scale
      }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'white',
      titleColor: '#1f2937',
      bodyColor: '#374151',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      cornerRadius: 12,
      callbacks: {
        label: function(context) {
          const datasetIndex = context.datasetIndex;
          const index = context.dataIndex;

          // Original values
          const exams = currentData.chartData.map(item => item.exams);
          const participants = currentData.chartData.map(item => item.participants);

          let label = context.dataset.label;
          let originalValue, percentage;

          if (datasetIndex === 0) { // Assessments
            originalValue = exams[index];
            percentage = context.raw;
            return [
              `${label}`,
              `Count: ${originalValue}`,
              `Percentage: ${percentage.toFixed(1)}%`
            ];
          } else { // Participants
            originalValue = participants[index];
            percentage = context.raw;
            return [
              `${label}`,
              `Count: ${originalValue}`,
              `Percentage: ${percentage.toFixed(1)}%`
            ];
          }
        }
      }
    }
  }
}

  });

  updateChart();
}

// Update chart
// Update chart
function updateChart() {
  let xAxisKey;

  switch (selectedPeriod) {
    case 'today':
      xAxisKey = 'time';
      $('#chart-title').text('Hourly Usage Trend');
      break;
    case 'week':
      xAxisKey = 'day';
      $('#chart-title').text('Daily Usage Trend');
      break;
    case 'month':
      xAxisKey = 'week';
      $('#chart-title').text('Weekly Usage Trend');
      break;
    case 'year':
      xAxisKey = 'month';
      $('#chart-title').text('Monthly Usage Trend');
      break;
    case 'custom':
      xAxisKey = 'date';
      $('#chart-title').text('Custom Range Usage Trend');
      break;
    default:
      xAxisKey = 'time';
      $('#chart-title').text('Usage Trend');
  }

  const exams = currentData.chartData.map(item => item.exams);
  const participants = currentData.chartData.map(item => item.participants);

  // Compute max only for the current dataset
  const globalMax = Math.max(...exams, ...participants) || 1;

  usageChart.data.labels = currentData.chartData.map(item => item[xAxisKey]);

  usageChart.data.datasets[0].data = exams.map(v => (v / globalMax) * 100);
  usageChart.data.datasets[1].data = participants.map(v => (v / globalMax) * 100);

  usageChart.options.scales.y = {
    beginAtZero: true,
    title: {
      display: true,
      text: "Percentage (%)"
    }
  };
usageChart.update();

}


// Render calendar
function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Update month/year display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  $('#current-month-year').text(`${monthNames[month]} ${year}`);

  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  // Days from previous month to show
  const startDayOfWeek = firstDay.getDay();

  // Current day
const currentDay = formatDateLocal(new Date());



  const days = [];

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    days.push({
      date: new Date(year, month - 1, day),
      day,
      isCurrentMonth: true,
      data: null
    });
  }

  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({
      date: new Date(year, month, i),
      day: i,
      isCurrentMonth: true,
      data: currentData.calendarData[dateStr] || null
    });
  }

  // Next month days
  const totalCells = 42; // 6 weeks
  const remainingDays = totalCells - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      day: i,
      isCurrentMonth: false,
      data: null
    });
  }

  // Render days
  const container = $('#calendar-days');
  container.empty();

  days.forEach((day, index) => {
    const dayColorClass = getDayColorClass(day.data);
    const tooltip = getDayTooltip(day);
    const getCurrentDay = formatDateLocal(new Date(day.date));

const dayElement = $(`
  <div class="calendar-day ${day.data ? "calendar-day-hasdata" : ""} ${day.isCurrentMonth && getCurrentDay === currentDay?"calender-day-today":""} ${day.isCurrentMonth ? 'calendar-day-current' : 'calendar-day-other'} ${dayColorClass}" 
       title="${tooltip}" data-date="${day.date.toISOString()}" data-day-index="${index}">
    <div class="calendar-day-number">${day.day}</div>
  </div>
`);

if (day.data) {
  dayElement.append(`
    <div class="calendar-day-content">
      <div class="calendar-day-row">
        <i class="far fa-file-lines calendar-day-icon"></i>
        <span class="calendar-day-value">${day.data.exams}</span>
      </div>
      <div class="calendar-day-row">
        <i class="fas fa-users calendar-person-icon"></i>
        <span class="calendar-day-value">${day.data.participants}</span>
      </div>
      <div class="calendar-progress">
        <div class="calendar-progress-bar" 
             style="width: ${Math.min((day.data.exams / 10) * 100, 100)}%"></div>
      </div>
    </div>
  `);
}

    container.append(dayElement);
  });

  updateMonthlyTotals()

  // Bind click events to calendar days
  $('.calendar-day').on('click', function () {
    const dateStr = $(this).data('date');
    const dayIndex = $(this).data('day-index');
    const day = days[dayIndex];

    if (day.data && day.isCurrentMonth) {
      openSidePanel(day);
    }
  });
}

function updateMonthlyTotals() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-based

  let totalAssessments = 0;
  let totalParticipants = 0;

  // Loop through all available data
  for (const date in currentData.calendarData) {
    const entry = currentData.calendarData[date];
    if (entry) {
      const entryDate = new Date(date);

      // Count only entries in the currently displayed month and year
      if (entryDate.getFullYear() === year && entryDate.getMonth() === month) {
        totalAssessments += entry.exams || 0;
        totalParticipants += entry.participants || 0;
      }
    }
  }

  // Update UI
  $('#total-assessments').text(totalAssessments);
  $('#total-participants').text(totalParticipants);
}


//get today date
function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Get day color class
function getDayColorClass(data) {
  if (!data) return 'day-empty';

  const exams = data.exams;
  if (exams === 0) return 'day-empty';
  if (exams >= 1 && exams <= 5) return 'day-low';
  if (exams > 5) return 'day-high';

  return 'day-empty';
}

// Get day tooltip
function getDayTooltip(day) {
  if (!day.data) return 'No assessments';
  return `Date: ${day.date.toLocaleDateString()}\nAssessments: ${day.data.exams}\nParticipants: ${day.data.participants}`;
}

// Open side panel
function openSidePanel(day) {
  selectedDay = day;
  const data = day.data;
  const formattedDate = day.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  $('#side-panel-date').text(formattedDate);
  $('#side-panel-exams').text(data.exams);
  $('#side-panel-participants').text(data.participants);

  // Populate assessments
  const assessmentsContainer = $('#assessments-list');
  assessmentsContainer.empty();

if (data.assessments) {
  data.assessments.forEach(assessment => {
    const statusClass = assessment.status.includes('ended')
      ? 'status-ended'
      : assessment.status.includes('on going')
        ? 'status-ongoing'
        : 'status-default';

    assessmentsContainer.append(`
      <div class="assessment-card">
        <div class="assessment-header">
          <div>
            <h4 class="assessment-title">${assessment.name}</h4>
            <div class="assessment-meta">
              <i class="fas fa-users meta-icon"></i>
              <span>${assessment.participants} participants</span>
              <i class="fas fa-clock meta-icon clock"></i>
              <span>${assessment.duration}</span>
            </div>
          </div>
          <span class="assessment-status ${statusClass}">
            ${capitalizeFirstLetter(assessment.status)}
          </span>
        </div>
      </div>
    `);
  });
}


// Open side panel
  $('#panel-overlay').addClass('open-panel-overlay');
  $('#side-panel-backdrop').addClass('openside-panel-backdrop')
  $('#side-panel').addClass('open-side-panel');
}

const capitalizeFirstLetter = (val) => (typeof val === 'string' ? val.charAt(0).toUpperCase() + val.slice(1) : val);


// Close side panel
function closeSidePanel() {
  $('#panel-overlay').removeClass('open-panel-overlay');
  $('#side-panel-backdrop').removeClass('openside-panel-backdrop');
  $('#side-panel').removeClass('open-side-panel');
  selectedDay = null;
}


