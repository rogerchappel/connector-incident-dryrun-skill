import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { run } from '../src/cli.js';

function capture() {
  const stdout = [];
  const stderr = [];
  return {
    io: {
      log: (value) => stdout.push(String(value)),
      error: (value) => stderr.push(String(value))
    },
    stdout,
    stderr
  };
}

test('cli emits markdown plans', () => {
  const { io, stdout, stderr } = capture();
  assert.equal(run(['plan', 'fixtures/slack-update.md', '--format', 'markdown'], io), 0);
  assert.match(stdout.join('\n'), /Approval required: 2/);
  assert.deepEqual(stderr, []);
});

test('cli can fail on approval requirements', () => {
  const { io, stdout, stderr } = capture();
  assert.equal(run(['plan', 'fixtures/slack-update.md', '--format', 'json', '--fail-on', 'approval'], io), 2);
  assert.match(stdout.join('\n'), /"approvalRequired": 2/);
  assert.deepEqual(stderr, []);
});

test('cli preserves approval gating when a message contains a field-name substring', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'connector-substring-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'brief.md');
  fs.writeFileSync(file, '# Test\n\n- [slack] action=post; message=Status disapproval=optional; rollback=delete; evidence=ticket-1');
  const { io, stdout, stderr } = capture();
  assert.equal(run(['plan', file, '--format', 'json', '--fail-on', 'approval'], io), 2);
  assert.match(stdout.join('\n'), /"approvalRequired": 1/);
  assert.match(stdout.join('\n'), /"approval": "required"/);
  assert.deepEqual(stderr, []);
});

test('cli rejects invalid argument contracts without producing a plan', () => {
  const cases = [
    { argv: ['plan', 'fixtures/slack-update.md', '--bogus', 'value'], error: 'Unknown option: --bogus' },
    { argv: ['plan', 'fixtures/slack-update.md', '--format'], error: 'Missing value for --format' },
    { argv: ['plan', 'fixtures/slack-update.md', '--format', 'yaml'], error: 'Invalid --format value: yaml (expected markdown or json)' },
    { argv: ['plan', 'fixtures/slack-update.md', '--fail-on', 'nonsense'], error: 'Invalid --fail-on value: nonsense (expected approval or issues)' },
    { argv: ['plan', 'fixtures/slack-update.md', '--format', 'json', '--format', 'markdown'], error: 'Duplicate option: --format' },
    { argv: ['plan', 'fixtures/slack-update.md', '--fail-on', 'approval', '--fail-on', 'issues'], error: 'Duplicate option: --fail-on' }
  ];

  for (const { argv, error } of cases) {
    const { io, stdout, stderr } = capture();
    assert.equal(run(argv, io), 1);
    assert.deepEqual(stdout, []);
    assert.deepEqual(stderr, [error]);
  }
});

test('cli reports malformed JSON brief shapes without producing a plan', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'connector-brief-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const cases = [
    { body: 'null', error: 'Invalid JSON brief: root must be an object' },
    { body: '[]', error: 'Invalid JSON brief: root must be an object' },
    { body: '"incident"', error: 'Invalid JSON brief: root must be an object' },
    { body: '{"actions":{}}', error: 'Invalid JSON brief: "actions" must be an array' },
    { body: '{"actions":"post"}', error: 'Invalid JSON brief: "actions" must be an array' },
    { body: '{"actions":7}', error: 'Invalid JSON brief: "actions" must be an array' }
  ];

  for (const [index, { body, error }] of cases.entries()) {
    const file = path.join(directory, `${index}.json`);
    fs.writeFileSync(file, body);
    const { io, stdout, stderr } = capture();
    assert.equal(run(['plan', file, '--format', 'json'], io), 1);
    assert.deepEqual(stdout, []);
    assert.deepEqual(stderr, [error]);
  }
});

test('cli reports invalid JSON action members without producing a plan', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'connector-actions-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const members = [null, 'post update', 7, false, []];

  for (const [index, member] of members.entries()) {
    const file = path.join(directory, `${index}.json`);
    fs.writeFileSync(file, JSON.stringify({ incident: 'Test', actions: [{ target: 'notes' }, member] }));
    const { io, stdout, stderr } = capture();
    assert.equal(run(['plan', file, '--format', 'markdown'], io), 1);
    assert.deepEqual(stdout, []);
    assert.deepEqual(stderr, ['Invalid JSON brief: "actions[1]" must be an object']);
  }
});

test('cli --fail-on issues distinguishes omitted and blank JSON actions', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'connector-action-default-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  for (const [name, action, expectedStatus, expectedIssues] of [
    ['omitted', { message: 'Observe', rollback: 'Remove note' }, 0, '"issues": []'],
    ['blank', { action: '', message: 'Observe', rollback: 'Remove note' }, 2, '"issues": [']
  ]) {
    const file = path.join(directory, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify({ incident: 'Test', actions: [action] }));
    const { io, stdout, stderr } = capture();
    assert.equal(run(['plan', file, '--format', 'json', '--fail-on', 'issues'], io), expectedStatus);
    assert.match(stdout.join('\n'), new RegExp(expectedIssues.replace(/[\[\]]/g, '\\$&')));
    if (name === 'blank') assert.match(stdout.join('\n'), /"missing action"/);
    assert.deepEqual(stderr, []);
  }
});

test('cli rejects non-string JSON fields without producing a plan', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'connector-fields-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const cases = [
    ...['incident', 'title', 'severity'].map((field) => ({
      body: { [field]: false },
      path: field
    })),
    ...['id', 'target', 'action', 'message', 'approval', 'rollback', 'evidence'].map((field) => ({
      body: { actions: [{ [field]: { invalid: true } }] },
      path: `actions[0].${field}`
    }))
  ];

  for (const [index, { body, path: fieldPath }] of cases.entries()) {
    const file = path.join(directory, `${index}.json`);
    fs.writeFileSync(file, JSON.stringify(body));
    const { io, stdout, stderr } = capture();
    assert.equal(run(['plan', file, '--format', 'json'], io), 1);
    assert.deepEqual(stdout, []);
    assert.deepEqual(stderr, [`Invalid JSON brief: "${fieldPath}" must be a string`]);
  }
});
