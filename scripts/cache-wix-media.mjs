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

function validateImage(bytes, extension) {
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  const type = png ? 'image/png' : jpeg ? 'image/jpeg' : webp ? 'image/webp' : null;
  const expected = {'.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp'}[extension];
  if (!type || type !== expected) throw new Error('Invalid image signature or extension');
  return type;
}

async function download(asset) {
  const relativePath = destinationFor(asset.url);
  const absolutePath = join(projectRoot, relativePath);

  try {
    const metadata = await stat(absolutePath);
    if (metadata.isFile()) {
      if (!metadata.size || metadata.size > maxAssetBytes) throw new Error('Invalid cached asset size');
      const bytes = await readFile(absolutePath);
      const hash = createHash('sha256').update(bytes).digest('hex');
      if (asset.sha256 && hash !== asset.sha256) throw new Error('Cached asset SHA-256 mismatch');
      return {
        contentType: validateImage(bytes, extname(relativePath)),
        url: asset.url,
        path: relativePath,
        bytes: metadata.size,
        sha256: hash,
        reused: true
      };
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const response = await fetch(asset.url, { redirect: 'follow', signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!contentType.startsWith('image/')) throw new Error(`Unexpected content type ${contentType || '(missing)'}`);

  const declaredSize = Number(response.headers.get('content-length') || 0);
  if (declaredSize > maxAssetBytes) throw new Error(`Asset exceeds ${maxAssetBytes} bytes`);

  const chunks = [];
  let received = 0;
  for await (const chunk of response.body) {
    received += chunk.length;
    if (received > maxAssetBytes) throw new Error(`Asset exceeds ${maxAssetBytes} bytes`);
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  const detectedType = validateImage(bytes, extname(relativePath));
  if (detectedType !== contentType) throw new Error('Image content type does not match signature');
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (asset.sha256 && hash !== asset.sha256) throw new Error('Downloaded asset SHA-256 mismatch');
  if (!bytes.length || bytes.length > maxAssetBytes) throw new Error(`Invalid asset size ${bytes.length}`);

  const temporaryPath = `${absolutePath}.download`;
  await writeFile(temporaryPath, bytes, { flag: 'wx' });
  await rename(temporaryPath, absolutePath);

  return {
    url: asset.url,
    path: relativePath,
    contentType,
    bytes: bytes.length,
    sha256: hash,
    reused: false
  };
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
await mkdir(destinationDirectory, { recursive: true });

const results = [];
const failures = [];

for (const asset of manifest.assets) {
  if (asset.localEquivalent && !asset.localEquivalent.startsWith('assets/wix-preserved/')) continue;
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
  verification: 'TLS enabled; image content type and signature; streamed 25 MiB size limit; SHA-256 verified/recorded',
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
