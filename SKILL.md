# Connector Incident Dry-Run Skill

Use this skill when an agent is preparing incident-response actions that may write to chat, issue trackers, CRM records, paging systems, or other connectors.

## Inputs

- A Markdown or JSON incident brief.
- Proposed connector actions, targets, messages, and rollback expectations.
- The operator's approval policy for the incident.

## Side-Effect Boundaries

This skill only reads local brief files and prints dry-run reports. It does not call Slack, GitHub, Linear, Jira, CRM, pager, email, or webhook APIs. It does not open tickets, post comments, send messages, acknowledge pages, or change incident state.

## Approval Requirements

Treat any action classified as `approval: required` as blocked until a human operator approves the exact target, message, and rollback note. Low-risk local notes can be reviewed after the plan is generated, but live writes still require the connector's normal approval path.

## Workflow

1. Save the incident brief locally.
2. Run `connector-incident-dryrun plan <brief> --format markdown`.
3. Review the approval table and rollback notes.
4. Run `connector-incident-dryrun plan <brief> --format json --fail-on approval` when automation must stop on approval-required actions.
5. Paste the dry-run report into the handoff before any live connector call.

## Validation

A valid action has `target`, `action`, `message`, `approval`, and `rollback`. Missing approval or rollback fields are treated as review issues. External action execution is intentionally out of scope.
