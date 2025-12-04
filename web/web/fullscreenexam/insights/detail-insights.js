let tagNames = [];
let examTypes = [];
let tagPerformanceData = [];
let examProgressData = {};
let studentsData = [];
let fetchedData = null;

function checkRequiredLibraries() {
  const requiredLibraries = [
    { name: 'html2pdf', object: window.html2pdf },
    { name: 'XLSX', object: window.XLSX },
    { name: 'JSZip', object: window.JSZip },
    { name: 'ApexCharts', object: window.ApexCharts }
  ];
  
  const missingLibraries = requiredLibraries.filter(lib => !lib.object);
  
  if (missingLibraries.length > 0) {
    const missingNames = missingLibraries.map(lib => lib.name).join(', ');
    showToast(`Some export functions may not work due to missing libraries: ${missingNames}`, "warning");
    return false;
  }
  
  return true;
}

async function fetchAndProcessData() {
  $("#exam-count").text("...");
  $("#student-count").text("...");
  $("#tag-count").text("...");
  $("#question-count").text("...");
  
  $("#insight-name").text("Loading...");
  $("#insight-description").text("Loading insight data...");
  $("#insight-last-updated").text("Last updated: Loading...");
  $("#insight-status").text("Status: Loading...");
  $("#insight-status-badge").text("Loading").removeClass("bg-warning bg-success bg-danger").addClass("bg-secondary");

  const url = INSIGHT_END_POINT  + '?insightId=' + window.location.search.split('id=')[1];

  makeApiCall({
    method: 'get',  
    url: url,
    successCallback: function(data){
      updateInsightInfo(data?.data);
      processJsonData(data?.data?.report);
      initializeDashboard();
    },
    errorCallback: function(error){
      $("#exam-count").text("0");
      $("#student-count").text("0");
      $("#tag-count").text("0");
      $("#question-count").text("N/A");
      
      $("#insight-name").text("Error");
      $("#insight-description").text("Could not load insight data");
      $("#insight-last-updated").text("Last updated: N/A");
      $("#insight-status").text("Status: Error");
      $("#insight-status-badge").text("Error").removeClass("bg-warning bg-success bg-secondary").addClass("bg-danger");

      $("#main-content").html(`
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Failed to load data. Please try refreshing the page.
        </div>
    `);
    }
  });
}

function updateInsightInfo(data) {
  if (!data) return;
  
  if (data.name) {
    $("#insight-name").text(data.name);
  }
  
  if (data.description) {
    $("#insight-description").text(data.description);
  }
  
  if (data.updatedAt) {
    let lastUpdated = data.updatedAt;
    if (typeof lastUpdated === 'number' || !isNaN(Date.parse(lastUpdated))) {
      const date = new Date(lastUpdated);
      lastUpdated = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    $("#insight-last-updated").text("Last updated: " + lastUpdated);
  }
  
  if (data.generatedStatus) {
    $("#insight-status").text("Status: " + data.generatedStatus);
    
    const statusBadge = $("#insight-status-badge");
    statusBadge.text(data.generatedStatus);
    
    statusBadge.removeClass("bg-warning bg-success bg-danger bg-secondary");
    
    const status = data.generatedStatus;
    if (status === "generated") {
      statusBadge.addClass("bg-success");
    } else if (status === "pending" ) {
      statusBadge.addClass("bg-warning");
    } else {
      statusBadge.addClass("bg-secondary");
    }
  }
}

function processJsonData(data) {
  examTypes = data?.map((exam) => exam?.name);

  const allTags = new Set();
  data?.forEach((exam) => {
    exam.students.forEach((student) => {
      student.tags.forEach((tag) => {
        allTags.add(tag.name);
      });
    });
  });

  tagNames = [...allTags];

  tagNames.forEach((tag) => {
    examProgressData[tag] = Array(examTypes.length).fill(null);
  });

  const studentMap = new Map();
  const uniqueStudentEmails = new Set();
  const uniqueTagQuestions = new Map();

  data?.forEach((exam, examIndex) => {
    const tagScores = {};
    const tagCounts = {};

    exam.students.forEach((student) => {
      uniqueStudentEmails.add(student.name);
      
      student.tags.forEach((tag) => {
        const uniqueKey = `${exam.id}_${tag.id}`;
        if (tag.no_questions && !uniqueTagQuestions.has(uniqueKey)) {
          uniqueTagQuestions.set(uniqueKey, tag.no_questions);
        }

        if (!tagScores[tag.name]) {
          tagScores[tag.name] = 0;
          tagCounts[tag.name] = 0;
        }
        
        tagScores[tag.name] += tag.score;
        tagCounts[tag.name]++;
        
        const studentEmail = student.name;
        
        if (!studentMap.has(studentEmail)) {
          studentMap.set(studentEmail, {
            id: student.id,
            name: student.name,
            tagScores: {},
            examScores: {},
            tagCounts: {},
          });
        }
        
        const existingStudent = studentMap.get(studentEmail);
        
        existingStudent.examScores = existingStudent.examScores || {};
        if (!existingStudent.examScores[exam.name]) {
          existingStudent.examScores[exam.name] = {};
        }
        existingStudent.examScores[exam.name][tag.name] = tag.score;
        
        existingStudent.tagScores[tag.name] = existingStudent.tagScores[tag.name] || 0;
        existingStudent.tagCounts[tag.name] = existingStudent.tagCounts[tag.name] || 0;
        
        existingStudent.tagScores[tag.name] += tag.score;
        existingStudent.tagCounts[tag.name]++;
      });
    });

    for (const tagName in tagScores) {
      if (tagCounts[tagName] > 0) {
        const avgScore = tagScores[tagName] / tagCounts[tagName];
        examProgressData[tagName][examIndex] = avgScore.toFixed(2);

      }
    }
  });

  let totalQuestions = 0;
  
  uniqueTagQuestions.forEach((questionCount) => {
    totalQuestions += questionCount;
  });

  if (totalQuestions === 0) {
    if (data.totalQuestions) {
      totalQuestions = data.totalQuestions;
    } else if (data.questionCount) {
      totalQuestions = data.questionCount;
    } else if (data.insights && data.insights.totalQuestions) {
      totalQuestions = data.insights.totalQuestions;
    } else {
      totalQuestions = null;
    }
  }

  studentsData = Array.from(studentMap.values());
  
  studentsData.forEach(student => {
    for (const tag in student.tagScores) {
      if (student.tagCounts[tag] > 0) {
        student.tagScores[tag] = student.tagScores[tag] / student.tagCounts[tag];
      }
    }
    delete student.tagCounts;
  });

  tagPerformanceData = tagNames.map((tag) => {
    const scores = examProgressData[tag].filter((score) => score !== null); // Remove the score > 0 filter
    return scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
  });

  window.tagDistributionData = tagNames.map((tag) => {
    let count = 0;
    data.forEach((exam) => {
      if (exam.students.some(student => 
        student.tags.some(t => t.name === tag))) {
        count++;
      }
    });

    const percentage = (count / data.length) * 100;
    return { tag: tag, percentage: percentage };
  });

  studentsData.forEach((student) => {
    const scores = Object.values(student.tagScores);
    student.overallScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;
  });

  studentsData.sort((a, b) => b.overallScore - a.overallScore);

  $("#exam-count").html(`<div>
    <span>${examTypes.length || 0}</span>
    <i class='bx bx-info-circle cursor-pointer' title="${examTypes?.join(',')}"></i>
    </div>`);
  $("#student-count").text(studentsData.length || 0);
  $("#tag-count").text(tagNames.length || 0);
  $("#question-count").text(totalQuestions !== null ? totalQuestions : "N/A");

  renderStudentPerformanceSection();
}

function initializeDashboard() {
  // Set up common chart theme options for a cohesive design
  const chartTheme = {
    colors: ["#4361ee", "#3a0ca3", "#7209b7", "#f72585", "#4cc9f0", "#06d6a0"],
    fontFamily: "'Inter', 'Segoe UI', Roboto, Arial, sans-serif",
    toolbar: {
      show: false
    },
    grid: {
      borderColor: '#eaecef',
      strokeDashArray: 4,
    },
    chart: {
      background: 'transparent',
      toolbar: {
        show: false
      }
    },
    tooltip: {
      theme: 'dark',
      style: {
        fontSize: '12px',
        fontFamily: "'Inter', 'Segoe UI', Roboto, Arial, sans-serif"
      }
    }
  };

  // Tag Performance Chart
  const tagPerformanceOptions = {
    series: [
      {
        name: "Average Score",
        data: tagPerformanceData,
      },
    ],
    chart: {
      height: 320,
      width: Math.max(1200, tagNames.length * 80), // Wider chart with better spacing
      type: "bar",
      toolbar: {
        show: false,
      },
      fontFamily: chartTheme.fontFamily,
      stacked: false,
      parentHeightOffset: 0,
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true,
        zoomedArea: {
          fill: {
            color: '#90CAF9',
            opacity: 0.4
          },
          stroke: {
            color: '#0D47A1',
            opacity: 0.4,
            width: 1
          }
        }
      },
      events: {
        dataPointSelection: function(event, chartContext, config) {
          const tagIndex = config.dataPointIndex;
          const tagName = tagNames[tagIndex];
          
          $("#selected-tag-title").text(tagName);
          $(".selected-tag-title").text(tagName);
          
          initializeTagDrilldown(tagName);
          
          const tagDrilldownModal = new bootstrap.Modal($("#tagDrilldownModal")[0]);
          tagDrilldownModal.show();
        }
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: false,
        columnWidth: tagNames.length > 10 ? '30px' : '50px',
        distributed: false,
        dataLabels: {
          position: 'top',
          hideOverflowingLabels: true
        },
        rangeBarOverlap: false,
        rangeBarGroupRows: false
      },
    },
    colors: chartTheme.colors,
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val ? Number(val)?.toFixed(1) + "%" : '';
      },
      style: {
        fontSize: "12px",
        colors: ["#333"],
        fontWeight: 500,
        fontFamily: chartTheme.fontFamily
      },
      offsetY: -20,
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        color: '#fff',
        opacity: 0.9
      }
    },
    xaxis: {
      categories: tagNames,
      labels: {
        style: {
          colors: tagNames.map(() => "#555"),
          fontSize: "12px",
          fontFamily: chartTheme.fontFamily
        },
        rotate: tagNames.length > 10 ? -45 : 0,
        rotateAlways: tagNames.length > 10,
        maxHeight: tagNames.length > 10 ? 60 : 40,
        hideOverlappingLabels: false,
        trim: true
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      tickAmount: tagNames.length > 20 ? 10 : undefined,
      tickPlacement: 'on',
      position: 'bottom',
      tooltip: {
        enabled: false
      },
      scrollbar: {
        enabled: true,
        offsetY: 0,
        style: {
          background: '#f1f1f1',
          borderRadius: 4,
          height: 6
        },
        background: {
          enabled: true,
          foreColor: '#f1f1f1',
          borderRadius: 4
        }
      }
    },
    yaxis: {
      title: {
        text: "Performance (%)",
        style: {
          fontFamily: chartTheme.fontFamily
        }
      },
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
        style: {
          fontFamily: chartTheme.fontFamily
        },
        formatter: function(val) {
          return Number(val).toFixed(2) + '%';
        }
      }
    },
    grid: {
      ...chartTheme.grid,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      },
      column: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      }
    },
    tooltip: {
      ...chartTheme.tooltip,
      y: {
        formatter: function(val) {
          return val ? Number(val).toFixed(2) + "%" : '';
        }
      }
    },
    states: {
      hover: {
        filter: {
          type: 'darken',
          value: 0.85
        }
      },
      active: {
        filter: {
          type: 'darken',
          value: 0.85
        }
      }
    },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: {
          height: 300
        },
        plotOptions: {
          bar: {
            columnWidth: '40px'
          }
        },
        dataLabels: {
          enabled: false
        },
        xaxis: {
          labels: {
            rotate: -45,
            rotateAlways: true,
            maxHeight: 80
          }
        }
      }
    }]
  };

  const tagPerformanceChart = new ApexCharts(
    $("#tagPerformanceChart")[0],
    tagPerformanceOptions
  );
  tagPerformanceChart.render();

  // Tag Distribution Chart
  const tagDistributionOptions = {
    series: window.tagDistributionData.map((item) => item.percentage),
    chart: {
      type: "donut",
      height: 320,
      fontFamily: chartTheme.fontFamily,
      events: {
        dataPointMouseEnter: function(event, chartContext, config) {
          const fullTag = window.tagDistributionData[config.dataPointIndex].tag;
          const percentage = window.tagDistributionData[config.dataPointIndex].percentage;
          event.target.setAttribute('title', `${fullTag}: ${percentage.toFixed(2)}%`);
        }
      }
    },
    labels: window.tagDistributionData.map((item) => `${item.tag?.substring(0,10)}...`),
    colors: chartTheme.colors,
    legend: {
      position: "bottom",
      fontFamily: chartTheme.fontFamily,
      fontSize: '13px',
      markers: {
        radius: 3
      },
      formatter: function(legendName, opts) {
        const fullTag = window.tagDistributionData[opts.seriesIndex].tag;
        // const percentage = window.tagDistributionData[opts.seriesIndex].percentage;
        return `<div title="${fullTag}">${fullTag.substring(0,10)}...</div>`
      },
      tooltip: {
        enabled: true,
        followCursor: false, // Don't follow cursor for donut chart
        fixed: {
          enabled: true,
          position: 'center', // Center position works better for donut charts
          offsetY: 0,
          offsetX: 0
        },
        theme: 'dark',
        style: {
          fontSize: '12px',
          fontFamily: chartTheme.fontFamily
        },
        custom: function({ series, seriesIndex, dataPointIndex, w }) {
          const fullTag = window.tagDistributionData[seriesIndex].tag;
          const percentage = window.tagDistributionData[seriesIndex].percentage;
          
          // Calculate safer position that won't go offscreen
          const tooltipX = Math.min(Math.max(w.globals.mouseX, 100), window.innerWidth - 200);
          const tooltipY = Math.min(Math.max(w.globals.mouseY, 100), window.innerHeight - 200);
          
          // Add inline styles to position the tooltip
          const tooltipStyle = `
            position: fixed;
            top: ${tooltipY}px;
            left: ${tooltipX}px;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 5px;
            padding: 10px;
            width: auto;
            max-width: 300px;
            pointer-events: none;
            box-shadow: 0 5px 10px rgba(0,0,0,0.2);
          `;
          
          return `<div style="${tooltipStyle}">
                    <div style="font-weight: bold; margin-bottom: 5px; word-wrap: break-word;">${fullTag}</div>
                    <div style="display: flex; align-items: center;">
                      <span style="font-weight: 500; margin-right: 5px;">Coverage:</span>
                      <span style="font-weight: bold;">${percentage.toFixed(2)}%</span>
                    </div>
                  </div>`;
        }
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '50%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontFamily: chartTheme.fontFamily,
              formatter: function(val) {
                const index = window.tagDistributionData.findIndex(item => item.tag.startsWith(val));
                return index !== -1 ? window.tagDistributionData[index].tag : val;
              }
            },
            value: {
              show: true,
              fontSize: '20px',
              fontFamily: chartTheme.fontFamily,
              formatter: function (val) {
                return val ? Number(val).toFixed(2) + '%' : '';
              }
            },
            total: {
              show: true,
              fontSize: '14px',
              fontFamily: chartTheme.fontFamily,
              formatter: function (w) {
                return 'Coverage';
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      enabled: true,
      followCursor: false, // Don't follow cursor for donut chart
      fixed: {
        enabled: true,
        position: 'center', // Center position works better for donut charts
        offsetY: 0,
        offsetX: 0
      },
      theme: 'dark',
      style: {
        fontSize: '12px',
        fontFamily: chartTheme.fontFamily
      },
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const fullTag = window.tagDistributionData[seriesIndex].tag;
        const percentage = window.tagDistributionData[seriesIndex].percentage;
        
        // Calculate safer position that won't go offscreen
        const tooltipX = Math.min(Math.max(w.globals.mouseX, 100), window.innerWidth - 200);
        const tooltipY = Math.min(Math.max(w.globals.mouseY, 100), window.innerHeight - 200);
        
        // Add inline styles to position the tooltip
        const tooltipStyle = `
          position: fixed;
          top: ${tooltipY}px;
          left: ${tooltipX}px;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          border-radius: 5px;
          padding: 10px;
          width: auto;
          max-width: 300px;
          pointer-events: none;
          box-shadow: 0 5px 10px rgba(0,0,0,0.2);
        `;
        
        return `<div style="${tooltipStyle}">
                  <div style="font-weight: bold; margin-bottom: 5px; word-wrap: break-word;">${fullTag}</div>
                  <div style="display: flex; align-items: center;">
                    <span style="font-weight: 500; margin-right: 5px;">Coverage:</span>
                    <span style="font-weight: bold;">${percentage.toFixed(2)}%</span>
                  </div>
                </div>`;
      },
      onDatasetHover: {
        highlightDataSeries: true,
      },
      marker: {
        show: false,
      },
      items: {
        display: "flex",
      },
      z: {
        formatter: undefined,
        title: 'Size: '
      }
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ]
  };

  const tagDistributionChart = new ApexCharts(
    $("#tagDistributionChart")[0],
    tagDistributionOptions
  );
  tagDistributionChart.render();


  const examProgressOptions = {
    series: Object.keys(examProgressData).map((tag) => ({
      name: tag,
      data: examProgressData[tag],
    })),
    chart: {
      height: 320,
      type: "line",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      dropShadow: {
        enabled: true,
        top: 3,
        left: 0,
        blur: 4,
        opacity: 0.2
      },
      fontFamily: chartTheme.fontFamily
    },
    colors: chartTheme.colors,
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    grid: chartTheme.grid,
    markers: {
      size: 6,
      strokeWidth: 0,
      hover: {
        size: 9
      }
    },
    xaxis: {
      categories: examTypes,
      labels: {
        style: {
          fontFamily: chartTheme.fontFamily
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      title: {
        text: "Score (%)",
        style: {
          fontFamily: chartTheme.fontFamily
        }
      },
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
        style: {
          fontFamily: chartTheme.fontFamily
        }
      }
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontFamily: chartTheme.fontFamily,
      fontSize: '13px',
      markers: {
        radius: 2,
        width: 12,
        height: 12
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      },
      formatter: function(legendName, opts) {
        const series = opts.w.globals.series[opts.seriesIndex];
        const lastValue = series[series.length - 1];
        return `${legendName.substring(0, 10)}...`;
      },  
      onItemClick: {
        toggleDataSeries: true
      },
      onItemHover: {
        highlightDataSeries: true
      }
    },
    tooltip: chartTheme.tooltip
  };

  const examProgressChart = new ApexCharts(
    $("#examProgressChart")[0],
    examProgressOptions
  );
  examProgressChart.render();

  // Direct approach for setting legend titles on the line chart
  setTimeout(() => {
    const lineChartLegendItems = document.querySelectorAll('#examProgressChart .apexcharts-legend-text');
    const tagKeys = Object.keys(examProgressData);
    
    lineChartLegendItems.forEach((item, index) => {
      if (index < tagKeys.length) {
        item.setAttribute('title', tagKeys[index]);
      }
    });
    
    // Add click event listener to handle legend clicks
    const examProgressChartEl = document.getElementById('examProgressChart');
    if (examProgressChartEl) {
      examProgressChartEl.addEventListener('click', function(e) {
        // Check if the click was on a legend item
        if (e.target && (e.target.classList.contains('apexcharts-legend-text') || 
            e.target.closest('.apexcharts-legend-text'))) {
          // Reapply titles after a short delay
          setTimeout(() => {
            const updatedLegendItems = document.querySelectorAll('#examProgressChart .apexcharts-legend-text');
            updatedLegendItems.forEach((item, index) => {
              if (index < tagKeys.length) {
                item.setAttribute('title', tagKeys[index]);
              }
            });
          }, 100);
        }
      });
    }
  }, 1000);

  // Skill Radar Chart
  const skillRadarOptions = {
    series: [
      {
        name: "Class Average",
        data: tagPerformanceData,
      },
    ],
    chart: {
      height: 320,
      type: "radar",
      toolbar: {
        show: false,
      },
      dropShadow: {
        enabled: true,
        blur: 3,
        opacity: 0.2
      },
      fontFamily: chartTheme.fontFamily,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    colors: ["#4361ee"],
    xaxis: {
      categories: tagNames,
      labels: {
        style: {
          fontSize: '13px',
          fontFamily: chartTheme.fontFamily
        },
        formatter: function(value) {
          return value.length > 10 ? value.substring(0, 10) + '...' : value;
        },
        maxHeight: 100,
        trim: true,
        hideOverlappingLabels: true
      }
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: {
        style: {
          fontFamily: chartTheme.fontFamily
        },
        formatter: function(val) {
          return val.toFixed(0) + '%';
        }
      },
      tickAmount: 5
    },
    markers: {
      size: 5,
      hover: {
        size: 8
      }
    },
    tooltip: {
      enabled: true,
      followCursor: true,
      fixed: {
        enabled: false
      },
      theme: 'dark',
      style: {
        fontSize: '12px',
        fontFamily: chartTheme.fontFamily
      },
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const tag = tagNames[dataPointIndex];
        const value = series[seriesIndex][dataPointIndex];
        
        return `<div style="padding: 10px; max-width: 300px;">
                  <div style="font-weight: bold; margin-bottom: 5px; word-wrap: break-word;">${tag}</div>
                  <div style="display: flex; align-items: center;">
                    <span style="font-weight: 500; margin-right: 5px;">Performance:</span>
                    <span style="font-weight: bold;">${value ? Number(value).toFixed(2) + "%" : 'N/A'}</span>
                  </div>
                </div>`;
      }
    },
    stroke: {
      width: 2
    },
    fill: {
      opacity: 0.15
    },
    responsive: [
      {
        breakpoint: 1200,
        options: {
          chart: {
            height: 300
          },
          xaxis: {
            labels: {
              fontSize: '12px',
              maxHeight: 80
            }
          }
        }
      },
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 280
          },
          xaxis: {
            labels: {
              fontSize: '11px',
              maxHeight: 60
            }
          },
          yaxis: {
            labels: {
              fontSize: '11px'
            }
          }
        }
      },
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 250
          },
          xaxis: {
            labels: {
              fontSize: '10px',
              maxHeight: 40
            }
          },
          yaxis: {
            labels: {
              fontSize: '10px'
            }
          },
          markers: {
            size: 4,
            hover: {
              size: 6
            }
          }
        }
      }
    ]
  };

  const skillRadarChart = new ApexCharts(
    $("#skillRadarChart")[0],
    skillRadarOptions
  );
  skillRadarChart.render();

  // Store chart references
  window.tagPerformanceChart = tagPerformanceChart;
  window.examProgressChart = examProgressChart;
  window.tagDistributionChart = tagDistributionChart;
  window.skillRadarChart = skillRadarChart;

}


function showStudentDetail(studentId) {
 
  // Prevent multiple initializations
  if (window.studentDetailInitializing) {
   
    return;
  }
  
  window.studentDetailInitializing = true;
  
  const student = studentsData.find((s) => s.id === studentId);
  if (!student) {
    window.studentDetailInitializing = false;
    return;
  }

  // Get the student detail section
  const studentDetailSection = $("#student-performance-section");

  // Create the student profile header
  const studentName = student.name;
  const studentColor = getStudentColor(student.id);
  const studentInitials = studentName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();
    
  // Calculate overall score
  const scores = Object.values(student.tagScores);
  const overallScore = scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;
    
  // Determine performance level
  let performanceLevel = "";
  let performanceClass = "";
  
  if (overallScore >= 85) {
    performanceLevel = "Excellent";
    performanceClass = " text-success";
  } else if (overallScore >= 75) {
    performanceLevel = "Good";
    performanceClass = " text-info";
  } else if (overallScore >= 65) {
    performanceLevel = "Average";
    performanceClass = " text-warning";
  } else {
    performanceLevel = "Needs Improvement";
    performanceClass = " text-danger";
  }

  // Create the profile content
  const profileHTML = `
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-body">
        <div class="row align-items-center">
          <div class="col-auto">
            <div class="avatar-circle avatar-circle-lg" style="background-color: ${studentColor};">
              ${studentInitials}
            </div>
          </div>
          <div class="col-md-4">
            <h4 class="fw-bold mb-1">${studentName}</h4>
          </div>
          <div class="col-md-5">
            <div class="d-flex align-items-center mt-3 mt-md-0">
              <div class="overall-score me-3">
                <div class="lead fw-bold ${performanceClass}">${overallScore.toFixed(1)}%</div>
                <div class="text-muted small">Overall Score</div>
              </div>
              <div class="flex-grow-1">
                <div class="progress" style="height: 8px;">
                  <div class="progress-bar bg-${performanceClass.split(' ')[1].replace('text-', '')}" 
                      role="progressbar" 
                      style="width: ${overallScore}%;" 
                      aria-valuenow="${overallScore}" 
                      aria-valuemin="0" 
                      aria-valuemax="100">
                  </div>
                </div>
                <div class="d-flex justify-content-between mt-1">
                  <small class="text-muted">Performance Level</small>
                  <small class="${performanceClass}">${performanceLevel}</small>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-auto ms-auto mt-3 mt-md-0">
            <button id="close-student-detail" class="btn btn-sm btn-outline-secondary rounded-pill">
              <i class="fas fa-times me-1"></i> Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Create tag scores section
  const tagScoresHTML = `
    <div class="row mb-4">
      <div class="col-md-12">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Tag Performance</h5>
            <span class="badge bg-light text-dark small" id="tag-count-badge">${Object.keys(student.tagScores).length} tags</span>
          </div>
          <div class="card-body p-0">
            <div class="tag-scores-container">
              <div class="row g-0" id="student-tag-scores">
                ${Object.entries(student.tagScores).map(([tag, score]) => {
                  let colorClass = "";
                  if (score >= 85) colorClass = "success";
                  else if (score >= 75) colorClass = "info";
                  else if (score >= 65) colorClass = "warning";
                  else colorClass = "danger";
                  
                  return `
                    <div class="col-xl-2 col-lg-3 col-md-4 col-sm-6 p-2">
                      <div class="tag-score-card shadow-sm rounded p-2 h-100">
                        <div class="d-flex flex-column mb-2">
                          <div class="tag-name text-truncate mb-1" title="${tag}">
                            <i class="fas fa-tag me-1 small text-muted"></i>
                            <span class="small fw-medium">${tag}</span>
                          </div>
                          <div class="d-flex justify-content-between align-items-center">
                            <div class="score-value">
                              <span class="badge bg-${colorClass} px-2 py-1 rounded-pill">
                                ${score.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div class="progress" style="height: 6px;">
                          <div class="progress-bar bg-${colorClass}" role="progressbar" 
                              style="width: ${score}%;" 
                              aria-valuenow="${score}" 
                              aria-valuemin="0" 
                              aria-valuemax="100">
                          </div>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            ${Object.keys(student.tagScores).length > 18 ? 
              `<div class="text-center my-2">
                <button class="btn btn-sm btn-light border-0 rounded-pill shadow-sm toggle-tags-btn">
                  <span class="show-more"><i class="fas fa-chevron-down me-1"></i> Show all tags</span>
                  <span class="show-less d-none"><i class="fas fa-chevron-up me-1"></i> Show less</span>
                </button>
              </div>` : ''}
          </div>
        </div>
      </div>
    </div>
   
  `;

  // Create charts section
  const chartsHTML = `
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-header bg-white">
            <h5 class="mb-0 mx-2">Performance Comparison</h5>
            <small class="text-muted">Student vs. Class Average</small>
          </div>
          <div class="card-body">
            <div id="studentRadarChart"></div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-header bg-white">
            <h5 class="mb-0 mx-2">Progress Over Time</h5>
            <small class="text-muted">Performance across exams</small>
          </div>
          <div class="card-body">
            <div id="studentProgressChart"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Create exam breakdown section if the student has exam scores
  let examBreakdownHTML = '';
  if (student.examScores && Object.keys(student.examScores).length > 0) {
    examBreakdownHTML = `
      <div class="row">
        <div class="col-md-12">
          <div class=" border-2 p-4">
            <div class="card-header bg-white ">
            <div>
              <h5 class="mb-0">Exam Breakdown</h5>
              <small class="text-muted">Performance in individual exams</small>
            </div>
              </div>
            <div class="card-body p-0">
              <div class="row g-4" id="examBreakdownCards">
                ${Object.entries(student.examScores).map(([examName, tagScores], index) => {
                  // Calculate avg score for this exam
                  const examScores = Object.values(tagScores);
                  const examAvg = examScores.length > 0
                    ? examScores.reduce((sum, score) => sum + score, 0) / examScores.length
                    : 0;
                  
                  let examColorClass = "";
                  if (examAvg >= 85) examColorClass = "success";
                  else if (examAvg >= 75) examColorClass = "info";
                  else if (examAvg >= 65) examColorClass = "warning";
                  else examColorClass = "danger";
                  
                  // Create unique chart ID for this exam
                  const chartId = `exam-chart-${index}`;
                  
                  return `
                    <div class="col-md-6 exam-card mb-3">
                      <div class="card shadow-sm h-100">
                        <div class="card-header d-flex justify-content-between align-items-center bg-white py-3">
                          <h6 class="mb-0 fw-bold">${examName}</h6>
                          <div class="score-pill bg-${examColorClass} text-white px-3 py-1 rounded-pill">
                            <span class="fw-medium">${examAvg.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div class="card-body">
                          <div id="${chartId}" class="apex-chart" data-exam-name="${examName}" data-exam-index="${index}"></div>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Update the student detail section with the new content
  studentDetailSection.html(`
    <div class="container py-4" id="student-detail-container">
      ${profileHTML}
      ${tagScoresHTML}
      ${chartsHTML}
      ${examBreakdownHTML}
    </div>
  `);

  // Show the section
  studentDetailSection.show();

  // Scroll to the section
  $("html, body").animate(
    {
      scrollTop: studentDetailSection.offset().top - 20
    },
    500
  );


  
  // Release detail initialization lock after chart initialization
  setTimeout(() => {
    window.studentDetailInitializing = false;
  }, 1000);
  
  initializeStudentCharts(student);

  // Add event listener for close button
  $("#close-student-detail").on("click", function() {
    $('.view-student-button').each(function () {
      const $button = $(this);
      if ($button.prop('disabled')) {
        $button.prop('disabled', false); 
      }
    });
    
    // Properly clean up any charts before hiding the section
    try {
      // Find and destroy any ApexCharts instances to prevent memory leaks
      ApexCharts.getChartByID("studentRadarChart")?.destroy();
      
      // Clean up all exam charts
      if (window.studentExamCharts && Array.isArray(window.studentExamCharts)) {
        window.studentExamCharts.forEach(chart => {
          if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
          }
        });
        window.studentExamCharts = [];
      }
      
      // Clean up progress chart
      if (window.studentProgressChart) {
        window.studentProgressChart.destroy();
        window.studentProgressChart = null;
      }
      

    } catch (e) {
     
    }
    
    studentDetailSection.hide();
  });
  
  // Add event listener for toggling tag visibility
  $(".toggle-tags-btn").on("click", function() {
    const $container = $(".tag-scores-container");
    const $showMore = $(this).find(".show-more");
    const $showLess = $(this).find(".show-less");
    
    if ($container.hasClass("expanded")) {
      // Collapse
      $container.removeClass("expanded");
      $showMore.removeClass("d-none");
      $showLess.addClass("d-none");
      
      // Scroll back to top of container
      $container.scrollTop(0);
      
      // Animate container height
      $container.css("transition", "max-height 0.3s ease");
    } else {
      // Expand
      $container.addClass("expanded");
      $showMore.addClass("d-none");
      $showLess.removeClass("d-none");
      
      // Animate container height
      $container.css("transition", "max-height 0.3s ease");
    }
  });
}


function initializeStudentCharts(student) {

  
  // If charts are already being initialized, prevent duplicate initialization
  if (window.studentChartsInitializing) {
   
    return;
  }
  
  // Set flag to prevent multiple initializations
  window.studentChartsInitializing = true;
  
  // Common chart theme options
  const chartTheme = {
    colors: ["#4361ee", "#3a0ca3", "#7209b7", "#f72585", "#4cc9f0", "#06d6a0"],
    fontFamily: "'Inter', 'Segoe UI', Roboto, Arial, sans-serif",
    toolbar: {
      show: false
    },
    grid: {
      borderColor: '#eaecef',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'dark',
      style: {
        fontSize: '12px',
        fontFamily: "'Inter', 'Segoe UI', Roboto, Arial, sans-serif"
      }
    }
  };

  // Clear previous chart if it exists
  $("#studentRadarChart").empty();
  
  // Destroy any existing radar chart before creating a new one
  if (window.studentRadarChart) {
    try {
      window.studentRadarChart.destroy();
    } catch (e) {
      
    }
  }
  
  // Initialize render count
  window.radarRenderCount = 0;
  
  // Create chart instance with modified options
  const studentRadarOptions = {
    series: [
      {
        name: student.name,
        data: Object.keys(student.tagScores).map(
          (tag) => student.tagScores[tag]
        ),
      },
      {
        name: "Class Average",
        data: tagNames.map((tag) => {
          const tagIndex = tagNames.indexOf(tag);
          return tagIndex !== -1 ? tagPerformanceData[tagIndex] : 0;
        }),
      },
    ],
    chart: {
      height: 400,
      type: "radar",
      toolbar: {
        show: false,
      },
      fontFamily: chartTheme.fontFamily,
      dropShadow: {
        enabled: true,
        blur: 3,
        opacity: 0.2
      },
      redrawOnWindowResize: false, // Disable auto redraw
      redrawOnParentResize: false, // Disable auto redraw
      animations: {
        enabled: false  // Disable animations to prevent redraws
      },
    },
    colors: ["#4361ee", "#f72585"],
    xaxis: {
      categories: Object.keys(student.tagScores),
      labels: {
        style: {
          fontSize: '12px',
          fontFamily: chartTheme.fontFamily
        },
        formatter: function(value) {
          // Simpler formatter with no window resize detection
          return value.length > 12 ? value.substring(0, 12) + '...' : value;
        }
      }
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
        style: {
          fontFamily: chartTheme.fontFamily
        },
        formatter: function(val) {
          return val.toFixed(0) + '%';
        }
      }
    },
    markers: {
      size: 4
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val ? Number(val)?.toFixed(1) + "%" : '';
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
      fontFamily: chartTheme.fontFamily,
      fontSize: '12px'
    },
    stroke: {
      width: 2
    },
    fill: {
      opacity: 0.15
    },
    // No responsive property to prevent multiple renders
  };

  
  
  const studentRadarChart = new ApexCharts(
    $("#studentRadarChart")[0],
    studentRadarOptions
  );
  
  // Store reference to chart in global scope for cleanup
  window.studentRadarChart = studentRadarChart;
  

  studentRadarChart.render();

  // Initialize individual exam charts if they exist
  if (student.examScores) {
    // Store references to all exam charts for cleanup
    window.studentExamCharts = [];
    
    Object.entries(student.examScores).forEach(([examName, tagScores], examIndex) => {
      const chartId = `exam-chart-${examIndex}`;
      const chartElement = document.getElementById(chartId);
      
      if (chartElement) {
        // Prepare the data for this exam's chart
        const tags = Object.keys(tagScores);
        const scores = Object.values(tagScores);
        
        // Determine colors based on scores
        const barColors = scores.map(score => {
          if (score >= 85) return '#28a745'; // success
          else if (score >= 75) return '#17a2b8'; // info
          else if (score >= 65) return '#ffc107'; // warning
          else return '#dc3545'; // danger
        });
        
        // Configure chart options
        const examChartOptions = {
          series: [{
            name: 'Score',
            data: scores
          }],
          chart: {
            type: 'bar',
            height: Math.max(250, tags.length * 35), // Dynamic height based on number of tags
            toolbar: {
              show: false
            },
            fontFamily: chartTheme.fontFamily
          },
          plotOptions: {
            bar: {
              horizontal: true,
              distributed: true,
              dataLabels: {
                position: 'top'
              },
              barHeight: '70%',
              borderRadius: 4
            },
          },
          dataLabels: {
        enabled: true,
            formatter: function (val) {
              return val ? Number(val)?.toFixed(1) + "%" : '';
            },
            offsetX: 20,
            style: {
              fontSize: '12px',
              colors: ['#fff'],
              fontWeight: 600
            }
          },
          colors: barColors,
          xaxis: {
            categories: tags,
            labels: {
              style: {
                fontFamily: chartTheme.fontFamily
              }
            },
            min: 0,
            max: 100,
            axisBorder: {
              show: false
            },
            axisTicks: {
              show: false
            }
          },
          yaxis: {
            labels: {
              style: {
                fontFamily: chartTheme.fontFamily,
                fontSize: '12px'
              }
            }
          },
          grid: {
            borderColor: chartTheme.grid.borderColor,
            strokeDashArray: chartTheme.grid.strokeDashArray,
            xaxis: {
              lines: {
                show: true
              }
            },
            yaxis: {
              lines: {
                show: false
              }
            }
          },
          tooltip: chartTheme.tooltip,
          legend: {
            show: false
          }
        };
        
        // Create and render the chart
        const examChart = new ApexCharts(chartElement, examChartOptions);
        examChart.render();
        
        // Store reference for cleanup
        window.studentExamCharts.push(examChart);
      }
    });
  }

  // Create student progress chart if student has exam scores
  if (student.examScores && Object.keys(student.examScores).length > 0) {
    // Extract data for each tag across exams
    const studentProgressData = [];

    // For each tag the student has
    Object.keys(student.tagScores).forEach((tag, tagIndex) => {
      const tagData = {
        name: tag,
        data: [],
      };

      // Add data for each exam
      examTypes.forEach((exam) => {
        if (student.examScores[exam] && student.examScores[exam][tag] !== undefined) {
          tagData.data.push(student.examScores[exam][tag]);
        } else {
          tagData.data.push(null);
        }
      });

      studentProgressData.push(tagData);
    });

    const studentProgressOptions = {
      series: studentProgressData,
      chart: {
        height: 350,
        type: "line",
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: true,
          type: 'x',
          autoScaleYaxis: true,
          zoomedArea: {
            fill: {
              color: '#90CAF9',
              opacity: 0.4
            },
            stroke: {
              color: '#0D47A1',
              opacity: 0.4,
              width: 1
            }
          }
        },
        fontFamily: chartTheme.fontFamily,
        dropShadow: {
          enabled: true,
          top: 3,
          left: 0,
          blur: 4,
          opacity: 0.2
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        },
        events: {
          mounted: function(chartContext, config) {
            if (config.config.chart.type !== 'line') return;
            
            // Set titles on legend items
            function setLegendTitles() {
              const chartId = chartContext.el.id;
              const selector = `#${chartId} .apexcharts-legend-text`;
              const legendItems = document.querySelectorAll(selector);
              
              if (legendItems.length === 0) {
                setTimeout(setLegendTitles, 300);
                return;
              }
              
              const tags = studentProgressData.map(item => item.name);
              
              legendItems.forEach((item, index) => {
                if (index < tags.length) {
                  item.setAttribute('title', tags[index]);
                  item.setAttribute('data-full-tag', tags[index]);
                }
              });
            }
            
            setTimeout(setLegendTitles, 500);
          },
          legendClick: function(chartContext, seriesIndex, config) {
            if (config.config.chart.type !== 'line') return;
            
            // Refresh titles after legend click
            setTimeout(() => {
              const chartId = chartContext.el.id;
              const selector = `#${chartId} .apexcharts-legend-text`;
              const legendItems = document.querySelectorAll(selector);
              const tags = studentProgressData.map(item => item.name);
              
              legendItems.forEach((item, index) => {
                if (index < tags.length) {
                  item.setAttribute('title', tags[index]);
                }
              });
            }, 100);
          }
        }
      },
      colors: chartTheme.colors,
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
        width: 2,
        lineCap: 'round'
      },
      grid: {
        borderColor: chartTheme.grid.borderColor,
        strokeDashArray: chartTheme.grid.strokeDashArray,
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      },
      markers: {
        size: 4,
        strokeWidth: 0,
        hover: {
          size: 6
        },
        discrete: studentProgressData.map((tag, index) => ({
          seriesIndex: index,
          dataPointIndex: tag.data.length - 1,
          size: 6,
          fillColor: chartTheme.colors[index % chartTheme.colors.length]
        }))
      },
      xaxis: {
        categories: examTypes,
        labels: {
          style: {
            fontFamily: chartTheme.fontFamily,
            fontSize: '12px'
          },
          rotate: examTypes.length > 10 ? -45 : 0,
          rotateAlways: examTypes.length > 10,
          maxHeight: examTypes.length > 10 ? 60 : 40,
          hideOverlappingLabels: true,
          trim: true,
          formatter: function(value) {
            if (!value) return '';
            return value.length > 8 ? value.substring(0, 8) + '...' : value;
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        tooltip: {
          enabled: true,
          custom: function({ value }) {
            return value || '';
          }
        }
      },
      yaxis: {
        title: {
          text: "Score (%)",
          style: {
            fontFamily: chartTheme.fontFamily
          }
        },
        min: 0,
        max: 100,
        tickAmount: 5,
        labels: {
          style: {
            fontFamily: chartTheme.fontFamily
          },
          formatter: function(val) {
            return val.toFixed(0) + '%';
          }
        }
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
        fontFamily: chartTheme.fontFamily,
        fontSize: '13px',
        markers: {
          radius: 2,
          width: 12,
          height: 12
        },
        itemMargin: {
          horizontal: 10,
          vertical: 5
        },
        formatter: function(legendName, opts) {
          return legendName.length > 15 ? `${legendName.substring(0, 15)}...` : legendName;
        },
        onItemClick: {
          toggleDataSeries: true
        },
        onItemHover: {
          highlightDataSeries: true
        }
      },
      tooltip: {
        enabled: true,
        followCursor: true,
        fixed: {
          enabled: false
        },
        theme: 'dark',
        shared: true,
        intersect: false,
        style: {
          fontSize: '12px',
          fontFamily: chartTheme.fontFamily
        },
        custom: function({ series, seriesIndex, dataPointIndex, w }) {
          const tag = Object.keys(examProgressData)[seriesIndex];
          const exam = examTypes[dataPointIndex];
          const value = series[seriesIndex][dataPointIndex];
          
          return `<div style="padding: 10px; max-width: 300px;">
                    <div style="font-weight: bold; margin-bottom: 5px; word-wrap: break-word;">${exam}</div>
                    <div style="display: flex; align-items: center; margin-top: 4px;">
                      <span style="display: inline-block; width: 8px; height: 8px; background-color: ${w.globals.colors[seriesIndex]}; margin-right: 6px; border-radius: 50%;"></span>
                      <span style="font-weight: 500; margin-right: 5px;">${tag}:</span>
                      <span style="font-weight: bold;">${value ? value.toFixed(1) + '%' : 'N/A'}</span>
                    </div>
                  </div>`;
        }
      },
      responsive: [
        {
          breakpoint: 1200,
          options: {
            chart: {
              height: 300
            },
            legend: {
              fontSize: '12px',
              markers: {
                width: 10,
                height: 10
              },
              itemMargin: {
                horizontal: 8,
                vertical: 4
              }
            },
            xaxis: {
              labels: {
                fontSize: '11px',
                maxHeight: 50
              }
            }
          }
        },
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 280
            },
            legend: {
              fontSize: '11px',
              markers: {
                width: 8,
                height: 8
              },
              itemMargin: {
                horizontal: 5,
                vertical: 3
              }
            },
            xaxis: {
              labels: {
                fontSize: '10px',
                maxHeight: 40
              }
            },
            yaxis: {
              labels: {
                fontSize: '10px'
              }
            }
          }
        },
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 250
            },
            legend: {
              fontSize: '10px',
              markers: {
                width: 6,
                height: 6
              },
              itemMargin: {
                horizontal: 3,
                vertical: 2
              }
            },
            xaxis: {
              labels: {
                fontSize: '9px',
                maxHeight: 30
              }
            },
            yaxis: {
              labels: {
                fontSize: '9px'
              }
            },
            markers: {
              size: 3,
              hover: {
                size: 5
              }
            }
          }
        }
      ]
    };

    // Clear previous chart if it exists
    $("#studentProgressChart").empty();
    
    // Destroy any existing progress chart
    if (window.studentProgressChart) {
      try {
        window.studentProgressChart.destroy();
      } catch (e) {
        
      }
    }
    
    const studentProgressChart = new ApexCharts(
      document.querySelector("#studentProgressChart"),
      studentProgressOptions
    );
    
    // Store reference for cleanup
    window.studentProgressChart = studentProgressChart;
    
    studentProgressChart.render();
  } else {
    // Show a message if no exam data available
    $("#studentProgressChart").html(`
      <div class="d-flex flex-column align-items-center justify-content-center h-100 text-muted py-5">
        <i class="fas fa-chart-line fa-3x mb-3 opacity-50"></i>
        <p>No exam progress data available for this student.</p>
      </div>
    `);
  }
  
  // Release initialization lock
  setTimeout(() => {
    window.studentChartsInitializing = false;
  }, 500);
}

function showToast(message, type = "info") {
  const toastContainer = $(".toast-container").length
    ? $(".toast-container")
    : $(
        '<div class="toast-container position-fixed bottom-0 start-50 translate-middle-x p-3"></div>'
      ).appendTo("body");

  const toastEl = $(`
        <div class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `);

  toastContainer.append(toastEl);
  const toast = new bootstrap.Toast(toastEl[0], {
    animation: true,
    autohide: true,
    delay: 3000
  });
  toast.show();

  return toastEl;
}

function hideToast(toastEl) {
  const toast = bootstrap.Toast.getInstance(toastEl[0]);
  if (toast) {
    toast.hide();
  }
}

function getTagScore(student, tag) {
  const tagData = student.tagScores[tag];
  const scoreValue = (tagData >= 0) ? tagData.toFixed(1) + '%' : '-';
  
  let textColorClass = '';
  
  if (tagData >= 85) {
    textColorClass = 'text-success';
  } else if (tagData >= 75) {
    textColorClass = 'text-info';
  } else if (tagData >= 65) {
    textColorClass = 'text-warning';
  } else if (tagData >= 0) {
    textColorClass = 'text-danger';
  }
  
  return `
    <td class="text-center" style="min-width: 120px;">
      ${tagData >= 0 ? 
        `<div class="fw-medium ${textColorClass}" style="font-size: 1rem;" title="${tag}: ${scoreValue}">${scoreValue}</div>` : 
        `<span class="text-muted">-</span>`
      }
    </td>
  `;
}

function getOverallScoreEachStudent(student) {
  const scores = Object.values(student.tagScores);
  const overallScore = scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;

  let textColorClass = '';
  let label = '';
  
  if (overallScore >= 85) {
    textColorClass = 'text-success';
    label = 'Excellent';
  } else if (overallScore >= 75) {
    textColorClass = 'text-info';
    label = 'Good';
  } else if (overallScore >= 65) {
    textColorClass = 'text-warning';
    label = 'Average';
  } else if (overallScore > 0) {
    textColorClass = 'text-danger';
    label = 'Needs Improvement';
  }
  
  return `
    <td class="text-center" style="min-width: 120px;">
      <div class="d-flex flex-column align-items-center">
        <div class="fw-bold ${textColorClass}" style="font-size: 1.1rem;" title="Overall Score: ${overallScore.toFixed(1)}%">
          ${overallScore ? overallScore.toFixed(1) + '%' : '-'}
        </div>
        <small class="text-muted mt-1">${label}</small>
      </div>
    </td>
  `;
}

function renderStudentPerformanceSection() {
  const studentPerformanceTable = $("#student-performance-table");
  const studentPerformanceTableSearch = $("#student-performance-table-search");
  studentPerformanceTable.empty();
  studentPerformanceTableSearch.empty();

  // Create a search input for the student table
  const searchInput = $(`
    <div class="search-container mb-3">
      <div class="input-group">
        <span class="input-group-text bg-white border-end-0">
          <i class="fas fa-search text-muted"></i>
        </span>
        <input type="text" class="form-control" id="student-search" 
               placeholder="Search students..." aria-label="Search students">
      </div>
    </div>
  `);
  
  studentPerformanceTableSearch.append(searchInput);

  // Create the table with modern styling and responsive features
  const table = $(`
    <div class="table-responsive rounded shadow-sm">
      <table class="table align-middle table-hover">
        <thead class="bg-light sticky-top">
          <tr>
            <th class="fw-semibold" style="min-width: 150px; position: sticky; left: 0; background: #f8f9fa; z-index: 1;">Student</th>
            ${tagNames.map(tag => `
              <th class="fw-semibold text-center" style="min-width: 120px;" title="${tag}">
                <div class="d-flex flex-column align-items-center">
                  <span class="text-truncate" style="max-width: 100px;">${tag}</span>
                  <small class="text-muted">Score</small>
                </div>
              </th>
            `).join('')}
            <th class="fw-semibold text-center" style="min-width: 120px; position: sticky; right: 0; background: #f8f9fa; z-index: 1;">
              <div class="d-flex flex-column align-items-center">
                <span>Overall</span>
                <small class="text-muted">Score</small>
              </div>
            </th>
            <th class="fw-semibold text-center" style="min-width: 100px; position: sticky; right: 0; background: #f8f9fa; z-index: 1;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${studentsData.map(student => `
          <tr class="student-row" data-student-name="${student.name.toLowerCase()}" style="background-color: #ffffff;">
            <td style="position: sticky; left: 0; background: #ffffff; z-index: 1;">
              <div class="d-flex align-items-center">
                <div class="avatar-circle me-2" style="background-color: ${getStudentColor(student.id)};">
                  ${student.name.charAt(0).toUpperCase()}
                </div>
                <div class="text-truncate" style="max-width: 120px;" title="${student.name}">
                  ${student.name}
                </div>
              </div>
            </td>
            ${tagNames.map(tag => getTagScore(student, tag)).join('')}
            ${getOverallScoreEachStudent(student)}
            <td style="position: sticky; right: 0; background: #ffffff; z-index: 1;" class="text-center">
              <button class="btn btn-sm btn-primary rounded-pill px-3 view-student-button" id="view-student-performance" data-student-id="${student.id}">
               <div class="d-flex align-items-center"> <i class="fas fa-eye me-1"></i> View</div>
              </button>
            </td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `);
  
  studentPerformanceTable.append(table);
  
  // Add student search functionality with debounce
  let searchTimeout;
  $("#student-search").on("keyup", function() {
    clearTimeout(searchTimeout);
    const value = $(this).val().toLowerCase();
    
    searchTimeout = setTimeout(() => {
      $(".student-row").each(function() {
        const studentName = $(this).data("student-name");
        const isVisible = studentName.includes(value);
        $(this).toggle(isVisible);
      });
      
      // Show empty state if no results
      if ($(".student-row:visible").length === 0) {
        if ($("#no-results-message").length === 0) {
          studentPerformanceTable.append(`
            <div id="no-results-message" class="alert alert-info mt-3">
              <i class="fas fa-info-circle me-2"></i>
              No students match your search criteria. Try another search term.
            </div>
          `);
        }
      } else {
        $("#no-results-message").remove();
      }
    }, 300);
  });

  // Add horizontal scroll indicator
  const tableContainer = studentPerformanceTable.find('.table-responsive');
  if (tableContainer[0].scrollWidth > tableContainer[0].clientWidth) {
    tableContainer.append(`
      <div class="scroll-indicator">
        <i class="fas fa-chevron-left"></i>
        <span>Scroll horizontally</span>
        <i class="fas fa-chevron-right"></i>
      </div>
    `);
  }
}

function getStudentColor(studentId) {
  // Generate a consistent color based on student ID
  const colors = [
    "#4361ee", // Blue
    "#3a0ca3", // Purple
    "#7209b7", // Violet
    "#f72585", // Pink
    "#4cc9f0", // Cyan
    "#06d6a0", // Teal
    "#22577a", // Dark Blue
    "#ff7f51", // Coral
    "#2ec4b6", // Turquoise
    "#e76f51"  // Burnt Sienna
  ];
  return colors[studentId % colors.length];
}

// Function to initialize tag drilldown data and charts
function initializeTagDrilldown(tagName) {
  // Common chart theme options
  const chartTheme = {
    colors: ["#4361ee", "#3a0ca3", "#7209b7", "#f72585", "#4cc9f0", "#06d6a0"],
    fontFamily: "'Inter', 'Segoe UI', Roboto, Arial, sans-serif",
    toolbar: {
      show: false
    },
    grid: {
      borderColor: '#eaecef',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'dark',
      style: {
        fontSize: '12px',
        fontFamily: "'Inter', 'Segoe UI', Roboto, Arial, sans-serif"
      }
    }
  };

  // Get all performance data for this tag across exams
  const tagData = examProgressData[tagName] || [];
  
  // Calculate stats
  const nonZeroScores = tagData.filter(score => score > 0);
  const avgScore = nonZeroScores.length > 0 
    ? nonZeroScores.reduce((a, b) => a + b, 0) / nonZeroScores.length 
    : 0;
  
  // Find highest and lowest scores
  const highest = Math.max(...nonZeroScores, 0);
  const lowest = nonZeroScores.length > 0 ? Math.min(...nonZeroScores) : 0;
  
  // Determine performance class
  let performanceClass = '';
  if (avgScore >= 85) performanceClass = 'success';
  else if (avgScore >= 75) performanceClass = 'info';
  else if (avgScore >= 65) performanceClass = 'warning';
  else performanceClass = 'danger';
  
  // Update modal header
  $("#tagDrilldownModalLabel").html(`
    <div class="d-flex align-items-center">
      <div class="tag-icon-badge bg-${performanceClass} me-2 rounded-circle d-flex align-items-center justify-content-center">
        <i class="fas fa-tag text-white"></i>
      </div>
      <span>${tagName}</span>
    </div>
  `);
  
  // Create stats cards
  const statsHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body text-center">
            <h6 class="text-muted mb-2">Average Score</h6>
            <div class="display-5 fw-bold text-${performanceClass}">${avgScore.toFixed(1)}%</div>
            <div class="progress mt-2" style="height: 8px;">
              <div class="progress-bar bg-${performanceClass}" role="progressbar" style="width: ${avgScore}%" 
                aria-valuenow="${avgScore}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body text-center">
            <h6 class="text-muted mb-2">Highest Score</h6>
            <div class="display-5 fw-bold text-success">${highest.toFixed(1)}%</div>
            <div class="progress mt-2" style="height: 8px;">
              <div class="progress-bar bg-success" role="progressbar" style="width: ${highest}%" 
                aria-valuenow="${highest}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body text-center">
            <h6 class="text-muted mb-2">Lowest Score</h6>
            <div class="display-5 fw-bold text-danger">${lowest.toFixed(1)}%</div>
            <div class="progress mt-2" style="height: 8px;">
              <div class="progress-bar bg-danger" role="progressbar" style="width: ${lowest}%" 
                aria-valuenow="${lowest}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add stats to the modal
  $("#tag-stats-container").html(statsHTML);

  // Initialize tag trend chart
  const tagTrendOptions = {
    series: [{
      name: tagName,
      data: tagData
    }],
    chart: {
      height: 300,
      type: 'line',
      toolbar: {
        show: false
      },
      fontFamily: chartTheme.fontFamily,
      dropShadow: {
        enabled: true,
        top: 3,
        left: 0,
        blur: 4,
        opacity: 0.2
      }
    },
    colors: ['#4361ee'],
    dataLabels: {
      enabled: true,
        formatter: function(val) {
        return val ? Number(val)?.toFixed(1) + "%" : '';
      },
      style: {
        fontSize: '12px',
        colors: ['#333'],
        fontWeight: 500,
        fontFamily: chartTheme.fontFamily
      },
      background: {
        enabled: true,
        foreColor: '#fff',
        borderRadius: 5,
        padding: 4,
        opacity: 0.9,
        borderWidth: 1,
        borderColor: '#fff'
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    grid: chartTheme.grid,
    xaxis: {
      categories: examTypes,
      labels: {
        style: {
          fontFamily: chartTheme.fontFamily
        }
      }
    },
    yaxis: {
      min: 0,
      max: 100,
      title: {
        text: 'Performance (%)',
        style: {
          fontFamily: chartTheme.fontFamily
        }
      }
    },
    markers: {
      size: 5,
      hover: {
        size: 8
      }
    },
    tooltip: chartTheme.tooltip
  };
  
  // Clear previous chart if it exists
  $("#tagTrendChart").empty();
  const tagTrendChart = new ApexCharts(
    $("#tagTrendChart")[0],
    tagTrendOptions
  );
  tagTrendChart.render();
  
  // Filter students by this tag and populate table
  const studentDataForTag = studentsData
    .filter(student => student.tagScores && student.tagScores[tagName] !== undefined)
    .sort((a, b) => b.tagScores[tagName] - a.tagScores[tagName]);
  
  // Initialize Student Performance Breakdown Chart
  const studentScores = studentDataForTag.map(student => student.tagScores[tagName]);
  const scoreRanges = {
    "Excellent (85-100%)": 0,
    "Good (75-84%)": 0,
    "Average (65-74%)": 0,
    "Needs Improvement (<65%)": 0
  };
  
  studentScores.forEach(score => {
    if (score >= 85) scoreRanges["Excellent (85-100%)"]++;
    else if (score >= 75) scoreRanges["Good (75-84%)"]++;
    else if (score >= 65) scoreRanges["Average (65-74%)"]++;
    else scoreRanges["Needs Improvement (<65%)"]++;
  });
  
  const studentBreakdownOptions = {
    series: Object.values(scoreRanges),
    chart: {
      type: 'donut',
      height: 300,
      fontFamily: chartTheme.fontFamily,
      toolbar: {
        show: false
      }
    },
    labels: Object.keys(scoreRanges),
    colors: ['#4361ee', '#25b1c3', '#ffc107', '#dc3545'],
    legend: {
      position: 'bottom',
      fontFamily: chartTheme.fontFamily
    },
    plotOptions: {
      pie: {
        donut: {
          size: '55%',
          labels: {
            show: true,
            name: {
              show: true
            },
            value: {
              show: true,
              formatter: function (val) {
                return val + " students";
              }
            },
            total: {
              show: true,
              formatter: function (w) {
                return "Student Distribution";
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    tooltip: chartTheme.tooltip
  };
  
  // Clear previous chart if it exists
  $("#tagStudentBreakdownChart").empty();
  const studentBreakdownChart = new ApexCharts(
    $("#tagStudentBreakdownChart")[0],
    studentBreakdownOptions
  );
  studentBreakdownChart.render();
  
  // Create the student table with search functionality
  createTagStudentTable(tagName, studentDataForTag);
}

// Helper function to create the student table for tag drilldown
function createTagStudentTable(tagName, studentData) {
  const tagStudentTable = $("#tagStudentTable");
  const tagStudentTableSection = $("#tag-student-table-section");
  
  // Create a search input for the student table
  const searchInput = $(`
    <div class="search-container mb-3">
      <div class="input-group">
        <span class="input-group-text bg-white border-end-0">
          <i class="fas fa-search text-muted"></i>
        </span>
        <input type="text" class="form-control border-start-0 ps-0" id="tag-student-search" 
               placeholder="Search students..." aria-label="Search students">
      </div>
    </div>
  `);
  
  // Clear previous content and add search input
  tagStudentTableSection.empty();
  tagStudentTableSection.append(searchInput);
  
  // Create the responsive table container
  const tableContainer = $('<div class="table-responsive rounded shadow-sm"></div>');
  const table = $('<table class="table align-middle" id="tagStudentTable"></table>');
  
  // Create table header
  const thead = $('<thead class="bg-light"></thead>');
  const headerRow = $('<tr></tr>');
  headerRow.append('<th class="fw-semibold">Student</th>');
  
  // Add dynamic column headers for each exam type
  examTypes.forEach(examType => {
    headerRow.append(`<th class="fw-semibold text-center">${examType}</th>`);
  });
  
  // Add average and trend headers
  headerRow.append('<th class="fw-semibold text-center">Average</th>');
  headerRow.append('<th class="fw-semibold text-center">Trend</th>');
  
  thead.append(headerRow);
  table.append(thead);
  
  // Create table body
  const tbody = $('<tbody></tbody>');
  
  // Populate student data rows
  studentData.forEach(student => {
    // Get scores for this student on this tag across all exams
    const examScores = [];
    examTypes.forEach(exam => {
      if (student.examScores && 
          student.examScores[exam] && 
          (student.examScores[exam][tagName] !== undefined)) {
        examScores.push(student.examScores[exam][tagName]);
      } else {
        examScores.push(null);
      }
    });
    
    // Calculate average score
    const validScores = examScores.filter(score => score !== null);
    const avgScore = validScores.length > 0 
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
      : 0;
    
    // Determine trend (improving, steady, declining)
    let trendIcon = '';
    let trendClass = '';
    
    if (validScores.length >= 2) {
      const firstScore = validScores[0];
      const lastScore = validScores[validScores.length - 1];
      if (lastScore > firstScore + 5) {
        trendIcon = '<i class="fas fa-arrow-up text-success"></i>';
        trendClass = 'text-success';
      } else if (lastScore < firstScore - 5) {
        trendIcon = '<i class="fas fa-arrow-down text-danger"></i>';
        trendClass = 'text-danger';
      } else {
        trendIcon = '<i class="fas fa-equals text-warning"></i>';
        trendClass = 'text-warning';
      }
    } else {
      trendIcon = '<i class="fas fa-minus text-muted"></i>';
      trendClass = 'text-muted';
    }
    
    // Create the row
    const row = $(`<tr class="student-search-row" data-student-name="${student.name.toLowerCase()}" style="background-color: #ffffff;"></tr>`);
    
    // Add student info cell
    row.append(`
      <td>
        <div class="d-flex align-items-center">
          <div class="avatar-circle me-3" style="background-color: ${getStudentColor(student.id)};">
            ${student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="fw-medium">${student.name}</div>
          </div>
        </div>
      </td>
    `);
    
    // Add exam score cells
    examTypes.forEach((exam, index) => {
      const score = examScores[index];
      let badgeClass = '';
      
      if (score !== null) {
        if (score >= 85) badgeClass = 'bg-success';
        else if (score >= 75) badgeClass = 'bg-info';
        else if (score >= 65) badgeClass = 'bg-warning';
        else badgeClass = 'bg-danger';
      }
      
      const cell = $(`
        <td class="text-center">
          ${score !== null ? 
            `<span class="badge ${badgeClass} px-2 py-1 rounded-pill">${score.toFixed(1)}%</span>` : 
            `<span class="text-muted">-</span>`}
        </td>
      `);
      
      row.append(cell);
    });
    
    // Add average score cell
    let avgBadgeClass = '';
    if (avgScore >= 85) avgBadgeClass = 'bg-success';
    else if (avgScore >= 75) avgBadgeClass = 'bg-info';
    else if (avgScore >= 65) avgBadgeClass = 'bg-warning';
    else avgBadgeClass = 'bg-danger';
    
    row.append(`
      <td class="text-center">
        <span class="badge ${avgBadgeClass} px-2 py-1 rounded-pill">${avgScore.toFixed(1)}%</span>
      </td>
    `);
    
    // Add trend cell
    row.append(`
      <td class="text-center">
        <div class="trend-indicator ${trendClass}">
          ${trendIcon}
        </div>
      </td>
    `);
    
    tbody.append(row);
  });
  
  table.append(tbody);
  tableContainer.append(table);
  tagStudentTableSection.append(tableContainer);
  
  // Add student search functionality
  $("#tag-student-search").on("keyup", function() {
    const value = $(this).val().toLowerCase();
    gridOptions.api.setGridOption('quickFilterText', value);
    
    // Show empty state if no results
    if ($(".student-search-row:visible").length === 0) {
      if ($("#no-results-message").length === 0) {
        tagStudentTableSection.append(`
          <div id="no-results-message" class="alert alert-info mt-3">
            <i class="fas fa-info-circle me-2"></i>
            No students match your search criteria. Try another search term.
          </div>
        `);
      }
    } else {
      $("#no-results-message").remove();
    }
  });
}

// Document ready function
$(document).ready(function () {
  // Check if required libraries are loaded
  checkRequiredLibraries();
  
  // Load data
  fetchAndProcessData();

  // Initialize tooltips
  $('[data-bs-toggle="tooltip"]').tooltip();

  // Add this to fix chart tooltips after charts are initialized
  setTimeout(fixChartTooltips, 1000);

  // Share Modal setup
 
  // Initialize Floating Action Button
  $("#fab-main").on("click", function() {
    $(this).toggleClass("active");
    $(".fab-actions").toggleClass("active");
  });
  
  $("#fab-export-pdf").on("click", function() {
    $("#exportPDF").trigger("click");
  });
  
  $("#fab-refresh").on("click", function() {
    // Show loading spinner
    const loadingToast = showToast("Refreshing data...", "info");
    
    // Add rotation animation to the refresh icon
    $(this).find("i").addClass("fa-spin");
    
    // Reload data after a short delay to show the animation
    setTimeout(function() {
      fetchAndProcessData();
      hideToast(loadingToast);
      $("#fab-refresh").find("i").removeClass("fa-spin");
      showToast("Data refreshed successfully!", "success");
    }, 1500);
  });
  
  // Copy share link
  $("#copyLinkBtn").on("click", function () {
    const shareLinkInput = $("#shareLink")[0];
    shareLinkInput.select();
    document.execCommand("copy");

    // Change button text temporarily
    const originalHTML = $(this).html();
    $(this).html('<i class="fas fa-check"></i> Copied');

    setTimeout(() => {
      $(this).html(originalHTML);
    }, 2000);
    
    // Show success toast
    showToast("Link copied to clipboard!", "success");
  });



  // Export to Excel with improved UI
  $("#exportExcel").on("click", function (e) {
    e.preventDefault();
    
    // Show loading indicator
    const loadingToast = showToast('<i class="fas fa-spinner fa-spin me-2"></i>Generating Excel file...', "info");
    
    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Add metadata
      workbook.Props = {
        Title: "Academic Performance Report",
        Subject: "Student Performance Data",
        Author: "Screener Dashboard",
        CreatedDate: new Date()
      };
      
      // Prepare student data for export
      const studentExportData = studentsData.map(student => {
        const data = {
          'Student Name': student.name
        };
        
        // Add tag scores
        tagNames.forEach(tag => {
          data[tag] = student.tagScores[tag] ? student.tagScores[tag].toFixed(1) + '%' : 'N/A';
        });
        
        // Add overall score
        const scores = Object.values(student.tagScores);
        const overallScore = scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0;
        data['Overall Score'] = overallScore.toFixed(1) + '%';
        
        return data;
      });
      
      // Create worksheet from student data
      const worksheet = XLSX.utils.json_to_sheet(studentExportData);
      
      // Add auto-filter
      worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(
        XLSX.utils.decode_range(worksheet['!ref']).s,
        XLSX.utils.decode_range(worksheet['!ref']).e
      )};
      
      // Style the headers
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({r: 0, c: C});
        if(!worksheet[address]) continue;
        worksheet[address].s = {
          font: {bold: true},
          fill: {fgColor: {rgb: "DDDDDD"}}
        };
      }
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Student Performance");
      
      // Add a summary sheet
      const summaryData = [
        ['Academic Performance Summary'],
        [],
        ['Total Exams', examTypes.length],
        ['Total Students', studentsData.length],
        ['Total Tags', tagNames.length],
        ['Generated On', new Date().toLocaleDateString()],
        [],
        ['Tag Performance Summary'],
        ['Tag Name', 'Average Score', 'Highest Score', 'Lowest Score'],
      ];
      
      // Add tag performance data
      tagNames.forEach((tag, index) => {
        const scores = [];
        studentsData.forEach(student => {
          if (student.tagScores[tag]) {
            scores.push(student.tagScores[tag]);
          }
        });
        
        const avgScore = scores.length > 0 
          ? scores.reduce((a, b) => a + b, 0) / scores.length 
          : 0;
          
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
        
        summaryData.push([
          tag, 
          avgScore.toFixed(1) + '%', 
          highestScore.toFixed(1) + '%', 
          lowestScore.toFixed(1) + '%'
        ]);
      });
      
      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");
      
      // Generate Excel file
      XLSX.writeFile(workbook, "academic-performance-data.xlsx");
      
      hideToast(loadingToast);
      showToast('<i class="fas fa-check-circle me-2"></i>Excel file successfully generated!', "success");
    } catch (error) {
     
      hideToast(loadingToast);
      showToast('<i class="fas fa-exclamation-circle me-2"></i>Failed to generate Excel file. Please try again.', "danger");
    }
  });

  // Enhanced CSV export
  $("#exportCSV").on("click", function (e) {
    e.preventDefault();
    
    // Show loading indicator with animation
    const loadingToast = showToast('<i class="fas fa-spinner fa-spin me-2"></i>Generating CSV file...', "info");
    
    try {
      // Create CSV header
      let csvContent = "data:text/csv;charset=utf-8,Student Name";
      
      // Add tag names to header
      tagNames.forEach(tag => {
        csvContent += `,${tag}`;
      });
      
      // Add overall score header
      csvContent += ",Overall Score\n";
      
      // Add student data rows
      studentsData.forEach(student => {
        // Add student name and ID
        csvContent += `"${student.name}"`;
        
        // Add tag scores
        tagNames.forEach(tag => {
          const score = student.tagScores[tag] ? student.tagScores[tag].toFixed(1) + '%' : 'N/A';
          csvContent += `,"${score}"`;
        });
        
        // Add overall score
        const scores = Object.values(student.tagScores);
        const overallScore = scores.length > 0
          ? scores.reduce((sum, score) => sum + (score || 0), 0) / scores.length
          : 0;
        csvContent += `,"${overallScore.toFixed(1)}%"\n`;
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = $("<a>").attr({
        href: encodedUri,
        download: "student-performance-data.csv",
      });
      
      // Trigger download
      $("body").append(link);
      link[0].click();
      link.remove();
      
      hideToast(loadingToast);
      showToast('<i class="fas fa-check-circle me-2"></i>CSV file successfully generated!', "success");
    } catch (error) {
     
      hideToast(loadingToast);
      showToast('<i class="fas fa-exclamation-circle me-2"></i>Failed to generate CSV file. Please try again.', "danger");
    }
  });

  // Export chart images with improved UI
  $("#exportImages").on("click", function (e) {
    e.preventDefault();
    
    // Show loading indicator with animation
    const loadingToast = showToast('<i class="fas fa-spinner fa-spin me-2"></i>Exporting chart images...', "info");
    
    try {
      // Define charts to export
      const charts = [
        { chart: window.tagPerformanceChart, name: 'tag-performance' },
        { chart: window.examProgressChart, name: 'exam-progress' },
        { chart: window.tagDistributionChart, name: 'tag-distribution' },
        { chart: window.skillRadarChart, name: 'skill-radar' }
      ];
      
      // Create zip file to contain all images
      const zip = new JSZip();
      const imgFolder = zip.folder("chart-images");
      
      // Export each chart as an image
      const promises = charts.map(({ chart, name }) => {
        return new Promise((resolve, reject) => {
          if (!chart) {
            resolve(); // Skip if chart doesn't exist
            return;
          }
          
          // Use ApexCharts export functionality
          chart.dataURI().then(({ imgURI }) => {
            // Convert data URI to blob
            const byteString = atob(imgURI.split(',')[1]);
            const mimeString = imgURI.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            
            const blob = new Blob([ab], { type: mimeString });
            imgFolder.file(`${name}.png`, blob);
            resolve();
          }).catch(reject);
        });
      });
      
      // When all exports are done, generate the zip file
      Promise.all(promises)
        .then(() => {
          // Add readme file
          imgFolder.file("README.txt", 
            "Academic Performance Dashboard\n" +
            "Chart Images Export\n\n" +
            "Generated: " + new Date().toLocaleString() + "\n\n" +
            "Files included:\n" +
            "- tag-performance.png: Shows average score per knowledge area\n" +
            "- exam-progress.png: Shows performance trends across exams\n" +
            "- tag-distribution.png: Shows distribution of knowledge areas\n" +
            "- skill-radar.png: Shows skills radar for class average\n"
          );
          
          zip.generateAsync({ type: "blob" })
            .then((content) => {
              // Create download link for zip file
              const link = document.createElement('a');
              link.href = URL.createObjectURL(content);
              link.download = "chart-images.zip";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              hideToast(loadingToast);
              showToast('<i class="fas fa-check-circle me-2"></i>Chart images successfully exported!', "success");
            });
        })
        .catch(error => {
         
          hideToast(loadingToast);
          showToast('<i class="fas fa-exclamation-circle me-2"></i>Failed to export chart images. Please try again.', "danger");
        });
    } catch (error) {
    
      hideToast(loadingToast);
      showToast('<i class="fas fa-exclamation-circle me-2"></i>Failed to export chart images. Please try again.', "danger");
    }
  });

  // Filter change events with animation
  $("#exam-filter, #tag-filter, #student-filter, #performance-filter").on(
    "change",
    function() {
      // Show loading indicator
      const loadingToast = showToast("Applying filters...", "info");
      
      // Slight delay to show the animation
      setTimeout(() => {
        applyFilters();
        hideToast(loadingToast);
      }, 300);
    }
  );

  // Delegate event handler for student view buttons with animation
  $(document).on("click", ".view-student", function () {
    const studentId = $(this).data("student-id");
    
    // Add loading animation to the button
    const originalHTML = $(this).html();
    $(this).html('<i class="fas fa-spinner fa-spin"></i>');
    
    // Slight delay for animation
    setTimeout(() => {
    showStudentDetail(studentId);
      // Restore button
      $(this).html(originalHTML);
    }, 300);
  });

  // Handle click event for showing student detail with smooth animation
  $(document).on("click", "#view-student-performance", function () {
    const studentId = $(this).data("student-id");
        $('.view-student-button').each(function () {
      if ($(this).prop('disabled')) {
        $(this).prop('disabled', false); 
      }
    });
    // Add loading indicator to button
    const $button = $(this);
    const originalHTML = $button.html();
    $button.html('<i class="fas fa-spinner fa-spin"></i>');
    $button.prop('disabled', true);
    
    // Delay to show loading animation
    setTimeout(() => {
    showStudentDetail(studentId);
      // Restore button
      $button.html(originalHTML);
    }, 300);
  });

  // Restore the share button functionality:
  // Share Modal setup
  const shareModal = new bootstrap.Modal($("#shareModal")[0]);
  $("#shareBtn").on("click", function () {
    shareModal.show();
  });

  // Initialize Floating Action Button
});

// Add this function near the end of the file, before the document ready function
function setApexChartLegendTitles(chart, fullTitles) {
  if (!chart || !chart.el || !fullTitles || !fullTitles.length) return;
  
  // Only process line charts
  if (chart.w.config.chart.type !== 'line') return;
  
  const chartId = chart.el.id;
  const selector = `#${chartId} .apexcharts-legend-text`;
  const legendItems = document.querySelectorAll(selector);
  
  if (legendItems.length === 0) {
    // Try again if elements aren't found
    setTimeout(() => setApexChartLegendTitles(chart, fullTitles), 500);
    return;
  }
  
  legendItems.forEach((item, index) => {
    if (index < fullTitles.length) {
      item.setAttribute('title', fullTitles[index]);
      // Add data attribute for easier debugging
      item.setAttribute('data-full-tag', fullTitles[index]);
    }
  });
  
  // Add event listener to the chart container to handle dynamically added elements
  const observer = new MutationObserver((mutations) => {
    const newLegendItems = document.querySelectorAll(selector);
    if (newLegendItems.length > 0) {
      newLegendItems.forEach((item, index) => {
        if (index < fullTitles.length && !item.hasAttribute('title')) {
          item.setAttribute('title', fullTitles[index]);
          item.setAttribute('data-full-tag', fullTitles[index]);
        }
      });
    }
  });
  
  observer.observe(document.getElementById(chartId), {
    childList: true,
    subtree: true
  });
  
  // Store the observer reference on the chart object to prevent garbage collection
  chart.legendObserver = observer;
}

// Function to fix chart tooltips and enable horizontal scrolling
function fixChartTooltips() {
  // Apply CSS to fix tooltip visibility and chart scrolling
  const style = document.createElement('style');
  style.textContent = `
    .apexcharts-tooltip {
      z-index: 1000 !important;
      overflow: visible !important;
      background-color: rgba(0, 0, 0, 0.8) !important;
      border-radius: 5px !important;
      box-shadow: 0 3px 10px rgba(0,0,0,0.2) !important;
      pointer-events: none !important;
      max-width: 350px !important;
      width: auto !important;
      min-width: 200px !important;
      white-space: normal !important;
      word-wrap: break-word !important;
      text-overflow: unset !important;
    }
    .apexcharts-canvas {
      overflow: visible !important;
    }
    .chart-container {
      position: relative !important;
    }
    .apexcharts-tooltip-title {
      white-space: normal !important;
      overflow-wrap: break-word !important;
      word-break: break-word !important;
      width: auto !important;
      max-width: 300px !important;
    }
    .apexcharts-xaxistooltip {
      overflow: visible !important;
      white-space: normal !important;
      word-wrap: break-word !important;
      width: auto !important;
      max-width: 300px !important;
    }
  `;
  document.head.appendChild(style);
  
  // Fix horizontal scrolling for tag performance chart
  const tagChartContainer = document.getElementById('tagPerformanceChart');
  if (tagChartContainer) {
    // Apply scrolling styles directly
    tagChartContainer.style.overflowX = 'auto';
    tagChartContainer.style.overflowY = 'hidden';
    tagChartContainer.style.maxWidth = '100%';
    tagChartContainer.style.paddingBottom = '10px';
    
    // Add scroll indicator if not already present
    if (!document.querySelector('.chart-scroll-indicator')) {
      const scrollIndicator = document.createElement('div');
      scrollIndicator.className = 'chart-scroll-indicator';
      scrollIndicator.innerHTML = `
        <div style="text-align: center; font-size: 12px; color: #666; margin: 5px 0;">
          <i class="fas fa-arrows-alt-h"></i> Scroll horizontally to see all bars
        </div>
      `;
      tagChartContainer.parentNode.insertBefore(scrollIndicator, tagChartContainer.nextSibling);
    }
  }
  
  // Fix all charts in the dashboard
  const charts = [
    { chart: window.tagPerformanceChart, id: 'tagPerformanceChart' },
    { chart: window.tagDistributionChart, id: 'tagDistributionChart' },
    { chart: window.examProgressChart, id: 'examProgressChart' },
    { chart: window.skillRadarChart, id: 'skillRadarChart' }
  ];
  
  // Update all charts to apply new styling
  charts.forEach(({ chart, id }) => {
    if (chart) {
      try {
        chart.update();
      } catch (e) {
       
      }
    }
  });

  // Add special handling for the donut chart:
  // Update all charts to apply new styling
  charts.forEach(({ chart, id }) => {
    if (chart) {
      try {
        // Special handling for donut chart (tagDistributionChart)
        if (id === 'tagDistributionChart' && chart.w && chart.w.config && chart.w.config.tooltip) {
          // Force fixed tooltip position for donut chart to prevent edge overflow
          const tooltipConfig = chart.w.config.tooltip;
          tooltipConfig.followCursor = false;
          tooltipConfig.fixed = {
            enabled: true,
            position: 'center',
            offsetY: 0,
            offsetX: 0
          };
        }
        chart.update();
      } catch (e) {
       
      }
    }
  });

  // Add tooltip configuration update:
  // Update all charts to apply new styling and dynamic tooltips
  charts.forEach(({ chart, id }) => {
    if (chart) {
      try {
        // Update tooltip options to follow cursor for all charts
        if (chart.w && chart.w.config && chart.w.config.tooltip) {
          const tooltipConfig = chart.w.config.tooltip;
          tooltipConfig.followCursor = true;
          if (tooltipConfig.fixed) {
            tooltipConfig.fixed.enabled = false;
          }
        }
        chart.update();
      } catch (e) {
       
      }
    }
  });

  // Simplify to avoid duplicate updates:
  // Only update charts that haven't been processed yet
  charts.forEach(({ chart, id }) => {
    if (chart) {
      try {
        chart.update();
      } catch (e) {
       
      }
    }
  });
}

  // Export to PDF with improved UI
  $("#exportPDF").on("click", function (e) {
    e.preventDefault();
    
    // Show loading indicator with animation
    const loadingToast = showToast('<i class="fas fa-spinner fa-spin me-2"></i>Generating PDF report...', "info");
    const contentElement = document.getElementById('main-content');

    // First, wait for all charts to be fully rendered
    setTimeout(() => {
      // Pre-process images to avoid CORS issues
      const images = contentElement.querySelectorAll('img');
      let imagesLoaded = true;
      
      images.forEach(img => {
        // Skip already loaded images
        if (!img.complete) {
          imagesLoaded = false;
          // Add error handler to prevent blocking
          img.onerror = function() {
            this.onerror = null;
            // Replace with a placeholder or remove
            this.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            this.alt = 'Image failed to load';
            this.style.display = 'none'; // Hide failed images
          };
        }
      });

      const options = {
        margin: [10, 10, 10, 10], // [top, right, bottom, left] in mm
        filename: 'Academic_Performance_Dashboard.pdf',
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          allowTaint: true, // Allow tainted canvas
          foreignObjectRendering: false, // Disable foreignObject which can cause issues
          logging: false, // Disable logging
          imageTimeout: 5000, // Increase timeout for image loading
          onclone: function(clonedDoc) {
            // Fix chart sizing in the cloned document
            const charts = clonedDoc.querySelectorAll('.apexcharts-canvas');
            charts.forEach(chart => {
              chart.style.width = '100%';
              // Ensure SVG is properly sized
              const svg = chart.querySelector('svg');
              if (svg) {
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
              }
            });
          }
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          compress: true,
          hotfixes: ["px_scaling"],
        },
      };

      html2pdf()
        .set(options)
        .from(contentElement)
        .save()
        .then(() => {
          hideToast(loadingToast);
          showToast('<i class="fas fa-check-circle me-2"></i>PDF generated successfully!', "success");
        })
        .catch((error) => {
          console.error("Error generating PDF:", error);
          hideToast(loadingToast);
          
          // More informative error message
          showToast(
            '<i class="fas fa-exclamation-circle me-2"></i>PDF generation failed. This may be due to image loading issues. Please try again.', 
            "danger"
          );
        });
    }, 1000); // Give charts time to render completely
  });
  