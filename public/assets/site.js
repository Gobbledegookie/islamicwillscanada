const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.primary-nav');
const themeControl = document.querySelector('.theme-control');
if (themeControl) {
  const savedTheme = document.documentElement.dataset.theme;
  const selectedTheme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'system';
  themeControl.querySelector(`input[value="${selectedTheme}"]`).checked = true;
  themeControl.hidden = false;
  themeControl.addEventListener('change', event => {
    if (event.target.name !== 'theme') return;
    const theme = event.target.value;
    if (theme === 'system') {
      delete document.documentElement.dataset.theme;
      try { localStorage.removeItem('iwc-theme'); } catch {}
    } else {
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem('iwc-theme', theme); } catch {}
    }
    themeControl.open = false;
    themeControl.querySelector('summary').focus({ preventScroll: true });
  });
  document.addEventListener('pointerdown', event => {
    if (!themeControl.contains(event.target)) themeControl.open = false;
  });
  document.addEventListener('focusin', event => {
    if (themeControl.open && !themeControl.contains(event.target)) themeControl.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && themeControl.open) {
      themeControl.open = false;
      themeControl.querySelector('summary').focus({ preventScroll: true });
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
