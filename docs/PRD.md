# Connector Incident Dry-Run Skill PRD

Status: in-progress

## Summary

A local agent skill that converts incident-response connector actions into dry-run plans with explicit approvals, fixture evidence, and rollback notes before any ticket, chat, CRM, or paging system is touched.

## Source Attribution

Created during the 2026-07-08 agent-skills factory lane to replenish an empty ready queue. It is based on recurring OpenClaw workflow needs around connector routing, dry-run action plans, and incident follow-up safety.

## Target Users

- Agent operators preparing incident updates across Slack, GitHub, Linear, Jira, or CRM tools.
- Maintainers who need reviewable action plans before live connector writes.
- Teams building fixture-backed connector adapters.

## Problem

Incident work often spans multiple external systems. Agents need a deterministic way to stage proposed connector actions, identify approvals, and capture rollback or undo expectations without performing live writes.

## Goals

- Parse a Markdown or JSON incident brief into proposed connector actions.
- Classify actions by side effect, approval requirement, target system, and rollback option.
- Emit human Markdown and stable JSON dry-run reports.
- Include fixtures for Slack update, issue comment, CRM note, and pager handoff scenarios.
- Ship reusable `SKILL.md` instructions for agents.

## Non-Goals

- Performing live connector writes.
- Calling external APIs.
- Replacing incident command judgment.

## V1 CLI

```bash
connector-incident-dryrun plan fixtures/incident.md --format markdown
connector-incident-dryrun plan fixtures/incident.json --format json --fail-on approval
```

## Acceptance Criteria

- `npm test`, `npm run check`, `npm run build`, and `npm run smoke` pass.
- CLI fixture smoke produces Markdown and JSON reports.
- README documents quickstart, side-effect boundaries, approval gates, limitations, and examples.
- Public repo `rogerchappel/connector-incident-dryrun-skill` exists with a release-candidate PR.
