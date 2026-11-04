# Supportaly — Migration assessment (from the uploaded Wix archive)

## 1. Verified source contents

| Component | Finding | Evidence |
|---|---|---|
| Home landing page | Present | `index.html` |
| Italian professional page | Present | `professionals.html` |
| Product detail pages | Six individual PDFs plus bundle (seven pages) | `product-*.html` |
| Legal and credits pages | Six pages | `impressum.html`, `credits.html`, `privacy-policy.html`, `terms-and-conditions.html`, `refund-policy.html`, `cookies-policy.html` |
| Login and account shell | Present, uses Wix Headless API | `login.html`, `account.html`, `wix-client.js`, `login.js`, `account.js` |
| Visual layout and interactions | HTML/CSS/JS source present | 16 CSS and 11 JS files |
| Local images | 38 WebP files | `assets/` |
| Remote Wix-hosted images | 21 distinct URLs referenced across HTML | `docs/EXTERNAL_ASSETS.csv` |
| Wix site-wide external script | Included on 17 HTML pages | `manage.wix.com/.../site-script.js` |
| Product PDF source files | Not present | No `.pdf` files in archive |
| Guided check | Five questions with yes/partly/no choices | `supportaly-guided-check.js` |
| New personalized PDF feature | **Not found** | No PDF generator or `Generate My Preparation Snapshot` in snapshot; homepage contains `Copy my next steps` |
| Shop readiness | **Not yet production-ready** | Product buttons show `Coming soon`; Wix checkout client code exists but shop purchases not fully wired |
| Purchase history | **Incomplete** | `account.js` explicitly says full order history requires a secure server-side view |

## 2. Checks performed

- All **11 JS files** passed `node --check` using Node.js v22.
- Guided-check `buildSnapshot()` produced internally valid output for **all 243** answer combinations (3 choices across 5 questions).
- No missing local HTML `src` or `href` file targets were found (relative files).
- One broken in-page anchor was detected: `account.html` skip link refers to `#main`, which was not found.
- **Browser screenshot / pixel-level visual comparison not completed**: this sandbox's browser access to local file/HTTP targets was blocked by the environment. The layout-fidelity claim must be tested externally after deployment to a temporary preview URL.

## 3. What migrates directly

- The exact HTML markup and visible copy **as included in this snapshot**.
- CSS cascade, responsive breakpoints, animations and static interaction scripts.
- All local images, navigation to local pages and current on-page copy of the starting-point exercise.

A static hosting preview should preserve the original DOM and styles without introducing a framework. This does not guarantee pixel-identical rendering across browsers, screens, fonts and unavailable external assets.

## 4. Dependencies that must be migrated or replaced

1. **Remote Wix images**: 21 distinct remote URLs (frequently reused). Identify and lawfully acquire originals; self-host under `assets/` and update references.
2. **Wix authentication**: `wix-client.js` uses Wix OAuth2 and members APIs. Replace with a securely configured independent identity provider, with server-side session checks and access policies.
3. **Wix basket/checkout**: existing `wix-client.js` uses Wix eCommerce. Choose the new billing provider and integrate server-side webhooks; never unlock a paid product on a client-side success page alone.
4. **Order history and entitlement checks**: implement trustworthy, server-side user-to-order relationships and secure document permissions.
5. **Product delivery**: original product PDFs are absent. Gather source deliverables and use private, signed downloads rather than public file URLs for paid goods.
6. **Wix site script and metadata**: replace or remove only when the relevant independent behavior is verified.
7. **Legal pages / data privacy**: re-review provider names, personal data flows, cookie details and tax/consumer statements before the new launch.
8. **SEO**: audit URLs, meta tags, redirects, canonical URLs, sitemap and language attributes before cutover.

## 5. Version mismatch — critical

This snapshot still implements `Copy my next steps` on the homepage, **not** the subsequently requested `Generate My Preparation Snapshot` flow with preview and contact-data gate. Do not claim the newer feature has been migrated. First compare with the latest Work session or new source export; reconcile a version-by-version change log.

## 6. Recommended stages

**Stage 0 — Preserve baseline:** version this exact source in a private GitHub repository; original files are untouched. Keep the Wix site online.

**Stage 1 — Visual portability:** host the same static files on a temporary domain; compare desktop/tablet/mobile with current live reference. Audit external images and legal pages.

**Stage 2 — Feature parity:** validate all question outcomes, nav, product previews, image zoom, menus, cookie UI, account workflows; add missing planned snapshot functionality only after baseline matches.

**Stage 3 — Independent back end:** decide identity, database, payment, file storage, transaction emails; implement durable purchase entitlements and production-grade security tests.

**Stage 4 — Controlled cutover:** test payments in sandbox, migration of existing customer data (if any) with proper authorization, 301 redirects, DNS change and rollback plan. Keep Wix available until production readiness is verified.

## 7. Architecture decision

For this source, **do not rewrite to Next.js first**. Begin by demonstrating that the existing static site runs unchanged on a different host, then evaluate whether a framework rewrite is justified by backend and user-area complexity. Codex can work with this source directly.

## 8. Boundaries of this review

This is a **source-code audit**. External payment, live Wix account functionality, browser rendering, account data, and actual contents of remote assets were not independently verified. No Wix production configuration was changed.
