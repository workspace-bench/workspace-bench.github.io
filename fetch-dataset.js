const fs = require("fs");
const path = require("path");
const axios = require("axios");

const ROOT = __dirname;
const DATASETS = [
  {
    key: "full",
    dataset: "Workspace-Bench/Workspace-Bench",
    config: "default",
    split: "full",
    savePath: path.join(ROOT, "tasks_full_metadata_table.csv")
  },
  {
    key: "lite",
    dataset: "Workspace-Bench/Workspace-Bench-Lite",
    config: "default",
    split: "lite",
    savePath: path.join(ROOT, "tasks_lite_metadata_table.csv")
  }
];

const VIEWER_ROWS_URL = "https://datasets-server.huggingface.co/rows";
const VIEWER_SIZE_URL = "https://datasets-server.huggingface.co/size";

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

async function fetchSize({ dataset, config, split }) {
  const response = await axios.get(VIEWER_SIZE_URL, {
    params: { dataset, config, split },
    timeout: 120000
  });
  return response.data?.size?.splits?.[0]?.num_rows ?? 0;
}

async function fetchRows({ dataset, config, split, offset, length }) {
  const response = await axios.get(VIEWER_ROWS_URL, {
    params: { dataset, config, split, offset, length },
    timeout: 120000
  });
  return response.data || {};
}

async function fetchDataset(definition) {
  const totalRows = await fetchSize(definition);
  if (!totalRows) {
    throw new Error(`No rows reported for ${definition.dataset} (${definition.split})`);
  }

  console.error(`Fetching ${definition.key} dataset: ${definition.dataset} [${definition.split}] (${totalRows} rows)`);

  const chunkSize = 100;
  const rows = [];
  let headers = [];

  for (let offset = 0; offset < totalRows; offset += chunkSize) {
    const payload = await fetchRows({
      dataset: definition.dataset,
      config: definition.config,
      split: definition.split,
      offset,
      length: Math.min(chunkSize, totalRows - offset)
    });

    if (!headers.length) {
      headers = (payload.features || []).map((feature) => feature.name);
    }

    for (const item of payload.rows || []) {
      rows.push(item.row);
    }

    console.error(`  ${definition.key}: ${Math.min(offset + chunkSize, totalRows)}/${totalRows}`);
  }

  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n");

  fs.writeFileSync(definition.savePath, `${csv}\n`, "utf8");
  console.error(`Saved ${definition.key} dataset to ${definition.savePath}`);
}

async function main() {
  for (const definition of DATASETS) {
    await fetchDataset(definition);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
