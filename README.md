# Connector Incident Dry-Run Skill

`connector-incident-dryrun` turns incident-response connector actions into a local dry-run plan before an agent touches Slack, GitHub, Linear, Jira, CRM, paging, email, or webhook systems.

## Quickstart

```bash
npm install
npm run smoke
./bin/connector-incident-dryrun.js plan fixtures/slack-update.md --format markdown
./bin/connector-incident-dryrun.js plan fixtures/issue-crm-pager.json --format json
./bin/connector-incident-dryrun.js plan fixtures/slack-update.md --format json --fail-on approval
```

## Markdown Brief Format

```markdown
# Checkout latency incident
Severity: sev2

- [slack] action=post; message=Post update to #incident; approval=required; rollback=delete message and post correction
- [github] action=comment; message=Comment on tracking issue; approval=required; rollback=hide comment and add correction
```

## JSON Brief Format

```json
{
  "incident": "API error budget burn",
  "severity": "sev1",
  "actions": [
    {
      "target": "crm",
      "action": "note",
      "message": "Add customer-facing incident note",
      "approval": "required",
      "rollback": "Append correction note"
    }
  ]
}
```

## Verification

Run the same checks used for release-readiness before publishing or opening a release PR:

```bash
npm run check
npm test
npm run build
npm run smoke
npm run release:check
npm pack --dry-run
```

## CLI

```bash
connector-incident-dryrun plan <brief.md|brief.json> --format markdown
connector-incident-dryrun plan <brief.md|brief.json> --format json
connector-incident-dryrun plan <brief.md|brief.json> --fail-on approval
connector-incident-dryrun plan <brief.md|brief.json> --fail-on issues
```

Exit code `2` means the selected fail gate found approval-required actions or validation issues.

## Safety Boundaries

This package never calls external APIs and never performs live connector writes. It only reads local brief files and prints plans. Approval-required actions should remain blocked until a human operator approves the exact target, message, and rollback path.

## Limitations

- Markdown parsing is intentionally simple and fixture-oriented.
- The tool classifies common targets but does not enforce organization-specific incident policy.
- It does not replace incident commander judgment or connector authorization controls.
