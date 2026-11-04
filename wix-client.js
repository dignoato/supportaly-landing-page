const WIX_CLIENT_ID = '7b1069b6-47c6-46c2-8a9b-9404172c5d6f';
const WIX_API_BASE = 'https://www.wixapis.com';
const TOKEN_URL = `${WIX_API_BASE}/oauth2/token`;
const STORAGE_KEY = `wix-visitor-${WIX_CLIENT_ID}`;
let memory = null;

function loadStoredTokens() {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) memory = JSON.parse(raw);
  } catch (_) {}
  return memory;
}

function saveTokens(tokens) {
  memory = tokens;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens)); } catch (_) {}
}

export function loadTokens() { return loadStoredTokens(); }
export function setTokens(tokens) { saveTokens(tokens); }
export function clearTokens() { saveTokens({ accessToken: '', refreshToken: '', expiresAt: 0 }); }
export function loggedInHint() { return loadStoredTokens()?.role === 'member'; }

export async function mintTokens(body, role = 'visitor') {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: WIX_CLIENT_ID, ...body })
  });
  if (!res.ok) throw new Error(`Wix auth failed (${res.status}).`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    role
  };
}

export async function accessToken() {
  const t = loadStoredTokens();
  if (t && t.accessToken && t.expiresAt - 60000 > Date.now()) return t.accessToken;
  let fresh;
  if (t?.refreshToken) {
    try {
      fresh = await mintTokens({ grantType: 'refresh_token', refreshToken: t.refreshToken }, t.role || 'visitor');
    } catch (_) {}
  }
  if (!fresh) fresh = await mintTokens({ grantType: 'anonymous' });
  saveTokens(fresh);
  return fresh.accessToken;
}

export class WixApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function wixRequest(path, { method = 'POST', body, query } = {}) {
  const url = new URL(path, WIX_API_BASE);
  for (const [key, value] of Object.entries(query || {})) {
    for (const item of Array.isArray(value) ? value : [value]) url.searchParams.append(key, String(item));
  }
  const res = await fetch(url, {
    method,
    headers: { Authorization: await accessToken(), 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!res.ok) {
    let message = '';
    let code;
    let details;
    try {
      const json = await res.json();
      message = json?.message || '';
      code = json?.details?.applicationError?.code;
      details = json?.details;
    } catch (_) {}
    throw new WixApiError(message || `${method} ${url.pathname} failed (${res.status}).`, res.status, code, details);
  }
  return res.status === 204 ? null : res.json();
}

function base64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function randomString() { return base64url(crypto.getRandomValues(new Uint8Array(32))); }
async function pkce() {
  const verifier = randomString();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

async function authorizationCode(url, state) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    const done = () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      frame.remove();
    };
    const onMessage = (event) => {
      const data = event.data;
      if (!data || data.state !== state) return;
      done();
      if (data.error) reject(new Error(`Login was refused: ${data.error}`));
      else if (data.code) resolve(data.code);
      else reject(new Error("Login couldn't finish: no authorization code."));
    };
    const timer = setTimeout(() => {
      done();
      reject(new Error("Login timed out. Please try again."));
    }, 120000);
    window.addEventListener('message', onMessage);
    frame.src = url;
    document.body.appendChild(frame);
  });
}

async function memberTokensForSession(sessionToken) {
  const { verifier, challenge } = await pkce();
  const state = randomString();
  const response = await wixRequest('/headless/v1/redirect-session', {
    body: {
      auth: {
        authRequest: {
          clientId: WIX_CLIENT_ID,
          codeChallenge: challenge,
          codeChallengeMethod: 'S256',
          responseMode: 'web_message',
          responseType: 'code',
          scope: 'offline_access',
          state,
          sessionToken
        },
        prompt: 'none'
      }
    }
  });
  const url = response?.redirectSession?.fullUrl;
  if (!url) throw new Error("Login couldn't finish: no authorization URL returned.");
  const code = await authorizationCode(url, state);
  return mintTokens({ grantType: 'authorization_code', code, codeVerifier: verifier }, 'member');
}

let pendingStateToken = null;
async function finishAuth(raw) {
  const stateMap = {
    SUCCESS: 'SUCCESS',
    REQUIRE_EMAIL_VERIFICATION: 'EMAIL_VERIFICATION_REQUIRED',
    REQUIRE_OWNER_APPROVAL: 'OWNER_APPROVAL_REQUIRED'
  };
  const state = stateMap[raw?.state] || 'FAILURE';
  if (state === 'SUCCESS') {
    pendingStateToken = null;
    if (!raw?.sessionToken) return { state: 'FAILURE', error: 'Wix did not return a member session.' };
    setTokens(await memberTokensForSession(raw.sessionToken));
    return { state: 'SUCCESS' };
  }
  if (raw?.stateToken) pendingStateToken = raw.stateToken;
  return { state, error: raw?.message || raw?.error };
}

export async function loginMember(email, password) {
  try {
    const raw = await wixRequest('/_api/iam/authentication/v2/login', {
      body: { loginId: { email }, password }
    });
    return finishAuth(raw);
  } catch (error) {
    return { state: 'FAILURE', error: error.message || 'Could not sign in.' };
  }
}

export async function registerMember(email, password, profile = {}) {
  try {
    const raw = await wixRequest('/_api/iam/authentication/v2/register', {
      body: { loginId: { email }, password, profile }
    });
    return finishAuth(raw);
  } catch (error) {
    return { state: 'FAILURE', error: error.message || 'Could not create the account.' };
  }
}

export async function verifyMemberEmail(code) {
  if (!pendingStateToken) return { state: 'FAILURE', error: 'No sign-in is waiting for a verification code.' };
  try {
    const raw = await wixRequest('/_api/iam/verification/v1/auth/verify', {
      body: { code, stateToken: pendingStateToken }
    });
    return finishAuth(raw);
  } catch (error) {
    return { state: 'FAILURE', error: error.message || 'Verification failed.' };
  }
}

export async function fetchCurrentMember() {
  try {
    const res = await wixRequest('/members/v1/members/my', {
      method: 'GET',
      query: { fieldsets: ['FULL'] }
    });
    const member = res?.member;
    if (!member?.id) return null;
    const firstName = member.contact?.firstName || '';
    const lastName = member.contact?.lastName || '';
    const loginEmail = member.loginEmail || '';
    const nickname = member.profile?.nickname || '';
    const displayName = nickname || [firstName, lastName].filter(Boolean).join(' ') || loginEmail.split('@')[0] || 'Member';
    return {
      id: member.id,
      loginEmail,
      firstName,
      lastName,
      displayName,
      memberSince: member.createdDate ? new Date(member.createdDate).toLocaleDateString() : ''
    };
  } catch (_) {
    return null;
  }
}

export async function logoutMember(returnTo = '/') {
  const target = new URL(returnTo, window.location.origin).href;
  const response = await wixRequest('/headless/v1/redirect-session', {
    body: {
      logout: { clientId: WIX_CLIENT_ID },
      callbacks: { postFlowUrl: target }
    }
  });
  const url = response?.redirectSession?.fullUrl;
  clearTokens();
  if (url) window.location.assign(url);
  else window.location.assign(returnTo);
}

export async function fetchCurrentCart() {
  try {
    const response = await wixRequest('/ecom/v2/carts/current', { method: 'GET' });
    return response?.cart || null;
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

export async function checkoutCurrentCart() {
  const cart = await fetchCurrentCart();
  if (!cart?.id || !cart?.lineItems?.length) throw new Error('Your basket is empty.');
  const origin = window.location.origin;
  const response = await wixRequest('/headless/v1/redirect-session', {
    body: {
      ecomCheckout: { checkoutId: cart.id },
      callbacks: {
        postFlowUrl: `${origin}/account.html#basket`,
        thankYouPageUrl: `${origin}/account.html#purchases`
      }
    }
  });
  const url = response?.redirectSession?.fullUrl;
  if (!url) throw new Error("Checkout couldn't start: no redirect URL returned.");
  return url;
}