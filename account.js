import { checkoutCurrentCart, fetchCurrentCart, fetchCurrentMember, loggedInHint, logoutMember } from './wix-client.js';

const gate = document.querySelector('#accountGate');
const page = document.querySelector('#accountPage');
const profileGrid = document.querySelector('#profileGrid');
const basketContent = document.querySelector('#basketContent');
const basketCount = document.querySelector('#basketCount');
const purchaseHistory = document.querySelector('#purchaseHistory');
const welcomeTitle = document.querySelector('#welcomeTitle');
const logoutButton = document.querySelector('#logoutButton');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function moneyLike(value) {
  return value?.formattedAmount || value?.formattedValue || value?.formatted || value?.amount || value?.value || '';
}

function lineName(line) {
  return line?.productName?.translated || line?.productName?.original || line?.productName || line?.description || 'Store item';
}

function setActivePanel() {
  const requested = location.hash.replace('#', '') || 'profile';
  const valid = ['profile', 'basket', 'purchases'].includes(requested) ? requested : 'profile';
  document.querySelectorAll('[data-account-tab]').forEach((tab) => tab.classList.toggle('active', tab.dataset.accountTab === valid));
  document.querySelectorAll('[data-account-panel]').forEach((panel) => panel.hidden = panel.dataset.accountPanel !== valid);
}

async function renderBasket() {
  try {
    const cart = await fetchCurrentCart();
    const lines = cart?.lineItems || [];
    basketCount.textContent = String(lines.reduce((total, line) => total + Number(line.quantity || 0), 0)).padStart(2, '0');
    if (!lines.length) {
      basketContent.innerHTML = `<div class="account-empty"><h3>Your basket is empty.</h3><p>The Wix Storefront is connected. The Clarity Kit can be added here as soon as its final price and digital product are activated.</p><a class="button button-dark" href="/index.html#offer">Back to the kit</a></div>`;
      return;
    }
    const lineMarkup = lines.map((line) => {
      const price = moneyLike(line?.price) || moneyLike(line?.fullPrice) || moneyLike(line?.lineItemPrice);
      return `<article class="basket-line"><div><h3>${escapeHtml(lineName(line))}</h3><p>Quantity ${escapeHtml(line.quantity || 1)}</p></div><strong>${escapeHtml(price)}</strong></article>`;
    }).join('');
    const subtotal = moneyLike(cart?.subtotal) || moneyLike(cart?.priceSummary?.subtotal);
    basketContent.innerHTML = `${lineMarkup}<div class="basket-summary"><span>Subtotal</span><strong>${escapeHtml(subtotal)}</strong></div><button class="button button-dark button-wide" id="checkoutButton" type="button">Continue to secure Wix checkout →</button><p class="checkout-note">Checkout and payment are handled on Wix’s hosted checkout page.</p><p class="form-message" id="checkoutMessage" role="status"></p>`;
    document.querySelector('#checkoutButton').addEventListener('click', async (event) => {
      const button = event.currentTarget;
      const message = document.querySelector('#checkoutMessage');
      button.disabled = true;
      message.textContent = 'Opening secure checkout…';
      try {
        const url = await checkoutCurrentCart();
        window.location.assign(url);
      } catch (error) {
        button.disabled = false;
        message.textContent = error.message || 'Checkout could not start.';
      }
    });
  } catch (error) {
    basketContent.innerHTML = `<div class="account-empty"><h3>Basket unavailable</h3><p>${escapeHtml(error.message || 'The basket could not be loaded.')}</p></div>`;
  }
}

function renderPurchaseHistory(cart) {
  if (cart?.orderPlaced && cart?.orderId) {
    purchaseHistory.innerHTML = `<article class="purchase-record"><p class="eyebrow">LATEST CHECKOUT</p><h3>Order ${escapeHtml(cart.orderId)}</h3><p>This checkout was placed from the current Wix cart.</p></article><p class="history-note">A complete historical list requires a secure server-side order-history view. Wix Stores order records are admin-readable and are not exposed directly to a browser member token.</p>`;
  } else {
    purchaseHistory.innerHTML = `<div class="account-empty"><h3>No purchase history to show yet.</h3><p>The member account is ready for purchases. A complete historical order list will be activated with the final product/checkout setup so private order data is never exposed through the public browser.</p></div>`;
  }
}

async function init() {
  if (!loggedInHint()) {
    location.replace(`login.html?returnTo=${encodeURIComponent('account.html' + location.hash)}`);
    return;
  }
  const member = await fetchCurrentMember();
  if (!member) {
    location.replace(`login.html?returnTo=${encodeURIComponent('account.html' + location.hash)}`);
    return;
  }
  gate.hidden = true;
  page.hidden = false;
  welcomeTitle.textContent = `Hello, ${member.displayName}`;
  profileGrid.innerHTML = `
    <div><span>Name</span><strong>${escapeHtml(member.displayName)}</strong></div>
    <div><span>Email</span><strong>${escapeHtml(member.loginEmail)}</strong></div>
    <div><span>Member since</span><strong>${escapeHtml(member.memberSince || '—')}</strong></div>
    <div><span>Account ID</span><strong class="mono">${escapeHtml(member.id)}</strong></div>`;
  const cart = await fetchCurrentCart().catch(() => null);
  renderPurchaseHistory(cart);
  await renderBasket();
  setActivePanel();
}

window.addEventListener('hashchange', setActivePanel);
logoutButton.addEventListener('click', () => logoutMember('/'));
init();