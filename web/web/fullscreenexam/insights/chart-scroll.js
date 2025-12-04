/**
 * Chart Scrolling Enhancement Script
 * This script adds horizontal scrolling capabilities to ApexCharts
 * and fixes tooltip visibility issues.
 */

// Function to enable horizontal scrolling for charts
function enableChartScrolling() {
  // Find the tag performance chart container
  const chartContainer = document.getElementById('tagPerformanceChart');
  if (!chartContainer) return;
  
  // Apply scrolling styles
  chartContainer.style.overflowX = 'auto';
  chartContainer.style.overflowY = 'hidden';
  chartContainer.style.maxWidth = '100%';
  chartContainer.style.paddingBottom = '15px'; // Add padding for scrollbar
  
  // Add scroll indicator
  const scrollIndicator = document.createElement('div');
  scrollIndicator.className = 'chart-scroll-indicator';
  scrollIndicator.innerHTML = `
    <div style="text-align: center; font-size: 12px; color: #666; margin-top: 5px;">
      <i class="fas fa-arrows-alt-h"></i> Scroll horizontally to see more data
    </div>
  `;
  chartContainer.parentNode.insertBefore(scrollIndicator, chartContainer.nextSibling);
  
  // Apply global CSS for better chart display
  const style = document.createElement('style');
  style.textContent = `
    .chart-container {
      overflow-x: auto !important;
      max-width: 100% !important;
    }
    #tagPerformanceChart {
      overflow-x: auto !important;
      overflow-y: hidden !important;
      max-width: 100% !important;
    }
    .apexcharts-canvas {
      overflow: visible !important;
    }
    .apexcharts-tooltip {
      z-index: 1000 !important;
      overflow: visible !important;
      background-color: rgba(0, 0, 0, 0.8) !important;
      border-radius: 5px !important;
      box-shadow: 0 3px 10px rgba(0,0,0,0.2) !important;
      max-width: 350px !important;
      width: auto !important;
      min-width: 200px !important;
    }
    .apexcharts-tooltip-title {
      white-space: normal !important;
      overflow-wrap: break-word !important;
      word-break: break-word !important;
      width: auto !important;
      max-width: 300px !important;
    }
  `;
  document.head.appendChild(style);
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait for charts to be rendered
  setTimeout(enableChartScrolling, 1000);
}); 