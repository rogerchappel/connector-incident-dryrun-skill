import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlan, formatPlan, parseJsonBrief, parseMarkdownBrief } from '../src/index.js';

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

test('rejects non-object JSON brief roots', () => {
  for (const body of ['null', '[]', '"incident"', '42', 'true']) {
    assert.throws(() => parseJsonBrief(body), {
      message: 'Invalid JSON brief: root must be an object'
    });
  }
});

test('rejects non-array JSON actions', () => {
  for (const actions of [{}, 'post update', 1, false, null]) {
    assert.throws(() => parseJsonBrief(JSON.stringify({ incident: 'Test', actions })), {
      message: 'Invalid JSON brief: "actions" must be an array'
    });
  }
});

test('rejects non-object JSON action members', () => {
  for (const action of [null, 'post update', 1, false, []]) {
    assert.throws(() => parseJsonBrief(JSON.stringify({ incident: 'Test', actions: [action] })), {
      message: 'Invalid JSON brief: "actions[0]" must be an object'
    });
  }
});

test('allows a JSON brief to omit actions', () => {
  const brief = parseJsonBrief('{"incident":"Observation only"}');
  assert.deepEqual(brief.actions, []);
});

test('reports missing rollback as issue', () => {
  const plan = parseMarkdownBrief('# Test\nSeverity: sev3\n\n- [jira] action=comment; message=hello; approval=required');
  assert.equal(plan.actions[0].issues.includes('missing rollback'), true);
});

test('parses indented markdown action bullets without dropping fields', () => {
  const plan = parseMarkdownBrief('# Test\nSeverity: sev3\n\n  - [slack] action=comment; message=hello; approval=preapproved; rollback=delete comment; evidence=dry-run receipt');
  assert.deepEqual(plan.actions[0], {
    id: 'action-1',
    target: 'slack',
    action: 'comment',
    message: 'hello',
    approval: 'preapproved',
    rollback: 'delete comment',
    evidence: 'dry-run receipt',
    sideEffect: 'external-message',
    issues: []
  });
});

test('normalizes markdown target case before inferring default approval', () => {
  const plan = parseMarkdownBrief('# Test\nSeverity: sev3\n\n- [Notes] action=note; message=local note; rollback=remove note');
  assert.equal(plan.actions[0].target, 'notes');
  assert.equal(plan.actions[0].sideEffect, 'local-note');
  assert.equal(plan.actions[0].approval, 'optional');
  assert.deepEqual(plan.actions[0].issues, []);
});

test('retains explicit markdown approval when normalizing target case', () => {
  const plan = parseMarkdownBrief('# Test\nSeverity: sev3\n\n- [Notes] action=note; message=local note; approval=required; rollback=remove note');
  assert.equal(plan.actions[0].approval, 'required');
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

test('escapes pipes and normalizes newlines in every markdown table cell', () => {
  const plan = parseJsonBrief(JSON.stringify({
    incident: 'Formatting',
    actions: [{
      id: 'action|1\ncontinued',
      target: 'custom|target\ncontinued',
      action: 'post|update\ncontinued',
      message: 'message',
      approval: 'unexpected|approval\ncontinued',
      rollback: 'delete | correct\nthen notify',
      evidence: ''
    }]
  }));

  const markdown = formatPlan({
    ...plan,
    summary: { total: 1, approvalRequired: 0, withIssues: 1 }
  }, 'markdown');
  const row = markdown.split('\n').find((line) => line.startsWith('| action'));
  assert.equal(row, '| action\\|1 continued | custom\\|target continued | post\\|update continued | external-write | unexpected\\|approval continued | delete \\| correct then notify | missing evidence, invalid approval unexpected\\|approval continued |');
  assert.equal(row.split(/(?<!\\)\|/).length - 1, 8);
});

test('classifies unknown connector targets as external writes', () => {
  const plan = parseMarkdownBrief('# Test\nSeverity: sev2\n\n- [webhook] action=post; message=notify system; approval=required; rollback=send correction; evidence=webhook dry-run payload');
  assert.equal(plan.actions[0].sideEffect, 'external-write');
  assert.equal(plan.actions[0].approval, 'required');
});
