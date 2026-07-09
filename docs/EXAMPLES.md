# Examples

## Human Review Plan

```bash
connector-incident-dryrun plan fixtures/slack-update.md --format markdown
```

## Automation Gate

```bash
connector-incident-dryrun plan fixtures/slack-update.md --format json --fail-on approval
```

## Issue Gate

```bash
connector-incident-dryrun plan fixtures/missing-rollback.md --fail-on issues
```
