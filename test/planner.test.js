import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlan, formatPlan, parseMarkdownBrief } from '../src/index.js';

test('parses markdown connector actions', () => {
  const plan = createPlan('fixtures/slack-update.md');
  assert.equal(plan.incident, 'Checkout latency incident');
  assert.equal(plan.actions.length, 2);
  assert.equal(plan.summary.approvalRequired, 2);
  assert.equal(plan.actions[0].sideEffect, 'external-message');
});

test('parses json connector actions', () => {
  const plan = createPlan('fixtures/issue-crm-pager.json');
  assert.equal(plan.severity, 'sev1');
  assert.equal(plan.actions.length, 3);
  assert.equal(plan.summary.approvalRequired, 1);
});

test('reports missing rollback as issue', () => {
  const plan = parseMarkdownBrief('# Test\nSeverity: sev3\n\n- [jira] action=comment; message=hello; approval=required');
  assert.equal(plan.actions[0].issues.includes('missing rollback'), true);
});

test('formats markdown and json reports', () => {
  const plan = createPlan('fixtures/slack-update.md');
  assert.match(formatPlan(plan, 'markdown'), /Connector Incident Dry-Run Plan/);
  assert.match(formatPlan(plan, 'json'), /"approvalRequired": 2/);
});
