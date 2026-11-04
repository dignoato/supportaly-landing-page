# supportaly-landing-page

Migration Step 1 adds a framework-free, Wix-independent local runtime while preserving the original website source and URLs.

```bash
node scripts/serve-independent.mjs
```

See [MIGRATION_STEP_1.md](MIGRATION_STEP_1.md) for scope, tests, media preservation, and current limitations.

For an isolated Vercel Preview Deployment, follow [VERCEL_PREVIEW.md](VERCEL_PREVIEW.md). Vercel must build and publish `dist`, never the repository root.
