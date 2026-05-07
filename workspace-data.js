// Workspace-Bench public data bundle
// Schema mirrors the HuggingFace dataset: ShenYunTzr/Workspace-Bench
// Fields: absolute_id, persona, task, collaboration_type, rubrics,
//         rubric_types, file_deps_cc, data_manifest

(function(global) {
  "use strict";

  // --- Data access API ---

  /**
   * Load leaderboard data from the public bundle or a remote JSON endpoint.
   * @param {string} [path] - Optional path to a custom JSON file.
   * @returns {Promise<Object>} Leaderboard data object.
   */
  async function workspaceLoadLeaderboard(path) {
    if (window.WORKSPACE_BENCH_DATA?.leaderboard) {
      return window.WORKSPACE_BENCH_DATA.leaderboard;
    }
    const url = path || "./data/leaderboard.json";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return res.json();
  }

  /**
   * Load dataset statistics from the public bundle or a remote JSON endpoint.
   * @param {string} [path] - Optional path to a custom JSON file.
   * @returns {Promise<Object>} Dataset stats object.
   */
  async function workspaceLoadDatasetStats(path) {
    if (window.WORKSPACE_BENCH_DATA?.datasetStats) {
      return window.WORKSPACE_BENCH_DATA.datasetStats;
    }
    const url = path || "./data/dataset-stats.json";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return res.json();
  }

  /**
   * Fetch a raw JSON file from the site. Falls back to bundled data when available.
   * @param {string} path - Relative path to a JSON file.
   * @returns {Promise<Object>} Parsed JSON.
   */
  async function workspaceFetchPublic(path) {
    if (window.WORKSPACE_BENCH_DATA) {
      if (path.includes("leaderboard")) return window.WORKSPACE_BENCH_DATA.leaderboard;
      if (path.includes("dataset-stats")) return window.WORKSPACE_BENCH_DATA.datasetStats;
      if (path.includes("profile-results")) return window.WORKSPACE_BENCH_DATA.profileResults;
      if (path.includes("capability-results")) return window.WORKSPACE_BENCH_DATA.capabilityResults;
      if (path.includes("tasks")) return { tasks: window.WORKSPACE_BENCH_DATA.dataset.tasks };
      if (path.includes("examples")) return { examples: window.WORKSPACE_BENCH_DATA.examples };
    }
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return res.json();
  }

  /**
   * Add or update a leaderboard row (e.g. from a new verified submission).
   * @param {Object} row - Row object matching the result JSON schema.
   */
  function workspaceUpsertLeaderboardRow(row) {
    if (!window.WORKSPACE_BENCH_DATA?.leaderboard?.litePublicResults) return;
    const list = window.WORKSPACE_BENCH_DATA.leaderboard.litePublicResults;
    const idx = list.findIndex((r) => r.agent === row.agent && r.model === row.model);
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
      source: "submitted",
      report_url: row.report_url ?? "",
      workspace_size: row.workspace_size ?? "Lite",
      profile: row.profile ?? "All profiles",
      capability: row.capability ?? "Lite public leaderboard",
      date: row.date ?? new Date().toISOString().slice(0, 10)
    };
    if (idx >= 0) {
      list[idx] = enriched;
    } else {
      list.push(enriched);
    }
    // Re-rank by rubric_pass_rate descending
    list.sort((a, b) => b.rubric_pass_rate - a.rubric_pass_rate);
    list.forEach((r, i) => { r.rank = i + 1; });
  }

  /**
   * Add a new task example to the dataset.
   * @param {Object} task - Task object with persona, task, collaboration_type, rubrics, etc.
   */
  function workspaceAddTask(task) {
    if (!window.WORKSPACE_BENCH_DATA?.dataset?.tasks) return;
    const id = window.WORKSPACE_BENCH_DATA.dataset.tasks.length + 1;
    window.WORKSPACE_BENCH_DATA.dataset.tasks.push({ absolute_id: id, ...task });
    // Recompute derived statistics
    recomputeDatasetStats();
  }

  /**
   * Update metadata about the benchmark.
   * @param {Object} meta - Key-value pairs to merge into existing metadata.
   */
  function workspaceUpdateMeta(meta) {
    if (!window.WORKSPACE_BENCH_DATA?.dataset?.meta) return;
    Object.assign(window.WORKSPACE_BENCH_DATA.dataset.meta, meta);
  }

  /**
   * Recompute all derived statistics from tasks after data changes.
   * Call this whenever tasks are added or modified.
   */
  function recomputeDatasetStats() {
    const tasks = window.WORKSPACE_BENCH_DATA?.dataset?.tasks;
    if (!tasks || !tasks.length) return;
    const stats = window.WORKSPACE_BENCH_DATA.datasetStats;
    const profileResults = window.WORKSPACE_BENCH_DATA.profileResults;
    const capabilityResults = window.WORKSPACE_BENCH_DATA.capabilityResults;
    const breakdowns = window.WORKSPACE_BENCH_DATA.leaderboardBreakdowns;

    // Persona distribution
    const personaMap = {};
    tasks.forEach(t => { personaMap[t.persona] = (personaMap[t.persona] || 0) + 1; });
    const personaSorted = Object.entries(personaMap).sort((a, b) => b[1] - a[1]);
    const totalTasks = tasks.length;

    // Collaboration type distribution
    const collabMap = {};
    tasks.forEach(t => {
      (t.collaboration_type || []).forEach(c => { collabMap[c] = (collabMap[c] || 0) + 1; });
    });

    // Rubric type distribution
    const rubricTypeMap = {};
    tasks.forEach(t => {
      (t.rubric_types || []).forEach(r => { rubricTypeMap[r] = (rubricTypeMap[r] || 0) + 1; });
    });

    // File count distribution
    const fileCountMap = {};
    tasks.forEach(t => {
      const count = t.data_manifest ? t.data_manifest.length : 0;
      const bucket = count === 0 ? "No files" : count <= 5 ? "1-5 files" : count <= 20 ? "6-20 files" : count <= 50 ? "21-50 files" : "50+ files";
      fileCountMap[bucket] = (fileCountMap[bucket] || 0) + 1;
    });

    // Update breakdowns
    if (breakdowns?.workerProfiles) {
      breakdowns.workerProfiles = personaSorted.map(([profile, tasks_n]) => ({
        profile,
        tasks: tasks_n,
        share: Math.round(tasks_n / totalTasks * 100)
      }));
    }

    // Update datasetStats
    if (stats) {
      stats.profileTasks = Object.entries(personaMap).sort((a, b) => b[1] - a[1]).map(([profile, tasks_n]) => ({ profile, tasks: tasks_n }));
      stats.collabTypes = Object.entries(collabMap).sort((a, b) => b[1] - a[1]).map(([type, count]) => ({ type, count }));
      stats.rubricTypes = Object.entries(rubricTypeMap).sort((a, b) => b[1] - a[1]).map(([type, count]) => ({ type, count }));
      stats.fileCountDist = Object.entries(fileCountMap).map(([bucket, count]) => ({ bucket, count }));
    }
  }

  window.WORKSPACE_BENCH_API = {
    loadLeaderboard: workspaceLoadLeaderboard,
    loadDatasetStats: workspaceLoadDatasetStats,
    fetchPublic: workspaceFetchPublic,
    upsertRow: workspaceUpsertLeaderboardRow,
    addTask: workspaceAddTask,
    updateMeta: workspaceUpdateMeta
  };

  // --- Embedded public data bundle ---
window.WORKSPACE_BENCH_DATA = {
  summary: [
    { label: "Worker Profiles", value: "15", description: "15 persona values are currently present in the official public task metadata release." },
    { label: "File Types", value: "24+", description: "24+ distinct extensions: .md, .json, .txt, .xlsx, .csv, .pdf, .java, .py, .js, .ts, and more." },
    { label: "Files", value: "3,854", description: "Files referenced in the public task metadata table via data_manifest entries." },
    { label: "Tasks", value: "388", description: "Tasks with heterogeneous file dependencies and rubric-based evaluation." },
    { label: "Rubrics", value: "7,399", description: "Fine-grained rubric checks used for evaluation." },
    { label: "Max Workspace", value: "20GB", description: "Largest workspace size represented in the benchmark." }
  ],
  leaderboard: {
    note: "Workspace-Bench-Lite public leaderboard rows are transcribed from the official rubrics_success figure in the public repository. Full-benchmark public rows come from the paper summary.",
    litePublicResults: [
      { rank: 1, agent: "OpenClaw", harness: "OpenClaw", model: "Opus-4.7", rubric_pass_rate: 66.6, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 2, agent: "ClaudeCode", harness: "ClaudeCode", model: "Opus-4.7", rubric_pass_rate: 64.4, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 3, agent: "Hermes", harness: "Hermes", model: "Opus-4.7", rubric_pass_rate: 64.3, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 4, agent: "DeepAgent", harness: "DeepAgent", model: "GLM-5.1", rubric_pass_rate: 60.8, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 5, agent: "Hermes", harness: "Hermes", model: "GLM-5.1", rubric_pass_rate: 57.7, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 6, agent: "OpenClaw", harness: "OpenClaw", model: "GLM-5.1", rubric_pass_rate: 57.5, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 7, agent: "ClaudeCode", harness: "ClaudeCode", model: "MiniMax-M2.7", rubric_pass_rate: 54.6, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 8, agent: "DeepAgent", harness: "DeepAgent", model: "Opus-4.7", rubric_pass_rate: 54.3, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 9, agent: "ClaudeCode", harness: "ClaudeCode", model: "GLM-5.1", rubric_pass_rate: 52.4, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 10, agent: "Hermes", harness: "Hermes", model: "MiniMax-M2.7", rubric_pass_rate: 52.3, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 11, agent: "ClaudeCode", harness: "ClaudeCode", model: "GPT-5.4", rubric_pass_rate: 51.7, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 12, agent: "Hermes", harness: "Hermes", model: "Kimi-2.5", rubric_pass_rate: 49.0, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 13, agent: "ClaudeCode", harness: "ClaudeCode", model: "Kimi-2.5", rubric_pass_rate: 48.4, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 14, agent: "OpenClaw", harness: "OpenClaw", model: "GPT-5.4", rubric_pass_rate: 47.0, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 15, agent: "DeepAgent", harness: "DeepAgent", model: "MiniMax-M2.7", rubric_pass_rate: 44.9, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 16, agent: "OpenClaw", harness: "OpenClaw", model: "Kimi-2.5", rubric_pass_rate: 44.6, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 17, agent: "Hermes", harness: "Hermes", model: "GPT-5.4", rubric_pass_rate: 44.2, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 18, agent: "ClaudeCode", harness: "ClaudeCode", model: "MiniMax-M2.7", rubric_pass_rate: 44.1, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 19, agent: "DeepAgent", harness: "DeepAgent", model: "Seed-2.0-Code", rubric_pass_rate: 42.5, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 20, agent: "OpenClaw", harness: "OpenClaw", model: "Kimi-2.5", rubric_pass_rate: 41.6, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 21, agent: "Hermes", harness: "Hermes", model: "Seed-2.0-Code", rubric_pass_rate: 40.0, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 22, agent: "ClaudeCode", harness: "ClaudeCode", model: "Seed-2.0-Code", rubric_pass_rate: 38.4, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 23, agent: "DeepAgent", harness: "DeepAgent", model: "Gemini-3.1-Pro", rubric_pass_rate: 37.3, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 24, agent: "DeepAgent", harness: "DeepAgent", model: "Gemini-3.1-Pro", rubric_pass_rate: 37.0, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 25, agent: "OpenClaw", harness: "OpenClaw", model: "GPT-5.4", rubric_pass_rate: 35.8, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 26, agent: "OpenClaw", harness: "OpenClaw", model: "Seed-2.0-Code", rubric_pass_rate: 34.5, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 27, agent: "Hermes", harness: "Hermes", model: "Gemini-3.1-Pro", rubric_pass_rate: 31.4, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" },
      { rank: 28, agent: "Hermes", harness: "Hermes", model: "Gemini-3.1-Pro", rubric_pass_rate: 27.0, source: "repository-figure", report_url: "https://github.com/OpenDataBox/Workspace-Bench" }
    ],
    thresholds: [
      { label: "Pass >= 30%", value: 30 },
      { label: "Pass >= 40%", value: 40 },
      { label: "Pass >= 50%", value: 50 },
      { label: "Pass >= 60%", value: 60 }
    ],
    fullSummaryRows: [
      {
        rank: 1,
        agent: "Human + Tools",
        harness: "Human reference",
        model: "Human",
        overall_score: 80.7,
        task_success_rate: 80.7,
        rubric_pass_rate: 80.7,
        workspace_size: "Full",
        profile: "All profiles",
        capability: "Overall",
        date: "2026-05-05",
        verified: true,
        source: "paper-reported",
        report_url: "https://arxiv.org/abs/2605.03596"
      },
      {
        rank: 2,
        agent: "Best public agent",
        harness: "Best evaluated harness",
        model: "Best evaluated model",
        overall_score: 68.7,
        task_success_rate: 68.7,
        rubric_pass_rate: 68.7,
        workspace_size: "Full",
        profile: "All profiles",
        capability: "Overall",
        date: "2026-05-05",
        verified: true,
        source: "paper-reported",
        report_url: "https://arxiv.org/abs/2605.03596"
      },
      {
        rank: 3,
        agent: "Average public agent",
        harness: "Mean across evaluated agents",
        model: "4 harnesses / 7 foundation models",
        overall_score: 47.4,
        task_success_rate: 47.4,
        rubric_pass_rate: 47.4,
        workspace_size: "Full",
        profile: "All profiles",
        capability: "Overall",
        date: "2026-05-05",
        verified: true,
        source: "paper-reported",
        report_url: "https://arxiv.org/abs/2605.03596"
      }
    ],
    leaderboards: [
      { name: "Overall", description: "Full Workspace-Bench paper summary. Detailed full-benchmark per-system tables are not public yet." },
      { name: "Workspace-Bench-Lite", description: "Public Workspace-Bench-Lite leaderboard transcribed from the official repository figure." },
      { name: "Threshold Views", description: "Count how many public Lite systems clear increasingly strict rubric pass-rate thresholds." },
      { name: "By Worker Profile", description: "Official benchmark composition by workspace profile from the public distribution figure." },
      { name: "By Difficulty", description: "Public task file-count buckets derived from the latest Hugging Face metadata release." },
      { name: "By Ability", description: "Official task ability counts from the public distribution figure." }
    ]
  },
  leaderboardBreakdowns: {
    workerProfiles: [
      { profile: "Operations Manager", tasks: 92, share: 23.7 },
      { profile: "Logistics Manager", tasks: 81, share: 20.9 },
      { profile: "Researcher", tasks: 61, share: 15.7 },
      { profile: "Backend Developer", tasks: 31, share: 8.0 },
      { profile: "Operations Staff", tasks: 28, share: 7.2 },
      { profile: "Product Manager", tasks: 25, share: 6.4 },
      { profile: "Administrative / Logistics Staff", tasks: 19, share: 4.9 },
      { profile: "Administrative/Logistics Staff", tasks: 15, share: 3.9 },
      { profile: "Product Staff", tasks: 13, share: 3.4 },
      { profile: "Developer", tasks: 12, share: 3.1 },
      { profile: "Researchers", tasks: 4, share: 1.0 },
      { profile: "product people", tasks: 3, share: 0.8 },
      { profile: "researcher", tasks: 2, share: 0.5 },
      { profile: "Operation staff", tasks: 1, share: 0.3 },
      { profile: "Operations Specialist", tasks: 1, share: 0.3 }
    ],
    difficulty: [
      { level: "No files", tasks: 0, share: 0.0 },
      { level: "1-5 files", tasks: 305, share: 78.6 },
      { level: "6-20 files", tasks: 50, share: 12.9 },
      { level: "21-50 files", tasks: 20, share: 5.2 },
      { level: "50+ files", tasks: 13, share: 3.4 }
    ],
    abilities: [
      { ability: "Workspace Exploration", count: 278 },
      { ability: "Task-Providing File Utilization", count: 238 },
      { ability: "Result-Providing Files Utilization", count: 211 },
      { ability: "Semantic Content Relations Understanding", count: 170 },
      { ability: "Lineage Tracing", count: 136 },
      { ability: "Heterogeneous File Understanding", count: 109 }
    ]
  },
  datasetStats: {
    profileTasks: [
      { profile: "Operations Manager", tasks: 92, share: 23.7 },
      { profile: "Logistics Manager", tasks: 81, share: 20.9 },
      { profile: "Researcher", tasks: 61, share: 15.7 },
      { profile: "Backend Developer", tasks: 31, share: 8.0 },
      { profile: "Operations Staff", tasks: 28, share: 7.2 },
      { profile: "Product Manager", tasks: 25, share: 6.4 },
      { profile: "Administrative / Logistics Staff", tasks: 19, share: 4.9 },
      { profile: "Administrative/Logistics Staff", tasks: 15, share: 3.9 },
      { profile: "Product Staff", tasks: 13, share: 3.4 },
      { profile: "Developer", tasks: 12, share: 3.1 },
      { profile: "Researchers", tasks: 4, share: 1.0 },
      { profile: "product people", tasks: 3, share: 0.8 },
      { profile: "researcher", tasks: 2, share: 0.5 },
      { profile: "Operation staff", tasks: 1, share: 0.3 },
      { profile: "Operations Specialist", tasks: 1, share: 0.3 }
    ],
    collabTypes: [
      { type: "Workspace Exploration", count: 278, share: 71.6 },
      { type: "Task-Providing File Utilization", count: 238, share: 61.3 },
      { type: "Result-Providing Files Utilization", count: 211, share: 54.4 },
      { type: "Semantic Content Relations Understanding", count: 170, share: 43.8 },
      { type: "Lineage Tracing", count: 136, share: 35.1 },
      { type: "Heterogeneous File Understanding", count: 109, share: 28.1 }
    ],
    rubricTypes: [
      { type: "Outcome Evaluation", count: 3863, share: 52.2 },
      { type: "Basic Evaluation", count: 1843, share: 24.9 },
      { type: "Process Evaluation", count: 1485, share: 20.1 },
      { type: "Result Evaluation", count: 169, share: 2.3 },
      { type: "Results Assessment", count: 24, share: 0.3 },
      { type: "Basic Assessment", count: 8, share: 0.1 },
      { type: "Process Assessment", count: 7, share: 0.1 }
    ],
    fileDependencyCoverage: {
      withDeps: 375,
      withoutDeps: 13,
      share: 96.6
    },
    fileCountDist: [
      { bucket: "No files", count: 0 },
      { bucket: "1-5 files", count: 305 },
      { bucket: "6-20 files", count: 50 },
      { bucket: "21-50 files", count: 20 },
      { bucket: "50+ files", count: 13 }
    ],
    fileTypeGroups: [
      { group: "Documents", count: 1764 },
      { group: "Spreadsheets", count: 812 },
      { group: "Code", count: 652 },
      { group: "Data", count: 585 },
      { group: "Media", count: 37 },
      { group: "Archives", count: 3 }
    ],
    difficultyLevels: [
      { level: "No files", tasks: 0, share: 0.0 },
      { level: "1-5 files", tasks: 305, share: 78.6 },
      { level: "6-20 files", tasks: 50, share: 12.9 },
      { level: "21-50 files", tasks: 20, share: 5.2 },
      { level: "50+ files", tasks: 13, share: 3.4 }
    ],
    complexity: [
      { bucket: "Workspace Exploration", tasks: 278 },
      { bucket: "Task-Providing File Utilization", tasks: 238 },
      { bucket: "Result-Providing Files Utilization", tasks: 211 },
      { bucket: "Semantic Content Relations Understanding", tasks: 170 },
      { bucket: "Lineage Tracing", tasks: 136 },
      { bucket: "Heterogeneous File Understanding", tasks: 109 }
    ],
    workspaceSizes: [
      { bucket: "Easy", tasks: null },
      { bucket: "Medium", tasks: null },
      { bucket: "Hard", tasks: null }
    ],
    rubricCounts: [
      { bucket: "No files", tasks: 0 },
      { bucket: "1-5 files", tasks: 305 },
      { bucket: "6-20 files", tasks: 50 },
      { bucket: "21-50 files", tasks: 20 },
      { bucket: "50+ files", tasks: 13 }
    ],
    liteSplit: {
      tasks: 100,
      personas: 5,
      description: "Workspace-Bench-Lite contains 100 public tasks across 5 worker profiles in the official Lite release."
    },
    meta: {
      totalTasks: 388,
      totalRubrics: 7399,
      totalFiles: 3854,
      fileTypes: 24
    }
  },
  profileResults: {
    profiles: [
      { profile: "Operations Manager", tasks: 92, share: 23.7 },
      { profile: "Logistics Manager", tasks: 81, share: 20.9 },
      { profile: "Researcher", tasks: 61, share: 15.7 },
      { profile: "Backend Developer", tasks: 31, share: 8.0 },
      { profile: "Operations Staff", tasks: 28, share: 7.2 },
      { profile: "Product Manager", tasks: 25, share: 6.4 },
      { profile: "Administrative / Logistics Staff", tasks: 19, share: 4.9 },
      { profile: "Administrative/Logistics Staff", tasks: 15, share: 3.9 },
      { profile: "Product Staff", tasks: 13, share: 3.4 },
      { profile: "Developer", tasks: 12, share: 3.1 },
      { profile: "Researchers", tasks: 4, share: 1.0 },
      { profile: "product people", tasks: 3, share: 0.8 },
      { profile: "researcher", tasks: 2, share: 0.5 },
      { profile: "Operation staff", tasks: 1, share: 0.3 },
      { profile: "Operations Specialist", tasks: 1, share: 0.3 }
    ]
  },
  capabilityResults: {
    capabilities: [
      { capability: "Workspace Exploration", count: 278, share: 71.6 },
      { capability: "Task-Providing File Utilization", count: 238, share: 61.3 },
      { capability: "Result-Providing Files Utilization", count: 211, share: 54.4 },
      { capability: "Semantic Content Relations Understanding", count: 170, share: 43.8 },
      { capability: "Lineage Tracing", count: 136, share: 35.1 },
      { capability: "Heterogeneous File Understanding", count: 109, share: 28.1 }
    ]
  },
  dataset: {
    meta: {
      totalTasks: 388,
      totalRubrics: 7399,
      totalFiles: 3854,
      fileTypes: 24
    },
    tasks: Array.isArray(window.WORKSPACE_BENCH_TASKS) ? window.WORKSPACE_BENCH_TASKS.slice() : []
  },
  examples: [
    {
      title: "Large workspace evidence gathering",
      profile: "Workspace learning",
      workspace: "A realistic workspace containing heterogeneous file types and large-scale file dependencies.",
      instruction: "Locate the files needed for a worker-style task, integrate the relevant context, and produce a rubric-gradable deliverable.",
      requiredFiles: ["task instruction", "workspace files", "implicit dependencies", "rubric criteria"],
      hiddenDependencies: "Dependencies may be implicit rather than named directly in the user instruction.",
      deliverable: "A final artifact scored by detailed Workspace-Bench rubrics.",
      rubrics: ["Finds relevant files", "Uses dependent evidence", "Produces correct deliverable", "Satisfies rubric criteria"]
    },
    {
      title: "Rubric-based final deliverable scoring",
      profile: "Evaluation",
      workspace: "Workspace-Bench task with task-specific rubrics.",
      instruction: "Complete the task and submit an answer that can be evaluated against fine-grained rubrics.",
      requiredFiles: ["workspace context", "task data", "rubrics"],
      hiddenDependencies: "A correct answer may require multi-file reasoning and cannot be judged by a single file lookup.",
      deliverable: "Task output with enough evidence to satisfy scoring criteria.",
      rubrics: ["Task correctness", "Completeness", "Evidence consistency", "Workspace dependency handling"]
    }
  ]
};

})(window);
