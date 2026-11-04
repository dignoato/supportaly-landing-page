# Migration Step 1 visual comparison

## Capture status

Local screenshots were captured and inspected during the Migration Step 1 run:

1. `artifacts/visual-comparison/local/home-desktop-1440.png` — local desktop, generally healthy; layout, typography, section order, dark/light composition, and motion-ready state render correctly. Some Wix-hosted product media is blank because it is not yet cached.
2. `artifacts/visual-comparison/local/home-tablet-1024.png` — local tablet landscape width, generally healthy with the same external-media limitation.
3. `artifacts/visual-comparison/local/home-tablet-768.png` — local tablet portrait width, generally healthy; content reflows without visible horizontal overflow.
4. `artifacts/visual-comparison/local/home-mobile-390.png` — local mobile, generally healthy; the one-column hierarchy, navigation control, Guided Check, offer, FAQ, and footer remain legible without visible horizontal overflow.
5. Live production capture — blocked. The cloud network returned `ERR_TUNNEL_CONNECTION_FAILED` for `https://www.supportaly.com/`, so no evidence-based live-versus-local parity claim is possible in this run.

## Findings from the accepted local screenshots

- The original editorial composition, typography scale, alternating backgrounds, responsive section stacking, and core imagery remain recognizable across all four widths.
- The Guided Check is visible and retains its desktop-to-mobile layout.
- No horizontal clipping is visible; the browser test also measured no document-level horizontal overflow at the four widths.
- Product and editorial image areas that still reference Wix can appear blank or neutral. This is a media-preservation blocker, not a responsive-layout regression.
- Screenshot review cannot establish keyboard access, screen-reader behavior, color contrast ratios, or the correctness of animations. Those require separate automated and manual accessibility testing.

## Acceptance blocker

Migration Step 1 visual parity remains provisional until:

1. the 18 unresolved Wix media assets are downloaded and verified;
2. matching live screenshots are captured at 1440, 1024, 768, and 390 pixels; and
3. each live/local pair is inspected for typography, spacing, image crop, responsive breakpoints, interactions, and missing content.
