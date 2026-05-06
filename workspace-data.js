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
    { label: "Worker Profiles", value: "10", description: "Operations Manager, Logistics Manager, Researcher, Backend Developer, Product Manager, and more." },
    { label: "File Types", value: "24+", description: "24+ distinct extensions: .md, .json, .txt, .xlsx, .csv, .pdf, .java, .py, .js, .ts, and more." },
    { label: "Files", value: "20,476", description: "Files distributed across role-specific workspaces." },
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
      { name: "By Difficulty", description: "Official task difficulty split from the public distribution figure." },
      { name: "By Ability", description: "Official task ability counts from the public distribution figure." }
    ]
  },
  leaderboardBreakdowns: {
    workerProfiles: [
      { profile: "Operations Manager", tasks: 95, share: 24.5 },
      { profile: "Logistics Manager", tasks: 96, share: 24.7 },
      { profile: "Researcher", tasks: 63, share: 16.2 },
      { profile: "Backend Developer", tasks: 33, share: 8.5 },
      { profile: "Product Manager", tasks: 28, share: 7.2 },
      { profile: "Operations Staff", tasks: 27, share: 7.0 },
      { profile: "Admin / Logistics Staff", tasks: 19, share: 4.9 },
      { profile: "Product Staff", tasks: 13, share: 3.4 },
      { profile: "Developer", tasks: 10, share: 2.6 },
      { profile: "Researchers", tasks: 4, share: 1.0 }
    ],
    difficulty: [
      { level: "Easy", tasks: 54, share: 14 },
      { level: "Medium", tasks: 206, share: 53 },
      { level: "Hard", tasks: 128, share: 33 }
    ],
    abilities: [
      { ability: "Workspace Exploration", count: 199 },
      { ability: "Task-Supporting Files Utilization", count: 189 },
      { ability: "Result-Providing Files Utilization", count: 188 },
      { ability: "Semantic Content Relations Understanding", count: 151 },
      { ability: "Heterogeneous File Understanding", count: 112 },
      { ability: "Lineage Tracing", count: 116 }
    ]
  },
  datasetStats: {
    // Persona (worker profile) distribution from real HF data
    profileTasks: [
      { profile: "Operations Manager", tasks: 95, share: 24.5 },
      { profile: "Logistics Manager", tasks: 96, share: 24.7 },
      { profile: "Researcher", tasks: 63, share: 16.2 },
      { profile: "Backend Developer", tasks: 33, share: 8.5 },
      { profile: "Product Manager", tasks: 28, share: 7.2 },
      { profile: "Operations Staff", tasks: 27, share: 7.0 },
      { profile: "Admin / Logistics Staff", tasks: 19, share: 4.9 },
      { profile: "Product Staff", tasks: 13, share: 3.4 },
      { profile: "Developer", tasks: 10, share: 2.6 },
      { profile: "Researchers", tasks: 4, share: 1.0 }
    ],
    // Collaboration type (task ability) counts from real HF data
    collabTypes: [
      { type: "Workspace Exploration", count: 199 },
      { type: "Task-Supporting Files Utilization", count: 189 },
      { type: "Result-Providing Files Utilization", count: 188 },
      { type: "Semantic Content Relations Understanding", count: 151 },
      { type: "Lineage Tracing", count: 116 },
      { type: "Heterogeneous File Understanding", count: 112 }
    ],
    // Rubric type distribution — 7,399 total rubrics from real HF data
    rubricTypes: [
      { type: "Outcome Evaluation", count: 4056, share: 54.8 },
      { type: "Basic Evaluation", count: 1851, share: 25.0 },
      { type: "Process Evaluation", count: 1492, share: 20.2 }
    ],
    // File dependency coverage
    fileDependencyCoverage: {
      withDeps: 304,
      withoutDeps: 84,
      share: 78.4
    },
    // Files per task distribution (from data_manifest lengths)
    fileCountDist: [
      { bucket: "No files", count: 84 },
      { bucket: "1-5 files", count: 120 },
      { bucket: "6-20 files", count: 88 },
      { bucket: "21-50 files", count: 62 },
      { bucket: "50+ files", count: 34 }
    ],
    // 74 distinct file type extensions found across all workspaces
    fileTypeGroups: [
      { group: "Documents (.md, .txt, .doc, .docx, .pdf, .ppt, .pptx)", count: 1881 },
      { group: "Spreadsheets (.xlsx, .xls, .csv)", count: 733 },
      { group: "Code (.java, .py, .js, .ts, .go, .sh, .yaml, .yml, .xml, .html)", count: 846 },
      { group: "Data (.json)", count: 585 },
      { group: "Media (.png, .jpg)", count: 37 },
      { group: "Archives (.zip)", count: 3 }
    ],
    // Difficulty levels (official benchmark split)
    difficultyLevels: [
      { level: "Easy", tasks: 54, share: 14 },
      { level: "Medium", tasks: 206, share: 53 },
      { level: "Hard", tasks: 128, share: 33 }
    ],
    // Workspace complexity by collaboration type
    complexity: [
      { bucket: "Workspace Exploration", tasks: 262 },
      { bucket: "Task-Supporting Files", tasks: 238 },
      { bucket: "Result-Providing Files", tasks: 211 },
      { bucket: "Semantic Relations", tasks: 170 },
      { bucket: "Heterogeneous Files", tasks: 140 },
      { bucket: "Lineage Tracing", tasks: 136 }
    ],
    workspaceSizes: [
      { bucket: "Easy", tasks: 54 },
      { bucket: "Medium", tasks: 206 },
      { bucket: "Hard", tasks: 128 }
    ],
    rubricCounts: [
      { bucket: "No files", tasks: 84 },
      { bucket: "1-5 files", tasks: 120 },
      { bucket: "6-20 files", tasks: 88 },
      { bucket: "21-50 files", tasks: 62 },
      { bucket: "50+ files", tasks: 34 }
    ],
    liteSplit: {
      tasks: 100,
      costReduction: "70%",
      description: "Workspace-Bench-Lite preserves the benchmark distribution while reducing evaluation cost by about 70%."
    }
  },
  profileResults: {
    profiles: [
      { profile: "AI Product Manager", tasks: 42, avgFiles: 74, dependencyScore: 68.7, bestScore: 68.7 },
      { profile: "Logistics Manager", tasks: 116, avgFiles: 74, dependencyScore: 68.7, bestScore: 68.7 },
      { profile: "Backend Developer", tasks: 44, avgFiles: 74, dependencyScore: 68.7, bestScore: 68.7 },
      { profile: "Researcher", tasks: 66, avgFiles: 74, dependencyScore: 68.7, bestScore: 68.7 },
      { profile: "Operations Manager", tasks: 120, avgFiles: 74, dependencyScore: 68.7, bestScore: 68.7 }
    ]
  },
  capabilityResults: {
    capabilities: [
      { capability: "Workspace Exploration", bestScore: 68.7, averageScore: 47.4 },
      { capability: "Task-Supporting Files", bestScore: 68.7, averageScore: 47.4 },
      { capability: "Result-Providing Files", bestScore: 68.7, averageScore: 47.4 },
      { capability: "Lineage Tracing", bestScore: 68.7, averageScore: 47.4 },
      { capability: "Semantic Relations", bestScore: 68.7, averageScore: 47.4 },
      { capability: "Heterogeneous Files", bestScore: 68.7, averageScore: 47.4 }
    ]
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
