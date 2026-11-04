# Wix dependency isolation — Migration Step 1

## Runtime dependencies

| Dependency | Original role | Step 1 treatment | Remaining work |
| --- | --- | --- | --- |
| `manage.wix.com` headless site script | Wix headless business bootstrap on all 17 HTML pages | Removed from HTML responses by the independent server | None for the public static site; confirm no hidden production-only behavior during live comparison |
| `www.wixapis.com` | OAuth tokens, member login/registration, email verification, member profile, current cart, checkout redirect | `wix-client.js` is retained but not loaded; login/account pages use explicit disabled adapters | Replace in later authentication and commerce workstreams |
| `static.wixstatic.com` | Twenty-one product, preview, and editorial images | Exact manifest created; three references use matching local assets; verified downloader added for the remaining eighteen | Download with permission, inspect, record SHA-256, and commit approved copies |
| Wix member navigation | Detects locally stored Wix member tokens and requests member details | Replaced with a local navigation adapter that makes no Wix requests | Connect to the future independent account system later |
| Wix login and registration | Browser-side Wix IAM calls | Forms remain visible but disabled with an explicit Step 1 message | Design and implement independent identity later |
| Wix account, cart, checkout, purchases | Wix member and eCommerce APIs | Account URL remains; page shows an explicit Step 1 limitation | Implement only after a separate commerce and data-migration decision |

## Retained migration references

The following original files are intentionally unchanged and retained as migration evidence:

- `wix-client.js`
- `login.js`
- `account.js`
- `member-nav.js`
- `wix.config.json`
- `_wix/pages.json`

They are not evidence that the independent runtime still depends on Wix. The response-time adapters ensure that the original Wix JavaScript and bootstrap script are not loaded.

## External services that are not Wix dependencies

- `kaboompics.com` appears only as a creator-photo attribution hyperlink. It is not loaded as a script, API, or image dependency.
- No analytics, payment processor, email provider, database, or PDF-generation service is configured in the repository.
- No environment variables or secrets are required by Migration Step 1.

## Verification

The browser test records requests to `manage.wix.com` and `www.wixapis.com` and fails if either host is contacted. The current test passed with zero Wix runtime/API requests. Requests for unresolved `static.wixstatic.com` images remain possible until the media archive is complete; they are reported by the migration status endpoint and are not treated as silently resolved.
