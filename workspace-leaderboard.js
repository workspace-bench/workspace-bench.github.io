let workspaceLeaderboardData = null;
let workspaceActiveLeaderboard = "Overall";
const workspaceSort = { field: "overall_score", direction: "desc" };

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
  const source = document.getElementById("sourceFilter")?.value || "all";
  const verified = document.getElementById("verifiedFilter")?.value || "all";
  return rows.filter((row) => {
    if (profile !== "all" && row.profile !== profile) return false;
    if (source !== "all" && row.source !== source) return false;
    if (verified !== "all" && String(row.verified) !== verified) return false;
    return true;
  });
}

function workspaceRenderFilters(rows) {
  const profileFilter = document.getElementById("profileFilter");
  if (!profileFilter || profileFilter.dataset.ready) return;
  const profiles = Array.from(new Set(rows.map((row) => row.profile).filter(Boolean)));
  profileFilter.innerHTML = `<option value="all">All profiles</option>${profiles.map((profile) => `<option value="${profile}">${profile}</option>`).join("")}`;
  [profileFilter, document.getElementById("sourceFilter"), document.getElementById("verifiedFilter")].forEach((control) => {
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

  if (scoreChart) scoreChart.destroy();
  scoreChart = workspaceMakeBarChart("scoreChart", labels, scores, "Overall Score", "#2563eb");

  if (costChart) costChart.destroy();
  const costPoints = agentRows.filter((row) => row.cost_usd !== null).map((row) => ({ x: row.cost_usd, y: row.overall_score, label: row.agent }));
  if (costPoints.length > 0) {
    costChart = workspaceMakeScatterChart("scoreCostChart", costPoints, "Score vs Cost", "Cost ($)", "Score (%)");
  } else {
    const canvas = document.getElementById("scoreCostChart");
    const parent = canvas?.closest(".chart-card");
    if (parent) parent.innerHTML = '<h3 style="margin:0 0 8px">Score vs Cost</h3><p class="section-subtitle">No public per-system cost data has been released in the current Workspace-Bench materials.</p><p class="table-note">This panel will update automatically once cost metadata is added to the leaderboard source.</p>';
  }

  if (runtimeChart) runtimeChart.destroy();
  const runtimePoints = agentRows.filter((row) => row.runtime_minutes !== null).map((row) => ({ x: row.runtime_minutes, y: row.overall_score, label: row.agent }));
  if (runtimePoints.length > 0) {
    runtimeChart = workspaceMakeScatterChart("scoreRuntimeChart", runtimePoints, "Score vs Runtime", "Runtime (min)", "Score (%)");
  } else {
    const canvas = document.getElementById("scoreRuntimeChart");
    const parent = canvas?.closest(".chart-card");
    if (parent) parent.innerHTML = '<h3 style="margin:0 0 8px">Score vs Runtime</h3><p class="section-subtitle">No public per-system runtime data has been released in the current Workspace-Bench materials.</p><p class="table-note">Runtime comparisons will render here when the source data becomes available.</p>';
  }
}

async function workspaceRenderLeaderboard() {
  const data = await workspaceLoadLeaderboardData();
  workspaceRenderTabs(data);
  const leaderboard = workspaceGetActiveLeaderboard(data);
  const allRows = leaderboard.results || [];
  workspaceRenderFilters(data.leaderboards.flatMap((item) => item.results || []));
  const rows = workspaceFilterRows(allRows);

  const description = document.getElementById("leaderboardDescription");
  if (description) description.textContent = leaderboard.description;

  workspaceRenderTable(rows);
  workspaceRenderLeaderboardCharts(rows);
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
