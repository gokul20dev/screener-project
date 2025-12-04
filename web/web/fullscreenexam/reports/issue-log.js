let issuesData = [];

function fetchIssuesData() {
  makeApiCall({
    url: EXAM_ATTENDER_END_POINT + "/critical-log?examId="+ examId,
    method: "GET",
    successCallback: function(response){
      issuesData = transformIssuesData(response.data);
      updateIssuesCount();
    },
    errorCallback: function(error){
      console.log(error);
    }
  });
}

function transformIssuesData(data) {
  const transformedIssues = [];
  
  data.forEach((attendee) => {
    if (attendee.logs && attendee.logs.length > 0) {
      const sortedLogs = [...attendee.logs].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      const latestLog = sortedLogs[0];
      
      transformedIssues.push({
        id: attendee.attenderId,
        user: attendee.mail,
        description: latestLog.message,
        timestamp: latestLog.timestamp,
        type: mapLogTypeToUICategory(latestLog.type),
        stuckAt: attendee.stuckAt
      });
    }
  });
  
  return transformedIssues;
}

function mapLogTypeToUICategory(logType) {
  if (logType.includes('browser')) {
    return 'browser';
  } else if (logType.includes('webcam') || logType.includes('camera')) {
    return 'camera';
  } else if (logType.includes('screen')) {
    return 'screen';
  } else {
    return 'browser';
  }
}

function updateIssuesCount() {
  $("#issues-count").text(issuesData.length);
  
  if (issuesData.length > 0) {
    $("#issues-alert-btn").css("animation", "blink-attention 2s infinite");
  } else {
    $("#issues-alert-btn").css("animation", "none");
  }
}

function formatIssueTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  } else {
    return date.toLocaleString();
  }
}

function showIssuesPopup() {
  const backdrop = document.createElement("div");
  backdrop.id = "issues-popup-backdrop";
  backdrop.className = "issues-popup-backdrop";
  document.body.appendChild(backdrop);
  
  const popup = document.createElement("div");
  popup.id = "issues-popup";
  popup.className = "issues-popup";
  
  // Sort issues by timestamp
  const sortedIssues = [...issuesData].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  
  // Filter issues by type
  const browserIssues = sortedIssues.filter(issue => issue.type === 'browser');
  const cameraIssues = sortedIssues.filter(issue => issue.type === 'camera');
  const screenIssues = sortedIssues.filter(issue => issue.type === 'screen');
  
  popup.innerHTML = `
    <div class="issues-popup-header">
      <i class="bx bx-error-circle"></i>
      <h3>System Issues</h3>
    </div>
    <div class="issues-popup-body">
      <div class="search-container">
        <input type="text" class="search-input" placeholder="Search issues..." id="issue-search">
      </div>
      <div class="logs-tabs">
        <button class="log-tab active" data-tab="all">
          All Issues 
          <span class="tab-count ${sortedIssues.length > 0 ? 'has-issues' : ''}">${sortedIssues.length}</span>
        </button>
        <button class="log-tab" data-tab="browser">
          Browser Issues
          <span class="tab-count ${browserIssues.length > 0 ? 'has-issues' : ''}">${browserIssues.length}</span>
        </button>
        <button class="log-tab" data-tab="camera">
          Camera Permission
          <span class="tab-count ${cameraIssues.length > 0 ? 'has-issues' : ''}">${cameraIssues.length}</span>
        </button>
        <button class="log-tab" data-tab="screen">
          Screen Share
          <span class="tab-count ${screenIssues.length > 0 ? 'has-issues' : ''}">${screenIssues.length}</span>
        </button>
      </div>
      <div class="logs-content active" id="all-issues">
        <div class="issues-list"></div>
      </div>
      <div class="logs-content" id="browser-issues">
        <div class="issues-list"></div>
      </div>
      <div class="logs-content" id="camera-issues">
        <div class="issues-list"></div>
      </div>
      <div class="logs-content" id="screen-issues">
        <div class="issues-list"></div>
      </div>
    </div>
    <div class="issues-popup-footer">
      <button class="close-btn">Close</button>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  const closePopup = () => {
    backdrop.classList.remove("active");
    popup.classList.remove("active");
    setTimeout(() => {
      document.body.removeChild(backdrop);
      document.body.removeChild(popup);
    }, 300);
  };
  
  popup.querySelector(".close-btn").addEventListener("click", closePopup);
  backdrop.addEventListener("click", closePopup);
  
  const tabs = popup.querySelectorAll('.log-tab');
  const contents = popup.querySelectorAll('.logs-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const tabId = tab.dataset.tab;
      contents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabId}-issues`) {
          content.classList.add('active');
        }
      });
    });
  });
  
  requestAnimationFrame(() => {
    backdrop.classList.add("active");
    popup.classList.add("active");
  });
  
  const createIssueItem = (issue) => {
    const typeClass = `${issue.type}-issue`;
    const iconClass = `${issue.type}-icon`;
    
    return `
      <div class="issue-item ${typeClass}">
        <div class="issue-icon ${iconClass}">
          <i class="bx ${getIssueTypeIcon(issue.type)}"></i>
        </div>
        <div class="issue-content">
          <div class="issue-user-container">
            <div class="issue-user">${issue.user}</div>
            <button class="view-log-btn" data-attendee-id="${issue.id}">View Log</button>
          </div>
          <div class="issue-description">${issue.description}</div>
          <div class="issue-timestamp">${formatIssueTime(issue.timestamp)}</div>
          ${issue.stuckAt ? `<div class="issue-stuck-at">Stuck at: ${issue.stuckAt}</div>` : ''}
        </div>
      </div>
    `;
  };
  
  function getIssueTypeIcon(type) {
    switch(type) {
      case 'browser': return 'bx-window-alt';
      case 'camera': return 'bx-camera-off';
      case 'screen': return 'bx-desktop';
      default: return 'bx-error';
    }
  }
  
  function viewDetailedLog(attendeeId) {
    closePopup();
    
    setTimeout(() => {
      renderFullLog(attendeeId);
    }, 350);
  }
  
  function updateTabContent(tabId, issues) {
    const container = popup.querySelector(`#${tabId}-issues .issues-list`);
    
    if (issues.length === 0) {
      container.innerHTML = `
        <div class="no-issues">
          <i class="bx bx-check-circle"></i>
          <p>No issues reported at this time.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    issues.forEach(issue => {
      container.innerHTML += createIssueItem(issue);
    });
  }
  
  updateTabContent('all', sortedIssues);
  updateTabContent('browser', browserIssues);
  updateTabContent('camera', cameraIssues);
  updateTabContent('screen', screenIssues);
  
  // Add search functionality
  const searchInput = popup.querySelector('#issue-search');
  searchInput.addEventListener('input', function() {
    const searchText = this.value.toLowerCase();
    const activeTab = popup.querySelector('.log-tab.active').dataset.tab;
    let issuesToFilter;
    
    // Determine which issues to search based on the active tab
    switch(activeTab) {
      case 'browser':
        issuesToFilter = browserIssues;
        break;
      case 'camera':
        issuesToFilter = cameraIssues;
        break;
      case 'screen':
        issuesToFilter = screenIssues;
        break;
      default:
        issuesToFilter = sortedIssues;
    }
    
    // Filter issues based on search text
    const filteredIssues = issuesToFilter.filter(issue => 
      issue.user.toLowerCase().includes(searchText) || 
      issue.description.toLowerCase().includes(searchText) ||
      (issue.stuckAt && issue.stuckAt.toLowerCase().includes(searchText))
    );
    
    // Update the active tab with filtered issues
    const container = popup.querySelector(`#${activeTab}-issues .issues-list`);
    
    if (filteredIssues.length === 0) {
      if (searchText) {
        container.innerHTML = `
          <div class="no-results">
            <i class="bx bx-search-alt"></i>
            <p>No matching issues found.</p>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="no-issues">
            <i class="bx bx-check-circle"></i>
            <p>No issues reported at this time.</p>
          </div>
        `;
      }
      return;
    }
    
    container.innerHTML = '';
    filteredIssues.forEach(issue => {
      container.innerHTML += createIssueItem(issue);
    });
    
    // Reattach event listeners to view log buttons
    setTimeout(() => {
      container.querySelectorAll('.view-log-btn').forEach(button => {
        button.addEventListener('click', function(e) {
          e.stopPropagation();
          const attendeeId = this.getAttribute('data-attendee-id');
          viewDetailedLog(attendeeId);
        });
      });
    }, 100);
  });
  
  // Setup event listeners for view log buttons
  setTimeout(() => {
    popup.querySelectorAll('.view-log-btn').forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        const attendeeId = this.getAttribute('data-attendee-id');
        viewDetailedLog(attendeeId);
      });
    });
  }, 100);
}

$(document).ready(function(){
  examId = new URLSearchParams(window.location.search).get("examid");
    
  $("#issues-alert-btn").click(function() {
    showIssuesPopup();
  });

  fetchIssuesData();
});

function renderFullLog(attendeeId) {
  const attendee = issuesData.find(issue => issue.id === attendeeId);
  
  if (!attendee) {
    console.error("Attendee not found:", attendeeId);
    return;
  }
  
  const backdrop = document.createElement("div");
  backdrop.id = "full-log-backdrop";
  backdrop.className = "issues-popup-backdrop";
  document.body.appendChild(backdrop);
  
  const logPopup = document.createElement("div");
  logPopup.id = "full-log-popup";
  logPopup.className = "issues-popup full-log-popup";
  
  logPopup.innerHTML = `
    <div class="full-log-header">
      <i class="bx ${getIssueTypeIcon(attendee.type)}"></i>
      <div class="attendee-email">${attendee.user}</div>
      <div class="type-badge ${attendee.type}">${getTypeLabel(attendee.type)}</div>
    </div>
    <div class="full-log-content">
      ${attendee.stuckAt ? `
      <div class="stuck-section">
        <div class="log-section-title">
          <i class="bx bx-error-circle"></i>
          Current Status
        </div>
        <div>Student is currently stuck at: <strong>${attendee.stuckAt}</strong></div>
      </div>
      ` : ''}
      
      <div class="log-section">
        <div class="log-section-title">
          <i class="bx ${getSectionIcon(attendee.type)}"></i>
          ${getSectionTitle(attendee.type)}
        </div>
        <div class="log-item">
          <div>${attendee.description}</div>
          <div class="log-timestamp">${formatIssueTime(attendee.timestamp)}</div>
        </div>
        
        ${getTypeSpecificInfo(attendee)}
      </div>
    </div>
    <div class="action-buttons">
      <button class="action-btn close-action">Close</button>
      <button class="action-btn contact-action">Contact Student</button>
    </div>
  `;
  
  document.body.appendChild(logPopup);
  
  const closeLogPopup = () => {
    backdrop.classList.remove("active");
    logPopup.classList.remove("active");
    setTimeout(() => {
      document.body.removeChild(backdrop);
      document.body.removeChild(logPopup);
    }, 300);
  };
  
  logPopup.querySelector(".close-action").addEventListener("click", closeLogPopup);
  backdrop.addEventListener("click", closeLogPopup);
  
  logPopup.querySelector(".contact-action").addEventListener("click", () => {
    alert(`Contacting student: ${attendee.user}`);
  });
  
  requestAnimationFrame(() => {
    backdrop.classList.add("active");
    logPopup.classList.add("active");
  });
  
  function getTypeLabel(type) {
    switch(type) {
      case 'browser': return 'Browser Issue';
      case 'camera': return 'Camera Permission';
      case 'screen': return 'Screen Sharing';
      default: return 'System Issue';
    }
  }
  
  function getSectionIcon(type) {
    switch(type) {
      case 'browser': return 'bx-code-block';
      case 'camera': return 'bx-camera';
      case 'screen': return 'bx-desktop';
      default: return 'bx-info-circle';
    }
  }
  
  function getSectionTitle(type) {
    switch(type) {
      case 'browser': return 'Browser Information';
      case 'camera': return 'Camera Access Details';
      case 'screen': return 'Screen Sharing Status';
      default: return 'System Information';
    }
  }
  
  function getTypeSpecificInfo(attendee) {
    switch(attendee.type) {
      case 'browser':
        return `
          <div class="log-item">
            <div><strong>Troubleshooting Steps:</strong></div>
            <ul>
              <li>Check if the browser is up to date</li>
              <li>Make sure cookies are enabled</li>
              <li>Try disabling browser extensions</li>
              <li>Clear browser cache and cookies</li>
            </ul>
          </div>
        `;
      
      case 'camera':
        return `
          <div class="log-item">
            <div><strong>Camera Permission Steps:</strong></div>
            <ul>
              <li>Check browser permission settings</li>
              <li>Make sure no other application is using the camera</li>
              <li>Verify camera drivers are installed correctly</li>
              <li>Try restarting the browser</li>
            </ul>
          </div>
        `;
      
      case 'screen':
        return `
          <div class="log-item">
            <div><strong>Screen Sharing Steps:</strong></div>
            <ul>
              <li>Check browser permission settings</li>
              <li>Try selecting a specific window instead of entire screen</li>
              <li>Verify there are no security policies blocking screen share</li>
              <li>Try a different browser if available</li>
            </ul>
          </div>
        `;
      
      default:
        return '';
    }
  }
}

function getIssueTypeIcon(type) {
  switch(type) {
    case 'browser': return 'bx-window-alt';
    case 'camera': return 'bx-camera-off';
    case 'screen': return 'bx-desktop';
    default: return 'bx-error';
  }
}
