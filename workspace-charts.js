function workspaceChartColors() {
  return {
    blue: "#5b3df5",
    teal: "#14b8a6",
    violet: "#7c3aed",
    amber: "#d9a300",
    green: "#1f9d55",
    slate: "#6b7280",
    grid: "rgba(17, 17, 17, 0.08)",
    text: "#555555"
  };
}

function workspaceSetCanvasHeight(canvas, aspectRatio) {
  if (!canvas || !aspectRatio) return;
  if (
    canvas.closest(".leaderboard-chart-card") ||
    canvas.closest(".lite-ranking-canvas-wrap") ||
    canvas.closest(".leaderboard-composition-card") ||
    canvas.closest(".leaderboard-tall-card")
  ) {
    return;
  }
  requestAnimationFrame(() => {
    canvas.height = Math.round(canvas.offsetWidth / aspectRatio);
  });
}

function workspaceChartOptions(extra = {}) {
  const colors = workspaceChartColors();
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: colors.text, boxWidth: 12 } },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "#ffffff",
        titleColor: "#111111",
        bodyColor: "#5f6368",
        borderColor: "#dddddd",
        borderWidth: 1
      }
    },
    scales: {
      x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
      y: { ticks: { color: colors.text }, grid: { color: colors.grid }, beginAtZero: true }
    },
    ...extra
  };
}

function workspaceMakeBarChart(canvasId, labels, values, title, color = "#5b3df5") {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return null;
  const chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: title, data: values, backgroundColor: color, borderRadius: 4 }]
    },
    options: workspaceChartOptions({ aspectRatio: 1.8 })
  });
  workspaceSetCanvasHeight(canvas, 1.8);
  return chart;
}

function workspaceMakeDenseBarChart(canvasId, labels, values, title, color = "#5b3df5") {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return null;
  const colors = workspaceChartColors();
  const maxValue = Math.max(...values.map((value) => Number(value) || 0), 1);
  const chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: title,
        data: values,
        backgroundColor: color,
        borderRadius: 6,
        categoryPercentage: 0.92,
        barPercentage: 0.82,
        maxBarThickness: 58
      }]
    },
    options: workspaceChartOptions({
      indexAxis: "y",
      aspectRatio: 2.5,
      layout: { padding: { top: 4, right: 14, bottom: 0, left: 0 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#111111",
          bodyColor: "#5f6368",
          borderColor: "#dddddd",
          borderWidth: 1
        }
      },
      scales: {
        x: {
          max: Math.ceil(maxValue * 1.08),
          ticks: { color: colors.text, precision: 0 },
          grid: { color: colors.grid },
          beginAtZero: true
        },
        y: {
          ticks: { color: colors.text },
          grid: { display: false }
        }
      }
    })
  });
  workspaceSetCanvasHeight(canvas, 2.5);
  return chart;
}

function workspaceMakeHorizontalBarChart(canvasId, labels, values, title, color = "#5b3df5") {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return null;
  const colors = workspaceChartColors();
  const chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: title, data: values, backgroundColor: color, borderRadius: 4 }]
    },
    options: workspaceChartOptions({
      indexAxis: "y",
      aspectRatio: 1.5,
      layout: {
        padding: {
          left: 12,
          right: 12
        }
      },
      scales: {
        x: { ticks: { color: colors.text }, grid: { color: colors.grid }, beginAtZero: true },
        y: {
          ticks: {
            color: colors.text,
            autoSkip: false,
            callback: function(value) {
              const label = this.getLabelForValue(value);
              return label.length > 28 ? `${label.slice(0, 28)}...` : label;
            }
          },
          grid: { display: false }
        }
      }
    })
  });
  workspaceSetCanvasHeight(canvas, 1.5);
  return chart;
}

function workspaceMakeDoughnutChart(canvasId, labels, values, title) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return null;
  const colors = ["#5b3df5", "#14b8a6", "#7c3aed", "#d9a300", "#1f9d55", "#0ea5e9", "#db2777", "#6b7280"];
  const chart = new Chart(canvas, {
    type: "doughnut",
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 1.4,
      plugins: {
        legend: { position: "bottom", labels: { color: "#555555", boxWidth: 12 } },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#111111",
          bodyColor: "#5f6368",
          borderColor: "#dddddd",
          borderWidth: 1
        }
      }
    }
  });
  workspaceSetCanvasHeight(canvas, 1.4);
  return chart;
}

function workspaceMakeLargeDoughnutChart(canvasId, labels, values, title) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return null;
  const colors = ["#5b3df5", "#14b8a6", "#7c3aed", "#d9a300", "#1f9d55", "#0ea5e9", "#db2777", "#6b7280"];
  const chart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: "#ffffff",
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 1.2,
      cutout: "34%",
      radius: "98%",
      layout: { padding: { top: 0, right: 0, bottom: 0, left: 0 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#111111",
          bodyColor: "#5f6368",
          borderColor: "#dddddd",
          borderWidth: 1
        }
      }
    }
  });
  workspaceSetCanvasHeight(canvas, 1.2);
  return chart;
}

function workspaceMakeScatterChart(canvasId, points, title, xTitle, yTitle) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return null;
  const chart = new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: [{
        label: "Systems",
        data: points,
        backgroundColor: "rgba(91, 61, 245, 0.72)",
        borderColor: "#4a30d9",
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: workspaceChartOptions({
      aspectRatio: 1.5,
      scales: {
        x: { title: { display: true, text: xTitle, color: "#555555" }, ticks: { color: "#555555" }, grid: { color: "rgba(17, 17, 17, 0.08)" } },
        y: { title: { display: true, text: yTitle, color: "#555555" }, ticks: { color: "#555555" }, grid: { color: "rgba(17, 17, 17, 0.08)" }, beginAtZero: true }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#111111",
          bodyColor: "#5f6368",
          borderColor: "#dddddd",
          borderWidth: 1,
          callbacks: {
            label: (context) => {
              const item = context.raw;
              return `${item.label}: ${xTitle} ${item.x}, ${yTitle} ${item.y}`;
            }
          }
        }
      }
    })
  });
  workspaceSetCanvasHeight(canvas, 1.5);
  return chart;
}

async function workspaceInitHomeCharts() {
  const gapCanvas = document.getElementById("homeGapChart");
  if (!gapCanvas || typeof Chart === "undefined") return;
  new Chart(gapCanvas, {
    type: "bar",
    data: {
      labels: ["Human", "Best Agent", "Average Agent"],
      datasets: [{
        label: "Score",
        data: [80.7, 68.7, 47.4],
        backgroundColor: ["#1f9d55", "#5b3df5", "#9ca3af"],
        borderRadius: 4
      }]
    },
    options: workspaceChartOptions({
      scales: {
        x: { ticks: { color: "#555555" }, grid: { display: false } },
        y: { max: 100, ticks: { color: "#555555", callback: (v) => `${v}%` }, grid: { color: "rgba(17, 17, 17, 0.08)" } }
      }
    })
  });
}

async function workspaceInitHeroChart() {
  const canvas = document.getElementById("heroLiteChart");
  if (!canvas || typeof Chart === "undefined") return;
  const colors = workspaceChartColors();
  const topResults = [
    { agent: "OpenClaw", model: "Opus-4.7", score: 66.6 },
    { agent: "ClaudeCode", model: "Opus-4.7", score: 64.4 },
    { agent: "Hermes", model: "Opus-4.7", score: 64.3 },
    { agent: "DeepAgent", model: "GLM-5.1", score: 60.8 },
    { agent: "Hermes", model: "GLM-5.1", score: 57.7 },
    { agent: "OpenClaw", model: "GLM-5.1", score: 57.5 },
    { agent: "ClaudeCode", model: "MiniMax-M2.7", score: 54.6 },
    { agent: "DeepAgent", model: "Opus-4.7", score: 54.3 },
    { agent: "ClaudeCode", model: "GLM-5.1", score: 52.4 },
    { agent: "Hermes", model: "MiniMax-M2.7", score: 52.3 }
  ];
  new Chart(canvas, {
    type: "bar",
    data: {
      labels: topResults.map((r) => `${r.agent}\n${r.model}`),
      datasets: [{
        label: "Rubric pass rate",
        data: topResults.map((r) => r.score),
        backgroundColor: topResults.map((r, i) =>
          i === 0 ? "#1f9d55" : i < 3 ? "#5b3df5" : "#9ca3af"
        ),
        borderRadius: 3,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#111111",
          bodyColor: "#5f6368",
          borderColor: "#dddddd",
          borderWidth: 1,
          callbacks: {
            label: (ctx) => ` ${ctx.raw}%`
          }
        }
      },
      scales: {
        x: {
          max: 80,
          ticks: { color: colors.text, callback: (v) => `${v}%`, precision: 0 },
          grid: { color: colors.grid }
        },
        y: {
          ticks: {
            color: colors.text,
            font: { size: 9 },
            callback: function(value) {
              const label = this.getLabelForValue(value);
              return label.length > 20 ? `${label.slice(0, 20)}...` : label;
            }
          },
          grid: { display: false }
        }
      }
    }
  });
}

async function workspaceInitDatasetCharts() {
  if (!document.getElementById("fileTypeChart")) return;
  const stats = window.WORKSPACE_BENCH_DATA?.datasetStats || await workspaceFetchJson("./data/dataset-stats.json");
  const profileData = window.WORKSPACE_BENCH_DATA?.profileResults || await workspaceFetchJson("./data/profile-results.json");
  const capabilityData = window.WORKSPACE_BENCH_DATA?.capabilityResults || await workspaceFetchJson("./data/capability-results.json");

  workspaceMakeDoughnutChart(
    "fileTypeChart",
    stats.fileTypeGroups.map((item) => item.group),
    stats.fileTypeGroups.map((item) => item.count),
    "File Type Distribution"
  );

  workspaceMakeBarChart(
    "taskComplexityChart",
    stats.complexity.map((item) => item.bucket),
    stats.complexity.map((item) => item.tasks),
    "Required Files per Task",
    "#5b3df5"
  );

  workspaceMakeBarChart(
    "workspaceSizeChart",
    stats.workspaceSizes.map((item) => item.bucket),
    stats.workspaceSizes.map((item) => item.tasks),
    "Workspace Size Distribution",
    "#14b8a6"
  );

  workspaceMakeBarChart(
    "rubricCountChart",
    stats.rubricCounts.map((item) => item.bucket),
    stats.rubricCounts.map((item) => item.tasks),
    "Rubric Count per Task",
    "#7c3aed"
  );

  workspaceMakeBarChart(
    "profileTaskChart",
    profileData.profiles.map((item) => item.profile),
    profileData.profiles.map((item) => item.tasks),
    "Tasks by Worker Profile",
    "#d9a300"
  );

  workspaceMakeBarChart(
    "capabilityChart",
    capabilityData.capabilities.map((item) => item.capability),
    capabilityData.capabilities.map((item) => item.bestScore),
    "Best Score by Capability",
    "#1f9d55"
  );
}

document.addEventListener("DOMContentLoaded", () => {
  workspaceInitHomeCharts().catch(console.error);
  workspaceInitDatasetCharts().catch(console.error);
});
