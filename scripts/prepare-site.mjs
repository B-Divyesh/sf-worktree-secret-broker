import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';

const assets = (await readdir('dist/site/assets'))
  .filter(name => name.endsWith('.js') || name.endsWith('.css'))
  .map(name => `'/assets/${name}'`)
  .join(', ');
const path = 'dist/site/sw.js';
const source = await readFile(path, 'utf8');
await writeFile(path, source.replace("'__BUILD_ASSETS__'", assets));

const origin = 'https://worktree-secret-broker.sociobot.in';
const pages = {
  '/demo': {
    title: 'Demo — Worktree Secret Broker',
    description: 'See the CLI run with isolated sample worktree data and a names-only receipt.',
    heading: 'See the CLI run with sample worktree data',
  },
  '/privacy': {
    title: 'Privacy — Worktree Secret Broker',
    description: 'Read how the CLI and its isolated browser sample handle local data.',
    heading: 'Privacy stays local',
  },
  '/terms': {
    title: 'Terms — Worktree Secret Broker',
    description: 'Read the MIT license terms and safe-use limits for Worktree Secret Broker.',
    heading: 'Terms for using the broker',
  },
  '/404': {
    title: 'Page not found — Worktree Secret Broker',
    description: 'Return to Worktree Secret Broker from a path that does not exist.',
    heading: 'This path has no worktree',
  },
};

function pageHtml(base, route, page) {
  return base
    .replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(">)/, `$1${page.description}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(">)/, `$1${origin}${route}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${page.title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(">)/, `$1${page.description}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(">)/, `$1${page.title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(">)/, `$1${page.description}$2`)
    .replace('<div id="app"></div>', `<div id="app"></div><noscript><main><h1>${page.heading}</h1><p>Enable JavaScript to use this local interactive guide.</p></main></noscript>`);
}

const index = await readFile('dist/site/index.html', 'utf8');
for (const [route, page] of Object.entries(pages)) {
  const target = route === '/404' ? 'dist/site/404.html' : `dist/site${route}/index.html`;
  await mkdir(target.slice(0, target.lastIndexOf('/')), { recursive: true });
  await writeFile(target, pageHtml(index, route, page));
}
