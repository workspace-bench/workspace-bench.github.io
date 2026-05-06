function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  if (document.documentElement.classList.contains('dark-mode')) {
    document.body.classList.add('dark-mode');
    document.documentElement.classList.remove('dark-mode');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      
      // 触发自定义事件，通知图表等组件重绘
      window.dispatchEvent(new Event('themeChanged'));
    });
  }

  prefersDarkScheme.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      document.body.classList.toggle('dark-mode', e.matches);
    }
  });
}

function initActiveNav() {
  const currentPath = window.location.pathname;
  const rawPage = currentPath.split('/').pop().split('.')[0] || 'index';
  const currentPage = rawPage === 'index' ? 'leaderboard' : rawPage;
  const navLinks = document.querySelectorAll('.topnav-link');

  navLinks.forEach((link) => {
    const linkPage = link.getAttribute('data-page');
    link.classList.toggle('active', linkPage === currentPage);
  });
}

function initTopNav() {
  const toggle = document.getElementById('topnav-toggle');
  const overlay = document.getElementById('topnav-overlay');
  const links = document.querySelectorAll('.topnav-link');

  function openMenu() {
    document.body.classList.add('topnav-open');
  }

  function closeMenu() {
    document.body.classList.remove('topnav-open');
  }

  function isMobile() {
    return window.matchMedia('(max-width: 920px)').matches;
  }

  if (toggle) {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      if (document.body.classList.contains('topnav-open')) closeMenu();
      else openMenu();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      e.preventDefault();
      closeMenu();
    });
  }

  links.forEach((link) => {
    link.addEventListener('click', () => {
      if (isMobile()) closeMenu();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', () => {
    if (!isMobile()) closeMenu();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initActiveNav();
  initTopNav();
});
