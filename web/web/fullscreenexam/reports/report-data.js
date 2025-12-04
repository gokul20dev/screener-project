$(document).ready(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get("examid");

  console.log("Document ready. Exam ID:", examId);

  if (examId) {
    fetchExamDetails(examId);
    fetchReportData(examId);
  } else {
    alert("Exam ID is missing in the query parameters.");
  }

  $(document).on("click", ".view-details", function () {
    const email = $(this).data("email");
    fetchStudentDetail(email, examId);
  });

  $("#export-data").click(function () {
    exportAgGridDataToExcel();
  });
});

function fetchExamDetails(examId) {
  const url = `${EXAM_END_POINT}?entranceExamId=${examId}`;

  makeApiCall({
    url: url,
    method: "GET",
    successCallback: function (response) {
      if (response.message === "Retrieved successfully") {
        const exam = response.data.exam;
        const examDetails = `
                    <h1>${exam.name}</h1> <br>
                    Start: ${formatDateTime(exam.session.start)} <br>
                    End: ${formatDateTime(exam.session.end)}
                `;
        $("#exam-details").html(examDetails);
      }
    },
    errorCallback: function (error) {
      console.error("Error fetching exam details:", error);
    },
  });
}

function fetchReportData(examId) {
  const url = `${EXAM_END_POINT}/not-evaluated-responses?canPaginate=true&entranceExamId=${examId}`;

  makeApiCall({
    url: url,
    method: "GET",

    successCallback: function (response) {
      if (response.message === "Retrieved successfully") {
        renderStudentTable(response.data.attendees, response.data.questions);
        $("#exam-details").append(
          `<br>Total Questions: ${response.data.questions.length}`
        );
      } else {
        console.error("Unexpected response:", response);
      }
    },
    errorCallback: function (error) {
      console.error("Error fetching report data:", error);
    },
  });
}

let gridOptions;
function renderStudentTable(attendees, questions) {
  // Create a mapping of question IDs to their choices
  const questionMap = questions.reduce((map, question) => {
    map[question._id] = question.choices.reduce((choiceMap, choice) => {
      choiceMap[choice.key] = choice.label;
      return choiceMap;
    }, {});
    return map;
  }, {});

  const columnDefs = [{ headerName: "Email", field: "mail" }];

  questions.forEach((question, index) => {
    columnDefs.push({
      headerName: `Q${index + 1}`,
      field: `q_${question._id}`,
      headerTooltip: stripHtmlTags(question.question),
      cellRenderer: function (params) {
        return params.value || "";
      },
    });
  });

  const rowData = attendees.map((attendee) => {
    const row = {
      mail: attendee.mail,
    };
    if (attendee.responses.length > 0) {
      attendee.responses.forEach((response) => {
        const optionLabel =
          questionMap[response.questionId]?.[response.studentResponse] ||
          "Unknown";
        const value = `(${response.studentResponse}) ${optionLabel}`;
        row[`q_${response.questionId}`] = value;
      });
    } else {
      questions.forEach((question) => {
        row[`q_${question._id}`] = "Not written the exam";
      });
    }
    return row;
  });

  console.log("Rendering student table with data:", rowData);

  gridOptions = {
    columnDefs: columnDefs,
    rowData: rowData,
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      filter: true,
      sortable: true,
      tooltipField: "headerTooltip",
    },
    rowSelection: "single",
    pagination: true,
    paginationPageSize: 20,
    overlayLoadingTemplate:
      '<span class="ag-overlay-loading-center">Loading...</span>',
    overlayNoRowsTemplate:
      '<span class="ag-overlay-loading-center">No data to display</span>',
  };

  const gridDiv = document.querySelector("#mygrid");
  new agGrid.Grid(gridDiv, gridOptions);
}

function fetchStudentDetail(email, examId) {
  const url = `${EXAM_END_POINT}/not-evaluated-responses?entranceExamId=${examId}&canPaginate=false&mail=${encodeURIComponent(
    email
  )}`;

  makeApiCall({
    url: url,
    method: "GET",
    successCallback: function (response) {
      console.log("Student detail fetched successfully:", response);
      if (response.message === "Retrieved successfully") {
        renderStudentDetail(response.data.attendees[0]);
      }
    },
    errorCallback: function (error) {
      console.error("Error fetching student detail:", error);
    },
  });
}

function renderStudentDetail(student) {
  const detailContent = `
        <h3>${student.mail}</h3>
        <p>Status: ${student.status}</p>         
        <p>Responses:</p>
        <ul>
            ${student.responses
              .map(
                (response) => `
                <li>
                    <p>Question: ${response.questionId}</p>
                    <p>Response: ${response.studentResponse}</p>
                </li>
            `
              )
              .join("")}
        </ul>
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
    },
  });
}

function formatDateTime(dateTime) {
  const date = new Date(dateTime.date);
  const hours = dateTime.hour.toString().padStart(2, "0");
  const minutes = dateTime.minute.toString().padStart(2, "0");
  const period = dateTime.format;
  return `${date.toLocaleDateString()} ${hours}:${minutes} ${period}`;
}

function stripHtmlTags(input) {
  const doc = new DOMParser().parseFromString(input, "text/html");
  return doc.body.textContent || "";
}

function exportAgGridDataToExcel() {
  const rowData = [];
  const columnDefs = gridOptions.columnDefs;
  const headers = {};

  columnDefs.forEach((colDef) => {
    if (colDef.field) {
      headers[colDef.field] = stripHtmlTags(
        colDef.headerTooltip || colDef.headerName || colDef.field
      );
    }
  });
  rowData.push(headers);

  gridOptions.api.forEachNode((node) => {
    const cleanData = {};
    Object.keys(node.data).forEach((key) => {
      cleanData[key] = stripHtmlTags(node.data[key]);
    });
    rowData.push(cleanData);
  });

  const worksheet = XLSX.utils.json_to_sheet(rowData, { skipHeader: true });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Exam_Report");
  XLSX.writeFile(workbook, "Exam_Report.xlsx");
}

function showLoader(isLoading) {
  if (isLoading) {
    $(".loader").show();
  } else {
    $(".loader").hide();
  }
}
