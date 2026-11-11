const forms = [...document.querySelectorAll('#authForm, #verifyForm')];
const message = document.querySelector('#authMessage');

for (const form of forms) {
  form.addEventListener('submit', (event) => event.preventDefault());
  for (const control of form.elements) control.disabled = true;
}

if (message) {
  message.textContent = 'Account sign-in and registration are unavailable in Migration Step 1. No credentials are sent to Wix or stored by this preview.';
}
