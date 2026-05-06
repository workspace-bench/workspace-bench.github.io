# workspace-bench.github.io

Static GitHub Pages website for Workspace-Bench 1.0.

## Pages

- `index.html` - landing page with benchmark summary and performance gap.
- `leaderboard.html` - official leaderboard, filters, tables, and charts.
- `dataset.html` - dataset composition and benchmark visualizations.
- `methodology.html` - workspace learning definition, scoring, and reproducibility protocol.
- `examples.html` - representative tasks and rubric examples.
- `submit.html` - submission checklist and result JSON schema.
- `citation.html` - paper, repository, and BibTeX information.
- `contact.html` - project links and coordination guidance.

## Data

Structured site data lives in `data/`:

- `leaderboard.json`
- `dataset-stats.json`
- `profile-results.json`
- `capability-results.json`
- `examples.json`

## Verification

Run the static checks before publishing:

```bash
node tests/static-site-check.js
```

The site is static and can be deployed from the repository root with GitHub Pages.
