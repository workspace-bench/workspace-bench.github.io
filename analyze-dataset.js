const fs = require("fs");
const path = require("path");
const axios = require("axios");

const ROOT = __dirname;
const CSV_PATH = path.join(ROOT, "tasks_en_metadata_table.csv");
const DATA_DIR = path.join(ROOT, "data");
const CSV_URL = "https://huggingface.co/datasets/ShenYunTzr/Workspace-Bench/resolve/main/tasks_en_metadata_table.csv";

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
      if (currentRow.some((value) => value !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else if (char !== "\r") {
      currentField += char;
    }
  }

  if (currentField.length || currentRow.length) {
    currentRow.push(currentField);
    if (currentRow.some((value) => value !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function parseJsonArray(value) {
  if (!value) return [];
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

function writeJson(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function ensureCsv() {
  if (fs.existsSync(CSV_PATH)) return;
  const response = await axios.get(CSV_URL, { timeout: 60000 });
  fs.writeFileSync(CSV_PATH, response.data, "utf8");
}

async function main() {
  await ensureCsv();
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const csvContent = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parseCSV(csvContent);
  const headers = rows[0].map((header) => String(header).replace(/^\uFEFF/, "").trim());
  const body = rows.slice(1).filter((row) => row.length > 1);
  const headerIndex = Object.fromEntries(headers.map((header, index) => [header, index]));

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
  const rawTasks = [];

  let totalRubrics = 0;
  let totalFiles = 0;
  let withDeps = 0;

  for (const row of body) {
    const task = {
      absolute_id: Number(row[headerIndex.absolute_id]),
      persona: String(row[headerIndex.persona] || "Unknown").trim(),
      task: String(row[headerIndex.task] || "").trim(),
      tested_capabilities: parseJsonArray(row[headerIndex.tested_capabilities]),
      rubric_types: parseJsonArray(row[headerIndex.rubric_types]),
      file_dep_graph: parseJsonArray(row[headerIndex.file_dep_graph]),
      data_manifest: parseJsonArray(row[headerIndex.data_manifest])
    };

    personaCounts.set(task.persona, (personaCounts.get(task.persona) || 0) + 1);
    task.tested_capabilities.forEach((capability) => {
      capabilityCounts.set(capability, (capabilityCounts.get(capability) || 0) + 1);
    });
    task.rubric_types.forEach((rubricType) => {
      rubricTypeCounts.set(rubricType, (rubricTypeCounts.get(rubricType) || 0) + 1);
      totalRubrics += 1;
    });
    if (task.file_dep_graph.length > 0) withDeps += 1;

    const fileCount = task.data_manifest.length;
    totalFiles += fileCount;
    fileBucketCounts.set(bucketFileCount(fileCount), (fileBucketCounts.get(bucketFileCount(fileCount)) || 0) + 1);

    task.data_manifest.forEach((item) => {
      const filename = String(item.filename || "");
      const extMatch = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
      if (!extMatch) return;
      const group = groupExtension(extMatch[1]);
      groupedFileTypes.set(group, (groupedFileTypes.get(group) || 0) + 1);
    });

    rawTasks.push({
      absolute_id: task.absolute_id,
      persona: task.persona,
      task: task.task,
      collaboration_type: task.tested_capabilities,
      rubric_types: task.rubric_types,
      file_count: fileCount
    });
  }

  const totalTasks = rawTasks.length;
  const profileRows = [...personaCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([profile, tasks]) => ({ profile, tasks, share: round((tasks / totalTasks) * 100, 1) }));

  const capabilityRows = [...capabilityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([capability, count]) => ({ capability, count, share: round((count / totalTasks) * 100, 1) }));

  const rubricRows = [...rubricTypeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count, share: round((count / totalRubrics) * 100, 1) }));

  const groupedFileTypeRows = [...groupedFileTypes.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([group, count]) => ({ group, count }));

  const datasetStats = {
    profileTasks: profileRows,
    collabTypes: capabilityRows.map(({ capability, count, share }) => ({ type: capability, count, share })),
    rubricTypes: rubricRows,
    fileDependencyCoverage: {
      withDeps,
      withoutDeps: totalTasks - withDeps,
      share: round((withDeps / totalTasks) * 100, 1)
    },
    fileCountDist: [...fileBucketCounts.entries()].map(([bucket, count]) => ({ bucket, count })),
    fileTypeGroups: groupedFileTypeRows,
    complexity: capabilityRows.map(({ capability, count }) => ({ bucket: capability, tasks: count })),
    workspaceSizes: [
      { bucket: "Easy", tasks: null },
      { bucket: "Medium", tasks: null },
      { bucket: "Hard", tasks: null }
    ],
    rubricCounts: [...fileBucketCounts.entries()].map(([bucket, count]) => ({ bucket, tasks: count })),
    liteSplit: {
      tasks: 100,
      personas: 5,
      description: "Workspace-Bench-Lite contains 100 public tasks across 5 worker profiles in the official Lite release."
    },
    meta: {
      totalTasks,
      totalRubrics,
      totalFiles,
      fileTypes: 24
    }
  };

  const profileResults = {
    profiles: profileRows.map(({ profile, tasks, share }) => ({
      profile,
      tasks,
      share
    }))
  };

  const capabilityResults = {
    capabilities: capabilityRows
  };

  writeJson("dataset-stats.json", datasetStats);
  writeJson("profile-results.json", profileResults);
  writeJson("capability-results.json", capabilityResults);
  writeJson("tasks.json", { tasks: rawTasks });

  console.log(`Generated dataset stats from ${totalTasks} tasks.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
