function uploadFileForQuestion(attender_id, attachmentFile) {
  showLoader(true);
  return new Promise((resolve, reject) => {
    const file = attachmentFile.file;
    if (!file) {
      return reject("No file selected");
    }
    const parts = file?.name?.split(".");
    const baseName = parts?.slice(0, parts.length - 1).join(".") || parts[0];
    const extension = parts[parts.length - 1];

    const params = {
      app: CONFIG.APP,
      id: attender_id,
      fileName: baseName,
      fileType: extension,
      contentType: file.type,
      bucket: CONFIG.BUCKET,
      folderName: CONFIG.FOLDERNAME,
      cloudStorageProvider: CONFIG.CLOUD_SERVICE,
    };

    $.ajax({
      url: `${CONFIG.API.ENDPOINTS.CHUNK_UPLOAD}?${$.param(params)}`,
      type: "GET",
      success: function (response) {
        if (response && response.data && response.data.url) {
          const uploadUrl = response.data.url;
          $.ajax({
            url: uploadUrl,
            type: "PUT",
            data: file,
            contentType: file.type,
            processData: false,
            success: function () {
              resolve({ url: uploadUrl });
                showLoader(false);
            },
            error: function (err) {
              reject("Error uploading file to signed URL: " + err.statusText);
              showLoader(false);
            },
          });
        }
      },
      error: function (err) {
        reject("Error getting signed URL: " + err.statusText);
        showLoader(false);
      },
    });
  });
}

function updateUploadedFileWithSignedUrl(uploadResult) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `${CONFIG.API.ENDPOINTS.CHUNK_UPLOAD}/signed-urls`,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify({
        urls: [uploadResult.url],
        bucket: CONFIG.BUCKET,
        expiryTime: CONFIG.EXPIRY_TIME,
      }),
      success: function (response) {
        resolve(response.data.urls[0]);
        showLoader(false);
      },
      error: function (err) {
        reject(err);
        showLoader(false);
      },
    });
  });
}

// UI functions
function hideUploadAnimation() {
  const overlay = $("#upload-overlay");
  overlay.css({
    animation: "fadeOut 0.3s ease forwards",
  });
  setTimeout(() => {
    overlay.remove();
    $("body").css("overflow", "");
    $("style:last").remove();
  }, 300);
}