import assert from 'node:assert/strict';
import test from 'node:test';
import { run } from '../src/cli.js';

function capture() {
  const lines = [];
  return { io: { log: (value) => lines.push(String(value)), error: (value) => lines.push(String(value)) }, lines };
}

test('cli emits markdown plans', () => {
  const { io, lines } = capture();
  assert.equal(run(['plan', 'fixtures/slack-update.md', '--format', 'markdown'], io), 0);
  assert.match(lines.join('\n'), /Approval required: 2/);
});

test('cli can fail on approval requirements', () => {
  const { io } = capture();
  assert.equal(run(['plan', 'fixtures/slack-update.md', '--format', 'json', '--fail-on', 'approval'], io), 2);
});
