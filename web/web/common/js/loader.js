let advanceProgressInterval;
let advanceProgressIndex = 0;

document.addEventListener("DOMContentLoaded", function() {
    initializeLoaderSystem();
});

function initializeLoaderSystem() {
    // Remove existing loaders if they exist
    const existingLoader = document.getElementById('loader');
    const existingAdvanceLoader = document.getElementById('advance-loader');
    
    if (existingLoader) existingLoader.remove();
    if (existingAdvanceLoader) existingAdvanceLoader.remove();
    
    // Create basic loader structure
    const basicLoaderHTML = `
        <div id="loader" class="loader-overlay" role="dialog" aria-label="Loading" aria-live="polite">
            <div class="loader-container">
                <div class="loader" aria-hidden="true"></div>
            </div>
        </div>
    `;
    
    // Create advance loader structure
    const advanceLoaderHTML = `
        <div id="advance-loader" class="unified-loader-overlay" role="dialog" aria-label="Loading" aria-live="polite">
            <div class="unified-loader-container">
                <div class="unified-loader-icon" id="advance-loader-icon">📚</div>
                <div class="unified-loader-spinner"></div>
                <div class="unified-loader-title" id="advance-loader-title">Loading...</div>
                <div class="unified-loader-subtitle" id="advance-loader-subtitle">Please wait while we process your request...</div>
                <div class="unified-loader-progress" id="advance-progress-text" style="display: none;"></div>
                <div class="unified-loader-dots">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', basicLoaderHTML);
    document.body.insertAdjacentHTML('beforeend', advanceLoaderHTML);
}

function showLoader(show = true) {
    if (!document.getElementById('loader')) {
        initializeLoaderSystem();
    }
    
    if (show) {
        $('#loader').fadeIn(300);
    } else {
        $('#loader').fadeOut(300);
    }
}


function showAdvanceLoader(type = 'exam', options = {}) {
    if (!document.getElementById('advance-loader')) {
        initializeLoaderSystem();
    }
    
    const config = getLoaderConfig(type, options);
    
    updateLoaderContent(config);
    
    if (config.progressMessages && config.progressMessages.length > 0) {
        startAdvanceProgressMessages(config.progressMessages, config.progressInterval);
    }
    
    $('#advance-loader').fadeIn(400);
}

function hideAdvanceLoader() {
    clearAdvanceProgressMessages();
    $('#advance-loader').fadeOut(400);
}

function getLoaderConfig(type, options) {
    const configs = {
        'exam-list': {
            icon: '📝',
            iconClass: 'exam-list-loader',
            title: options.title || 'Fetching Exam List',
            subtitle: options.subtitle || 'Loading available assessments for your account...',
            progressMessages: options.progressMessages || [
                'Fetching scheduled assessments...',
                'Establishing secure connection...',
                'Querying exam database...',
                'Applying user access filters...',
                'Rendering exam list interface...'
            ],
            progressInterval: 1000
        },
    
        'exam-report': {
            icon: '📄',
            iconClass: 'exam-report-loader',
            title: options.title || 'Loading Exam Report',
            subtitle: options.subtitle || 'Retrieving performance data and charts...',
            progressMessages: options.progressMessages || [
                'Accessing report storage...',
                'Fetching evaluation metrics...',
                'Compiling student performance data...',
                'Loading report visuals and graphs...',
                'Rendering final report view...'
            ],
            progressInterval: 1000
        },
    
        'exam-report-generation': {
            icon: '📊',
            iconClass: 'report-generation-loader',
            title: options.title || 'Generating Exam Report',
            subtitle: options.subtitle || 'Analyzing and compiling assessment insights...',
            progressMessages: options.progressMessages || [
                'Analyzing question-wise performance...',
                'Processing student behavior patterns...',
                'Calculating statistics and trends...',
                'Generating AI-driven insights...',
                'Compiling final report data...',
                'Preparing downloadable report...'
            ],
            progressInterval: 1200
        }
    };
    
    return configs[type] || configs.exam;
}

function updateLoaderContent(config) {
    const iconElement = document.getElementById('advance-loader-icon');
    const titleElement = document.getElementById('advance-loader-title');
    const subtitleElement = document.getElementById('advance-loader-subtitle');
    
    if (iconElement) {
        iconElement.textContent = config.icon;
        iconElement.className = `unified-loader-icon ${config.iconClass}`;
    }
    
    if (titleElement) {
        titleElement.textContent = config.title;
    }
    
    if (subtitleElement) {
        subtitleElement.textContent = config.subtitle;
    }
}

function startAdvanceProgressMessages(messages, interval = 1000) {
    const progressElement = document.getElementById('advance-progress-text');
    if (!progressElement || !messages || messages.length === 0) return;
    
    progressElement.style.display = 'block';
    advanceProgressIndex = 0;
    progressElement.textContent = messages[0];
    
    advanceProgressInterval = setInterval(() => {
        advanceProgressIndex++;
        if (advanceProgressIndex < messages.length) {
            progressElement.textContent = messages[advanceProgressIndex];
        } else {
            clearAdvanceProgressMessages();
        }
    }, interval);
}

function clearAdvanceProgressMessages() {
    if (advanceProgressInterval) {
        clearInterval(advanceProgressInterval);
        advanceProgressInterval = null;
    }
    advanceProgressIndex = 0;
}