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
  'data/examples.json'
];

const requiredText = {
  'index.html': ['Workspace-Bench 1.0', '20,476 Files', '7,399 Rubrics', '80.7%', '68.7%', '47.4%', 'Independent analysis of workspace agents'],
  'leaderboard.html': ['Official Leaderboard', 'Overall', 'Workspace-Bench-Lite', 'By Worker Profile', 'By Ability', 'Framework x Model Matrix', 'No public cost data'],
  'dataset.html': ['Dataset Visualizations', 'File Type Distribution', 'Task Complexity', 'Lite Split', 'Dataset intelligence overview', 'Workspace Composition Table'],
  'methodology.html': ['Workspace Learning', 'Rubric-based Scoring', 'Reproducibility Requirements', 'Evaluation pipeline', 'Scoring Dimensions'],
  'examples.html': ['Representative Tasks', 'Hidden Dependencies', 'Rubric Examples', 'Task intelligence feed', 'Evidence path'],
  'submit.html': ['Submission', 'Result JSON Schema', 'Verified Results'],
  'citation.html': ['Citation', '2605.03596', 'OpenDataBox/Workspace-Bench']
};

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

const styleText = fs.readFileSync(path.join(root, 'styles/workspace.css'), 'utf8');
for (const selector of ['analysis-shell', 'aa-metric-strip', 'leaderboard-insight-card', 'rank-bar', 'no-data-panel', 'analysis-list', 'compact-data-table', 'pipeline-step']) {
  if (!styleText.includes(selector)) fail(`workspace.css missing Artificial Analysis style selector: ${selector}`);
}

const leaderboardScript = fs.readFileSync(path.join(root, 'workspace-leaderboard.js'), 'utf8');
for (const marker of ['workspaceRenderFrameworkMatrix', 'workspaceRenderInsightCards', 'workspaceRenderNoDataPanel']) {
  if (!leaderboardScript.includes(marker)) fail(`workspace-leaderboard.js missing renderer: ${marker}`);
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
  if (/RIP-Bench|姒|鏄|涓|漏|馃|鉁|�/.test(text)) fail(`${file} contains legacy or mojibake text`);
}

for (const file of ['index.html', 'leaderboard.html', 'dataset.html', 'examples.html']) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  const text = fs.readFileSync(full, 'utf8');
  if (!text.includes('workspace-data.js')) fail(`${file} must include workspace-data.js for file:// support`);
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
  else {
    const names = data.leaderboards.map((item) => item.name);
    for (const expected of ['Overall', 'Workspace-Bench-Lite', 'By Worker Profile', 'By Ability']) {
      if (!names.includes(expected)) fail(`leaderboard missing tab ${expected}`);
    }
  }
}

if (!process.exitCode) console.log('Static site checks passed.');
