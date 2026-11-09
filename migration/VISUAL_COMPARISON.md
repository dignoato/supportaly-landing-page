# Migration Step 1B: visual and media verification

Verified 2026-11-09. **Media independence and homepage visual parity pass; Migration Step 1 is recommended for approval within its static-site scope.** The user supplied the correct Wix Headless reference after the initial comparison. No production deployment or merge is authorized by this recommendation.

## Correct Wix reference: final verification

Reference: https://headless-ppuxhjvtpfv-diegognoato-140b.wix-site-host.com/index.html

The fetched HTML is byte-for-byte identical to the repository's original `index.html`. Current full-page screenshots and request/image/font reports are in `artifacts/visual-comparison/wix-reference/`; quantitative comparison and screenshot/source SHA-256 hashes are in `artifacts/visual-comparison/wix-reference-comparison.json`.

Both 1440 × 900 and 390 × 844 captures returned HTTP 200 with 30 image elements, zero broken sourced images, zero HTTP failures, zero failed requests, loaded fonts and no horizontal overflow. All 21 original Wix CDN image requests succeeded at both sizes. The live Wix reference additionally loads its original Wix bootstrap, Parastorage scripts, Wix API requests and telemetry; the independent build makes none of those requests.

Full-page image dimensions match exactly: desktop 1440 × 13517; mobile 390 × 14643. Direct screenshot inspection and pixel comparison through the footer found only these expected differences:

- The Wix-hosted page injects a “Built on WIX Headless” badge over the hero photograph; the independent site has no Wix hosting badge.
- The original footer says “Account / Sign in”; the independent adapter says “Account / unavailable in preview”. On mobile this longer disabled label wraps, shifting the following links within the INFORMATION column. This is the existing intentional Step 1 login isolation, not a new content/layout change.

All pixels outside those two identified regions match at both sizes. Main section positions and heights, typography, copy, image quality/crops, responsive layout, carousel, FAQ and footer composition are preserved. The comparison reports raw differences rather than claiming unqualified pixel equality with Wix. No site design or runtime source change was needed to complete this follow-up.

The `www.supportaly.com` observations below remain historical evidence of the initially supplied wrong reference; they are no longer an acceptance blocker.

## Current evidence

Captures and JSON reports are under `artifacts/visual-comparison/{wix,wix-reference,independent,local}/`. PNGs remain local generated artifacts, as specified by `.gitignore`; JSON reports are versioned. `pixel-comparison.json` records screenshot hashes and pixel comparison results. Reproduce with:

```sh
python3 scripts/capture-visual-baseline.py https://headless-ppuxhjvtpfv-diegognoato-140b.wix-site-host.com/index.html wix-reference
# Historical domain check:
python3 scripts/capture-visual-baseline.py https://www.supportaly.com wix
python3 scripts/capture-visual-baseline.py https://supportaly-landing-page.vercel.app independent
python3 -m http.server 4174 --bind 127.0.0.1 --directory dist
# In another terminal:
python3 scripts/capture-visual-baseline.py http://127.0.0.1:4174 local
```

Exactly two capture viewports are used: 1440 × 900 and 390 × 844. The utility waits for fonts, progressively scrolls, explicitly loads hidden/offscreen lazy images, waits for load/decode with bounded image timeouts, returns to the top, and captures the full page. Unsourced lightbox placeholders are not broken images. Reports now include image readiness before scrolling, after scrolling and after eager load/decode, plus HTTP failures, failed requests, all image sources and dimensions, font-face states, section positions, document overflow, final URL, and capture errors. In this environment Chromium needed the supplied proxy CA's exact public-key pin from `NODE_EXTRA_CA_CERTS`; global certificate verification was not disabled.

| Comparison | Desktop | Mobile |
| --- | --- | --- |
| Local build vs existing stable Vercel preview | Pixel-identical; 1440 × 13517 full page | Pixel-identical; 390 × 14643 full page |
| Local image audit | 30 image elements; 0 broken sourced images | 30 image elements; 0 broken sourced images |
| Local requests | 0 external requests; 0 HTTP/request failures | 0 external requests; 0 HTTP/request failures |
| Existing Vercel preview requests | 18 Wix CDN image requests, all successful | 18 Wix CDN image requests, all successful |
| Supplied live reference | Different “Intro - Supportaly” page; height 900 | Different “Intro - Supportaly” page; height 844 |

The stable preview is the previously deployed version, not these new source changes. Its remote media sources explain the network difference despite identical screenshot pixels. The supplied unique Vercel URL redirects to Vercel SSO (HTTP 302); it was not used as an unauthenticated visual baseline.

## Section-by-section inspection against Wix and the stable preview

The Wix and stable-preview full-page pairs were inspected directly. Pixel equality against the stable preview and localized differences against Wix corroborate the section matches at both captured sizes. Expected Wix badge/account-label differences are listed above.

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

## Earlier blank areas: current evidence and historical limits

`https://www.supportaly.com/` currently serves “Intro - Supportaly”, with “Our support for you in Italy”, language buttons, a beach background and one logo image. The apex also returns the old introduction HTML. The www page requests Google Playfair Display/Lato fonts and returns 404 for `/style.less`; it makes no requests to the 21 Wix media URLs. This is not the migrated “Renovating in Italy? Start with a clearer brief.” homepage. The `wix` directory name reflects the requested capture label, not a verified Wix origin.

The 18 archived Wix CDN originals downloaded successfully with TLS verification. All 18 CDN requests also succeeded in the current stable-preview browser captures. During capture development, 16 images initially appeared unresolved in reports because lazy previews were hidden or outside the horizontal carousel; they produced no network failures. Forcing eager loading resolved all 16 without changing site source or layout. This demonstrates a timing/visibility effect for those **current preview** images only. With the correct Wix source now available, its staged report records 27 sourced images not yet decoded at DOM readiness, then 16 desktop / 19 mobile still deferred after scrolling, and zero unresolved after eager load/decode. All 21 Wix image requests succeed after loading. No genuine image-request failure is reproduced on the correct reference. The exact cause of the previous chat's blank screenshots cannot be reconstructed without their original request logs; current evidence supports lazy-loading/visibility as a reproducible mechanism rather than missing CDN originals. The previous document's unconditional attribution of blank regions to uncached media is superseded by this evidence.

## Acceptance and next step

Media independence, local regression checks and comparison against the correct Wix homepage pass. **Recommend approval of Migration Step 1 within the existing static-site scope**, with the documented Wix badge removal and disabled account-label difference. Authentication, commerce and PDF generation remain separately scoped and disabled. No production deployment, DNS change, Wix modification, authentication, checkout, payments, shop implementation or PDF generation was performed.
