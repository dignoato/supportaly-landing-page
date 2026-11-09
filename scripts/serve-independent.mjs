#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
export const projectRoot = resolve(scriptDirectory, '..');
const manifestPath = join(projectRoot, 'migration', 'wix-media-manifest.json');
const preservedIndexPath = join(projectRoot, 'assets', 'wix-preserved', 'index.json');
const optimizedIndexPath = join(projectRoot, 'assets', 'kit-optimized', 'index.json');

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.csv', 'text/csv; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp']
]);

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function loadMediaState() {
  const manifest = readJson(manifestPath, { assets: [] });
  const preserved = readJson(preservedIndexPath, { assets: [] });
  const replacements = new Map();

  for (const asset of manifest.assets || []) {
    if (asset.localEquivalent && existsSync(join(projectRoot, asset.localEquivalent))) {
      replacements.set(asset.url, `/${asset.localEquivalent}`);
    }
  }

  for (const asset of preserved.assets || []) {
    if (asset.url && asset.path && existsSync(join(projectRoot, asset.path))) {
      const bytes = readFileSync(join(projectRoot, asset.path));
      const hash = createHash('sha256').update(bytes).digest('hex');
      if (hash !== asset.sha256 || bytes.length !== asset.bytes) {
        throw new Error(`Preserved media integrity mismatch: ${asset.path}`);
      }
      replacements.set(asset.url, `/${asset.path}`);
    }
  }

  const unresolved = (manifest.assets || [])
    .filter((asset) => !replacements.has(asset.url))
    .map(({ url, referencedBy }) => ({ url, referencedBy }));

  const optimized = new Map();
  for (const asset of readJson(optimizedIndexPath, { assets: [] }).assets) {
    for (const variant of asset.variants) {
      const path = join(projectRoot, variant.path);
      if (!existsSync(path)) throw new Error(`Missing optimized image: ${variant.path}`);
      const bytes = readFileSync(path);
      if (createHash('sha256').update(bytes).digest('hex') !== variant.sha256) {
        throw new Error(`Optimized media integrity mismatch: ${variant.path}`);
      }
    }
    optimized.set(asset.source, asset);
  }
  return { manifest, replacements, unresolved, optimized };
}

const wixBootstrapPattern = /<script\s+id=["']wix-site-script["'][^>]*><\/script>/gi;

export function transformText(pathname, source, mediaState = loadMediaState()) {
  let output = source;

  for (const [remoteUrl, localUrl] of mediaState.replacements) {
    output = output.split(remoteUrl).join(localUrl);
  }

  for (const [source, asset] of mediaState.optimized || []) {
    output = output.split(source).join(asset.variants.at(-1).path);
  }

  if (extname(pathname) !== '.html') return output;

  const byPath = new Map([...mediaState.optimized?.values() || []]
    .map(asset => [asset.variants.at(-1).path, asset]));
  const cardSizes = '(max-width: 767px) 86vw, (max-width: 1100px) 42vw, 32vw';
  const mainSizes = '(max-width: 767px) 90vw, (max-width: 1100px) 50vw, 700px';
  output = output.replace(/<img\b[^>]*>/gi, tag => {
    const src = tag.match(/\bsrc="\/?([^"]+)"/);
    const asset = src && byPath.get(src[1]);
    if (!asset) return tag;
    // Tiny thumbnails should not trigger full-size gallery downloads.
    const closing = tag.endsWith('/>') ? '/>' : '>';
    const rest = tag.slice(0, -closing.length);
    const srcset = asset.variants.slice(1).map(v => `/${v.path} ${v.width}w`).join(', ');
    return `${rest} srcset="${srcset}" sizes="${tag.includes('data-main-image') ? mainSizes : cardSizes}"${closing}`;
  });
  output = output.replace(/<button\b[^>]*data-product-thumb[^>]*>[\s\S]*?<\/button>/gi, button => {
    const src = button.match(/\bdata-src="\/?([^"]+)"/);
    const asset = src && byPath.get(src[1]);
    if (!asset) return button;
    const srcset = asset.variants.slice(1).map(v => `/${v.path} ${v.width}w`).join(', ');
    return button.replace('data-product-thumb', `data-product-thumb data-srcset="${srcset}" data-sizes="${mainSizes}"`)
      .replace(/<img\b[^>]*>/, `<img src="/${asset.variants[0].path}" alt="" loading="lazy" decoding="async"/>`);
  });

  output = output.replace(wixBootstrapPattern, '');
  output = output.replace(/src=["']member-nav\.js(?:\?[^"']*)?["']/g, 'src="/independent/member-nav.js"');

  if (pathname.endsWith('/login.html') || pathname === '/login.html') {
    output = output.replace(/src=["']login\.js(?:\?[^"']*)?["']/g, 'src="/independent/login-disabled.js"');
  }

  if (pathname.endsWith('/account.html') || pathname === '/account.html') {
    output = output.replace(/src=["']account\.js(?:\?[^"']*)?["']/g, 'src="/independent/account-disabled.js"');
  }

  output = output.replace(
    /<head>/i,
    '<head>\n<meta name="supportaly-runtime" content="wix-independent-step-1"/>'
  );

  return output;
}

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl, 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (pathname === '/') pathname = '/index.html';
  const normalized = normalize(pathname).replace(/^([/\\])+/, '');
  if (!normalized || normalized.split(sep).some((part) => part === '..' || part.startsWith('.'))) return null;
  const absolute = resolve(projectRoot, normalized);
  const relativePath = relative(projectRoot, absolute);
  if (!relativePath || relativePath.startsWith('..') || relativePath.includes(`${sep}..${sep}`)) return null;
  return { pathname: `/${normalized.replaceAll(sep, '/')}`, absolute };
}

function sendJson(response, statusCode, payload) {
  const body = `${JSON.stringify(payload, null, 2)}\n`;
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  response.end(body);
}

export function createIndependentServer() {
  return createServer((request, response) => {
    const mediaState = loadMediaState();
    const requestUrl = new URL(request.url || '/', 'http://localhost');

    if (requestUrl.pathname === '/__migration/status.json') {
      sendJson(response, 200, {
        mode: 'wix-independent-step-1',
        wixRuntimeLoaded: false,
        disabledFeatures: ['authentication', 'member profile', 'cart', 'checkout', 'purchase history'],
        media: {
          total: mediaState.manifest.assets?.length || 0,
          local: mediaState.replacements.size,
          unresolved: mediaState.unresolved
        }
      });
      return;
    }

    const target = resolveRequestPath(request.url || '/');
    if (!target || !existsSync(target.absolute) || !statSync(target.absolute).isFile()) {
      sendJson(response, 404, { error: 'Not found' });
      return;
    }

    const extension = extname(target.absolute).toLowerCase();
    const contentType = contentTypes.get(extension) || 'application/octet-stream';
    const shouldTransform = ['.html', '.js', '.css'].includes(extension);

    response.setHeader('Content-Type', contentType);
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    if (shouldTransform) {
      const source = readFileSync(target.absolute, 'utf8');
      const body = transformText(target.pathname, source, mediaState);
      response.setHeader('Content-Length', Buffer.byteLength(body));
      response.writeHead(200);
      response.end(body);
      return;
    }

    const metadata = statSync(target.absolute);
    response.setHeader('Content-Length', metadata.size);
    response.writeHead(200);
    createReadStream(target.absolute).pipe(response);
  });
}

function startedFromCommandLine() {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (startedFromCommandLine()) {
  const host = process.env.SUPPORTALY_HOST || '127.0.0.1';
  const port = Number(process.env.SUPPORTALY_PORT || 4173);
  const server = createIndependentServer();
  server.listen(port, host, () => {
    const state = loadMediaState();
    const fingerprint = createHash('sha256')
      .update(JSON.stringify(state.manifest))
      .digest('hex')
      .slice(0, 12);
    console.log(`Supportaly independent preview: http://${host}:${port}`);
    console.log(`Media manifest ${fingerprint}: ${state.replacements.size} local, ${state.unresolved.length} unresolved`);
    console.log('Wix authentication, cart, checkout, and member APIs are disabled.');
  });
}
