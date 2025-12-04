$(document).ready(function () {
  let isUserScrolling = false;
  let scrollTimer;
  let anomalyGrid;
  let gridOptions;
  let examId = new URLSearchParams(window.location.search).get("examId");
  let mainPlayer = null;
  let popupPlayer = null;
  let segmentPlayer = null;
  let currentReviewStatus = "NOT_REVIEWED"; // Track the current review status
  let currentVideoUrl = null;

  // Initialize the Plyr players
  initializeVideoPlayers();

  // Initialize review status to Not Reviewed by default
  updateReviewStatusUI("NOT_REVIEWED");

  fetchExamDetails();
  fetchStudentAnamolys();

  // Add warning when leaving page with status not reviewed
  $(window).on('beforeunload', function(e) {
    if (currentReviewStatus === "NOT_REVIEWED") {
      // Show the browser's default confirmation dialog
      const confirmationMessage = "Warning: You haven't changed the review status from 'Not Reviewed'. Are you sure you want to leave?";
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }
  });
  
  // Show warning banner if review status is not changed
  showReviewStatusWarning();
  
  // Function to show warning banner for unchanged review status
  function showReviewStatusWarning() {
    if ($('.review-status-warning').length === 0) {
      const warningHtml = `
        <div class="review-status-warning">
          <div class="warning-icon">
            <i class="bx bx-error-circle"></i>
          </div>
          <div class="warning-message">
            Please review and update the review status for this student.
          </div>
          <div class="warning-close">
            <i class="bx bx-x"></i>
          </div>
        </div>
      `;
      
      // Insert warning at the top of video section
      $('#anomaly-video').prepend(warningHtml);
      
      // Add click handler to close button
      $('.warning-close').on('click', function() {
        $('.review-status-warning').fadeOut(300, function() {
          $(this).remove();
        });
      });
    }
  }

  // Function to initialize video players
  function initializeVideoPlayers() {
    // Initialize the main video player
    if (document.getElementById("anomaly-video-player")) {
      mainPlayer = new Plyr("#anomaly-video-player", {
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "mute",
          "volume",
          "settings",
          "download",
          "pip",
          "fullscreen",
        ],
        settings: ["captions", "quality", "speed"],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5, 8, 10, 13, 16, 20] },
        tooltips: { controls: true, seek: true },
        keyboard: { focused: true, global: false },
      });
    }

    // Initialize the popup video player
    if (document.getElementById("popupVideo")) {
      popupPlayer = new Plyr("#popupVideo", {
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "mute",
          "volume",
          "settings",
          "download",
          "pip",
          "fullscreen",
        ],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5, 8, 10, 13, 16, 20] },
      });
    }

    // Initialize the segment video player
    if (document.getElementById("segmentPopupVideo")) {
      segmentPlayer = new Plyr("#segmentPopupVideo", {
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "mute",
          "volume",
          "settings",
          "download",
          "pip",
          "fullscreen",
        ],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5, 8, 10, 13, 16, 20] },
      });
    }
  }

  $(document).on('click', '#refresh-video', function () {
    fetchStudentAnamolys()
  });

  $(document).on('click', '.view-recording-btn', function () {
    const videoUrl = $(this).data('video-url');
    if (videoUrl) {
      showSegmentVideoPopup(videoUrl);
    } else {
      toastr.error('Video URL not available');
    }
  });

  // Add click event handler for student image
  $(document).on("click", "#student-image", function () {
    const imageUrl = $(this).attr("src");
    showImagePopup(imageUrl);
  });

  // Function to show image in popup
  function showImagePopup(imageUrl) {
    const popup = document.getElementById("imagePopup");
    const popupImage = document.getElementById("popupImage");
    const closeBtn = document.getElementById("closeImagePopup");

    // Set image source
    popupImage.src = imageUrl;

    // Show popup
    popup.classList.add("active");

    // Close button event listener
    closeBtn.onclick = closeImagePopup;

    // Close on clicking outside
    popup.onclick = function (e) {
      if (e.target === popup) {
        closeImagePopup();
      }
    };
  }

  // Function to close image popup
  function closeImagePopup() {
    const popup = document.getElementById("imagePopup");
    popup.classList.remove("active");
  }

  // Function to show segment video in popup
  async function showSegmentVideoPopup(videoUrl) {
    const popup = document.getElementById("segmentVideoPopup");
    const popupVideo = document.getElementById("segmentPopupVideo");
    const closeBtn = document.getElementById("closeSegmentPopup");

    const signedUrl = await getVideoSignedUrl(videoUrl);

    // Set video source
    if (segmentPlayer) {
      segmentPlayer.source = {
        type: "video",
        sources: [{ src: signedUrl, type: "video/mp4" }],
        tracks: [],
      };

      // Setup download functionality after a short delay to ensure player is ready
      setTimeout(() => {
        setupSegmentVideoDownload();
      }, 1000);
    }

    // Show popup
    popup.classList.add("active");

    // Close button event listener
    closeBtn.onclick = closeSegmentVideoPopup;

    // Close on clicking outside
    popup.onclick = function (e) {
      if (e.target === popup) {
        closeSegmentVideoPopup();
      }
    };
  }

  // Function to close segment video popup
  function closeSegmentVideoPopup() {
    const popup = document.getElementById("segmentVideoPopup");
    popup.classList.remove("active");
    if (segmentPlayer) {
      segmentPlayer.pause();
    }
  }

  // Update timeupdate event to use Plyr
  if (mainPlayer) {
    mainPlayer.on("timeupdate", function () {
      const currentSecond = Math.floor(mainPlayer.currentTime);
      // Find which minute interval this second falls into
      const minuteStart = Math.floor(currentSecond / 60) * 60;
      const $timelineChart = $(".timeline-chart");

      // Find the corresponding data bars for this minute
      const $currentBars = $(`.data-bar[data-second="${minuteStart}"]`);

      if ($currentBars.length) {
        // Get the horizontal position of the time label
        const $timeLabel = $(`.time-label[data-second="${minuteStart}"]`);

        if ($timeLabel.length) {
          const container = $timelineChart[0];
          const targetScroll =
            $timeLabel[0].offsetLeft - container.offsetWidth / 2;

          // Add/update time indicator
          const indicator = $timelineChart.find(".current-time-indicator");
          if (indicator.length === 0) {
            $timelineChart.append('<div class="current-time-indicator"></div>');
          }

          // Position indicator based on the current position within the minute
          const minutePosition = $timeLabel.position().left;
          const minuteWidth =
            $(".timeline-axis").width() / $(".time-label").length;
          const secondsIntoMinute = currentSecond - minuteStart;
          const positionOffset = (secondsIntoMinute / 60) * minuteWidth;

          $timelineChart
            .find(".current-time-indicator")
            .css("left", minutePosition + positionOffset + "px");

          // Smooth scroll to center if not user scrolling
          if (isUserScrolling) return;

          container.scrollTo({
            left: targetScroll,
            behavior: "smooth",
          });
        }
      }
    });
  }

  $(".violation-marker").click(function () {
    const timelineColumn = $(this).closest(".timeline-column");
    const targetSecond = parseInt(timelineColumn.data("second"));

    // Set video time using Plyr API
    if (mainPlayer) {
      mainPlayer.currentTime = targetSecond;
      mainPlayer.play();
    }

    // Highlight the selected column
    $(".timeline-column").removeClass("selected");
    timelineColumn.addClass("selected");
  });

  $(".timeline-chart").on("scroll", function () {
    isUserScrolling = true;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      isUserScrolling = false;
    }, 2000); // Resume auto-scroll after 2 seconds of inactivity
  });

  $("#logout-button").click(function () {
    handleLogout();
  });

  $("#Anamoly-export").click(function () {
    handleExportExcel();
  });

  // Review status dropdown handlers
  $("#status-dropdown-btn").click(function(e) {
    e.stopPropagation();
    toggleStatusDropdown();
  });

  $(document).on("click", function(e) {
    if (!$(e.target).closest(".review-status-dropdown").length) {
      hideStatusDropdown();
    }
  });

  $(".dropdown-item").click(function() {
    const status = $(this).data("status");
    updateReviewStatus(status);
    hideStatusDropdown();
  });

  function toggleStatusDropdown() {
    const $dropdown = $("#status-dropdown-menu");
    const $button = $("#status-dropdown-btn");
    
    if ($dropdown.hasClass("show")) {
      hideStatusDropdown();
    } else {
      $dropdown.addClass("show");
      $button.addClass("active");
    }
  }

  function hideStatusDropdown() {
    $("#status-dropdown-menu").removeClass("show");
    $("#status-dropdown-btn").removeClass("active");
  }

  function updateReviewStatus(status) {
    const studentId = $("#generate-video").data("student-id");
    
    if (!studentId) {
      toastr.error("Student ID not found");
      return;
    }

    // Update UI first for better user experience
    updateReviewStatusUI(status);
    
    // Make API call to update status
    const url = `${ATTENDER_END_POINT}/anomaly-status?attenderId=${studentId}`;
    
    makeApiCall({
      url: url,
      method: "PUT",
      isApiKey: true,
      data: JSON.stringify({
        evaluationAnomalyStatus: status,
      }),
      successCallback: function(response) {
        if (response.success || response.message === "Updated successfully") {
          toastr.success(`Review status updated to ${status.toLowerCase()}`);
          // Update current review status
          currentReviewStatus = status;
          // Remove warning if exists
          $('.review-status-warning').fadeOut(300, function() {
            $(this).remove();
          });
        } else {
          // If API fails, revert UI
          toastr.error("Failed to update review status");
          updateReviewStatusUI("NOT_REVIEWED");
          currentReviewStatus = "NOT_REVIEWED";
        }
      },
      errorCallback: function(error) {
        console.error("Error updating review status:", error);
        toastr.error("Failed to update review status");
        // Revert UI on error
        updateReviewStatusUI("NOT_REVIEWED");
        currentReviewStatus = "NOT_REVIEWED";
      }
    });
  }

  function updateReviewStatusUI(status) {
    const $dropdownBtn = $("#status-dropdown-btn");
    
    // Remove all status classes from dropdown button
    $dropdownBtn.removeClass("not-reviewed genuine cheated suspicious");
    
    // Update UI based on status
    if (status === "GENUINE") {
      $dropdownBtn.addClass("genuine");
    } else if (status === "CHEATED") {
      $dropdownBtn.addClass("cheated");
    } else if (status === "SUSPICIOUS") {
      $dropdownBtn.addClass("suspicious");
    } else {
      $dropdownBtn.addClass("not-reviewed");
    }

    // Update dropdown button text based on current status
    updateDropdownButtonText(status);
  }

  function updateDropdownButtonText(status) {
    let text = "Not Reviewed";
    let statusIcon = '';
    let dropdownIcon = '<i class="bx bx-chevron-down"></i>';
    
    switch(status) {
      case "GENUINE":
        text = "Genuine";
        statusIcon = '<i class="bx bx-check-circle"></i>';
        break;
      case "SUSPICIOUS":
        text = "Suspicious";
        statusIcon = '<i class="bx bx-error-alt"></i>';
        break;
      case "CHEATED":
        text = "Cheated";
        statusIcon = '<i class="bx bx-error-circle"></i>';
        break;
      case "NOT_REVIEWED":
      default:
        text = "Not Reviewed";
        statusIcon = '';
    }
    
    $("#status-dropdown-btn").html(`${statusIcon} <span>${text}</span> ${dropdownIcon}`);
  }

  $(document).on("click", "#generate-video", function () {
    const examId = new URLSearchParams(window.location.search).get('examId');
    if (!examId) {
      toastr.error('Exam ID not found');
      return;
    }

    const attender = $(this).data("student-id");
    
    showVideoGenerationPopup(attender, examId);
  });

  function fetchExamDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get("examId");
    const url = `${EXAM_END_POINT}?entranceExamId=${examId}`;

    makeApiCall({
      url: url,
      method: "GET",
      successCallback: function (response) {
        if (response.message === "Retrieved successfully") {
          examDetails = response.data.exam;

          $("#exam-name").text(examDetails.name);
          $("#exam-status").text(examDetails.examStatus.replace("_", " "));
          $("#start-date").text(
            formatDateTimeGeneral(examDetails.session.start)
          );
        }
      },
      errorCallback: function (error) {
        console.error("Error fetching exam details:", error);
      },
    });
  }

  function fetchStudentAnamolys() {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get("examId");
    const email = urlParams.get("email");

    const url = `${REPORT_END_POINT}?entranceExamId=${examId}&canPaginate=false&mail=${encodeURIComponent(
      email
    )}`;

    makeApiCall({
      url: url,
      method: "GET",
      successCallback: function (response) {
        if (response.message === "Retrieved successfully") {
          const data = response.data.data[0];
          const anomalyData = data?.anomalyDetails?.violations;
          // const videoUrl = data?.signedUrls[data?.signedUrls.length - 1]?.url;
          if (data?.name?.first && data?.name?.last) {
            $("#student-name").text(data?.name?.first + " " + data?.name?.last);
          }
          $("#student-email").text(data?.mail);

          $("#generate-video").attr("data-student-id", data?._id);

          // Check and update review status if available
          if (data?.evaluationAnomalyStatus) {
            updateReviewStatusUI(data.evaluationAnomalyStatus);
            currentReviewStatus = data.evaluationAnomalyStatus;
            
            // If already reviewed, remove the warning
            if (data.reviewStatus !== "NOT_REVIEWED") {
              $('.review-status-warning').remove();
            }
          } else {
            updateReviewStatusUI("NOT_REVIEWED");
            currentReviewStatus = "NOT_REVIEWED";
            showReviewStatusWarning();
          }

          // Initialize video player
          fetchSignedUrl(data?._id);

          if (anomalyData?.length > 0) {
            initializeGrid(anomalyData);

            generateTimelineColumns(
              response?.data?.data[0]?.anomalyDetails?.totalDuration,
              anomalyData
            );
          } else {
            $(".timeline-chart").empty();
            $(".timeline-chart").append(
              '<div class="no-data-message">Anomaly is processing for this student, wait for some time</div>'
            );
          }

          if (!data.isVideoProcessed) {
            renderVideoNotReady(data);
          } else {
            $("#video-not-available").addClass("d-none").empty();
          }
        }
      },
      errorCallback: function (error) {
        console.error("Error fetching student anomalies:", error);
        // Also show message on error
        $("#anomaly-table").empty();
      },
    });
  }

  function fetchSignedUrl(attenderId) {
    const url = `${EXAM_ATTENDER_END_POINT}/signed-url?attenderId=${attenderId}`;
    makeApiCall({
      url: url,
      method: "GET",
      isApiKey: true,
      successCallback: function (response) {
        console.log(response);

        // Set student image
        $("#student-image").attr("src", response?.data?.faceSignedUrl);

        if (response?.data?.signedUrl) {

          currentVideoUrl = response?.data?.signedUrl;
          // Update main video player source with Plyr
          if (mainPlayer) {
            const mainVideoElem = document.getElementById(
              "anomaly-video-player"
            );
            // Update the video source
            const mainVideoSource = mainVideoElem.querySelector("source");
            mainVideoSource.src = response?.data?.signedUrl;
            // Reload the player
            showVideoLoader(mainVideoElem);
            mainVideoElem.load();
       
            mainPlayer.source = {
              type: "video",
              sources: [{ src: response?.data?.signedUrl, type: "video/mp4" }],
              tracks: [],
            };
  
        
            setTimeout(() => {
              setupVideoDownload();
            }, 3000);

          }

          // Update popup video player source
          if (popupPlayer) {
            const popupVideoElem = document.getElementById("popupVideo");
            // Update the video source
            const popupVideoSource = popupVideoElem.querySelector("source");
            popupVideoSource.src = response?.data?.signedUrl;
            // Reload the player
            popupVideoElem.load();
            popupPlayer.source = {
              type: "video",
              sources: [{ src: response?.data?.signedUrl, type: "video/mp4" }],
              tracks: [],
            };

            setTimeout(() => {
              setupVideoDownload();
            }, 3000);
          }

          $("#generate-video").hide();
          $(".video-wrapper").removeClass("d-none");
        } else {
          $("#video-not-available").removeClass("d-none");
          $(".video-wrapper").addClass("d-none");
          if (mainPlayer) {
            mainPlayer.pause();
          }
          $("#generate-video").show();
        }
      },
      errorCallback: function (error) {
        console.error("Error fetching signed url:", error);
      },
    });
  }

  function showVideoLoader(videoElem) {
    if (!videoElem) return;

    const wrapper = videoElem.closest(".video-wrapper");
    const loader = wrapper?.querySelector(".video-loader");
    const loaderText = loader?.querySelector("#loader-text");
    if (!loader || !loaderText) return;

    // Show loader
    loader.style.display = "flex";
    loaderText.textContent = "0%";

    let percent = 0;
    const interval = setInterval(() => {
      if (percent < 95) {
        percent++;
        loaderText.textContent = percent + "%";
      }
    }, 40);

    // Function to finish loader
    function finishLoader() {
      clearInterval(interval);
      loaderText.textContent = "100%";
      setTimeout(() => {
        loader.style.display = "none";
      }, 300);
    }

    // Listen for first frame
    function onFirstFrame() {
      finishLoader();
      videoElem.removeEventListener("loadeddata", onFirstFrame);
    }

    videoElem.addEventListener("loadeddata", onFirstFrame); // fires when first frame is loaded

    // Fallback: hide after 10s max
    setTimeout(finishLoader, 10000);
  }

  function renderVideoNotReady(data = {}) {
    const files = Array.isArray(data.filedetails)
      ? data.filedetails
      : Array.isArray(data.fileDetails)
        ? data.fileDetails
        : [];
  
    const count = files.length;
    const plural = count === 1 ? 'recording' : 'recordings';
  
    const listHtml = count
      ? `<ol class="recording-list">
          ${files.map((f, i) => {
            const name = `${f.fileName || ''}${f.fileType ? '.' + f.fileType : ''}`;
            const ext  = (f.fileType || '').toUpperCase();
            const signedUrl = f.isSegmentProcessed ? f.signedUrl : '';
            return `
              <li class="recording-item">
                <span class="idx">${i + 1}</span>
                <span class="file">${name}</span>
                ${ext ? `<span class="badge text-bg-light ext">${ext}</span>` : ''}
                ${signedUrl && `<button class="view-recording-btn" data-video-url="${signedUrl}" aria-label="View recording ${name}">
                  <i class="fas fa-eye"></i>
                </button>`}
              </li>`;
          }).join('')}
        </ol>`
      : `<div class="mt-2 tiny">No uploaded recordings found yet.</div>`;
  
    const html = `
      <div class="video-status" role="status" aria-live="polite">
        <div class="title-row">
          <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          <span>Video Processing in Progress</span>
        </div>
        <div class="subtitle">
          We have identified <strong>${count}</strong> ${plural}. The consolidated video will be available shortly.
        </div>
        ${listHtml}
        <div class="actions">
          <button id="refresh-video" type="button" class="btn btn-sm btn-primary">Refresh</button>
          <div class="tiny">Please allow some time for processing and refresh the page. The video will be accessible shortly.</div>
          <div class="tiny">If the student is still in progress, you may complete the video processing by clicking the video complete button.</div>
        </div>
      </div>
    `;
  
    $("#video-not-available").html(html).removeClass("d-none");
  }

  function setupVideoDownload() {
    try {
      // Find all download buttons using jQuery
      const $downloadBtns = $('.plyr__controls .plyr__control[data-plyr="download"]');
      
      if ($downloadBtns.length > 0 && currentVideoUrl) {
        // Remove any existing click handlers and add new one
        $downloadBtns.off('click.customDownload').on('click.customDownload', function(event) {
          event.preventDefault();
          event.stopPropagation();
          
          if (currentVideoUrl) {
            // Open video in new tab for download
            window.open(currentVideoUrl, '_blank');
          } else {
            toastr.error('Video URL not available for download');
          }
        });
      }
    } catch (error) {
      console.log('Download button not found or not ready yet');
    }
  }

  function setupSegmentVideoDownload() {
    try {
      // Find all download buttons in segment video popup using jQuery
      const $downloadBtns = $('#segmentVideoPopup .plyr__controls .plyr__control[data-plyr="download"]');

      if ($downloadBtns.length > 0) {
        // Remove any existing click handlers and add new one
        $downloadBtns.off('click.segmentDownload').on('click.segmentDownload', function (event) {
          event.preventDefault();
          event.stopPropagation();

          // Get the current video source from the segment player
          if (segmentPlayer && segmentPlayer.source && segmentPlayer.source.sources && segmentPlayer.source.sources[0]) {
            const videoUrl = segmentPlayer.source.sources[0].src;
            if (videoUrl) {
              // Open video in new tab for download
              window.open(videoUrl, '_blank');
            } else {
              toastr.error('Video URL not available for download');
            }
          } else {
            toastr.error('Video URL not available for download');
          }
        });
      }
    } catch (error) {
      console.log('Segment video download button not found or not ready yet');
    }
  }

  function initializeGrid(data) {
    const $gridDiv = $("#anomaly-table");

    $gridDiv.empty();

    const rowData = data
      .map((anomaly) => {
        // Convert time to HH:MM:SS format
        const totalSeconds = Math.floor(anomaly.time);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        // Determine anomaly types
        const types = [];
        if (anomaly.detection.includes("NotLookingAtScreen"))
          types.push("Not Looking Screen");
        if (anomaly.detection.includes("multipleFaces"))
          types.push("Multiple Faces Detected");
        if (anomaly.detection.includes("userNotDetected"))
          types.push("User Not Detected");
        if (anomaly.detection.includes("faceMismatch"))
          types.push("Face Mismatch");
        if (anomaly.detection.includes("NotFacingScreen"))
          types.push("Not Facing Screen");
        if (anomaly.detection.includes("phoneDetected"))
          types.push("Phone Detected");
        if (anomaly.detection.includes("headphoneDetected"))
          types.push("Headphone Detected");
        if (anomaly.detection.includes("noiseDetected"))
          types.push("Noise Detected");

        // If no anomaly types detected, return nothing
        if (types.length === 0) return null;

        // Determine severity based on number of anomalies
        let severity = "Low";
        if (types.length >= 3) severity = "High";
        else if (types.length === 2) severity = "Moderate";

        return {
          time: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
            2,
            "0"
          )}:${String(seconds).padStart(2, "0")}`,
          typesOfAnomaly: types.join(" | "),
          description: types
            .map((t) => {
              if (t === "Not Looking Screen")
                return "Student not looking at the screen.";
              if (t === "Multiple Faces Detected")
                return "Presence of another person in the camera view.";
              if (t === "User Not Detected")
                return "Student was not detected in the camera view.";
              if (t === "Noise Detected")
                return "Background noise detected during the exam.";
            })
            .join(" | "),
          severityLevel: severity,
        };
      })
      .filter((item) => item !== null);
    gridOptions = {
      columnDefs: [
        {
          field: "time",
          headerName: "Time",
          sortable: true,
          width: 120,
          sort: "asc",
          headerClass: "header-cell",
        },
        {
          field: "typesOfAnomaly",
          headerName: "Types of Anomaly",
          width: 300,
          headerClass: "header-cell",
          sortable: false,
        },
        {
          field: "description",
          headerName: "Description",
          flex: 1,
          headerClass: "header-cell",
          sortable: false,
        },
        {
          field: "severityLevel",
          headerName: "Severity Level",
          width: 150,
          headerClass: "header-cell",
          cellRenderer: (params) => {
            const severity = params.value.toLowerCase();
            const classNames = {
              high: "high",
              moderate: "moderate",
              low: "low",
            };
            const classValue = classNames[severity];
            return `
                          <div class="highlight ${classValue}">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                                  <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" />
                              </svg>
  
                              ${params.value}
                          </div>
                      `;
          },
        },
        {
          field: "action",
          headerName: "Action",
          width: 100,
          headerClass: "header-cell",
          filter: false,
          cellRenderer: (params) => {
            return `
                        <div class="action-play" data-time="${params.data.time}"> 
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="0.8" stroke="currentColor" class="size-6">
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
                              </svg>
  
                        </div>
                      `;
          },
          onCellClicked: (params) => {
            if (params.event.target.closest(".action-play")) {
              const timeStr =
                params.event.target.closest(".action-play").dataset.time;
              const [hours, minutes, seconds] = timeStr.split(":").map(Number);
              const timeInSeconds = hours * 3600 + minutes * 60 + seconds;

              const popup = document.getElementById("videoPopup");
              const closeBtn = document.getElementById("closePopup");
              const rewatchBtn = document.getElementById("rewatchBtn");

              // Function to play video segment using Plyr
              function playVideoSegment() {
                if (popupPlayer) {
                  popupPlayer.currentTime = timeInSeconds;
                  popupPlayer.play();

                  // Stop after 2 seconds
                  setTimeout(() => {
                    popupPlayer.pause();
                  }, 2000);
                }
              }

              // Show popup and play
              popup.classList.add("active");
              playVideoSegment();

              // Manual close function
              function closePopup() {
                popup.classList.remove("active");
                if (popupPlayer) {
                  popupPlayer.pause();
                }
              }

              // Rewatch button event listener
              rewatchBtn.onclick = playVideoSegment;

              // Close button event listener
              closeBtn.onclick = closePopup;

              // Close on clicking outside
              popup.onclick = (e) => {
                if (e.target === popup) {
                  closePopup();
                }
              };
            }
          },
        },
      ],
      rowData: rowData,
      // rowData: [
      //   {
      //     time: "10:10:30",
      //     typesOfAnomaly: "Face Not Visible",
      //     description: "Student's face is out of frame for an extended period.",
      //     severityLevel: "Moderate",
      //   },
      //   {
      //     time: "10:10:30",
      //     typesOfAnomaly: "Momentary Face Out of Frame",
      //     description: "Student's face is out of frame for an extended period.",
      //     severityLevel: "Low",
      //   },
      //   {
      //     time: "10:10:30",
      //     typesOfAnomaly: "Multiple Faces Detected",
      //     description: "Presence of another person in the camera view.",
      //     severityLevel: "High",
      //   },
      //   {
      //     time: "10:10:30",
      //     typesOfAnomaly: "Background Conversations",
      //     description: "Clear signs of someone providing answers.",
      //     severityLevel: "High",
      //   },
      //   {
      //     time: "10:10:30",
      //     typesOfAnomaly: "Sudden Microphone Muting",
      //     description: "Muting the mic for extended periods without reason.",
      //     severityLevel: "Moderate",
      //   },
      //   {
      //     time: "10:10:30",
      //     typesOfAnomaly: "Unintentional Mute/Unmute",
      //     description:
      //       "The student mutes/unmutes accidentally but resumes normal.",
      //     severityLevel: "Low",
      //   },
      //   {
      //     time: "10:10:30",
      //     typesOfAnomaly: "Temporary Background Noise",
      //     description: "Minor noises like a door closing or distant sounds.",
      //     severityLevel: "Low",
      //   },
      //   {
      //     time: "10:10:30",
      //     typesOfAnomaly: "Lip Movement Without Speaking",
      //     description: "The student appears to be silently reading or signaling.",
      //     severityLevel: "High",
      //   },
      //   {
      //     time: "10:10:30",
      //     typesOfAnomaly: "Sudden disconnection",
      //     description: "Student lost connection multiple times",
      //     severityLevel: "Moderate",
      //   },
      // ],
      defaultColDef: {
        resizable: true,
        sortable: true,
        filter: true,
      },
      rowHeight: 56,
      headerHeight: 48,
      suppressMovableColumns: true,
      suppressCellSelection: true,
      domLayout: "autoHeight",
    };

    $gridDiv.addClass("ag-theme-alpine");

    if (anomalyGrid) {
      anomalyGrid.destroy();
    }
    anomalyGrid = new agGrid.Grid($gridDiv[0], gridOptions);
  }

  function generateTimelineColumns(duration, violations) {
    const $timeline = $(".timeline-chart");
    $timeline.empty();

    // If no duration, return early
    if (!duration) return;

    // Create timeline data structure
    const timelineData = processViolationsData(duration, violations);

    // Create HTML structure
    const timelineHtml = createTimelineHTML(timelineData);

    $timeline.append(timelineHtml);

    // Set up click handlers for the violation bars
    setupViolationBarClickHandlers();
  }

  function processViolationsData(duration, violations) {
    const violationTypes = [
      { id: "NotLookingAtScreen", label: "Looking Away", color: "#f30000" },
      { id: "multipleFaces", label: "Multiple People", color: "#f59e0b" },
      { id: "userNotDetected", label: "Face Not Detected/Blurred", color: "#22c55e" },
      { id: "NotFacingScreen", label: "Face Not Straight", color: "#840bf5" },
      { id: "faceMismatch", label: "Unregistered Face", color: "#0b94f5" },
      { id: "phoneDetected", label: "Electronic Device Detected", color: "#6366f1" },
      { id: "noiseDetected", label: "Noise Detected", color: "#390c82" },
    ];

    const timeIntervals = [];
    const minDuration = Math.max(180, duration);
    const intervalSizeSeconds = duration > 300 ? 300 : 60; // 5 minute intervals

    for (let i = 0; i <= minDuration; i += intervalSizeSeconds) {
      timeIntervals.push(i);
    }

    const segmentsByType = {};

    violationTypes.forEach((type) => {
      segmentsByType[type.id] = [];
    });

    const violationsBySecond = violations.reduce((acc, violation) => {
      const second = Math.floor(parseFloat(violation.time));
      acc[second] = acc[second] || new Set();
      violation.detection.forEach((type) => acc[second].add(type));
      return acc;
    }, {});

    violationTypes.forEach((type) => {
      let currentSegment = null;

      for (let second = 0; second <= duration; second++) {
        const hasViolation = violationsBySecond[second]?.has(type.id) || false;

        if (hasViolation && !currentSegment) {
          currentSegment = {
            startTime: second,
            endTime: second,
          };
        } else if (hasViolation && currentSegment) {
          currentSegment.endTime = second;
        } else if (!hasViolation && currentSegment) {
          segmentsByType[type.id].push({ ...currentSegment });
          currentSegment = null;
        }
      }

      if (currentSegment) {
        segmentsByType[type.id].push({ ...currentSegment });
      }
    });

    return {
      timeIntervals,
      violationTypes,
      segmentsByType,
      duration: minDuration,
    };
  }

  function createTimelineHTML(timelineData) {
    const { timeIntervals, violationTypes, segmentsByType, duration } =
      timelineData;

    // Calculate a minimum width based on duration - ensuring each minute has enough space
    const minutesTotal = Math.ceil(duration / 60);
    const minPixelsPerMinute = 10; // Each minute should be at least 50px wide (reduced from 100px)
    const calculatedMinWidth = Math.max(minutesTotal * minPixelsPerMinute, 1000); // At least 1000px

    const timelineWidth = "100%";
    const rowHeight = 40;

    const timeMarkersHtml = timeIntervals
      .map((seconds) => {
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        const remainingSeconds = seconds % 60;
        const displayTime = `${String(hours).padStart(2, "0")}:${String(
          remainingMinutes
        ).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
        const position = (seconds / duration) * 100;

        return `
        <div class="time-marker" style="left: ${position}%;">
          ${displayTime}
        </div>
      `;
      })
      .join("");

    const violationRowsHtml = violationTypes
      .map((type) => {
        const segments = segmentsByType[type.id];

        const barsHtml = segments
          .map((segment) => {
            const startPercent = (segment.startTime / duration) * 100;
            const endPercent = (segment.endTime / duration) * 100;
            const width = endPercent - startPercent;

            return `
          <div class="violation-bar" 
               data-start="${segment.startTime}"
               data-end="${segment.endTime}"
               data-type="${type.id}"
               style="left: ${startPercent}%; width: ${width}%; background-color: ${type.color};">
          </div>
        `;
          })
          .join("");

        return `
        <div class="timeline-row">
          <div class="violation-label">${type.label}</div>
          <div class="violation-bars-container">
            ${barsHtml}
          </div>
        </div>
      `;
      })
      .join("");

    return `
      <div class="timeline-wrapper" data-duration="${duration}" style="min-width: ${calculatedMinWidth}px;">
        <div class="timeline-header">
          <div class="timeline-header-spacer"></div>
          <div class="timeline-time-axis">
            ${timeMarkersHtml}
          </div>
        </div>
        <div class="timeline-body">
          ${violationRowsHtml}
        </div>
      </div>
    `;
  }

  function setupViolationBarClickHandlers() {
    $(".violation-bar").on("click", function () {
      const startTime = parseInt($(this).data("start"));

      if (mainPlayer) {
        mainPlayer.currentTime = startTime;
        mainPlayer.play();
      }

      $(".violation-bar").removeClass("selected");
      $(this).addClass("selected");
    });
  }

  if (mainPlayer) {
    mainPlayer.off("timeupdate");

    mainPlayer.on("timeupdate", function () {
      const currentSecond = Math.floor(mainPlayer.currentTime);
      const $timelineWrapper = $(".timeline-wrapper");

      if ($timelineWrapper.length) {
        const duration = parseInt(
          $timelineWrapper.attr("data-duration") || 180
        );
        const position = (currentSecond / duration) * 100;

        let $headerIndicator = $(".timeline-time-axis .current-time-indicator");

        if (!$headerIndicator.length) {
          $headerIndicator = $('<div class="current-time-indicator"></div>');
          $(".timeline-time-axis").append($headerIndicator);
        }
        $headerIndicator.css("left", position + "%");

        if (!isUserScrolling) {
          const container = $(".timeline-chart")[0];
          if (container) {
            const containerWidth = container.clientWidth;
            const totalWidth = $timelineWrapper[0].scrollWidth;
            const targetPosition =
              (position / 100) * totalWidth - containerWidth / 2;

            if (
              targetPosition > 0 &&
              targetPosition < totalWidth - containerWidth
            ) {
              container.scrollLeft = targetPosition;
            }
          }
        }
      }
    });
  }

  function handleExportExcel() {
    if (!gridOptions?.api) {
      console.error("Grid not initialized");
      return;
    }

    const rowData = gridOptions.api
      .getModel()
      .rowsToDisplay.map((row) => row.data);

    if (rowData.length === 0) {
      alert("No data to export");
      return;
    }

    // Create CSV content
    const csvContent = [
      ["Time", "Types of Anomaly", "Description", "Severity Level"].join(","),
      ...rowData.map((row) => {
        return [
          `"${row.time.replace(/"/g, '""')}"`,
          `"${row.typesOfAnomaly.replace(/"/g, '""')}"`,
          `"${row.description.replace(/"/g, '""')}"`,
          `"${row.severityLevel.replace(/"/g, '""')}"`,
        ].join(",");
      }),
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const examName = $("#exam-name")
      .text()
      .replace(/[/\\?%*:|"<>]/g, "_")
      .replace(/ /g, "_");
    const studentName = $(".student-name")
      .text()
      .replace(/[/\\?%*:|"<>]/g, "_")
      .replace(/ /g, "_");
    const fileName = `AnomalyReport_${examName}_${studentName}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function showVideoGenerationPopup(attender, examId) {
    const backdrop = document.createElement("div");
    backdrop.className = "confirmation-backdrop";
    document.body.appendChild(backdrop);
  
    const popup = document.createElement("div");
    popup.className = "video-generation-dialog";
    popup.innerHTML = `
      <div class="video-generation-header">
        <i class="bx bx-video"></i>
        <h3>Generate Exam Video</h3>
      </div>
      <div class="video-generation-body">
        <div class="video-generation-warning">
          <div class="warning-icon">
            <i class="bx bx-error-circle"></i>
          </div>
          <div class="warning-message">
            <p><strong>Warning:</strong> Generating this video will <strong>immediately stop the ongoing exam</strong>. The student will not be able to continue writing or accessing this exam.</p>
            <p>Type "CONFIRM" in the box below to proceed.</p>
          </div>
        </div>
        <div class="confirm-input-container">
          <input type="text" id="confirm-text" placeholder="Type CONFIRM here" class="confirm-input">
        </div>
      </div>
      <div class="video-generation-actions">
        <button class="close-btn">Cancel</button>
        <button class="generate-btn" id="generate-video-btn" disabled>
          Generate Video
        </button>
      </div>
    `;
    document.body.appendChild(popup);
  
    setTimeout(() => {
      backdrop.classList.add("active");
      popup.classList.add("active");
    }, 10);
  
    const closePopup = () => {
      backdrop.classList.remove("active");
      popup.classList.remove("active");
      setTimeout(() => {
        document.body.removeChild(backdrop);
        document.body.removeChild(popup);
      }, 300);
    };
  
    $(popup).find(".close-btn").on("click", closePopup);
    $(backdrop).on("click", closePopup);
    
    // Enable/disable generate button based on input
    $("#confirm-text").on("input", function() {
      const confirmText = $(this).val().trim();
      $("#generate-video-btn").prop("disabled", confirmText !== "CONFIRM");
    });
  
    $("#generate-video-btn").on("click", function() {
      
      const generateBtn = $(this);
      const originalText = generateBtn.html();
      generateBtn.prop("disabled", true);
      generateBtn.html('<i class="bx bx-loader-alt bx-spin"></i> Processing...');
      
      const attenderId = attender;
      
      makeApiCall({
        url: `${EXAM_END_POINT}/complete-multipart?entranceExamId=${examId}`,
        method: 'PUT',
        data: JSON.stringify({attenderIds: [attenderId]}),
        successCallback: function(response) {
          toastr.success('Video generation started successfully');
          closePopup();
        },
        errorCallback: function(error) {
          toastr.error('Failed to generate video');
          generateBtn.html(originalText);
          generateBtn.prop("disabled", false);
        }
      });
    });
  }
});
