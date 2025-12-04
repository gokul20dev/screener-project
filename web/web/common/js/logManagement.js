let accessActivityLogs = [];
const INTERVAL = 3000;
let accessLogSendTimeout = null;
const MAX_LOGS_SEND = 2;

// Log function that stores messages in the array with type
function userActivityLogsApi(message, type = "upload") {
  const logEntry = {
    message,
    type,
    timestamp: new Date().toISOString(),
  };

  accessActivityLogs.push(logEntry);

  // Clear any existing timeout
  if (accessLogSendTimeout) {
    clearTimeout(accessLogSendTimeout);
  }

  // Set a new timeout to send logs
  accessLogSendTimeout = setTimeout(() => {
    if (accessActivityLogs.length > 20) {
      sendAccessLogsToServer();
    }
  }, INTERVAL);

  // Also send if we have accumulated enough logs
  if (accessActivityLogs.length >= MAX_LOGS_SEND) {
    sendAccessLogsToServer();
  }
}

// Function to send logs to the server
function sendAccessLogsToServer() {
  if (accessActivityLogs.length === 0) return;

  const attenderId = new URLSearchParams(window.location.search).get(
    "attender_id"
  );
  if (!attenderId) {
    console.error("No attender_id found in URL");
    return;
  }

  const logsToSend = [...accessActivityLogs];
  accessActivityLogs = [];

  makeApiCall({
    url: `${STUDENT_END_POINT}/log?attenderId=${attenderId}`,
    method: "PUT",
    data: JSON.stringify({ logs: logsToSend }),
    isApiKey: true,
    disableLoading: true,
    successCallback: () => {
      console.log("Logs sent successfully");
    },
    errorCallback: (error) => {
      console.error("Failed to send logs:", error);
      accessActivityLogs = [...logsToSend, ...accessActivityLogs];
    },
  });
}
