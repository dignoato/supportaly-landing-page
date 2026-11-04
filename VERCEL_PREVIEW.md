# Vercel preview setup

The repository is prepared for a Vercel Preview Deployment. Vercel must run the committed build command and publish `dist`; it must not publish the repository root.

## Build contract

`vercel.json` defines:

- Framework preset: Other / static
- Build command: `node scripts/build-independent.mjs && node scripts/test-vercel-output.mjs`
- Output directory: `dist`
- Clean URLs: disabled, preserving the existing `.html` routes
- Search indexing: disabled for the preview
- Browser API connections: restricted to the preview origin

The build fails if the output contains the Wix bootstrap, `www.wixapis.com`, or the original Wix authentication/account clients.

## Safest GitHub connection flow

1. Push `migration/wix-independent-step-1` and open its pull request.
2. In Vercel, choose **Add New → Project → Import Git Repository** and select `dignoato/supportaly-landing-page`.
3. Before clicking Deploy, set:
   - Framework Preset: **Other**
   - Root Directory: repository root
   - Build Command: `node scripts/build-independent.mjs && node scripts/test-vercel-output.mjs`
   - Output Directory: `dist`
   - Install Command: leave empty/default
4. Do not add environment variables; Migration Step 1 needs none.
5. If the first import attempts the default branch before this pull request is merged, the configured build command will fail safely because `main` does not yet contain the migration scripts. It must not be replaced with a root-directory static deployment.
6. Once the project exists, open the migration pull request or redeploy its branch commit. Vercel will create a **Preview** deployment with a `*.vercel.app` URL.
7. Confirm the deployment details show `migration/wix-independent-step-1`, Preview environment, the expected commit, and `dist` as the output.
8. Check `/__migration/status.json` on the preview. It must report `wixRuntimeLoaded: false` and list the four excluded Wix runtime files.

Do not use **Promote to Production**, do not run `vercel --prod`, and do not attach `supportaly.com` or change DNS during Migration Step 1.

## Alternative: Vercel CLI preview

From the migration branch, an authenticated owner can create a preview without touching production:

```bash
npx vercel
```

Accept the detected `vercel.json` settings. Do not pass `--prod`. The command returns a temporary Preview URL. The Vercel CLI and authenticated Vercel account are not available in the current Codex environment, so this step was not executed here.

## Preview acceptance checks

- `/`, all legal pages, login/account placeholders, the professional page, and all seven product pages return 200.
- Guided Check, clipboard fallback, menus, FAQ, dialogs, carousel, filters, and product galleries work.
- Login and account controls remain disabled.
- Browser network activity contains no `manage.wix.com` or `www.wixapis.com` requests.
- The deployment is marked Preview and carries `X-Robots-Tag: noindex, nofollow, noarchive`.
- Eighteen media references still use `static.wixstatic.com` until the approved archive is complete; this known Step 1 limitation is visible in `/__migration/status.json`.
