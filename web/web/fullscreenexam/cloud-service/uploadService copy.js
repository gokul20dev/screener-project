const expiryTime = 604800;
const AWS_API_DOMAIN = "https://api.digivalitsolutions.com";

// Helper function to retry API calls
async function retryApiCall(apiFunc, maxRetries = 2) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const result = await apiFunc();
      return { success: true, data: result };
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        return { success: false, error };
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
}

// Store video file in IndexedDB
function storeVideoInIndexedDB(file, attender_id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VideoStorage', 1);
    
    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos', { keyPath: 'attender_id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['videos'], 'readwrite');
      const store = transaction.objectStore('videos');
      
      const videoData = {
        attender_id,
        file,
        timestamp: new Date().getTime()
      };
      
      const storeRequest = store.put(videoData);
      storeRequest.onsuccess = () => resolve();
      storeRequest.onerror = () => reject(new Error('Failed to store video in IndexedDB'));
    };
  });
}

// Store signed URL in localStorage
function storeSignedUrlInLocalStorage(attender_id, signedUrl) {
  try {
    const storageKey = `pending_uploads`;
    const pendingUploads = JSON.parse(localStorage.getItem(storageKey) || '{}');
    pendingUploads[attender_id] = {
      signedUrl,
      timestamp: new Date().getTime()
    };
    localStorage.setItem(storageKey, JSON.stringify(pendingUploads));
    return true;
  } catch (error) {
    return false;
  }
}

// Get signed URL for upload
async function getSignedUrlForUploadAttachment({ file, attender_id }) {
  const fileName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
  const fileType = file.name.substring(file.name.lastIndexOf(".") + 1) || "";
  const isVideo = file.type.startsWith("video/");
  const mb = file.size / 1024 ** 2;
  const numberOfPart = isVideo && mb > 10 ? Math.ceil(mb / 10) : 0;

  const apiCall = () => new Promise((resolve, reject) => {
    $.ajax({
      url: `${AWS_API_DOMAIN}/api/v1/upload`,
      method: "GET",
      data: {
        id: attender_id,
        fileName,
        fileType,
        app: "DA",
        contentType: file.type,
        numberOfPart,
      },
      success: resolve,
      error: reject
    });
  });

  const { success, data, error } = await retryApiCall(apiCall);
  
  if (!success) {
    if (isVideo) {
      try {
        await storeVideoInIndexedDB(file, attender_id);
        toastr.warning("Video saved locally. Will retry upload when connection is restored.");
        return;
      } catch (dbError) {
        toastr.error("Failed to save video. Please try again.");
        return;
      }
    }
  }

  uploadAttachmentInCloud({
    file,
    signedUrl: data?.data?.url || "",
    urls: data?.data?.urls,
    uploadId: data?.data?.uploadId,
    fileName,
    fileType,
    numberOfPart,
    attender_id,
  });
}

// Upload attachment to cloud
function uploadAttachmentInCloud({
  file,
  signedUrl,
  urls,
  uploadId,
  fileName,
  fileType,
  numberOfPart,
  attender_id,
}) {
  if (urls?.length) {
    // Multipart upload
    const chunkSize = 10 * 1024 * 1024;
    const etags = [];
    let completedUploads = 0;

    urls.forEach((url, index) => {
      const start = index * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const fileChunk = new File([file.slice(start, end)], file.name, {
        type: file.type,
      });

      const uploadChunk = () => new Promise((resolve, reject) => {
        $.ajax({
          url: url,
          method: "PUT",
          data: fileChunk,
          processData: false,
          contentType: file.type,
          success: function (response, status, xhr) {
            resolve({ response, xhr });
          },
          error: reject
        });
      });

      retryApiCall(uploadChunk)
        .then(({ success, data }) => {
          if (success) {
            const etag = data.xhr.getResponseHeader("ETag").replace(/"/g, "");
            etags.push({ etag: etag, index: index + 1 });
            completedUploads++;

            if (completedUploads === urls.length) {
              completeMultipartUpload({
                file,
                fileName,
                fileType,
                uploadId,
                parts: etags,
                attender_id,
              });
            }
          } else {
            storeVideoInIndexedDB(file, attender_id)
              .then(() => {
                toastr.error("Upload interrupted. Video saved locally for retry.");
              })
              .catch((err) => {
                toastr.error("Upload failed. Please try again.");
              });
          }
        });
    });
  } else {
    // Single file upload
    const uploadFile = () => new Promise((resolve, reject) => {
      $.ajax({
        url: signedUrl,
        method: "PUT",
        data: file,
        processData: false,
        contentType: file.type,
        success: resolve,
        error: reject
      });
    });

    retryApiCall(uploadFile)
      .then(({ success }) => {
        if (success) {
          updateBucketUrl({
            itemId: attender_id,
            fileName: fileName,
            fileType: fileType,
            size: file.size,
          });
        } else {
          storeVideoInIndexedDB(file, attender_id)
            .then(() => {
              toastr.warning("Upload failed. Video saved locally for retry.");
              hideUploadAnimation();
            })
            .catch((err) => {
              toastr.error("Upload failed. Please try again.");
              hideUploadAnimation();
            });
        }
      });
  }
}

// Complete multipart upload
function completeMultipartUpload({
  file,
  fileName,
  fileType,
  uploadId,
  parts,
  attender_id,
}) {
  const completeUpload = () => new Promise((resolve, reject) => {
    $.ajax({
      url: `${AWS_API_DOMAIN}/api/v1/upload`,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        id: attender_id,
        fileName: fileName,
        fileType: fileType,
        uploadId: uploadId,
        parts: parts,
      }),
      success: resolve,
      error: reject
    });
  });

  retryApiCall(completeUpload)
    .then(({ success }) => {
      if (success) {
        updateBucketUrl({
          itemId: attender_id,
          fileName: fileName,
          fileType: fileType,
          size: file.size,
        });
      } else {
        storeVideoInIndexedDB(file, attender_id)
          .then(() => {
            toastr.error("Failed to complete upload. Video saved locally for retry.");
          })
          .catch((err) => {
            toastr.error("Upload failed. Please try again.");
          });
      }
    });
}

// Update bucket URL
function updateBucketUrl({ itemId, fileName, fileType }) {
  const updateUrl = () => new Promise((resolve, reject) => {
    $.ajax({
      url: `${AWS_API_DOMAIN}/api/v1/upload/signed-url?id=${itemId}&fileName=${fileName}&fileType=${fileType}`,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        expiryTime: expiryTime,
      }),
      success: resolve,
      error: reject
    });
  });

  retryApiCall(updateUrl)
    .then(({ success, data }) => {
      if (success) {
        updateAttenderSignedUrl(itemId, data.data.url);
      } else {
        hideUploadAnimation();
        toastr.error("Failed to process upload. Please try again.");
      }
    });
}

// Update attender signed URL
function updateAttenderSignedUrl(attender_id, signedUrl) {
  const payload = { signedUrl };

  const performUpdate = () => new Promise((resolve, reject) => {
    $.ajax({
      url: `${EXAM_END_POINT}/attender/signed-url?attenderId=${attender_id}`,
      method: "POST",
      data: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ApiKey,
      },
      success: resolve,
      error: reject
    });
  });

  retryApiCall(performUpdate)
    .then(({ success, error }) => {
      if (success) {
        toastr.success("Video uploaded successfully");
        hideUploadAnimation();
        if (localStorage.getItem("success_exam")) {
          localStorage.removeItem("success_exam");
          window.location.href = "success.html";
        }
        if (localStorage.getItem("completed_exam")) {
          localStorage.removeItem("completed_exam");
          window.location.href = "message.html?status=completed";
        }

      // Remove from IndexedDB
      const dbRequest = indexedDB.open('VideoStorage');
      dbRequest.onsuccess = (e) => {
        const db = e.target.result;
        db.transaction('videos', 'readwrite').objectStore('videos').delete(attender_id);
      };

       // Remove from localStorage
       const pendingUploads = JSON.parse(localStorage.getItem('pending_uploads') || '{}');
       delete pendingUploads[attender_id];
       localStorage.setItem('pending_uploads', JSON.stringify(pendingUploads));

      } else {
        const stored = storeSignedUrlInLocalStorage(attender_id, signedUrl);
        if (stored) {
          toastr.warning("Upload completed but not saved. Will retry when connection is restored.");
        } else {
          toastr.error("Failed to save upload status. Please try again.");
        }
        hideUploadAnimation();
      }
    });
}

// Hide upload animation
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

// Retry pending uploads
function retryPendingUploads() {
  // Retry stored signed URLs
  const pendingUploads = JSON.parse(localStorage.getItem('pending_uploads') || '{}');
  Object.entries(pendingUploads).forEach(([attender_id, data]) => {
    updateAttenderSignedUrl(attender_id, data.signedUrl);
  });

  // Retry stored videos
  const request = indexedDB.open('VideoStorage', 1);
  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['videos'], 'readwrite');
    const store = transaction.objectStore('videos');
    
    const getAllRequest = store.getAll();
    getAllRequest.onsuccess = () => {
      getAllRequest.result.forEach(videoData => {
        getSignedUrlForUploadAttachment({
          file: videoData.file,
          attender_id: videoData.attender_id
        });
      });
    };
  };
}

// Listen for online status to retry uploads
window.addEventListener('online', retryPendingUploads);


// Upload functions
async function uploadVideoChunk({
  chunkData,
  attenderId,
  baseFileName,
  chunkNumber,
  uploadId,
}) {
  const promise = new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams({
      id: attenderId,
      canUploadViaChunk: true,
      fileName: baseFileName,
      fileType: "webm",
      contentType: "video/webm",
      chunkNumber: chunkNumber,
      bucket: CONFIG.BUCKET,
      folderName: CONFIG.FOLDERNAME,
      ...(uploadId && { chunkUploadId: uploadId }),
    });

    $.ajax({
      url: `${CONFIG.API.ENDPOINTS.CHUNK_UPLOAD}?${queryParams}`,
      method: "GET",
      contentType: "application/json",
      success: function (response) {
        $.ajax({
          url: response.data.urls,
          method: "PUT",
          data: chunkData,
          processData: false,
          contentType: "video/webm",
          success: function (_, __, xhr) {
            const etag = xhr.getResponseHeader("ETag")?.replace(/['"]/g, "");
            
            makeApiCall({
              url: `${EXAM_ATTENDER_END_POINT}/upload`,
              method: "PUT",
              data: JSON.stringify({
                etag,
                index: chunkNumber,
                ...(chunkNumber === 1 && { uploadId: response.data.uploadId }),
                ...(chunkNumber === 1 && { fileName: baseFileName }),
                ...(chunkNumber === 1 && { fileType: "webm" }),
                id: attenderId
              }),
              isApiKey: true,
              disableLoading: true,
              successCallback: () => {
                resolve({
                  uploadId: response.data.uploadId,
                  etag,
                });
              },
              errorCallback: (apiErr) => {
                console.error("Backup update failed:", apiErr);
                reject(apiErr);
              }
            });
          },
          error: function (err) {
            reject(err);
          },
        });
      },
      error: function (err) {
        reject(err);
      },
    });
  });

  return promise;
}

function getBucketSiggnedUrl(id, fileName, fileType) {
  $.ajax({
    url: `${CONFIG.API.ENDPOINTS.CHUNK_UPLOAD}/signed-url?id=${id}&fileName=${fileName}&fileType=${fileType}`,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      expiryTime: CONFIG.EXPIRY_TIME,
    }),
    success: function (response) {
      updateAttenderSignedUrl(id, response.data.url);
    },
    error: function (err) {
      hideUploadAnimation();
      console.error("Error completing multipart upload:", err);
      toastr.error(
        "Failed to process video upload. Please check your connection and try again."
      );
    },
  });
}

async function updateAttenderSignedUrl(attenderId, signedUrl) {
  $.ajax({
    url: `${EXAM_END_POINT}/attender/signed-url?attenderId=${attenderId}`,
    method: "POST",
    data: JSON.stringify({ signedUrl }),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ApiKey,
    },
    success: function (response) {
      hideUploadAnimation();
      if (localStorage.getItem("success_exam")) {
        localStorage.removeItem("success_exam");
        window.location.href = "success.html";
      }
      if (localStorage.getItem("completed_exam")) {
        localStorage.removeItem("completed_exam");
        window.location.href = "message.html?status=completed";
      }
    },
    error: function (error) {},
  });
}

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
