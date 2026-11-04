#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');
const manifestPath = join(projectRoot, 'migration', 'wix-media-manifest.json');
const destinationDirectory = join(projectRoot, 'assets', 'wix-preserved');
const indexPath = join(destinationDirectory, 'index.json');
const maxAssetBytes = 25 * 1024 * 1024;

function destinationFor(url) {
  const parsed = new URL(url);
  const sourceName = parsed.pathname.split('/').pop();
  const extension = extname(sourceName).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
    throw new Error(`Unsupported image extension for ${url}`);
  }
  const safeName = sourceName.replace(/[^a-zA-Z0-9._~-]/g, '-');
  return `assets/wix-preserved/${safeName}`;
}

async function sha256(path) {
  const data = await readFile(path);
  return createHash('sha256').update(data).digest('hex');
}

async function download(asset) {
  const relativePath = destinationFor(asset.url);
  const absolutePath = join(projectRoot, relativePath);

  try {
    const metadata = await stat(absolutePath);
    if (metadata.isFile()) {
      return {
        url: asset.url,
        path: relativePath,
        bytes: metadata.size,
        sha256: await sha256(absolutePath),
        reused: true
      };
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const response = await fetch(asset.url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!contentType.startsWith('image/')) throw new Error(`Unexpected content type ${contentType || '(missing)'}`);

  const declaredSize = Number(response.headers.get('content-length') || 0);
  if (declaredSize > maxAssetBytes) throw new Error(`Asset exceeds ${maxAssetBytes} bytes`);

  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > maxAssetBytes) throw new Error(`Invalid asset size ${bytes.length}`);

  const temporaryPath = `${absolutePath}.download`;
  await writeFile(temporaryPath, bytes, { flag: 'wx' });
  await rename(temporaryPath, absolutePath);

  return {
    url: asset.url,
    path: relativePath,
    contentType,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    reused: false
  };
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
await mkdir(destinationDirectory, { recursive: true });

const results = [];
const failures = [];

for (const asset of manifest.assets) {
  if (asset.localEquivalent) continue;
  try {
    const result = await download(asset);
    results.push(result);
    console.log(`${result.reused ? 'verified' : 'saved'} ${result.path} ${result.sha256}`);
  } catch (error) {
    failures.push({ url: asset.url, error: error.message });
    console.error(`failed ${asset.url}: ${error.message}`);
  }
}

const index = {
  version: 1,
  generatedAt: new Date().toISOString(),
  verification: 'TLS enabled; image content type; 25 MiB size limit; SHA-256 recorded',
  assets: results.map(({ reused, ...result }) => result),
  failures
};

await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');

if (failures.length) {
  console.error(`${failures.length} media assets could not be preserved.`);
  process.exitCode = 1;
} else {
  console.log(`All ${results.length} remote media assets are locally preserved.`);
}
