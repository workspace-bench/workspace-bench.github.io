const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const requiredFiles = [
  'index.html',
  'leaderboard.html',
  'dataset.html',
  'methodology.html',
  'examples.html',
  'submit.html',
  'citation.html',
  'contact.html',
  'styles/workspace.css',
  'workspace-site.js',
  'workspace-leaderboard.js',
  'workspace-charts.js',
  'workspace-data.js',
  'workspace-bench.svg',
  'assets/Distribution.png',
  'assets/rubrics_success.png',
  'assets/Framework.png',
  'data/leaderboard.json',
  'data/dataset-stats.json',
  'data/profile-results.json',
  'data/capability-results.json',
  'data/tasks.json',
  'data/tasks.js',
  'data/tasks-lite.js',
  'data/site-data.js',
  'data/examples.json',
  'data/detailed-rubrics-results.json',
  'detailed_rubrics_pass_table_all_runs.csv'
];

const requiredText = {
  'index.html': [
    'Workspace-Bench 1.0',
    '3,854',
    '7,399',
    '80.7%',
    '68.7%',
    '47.4%',
    'Independent benchmark analysis',
    'Workspace-Bench highlights',
    'Latest benchmark updates',
    '2026.05.04',
    '2026.05.05',
    '2026.05.07',
    'Benchmark release',
    'arXiv paper',
    'Public leaderboard'
  ],
  'leaderboard.html': ['Official Leaderboard', 'Public Lite Rankings', 'Framework x Model Matrix', 'Workspace-Bench Leaderboards', 'Threshold Views', 'Composition Analysis', 'Leaderboard Analysis'],
  'dataset.html': ['Dataset', 'Worker Profile Distribution', 'Collaboration Types', 'Rubric Evaluation Types', 'Task Browser', 'API Playground', 'Source: HuggingFace'],
  'methodology.html': ['Workspace Learning', 'Rubric-based Scoring', 'Reproducibility Requirements', 'Evaluation pipeline', 'Scoring Dimensions'],
  'examples.html': ['Representative Tasks', 'Task intelligence feed', 'Coming soon', 'Evidence path'],
  'submit.html': ['Submission', 'Coming soon', 'Submission portal is being prepared'],
  'contact.html': ['Citation & Contact', '2605.03596', 'OpenDataBox/Workspace-Bench'],
  'citation.html': ['Citation', 'contact.html', 'Citation &amp; Contact']
};

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

const styleText = fs.readFileSync(path.join(root, 'styles/workspace.css'), 'utf8');
for (const selector of ['analysis-shell', 'aa-metric-strip', 'leaderboard-insight-card', 'rank-bar', 'no-data-panel', 'analysis-list', 'compact-data-table', 'pipeline-step', 'aa-floating-nav', 'aa-brand-pill', 'aa-highlight-grid', 'aa-mini-leaderboard', 'aa-changelog', 'aa-page-title', 'aa-page-lead', 'aa-summary-tile', 'nav-actions', 'aa-icon-button', 'aa-table-search']) {
  if (!styleText.includes(selector)) fail(`workspace.css missing Artificial Analysis style selector: ${selector}`);
}

for (const token of ['--bg: #ffffff', '--surface-2: #f5f5f5', '--pill-dark: #111111', '--pill-light: #ececec', '--primary: #5b3df5']) {
  if (!styleText.includes(token)) fail(`workspace.css missing AA-style token: ${token}`);
}

const leaderboardScript = fs.readFileSync(path.join(root, 'workspace-leaderboard.js'), 'utf8');
for (const marker of ['workspaceRenderFrameworkMatrix', 'workspaceRenderInsightCards', 'workspaceRenderThresholdViews', 'leaderboardSearch', 'workspaceRenderCompositionCharts']) {
  if (!leaderboardScript.includes(marker)) fail(`workspace-leaderboard.js missing renderer: ${marker}`);
}
for (const marker of ['Search frameworks or models', 'All frameworks', 'All models']) {
  if (!leaderboardScript.includes(marker)) fail(`workspace-leaderboard.js missing control text: ${marker}`);
}

const chartsScript = fs.readFileSync(path.join(root, 'workspace-charts.js'), 'utf8');
if (!chartsScript.includes('const colors = workspaceChartColors();')) {
  fail('workspace-charts.js must initialize chart colors inside workspaceMakeHorizontalBarChart');
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) fail(`missing ${file}`);
}

for (const [file, needles] of Object.entries(requiredText)) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  const text = fs.readFileSync(full, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) fail(`${file} missing text: ${needle}`);
  }
  if (file !== 'citation.html' && /style="font-size:/.test(text)) fail(`${file} should not use inline font-size styling`);
  if (/RIP-Bench/.test(text)) fail(`${file} contains legacy text`);
  if (/[\u95b3\u67cd\u922b]/.test(text)) fail(`${file} contains garbled characters`);
  if (file === 'index.html' && text.includes('Workspace-Bench evaluates whether agents can operate over realistic digital workspaces')) {
    fail('index.html still contains the removed benchmark tests paragraph');
  }
  if (file === 'index.html') {
    for (const legacy of ['Workspace-Bench 1.0 released', '100-task evaluation split', 'Lite rankings and distribution figures released', 'Lite split introduced', 'Public data']) {
      if (text.includes(legacy)) fail(`index.html still contains legacy timeline text: ${legacy}`);
    }
  }
}

for (const file of ['index.html', 'leaderboard.html', 'dataset.html', 'examples.html']) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  const text = fs.readFileSync(full, 'utf8');
  if (!text.includes('workspace-data.js')) fail(`${file} must include workspace-data.js for file:// support`);
}

for (const file of ['index.html', 'leaderboard.html', 'dataset.html', 'methodology.html', 'examples.html', 'submit.html', 'contact.html']) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  if (!text.includes('data-workspace-header')) fail(`${file} missing shared header mount`);
  if (!text.includes('data-workspace-footer')) fail(`${file} missing shared footer mount`);
}

for (const file of requiredFiles.filter((f) => f.startsWith('data/') && f.endsWith('.json'))) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  try {
    const parsed = JSON.parse(fs.readFileSync(full, 'utf8'));
    if (Array.isArray(parsed) && parsed.length === 0) fail(`${file} is empty array`);
    if (!Array.isArray(parsed) && Object.keys(parsed).length === 0) fail(`${file} is empty object`);
  } catch (error) {
    fail(`${file} is not valid JSON: ${error.message}`);
  }
}

const leaderboardPath = path.join(root, 'data/leaderboard.json');
if (fs.existsSync(leaderboardPath)) {
  const data = JSON.parse(fs.readFileSync(leaderboardPath, 'utf8'));
  if (!Array.isArray(data.leaderboards)) fail('leaderboard.json must contain leaderboards array');
  if (!Array.isArray(data.litePublicResults) || data.litePublicResults.length !== 45) fail('leaderboard.json must contain 45 detailed Lite result rows');
  if (data.litePublicResults?.[0]?.agent !== 'OpenClaw' || data.litePublicResults?.[0]?.model !== 'Opus-4.7') fail('leaderboard.json top Lite row must match detailed rubrics CSV');
  else {
    const names = data.leaderboards.map((item) => item.name);
    for (const expected of ['Overall', 'Workspace-Bench-Lite', 'By Worker Profile', 'By Ability']) {
      if (!names.includes(expected)) fail(`leaderboard missing tab ${expected}`);
    }
  }
}

const detailedRubricsPath = path.join(root, 'data/detailed-rubrics-results.json');
if (fs.existsSync(detailedRubricsPath)) {
  const detailed = JSON.parse(fs.readFileSync(detailedRubricsPath, 'utf8'));
  if (detailed.sourceFile !== 'detailed_rubrics_pass_table_all_runs.csv') fail('detailed rubrics results must record the source CSV');
  if (!Array.isArray(detailed.rows) || detailed.rows.length !== 45) fail('detailed rubrics results must contain 45 rows');
  if (!Array.isArray(detailed.thresholds) || detailed.thresholds.length !== 10) fail('detailed rubrics results must contain pass_at thresholds from 10 to 100');
}

const datasetStatsPath = path.join(root, 'data/dataset-stats.json');
if (fs.existsSync(datasetStatsPath)) {
  const stats = JSON.parse(fs.readFileSync(datasetStatsPath, 'utf8'));
  if (!stats.meta?.full || !stats.meta?.lite) fail('dataset-stats.json must contain full and lite meta blocks');
  if (stats.meta.full.totalTasks !== 388) fail('dataset-stats.json full task count must be 388');
  if (stats.meta.lite.totalTasks !== 100) fail('dataset-stats.json lite task count must be 100');
}

const profileResultsPath = path.join(root, 'data/profile-results.json');
if (fs.existsSync(profileResultsPath)) {
  const profileData = JSON.parse(fs.readFileSync(profileResultsPath, 'utf8'));
  if (!profileData.full || !profileData.lite) fail('profile-results.json must contain full and lite sections');
}

const capabilityResultsPath = path.join(root, 'data/capability-results.json');
if (fs.existsSync(capabilityResultsPath)) {
  const capabilityData = JSON.parse(fs.readFileSync(capabilityResultsPath, 'utf8'));
  if (!capabilityData.full || !capabilityData.lite) fail('capability-results.json must contain full and lite sections');
}

const workspaceDataScript = fs.readFileSync(path.join(root, 'workspace-data.js'), 'utf8');
for (const marker of [
  'Workspace-Bench/Workspace-Bench',
  'Workspace-Bench/Workspace-Bench-Lite',
  'fullDatasetStats',
  'liteDatasetStats'
]) {
  if (!workspaceDataScript.includes(marker)) fail(`workspace-data.js missing marker: ${marker}`);
}

const fetchDatasetScript = fs.readFileSync(path.join(root, 'fetch-dataset.js'), 'utf8');
for (const marker of [
  'Workspace-Bench/Workspace-Bench',
  'Workspace-Bench/Workspace-Bench-Lite',
  'tasks_full_metadata_table.csv',
  'tasks_lite_metadata_table.csv'
]) {
  if (!fetchDatasetScript.includes(marker)) fail(`fetch-dataset.js missing marker: ${marker}`);
}

if (!process.exitCode) console.log('Static site checks passed.');
