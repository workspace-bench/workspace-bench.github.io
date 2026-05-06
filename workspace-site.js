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

const workspaceNavGroups = [
  {
    label: "Benchmark",
    items: [
      ["index.html", "Home"],
      ["leaderboard.html", "Leaderboard"],
      ["dataset.html", "Dataset"]
    ]
  },
  {
    label: "Research",
    items: [
      ["methodology.html", "Methodology"],
      ["examples.html", "Examples"]
    ]
  },
  {
    label: "Project",
    items: [
      ["submit.html", "Submit"],
      ["contact.html", "Citation & Contact"]
    ]
  }
];

const workspaceSearchItems = [
  ...workspaceNavItems.map(([href, label]) => ({
    title: label,
    href: `./${href}`,
    type: "Page"
  })),
  { title: "GitHub repository", href: "https://github.com/OpenDataBox/Workspace-Bench", type: "External" },
  { title: "arXiv paper", href: "https://arxiv.org/abs/2605.03596", type: "External" },
  { title: "Hugging Face dataset", href: "https://huggingface.co/datasets/ShenYunTzr/Workspace-Bench", type: "External" }
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
          <div class="aa-floating-nav">
            <a class="brand aa-brand-pill" href="./index.html" aria-label="Workspace-Bench home">
              <img src="./workspace-bench.svg" alt="">
              <span>Workspace-Bench</span>
            </a>
            <button class="nav-toggle" type="button" aria-label="Open navigation" aria-expanded="false">Menu</button>
            <nav class="nav-links" aria-label="Primary navigation">
              ${workspaceNavGroups.map((group) => `
                <div class="nav-pill-group" aria-label="${group.label}">
                  ${group.items.map(([href, label]) => `
                    <a class="nav-link ${href === current ? "active" : ""}" href="./${href}">${label}</a>
                  `).join("")}
                </div>
              `).join("")}
            </nav>
            <div class="nav-actions" aria-label="Workspace-Bench utilities">
              <button class="aa-icon-button aa-search-button" type="button" aria-label="Search site">Search</button>
              <a class="aa-icon-button" href="https://github.com/OpenDataBox/Workspace-Bench" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a class="aa-icon-button" href="https://arxiv.org/abs/2605.03596" target="_blank" rel="noopener noreferrer">arXiv</a>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  if (!document.getElementById("workspaceSearchDialog")) {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="site-search-overlay" id="workspaceSearchDialog" hidden>
        <div class="site-search-panel" role="dialog" aria-modal="true" aria-label="Search Workspace-Bench">
          <div class="site-search-input-row">
            <input id="workspaceSiteSearchInput" type="search" placeholder="Search Workspace-Bench" aria-label="Search Workspace-Bench">
            <button class="aa-icon-button" type="button" data-search-close aria-label="Close search">Close</button>
          </div>
          <div class="site-search-results" id="workspaceSiteSearchResults"></div>
        </div>
      </div>
    `);
  }

  if (footer) {
    footer.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-inner">
          <div>&copy; 2026 Workspace-Bench</div>
          <div class="footer-links">
            <a href="https://github.com/OpenDataBox/Workspace-Bench" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://arxiv.org/abs/2605.03596" target="_blank" rel="noopener noreferrer">arXiv</a>
            <a href="./dataset.html">Dataset</a>
            <a href="./submit.html">Submit</a>
            <a href="./contact.html">Citation & Contact</a>
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

function workspaceRenderSearchResults(query = "") {
  const results = document.getElementById("workspaceSiteSearchResults");
  if (!results) return;
  const needle = query.trim().toLowerCase();
  const items = workspaceSearchItems.filter((item) => !needle || `${item.title} ${item.type}`.toLowerCase().includes(needle));
  results.innerHTML = items.map((item) => `
    <a class="site-search-result" href="${item.href}" ${item.href.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>
      <span>${item.title}</span>
      <span class="badge">${item.type}</span>
    </a>
  `).join("") || '<div class="site-search-empty">No results found.</div>';
}

function workspaceInitSiteSearch() {
  const dialog = document.getElementById("workspaceSearchDialog");
  const input = document.getElementById("workspaceSiteSearchInput");
  if (!dialog || !input) return;
  const open = () => {
    dialog.hidden = false;
    workspaceRenderSearchResults(input.value);
    window.setTimeout(() => input.focus(), 0);
  };
  const close = () => {
    dialog.hidden = true;
  };
  document.querySelectorAll(".aa-search-button").forEach((button) => button.addEventListener("click", open));
  document.querySelectorAll("[data-search-close]").forEach((button) => button.addEventListener("click", close));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  input.addEventListener("input", () => workspaceRenderSearchResults(input.value));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dialog.hidden) close();
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      open();
    }
  });
  workspaceRenderSearchResults();
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
  workspaceInitSiteSearch();
});
