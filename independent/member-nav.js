const links = [...document.querySelectorAll('[data-member-link]')];
const mobileLinks = [...document.querySelectorAll('[data-member-mobile]')];

for (const link of links) {
  link.href = 'login.html';
  link.setAttribute('aria-label', 'Account unavailable in Migration Step 1');
  link.classList.remove('is-member');
  const initial = link.querySelector('[data-member-initial]');
  if (initial) initial.textContent = '';
}

for (const link of mobileLinks) {
  link.href = 'login.html';
  link.textContent = 'Account / unavailable in preview';
}
