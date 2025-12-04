$(document).ready(function () {
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

  $("#send-invite-all-btn").click(function () {
    showLoader(true);
    let allEmails = [];
    allEmails = currentGridData.map(function (e) {
      return e.mail;
    });
    sendInviteEmails(allEmails, {
      forceRegistration: canSendEmail && canSendRegistrationMail,
      forceInvitation: canSendEmail && canSendExamMail,
    });
    gridOptions.api.deselectAll();
  });

  $("#send-invite-pending-btn").click(function () {
    showLoader(true);

    const pendingEmails = currentGridData
      .filter((item) => {
        const examPending = item.status === "P";
        const regPending = item.registrationInviteStatus === "P";
        return examPending || regPending;
      })
      .map((item) => item.mail);

    if (pendingEmails.length === 0) {
      displayToast(
        "No pending emails matching the selected toggle states",
        "error"
      );
      showLoader(false);
      return;
    }
   
    sendInviteEmails(pendingEmails, {
      forceRegistration: canSendEmail && canSendRegistrationMail,
      forceInvitation: canSendEmail && canSendExamMail,
    });
     gridOptions.api.deselectAll();
  });

  $(document).on("click", ".send-invite", function () {
    showLoader(true);
    const email = $(this).data("email");
    const type = $(this).data("type");
    const options = {};
    if (type === "registration") {
      options.forceRegistration = true;
    } else if (type === "exam") {
      options.forceInvitation = true;
    }
    sendInviteEmails([email], options);
  });

  $(document).on("click", "#send-selected-invite-btn", function () {
    showLoader(true);
    const selectedRows = gridOptions.api.getSelectedRows();
    if (selectedRows.length === 0) {
      displayToast("Please select at least one user", "error");
      showLoader(false);
      return;
    }
    const emails = selectedRows.map((row) => row.mail);
    const options = {};
    
    const emailType = $(".email-type-select").val();
    
    if (emailType === "registration") {
      options.forceRegistration = true;
    } else if (emailType === "exam") {
      options.forceInvitation = true;
    } else {
      options.forceRegistration = true;
      options.forceInvitation = true;
    }
    
    sendInviteEmails(emails, options);
    gridOptions.api.deselectAll();
  });

  $(document).on("click", "#attender-refresh-btn", function () {
    let examId = getQueryParameters("id");
    reloadAttendees(examId);
  });
});

function getQueryParameters(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function sendInviteEmails(emailIds, options = {}) {
  const entranceExamId = getQueryParameter("id");

  const sendRegistration = options.forceRegistration;
  const sendExam = options.forceInvitation;

  // Validate at least one toggle is enabled
  if (!sendRegistration && !sendExam) {
    displayToast("Please enable at least one email type to send", "error");
    showLoader(false);
    return;
  }

  // Validate email content
  const registrationContent = $("#registration-content").trumbowyg("html");
  let invitationContent = $("#invitation-content").trumbowyg("html");
  const registrationSubject = $("#registration-subject").val();
  const invitationSubject = $("#invitation-subject").val();

  // Check if any required fields are empty
  if (sendRegistration && (!registrationContent || !registrationSubject)) {
    displayToast(
      "Registration email content and subject are required",
      "error"
    );
    $("#email-template").dialog("open");
    return;
  }

  if (!isSendPasscode) {
    invitationContent = stringReplace(invitationContent);
  }

  if (sendExam && (!invitationContent || !invitationSubject)) {
    displayToast("Exam invitation content and subject are required", "error");
    $("#email-template").dialog("open");
    return;
  }

  // Get email content based on toggles
  const payload = {
    attenderIds: emailIds,
    ...(sendRegistration && { registrationContent }),
    ...(sendRegistration && { registrationSubject }),
    ...(sendExam && { invitationContent }),
    ...(sendExam && { invitationSubject }),
  };

  makeApiCall({
    url: `${EXAM_END_POINT}/mail?entranceExamId=${entranceExamId}&resendMail=true`,
    method: "POST",
    data: JSON.stringify(payload),
    successCallback: function (response) {
      displayToast(`Emails sent to ${emailIds.length} attendees!`, "success");

      const updatedRows = emailIds.map((email) => {
        const existingData = currentGridData.find(
          (item) => item.mail === email
        );
        const updates = {};

        if (sendRegistration) {
          updates.registrationInviteStatus = "Q";
        }
        if (sendExam) {
          updates.status = "Q";
        }

        return {
          ...existingData,
          ...updates,
        };
      });

      gridOptions.api.applyTransaction({ update: updatedRows });
    },
    errorCallback: function (error) {
      displayToast(`Error sending emails: ${error}`, "error");
    },
  });
}
