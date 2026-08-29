import { copyFile, readdir, readFile, writeFile } from 'node:fs/promises';

const assets = (await readdir('dist/site/assets'))
  .filter(name => name.endsWith('.js') || name.endsWith('.css'))
  .map(name => `'/assets/${name}'`)
  .join(', ');
const path = 'dist/site/sw.js';
const source = await readFile(path, 'utf8');
await writeFile(path, source.replace("'__BUILD_ASSETS__'", assets));

await copyFile('dist/site/index.html', 'dist/site/404.html');
