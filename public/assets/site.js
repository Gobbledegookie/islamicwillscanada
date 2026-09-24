const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.primary-nav');
const themeButton = document.querySelector('.theme-toggle');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
if (themeButton) {
  const darkIsActive = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && systemDark.matches);
  const syncThemeButton = () => themeButton.setAttribute('aria-pressed', String(darkIsActive()));
  themeButton.hidden = false;
  syncThemeButton();
  themeButton.addEventListener('click', () => {
    const theme = darkIsActive() ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('iwc-theme', theme); } catch {}
    syncThemeButton();
  });
  systemDark.addEventListener('change', syncThemeButton);
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
