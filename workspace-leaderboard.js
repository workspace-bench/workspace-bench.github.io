let workspaceLeaderboardData = null;
let workspaceActiveLeaderboard = "Overall";
const workspaceSort = { field: "overall_score", direction: "desc" };
let thresholdChart;
let difficultyChart;
let workspaceProfileChart;
let abilityChart;
const workspaceChartPanelDefaults = {
  scoreCostPanel: '<canvas id="scoreCostChart" aria-label="Score versus cost chart"></canvas>',
  scoreRuntimePanel: '<canvas id="scoreRuntimeChart" aria-label="Score versus runtime chart"></canvas>'
};

async function workspaceLoadLeaderboardData() {
  if (workspaceLeaderboardData) return workspaceLeaderboardData;
  if (window.WORKSPACE_BENCH_DATA && window.WORKSPACE_BENCH_DATA.leaderboard) {
    workspaceLeaderboardData = window.WORKSPACE_BENCH_DATA.leaderboard;
    return workspaceLeaderboardData;
  }
  workspaceLeaderboardData = await workspaceFetchJson("./data/leaderboard.json");
  return workspaceLeaderboardData;
}

function workspaceGetActiveLeaderboard(data) {
  return data.leaderboards.find((item) => item.name === workspaceActiveLeaderboard) || data.leaderboards[0];
}

function workspaceRowsForView(data, viewName) {
  if (viewName === "Overall") return data.fullSummaryRows || [];
  if (viewName === "Workspace-Bench-Lite") {
    return (data.litePublicResults || []).map((row) => ({
      ...row,
      overall_score: row.rubric_pass_rate,
      task_success_rate: row.rubric_pass_rate >= 50 ? 1 : 0,
      workspace_size: "Lite",
      profile: "All profiles",
      capability: "Lite public leaderboard",
      date: "2026-05-05",
      verified: true
    }));
  }
  if (viewName === "Threshold Views") {
    return (data.thresholds || []).map((threshold, index) => {
      const hits = (data.litePublicResults || []).filter((row) => row.rubric_pass_rate >= threshold.value).length;
      return {
        rank: index + 1,
        agent: threshold.label,
        harness: "Public Lite leaderboard count",
        model: `${hits} systems`,
        overall_score: hits,
        rubric_pass_rate: threshold.value,
        task_success_rate: hits,
        workspace_size: "Lite",
        profile: "All profiles",
        capability: "Threshold count",
        date: "2026-05-05",
        verified: true,
        source: "repository-figure",
        report_url: "https://github.com/OpenDataBox/Workspace-Bench"
      };
    });
  }
  if (viewName === "By Worker Profile") {
    return (window.WORKSPACE_BENCH_DATA.leaderboardBreakdowns.workerProfiles || []).map((row, index) => ({
      rank: index + 1,
      agent: row.profile,
      harness: "Official benchmark composition",
      model: `${row.tasks} tasks`,
      overall_score: row.share,
      rubric_pass_rate: row.share,
      task_success_rate: row.tasks,
      workspace_size: "Full",
      profile: row.profile,
      capability: "Workspace profile distribution",
      date: "2026-05-05",
      verified: true,
      source: "repository-reported",
      report_url: "https://github.com/OpenDataBox/Workspace-Bench"
    }));
  }
  if (viewName === "By Difficulty") {
    return (window.WORKSPACE_BENCH_DATA.leaderboardBreakdowns.difficulty || []).map((row, index) => ({
      rank: index + 1,
      agent: row.level,
      harness: "Official task difficulty split",
      model: `${row.tasks} tasks`,
      overall_score: row.share,
      rubric_pass_rate: row.share,
      task_success_rate: row.tasks,
      workspace_size: "Full",
      profile: "All profiles",
      capability: "Task difficulty distribution",
      date: "2026-05-05",
      verified: true,
      source: "repository-reported",
      report_url: "https://github.com/OpenDataBox/Workspace-Bench"
    }));
  }
  if (viewName === "By Ability") {
    return (window.WORKSPACE_BENCH_DATA.leaderboardBreakdowns.abilities || []).map((row, index) => ({
      rank: index + 1,
      agent: row.ability,
      harness: "Official task ability count",
      model: `${row.tasks} tasks`,
      overall_score: row.tasks,
      rubric_pass_rate: row.tasks,
      task_success_rate: row.tasks,
      workspace_size: "Full",
      profile: "All profiles",
      capability: row.ability,
      date: "2026-05-05",
      verified: true,
      source: "repository-reported",
      report_url: "https://github.com/OpenDataBox/Workspace-Bench"
    }));
  }
  return [];
}

function workspaceSortRows(rows) {
  const direction = workspaceSort.direction === "asc" ? 1 : -1;
  return rows.slice().sort((a, b) => {
    const av = a[workspaceSort.field];
    const bv = b[workspaceSort.field];
    if (typeof av === "number" || typeof bv === "number") {
      const an = av === null || av === undefined ? -Infinity : Number(av);
      const bn = bv === null || bv === undefined ? -Infinity : Number(bv);
      return (an - bn) * direction;
    }
    return String(av || "").localeCompare(String(bv || "")) * direction;
  });
}

function workspaceSetSort(field) {
  if (workspaceSort.field === field) {
    workspaceSort.direction = workspaceSort.direction === "asc" ? "desc" : "asc";
  } else {
    workspaceSort.field = field;
    workspaceSort.direction = ["cost_usd", "runtime_minutes", "date", "rank"].includes(field) ? "asc" : "desc";
  }
}

function workspaceRenderTabs(data) {
  const tabs = document.getElementById("leaderboardTabs");
  if (!tabs) return;
  tabs.innerHTML = data.leaderboards.map((leaderboard) => `
    <button class="tab-button ${leaderboard.name === workspaceActiveLeaderboard ? "active" : ""}" type="button" data-leaderboard="${leaderboard.name}">
      ${leaderboard.name}
    </button>
  `).join("");

  tabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      workspaceActiveLeaderboard = button.dataset.leaderboard;
      workspaceRenderLeaderboard().catch(console.error);
    });
  });
}

function workspaceFilterRows(rows) {
  const profile = document.getElementById("profileFilter")?.value || "all";
  const framework = document.getElementById("frameworkFilter")?.value || "all";
  const model = document.getElementById("modelFilter")?.value || "all";
  const source = document.getElementById("sourceFilter")?.value || "all";
  const verified = document.getElementById("verifiedFilter")?.value || "all";
  return rows.filter((row) => {
    if (profile !== "all" && row.profile !== profile) return false;
    if (framework !== "all" && row.agent !== framework) return false;
    if (model !== "all" && row.model !== model) return false;
    if (source !== "all" && row.source !== source) return false;
    if (verified !== "all" && String(row.verified) !== verified) return false;
    return true;
  });
}

function workspaceRenderFilters(rows) {
  const profileFilter = document.getElementById("profileFilter");
  const frameworkFilter = document.getElementById("frameworkFilter");
  const modelFilter = document.getElementById("modelFilter");
  if (!profileFilter || profileFilter.dataset.ready) return;
  const profiles = Array.from(new Set(rows.map((row) => row.profile).filter(Boolean)));
  const frameworks = Array.from(new Set(rows.map((row) => row.agent).filter(Boolean)));
  const models = Array.from(new Set(rows.map((row) => row.model).filter(Boolean)));
  profileFilter.innerHTML = `<option value="all">All profiles</option>${profiles.map((profile) => `<option value="${profile}">${profile}</option>`).join("")}`;
  frameworkFilter.innerHTML = `<option value="all">All frameworks</option>${frameworks.map((framework) => `<option value="${framework}">${framework}</option>`).join("")}`;
  modelFilter.innerHTML = `<option value="all">All models</option>${models.map((model) => `<option value="${model}">${model}</option>`).join("")}`;
  [profileFilter, frameworkFilter, modelFilter, document.getElementById("sourceFilter"), document.getElementById("verifiedFilter")].forEach((control) => {
    if (control) control.addEventListener("change", () => workspaceRenderLeaderboard().catch(console.error));
  });
  profileFilter.dataset.ready = "true";
}

function workspaceRenderTable(rows) {
  const container = document.getElementById("leaderboardTable");
  if (!container) return;
  const sorted = workspaceSortRows(rows);
  const visibleCount = sorted.length;
  container.innerHTML = `
    <div class="toolbar" style="margin-top:0;margin-bottom:10px">
      <div class="table-note">Showing ${visibleCount} row${visibleCount === 1 ? "" : "s"} from the current leaderboard view.</div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th data-sort="rank">Rank</th>
            <th data-sort="agent">Agent / Harness</th>
            <th data-sort="model">Backbone Model</th>
            <th class="numeric" data-sort="overall_score">Overall Score</th>
            <th class="numeric" data-sort="rubric_pass_rate">Rubric Pass Rate</th>
            <th class="numeric" data-sort="task_success_rate">Task Success Rate</th>
            <th class="numeric" data-sort="cost_usd">Cost</th>
            <th class="numeric" data-sort="runtime_minutes">Runtime</th>
            <th data-sort="workspace_size">Workspace</th>
            <th data-sort="date">Date</th>
            <th>Verified</th>
            <th>Report</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map((row, index) => `
            <tr>
              <td class="rank">#${row.rank || index + 1}</td>
              <td>
                <strong>${row.agent}</strong><br>
                <span class="badge">${row.harness}</span>
              </td>
              <td>${row.model}</td>
              <td class="numeric score">${workspaceFormatNumber(row.overall_score, "%")}</td>
              <td class="numeric">${row.rubric_pass_rate === null ? "-" : workspaceFormatNumber(row.rubric_pass_rate, "%")}</td>
              <td class="numeric">${row.task_success_rate === null ? "-" : workspaceFormatNumber(row.task_success_rate, "%")}</td>
              <td class="numeric">${row.cost_usd === null ? "-" : `$${workspaceFormatNumber(row.cost_usd)}`}</td>
              <td class="numeric">${row.runtime_minutes === null ? "-" : `${workspaceFormatNumber(row.runtime_minutes)}m`}</td>
              <td><span class="badge badge-blue">${row.workspace_size}</span></td>
              <td>${row.date}</td>
              <td>${row.verified ? '<span class="badge badge-green">Verified</span>' : '<span class="badge">Pending</span>'}</td>
              <td><a href="${row.report_url}" target="_blank" rel="noopener noreferrer">${row.source}</a></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <p class="table-note">Rows use public Workspace-Bench aggregate information unless a future submission is marked with a maintainer-provided report.</p>
  `;

  container.querySelectorAll("th[data-sort]").forEach((header) => {
    header.style.cursor = "pointer";
    header.addEventListener("click", () => {
      workspaceSetSort(header.dataset.sort);
      workspaceRenderTable(rows);
    });
  });
}

let scoreChart;
let costChart;
let runtimeChart;

function workspaceRenderLeaderboardCharts(rows) {
  if (typeof Chart === "undefined") return;
  const agentRows = rows.filter((row) => row.model !== "Human");
  const labels = rows.map((row) => row.agent);
  const scores = rows.map((row) => row.overall_score);
  const costPanel = document.getElementById("scoreCostPanel");
  const runtimePanel = document.getElementById("scoreRuntimePanel");
  if (costPanel) costPanel.innerHTML = workspaceChartPanelDefaults.scoreCostPanel;
  if (runtimePanel) runtimePanel.innerHTML = workspaceChartPanelDefaults.scoreRuntimePanel;

  if (scoreChart) scoreChart.destroy();
  scoreChart = workspaceMakeBarChart("scoreChart", labels, scores, "Overall Score", "#2563eb");

  if (costChart) costChart.destroy();
  const costPoints = agentRows.filter((row) => row.cost_usd !== null).map((row) => ({ x: row.cost_usd, y: row.overall_score, label: row.agent }));
  if (costPoints.length > 0) {
    costChart = workspaceMakeScatterChart("scoreCostChart", costPoints, "Score vs Cost", "Cost ($)", "Score (%)");
  } else {
    if (costPanel) costPanel.innerHTML = '<h3 style="margin:0 0 8px">Score vs Cost</h3><p class="section-subtitle">No public per-system cost data has been released in the current Workspace-Bench materials.</p><p class="table-note">This panel will update automatically once cost metadata is added to the leaderboard source.</p>';
  }

  if (runtimeChart) runtimeChart.destroy();
  const runtimePoints = agentRows.filter((row) => row.runtime_minutes !== null).map((row) => ({ x: row.runtime_minutes, y: row.overall_score, label: row.agent }));
  if (runtimePoints.length > 0) {
    runtimeChart = workspaceMakeScatterChart("scoreRuntimeChart", runtimePoints, "Score vs Runtime", "Runtime (min)", "Score (%)");
  } else {
    if (runtimePanel) runtimePanel.innerHTML = '<h3 style="margin:0 0 8px">Score vs Runtime</h3><p class="section-subtitle">No public per-system runtime data has been released in the current Workspace-Bench materials.</p><p class="table-note">Runtime comparisons will render here when the source data becomes available.</p>';
  }
}

function workspaceRenderThresholdViews() {
  const data = window.WORKSPACE_BENCH_DATA.leaderboard;
  const thresholdRows = data.thresholds.map((threshold) => ({
    threshold: threshold.label,
    hits: data.litePublicResults.filter((row) => row.rubric_pass_rate >= threshold.value).length
  }));

  if (thresholdChart) thresholdChart.destroy();
  thresholdChart = workspaceMakeBarChart(
    "thresholdChart",
    thresholdRows.map((item) => item.threshold),
    thresholdRows.map((item) => item.hits),
    "Systems Clearing Each Threshold",
    "#0ea5e9"
  );

  const cards = document.getElementById("thresholdCards");
  if (cards) {
    cards.innerHTML = thresholdRows.map((item) => `
      <div class="leaderboard-stat-item">
        <div class="leaderboard-kicker">${item.threshold}</div>
        <div class="leaderboard-big-number">${item.hits}</div>
        <p>Public Lite systems at or above this rubric pass-rate threshold.</p>
      </div>
    `).join("");
  }
}

function workspaceRenderCompositionCharts() {
  const breakdowns = window.WORKSPACE_BENCH_DATA.leaderboardBreakdowns;

  if (difficultyChart) difficultyChart.destroy();
  difficultyChart = workspaceMakeDoughnutChart(
    "difficultyChart",
    breakdowns.difficulty.map((item) => item.level),
    breakdowns.difficulty.map((item) => item.tasks),
    "Task Difficulty"
  );

  if (workspaceProfileChart) workspaceProfileChart.destroy();
  workspaceProfileChart = workspaceMakeDoughnutChart(
    "workspaceProfileChart",
    breakdowns.workerProfiles.map((item) => item.profile),
    breakdowns.workerProfiles.map((item) => item.tasks),
    "Task per Workspace"
  );

  if (abilityChart) abilityChart.destroy();
  abilityChart = workspaceMakeHorizontalBarChart(
    "abilityChart",
    breakdowns.abilities.map((item) => item.ability),
    breakdowns.abilities.map((item) => item.tasks),
    "Task Abilities",
    "#f59e0b"
  );
}

async function workspaceRenderLeaderboard() {
  const data = await workspaceLoadLeaderboardData();
  workspaceRenderTabs(data);
  const leaderboard = workspaceGetActiveLeaderboard(data);
  const allRows = workspaceRowsForView(data, leaderboard.name);
  const filterRows = [
    ...workspaceRowsForView(data, "Overall"),
    ...workspaceRowsForView(data, "Workspace-Bench-Lite"),
    ...workspaceRowsForView(data, "Threshold Views"),
    ...workspaceRowsForView(data, "By Worker Profile"),
    ...workspaceRowsForView(data, "By Difficulty"),
    ...workspaceRowsForView(data, "By Ability")
  ];
  workspaceRenderFilters(filterRows);
  const rows = workspaceFilterRows(allRows);

  const description = document.getElementById("leaderboardDescription");
  if (description) description.textContent = leaderboard.description;

  workspaceRenderTable(rows);
  workspaceRenderLeaderboardCharts(rows);
  workspaceRenderThresholdViews();
  workspaceRenderCompositionCharts();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("leaderboardTable")) {
    workspaceRenderLeaderboard().catch((error) => {
      const container = document.getElementById("leaderboardTable");
      if (container) container.innerHTML = `<div class="callout">Unable to load leaderboard data: ${error.message}</div>`;
      console.error(error);
    });
  }
});
