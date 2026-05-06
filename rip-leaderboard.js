let ripLeaderboardData = null;
const ripSortState = { field: 'resolved', direction: 'desc' };

function ripLoadLeaderboardData() {
  if (ripLeaderboardData) return ripLeaderboardData;
  const dataScript = document.getElementById('leaderboard-data');
  if (!dataScript) return null;
  try {
    ripLeaderboardData = JSON.parse(dataScript.textContent);
  } catch {
    ripLeaderboardData = null;
  }
  return ripLeaderboardData;
}

function ripGetOrgName(item) {
  if (item && Array.isArray(item.tags)) {
    const orgTag = item.tags.find((t) => typeof t === 'string' && t.startsWith('Org: '));
    if (orgTag) return orgTag.slice(5);
  }
  return '';
}

function ripHasTag(item, needle) {
  if (!item || !Array.isArray(item.tags)) return false;
  return item.tags.some((t) => (t || '').toString().toLowerCase() === needle.toLowerCase());
}

function ripSortItems(a, b, field, direction) {
  const getValue = (item) => {
    switch (field) {
      case 'name':
        return (item.name || '').toLowerCase();
      case 'resolved':
        return Number(item.resolved) || 0;
      case 'cost':
        return typeof item.cost === 'number' ? item.cost : Infinity; // 没有cost的排在最后
      case 'time':
        return typeof item.time === 'number' ? item.time : Infinity;
      case 'org':
        return ripGetOrgName(item).toLowerCase();
      case 'date':
        return (item.date || '').toString();
      case 'site':
        return item.site ? 1 : 0;
      default:
        return '';
    }
  };

  const av = getValue(a);
  const bv = getValue(b);
  let result;

  if (typeof av === 'number' && typeof bv === 'number') result = av - bv;
  else result = av.toString().localeCompare(bv.toString());

  return direction === 'asc' ? result : -result;
}

function ripSetSort(field) {
  if (ripSortState.field === field) {
    ripSortState.direction = ripSortState.direction === 'asc' ? 'desc' : 'asc';
  } else {
    ripSortState.field = field;
    // name, org, date 默认升序；cost 和 time 越小越好所以默认升序；resolved 越大越好默认降序
    ripSortState.direction = ['name', 'org', 'date', 'cost', 'time'].includes(field) ? 'asc' : 'desc';
  }
}

function ripUpdateSortIndicators(container) {
  const ths = container.querySelectorAll('th.sortable');
  ths.forEach((th) => {
    const field = th.getAttribute('data-sort');
    const isActive = field === ripSortState.field;
    th.style.color = isActive ? 'var(--text)' : '';
  });
}

function ripRenderLeaderboard(leaderboardName) {
  const data = ripLoadLeaderboardData();
  const container = document.getElementById('leaderboard-container');
  if (!container) return;
  if (!data) {
    container.innerHTML = '<div class="content-section" style="box-shadow:none">No leaderboard data.</div>';
    return;
  }

  const leaderboard = data.find((lb) => lb && lb.name === leaderboardName) || data[0];
  if (!leaderboard || !Array.isArray(leaderboard.results)) {
    container.innerHTML = '<div class="content-section" style="box-shadow:none">No results.</div>';
    return;
  }

  const results = leaderboard.results
    .slice()
    .sort((a, b) => ripSortItems(a, b, ripSortState.field, ripSortState.direction));

  container.innerHTML = `
    <div class="tabcontent active" id="leaderboard-${leaderboard.name}">
      <div class="table-responsive">
        <table class="table scrollable data-table">
          <thead>
            <tr>
              <th class="sortable" data-sort="name">Model</th>
              <th class="sortable" data-sort="resolved">Success</th>
              <th class="sortable" data-sort="cost">Cost ($)</th>
              <th class="sortable" data-sort="time">Time (s)</th>
              <th class="sortable" data-sort="org">Org</th>
              <th class="sortable" data-sort="date">Date</th>
              <th class="sortable" data-sort="site">Site</th>
            </tr>
          </thead>
          <tbody>
            ${results
              .map((item) => {
                const resolved = Number(item.resolved);
                const resolvedText = Number.isFinite(resolved) ? resolved.toFixed(2) : '';
                const costText = typeof item.cost === 'number' ? `$${item.cost.toFixed(2)}` : '-';
                const timeText = typeof item.time === 'number' ? `${item.time}s` : '-';
                const org = ripGetOrgName(item);
                const isChecked = !!item.checked;
                const isOss = !!item.os_model || ripHasTag(item, 'OSS');
                const isNew = typeof item.date === 'string' && item.date >= '2026-03-01';
                const siteUrl = Array.isArray(item.site) ? item.site[0] : item.site;
                const logos = Array.isArray(item.logo) ? item.logo : [];
                return `
                  <tr data-tags="${Array.isArray(item.tags) ? item.tags.join(',') : ''}">
                    <td>
                      <div class="flex items-center gap-1">
                        <div class="model-badges">
                          ${isNew ? '<span>🆕</span>' : ''}
                          ${isOss ? '<span>🤠</span>' : ''}
                          ${isChecked ? '<span title="Checked">✅</span>' : ''}
                        </div>
                        <span class="model-name font-mono fw-medium">${item.name || ''}</span>
                      </div>
                    </td>
                    <td><span class="number fw-medium text-primary">${resolvedText}</span></td>
                    <td><span class="number text-muted">${costText}</span></td>
                    <td><span class="number text-muted">${timeText}</span></td>
                    <td>
                      ${logos.length > 0 ? `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${logos
                        .map((u) => `<img src="${u}" alt="" style="height:1.4em">`)
                        .join('')}<span class="text-muted">${org || '-'}</span></div>` : `<span class="text-muted">${org || '-'}</span>`}
                    </td>
                    <td><span class="label-date text-muted">${item.date || '-'}</span></td>
                    <td class="centered-text text-center">
                      ${siteUrl ? `<a href="${siteUrl}" target="_blank" rel="noopener noreferrer" aria-label="Open site"><i class="fas fa-external-link-alt"></i></a>` : '<span class="text-muted">-</span>'}
                    </td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const ths = container.querySelectorAll('th.sortable');
  ths.forEach((th) => {
    th.addEventListener('click', () => {
      const field = th.getAttribute('data-sort');
      if (!field) return;
      ripSetSort(field);
      ripRenderLeaderboard(leaderboard.name);
    });
  });

  ripUpdateSortIndicators(container);

  const tablinks = document.querySelectorAll('.tablinks');
  tablinks.forEach((btn) => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.tablinks[data-leaderboard="${leaderboard.name}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  ripRenderChart(results);
}

let ripChartInstance = null;

function ripRenderChart(results) {
  const canvas = document.getElementById('costAccuracyChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  // 准备散点数据，只有包含 cost 和 resolved 的才会画出来
  const validData = results.filter(r => typeof r.cost === 'number' && typeof r.resolved === 'number');
  
  const chartData = {
    datasets: [{
      label: 'Models',
      data: validData.map(r => ({
        x: r.cost,
        y: r.resolved,
        modelName: r.name,
        org: ripGetOrgName(r)
      })),
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderColor: 'rgba(37, 99, 235, 1)',
      borderWidth: 1,
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  };

  const isDarkMode = document.documentElement.classList.contains('dark-mode') || document.body.classList.contains('dark-mode');
  const textColor = isDarkMode ? '#e2e8f0' : '#334155';
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const pt = context.raw;
            return `${pt.modelName} (${pt.org}) | Cost: $${pt.x} | Success: ${pt.y}%`;
          }
        }
      },
      title: {
        display: true,
        text: 'Cost vs. Success Rate',
        color: textColor,
        font: { size: 16 }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Cost ($)', color: textColor },
        ticks: { color: textColor },
        grid: { color: gridColor }
      },
      y: {
        title: { display: true, text: 'Success Rate (%)', color: textColor },
        ticks: { color: textColor },
        grid: { color: gridColor }
      }
    }
  };

  if (ripChartInstance) {
    ripChartInstance.destroy();
  }

  // 依赖外部通过 CDN 加载的 Chart.js
  if (typeof Chart !== 'undefined') {
    ripChartInstance = new Chart(ctx, {
      type: 'scatter',
      data: chartData,
      options: chartOptions
    });
  }
}

function ripInitLeaderboardTabs() {
  const tablinks = document.querySelectorAll('.tablinks');
  tablinks.forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-leaderboard');
      if (name) ripRenderLeaderboard(name);
    });
  });
}

// 监听主题切换，重新渲染图表以适配颜色
window.addEventListener('themeChanged', () => {
  const activeBtn = document.querySelector('.tablinks.active');
  if (activeBtn) {
    const name = activeBtn.getAttribute('data-leaderboard');
    if (name) ripRenderLeaderboard(name);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('leaderboard-container')) return;
  ripInitLeaderboardTabs();
  const hash = window.location.hash ? window.location.hash.slice(1) : '';
  const initial = hash || (document.querySelector('.tablinks') && document.querySelector('.tablinks').getAttribute('data-leaderboard')) || 'RIP-Bench';
  ripRenderLeaderboard(initial);
});
