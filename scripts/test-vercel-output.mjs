#!/usr/bin/env node

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { projectRoot } from './serve-independent.mjs';

const outputRoot = join(projectRoot, 'dist');
const routes = JSON.parse(await readFile(join(projectRoot, '_wix', 'pages.json'), 'utf8'));
const forbiddenFiles = ['account.js', 'login.js', 'member-nav.js', 'wix-client.js'];
const forbiddenPatterns = [
  /id=["']wix-site-script["']/i,
  /manage\.wix\.com\/_api\/headless-business-setup/i,
  /www\.wixapis\.com/i,
  /src=["'](?:\.\/)?(?:account|login|member-nav|wix-client)\.js/i
];

assert.ok(existsSync(outputRoot), 'dist must exist; run node scripts/build-independent.mjs');
assert.equal(existsSync(join(outputRoot, 'assets', 'wix-preserved')), false,
  'Archived originals must not ship in the optimized build');
assert.equal(existsSync(join(outputRoot, 'assets', 'product-originals')), false,
  'Uploaded PNG originals must not ship in the optimized build');

for (const { path } of routes) {
  const file = path === '/' ? 'index.html' : path.replace(/^\//, '');
  const absolute = join(outputRoot, file);
  assert.ok(existsSync(absolute), `${path} must exist in dist`);
  const html = await readFile(absolute, 'utf8');
  for (const pattern of forbiddenPatterns) assert.doesNotMatch(html, pattern, `${path} contains ${pattern}`);
}

for (const file of forbiddenFiles) {
  assert.equal(existsSync(join(outputRoot, file)), false, `${file} must not be deployed`);
}

const textFiles = [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) await collect(absolute);
    else if (['.html', '.js', '.json', '.css', '.svg'].includes(extname(entry.name))) textFiles.push(absolute);
  }
}
await collect(outputRoot);
// The archive index retains provenance URLs in source only, never in dist.

for (const file of textFiles) {
  const text = await readFile(file, 'utf8');
  assert.doesNotMatch(text, /assets\/(?:product-originals|wix-preserved)\//i, `${file} references an undeployed image original`);
  assert.doesNotMatch(text, /manage\.wix\.com\/_api\/headless-business-setup/i, `${file} loads Wix bootstrap`);
  assert.doesNotMatch(text, /www\.wixapis\.com/i, `${file} loads Wix APIs`);
  assert.doesNotMatch(text, /static\.(?:wixstatic|parastorage)\.com/i, `${file} contains Wix media`);
  assert.doesNotMatch(text, /(?:src|srcset|poster)=["']https?:\/\//i, `${file} loads external media/scripts`);
  assert.doesNotMatch(text, /(?:url\(\s*["']?|@import\s+["'])https?:\/\//i, `${file} loads external CSS media/fonts`);
  assert.doesNotMatch(text, /(?:fonts\.googleapis\.com|fonts\.gstatic\.com)/i, `${file} loads external fonts`);
}

const status = JSON.parse(await readFile(join(outputRoot, '__migration', 'status.json'), 'utf8'));
assert.equal(status.wixRuntimeLoaded, false);
assert.equal(status.media.local, 21);
assert.deepEqual(status.media.unresolved, []);
assert.deepEqual(status.excludedRuntimeFiles, [...forbiddenFiles].sort());

console.log(`routes=${routes.length}`);
console.log(`text-files-scanned=${textFiles.length}`);
console.log(`local-media=${status.media.local}`);
console.log(`unresolved-media=${status.media.unresolved.length}`);
console.log('wix-runtime-files=excluded');
console.log('vercel-output=ok');
