import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const canonical = {
  repository: {
    type: 'git',
    url: 'git+https://github.com/rogerchappel/connector-incident-dryrun-skill.git'
  },
  bugs: {
    url: 'https://github.com/rogerchappel/connector-incident-dryrun-skill/issues'
  },
  homepage: 'https://github.com/rogerchappel/connector-incident-dryrun-skill#readme'
};

export function topLevelKeys(source) {
  JSON.parse(source);

  const keys = [];
  let depth = 0;
  let expectingKey = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (/\s/.test(character)) continue;

    if (character === '"') {
      const start = index;
      for (index += 1; index < source.length; index += 1) {
        if (source[index] === '\\') index += 1;
        else if (source[index] === '"') break;
      }
      if (depth === 1 && expectingKey) {
        keys.push(JSON.parse(source.slice(start, index + 1)));
        expectingKey = false;
      }
      continue;
    }

    if (character === '{' || character === '[') {
      depth += 1;
      if (depth === 1 && character === '{') expectingKey = true;
    } else if (character === '}' || character === ']') {
      depth -= 1;
    } else if (character === ',' && depth === 1) {
      expectingKey = true;
    }
  }

  return keys;
}

export function validatePackageManifestText(source) {
  const keys = topLevelKeys(source);
  const duplicates = [...new Set(keys.filter((key, index) => keys.indexOf(key) !== index))];
  if (duplicates.length) {
    throw new Error(`package.json has duplicate top-level keys: ${duplicates.join(', ')}`);
  }

  const manifest = JSON.parse(source);
  for (const [key, expected] of Object.entries(canonical)) {
    if (JSON.stringify(manifest[key]) !== JSON.stringify(expected)) {
      throw new Error(`package.json ${key} must use the canonical GitHub metadata`);
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    validatePackageManifestText(fs.readFileSync('package.json', 'utf8'));
    console.log('package manifest ok');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
