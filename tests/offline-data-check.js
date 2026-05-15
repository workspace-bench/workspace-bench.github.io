const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const required = [
  'workspace-data.js',
  'data/detailed-rubrics-results.json',
  'assets/Distribution.png',
  'assets/rubrics_success.png',
  'assets/Framework.png'
];
let failed = false;
function fail(msg) { console.error(`FAIL: ${msg}`); failed = true; }
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) fail(`missing ${file}`);
}
for (const page of ['index.html','leaderboard.html','dataset.html','examples.html']) {
  const text = fs.readFileSync(path.join(root, page), 'utf8');
  if (!text.includes('workspace-data.js')) fail(`${page} must include workspace-data.js`);
}
const scripts = ['workspace-site.js','workspace-charts.js','workspace-leaderboard.js'];
for (const file of scripts) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  if (/Failed to fetch/.test(text)) fail(`${file} still exposes Failed to fetch path`);
}
if (!failed) console.log('Offline data checks passed.');
process.exit(failed ? 1 : 0);
