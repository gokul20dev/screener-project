$(document).ready(function () {

  let attendeeData = [];
  
  $("#importButton").on("click", function () {
    $("#import-attendees-modal").show();
    $("#modalOverlay").addClass("active");
    
    $("#attendeesLoadingOverlay").hide();
  });

 
  $("#download-attendees-template").on("click", function() {
    createAttendeeExcelTemplate();
  });


  $("#fileInput").on("change", function (event) {
    handleAttendeeFile(event.target.files[0]);
  });


  $("#browse-attendees-btn").on("click", function() {
    $("#hidden-attendees-input").click();
  });


  $("#hidden-attendees-input").on("change", function(event) {
    const file = event.target.files[0];
    if (file) {
      processAttendeeFile(file);
    }
  });


  const dropZone = document.getElementById("attendeesDragDropZone");
  
  ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropZone.classList.add("dragover");
  }

  function unhighlight() {
    dropZone.classList.remove("dragover");
  }

  dropZone.addEventListener("drop", handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      processAttendeeFile(files[0]);
    }
  }


  function processAttendeeFile(file) {
    if (!file) {
      return;
    }
    
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt !== 'xlsx') {
      displayToast("Please select an Excel (.xlsx) file", "error");
      return;
    }
    
    $("#attendeesLoadingOverlay").css({
      "display": "flex"
    }).removeClass("d-none");
    console.log("Loading overlay displayed");
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        console.log("File read complete, processing data");
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        if (sheet.length === 0) {
          $(".no-attendees-message").show();
          $("#attendeeCount").hide();
          $("#process-attendees-btn").prop("disabled", true);
        } else {
          $(".no-attendees-message").hide();
          $("#attendeeCount").show();
          $("#attendeeCount span").text(sheet.length);
          $("#process-attendees-btn").prop("disabled", false);
          
          attendeeData = sheet;
        }
      } catch (error) {
        console.error("Error processing file:", error);
        displayToast("Error processing file. Please ensure it's a valid Excel file.", "error");
      } finally {
        console.log("Hiding loading overlay");
        $("#attendeesLoadingOverlay").hide();
      }
    };
    
    reader.onerror = function() {
      console.error("File reader error");
      displayToast("Error reading file", "error");
      $("#attendeesLoadingOverlay").hide();
    };
    
    reader.readAsArrayBuffer(file);
  }

  $("#cancel-import-attendees-btn").on("click", function() {
    closeImportModal();
  });

  $("#process-attendees-btn").on("click", function() {
      if (!attendeeData || attendeeData.length === 0) {
      displayToast("No data to import", "error");
      return;
    }
    
    console.log("Process button clicked, showing loading overlay");
    $("#attendeesLoadingOverlay").css({
      "display": "flex"
    }).removeClass("d-none");
    
    let newAttenders = [];
    let oldAttenders = getOldEmailsFromAGGrid();
    let valid = true;
    let invalidCount = 0;
    
    let emailSet = new Set();
    let duplicateEmails = [];
    let existingEmails = [];

    if (currentGridData && currentGridData.length) {
      currentGridData.forEach(row => {
        if (row.mail) {
          emailSet.add(row.mail.toLowerCase().trim());
        }
      });
    }

    attendeeData.forEach((row, index) => {
      const email = row["Mail Id"];
      const id = row["Passcode"];
      
      if (!email || !validateEmail(email)) {
        invalidCount++;
        if (invalidCount <= 5) {
          displayToast(`Invalid email at row ${index + 1}: ${email || "missing"}`, "error");
        }
        return;
      }

      if (!id) {
        invalidCount++;
        if (invalidCount <= 5) {
          displayToast(`Missing passcode at row ${index + 1}`, "error");
        }
        return;
      }
      
      const normalizedEmail = email.toLowerCase().trim();
      
      if (currentGridData && currentGridData.some(row => row.mail?.toLowerCase().trim() === normalizedEmail)) {
        existingEmails.push(normalizedEmail);
        invalidCount++;
        return;
      }
      
      if (emailSet.has(normalizedEmail)) {
        duplicateEmails.push(normalizedEmail);
        invalidCount++;
        return;
      }
      
      emailSet.add(normalizedEmail);

      newAttenders.push({
        mail: normalizedEmail,
        id: id.toString().trim(),
        id2: id.toString().trim(),
      });
    });

    if (existingEmails.length > 0 || duplicateEmails.length > 0) {
      let message = "";
      
      if (existingEmails.length > 0) {
        message += `Following emails already exist: ${existingEmails.join(", ")}. `;
      }
      
      if (duplicateEmails.length > 0) {
        message += `Following emails are duplicated in import file: ${duplicateEmails.join(", ")}. `;
      }
      
      displayToast(message + "Please remove these emails and try again.", "error");
      $("#attendeesLoadingOverlay").hide();
      return;
    }
    
    if (invalidCount > 5) {
      displayToast(`...and ${invalidCount - 5} more errors`, "error");
    }

    if (newAttenders.length === 0) {
      displayToast("No valid attendees to import", "error");
      $("#attendeesLoadingOverlay").hide();
      console.log("Hiding loading overlay - no valid attendees");
      return;
    }

    console.log("Sending API request with", newAttenders.length, "attendees");
    const payload = {
      newAttenders: newAttenders,
      oldAttenders: oldAttenders,
    };

    let entranceExamId = getQueryParameter("id");
    makeApiCall({
      url: `${EXAM_END_POINT}/attender/import?entranceExamId=${entranceExamId}`,
      method: "POST",
      data: JSON.stringify(payload),
      successCallback: function(response) {
        console.log("API request successful");
        displayToast(`Successfully imported ${newAttenders.length} attendees`, "success");
        $('#attender-refresh-btn').click();
        closeImportModal();
      },
      errorCallback: function(error) {
        console.error("API request error:", error);
        displayToast("Error importing attendees", "error");
        console.error(error);
        $("#attendeesLoadingOverlay").hide();
        console.log("Hiding loading overlay - API error");
      },
      completeCallback: function() {
        console.log("API request complete");
        $("#attendeesLoadingOverlay").hide();
        console.log("Hiding loading overlay - API complete");
      }
    });
  });

  function closeImportModal() {
    console.log("Closing import modal");
    $("#import-attendees-modal").hide();
    $("#modalOverlay").removeClass("active");
    $(".no-attendees-message").hide();
    $("#attendeeCount").hide();
    $("#process-attendees-btn").prop("disabled", true);
    $("#hidden-attendees-input").val("");
    
    $("#attendeesLoadingOverlay").hide();
    console.log("Loading overlay hidden on modal close");
  }

  $("#modalOverlay").on("click", function() {
    closeImportModal();
  });

  function handleAttendeeFile(file) {
    if (!file) {
      displayToast("No file selected!", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];

      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      console.log(sheet, 18);
      if (sheet.length === 0) {
        displayToast("The Excel file is empty or in invalid format", "error");
        return;
      }

      let newAttenders = [];
      let oldAttenders = getOldEmailsFromAGGrid();
      let valid = true;

      sheet.forEach((row, index) => {
        const email = row["Mail Id"];
        const id = row["Passcode"];
        if (!validateEmail(email)) {
          displayToast(`Error: ${email}`, "error");
          return;
        }

        newAttenders.push({
          mail: email.toLowerCase().trim(),
          id: id.toString().trim(),
          id2: id.toString().trim(),
        });
      });

      if (valid) {
        const payload = {
          newAttenders: newAttenders,
          oldAttenders: oldAttenders,
        };

        let entranceExamId = getQueryParameter("id");
        makeApiCall({
          url:
            `${EXAM_END_POINT}/attender/import?entranceExamId=` +
            entranceExamId,
          method: "POST",
          data: JSON.stringify(payload),
          successCallback: function (response) {
            $('#attender-refresh-btn').click();
          },
          errorCallback: function (error) {
            displayToast("Error uploading data", "error");
            console.error(error);
          },
        });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function validateEmail(email) {
    if (!email) return false;
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  }

  function getOldEmailsFromAGGrid() {
    return currentGridData || [];
  }
  
  function displayToast(message, type) {
    toastr.options = {
      closeButton: true,
      progressBar: true,
      positionClass: "toast-top-right",
      timeOut: "5000",
    };
    if (type === "success") {
      toastr.success(message);
    } else if (type === "error") {
      toastr.error(message);
    }
  }

  async function createAttendeeExcelTemplate() {
    console.log("Creating attendee Excel template");
    
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Attendees");
      
      worksheet.columns = [
        { header: "Mail Id", key: "email", width: 30 },
        { header: "Passcode", key: "passcode", width: 20 }
      ];
      
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF007BFF" }
      };
      
      worksheet.addRow({ email: "student1@example.com", passcode: "12345" });
      worksheet.addRow({ email: "student2@example.com", passcode: "67890" });
      worksheet.addRow({ email: "student3@example.com", passcode: "11223" });
      const buffer = await workbook.xlsx.writeBuffer();
      
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = "attenders_template.xlsx";
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      displayToast("Template downloaded successfully", "success");
    } catch (error) {
      console.error("Error creating Excel template:", error);
      displayToast("Failed to generate template", "error");
    }
  }
});
