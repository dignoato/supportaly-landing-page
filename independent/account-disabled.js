const gate = document.querySelector('#accountGate');
const logoutButton = document.querySelector('#logoutButton');

if (logoutButton) logoutButton.hidden = true;
if (gate) {
  gate.innerHTML = '<p>Account, basket and purchase history are unavailable in Migration Step 1. These Wix-dependent features will be replaced in a later migration phase.</p>';
}
