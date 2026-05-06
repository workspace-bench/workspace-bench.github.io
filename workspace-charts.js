function workspaceChartColors() {
  return {
    blue: "#2563eb",
    teal: "#14b8a6",
    violet: "#7c3aed",
    amber: "#f59e0b",
    green: "#16a34a",
    slate: "#64748b",
    grid: "rgba(100, 116, 139, 0.18)",
    text: "#334155"
  };
}

function workspaceChartOptions(title, extra = {}) {
  const colors = workspaceChartColors();
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: colors.text, boxWidth: 12 } },
      title: { display: !!title, text: title, color: colors.text, font: { size: 15, weight: "600" } },
      tooltip: { mode: "index", intersect: false }
    },
    scales: {
      x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
      y: { ticks: { color: colors.text }, grid: { color: colors.grid }, beginAtZero: true }
    },
    ...extra
  };
}

function workspaceMakeBarChart(canvasId, labels, values, title, color = "#2563eb") {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return null;
  return new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: title, data: values, backgroundColor: color, borderRadius: 5 }]
    },
    options: workspaceChartOptions(title)
  });
}

function workspaceMakeDoughnutChart(canvasId, labels, values, title) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return null;
  const colors = ["#2563eb", "#14b8a6", "#7c3aed", "#f59e0b", "#16a34a", "#0ea5e9", "#db2777", "#64748b"];
  return new Chart(canvas, {
    type: "doughnut",
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { color: "#334155", boxWidth: 12 } },
        title: { display: !!title, text: title, color: "#334155", font: { size: 15, weight: "600" } }
      }
    }
  });
}

function workspaceMakeScatterChart(canvasId, points, title, xTitle, yTitle) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return null;
  return new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: [{
        label: "Systems",
        data: points,
        backgroundColor: "rgba(37, 99, 235, 0.72)",
        borderColor: "#1d4ed8",
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: workspaceChartOptions(title, {
      scales: {
        x: { title: { display: true, text: xTitle, color: "#334155" }, ticks: { color: "#334155" }, grid: { color: "rgba(100, 116, 139, 0.18)" } },
        y: { title: { display: true, text: yTitle, color: "#334155" }, ticks: { color: "#334155" }, grid: { color: "rgba(100, 116, 139, 0.18)" }, beginAtZero: true }
      },
      plugins: {
        legend: { display: false },
        title: { display: true, text: title, color: "#334155", font: { size: 15, weight: "600" } },
        tooltip: {
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
        backgroundColor: ["#16a34a", "#2563eb", "#64748b"],
        borderRadius: 5
      }]
    },
    options: workspaceChartOptions("Current Performance Gap", {
      scales: {
        x: { ticks: { color: "#334155" }, grid: { display: false } },
        y: { max: 100, ticks: { color: "#334155", callback: (v) => `${v}%` }, grid: { color: "rgba(100, 116, 139, 0.18)" } }
      }
    })
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
    "#2563eb"
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
    "#f59e0b"
  );

  workspaceMakeBarChart(
    "capabilityChart",
    capabilityData.capabilities.map((item) => item.capability),
    capabilityData.capabilities.map((item) => item.bestScore),
    "Best Score by Capability",
    "#16a34a"
  );
}

document.addEventListener("DOMContentLoaded", () => {
  workspaceInitHomeCharts().catch(console.error);
  workspaceInitDatasetCharts().catch(console.error);
});
