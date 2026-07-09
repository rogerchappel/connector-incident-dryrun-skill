import fs from 'node:fs';

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist', { recursive: true });
for (const file of ['src/index.js', 'src/cli.js', 'SKILL.md', 'README.md']) {
  fs.copyFileSync(file, `dist/${file.replaceAll('/', '-')}`);
}
console.log('build ok');
