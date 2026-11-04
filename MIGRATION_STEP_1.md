# Supportaly Migration Step 1 — Wix-independent website

This branch provides a local, framework-free runtime for the existing Supportaly HTML, CSS, JavaScript, text, assets, interactions, and URLs. The original Wix-oriented source files remain intact. The independent server applies a small response-time compatibility layer so the migration can be reviewed without rewriting the website.

## Start locally

Requirements: Node.js 20 or newer. No dependency installation is required.

```bash
git switch migration/wix-independent-step-1
node scripts/serve-independent.mjs
```

Open `http://127.0.0.1:4173/`.

The original `.html` URLs remain available, including `/professionals.html`, `/login.html`, `/account.html`, and all seven product pages.

Runtime status is available at `http://127.0.0.1:4173/__migration/status.json`. It reports disabled Wix features and any Wix-hosted media that has not yet been preserved locally.

## What the independent runtime isolates

The server:

- serves the existing repository directly, with no build framework;
- removes the Wix headless bootstrap script from HTML responses;
- replaces the Wix-aware member navigation with a local adapter;
- prevents login, registration, account, cart, checkout, and purchase-history calls to Wix;
- keeps those page URLs and shows an explicit Step 1 limitation instead of silently removing them;
- substitutes locally preserved Wix media when a verified local copy exists;
- preserves the Guided Check, navigation, menus, carousels, filters, product galleries, dialogs, FAQ behavior, motion, and clipboard interaction.

The original `wix-client.js`, `login.js`, `account.js`, and `member-nav.js` files are retained for migration reference but are not loaded by the independent runtime.

See `migration/WIX_DEPENDENCIES.md` for the complete dependency inventory and isolation status.

## Media preservation

The authoritative inventory is `migration/wix-media-manifest.json`. Three remote references have verified equivalents already present in `assets/`. The remaining references can be preserved on a network that permits access to `static.wixstatic.com`:

```bash
node scripts/cache-wix-media.mjs
```

The downloader keeps TLS verification enabled, accepts image content only, limits each file to 25 MiB, records a SHA-256 digest, and writes `assets/wix-preserved/index.json`. Confirm that Supportaly has the right to retain and redistribute each asset before committing downloaded files.

## Tests

```bash
node --test scripts/test-independent.mjs
for source_file in *.js independent/*.js scripts/*.mjs; do node --check "$source_file"; done
python3 scripts/test-browser.py
```

The integration test starts the independent server on an ephemeral local port, requests every route from `_wix/pages.json`, checks representative assets, verifies the status endpoint, and confirms that the Wix bootstrap script is absent.

The browser test exercises the Guided Check, release-status dialog, FAQ, responsive menu, a product gallery, disabled login state, horizontal overflow, and absence of Wix runtime/API requests.

## Visual comparison

With the local server running, capture the four required viewports:

```bash
python3 scripts/capture-visual-baseline.py http://127.0.0.1:4173 local
python3 scripts/capture-visual-baseline.py https://www.supportaly.com live
```

The output is written to `artifacts/visual-comparison/{local,live}/`. Compare matching filenames only after confirming that both captures are fully loaded and contain the expected homepage. The capture utility does not change either site.

See `migration/VISUAL_COMPARISON.md` for the current evidence and blockers.

## Vercel preview

Run the same artifact Vercel will publish:

```bash
node scripts/build-independent.mjs
node scripts/test-vercel-output.mjs
python3 -m http.server 4174 --bind 127.0.0.1 --directory dist
python3 scripts/test-browser.py http://127.0.0.1:4174
```

Vercel configuration and the safe GitHub connection flow are documented in `VERCEL_PREVIEW.md`. Vercel must publish `dist`; publishing the repository root would bypass the isolation layer and is prohibited.

## Step 1 limitations

- Authentication, registration, member profiles, cart, checkout, purchase history, and Wix-backed business data are intentionally disabled.
- No replacement shop, account system, or PDF generator is included.
- The sellable PDF files are not present in this repository.
- Some visual media remains on Wix until it can be downloaded and verified. The status endpoint lists every unresolved URL.
- The live production website and Wix dashboard are not modified by this runtime.
- Visual parity must be checked against the live website at desktop, tablet, and mobile sizes before Step 1 is accepted.

## Next migration step

After visual parity and the media archive are complete, create a static deployment artifact from this independent runtime and validate redirects, metadata, canonical URLs, accessibility, performance, and rollback behavior on a temporary non-production hostname. Shop, authentication, customer data, and PDF generation should remain separate later workstreams.
