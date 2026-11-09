# Migration Step 1B: visual and media verification

Verified 2026-11-09. Media independence is complete. **Do not approve Migration Step 1 visual parity yet:** the supplied live reference currently serves a different website. No redesign was attempted to match that unrelated page.

## Current evidence

Captures and JSON reports are under `artifacts/visual-comparison/{wix,independent,local}/`. PNGs remain local generated artifacts, as specified by `.gitignore`; JSON reports are versioned. `pixel-comparison.json` records screenshot hashes and pixel comparison results. Reproduce with:

```sh
python3 scripts/capture-visual-baseline.py https://www.supportaly.com wix
python3 scripts/capture-visual-baseline.py https://supportaly-landing-page.vercel.app independent
python3 -m http.server 4174 --bind 127.0.0.1 --directory dist
# In another terminal:
python3 scripts/capture-visual-baseline.py http://127.0.0.1:4174 local
```

Exactly two capture viewports are used: 1440 × 900 and 390 × 844. The utility waits for fonts, progressively scrolls, explicitly loads hidden/offscreen lazy images, waits for load/decode with bounded image timeouts, returns to the top, and captures the full page. Unsourced lightbox placeholders are not broken images. Reports include HTTP failures, failed requests, all image sources and dimensions, font-face states, section positions, document overflow, final URL, and capture errors. In this environment Chromium needed the supplied proxy CA's exact public-key pin from `NODE_EXTRA_CA_CERTS`; global certificate verification was not disabled.

| Comparison | Desktop | Mobile |
| --- | --- | --- |
| Local build vs existing stable Vercel preview | Pixel-identical; 1440 × 13517 full page | Pixel-identical; 390 × 14643 full page |
| Local image audit | 30 image elements; 0 broken sourced images | 30 image elements; 0 broken sourced images |
| Local requests | 0 external requests; 0 HTTP/request failures | 0 external requests; 0 HTTP/request failures |
| Existing Vercel preview requests | 18 Wix CDN image requests, all successful | 18 Wix CDN image requests, all successful |
| Supplied live reference | Different “Intro - Supportaly” page; height 900 | Different “Intro - Supportaly” page; height 844 |

The stable preview is the previously deployed version, not these new source changes. Its remote media sources explain the network difference despite identical screenshot pixels. The supplied unique Vercel URL redirects to Vercel SSO (HTTP 302); it was not used as an unauthenticated visual baseline.

## Section-by-section inspection against the stable preview

Both full-page pairs were inspected directly. Pixel equality additionally verifies that no rendered section differs at either captured size.

| Area | Verified match |
| --- | --- |
| Header and hero | Wordmark, navigation, headline wrapping, body typography, CTA, desktop two-photo treatment and mobile crop |
| Kit in practice | Grey section, workbook/handover page previews, column layout and mobile stacking |
| Shared understanding | Heading, doorway photograph, black example panel, three explanatory text blocks |
| Starting-point check | Interior/terrace images, heading, question panel, answer and navigation controls |
| Prepare / Clarify / Review | Numbered rows, dividers, spacing, responsive hierarchy |
| Six-document kit | Covers, carousel framing, preview crops, prices, copy and coming-soon controls |
| Benefits | Heading, linked rows, preparation/professional boundaries and responsive columns |
| Creator | Olive-tree image, attribution, biography, typography and crop |
| Offer | Black background, heading, document list and release-status button |
| FAQ | Heading, seven questions, separators and mobile stacking |
| Final CTA and footer | Background image crop, text, button, footer links, legal groups and bottom line |

Browser checks independently passed Guided Check completion/copy, dialogs, FAQ, responsive menu at 1024/768/390, product gallery, and disabled login. Screenshot equality does not establish identical animation timelines or complete accessibility compliance; existing animation and layout sources were preserved unchanged.

## Earlier blank areas: what current evidence supports

`https://www.supportaly.com/` currently serves “Intro - Supportaly”, with “Our support for you in Italy”, language buttons, a beach background and one logo image. The apex also returns the old introduction HTML. The www page requests Google Playfair Display/Lato fonts and returns 404 for `/style.less`; it makes no requests to the 21 Wix media URLs. This is not the migrated “Renovating in Italy? Start with a clearer brief.” homepage. The `wix` directory name reflects the requested capture label, not a verified Wix origin.

The 18 archived Wix CDN originals downloaded successfully with TLS verification. All 18 CDN requests also succeeded in the current stable-preview browser captures. During capture development, 16 images initially appeared unresolved in reports because lazy previews were hidden or outside the horizontal carousel; they produced no network failures. Forcing eager loading resolved all 16 without changing site source or layout. This demonstrates a timing/visibility effect for those **current preview** images only. It cannot establish the cause of the previous chat's blank **Wix** screenshots, whose matching source is not currently available. The previous document's unconditional attribution of blank regions to uncached media is superseded by this evidence.

## Acceptance and next step

Media independence and local regression checks pass. Final Wix visual parity remains unverified until the correct public Wix homepage (or authoritative matching screenshots) is available, then the same two viewport captures can be compared. Migration Step 1 should therefore remain **pending visual approval**. No production deployment, DNS change, Wix modification, authentication, checkout, payments, shop implementation or PDF generation was performed.
