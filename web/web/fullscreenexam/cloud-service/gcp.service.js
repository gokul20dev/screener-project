let gcpSignedUrl;
let fileName;
let fileType;
const CHUNK_SIZE = 1 * 1024 * 1024;
let bufferForPartial = new Uint8Array(0);
let recordedBytesSoFar = 0;

// Create an array to store logs
let recordingLogs = [];
let logSendTimeout = null;
const LOG_SEND_INTERVAL = 5000; // 5 seconds
const MAX_LOGS_BEFORE_SEND = 10;

let pendingUploads = Promise.resolve();
let totalChunksQueued = [];

async function handleRecorderChunk(blob) {
  const newArr = new Uint8Array(await blob.arrayBuffer());

  // Append to partial buffer
  const combined = new Uint8Array(bufferForPartial.length + newArr.length);
  combined.set(bufferForPartial);
  combined.set(newArr, bufferForPartial.length);
  bufferForPartial = combined;

  while (bufferForPartial.length >= CHUNK_SIZE) {
    const subChunk = bufferForPartial.slice(0, CHUNK_SIZE);
    bufferForPartial = bufferForPartial.slice(CHUNK_SIZE);

    const startByte = recordedBytesSoFar;
    const endByte = startByte + subChunk.length - 1;

    // Immediately update recordedBytesSoFar BEFORE upload starts
    recordedBytesSoFar += subChunk.length;

    // Create and store chunk metadata
    const chunkMeta = {
      id: "chunk_" + totalChunksQueued.length,
      startByte,
      endByte,
    };
    totalChunksQueued.push(chunkMeta);

    pendingUploads = pendingUploads.then(() => uploadSubchunk(subChunk, startByte, endByte, chunkMeta));

    videoUploadLog(`Queued ${chunkMeta.id}, Remaining: ${totalChunksQueued.length}`);
  }
}

async function uploadSubchunk(typedArr, startByte, endByte, chunkMeta) {
  const blob = new Blob([typedArr]);
  videoUploadLog(`Uploading ${chunkMeta.id}: ${startByte}-${endByte} (${typedArr.length} bytes)`);

  try {
    chunkFetchFlag.lastChunkPending = true;
    chunkFetchFlag.lastChunkTime = Date.now();
    const res = await fetch(gcpSignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": fileType,
        "Content-Range": `bytes ${startByte}-${endByte}/*`,
      },
      body: blob,
    });

    // Remove from queue
    const index = totalChunksQueued.findIndex((c) => c.id === chunkMeta.id);
    if (index !== -1) totalChunksQueued.splice(index, 1);

    if (res.status !== 308 && !res.ok) {
      videoUploadLog(`Upload error ${chunkMeta.id}: ${res.status} ${res.statusText}`);
      $('#saving-video-failed').text('Failed to upload chunk').show();
      uploadChunkError++;
    } else {
      uploadChunkError = 0;
      videoUploadLog(
        `Uploaded ${chunkMeta.id}, Remaining: ${totalChunksQueued.length}, Total Uploaded: ${(recordedBytesSoFar / (1024 * 1024)).toFixed(2)}MB`
      );
    }
    chunkFetchFlag.lastChunkPending = false;
  } catch (err) {
    uploadChunkError++;
    chunkFetchFlag.lastChunkPending = false;
    videoUploadLog(`Error uploading chunk: ${err.message}`);
    $('#saving-video-failed').text('Failed to upload chunk').show();
  } 
}

// Minimal offset check
async function recoverOffsetFromGCS() {
  videoUploadLog("Recovering offset from GCS");
  if (!gcpSignedUrl) return;
  const resp = await fetch(gcpSignedUrl, {
    method: "PUT",
    headers: { "Content-Range": "bytes */*" },
  });
  if (resp.status === 308) {
    const rangeHdr = resp.headers.get("Range");
    videoUploadLog(`Range header: ${rangeHdr}`);
    if (rangeHdr) {
      const match = rangeHdr.match(/bytes=0-(\d+)/);
      if (match) {
        recordedBytesSoFar = parseInt(match[1], 10) + 1;
        videoUploadLog(`Resuming upload from ${(recordedBytesSoFar / (1024 * 1024)).toFixed(2)}MB`);
      }
    }
  } else {
    videoUploadLog("Failed to recover upload position");
    throw new Error(`Offset check returned status: ${resp.status}`);
  }
}

// Fetch GCP Signed URL (example)
async function getGcpSignedUrl(attenderId, fileName, fileType) {
  const fullName = `${attenderId}/${fileName}.${fileType}`;
  const response = await fetch(GCP_CLOUD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objectName: fullName }),
  });

  const data = await response.json();
  gcpSignedUrl = data.uploadSessionURL;
  $('#saving-video-failed').text("").hide();
  updateAttenderGcpSignedUrl(attenderId, gcpSignedUrl, fileName, fileType);
}

// Add this new function to check existing upload
async function updateAttenderGcpSignedUrl(attenderId, url, fileName, fileType) {
  return new Promise((resolve) => {
    makeApiCall({
      url: `${EXAM_ATTENDER_END_POINT}/upload?id=${attenderId}`,
      method: "PUT",
      isApiKey: true,
      data: JSON.stringify({
        uploadUrl: url,
        fileName: fileName,
        fileType: fileType,
        id: attenderId,
      }),
      successCallback: (response) => resolve(response.data),
      errorCallback: () => resolve(null),
    });
  });
}

// Log function that stores messages in the array with type
function videoUploadLog(message, type = 'upload') {
  const logEntry = {
    message,
    type,
    timestamp: new Date().toISOString()
  };
  
  recordingLogs.push(logEntry);
  
  // Clear any existing timeout
  if (logSendTimeout) {
    clearTimeout(logSendTimeout);
  }
  
  // Set a new timeout to send logs
  logSendTimeout = setTimeout(() => {
    if (recordingLogs.length > 20) {
      sendLogsToServer();
    }
  }, LOG_SEND_INTERVAL);
  
  // Also send if we have accumulated enough logs
  if (recordingLogs.length >= MAX_LOGS_BEFORE_SEND) {
    sendLogsToServer();
  }
}

// Function to send logs to the server
function sendLogsToServer() {
  if (recordingLogs.length === 0) return;
  
  const attenderId = new URLSearchParams(window.location.search).get("attender_id");
  if (!attenderId) {
    console.error("No attender_id found in URL");
    return;
  }
  
  const logsToSend = [...recordingLogs];
  recordingLogs = [];
  
  makeApiCall({
    url: `${STUDENT_END_POINT}/log?attenderId=${attenderId}`,
    method: "PUT",
    data: JSON.stringify({ logs: logsToSend }),
    isApiKey: true,
    disableLoading: true,
    successCallback: () => {
      console.log('Logs sent successfully');
    },
    errorCallback: (error) => {
      console.error("Failed to send logs:", error);
      recordingLogs = [...logsToSend, ...recordingLogs];
    }
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
