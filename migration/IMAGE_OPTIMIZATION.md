# Clarity Kit image optimization

Prepared and validated on 2026-11-09. The user subsequently requested a Vercel deployment; push this draft to the migration branch to use the existing Vercel preview integration. No merge or production promotion is part of this deployment.

The 21 media sources previously served 46,212,754 bytes (mostly 2–3 MB archived PNGs). Their full-size WebP derivatives now total 2,214,102 bytes: a 95.2% reduction. The 640px versions total 775,354 bytes. These are asset byte comparisons, not measured loading-time promises.

`scripts/optimize-kit-media.py` generates 160px thumbnail, 640px and up-to-1200px WebP variants, without upscaling. Original aspect ratios and source files remain intact. `assets/kit-optimized/index.json` records source/variant dimensions, byte counts and SHA-256 hashes. Rebuild derivatives with Pillow using:

```sh
python3 scripts/optimize-kit-media.py
node scripts/build-independent.mjs
node scripts/test-vercel-output.mjs
```

The existing runtime now substitutes optimized local paths and adds responsive `srcset`/`sizes`. Product thumbnails use 160px files. Product gallery navigation updates or clears `srcset` when switching slides, including existing small previews that do not need recompression. The production build excludes archived originals and the optimization provenance index; archives remain in the repository. Existing HTML, typography, photo crops, carousel layout, lazy loading and interactions are retained.

Validation: independent build/output/runtime checks pass. Browser checks cover all 17 routes, all 04/05 gallery thumbnails at desktop/mobile, Guided Check, dialogs, FAQ, responsive menu and login isolation. There are no broken sourced images, external requests or horizontal overflow. Both homepage captures have exactly the same section positions/heights as the pre-optimization baseline. Compressed images were decoded and visually inspected. Evidence is in `artifacts/visual-comparison/optimized/`. Earlier pixel-exact Wix reports describe the original media before this requested lossy compression; geometry remains unchanged.

## Six final replacements received and applied

The user supplied `04-05.zip`, containing six explicitly named PNGs. These filenames supersede the ambiguous earlier inline ordering and are used consistently on homepage cards and product-detail galleries:

| File | Placement | Image |
| --- | --- | --- |
| `04-1.png` | Decision Card cover / first slide | Booklet held over orange background |
| `04-2.png` | Decision Card second slide | Open spread beside cover |
| `04-3.png` | Decision Card third slide | Held tablet |
| `05-1.png` | Message Starters cover / first slide | Seated person holding booklet |
| `05-2.png` | Message Starters second slide | Laptop preview |
| `05-3.png` | Message Starters third slide | Cover on grey |

Product-detail galleries now expose all three supplied images. Related-product cards use the new covers, and the Guided Check's Decision Card result uses the new open-spread preview. Full uploaded PNGs are preserved unchanged under `assets/product-originals/` and excluded from `dist`. The optimizer discovers these originals alongside the 21 migration sources and records their hashes and WebP variants in its index.

The six uploaded originals total 11,742,615 bytes; their full-size WebP versions total 513,564 bytes (95.6% smaller), and their 640px versions total 172,480 bytes. All six retain their original aspect ratios. The combined optimization index now contains 27 sources; the original 21-reference Wix migration manifest remains resolved locally.

Verification includes all three slides in each homepage card and each product-detail gallery at 390px and 1440px, plus the existing 17-route interaction/image/network checks. Captures and the slide-source report are under `artifacts/visual-comparison/replacements/`. This deliberately changes product artwork from the historical Wix parity screenshots; layout, typography, copy and interaction structure remain unchanged.

Push on `migration/wix-independent-step-1` triggers the authorized Vercel preview integration. No merge or production promotion is included.
