# Orchestration

`connector-incident-dryrun` should run before an agent performs external incident-response writes. It turns an incident brief into a reviewable plan and highlights approvals before Slack, GitHub, Linear, Jira, CRM, or paging connectors are touched.

Recommended workflow:

1. Draft an incident brief in Markdown or JSON.
2. Run `connector-incident-dryrun plan <brief> --format markdown`.
3. Review approval-required actions and rollback notes with a human operator.
4. Run `connector-incident-dryrun plan <brief> --format json --fail-on approval` in CI or rehearsals when approval-required actions should block automation.
5. Only execute live connector writes after explicit approval through the relevant system.

The tool never calls external APIs and never performs live connector actions.
