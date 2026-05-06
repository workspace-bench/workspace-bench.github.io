window.WORKSPACE_BENCH_DATA = {
  summary: [
    { label: "Worker Profiles", value: "5", description: "Operations Manager, Logistics Manager, AI Product Manager, Researcher, and Backend Developer." },
    { label: "File Types", value: "74", description: "Heterogeneous files across realistic workspace environments." },
    { label: "Files", value: "20,476", description: "Files distributed across role-specific workspaces." },
    { label: "Tasks", value: "388", description: "Tasks in the full benchmark with explicit dependency graphs." },
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
      { profile: "Operations Manager", tasks: 120, share: 31 },
      { profile: "Researcher", tasks: 66, share: 17 },
      { profile: "Backend Developer", tasks: 44, share: 11 },
      { profile: "Logistics Manager", tasks: 116, share: 30 },
      { profile: "AI Product Manager", tasks: 42, share: 11 }
    ],
    difficulty: [
      { level: "Easy", tasks: 54, share: 14 },
      { level: "Medium", tasks: 206, share: 53 },
      { level: "Hard", tasks: 128, share: 33 }
    ],
    abilities: [
      { ability: "Workspace Exploration", tasks: 262 },
      { ability: "Task-Supporting Files Utilization", tasks: 238 },
      { ability: "Result-Providing Files Utilization", tasks: 211 },
      { ability: "Lineage Tracing", tasks: 136 },
      { ability: "Semantic Content Relations Understanding", tasks: 170 },
      { ability: "Heterogeneous File Understanding", tasks: 140 }
    ]
  },
  datasetStats: {
    fileTypeGroups: [
      { group: "Operations Manager", count: 31 },
      { group: "Researcher", count: 17 },
      { group: "Backend Developer", count: 11 },
      { group: "Logistics Manager", count: 30 },
      { group: "AI Product Manager", count: 11 }
    ],
    complexity: [
      { bucket: "Workspace Exploration", tasks: 262 },
      { bucket: "Task-Supporting Files", tasks: 238 },
      { bucket: "Result-Providing Files", tasks: 211 },
      { bucket: "Lineage Tracing", tasks: 136 },
      { bucket: "Semantic Relations", tasks: 170 },
      { bucket: "Heterogeneous Files", tasks: 140 }
    ],
    workspaceSizes: [
      { bucket: "Easy", tasks: 54 },
      { bucket: "Medium", tasks: 206 },
      { bucket: "Hard", tasks: 128 }
    ],
    rubricCounts: [
      { bucket: "1 workspace", tasks: 42 },
      { bucket: "2 workspaces", tasks: 116 },
      { bucket: "3 workspaces", tasks: 44 },
      { bucket: "4 workspaces", tasks: 66 },
      { bucket: "5 workspaces", tasks: 120 }
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
