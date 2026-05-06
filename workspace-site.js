const workspaceNavItems = [
  ["index.html", "Home"],
  ["leaderboard.html", "Leaderboard"],
  ["dataset.html", "Dataset"],
  ["methodology.html", "Methodology"],
  ["examples.html", "Examples"],
  ["submit.html", "Submit"],
  ["citation.html", "Citation"],
  ["contact.html", "Contact"]
];

function workspaceCurrentPage() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  return page;
}

function workspaceRenderShell() {
  const header = document.querySelector("[data-workspace-header]");
  const footer = document.querySelector("[data-workspace-footer]");
  const current = workspaceCurrentPage();

  if (header) {
    header.innerHTML = `
      <header class="site-header">
        <div class="container nav">
          <a class="brand" href="./index.html" aria-label="Workspace-Bench home">
            <img src="./workspace-bench.svg" alt="">
            <span>Workspace-Bench</span>
          </a>
          <button class="nav-toggle" type="button" aria-label="Open navigation" aria-expanded="false">Menu</button>
          <nav class="nav-links" aria-label="Primary navigation">
            ${workspaceNavItems.map(([href, label]) => `
              <a class="nav-link ${href === current ? "active" : ""}" href="./${href}">${label}</a>
            `).join("")}
          </nav>
        </div>
      </header>
    `;
  }

  if (footer) {
    footer.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-inner">
          <div>© 2026 Workspace-Bench</div>
          <div class="footer-links">
            <a href="https://github.com/OpenDataBox/Workspace-Bench" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://arxiv.org/abs/2605.03596" target="_blank" rel="noopener noreferrer">arXiv</a>
            <a href="./submit.html">Submit</a>
            <a href="./citation.html">Citation</a>
          </div>
        </div>
      </footer>
    `;
  }
}

function workspaceInitNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(document.body.classList.contains("nav-open")));
  });
}

async function workspaceFetchJson(path) {
  const data = window.WORKSPACE_BENCH_DATA;
  if (data) {
    if (path.includes("leaderboard")) return data.leaderboard;
    if (path.includes("dataset-stats")) return data.datasetStats;
    if (path.includes("profile-results")) return data.profileResults;
    if (path.includes("capability-results")) return data.capabilityResults;
    if (path.includes("examples")) return { examples: data.examples };
  }
  if (window.location.protocol === "file:") {
    throw new Error("Local JSON loading is blocked by the browser. Include workspace-data.js or open the site through a local server.");
  }
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.json();
}

function workspaceFormatNumber(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") {
    const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1);
    return `${formatted}${suffix}`;
  }
  return `${value}${suffix}`;
}

document.addEventListener("DOMContentLoaded", () => {
  workspaceRenderShell();
  workspaceInitNavToggle();
});
