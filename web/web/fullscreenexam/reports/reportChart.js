function renderChart(
  chartId,
  currentValue,
  totalValue,
  currentColor,
  totalColor
) {
  // Destroy existing chart instance if it exists
  const chartElement = chartId[0]; // Get DOM element from jQuery object
  if (chartElement.chart) {
    chartElement.chart.destroy();
  }

  const chartConfig = {
    type: "doughnut",
    options: {
      cutout: "65%",
      circumference: 180,
      rotation: -90,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function(context) {
              const labels = [' Present Student',' Absent Student', ' Ended'];
              return `${labels[context.dataIndex]}: ${context.raw}`;
            }
          }
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  };

  // Store chart instance on element
  chartElement.chart = new Chart(chartElement, {
    ...chartConfig,
    data: {
      datasets: [
        {
          data: [currentValue, totalValue - currentValue],
          backgroundColor: [currentColor, totalColor],
          borderWidth: 0,
        },
      ],
    },
  });
}



function renderStudentStatusChart(chartId, values, colors) {
  const chartElement = chartId[0]; 
  if (chartElement.chart) {
    chartElement.chart.destroy();
  }

  const chartConfig = {
    type: "doughnut",
    options: {
      cutout: "65%",
      circumference: 180,
      rotation: -90,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function(context) {
              const labels = ['Ongoing', 'Not Started', 'Ended'];
              return `${labels[context.dataIndex]}: ${context.raw}`;
            }
          }
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  };

  chartElement.chart = new Chart(chartElement, {
    ...chartConfig,
    data: {
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    },
  });
}