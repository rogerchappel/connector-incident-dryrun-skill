import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { validatePackageManifestText } from '../scripts/validate-package-json.mjs';

test('rejects duplicate top-level package metadata before parsing masks it', () => {
  const manifest = fs.readFileSync('package.json', 'utf8');
  const duplicate = manifest.replace(
    /\n}\s*$/,
    ',\n  "homepage": "https://github.com/rogerchappel/connector-incident-dryrun-skill#readme"\n}\n'
  );

  assert.throws(
    () => validatePackageManifestText(duplicate),
    /duplicate top-level keys: homepage/
  );
});

test('accepts the canonical package manifest', () => {
  assert.doesNotThrow(() => validatePackageManifestText(fs.readFileSync('package.json', 'utf8')));
});
