#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createIndependentServer, loadMediaState, projectRoot, transformText } from './serve-independent.mjs';

const homepageSource = await readFile(join(projectRoot, 'index.html'), 'utf8');
const loginSource = await readFile(join(projectRoot, 'login.html'), 'utf8');
const accountSource = await readFile(join(projectRoot, 'account.html'), 'utf8');
const mediaState = loadMediaState();

const transformedHomepage = transformText('/index.html', homepageSource, mediaState);
const transformedLogin = transformText('/login.html', loginSource, mediaState);
const transformedAccount = transformText('/account.html', accountSource, mediaState);

assert.doesNotMatch(transformedHomepage, /id=["']wix-site-script["']/);
assert.doesNotMatch(transformedHomepage, /manage\.wix\.com\/_api\/headless-business-setup/);
assert.match(transformedHomepage, /supportaly-guided-check\.js/);
assert.match(transformedHomepage, /\/independent\/member-nav\.js/);
assert.match(transformedLogin, /\/independent\/login-disabled\.js/);
assert.match(transformedAccount, /\/independent\/account-disabled\.js/);

const routes = JSON.parse(await readFile(join(projectRoot, '_wix', 'pages.json'), 'utf8'))
  .map(({ path }) => path);
const server = createIndependentServer();

await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

try {
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;

  for (const route of routes) {
    const response = await fetch(`${origin}${route}`);
    assert.equal(response.status, 200, `${route} should return 200`);
    const html = await response.text();
    assert.doesNotMatch(html, /id=["']wix-site-script["']/, `${route} should omit Wix bootstrap`);
  }

  for (const route of ['/styles.css', '/v6-supportaly.js', '/assets/hero.webp', '/independent/member-nav.js']) {
    const response = await fetch(`${origin}${route}`);
    assert.equal(response.status, 200, `${route} should return 200`);
  }

  const statusResponse = await fetch(`${origin}/__migration/status.json`);
  assert.equal(statusResponse.status, 200);
  const status = await statusResponse.json();
  assert.equal(status.mode, 'wix-independent-step-1');
  assert.equal(status.wixRuntimeLoaded, false);
  assert.ok(status.disabledFeatures.includes('authentication'));

  console.log(`routes=${routes.length}`);
  console.log('assets=4');
  console.log(`local-media=${status.media.local}`);
  console.log(`unresolved-media=${status.media.unresolved.length}`);
  console.log('wix-bootstrap=disabled');
  console.log('independent-runtime=ok');
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
