# Wix dependency isolation — Migration Step 1B

Verified 2026-11-09 on `migration/wix-independent-step-1`.

## Runtime and media

| Dependency | Treatment | Remaining dependency in built public site |
| --- | --- | --- |
| Wix headless bootstrap (`manage.wix.com`) | Existing independent HTML transformation retained | None |
| Wix APIs (`www.wixapis.com`) | Existing isolated login/account/member adapters retained | None |
| Wix CDN (`static.wixstatic.com`) | All 21 manifest URLs resolve locally: 3 existing equivalents + 18 preserved originals | None |
| Parastorage and external web fonts | Build output scan and browser request audit | None |
| Wix login, profile, cart, checkout, purchase history | Explicitly disabled, unchanged from Step 1 | Future separately authorized work |

Original Wix integration source and `_wix/pages.json` remain as migration evidence. Source HTML/JS and the media index retain provenance URLs; this does not imply deployed network dependencies. Build output excludes original Wix runtime files and the provenance-only `assets/wix-preserved/index.json`. No `static.wixstatic.com` reference remains anywhere in `dist`. Vercel CSP now permits only self/data images.

`migration/wix-media-manifest.json` names every local equivalent. `assets/wix-preserved/index.json` contains the 18 original URLs, local paths, MIME types, byte counts and SHA-256 hashes. The independent runtime checks archive hashes and sizes. The cache utility verifies cached signatures/hashes, validates newly downloaded MIME types and image signatures, enforces the 25 MiB limit while streaming, and preserves its index on repeat runs. In a proxy-managed Node 24 environment, enable inherited proxy handling for an initial download:

```sh
NODE_USE_ENV_PROXY=1 node scripts/cache-wix-media.mjs
```

TLS verification stays enabled. All downloaded images were fully decoded/verified with Pillow and visually inspected in a contact sheet; their product/editorial content matches their referenced roles. No generated or replacement artwork was introduced.

## Preserved files

All paths below are relative to `assets/wix-preserved/`. Complete hashes, byte counts and provenance are in `index.json`.

| File | Dimensions | Inspected content |
| --- | --- | --- |
| `53e940_0b6db3d9c3d344a5b19c450bb484b4ab~mv2.png` | 1254 × 1254 | Start Here inside spread |
| `53e940_1838e098ceb74253a5e7b016c8ba3a6c~mv2.jpg` | 1200 × 1800 | Creator olive-tree editorial photograph |
| `53e940_2ad77f6e8ea2470aa09eef4024b643e2~mv2.png` | 1234 × 1274 | Filled Example inside spread |
| `53e940_4c3f1b5ec3ec4fecbe3525baf1ab767f~mv2.jpg` | 2048 × 2048 | Client Workbook cover/spread |
| `53e940_4c96ea50bd1f439287deae7db053ef23~mv2.png` | 1315 × 1197 | Start Here cover/spread |
| `53e940_589bd7d64cab43febc108bff05eb877f~mv2.png` | 1254 × 1254 | Message Starters cover |
| `53e940_7bc981bf2e674f7284ec04d069f1eb70~mv2.png` | 1254 × 1254 | Filled Example held cover |
| `53e940_7d26e70c4db64b00b7e3f0e2ba845251~mv2.png` | 1254 × 1254 | Message Starters laptop preview |
| `53e940_818fc38c919340e788f83e1c6ed92e8c~mv2.png` | 1076 × 1462 | Client Workbook page layout |
| `53e940_87fb1f5642d44089ac41a4a3c9a3f791~mv2.png` | 1024 × 1536 | Architect Handover reading preview |
| `53e940_9bcce621740b498a920bf24288a84b1f~mv2.png` | 1254 × 1254 | Filled Example tablet cover |
| `53e940_a30e8505264d46c1b8fad71de26b701a~mv2.png` | 1254 × 1254 | Architect Handover inside spread |
| `53e940_b17503ba54ed4e10b8b86d178065aa73~mv2.png` | 1265 × 1244 | Bundle covers 04–06 |
| `53e940_c5e0bf46a51b4e7d970276d3f28f6122~mv2.png` | 1265 × 1244 | Bundle covers 01–03 |
| `53e940_e1e58ff5c94d49d3a328e1bc1e696be1~mv2.png` | 1254 × 1254 | Start Here held cover |
| `53e940_eae9808cda1a4fa193eb2f2ec1141714~mv2.png` | 1212 × 1298 | Decision Card tablet preview |
| `53e940_ee843c7160f74b61bfb360f540129a1d~mv2.png` | 1254 × 1254 | Architect Handover held cover |
| `53e940_fb25ef1d76ec498c96928fe032e54090~mv2.png` | 1254 × 1254 | Client Workbook held cover |

Existing local equivalents remain `assets/messages.webp`, `assets/decision-page.webp`, and `assets/decision.webp`.

## Remaining external dependencies

The built public site requires no external media, web fonts, scripts or APIs. `kaboompics.com` remains a user-activated attribution hyperlink; `mailto:` links open the user's email client. Original source evidence retains Wix URLs. Google font requests seen on the unrelated live introduction page are not dependencies of this build.

## Validation and approval

Passed: `node scripts/build-independent.mjs`, `node scripts/test-vercel-output.mjs`, `node --test scripts/test-independent.mjs`, and `python3 scripts/test-browser.py http://127.0.0.1:4174` against served `dist`. Build verification scans HTML, JS, JSON, CSS and SVG for Wix media/API/bootstrap references and external CSS/media/font loads. It requires 21 local references and zero unresolved media. All 17 routes returned 200 in both runtime and browser checks; browser checks found zero broken sourced images, external requests, request/HTTP failures, or horizontal overflow. Existing interactions passed.

Full desktop/mobile screenshots match the already deployed stable preview pixel for pixel. The user subsequently supplied the correct Wix Headless URL; desktop/mobile comparison now passes with differences confined to the Wix hosting badge and the intentionally disabled footer account label. All 21 live Wix CDN image requests succeed, with zero failed requests or broken sourced images. Migration Step 1 is recommended for approval within its static-site scope; see `VISUAL_COMPARISON.md` and `artifacts/visual-comparison/wix-reference-comparison.json` for evidence and the limits on reconstructing earlier blank screenshots. Nothing was merged or deployed by this task.
