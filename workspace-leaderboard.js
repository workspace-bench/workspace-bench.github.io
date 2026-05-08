let workspaceLeaderboardData = null;
let workspaceActiveLeaderboard = "Workspace-Bench-Lite";
const workspaceSort = { field: "rubric_pass_rate", direction: "desc" };
const workspaceLeaderboardState = {
  query: "",
  framework: "all",
  model: "all",
  threshold: "all"
};

let thresholdChart;
let abilityFullChart;
let abilityLiteChart;
let scoreChart;
let costChart;
let runtimeChart;
let liteRankingChart;

async function workspaceLoadLeaderboardData() {
  if (workspaceLeaderboardData) return workspaceLeaderboardData;
  if (window.WORKSPACE_BENCH_DATA?.leaderboard) {
    workspaceLeaderboardData = window.WORKSPACE_BENCH_DATA.leaderboard;
    return workspaceLeaderboardData;
  }
  workspaceLeaderboardData = await workspaceFetchJson("./data/leaderboard.json");
  return workspaceLeaderboardData;
}

function workspaceGetActiveLeaderboard(data) {
  return data.leaderboards.find((item) => item.name === workspaceActiveLeaderboard) || data.leaderboards[0];
}

function workspaceGetLeaderboardRows(data) {
  if (workspaceActiveLeaderboard === "Overall") return data.fullSummaryRows || [];
  return (data.litePublicResults || []).map((row) => ({
    ...row,
    overall_score: row.rubric_pass_rate,
    task_success_rate: null,
    workspace_size: "Lite",
    date: "2026-05-07",
    verified: true,
    source: row.source || "repository-figure"
  }));
}

function workspaceSetSort(field) {
  if (workspaceSort.field === field) {
    workspaceSort.direction = workspaceSort.direction === "asc" ? "desc" : "asc";
  } else {
    workspaceSort.field = field;
    workspaceSort.direction = ["rank", "date"].includes(field) ? "asc" : "desc";
  }
}

function workspaceSortLabel(label, field) {
  if (workspaceSort.field !== field) return label;
  return `${label} ${workspaceSort.direction === "asc" ? "^" : "v"}`;
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

function workspaceRenderControls(data) {
  const container = document.getElementById("leaderboardControls");
  if (!container) return;
  const activeRows = workspaceGetLeaderboardRows(data);
  if (workspaceActiveLeaderboard === "Overall") {
    container.innerHTML = `
      <div class="leaderboard-static-note">
        <span class="badge badge-blue">Paper summary</span>
        <span class="table-note">The paper only exposes aggregate full-benchmark summary rows, so no finer public filters are available yet.</span>
      </div>
    `;
    return;
  }

  const frameworks = Array.from(new Set(activeRows.map((row) => row.agent))).sort();
  const models = Array.from(new Set(activeRows.map((row) => row.model))).sort((a, b) => {
    const maxA = Math.max(...activeRows.filter((row) => row.model === a).map((row) => row.rubric_pass_rate));
    const maxB = Math.max(...activeRows.filter((row) => row.model === b).map((row) => row.rubric_pass_rate));
    return maxB - maxA;
  });

  container.innerHTML = `
    <input id="leaderboardSearch" class="aa-table-search" type="search" placeholder="Search frameworks or models" aria-label="Search frameworks or models" value="${workspaceLeaderboardState.query}">
    <select id="frameworkFilter" aria-label="Filter by framework">
      <option value="all">All frameworks</option>
      ${frameworks.map((framework) => `<option value="${framework}" ${workspaceLeaderboardState.framework === framework ? "selected" : ""}>${framework}</option>`).join("")}
    </select>
    <select id="modelFilter" aria-label="Filter by model">
      <option value="all">All models</option>
      ${models.map((model) => `<option value="${model}" ${workspaceLeaderboardState.model === model ? "selected" : ""}>${model}</option>`).join("")}
    </select>
  `;

  const search = document.getElementById("leaderboardSearch");
  const framework = document.getElementById("frameworkFilter");
  const model = document.getElementById("modelFilter");

  if (search) {
    search.addEventListener("input", () => {
      workspaceLeaderboardState.query = search.value;
      workspaceRenderLeaderboard().catch(console.error);
    });
  }
  if (framework) {
    framework.addEventListener("change", () => {
      workspaceLeaderboardState.framework = framework.value;
      workspaceRenderLeaderboard().catch(console.error);
    });
  }
  if (model) {
    model.addEventListener("change", () => {
      workspaceLeaderboardState.model = model.value;
      workspaceRenderLeaderboard().catch(console.error);
    });
  }
}

function workspaceFilterRows(rows) {
  let filtered = rows.slice();
  if (workspaceActiveLeaderboard !== "Overall") {
    if (workspaceLeaderboardState.framework !== "all") {
      filtered = filtered.filter((row) => row.agent === workspaceLeaderboardState.framework);
    }
    if (workspaceLeaderboardState.model !== "all") {
      filtered = filtered.filter((row) => row.model === workspaceLeaderboardState.model);
    }
    const query = workspaceLeaderboardState.query.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((row) => `${row.agent} ${row.model} ${row.harness || ""}`.toLowerCase().includes(query));
    }
  }
  return filtered;
}

function workspaceRenderTable(rows) {
  const container = document.getElementById("leaderboardTable");
  if (!container) return;
  const sorted = workspaceSortRows(rows);
  const visibleCount = sorted.length;
  const topScore = Math.max(...sorted.map((row) => Number(row.overall_score) || 0), 1);

  const isOverall = workspaceActiveLeaderboard === "Overall";
  const headers = isOverall
    ? `
      <th data-sort="rank">${workspaceSortLabel("Rank", "rank")}</th>
      <th data-sort="agent">${workspaceSortLabel("Reference", "agent")}</th>
      <th data-sort="model">${workspaceSortLabel("System", "model")}</th>
      <th class="numeric" data-sort="overall_score">${workspaceSortLabel("Overall Score", "overall_score")}</th>
      <th class="numeric" data-sort="rubric_pass_rate">${workspaceSortLabel("Rubric Pass Rate", "rubric_pass_rate")}</th>
      <th>Source</th>
    `
    : `
      <th data-sort="rank">${workspaceSortLabel("Rank", "rank")}</th>
      <th data-sort="agent">${workspaceSortLabel("Framework", "agent")}</th>
      <th data-sort="model">${workspaceSortLabel("Model", "model")}</th>
      <th class="numeric" data-sort="overall_score">${workspaceSortLabel("Rubric Pass Rate", "overall_score")}</th>
      <th>Harness</th>
      <th>Source</th>
    `;

  const body = sorted.map((row, index) => {
    if (isOverall) {
      return `
        <tr>
          <td class="rank">#${row.rank || index + 1}</td>
          <td><strong>${row.agent}</strong><br><span class="badge">${row.harness}</span></td>
          <td>${row.model}</td>
          <td class="numeric score">${workspaceFormatNumber(row.overall_score, "%")}</td>
          <td class="numeric">${workspaceFormatNumber(row.rubric_pass_rate, "%")}</td>
          <td><a href="${row.report_url}" target="_blank" rel="noopener noreferrer">${row.source}</a></td>
        </tr>
      `;
    }
    return `
      <tr>
        <td class="rank">#${row.rank || index + 1}</td>
        <td><strong>${row.agent}</strong></td>
        <td>${row.model}</td>
        <td class="numeric score">
          <span class="matrix-score">${workspaceFormatNumber(row.overall_score, "%")}</span>
          <div class="rank-bar-track" aria-hidden="true"><span class="rank-bar" style="width:${Math.max(4, (Number(row.overall_score) || 0) / topScore * 100)}%"></span></div>
        </td>
        <td><span class="badge">${row.harness}</span></td>
        <td><a href="${row.report_url}" target="_blank" rel="noopener noreferrer">${row.source}</a></td>
      </tr>
    `;
  }).join("");

  const note = isOverall
    ? "Overall rows are taken directly from the public paper summary because no full per-system table has been released yet."
    : "Lite rows are real public framework/model combinations transcribed from the official repository figure.";

  container.innerHTML = `
    <div class="toolbar" style="margin-top:0;margin-bottom:10px">
      <div class="table-note">Showing ${visibleCount} row${visibleCount === 1 ? "" : "s"} in the current view.</div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>${headers}</tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <p class="table-note">${note}</p>
  `;

  container.querySelectorAll("th[data-sort]").forEach((header) => {
    header.style.cursor = "pointer";
    header.addEventListener("click", () => {
      workspaceSetSort(header.dataset.sort);
      workspaceRenderTable(rows);
    });
  });
}

const workspaceLiteRankingValuePlugin = {
  id: "workspaceLiteRankingValuePlugin",
  afterDatasetsDraw(chart) {
    if (chart.canvas?.id !== "liteRankingChart") return;
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const values = chart.data.datasets[0]?.data || [];
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 10px Inter, ui-sans-serif, system-ui, sans-serif";
    meta.data.forEach((bar, index) => {
      const value = Math.round(Number(values[index]) || 0);
      ctx.fillStyle = index < 3 ? "#111111" : "#334155";
      ctx.fillText(String(value), bar.x, bar.y - 10);
    });
    ctx.restore();
  }
};

function workspaceAgentIconName(agent) {
  return agent.toLowerCase().replace(/\s+/g, "");
}

function workspaceModelIconName(model) {
  const normalized = model.toLowerCase();
  if (/opus|claude|sonnet|haiku/.test(normalized)) return "claude";
  if (/glm/.test(normalized)) return "glm";
  if (/gpt|openai/.test(normalized)) return "gpt";
  if (/minimax/.test(normalized)) return "minimax";
  if (/kimi/.test(normalized)) return "kimi";
  if (/seed/.test(normalized)) return "seed";
  if (/gemini/.test(normalized)) return "gemini";
  return normalized.replace(/[^a-z0-9]/g, "");
}

function workspaceRenderLiteRankingLabels(rows) {
  const rail = document.getElementById("liteRankingLabelRail");
  if (!rail) return;
  rail.innerHTML = rows.map((row) => `
    <div class="lite-ranking-label-item">
      <img class="lite-ranking-agent-logo" src="./icons/${workspaceAgentIconName(row.agent)}.png" alt="${row.agent}">
      <img class="lite-ranking-llm-logo" src="./icons/${workspaceModelIconName(row.model)}.png" alt="${row.model}">
      <div class="lite-ranking-slanted-label"><span>${row.agent}</span><span>${row.model}</span></div>
    </div>
  `).join("");
}

function workspaceSyncLiteRankingLabelPositions() {
  if (!liteRankingChart) return;
  const rail = document.getElementById("liteRankingLabelRail");
  if (!rail) return;
  const items = [...rail.querySelectorAll(".lite-ranking-label-item")];
  const meta = liteRankingChart.getDatasetMeta(0);
  if (!meta?.data?.length) return;
  items.forEach((item, index) => {
    const bar = meta.data[index];
    if (!bar) return;
    item.style.left = `${bar.x}px`;
  });
}

function workspaceRenderLiteRankingChart(data) {
  if (typeof Chart === "undefined") return;
  const canvas = document.getElementById("liteRankingChart");
  if (!canvas) return;
  const rows = (data.litePublicResults || []).map((r, i) => ({ ...r, displayRank: i + 1 }));
  const canvasWrap = canvas.closest(".lite-ranking-canvas-wrap");
  const labelRail = document.getElementById("liteRankingLabelRail");
  if (liteRankingChart) liteRankingChart.destroy();
  if (canvasWrap) canvasWrap.style.width = "100%";
  if (labelRail) labelRail.style.width = "100%";
  workspaceRenderLiteRankingLabels(rows);

  const barColors = rows.map((_, index) => {
    if (index < 3) return "#111111";
    if (index < 8) return "#2f4da0";
    if (index < 14) return "#5b6fb3";
    if (index < 20) return "#8d98b8";
    return "#c7cedd";
  });

  const maxScore = Math.max(...rows.map((r) => r.rubric_pass_rate));
  const yMax = Math.ceil(maxScore / 10) * 10 + 10;

  liteRankingChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: rows.map((r) => `${r.agent} + ${r.model}`),
      datasets: [{
        label: "Rubric pass rate",
        data: rows.map((r) => r.rubric_pass_rate),
        backgroundColor: barColors,
        borderColor: barColors,
        borderRadius: 3,
        borderSkipped: false,
        maxBarThickness: 34
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#111111",
          bodyColor: "#5f6368",
          borderColor: "#dddddd",
          borderWidth: 1,
          callbacks: {
            title: (ctx) => `#${ctx[0].dataIndex + 1} ${ctx[0].label}`,
            label: (ctx) => ` Rubric pass rate: ${ctx.raw}%`
          }
        },
        workspaceLiteRankingValuePlugin: {}
      },
      scales: {
        x: {
          ticks: { display: false },
          grid: { display: false },
          border: { display: false },
          offset: true
        },
        y: {
          min: 0,
          max: yMax,
          ticks: { color: "#555555", callback: (v) => `${v}%`, precision: 0, stepSize: 10 },
          grid: { color: "rgba(17, 17, 17, 0.06)" },
          beginAtZero: true,
          title: { display: true, text: "Rubric pass rate (%)", color: "#555555" }
        }
      },
      layout: {
        padding: { top: 18, right: 14, bottom: 0, left: 10 }
      },
      datasets: {
        bar: { categoryPercentage: 0.88, barPercentage: 0.86 }
      },
      animation: { duration: 0 }
    }
  }, [workspaceLiteRankingValuePlugin]);

  requestAnimationFrame(() => workspaceSyncLiteRankingLabelPositions());
  window.setTimeout(() => workspaceSyncLiteRankingLabelPositions(), 120);
}

function workspaceRenderInsightCards(data) {
  const container = document.getElementById("leaderboardInsightCards");
  if (!container) return;
  const lite = data.litePublicResults || [];
  const top = lite[0];
  const threshold60 = lite.filter((row) => row.rubric_pass_rate >= 60).length;
  const averageLite = lite.length ? lite.reduce((sum, row) => sum + row.rubric_pass_rate, 0) / lite.length : null;
  container.innerHTML = `
    <div class="leaderboard-insight-card aa-summary-tile">
      <div class="leaderboard-kicker">Public Lite rows</div>
      <div class="leaderboard-big-number">${lite.length}</div>
      <p>Public framework/model combinations currently released for Workspace-Bench-Lite.</p>
    </div>
    <div class="leaderboard-insight-card aa-summary-tile">
      <div class="leaderboard-kicker">Top Lite system</div>
      <div class="leaderboard-big-number">${top ? workspaceFormatNumber(top.rubric_pass_rate, "%") : "-"}</div>
      <p>${top ? `${top.agent} + ${top.model}` : "No public Lite row available."}</p>
    </div>
    <div class="leaderboard-insight-card aa-summary-tile">
      <div class="leaderboard-kicker">Average Lite score</div>
      <div class="leaderboard-big-number">${averageLite === null ? "-" : workspaceFormatNumber(averageLite, "%")}</div>
      <p>Mean rubric pass rate across the released Lite combinations.</p>
    </div>
    <div class="leaderboard-insight-card aa-summary-tile">
      <div class="leaderboard-kicker">>= 60% Lite pass</div>
      <div class="leaderboard-big-number">${threshold60}</div>
      <p>Public Lite combinations clearing the 60% rubric pass-rate threshold.</p>
    </div>
  `;
}

function workspaceRenderFrameworkMatrix(data) {
  const container = document.getElementById("frameworkModelMatrix");
  if (!container) return;
  const rows = data.litePublicResults || [];
  const frameworks = Array.from(new Set(rows.map((row) => row.agent))).sort();
  const models = Array.from(new Set(rows.map((row) => row.model))).sort((a, b) => {
    const bestA = Math.max(...rows.filter((row) => row.model === a).map((row) => row.rubric_pass_rate));
    const bestB = Math.max(...rows.filter((row) => row.model === b).map((row) => row.rubric_pass_rate));
    return bestB - bestA;
  });
  const lookup = new Map();
  rows.forEach((row) => {
    const key = `${row.agent}__${row.model}`;
    const current = lookup.get(key);
    if (current === undefined || row.rubric_pass_rate > current) lookup.set(key, row.rubric_pass_rate);
  });

  container.innerHTML = `
    <div class="matrix-grid">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>Framework</th>
            ${models.map((model) => `<th class="numeric">${model}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${frameworks.map((framework) => `
            <tr>
              <td><strong>${framework}</strong></td>
              ${models.map((model) => {
                const value = lookup.get(`${framework}__${model}`);
                const opacity = value ? Math.max(0.12, value / 80) : 0;
                return `<td class="numeric" style="${value ? `background:rgba(22,93,255,${opacity * 0.16})` : ""}">${value ? `<span class="matrix-score">${workspaceFormatNumber(value, "%")}</span>` : "-"}</td>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <p class="table-note">Blank cells mean the paper or repository figure does not expose that framework/model combination.</p>
  `;
}

function workspaceRenderThresholdViews(data) {
  const rows = (data.thresholds || []).map((threshold) => ({
    value: threshold.value,
    label: threshold.label,
    hits: (data.litePublicResults || []).filter((row) => row.rubric_pass_rate >= threshold.value).length
  }));

  const thresholdFilter = document.getElementById("thresholdFocusFilter");
  if (thresholdFilter && !thresholdFilter.dataset.ready) {
    thresholdFilter.innerHTML = `<option value="all">All thresholds</option>${rows.map((row) => `<option value="${row.value}">${row.label}</option>`).join("")}`;
    thresholdFilter.value = workspaceLeaderboardState.threshold;
    thresholdFilter.addEventListener("change", () => {
      workspaceLeaderboardState.threshold = thresholdFilter.value;
      workspaceRenderLeaderboard().catch(console.error);
    });
    thresholdFilter.dataset.ready = "true";
  }

  const filteredRows = workspaceLeaderboardState.threshold === "all"
    ? rows
    : rows.filter((row) => String(row.value) === workspaceLeaderboardState.threshold);

  if (thresholdChart) thresholdChart.destroy();
  thresholdChart = workspaceMakeDenseBarChart(
    "thresholdChart",
    filteredRows.map((item) => item.label),
    filteredRows.map((item) => item.hits),
    "Systems Clearing Each Threshold",
    "#0ea5e9"
  );

  const cards = document.getElementById("thresholdCards");
  if (cards) {
    cards.innerHTML = filteredRows.map((item) => `
      <div class="leaderboard-stat-item">
        <div class="leaderboard-kicker">${item.label}</div>
        <div class="leaderboard-big-number">${item.hits}</div>
        <p>Public Lite systems at or above this pass-rate threshold.</p>
      </div>
    `).join("");
  }
}

function workspaceRenderAbilityInsightPanel() {
  const panel = document.getElementById("abilityInsightPanel");
  const fullCapabilities = window.WORKSPACE_BENCH_DATA?.capabilityResults?.full?.capabilities || [];
  const liteCapabilities = window.WORKSPACE_BENCH_DATA?.capabilityResults?.lite?.capabilities || [];
  if (!panel) return;

  const merged = fullCapabilities.map((item) => ({
    ability: item.capability,
    full: item.count,
    lite: liteCapabilities.find((candidate) => candidate.capability === item.capability)?.count || 0
  }));

  panel.innerHTML = `
    <div class="mini-kicker">Ability comparison</div>
    <h3>Full vs Lite</h3>
    <p class="table-note" style="margin-bottom:10px">Counts are derived from the latest official full and lite metadata analysis, not from mock benchmark slices.</p>
    <div class="ability-insight-list">
      ${merged.map((item) => `
        <div class="ability-insight-row">
          <strong>${item.ability}</strong>
          <span class="score">${item.full} / ${item.lite}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function workspaceRenderCompositionCharts() {
  const fullCapabilities = window.WORKSPACE_BENCH_DATA?.capabilityResults?.full?.capabilities || [];
  const liteCapabilities = window.WORKSPACE_BENCH_DATA?.capabilityResults?.lite?.capabilities || [];

  if (abilityFullChart) abilityFullChart.destroy();
  abilityFullChart = workspaceMakeDenseBarChart(
    "abilityFullChart",
    fullCapabilities.map((item) => item.capability.replace(" Utilization", "").replace(" Understanding", "")),
    fullCapabilities.map((item) => item.count),
    "Full split ability counts",
    "#14b8a6"
  );

  if (abilityLiteChart) abilityLiteChart.destroy();
  abilityLiteChart = workspaceMakeDenseBarChart(
    "abilityLiteChart",
    liteCapabilities.map((item) => item.capability.replace(" Utilization", "").replace(" Understanding", "")),
    liteCapabilities.map((item) => item.count),
    "Lite split ability counts",
    "#7c3aed"
  );

  workspaceRenderAbilityInsightPanel();
}

function workspaceRenderLeaderboardCharts(data) {
  if (typeof Chart === "undefined") return;
  const liteRows = (data.litePublicResults || []).map((row) => ({
    ...row,
    overall_score: row.rubric_pass_rate
  }));
  const frameworkAverages = Array.from(
    liteRows.reduce((map, row) => {
      const current = map.get(row.agent) || { total: 0, count: 0 };
      current.total += row.rubric_pass_rate;
      current.count += 1;
      map.set(row.agent, current);
      return map;
    }, new Map()).entries()
  ).map(([framework, stats]) => ({
    framework,
    average: stats.total / stats.count
  })).sort((a, b) => b.average - a.average);

  const modelAverages = Array.from(
    liteRows.reduce((map, row) => {
      const current = map.get(row.model) || { total: 0, count: 0 };
      current.total += row.rubric_pass_rate;
      current.count += 1;
      map.set(row.model, current);
      return map;
    }, new Map()).entries()
  ).map(([model, stats]) => ({
    model,
    average: stats.total / stats.count
  })).sort((a, b) => b.average - a.average);

  const profiles = window.WORKSPACE_BENCH_DATA?.leaderboardBreakdowns?.workerProfiles || [];
  const costPanel = document.getElementById("scoreCostPanel");
  const runtimePanel = document.getElementById("scoreRuntimePanel");
  if (costPanel) costPanel.innerHTML = '<canvas id="scoreCostChart" aria-label="Model family average chart"></canvas>';
  if (runtimePanel) runtimePanel.innerHTML = '<canvas id="scoreRuntimeChart" aria-label="Worker profile distribution chart"></canvas>';

  if (scoreChart) scoreChart.destroy();
  scoreChart = workspaceMakeDenseBarChart(
    "scoreChart",
    frameworkAverages.map((item) => item.framework),
    frameworkAverages.map((item) => Number(item.average.toFixed(1))),
    "Framework average Lite pass rate",
    "#14b8a6"
  );

  if (costChart) costChart.destroy();
  costChart = workspaceMakeDenseBarChart(
    "scoreCostChart",
    modelAverages.map((item) => item.model),
    modelAverages.map((item) => Number(item.average.toFixed(1))),
    "Model average Lite pass rate",
    "#7c3aed"
  );

  if (runtimeChart) runtimeChart.destroy();
  runtimeChart = workspaceMakeDenseBarChart(
    "scoreRuntimeChart",
    profiles.map((item) => item.profile),
    profiles.map((item) => item.tasks),
    "Full split worker-profile task count",
    "#2563eb"
  );
}

async function workspaceRenderLeaderboard() {
  const data = await workspaceLoadLeaderboardData();
  workspaceRenderInsightCards(data);
  workspaceRenderTabs(data);
  workspaceRenderControls(data);

  const leaderboard = workspaceGetActiveLeaderboard(data);
  const allRows = workspaceGetLeaderboardRows(data);
  const rows = workspaceFilterRows(allRows);

  const description = document.getElementById("leaderboardDescription");
  if (description) description.textContent = leaderboard.description;

  workspaceRenderTable(rows);
  workspaceRenderFrameworkMatrix(data);
  workspaceRenderThresholdViews(data);
  workspaceRenderCompositionCharts();
  workspaceRenderLeaderboardCharts(data);
  workspaceRenderLiteRankingChart(data);
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
