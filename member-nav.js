import { fetchCurrentMember, loggedInHint } from './wix-client.js';

const links = [...document.querySelectorAll('[data-member-link]')];
const mobileLinks = [...document.querySelectorAll('[data-member-mobile]')];

async function updateMemberNavigation() {
  let member = null;
  if (loggedInHint()) member = await fetchCurrentMember();
  const loggedIn = Boolean(member) || loggedInHint();
  const href = loggedIn ? 'account.html' : 'login.html?returnTo=account.html';
  links.forEach((link) => {
    link.href = href;
    link.setAttribute('aria-label', loggedIn ? `Account${member?.displayName ? ` — ${member.displayName}` : ''}` : 'Sign in or create account');
    link.classList.toggle('is-member', loggedIn);
    const initial = link.querySelector('[data-member-initial]');
    if (initial) initial.textContent = member?.displayName?.trim()?.charAt(0)?.toUpperCase() || '';
  });
  mobileLinks.forEach((link) => {
    link.href = href;
    link.textContent = loggedIn ? `Account${member?.displayName ? ` · ${member.displayName}` : ''}` : 'Account / Sign in';
  });
}

updateMemberNavigation();