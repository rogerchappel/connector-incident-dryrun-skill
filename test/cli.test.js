import assert from 'node:assert/strict';
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

test('cli rejects invalid argument contracts without producing a plan', () => {
  const cases = [
    { argv: ['plan', 'fixtures/slack-update.md', '--bogus', 'value'], error: 'Unknown option: --bogus' },
    { argv: ['plan', 'fixtures/slack-update.md', '--format'], error: 'Missing value for --format' },
    { argv: ['plan', 'fixtures/slack-update.md', '--format', 'yaml'], error: 'Invalid --format value: yaml (expected markdown or json)' },
    { argv: ['plan', 'fixtures/slack-update.md', '--fail-on', 'nonsense'], error: 'Invalid --fail-on value: nonsense (expected approval or issues)' }
  ];

  for (const { argv, error } of cases) {
    const { io, stdout, stderr } = capture();
    assert.equal(run(argv, io), 1);
    assert.deepEqual(stdout, []);
    assert.deepEqual(stderr, [error]);
  }
});
