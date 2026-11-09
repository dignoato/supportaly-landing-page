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

## Pending requested replacements

The six new images are visible inline in chat but their original files are not exposed to the workspace/download tools. Replacing the artwork is pending receipt of the six files (or a ZIP), rather than recreating or approximating them.

The user explicitly confirmed **exact attachment order**, even though two depicted product numbers cross groups:

1. 04-1: Decision Card on a held tablet.
2. 04-2: Decision Card open spread beside its cover.
3. 04-3: Message Starters on a laptop.
4. 05-1: Decision Card held over an orange background.
5. 05-2: Message Starters held by a seated person.
6. 05-3: Message Starters cover on grey.

Apply this order consistently to homepage card previews and the corresponding product-detail galleries once the files are available; preserve the full originals and generate optimized web derivatives. No replacement has yet been claimed or applied.
