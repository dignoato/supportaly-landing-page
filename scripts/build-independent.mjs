#!/usr/bin/env node

import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { loadMediaState, projectRoot, transformText } from './serve-independent.mjs';

const outputRoot = join(projectRoot, 'dist');
const excludedRuntimeFiles = new Set(['account.js', 'login.js', 'member-nav.js', 'wix-client.js']);
const textExtensions = new Set(['.css', '.html', '.js']);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

const mediaState = loadMediaState();
const rootEntries = await readdir(projectRoot, { withFileTypes: true });

for (const entry of rootEntries) {
  if (!entry.isFile()) continue;
  const extension = extname(entry.name).toLowerCase();
  if (!textExtensions.has(extension) || excludedRuntimeFiles.has(entry.name)) continue;

  const sourcePath = join(projectRoot, entry.name);
  const outputPath = join(outputRoot, entry.name);
  const source = await readFile(sourcePath, 'utf8');
  await writeFile(outputPath, transformText(`/${entry.name}`, source, mediaState), 'utf8');
}

await cp(join(projectRoot, 'assets'), join(outputRoot, 'assets'), { recursive: true });
await cp(join(projectRoot, 'independent'), join(outputRoot, 'independent'), { recursive: true });

const statusDirectory = join(outputRoot, '__migration');
await mkdir(statusDirectory, { recursive: true });
await writeFile(
  join(statusDirectory, 'status.json'),
  `${JSON.stringify({
    mode: 'wix-independent-step-1',
    deploymentTarget: 'vercel-preview',
    wixRuntimeLoaded: false,
    disabledFeatures: ['authentication', 'member profile', 'cart', 'checkout', 'purchase history'],
    excludedRuntimeFiles: [...excludedRuntimeFiles].sort(),
    media: {
      total: mediaState.manifest.assets.length,
      local: mediaState.replacements.size,
      unresolved: mediaState.unresolved
    }
  }, null, 2)}\n`,
  'utf8'
);

console.log(`Built ${outputRoot}`);
console.log(`Wix runtime files excluded: ${[...excludedRuntimeFiles].sort().join(', ')}`);
console.log(`Media: ${mediaState.replacements.size} local, ${mediaState.unresolved.length} unresolved`);
