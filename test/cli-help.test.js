import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

test('CLI entrypoint rejects --help combined with other arguments', () => {
  for (const args of [
    ['plan', 'fixtures/slack-update.md', '--help'],
    ['--help', 'unexpected'],
    ['--help', '--format', 'json']
  ]) {
    const result = invoke(...args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '--help must be used by itself\n');
  }
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
    { args: ['plan', 'fixtures/slack-update.md', '--fail-on', 'nonsense'], error: 'Invalid --fail-on value: nonsense (expected approval or issues)' },
    { args: ['plan', 'fixtures/slack-update.md', '--format', 'json', '--format', 'markdown'], error: 'Duplicate option: --format' },
    { args: ['plan', 'fixtures/slack-update.md', '--fail-on', 'approval', '--fail-on', 'issues'], error: 'Duplicate option: --fail-on' }
  ];

  for (const { args, error } of cases) {
    const result = invoke(...args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, `${error}\n`);
  }
});

test('CLI entrypoint rejects malformed JSON brief shapes without a stack trace or plan', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'connector-entrypoint-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const cases = [
    { body: 'null', error: 'Invalid JSON brief: root must be an object' },
    { body: '[]', error: 'Invalid JSON brief: root must be an object' },
    { body: '9', error: 'Invalid JSON brief: root must be an object' },
    { body: '{"actions":{}}', error: 'Invalid JSON brief: "actions" must be an array' },
    { body: '{"actions":"post"}', error: 'Invalid JSON brief: "actions" must be an array' },
    { body: '{"actions":false}', error: 'Invalid JSON brief: "actions" must be an array' }
  ];

  for (const [index, { body, error }] of cases.entries()) {
    const file = path.join(directory, `${index}.json`);
    fs.writeFileSync(file, body);
    const result = invoke('plan', file, '--format', 'json');
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, `${error}\n`);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
  }
});
