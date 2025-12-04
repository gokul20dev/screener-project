$(document).ready(function () {
  // Listen for data from the opener window
  window.addEventListener(
    "message",
    function (event) {
      const { certificateImage, orientation = "landscape" } = event.data || {};

      if (!certificateImage) {
        $(".preview-body").html("<p>No certificate preview available.</p>");
        return;
      }

      // Set image source
      $("#certificate-preview").attr("src", certificateImage);

      // Back button
      $("#btn-back-preview").on("click", () => window.close());

      // Download as JPG
      $("#btn-preview-download-jpg").on("click", () => {
        $("<a>", {
          href: certificateImage,
          download: "Certificate.jpg",
        })[0].click();
      });

      // Download as PDF
      $("#btn-preview-download-pdf").on("click", () => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation,
          unit: "pt",
          format: "a4",
        });

        const img = $("#certificate-preview")[0];
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const scaledHeight = (imgHeight * pdfWidth) / imgWidth;

        pdf.addImage(certificateImage, "JPG", 0, 0, pdfWidth, scaledHeight);
        pdf.save("Certificate.pdf");
      });
    },
    { once: true }
  ); // Only listen to the first message
});
