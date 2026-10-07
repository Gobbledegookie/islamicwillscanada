// Keep existing privacy bookmarks working after moving the details to their own page.
if (location.pathname.replace(/\/$/, '') === '/interactive' && location.hash === '#privacy-details') {
  location.replace('/privacy/');
}
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.primary-nav');
const themeControl = document.querySelector('.theme-control');
const homeStart = document.querySelector('#start-will');
if (homeStart) {
  const nameInput = homeStart.querySelector('#home-full-name');
  const error = homeStart.querySelector('#home-name-error');
  nameInput.addEventListener('input', () => {
    nameInput.removeAttribute('aria-invalid');
    error.hidden = true;
    error.textContent = '';
  });
  homeStart.addEventListener('submit', event => {
    event.preventDefault();
    const name = nameInput.value.trim().replace(/\s+/g, ' ');
    if (!name) {
      error.textContent = 'Please enter your full name to start your will draft.';
      error.hidden = false;
      nameInput.setAttribute('aria-invalid', 'true');
      nameInput.focus();
      return;
    }
    try {
      sessionStorage.setItem('iwc-pending-testator-name', name);
    } catch {
      error.textContent = 'Your browser could not carry your name to the form. Please allow session storage and try again.';
      error.hidden = false;
      nameInput.focus();
      return;
    }
    location.assign('/interactive/');
  });
}
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
