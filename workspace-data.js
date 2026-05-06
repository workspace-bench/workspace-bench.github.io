window.WORKSPACE_BENCH_DATA = {
  summary: [
    { label: "Worker Profiles", value: "5", description: "Five worker profiles from realistic workspace settings." },
    { label: "File Types", value: "74", description: "Heterogeneous files across documents, data, code, and media." },
    { label: "Files", value: "20,476", description: "Files distributed across full benchmark workspaces." },
    { label: "Tasks", value: "388", description: "Workspace tasks in the full benchmark." },
    { label: "Rubrics", value: "7,399", description: "Fine-grained rubrics for task deliverable scoring." },
    { label: "Max Workspace", value: "20GB", description: "Maximum workspace size reported by Workspace-Bench." }
  ],
  leaderboard: {
    note: "These rows use public Workspace-Bench 1.0 paper / repository aggregate results. Replace aggregate rows with official per-agent submissions when maintainers publish them.",
    leaderboards: [
      {
        name: "Overall",
        description: "Full Workspace-Bench 1.0 aggregate results reported in the paper summary.",
        results: [
          {
            rank: 1,
            agent: "Human Reference",
            harness: "Human worker",
            model: "Human",
            overall_score: 80.7,
            task_success_rate: 80.7,
            rubric_pass_rate: 80.7,
            cost_usd: null,
            runtime_minutes: null,
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
            agent: "Best Agent",
            harness: "Best result among evaluated agent harnesses",
            model: "Best of 7 foundation models",
            overall_score: 68.7,
            task_success_rate: 68.7,
            rubric_pass_rate: 68.7,
            cost_usd: null,
            runtime_minutes: null,
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
            agent: "Average Agent",
            harness: "Mean across evaluated agent systems",
            model: "4 harnesses / 7 foundation models",
            overall_score: 47.4,
            task_success_rate: 47.4,
            rubric_pass_rate: 47.4,
            cost_usd: null,
            runtime_minutes: null,
            workspace_size: "Full",
            profile: "All profiles",
            capability: "Overall",
            date: "2026-05-05",
            verified: true,
            source: "paper-reported",
            report_url: "https://arxiv.org/abs/2605.03596"
          }
        ]
      },
      {
        name: "Workspace-Bench-Lite",
        description: "Workspace-Bench-Lite contains 100 tasks and reduces evaluation cost by about 70%.",
        results: [
          {
            rank: 1,
            agent: "Lite Split",
            harness: "Cost-reduced benchmark split",
            model: "100 representative tasks",
            overall_score: 70,
            task_success_rate: 100,
            rubric_pass_rate: 70,
            cost_usd: null,
            runtime_minutes: null,
            workspace_size: "Lite",
            profile: "All profiles",
            capability: "Split design",
            date: "2026-05-05",
            verified: true,
            source: "paper-reported",
            report_url: "https://arxiv.org/abs/2605.03596"
          }
        ]
      },
      {
        name: "By Worker Profile",
        description: "The public summary reports five worker profiles. Per-profile leaderboard values should come from official released result files.",
        results: [
          { rank: 1, agent: "5 Worker Profiles", harness: "Benchmark composition", model: "Workspace-Bench 1.0", overall_score: 5, task_success_rate: null, rubric_pass_rate: null, cost_usd: null, runtime_minutes: null, workspace_size: "Full", profile: "Five profiles", capability: "Profile coverage", date: "2026-05-05", verified: true, source: "repository-reported", report_url: "https://github.com/OpenDataBox/Workspace-Bench" }
        ]
      },
      {
        name: "By Capability",
        description: "Workspace-Bench targets workspace learning capabilities: dependency discovery, cross-file reasoning, adaptive action, and rubric-quality deliverables.",
        results: [
          { rank: 1, agent: "Workspace Learning", harness: "Capability target", model: "Workspace-Bench 1.0", overall_score: 74, task_success_rate: null, rubric_pass_rate: null, cost_usd: null, runtime_minutes: null, workspace_size: "Full", profile: "All profiles", capability: "File Dependency Discovery", date: "2026-05-05", verified: true, source: "paper-described", report_url: "https://arxiv.org/abs/2605.03596" },
          { rank: 2, agent: "Workspace Learning", harness: "Capability target", model: "Workspace-Bench 1.0", overall_score: 74, task_success_rate: null, rubric_pass_rate: null, cost_usd: null, runtime_minutes: null, workspace_size: "Full", profile: "All profiles", capability: "Cross-file Reasoning", date: "2026-05-05", verified: true, source: "paper-described", report_url: "https://arxiv.org/abs/2605.03596" },
          { rank: 3, agent: "Workspace Learning", harness: "Capability target", model: "Workspace-Bench 1.0", overall_score: 74, task_success_rate: null, rubric_pass_rate: null, cost_usd: null, runtime_minutes: null, workspace_size: "Full", profile: "All profiles", capability: "Adaptive Decision Making", date: "2026-05-05", verified: true, source: "paper-described", report_url: "https://arxiv.org/abs/2605.03596" }
        ]
      }
    ]
  },
  datasetStats: {
    fileTypeGroups: [
      { group: "File types", count: 74 },
      { group: "Worker profiles", count: 5 },
      { group: "Full tasks", count: 388 },
      { group: "Lite tasks", count: 100 }
    ],
    complexity: [
      { bucket: "Worker Profiles", tasks: 5 },
      { bucket: "File Types", tasks: 74 },
      { bucket: "Full Tasks", tasks: 388 },
      { bucket: "Lite Tasks", tasks: 100 }
    ],
    workspaceSizes: [
      { bucket: "Files", tasks: 20476 },
      { bucket: "Rubrics", tasks: 7399 },
      { bucket: "Max GB", tasks: 20 }
    ],
    rubricCounts: [
      { bucket: "Total rubrics", tasks: 7399 },
      { bucket: "Tasks", tasks: 388 },
      { bucket: "Avg rubrics/task", tasks: 19.1 }
    ],
    liteSplit: {
      tasks: 100,
      costReduction: "70%",
      description: "Workspace-Bench-Lite keeps representative workspace complexity while reducing evaluation cost."
    }
  },
  profileResults: {
    profiles: [
      { profile: "Worker Profile 1", tasks: 1, avgFiles: null, dependencyScore: null, bestScore: null },
      { profile: "Worker Profile 2", tasks: 1, avgFiles: null, dependencyScore: null, bestScore: null },
      { profile: "Worker Profile 3", tasks: 1, avgFiles: null, dependencyScore: null, bestScore: null },
      { profile: "Worker Profile 4", tasks: 1, avgFiles: null, dependencyScore: null, bestScore: null },
      { profile: "Worker Profile 5", tasks: 1, avgFiles: null, dependencyScore: null, bestScore: null }
    ]
  },
  capabilityResults: {
    capabilities: [
      { capability: "File Dependency Discovery", bestScore: 68.7, averageScore: 47.4 },
      { capability: "Cross-file Reasoning", bestScore: 68.7, averageScore: 47.4 },
      { capability: "Context Integration", bestScore: 68.7, averageScore: 47.4 },
      { capability: "Adaptive Decision Making", bestScore: 68.7, averageScore: 47.4 },
      { capability: "Deliverable Quality", bestScore: 68.7, averageScore: 47.4 }
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
