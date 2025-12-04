let isRefreshingToken = false;

//Api call common Method
function makeApiCall({
  url,
  method,
  data,
  successCallback,
  errorCallback,
  disableLoading,
  retryCount = 0,
  isApiKey = false,
  token = false
}) {
  let newToken
  if(token){
    newToken = token
  }else{
    newToken = localStorage.getItem("access");
  }
  if (!disableLoading) showLoader(true);

  if (!newToken && !isApiKey) {
    showLoader(false);

  if (typeof showAssessmentLoader === "function") {
    showAssessmentLoader(false);
  }

  if (typeof hideAdvanceLoader === "function") {
    hideAdvanceLoader();
  }
    return;
  }

  const ajaxOptions = {
    url,
    type: method,
    headers: {
      ...( isApiKey ? apiheaders : newToken && { Authorization: `Bearer ${newToken}` }),
    },
    success: function (response) {
      showLoader(false);
      successCallback(response);
    },
    error: function (error) {
      showLoader(false);
      if (error.status === 401 && retryCount < 1) {
        if (!isRefreshingToken) {
          isRefreshingToken = true;
          handle401Error(error, {
            retry: () => {
              isRefreshingToken = false;
              return makeApiCall({
                url,
                method,
                data,
                showLoader: showLoader,
                successCallback,
                errorCallback,
                retryCount: retryCount + 1,
              });
            },
          });
        } else {
          setTimeout(() => {
            makeApiCall({
              url,
              method,
              data,
              showLoader: showLoader,
              successCallback,
              errorCallback,
              retryCount: retryCount + 1,
            });
          }, 1000);
        }
      } else {
        const errorMessage = getErrorMessage(error);

        if (errorCallback) {
          errorCallback(errorMessage, error);
        } else {
          // displayToast(errorMessage, "error");
        }

        console.error("API Error:", error);
      }
      // errorCallback(getErrorMessage(error))
    },
  };

  if (data && method !== "GET") {
    ajaxOptions.data = data;
  }

  if (url.includes("attachment")) {
    ajaxOptions.processData = false;
    ajaxOptions.contentType = false;
  } else if (url.includes("import")) {
    ajaxOptions.contentType = "text/plain";
  } else {
    ajaxOptions.contentType = "application/json";
  }

  $.ajax(ajaxOptions);
}

//refresh token api
function handle401Error(err, req) {
  if (err.status === 401) {
    const refreshToken = localStorage.getItem("refresh");
    makeApiCall({
      url: `${DOMAIN_URL}/${API_VERSION}/user/refresh-token`,
      method: "POST",
      data: JSON.stringify({token: refreshToken}),
      successCallback: function (response) {
        localStorage.setItem("access", response.data.access.token);
        localStorage.setItem("refresh", response.data.refresh.token);
        if (req && req.retry) req.retry();
      },
      errorCallback: function (error, errorMessage) {
        console.error("Error refreshing token:", error);
        // displayToast(errorMessage, "error");
        localStorage.removeItem("userDetails");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        $(".main-content").addClass("hidden");
        showLoginForm();
      },
    });
  }
}

//Error message common method
function getErrorMessage(error) {
  const message =
    error?.responseJSON?.errors?.[0]?.msg || error?.responseJSON?.message;

  if (message?.toLowerCase() === "timeout has occurred") {
    return "Session timeout occurred. Please try again.";
  }

  switch (error.status) {
    case 0:
      return "No internet connection. Please check your network.";

    case 400:
      return error?.responseJSON?.message || "Bad request";

    case 422:
      return (
        error.responseJSON?.errors?.[0]?.msg ||
        error.responseJSON?.message ||
        "Validation error"
      );

    case 404:
      return error.responseJSON?.message || "Resource not found";

    case 409:
      return error.responseJSON?.message || "Conflict occurred";

    case 500:
      return (
        error?.responseJSON?.message || "Something went wrong on the server"
      );

    case 502:
    case 503:
    case 504:
      return "Error connecting to server. Please try again later.";

    case 413:
      return "The file size is too large";

    default:
      return (
        error?.responseJSON?.message || error?.message || "Something went wrong"
      );
  }
}



                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

// Enhanced refreshSignedUrl function
async function refreshSignedUrl(expiredUrl) {
  try {
    const payload = {
      urls: [expiredUrl],
      bucket: CONFIG.BUCKET + "/" + CONFIG.FOLDERNAME,
      cloudStorageProvider: CONFIG.CLOUD_SERVICE,
    };
    
    const response = await $.ajax({
      url: `${CONFIG.API.ENDPOINTS.CHUNK_UPLOAD}/signed-urls`,
      method: "PUT",
      headers: apiHeaders,
      contentType: "application/json",
      data: JSON.stringify(payload),
    });

    if (response && response.data && response.data.urls && response.data.urls[0]) { 
      return response.data.urls[0];
    }
    return null;
  } catch (error) {
    return null;
  }
}
