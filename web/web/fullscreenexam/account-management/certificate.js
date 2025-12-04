let previewCanvas;
let rawCanvasJSON;
let certificateTemplates = [];


$(document).ready(function () {
  certificateController.renderCourseTabs(allClients);
  // 1. Initialize canvas globally
  const canvas = new fabric.Canvas("canvas", {
    backgroundColor: "#fff",
    selection: true,
  });
});

const certificateController = {
  init() {
    certificateUI.setupCetificateTabcontent();
    this.loadCertificateData(false);
  },
  renderCourseTabs(allClients) {
    const isEnabled = allClients.some(
      (client) => client.settings?.features?.enableCertificateCreation
    );

    const source = $("#course-tabs-template").html();
    const template = Handlebars.compile(source);
    const html = template({ enableCertificateCreation: isEnabled });
    $("#tabs-container").html(html);

    // Tab click logic
    $(".course-grade-tab").on("click", function () {
      const target = $(this).data("target");
      $(".course-grade-tab").removeClass("active");
      $(this).addClass("active");
      $(".course-grade-content").hide();
      $(target).show();
    });

    $(".course-grade-tab.active").trigger("click");
  },
  // loadCertificateTemplates get data from API and render it
  loadCertificateData(withCertificate = false) {
    showLoader(true);

    if (!accountId) {
      displayToast("Please login to view your certificates", "error");
      showLoader(false);
      return;
    }

    certificateServices.getCertificateData(withCertificate,
      (response) => {
        certificateTemplates = response.data || [];
        certificateUI.renderAllCertificates(certificateTemplates);
        showLoader(false);
      },
      (error) => {
        console.error("Error loading Certificates:", error);
        showLoader(false);
      });
  }
};

const certificateUI = {
  // ✅ Setup certificate tab content and render all certificates
  setupCetificateTabcontent() {
    $("#certificate-content-direct").html(`
      <div class="certificate-management-header">
        
          <div class="d-flex align-items-center gap-3 ms-auto">
            <button id="create_cert" class="add-course-button">
              <i class="bx bx-plus-circle"></i> Create Certificate
            </button>
          </div>
      </div>
      <div id="certificatePreviewList" class="certificatePreviewList"></div>
  
    `);

    // Open full editor in new tab
    $(document).on("click", "#create_cert", function () {

      const newTab = window.open(
        "../../fullscreenexam/certificate-editor/editor.html",
        "_blank"
      );

      // Clear previous canvas data so a fresh editor opens
      localStorage.removeItem("canvasJSON");
    });
  },
  // ✅ Render all certificates from template lis
  renderAllCertificates(certificateTemplates) {
    const container = $("#certificatePreviewList");
    container.empty();

    if (!certificateTemplates || certificateTemplates.length === 0) {
      container.html(`
      <div class="not-found">
        <i class="bx bx-info-circle"></i>
        <p>No Certificates yet.</p>
        <small>Click the "Create Certificate" button to design your first template.</small>
      </div>
    `);
      return;
    }
    certificateTemplates.forEach((template) => {
      const certId = template._id;

      const certHtml = `
  <div class="cert">
    <div class="card certificate-card" data-id="${certId}">
      <div class="certificate-actions">
        <button class="btn btn-sm btn-outline-primary clone-btn" data-id="${certId}" title="Clone">
          <i class="bx bx-copy fs-7"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${certId}" title="Delete">
          <i class="bx bx-trash fs-7"></i>
        </button>
      </div>
      <div class="card-body">
        <div class="certificate-info">
          <h5 class="cert-title">${template.title || "Untitled Certificate"
        }</h5>
          <p class="cert-description text-muted">${template.description || "No description provided"
        }</p>
          <div class="cert-meta">
            <span class="badge bg-info text-white">${template.status || "DRAFT"
        }</span>
            <div class="dates mt-2">
              <h6 class="text-muted">Created: ${new Date(
          template.createdAt
        ).toLocaleDateString()}</h6><br>
              <h6 class="text-muted">Updated: ${new Date(
          template.updatedAt
        ).toLocaleDateString()}</h6>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

      container.append(certHtml);
    });

    // ✅ REBIND EVENTS after rendering
    $(document).on("click", ".certificate-card .delete-btn", function (e) {
      e.stopPropagation();
      const id = $(this).data("id");
      if (id) {
        certificateServices.handleDeleteTemplate(id);
      } else {
        console.warn("No certificate ID found in data-id attribute.");
      }
    });

    $(document).on("click", ".certificate-card .clone-btn", function (e) {
      e.stopPropagation();
      const id = $(this).data("id");
      if (id) {
        certificateServices.handleCloneTemplate(id);
      } else {
        console.warn("No certificate ID found in data-id attribute.");
      }
    });

    $(document).on("click", ".certificate-card", function (e) {
      if (e.target.closest(".delete-btn") || e.target.closest(".clone-btn"))
        return;
      // const index = $(this).data("index");
      const certId = $(this).data("id");
      if (certId) {
        certificateServices.openEditorWithTemplate(certId);
      } else {
        console.warn("No certificate ID found in card.");
      }
    });
  },


};

const certificateServices = {

  getCertificateData(withCertificate = false, onSuccess, onError) {
    let url = `${CERTIFICATE_END_POINT}?withCertificate=${withCertificate}`;

    makeApiCall({
      url: url,
      method: "GET",
      successCallback: onSuccess,
      errorCallback: onError,
    });
  },
  // Delete certificate
  handleDeleteTemplate(certificateId) {
    if (!certificateId) {
      displayToast("Certificate ID not found", "error");
      return;
    }

    makeApiCall({
      url: `${CERTIFICATE_END_POINT}?certificateId=${certificateId}`,
      method: "DELETE",
      successCallback: () => {
        displayToast("Certificate deleted successfully", "success");
        // ✅ Reload the updated certificate list
        certificateController.loadCertificateData();
      },
      errorCallback: (error) => {
        console.error("Error deleting certificate:", error);
        displayToast("Failed to delete certificate", "error");
      },
    });
  },
  //  cloning certificate
  handleCloneTemplate(certificateId) {
    if (!certificateId) {
      displayToast("Certificate ID not found", "error");
      return;
    }

    // ✅ Send it as a POST
    makeApiCall({
      url: CERTIFICATE_END_POINT,
      method: "POST",
      data: JSON.stringify({
        certificateId
      }),
      successCallback: () => {
        displayToast("Certificate cloned successfully", "success");
        certificateController.loadCertificateData(); // ✅ refresh list
      },
      errorCallback: (error) => {
        console.error("Error cloning certificate:", error);
        displayToast("Failed to clone certificate", "error");
      },
    });
  },
  // edit the certificate it move the data to  editor tab
  openEditorWithTemplate(certId) {
    if (!certId) {
      console.warn("Certificate ID is missing.");
      return;
    }

    showLoader(true);
    const editorUrl = new URL("../../fullscreenexam/certificate-editor/editor.html", window.location.origin);
    editorUrl.searchParams.set("id", certId);
    window.open(editorUrl.toString(), "_blank");
    showLoader(false);
  }

};
