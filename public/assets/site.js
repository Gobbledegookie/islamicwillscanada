const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.primary-nav');
const themeControl = document.querySelector('.theme-control');
const themeSelect = document.querySelector('#theme-select');
if (themeControl && themeSelect) {
  const savedTheme = document.documentElement.dataset.theme;
  themeSelect.value = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'system';
  themeControl.hidden = false;
  themeSelect.addEventListener('change', () => {
    const theme = themeSelect.value;
    if (theme === 'system') {
      delete document.documentElement.dataset.theme;
      try { localStorage.removeItem('iwc-theme'); } catch {}
    } else {
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem('iwc-theme', theme); } catch {}
    }
  });
}
if (menuButton && menu) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) {
      menuButton.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      menuButton.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
    }
  });
}
