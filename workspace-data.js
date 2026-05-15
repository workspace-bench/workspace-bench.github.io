// Workspace-Bench public data runtime.
// Bundled data is generated from:
// - Workspace-Bench/Workspace-Bench (full split)
// - Workspace-Bench/Workspace-Bench-Lite (lite split)

(function() {
  "use strict";

  const siteData = window.WORKSPACE_BENCH_SITE_DATA || null;
  const embeddedTasks = Array.isArray(window.WORKSPACE_BENCH_TASKS) ? window.WORKSPACE_BENCH_TASKS.slice() : [];
  const embeddedLiteTasks = Array.isArray(window.WORKSPACE_BENCH_LITE_TASKS) ? window.WORKSPACE_BENCH_LITE_TASKS.slice() : [];

  if (siteData) {
    if (siteData.datasetStats && !siteData.fullDatasetStats) siteData.fullDatasetStats = siteData.datasetStats.fullDatasetStats || null;
    if (siteData.datasetStats && !siteData.liteDatasetStats) siteData.liteDatasetStats = siteData.datasetStats.liteDatasetStats || null;
    if (!siteData.dataset) siteData.dataset = {};
    if (!Array.isArray(siteData.dataset.tasks) || !siteData.dataset.tasks.length) {
      siteData.dataset.tasks = embeddedTasks.slice();
    }
    if (!Array.isArray(siteData.dataset.fullTasks) || !siteData.dataset.fullTasks.length) {
      siteData.dataset.fullTasks = embeddedTasks.slice();
    }
    if (!Array.isArray(siteData.dataset.liteTasks) || !siteData.dataset.liteTasks.length) {
      siteData.dataset.liteTasks = embeddedLiteTasks.slice();
    }
  }

  window.WORKSPACE_BENCH_DATA = siteData || {
    summary: [],
    leaderboard: null,
    detailedRubricsResults: null,
    leaderboardBreakdowns: {
      workerProfiles: [],
      difficulty: [],
      abilities: []
    },
    datasetStats: null,
    profileResults: null,
    capabilityResults: null,
    dataset: {
      meta: null,
      tasks: embeddedTasks.slice(),
      fullTasks: embeddedTasks.slice(),
      liteTasks: embeddedLiteTasks.slice()
    },
    examples: []
  };

  async function workspaceLoadLeaderboard(path) {
    if (window.WORKSPACE_BENCH_DATA?.leaderboard) return window.WORKSPACE_BENCH_DATA.leaderboard;
    const url = path || "./data/leaderboard.json";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
    return response.json();
  }

  async function workspaceLoadDatasetStats(path) {
    if (window.WORKSPACE_BENCH_DATA?.datasetStats) return window.WORKSPACE_BENCH_DATA.datasetStats;
    const url = path || "./data/dataset-stats.json";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
    return response.json();
  }

  async function workspaceFetchPublic(path) {
    if (window.WORKSPACE_BENCH_DATA) {
      if (path.includes("leaderboard")) return window.WORKSPACE_BENCH_DATA.leaderboard;
      if (path.includes("detailed-rubrics-results")) return window.WORKSPACE_BENCH_DATA.detailedRubricsResults;
      if (path.includes("dataset-stats")) return window.WORKSPACE_BENCH_DATA.datasetStats;
      if (path.includes("profile-results")) return window.WORKSPACE_BENCH_DATA.profileResults;
      if (path.includes("capability-results")) return window.WORKSPACE_BENCH_DATA.capabilityResults;
      if (path.includes("tasks")) return { tasks: window.WORKSPACE_BENCH_DATA.dataset.tasks };
      if (path.includes("examples")) return { examples: window.WORKSPACE_BENCH_DATA.examples };
    }
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
    return response.json();
  }

  function workspaceUpsertLeaderboardRow(row) {
    const list = window.WORKSPACE_BENCH_DATA?.leaderboard?.litePublicResults;
    if (!Array.isArray(list)) return;
    const idx = list.findIndex((item) => item.agent === row.agent && item.model === row.model);
    const enriched = {
      rank: 0,
      agent: row.agent,
      harness: row.harness,
      model: row.model,
      rubric_pass_rate: row.rubric_pass_rate ?? row.overall_score ?? 0,
      overall_score: row.overall_score ?? row.rubric_pass_rate ?? 0,
      task_success_rate: row.task_success_rate ?? null,
      cost_usd: row.cost_usd ?? null,
      runtime_minutes: row.runtime_minutes ?? null,
      verified: row.verified ?? false,
      source: row.source ?? "submitted",
      report_url: row.report_url ?? "",
      workspace_size: row.workspace_size ?? "Lite",
      profile: row.profile ?? "All profiles",
      capability: row.capability ?? "Lite public leaderboard",
      date: row.date ?? new Date().toISOString().slice(0, 10)
    };
    if (idx >= 0) list[idx] = enriched;
    else list.push(enriched);
    list.sort((a, b) => b.rubric_pass_rate - a.rubric_pass_rate);
    list.forEach((item, index) => {
      item.rank = index + 1;
    });
  }

  function workspaceAddTask(task) {
    const dataset = window.WORKSPACE_BENCH_DATA?.dataset;
    if (!dataset?.tasks) return;
    const id = dataset.tasks.length + 1;
    const nextTask = { absolute_id: id, ...task };
    dataset.tasks.push(nextTask);
    if (Array.isArray(dataset.fullTasks)) dataset.fullTasks.push(nextTask);
  }

  function workspaceUpdateMeta(meta) {
    if (!window.WORKSPACE_BENCH_DATA?.dataset?.meta) return;
    Object.assign(window.WORKSPACE_BENCH_DATA.dataset.meta, meta);
  }

  window.WORKSPACE_BENCH_API = {
    loadLeaderboard: workspaceLoadLeaderboard,
    loadDatasetStats: workspaceLoadDatasetStats,
    fetchPublic: workspaceFetchPublic,
    upsertRow: workspaceUpsertLeaderboardRow,
    addTask: workspaceAddTask,
    updateMeta: workspaceUpdateMeta
  };
})();
