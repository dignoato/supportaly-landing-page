# FIRST TASK FOR CODEX — READ-ONLY AUDIT

You are the technical migration lead for Supportaly Clarity Kit.

## Context
The repository contains an **unaltered export of a Wix Headless/Editorless static website**. It includes 17 HTML files, 16 CSS files, 11 JavaScript files, 38 local WebP images, Wix-dependent authentication and checkout code, and original website content. See `docs/MIGRATION_AUDIT.md` for initial source inspection.

## Goal
Move development and hosting away from Wix without losing existing design, typography, spacing, animations, content, SEO routes, product previews or user-facing behavior. Work incrementally; do not blindly rewrite the source to React/Next.js.

## Current critical mismatch
The exported version still uses "Copy my next steps". The newer requested "Generate My Preparation Snapshot" PDF workflow with preview and contact details is NOT in this archive. Report the mismatch and request/recover the latest version before claiming feature completeness.

## Phase 1 — audit only
1. Read and inventory every page, CSS layer, JS module, remote resource, internal navigation and data dependency.
2. Determine whether this **exact static site** can be previewed on an independent host without source changes; identify possible blocked Wix behavior.
3. Map pages and interactive features, including the 5-question check, carousel, lightbox, mobile navigation, authentication, cart and account.
4. Define a visual fidelity test matrix for 1440px, 1024px, 768px and 390px viewports, with screenshots, comparisons, typography checks and interaction tests.
5. Identify all Wix API calls and propose precise replacements, with authorization and secure delivery requirements.
6. Assess whether plain HTML/CSS/JS plus backend services is sufficient for the MVP; suggest Next.js only where justified.
7. Document migration requirements for metadata, URL preservation/redirects, SEO, privacy, copyright licenses and current customer records.
8. Identify missing source materials, especially actual PDF products, remote image originals and November feature changes.

## Output
Provide: (a) confirmed inventory, (b) blockers ranked high/medium/low, (c) recommended target architecture, (d) phased tasks with acceptance criteria, (e) exact files involved, (f) a list of unknowns. Clearly separate code-evidenced facts and assumptions.

## Non-negotiable restrictions
- NO edits, file deletion, mass refactoring or framework conversion.
- NO git push, deployment, domain changes, customer-data access or purchase tests against production.
- NO changes to Wix dashboards, DNS, payments, registration or user accounts.
- NEVER hardcode secrets or expose paid PDFs publicly.
- Keep the initial baseline byte-for-byte unchanged until approved.
- Only propose first implementation step after the audit is accepted.
