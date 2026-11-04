import { fetchCurrentMember, loggedInHint, loginMember, registerMember, verifyMemberEmail } from './wix-client.js';

const params = new URLSearchParams(location.search);
const requested = params.get('returnTo') || 'account.html';
const returnTo = requested.startsWith('/') || /^[a-zA-Z0-9._-]+(?:#[a-zA-Z0-9_-]+)?$/.test(requested) ? requested : 'account.html';
const form = document.querySelector('#authForm');
const verifyForm = document.querySelector('#verifyForm');
const message = document.querySelector('#authMessage');
const tabs = [...document.querySelectorAll('[data-mode]')];
const registerFields = document.querySelector('[data-register-fields]');
const title = document.querySelector('#authTitle');
const submitLabel = document.querySelector('[data-submit-label]');
let mode = 'login';

if (loggedInHint()) {
  fetchCurrentMember().then((member) => { if (member) location.replace(returnTo); });
}

function setMode(next) {
  mode = next;
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.mode === mode));
  registerFields.hidden = mode !== 'register';
  title.textContent = mode === 'register' ? 'Create your account' : 'Sign in';
  submitLabel.textContent = mode === 'register' ? 'Create account' : 'Sign in';
  form.elements.password.autocomplete = mode === 'register' ? 'new-password' : 'current-password';
  message.textContent = '';
}

tabs.forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = 'Please wait…';
  submitLabel.disabled = true;
  const data = new FormData(form);
  const email = String(data.get('email') || '').trim();
  const password = String(data.get('password') || '');
  const result = mode === 'register'
    ? await registerMember(email, password, {
        firstName: String(data.get('firstName') || '').trim(),
        lastName: String(data.get('lastName') || '').trim()
      })
    : await loginMember(email, password);
  submitLabel.disabled = false;
  if (result.state === 'SUCCESS') {
    location.replace(returnTo);
  } else if (result.state === 'EMAIL_VERIFICATION_REQUIRED') {
    form.hidden = true;
    verifyForm.hidden = false;
    message.textContent = 'Check your email for the verification code.';
  } else if (result.state === 'OWNER_APPROVAL_REQUIRED') {
    message.textContent = 'Your account was created and is waiting for approval.';
  } else {
    message.textContent = result.error || 'Could not complete this request. Please try again.';
  }
});

verifyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = 'Verifying…';
  const code = String(new FormData(verifyForm).get('code') || '').trim();
  const result = await verifyMemberEmail(code);
  if (result.state === 'SUCCESS') location.replace(returnTo);
  else message.textContent = result.error || 'The code could not be verified.';
});