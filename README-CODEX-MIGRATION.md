# Supportaly Clarity Kit — Codex Migration Handoff

This bundle contains the **84 original files from the user-provided Wix Headless ZIP**, preserved byte-for-byte, plus audit and handoff documentation under `docs/`.

## What you have
- 17 standalone HTML pages (home, Italian professionals, seven product pages, login, account, six legal/information pages).
- 16 CSS files, 11 JavaScript files, 38 local WebP image assets, and two Wix metadata JSON files.
- All layout, website copy, local media and static client-side behavior available in this snapshot.

## What you do NOT have yet
- A verified Wix-independent authentication, checkout, purchase history or secure digital-download system.
- The actual PDF products or a working server-side PDF generator in this archive.
- A confirmed implementation of the newer "Generate My Preparation Snapshot" feature: the archived homepage still says "Copy my next steps".
- All original media: certain product previews are linked to Wix-hosted image URLs, not embedded.

## How to start with Codex
1. Unzip this bundle into a **new private GitHub repository**. Keep all original files at repository root.
2. Open that repository in Codex.
3. Paste `docs/CODEX_FIRST_TASK.md` as the first task. It explicitly prohibits edits and deployments during the audit.
4. First develop a visual baseline on a temporary domain. Avoid changing `supportaly.com`, Wix data, account settings or live URLs.
5. Replace Wix integrations only after the migration plan has been approved and tested.

## Important
This handoff does **not** migrate the site and does **not** connect a payment provider. The Wix live site was not modified.

For the audit, consult `docs/MIGRATION_AUDIT.md`, the SHA256 inventory and the remote asset inventory.
