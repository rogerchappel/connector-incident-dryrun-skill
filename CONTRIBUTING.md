# Contributing

Keep this package local-first and connector-safe. New behavior should include fixture-backed tests, docs updates for any user-facing CLI changes, and smoke coverage that does not require network access.

Before opening a PR, run:

```bash
npm test
npm run check
npm run build
npm run smoke
```
