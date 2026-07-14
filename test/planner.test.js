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

test('requires evidence for external connector side effects', () => {
  const plan = parseMarkdownBrief('# Test\nSeverity: sev3\n\n- [slack] action=post; message=hello; approval=required; rollback=delete message');
  assert.equal(plan.actions[0].issues.includes('missing evidence'), true);
});

test('formats markdown and json reports', () => {
  const plan = createPlan('fixtures/slack-update.md');
  assert.match(formatPlan(plan, 'markdown'), /Connector Incident Dry-Run Plan/);
  assert.match(formatPlan(plan, 'json'), /"approvalRequired": 2/);
});

test('classifies unknown connector targets as external writes', () => {
  const plan = parseMarkdownBrief('# Test\nSeverity: sev2\n\n- [webhook] action=post; message=notify system; approval=required; rollback=send correction; evidence=webhook dry-run payload');
  assert.equal(plan.actions[0].sideEffect, 'external-write');
  assert.equal(plan.actions[0].approval, 'required');
});
