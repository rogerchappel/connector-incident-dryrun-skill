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

Action bullets may be indented, and connector target names are case-insensitive.
When `approval` is omitted, `notes` defaults to `optional` and other targets
default to `required`; an explicit approval value is retained.

## JSON Brief Format

A JSON brief must have an object at its root. `actions` may be omitted (an empty
list is assumed), but when present it must be an array of action objects. When
present, `incident`, `title`, and `severity` must be strings. Each action's `id`,
`target`, `action`, `message`, `approval`, `rollback`, and `evidence` fields must
also be strings. These fields may be omitted so the documented defaults still
apply; explicit arrays, objects, numbers, booleans, and `null` are rejected.

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
connector-incident-dryrun plan <brief.md|brief.json> [--format markdown|json] [--fail-on approval|issues]
```

`--format` defaults to `markdown`; `json` emits the structured plan. `--fail-on
approval` exits with status `2` when the plan contains approval-required actions,
while `--fail-on issues` exits with status `2` when any action has validation
issues.

Unknown options, missing option values, and values outside the choices above are
usage errors. They write a diagnostic to stderr and exit with status `1` without
printing a plan. `--help` prints the usage and exits with status `0`.

Unreadable briefs, invalid JSON, non-object JSON roots, non-array `actions`
values, non-object action members, and non-string scalar or action fields are
input errors. They also write one diagnostic to stderr, print no plan, and exit
with status `1`. Markdown output
escapes pipe characters and renders line breaks as spaces inside table cells.

External connector actions must include evidence notes, such as a dry-run payload, tracking issue URL, or receipt path. Local notes do not require evidence.

## Safety Boundaries

This package never calls external APIs and never performs live connector writes. It only reads local brief files and prints plans. Approval-required actions should remain blocked until a human operator approves the exact target, message, and rollback path.

## Limitations

- Markdown parsing is intentionally simple and fixture-oriented.
- The tool classifies common targets but does not enforce organization-specific incident policy.
- It does not replace incident commander judgment or connector authorization controls.
