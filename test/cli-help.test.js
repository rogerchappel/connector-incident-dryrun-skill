import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

function invoke(...args) {
  return spawnSync(process.execPath, ['./bin/connector-incident-dryrun.js', ...args], { encoding: 'utf8' });
}

test('CLI help entrypoint prints usage', () => {
  const result = invoke('--help');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:.*--fail-on approval\|issues/);
  assert.equal(result.stderr, '');
});

test('CLI plan entrypoint writes a plan to stdout', () => {
  const result = invoke('plan', 'fixtures/slack-update.md', '--format', 'json');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /"approvalRequired": 2/);
  assert.equal(result.stderr, '');
});

test('CLI entrypoint reports each invalid argument class on stderr', () => {
  const cases = [
    { args: ['plan', 'fixtures/slack-update.md', '--bogus', 'value'], error: 'Unknown option: --bogus' },
    { args: ['plan', 'fixtures/slack-update.md', '--format'], error: 'Missing value for --format' },
    { args: ['plan', 'fixtures/slack-update.md', '--format', 'yaml'], error: 'Invalid --format value: yaml (expected markdown or json)' },
    { args: ['plan', 'fixtures/slack-update.md', '--fail-on', 'nonsense'], error: 'Invalid --fail-on value: nonsense (expected approval or issues)' }
  ];

  for (const { args, error } of cases) {
    const result = invoke(...args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, `${error}\n`);
  }
});
