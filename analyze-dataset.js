const fs = require("fs");
const path = require("path");
const axios = require("axios");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const SOURCES = {
  full: {
    label: "Workspace-Bench",
    dataset: "Workspace-Bench/Workspace-Bench",
    config: "default",
    split: "full",
    csvPath: path.join(ROOT, "tasks_full_metadata_table.csv")
  },
  lite: {
    label: "Workspace-Bench-Lite",
    dataset: "Workspace-Bench/Workspace-Bench-Lite",
    config: "default",
    split: "lite",
    csvPath: path.join(ROOT, "tasks_lite_metadata_table.csv")
  }
};
const VIEWER_ROWS_URL = "https://datasets-server.huggingface.co/rows";
const VIEWER_SIZE_URL = "https://datasets-server.huggingface.co/size";

function parseCSV(content) {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        currentField += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if (char === "\n" && !inQuotes) {
      currentRow.push(currentField);
      if (currentRow.some((value) => value !== "")) rows.push(currentRow);
      currentRow = [];
      currentField = "";
    } else if (char !== "\r") {
      currentField += char;
    }
  }

  if (currentField.length || currentRow.length) {
    currentRow.push(currentField);
    if (currentRow.some((value) => value !== "")) rows.push(currentRow);
  }

  return rows;
}

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function bucketFileCount(count) {
  if (count === 0) return "No files";
  if (count <= 5) return "1-5 files";
  if (count <= 20) return "6-20 files";
  if (count <= 50) return "21-50 files";
  return "50+ files";
}

function groupExtension(ext) {
  if (["md", "txt", "doc", "docx", "pdf", "ppt", "pptx"].includes(ext)) return "Documents";
  if (["xlsx", "xls", "csv"].includes(ext)) return "Spreadsheets";
  if (["java", "py", "js", "ts", "go", "sh", "yaml", "yml", "xml", "html"].includes(ext)) return "Code";
  if (["json"].includes(ext)) return "Data";
  if (["png", "jpg", "jpeg"].includes(ext)) return "Media";
  if (["zip"].includes(ext)) return "Archives";
  return "Other";
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function writeJson(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function fetchViewerRows({ dataset, config, split, offset, length }) {
  const response = await axios.get(VIEWER_ROWS_URL, {
    params: { dataset, config, split, offset, length },
    timeout: 120000
  });
  return response.data || {};
}

async function fetchViewerSize({ dataset, config, split }) {
  const response = await axios.get(VIEWER_SIZE_URL, {
    params: { dataset, config, split },
    timeout: 120000
  });
  return response.data?.size?.splits?.[0]?.num_rows ?? 0;
}

async function ensureSourceCsv(source) {
  if (fs.existsSync(source.csvPath)) return;

  const totalRows = await fetchViewerSize(source);
  if (!totalRows) throw new Error(`No rows reported for ${source.dataset} (${source.split})`);

  const chunkSize = 100;
  const rows = [];
  let headers = [];

  for (let offset = 0; offset < totalRows; offset += chunkSize) {
    const payload = await fetchViewerRows({
      dataset: source.dataset,
      config: source.config,
      split: source.split,
      offset,
      length: Math.min(chunkSize, totalRows - offset)
    });

    if (!headers.length) {
      headers = (payload.features || []).map((feature) => feature.name);
    }

    for (const item of payload.rows || []) {
      rows.push(item.row);
    }
  }

  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n");
  fs.writeFileSync(source.csvPath, `${csv}\n`, "utf8");
}

async function ensureSources() {
  await Promise.all(Object.values(SOURCES).map((source) => ensureSourceCsv(source)));
}

function loadTasksFromCsv(csvPath) {
  const csvContent = fs.readFileSync(csvPath, "utf8");
  const rows = parseCSV(csvContent);
  const headers = rows[0].map((header) => String(header).replace(/^\uFEFF/, "").trim());
  const body = rows.slice(1).filter((row) => row.length > 1);
  const headerIndex = Object.fromEntries(headers.map((header, index) => [header, index]));

  return body.map((row) => {
    const rubricTypes = parseJsonArray(row[headerIndex.rubric_types]);
    const rubrics = parseJsonArray(row[headerIndex.rubrics]);
    const fileDepGraph = parseJsonArray(row[headerIndex.file_dep_graph]);
    const dataManifest = parseJsonArray(row[headerIndex.data_manifest]);
    const outputFiles = parseJsonArray(row[headerIndex.output_files]);
    const testedCapabilities = parseJsonArray(row[headerIndex.tested_capabilities]);
    const fileCount = dataManifest.length;

    return {
      absolute_id: Number(row[headerIndex.absolute_id]),
      persona: String(row[headerIndex.persona] || "Unknown").trim(),
      task: String(row[headerIndex.task] || "").trim(),
      task_diff: String(row[headerIndex.task_diff] || "unknown").trim(),
      output_files: outputFiles,
      rubrics,
      rubric_types: rubricTypes,
      file_dep_graph: fileDepGraph,
      data_manifest: dataManifest,
      tested_capabilities: testedCapabilities,
      collaboration_type: testedCapabilities,
      file_count: fileCount
    };
  });
}

function analyzeTasks(tasks, source) {
  const personaCounts = new Map();
  const capabilityCounts = new Map();
  const rubricTypeCounts = new Map();
  const fileBucketCounts = new Map([
    ["No files", 0],
    ["1-5 files", 0],
    ["6-20 files", 0],
    ["21-50 files", 0],
    ["50+ files", 0]
  ]);
  const groupedFileTypes = new Map();
  const difficultyCounts = new Map();

  let totalRubrics = 0;
  let totalFiles = 0;
  let withDeps = 0;

  for (const task of tasks) {
    personaCounts.set(task.persona, (personaCounts.get(task.persona) || 0) + 1);
    difficultyCounts.set(task.task_diff || "unknown", (difficultyCounts.get(task.task_diff || "unknown") || 0) + 1);

    task.tested_capabilities.forEach((capability) => {
      capabilityCounts.set(capability, (capabilityCounts.get(capability) || 0) + 1);
    });

    task.rubric_types.forEach((rubricType) => {
      rubricTypeCounts.set(rubricType, (rubricTypeCounts.get(rubricType) || 0) + 1);
    });

    totalRubrics += task.rubrics.length;
    if (task.file_dep_graph.length > 0) withDeps += 1;

    totalFiles += task.file_count;
    const bucket = bucketFileCount(task.file_count);
    fileBucketCounts.set(bucket, (fileBucketCounts.get(bucket) || 0) + 1);

    task.data_manifest.forEach((item) => {
      const filename = String(item.filename || "");
      const extMatch = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
      if (!extMatch) return;
      const group = groupExtension(extMatch[1]);
      groupedFileTypes.set(group, (groupedFileTypes.get(group) || 0) + 1);
    });
  }

  const totalTasks = tasks.length;
  const distinctFileTypes = new Set();
  tasks.forEach((task) => {
    task.data_manifest.forEach((item) => {
      const filename = String(item.filename || "");
      const extMatch = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
      if (extMatch) distinctFileTypes.add(extMatch[1]);
    });
  });

  const profileRows = [...personaCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([profile, count]) => ({ profile, tasks: count, share: round((count / totalTasks) * 100, 1) }));

  const capabilityRows = [...capabilityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([capability, count]) => ({ capability, count, share: round((count / totalTasks) * 100, 1) }));

  const rubricRows = [...rubricTypeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count, share: round((count / Math.max(totalRubrics, 1)) * 100, 1) }));

  const fileTypeGroups = [...groupedFileTypes.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([group, count]) => ({ group, count }));

  const difficultyRows = [...difficultyCounts.entries()]
    .sort((a, b) => {
      const order = ["easy", "medium", "hard"];
      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([level, count]) => ({ level, tasks: count, share: round((count / totalTasks) * 100, 1) }));

  return {
    source: source.label,
    dataset: source.dataset,
    split: source.split,
    profileTasks: profileRows,
    collabTypes: capabilityRows.map(({ capability, count, share }) => ({ type: capability, count, share })),
    rubricTypes: rubricRows,
    fileDependencyCoverage: {
      withDeps,
      withoutDeps: totalTasks - withDeps,
      share: round((withDeps / Math.max(totalTasks, 1)) * 100, 1)
    },
    fileCountDist: [...fileBucketCounts.entries()].map(([bucket, count]) => ({
      bucket,
      count,
      share: round((count / Math.max(totalTasks, 1)) * 100, 1)
    })),
    fileTypeGroups,
    difficultyLevels: difficultyRows,
    complexity: capabilityRows.map(({ capability, count }) => ({ bucket: capability, tasks: count })),
    meta: {
      totalTasks,
      totalRubrics,
      totalFiles,
      fileTypes: distinctFileTypes.size
    }
  };
}

function buildSummaryBlock(fullStats, liteStats) {
  return [
    {
      label: "Full Tasks",
      value: String(fullStats.meta.totalTasks),
      description: "Tasks in the full Workspace-Bench split served from the official HuggingFace dataset viewer."
    },
    {
      label: "Lite Tasks",
      value: String(liteStats.meta.totalTasks),
      description: "Tasks in the public Workspace-Bench-Lite split served from the official HuggingFace dataset viewer."
    },
    {
      label: "Full Files",
      value: fullStats.meta.totalFiles.toLocaleString(),
      description: "Manifest-listed files referenced across the full Workspace-Bench task metadata."
    },
    {
      label: "Lite Files",
      value: liteStats.meta.totalFiles.toLocaleString(),
      description: "Manifest-listed files referenced across the Workspace-Bench-Lite task metadata."
    },
    {
      label: "Full Rubrics",
      value: fullStats.meta.totalRubrics.toLocaleString(),
      description: "Rubric checks attached to the full Workspace-Bench release."
    },
    {
      label: "Lite Rubrics",
      value: liteStats.meta.totalRubrics.toLocaleString(),
      description: "Rubric checks attached to the Workspace-Bench-Lite release."
    }
  ];
}

function writeTaskBundle(filename, variableName, tasks) {
  const payload = `window.${variableName} = ${JSON.stringify(tasks, null, 2)};\n`;
  fs.writeFileSync(path.join(DATA_DIR, filename), payload, "utf8");
}

function readJson(filename, fallback) {
  const target = path.join(DATA_DIR, filename);
  if (!fs.existsSync(target)) return fallback;
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

async function main() {
  await ensureSources();
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const fullTasks = loadTasksFromCsv(SOURCES.full.csvPath);
  const liteTasks = loadTasksFromCsv(SOURCES.lite.csvPath);

  const fullStats = analyzeTasks(fullTasks, SOURCES.full);
  const liteStats = analyzeTasks(liteTasks, SOURCES.lite);

  const datasetStats = {
    profileTasks: fullStats.profileTasks,
    collabTypes: fullStats.collabTypes,
    rubricTypes: fullStats.rubricTypes,
    fileDependencyCoverage: fullStats.fileDependencyCoverage,
    fileCountDist: fullStats.fileCountDist,
    fileTypeGroups: fullStats.fileTypeGroups,
    difficultyLevels: fullStats.difficultyLevels,
    complexity: fullStats.complexity,
    liteSplit: {
      tasks: liteStats.meta.totalTasks,
      personas: liteStats.profileTasks.length,
      description: "Workspace-Bench-Lite is synchronized from the official HuggingFace lite split and compared against the full benchmark metadata."
    },
    meta: {
      totalTasks: fullStats.meta.totalTasks,
      totalRubrics: fullStats.meta.totalRubrics,
      totalFiles: fullStats.meta.totalFiles,
      fileTypes: fullStats.meta.fileTypes,
      full: fullStats.meta,
      lite: liteStats.meta
    },
    fullDatasetStats: fullStats,
    liteDatasetStats: liteStats
  };

  const profileResults = {
    profiles: fullStats.profileTasks,
    full: { profiles: fullStats.profileTasks },
    lite: { profiles: liteStats.profileTasks }
  };

  const capabilityResults = {
    capabilities: fullStats.collabTypes.map(({ type, count, share }) => ({ capability: type, count, share })),
    full: { capabilities: fullStats.collabTypes.map(({ type, count, share }) => ({ capability: type, count, share })) },
    lite: { capabilities: liteStats.collabTypes.map(({ type, count, share }) => ({ capability: type, count, share })) }
  };

  const tasksPayload = {
    full: fullTasks,
    lite: liteTasks,
    tasks: fullTasks
  };

  writeJson("dataset-stats.json", datasetStats);
  writeJson("profile-results.json", profileResults);
  writeJson("capability-results.json", capabilityResults);
  writeJson("tasks.json", tasksPayload);
  writeTaskBundle("tasks.js", "WORKSPACE_BENCH_TASKS", fullTasks);
  writeTaskBundle("tasks-lite.js", "WORKSPACE_BENCH_LITE_TASKS", liteTasks);

  const summary = buildSummaryBlock(fullStats, liteStats);
  fs.writeFileSync(
    path.join(DATA_DIR, "dataset-summary.json"),
    `${JSON.stringify({ summary }, null, 2)}\n`,
    "utf8"
  );

  const leaderboard = readJson("leaderboard.json", {});
  const examples = readJson("examples.json", { examples: [] }).examples || [];
  const siteData = {
    summary,
    leaderboard,
    leaderboardBreakdowns: {
      workerProfiles: fullStats.profileTasks,
      difficulty: fullStats.fileCountDist.map(({ bucket, count, share }) => ({ level: bucket, tasks: count, share })),
      abilities: fullStats.collabTypes.map(({ type, count }) => ({ ability: type, count }))
    },
    datasetStats,
    profileResults,
    capabilityResults,
    dataset: {
      meta: datasetStats.meta.full,
      tasks: fullTasks,
      fullTasks,
      liteTasks
    },
    examples
  };
  fs.writeFileSync(
    path.join(DATA_DIR, "site-data.js"),
    `window.WORKSPACE_BENCH_SITE_DATA = ${JSON.stringify(siteData, null, 2)};\n`,
    "utf8"
  );

  console.log(`Generated dataset stats from ${fullStats.meta.totalTasks} full tasks and ${liteStats.meta.totalTasks} lite tasks.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
