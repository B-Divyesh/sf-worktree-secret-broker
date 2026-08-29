import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFile, spawn as spawnProcess } from 'node:child_process';
import { access, chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const binary = join(process.cwd(), 'target/debug/wsb');

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'wsb-claim-'));
  const tools = join(root, 'tools');
  await mkdir(tools);
  await exec('git', ['init', '-q'], { cwd: root });
  const provider = join(tools, 'secret-tool');
  await writeFile(provider, '#!/bin/sh\nprintf fixture-value-7x9\n');
  await chmod(provider, 0o755);
  const config = join(root, 'config.toml');
  await writeFile(config, `version = 1\nlease_minutes = 15\n[[secrets]]\nname = "API_TOKEN"\nsource = "keychain://sample/api"\nlabels = ["development"]\n`);
  return { root, tools, config, env: { ...process.env, PATH: `${tools}:${process.env.PATH}` } };
}

test('@claim:demo-isolated CLI demo uses no provider and removes its temporary worktree', async () => {
  const root = await mkdtemp(join(tmpdir(), 'wsb-demo-test-'));
  const marker = join(root, 'provider-called');
  const networkMarker = join(root, 'network-called');
  const tool = join(root, 'secret-tool');
  await writeFile(tool, `#!/bin/sh\ntouch "${marker}"\nprintf forbidden-value\n`);
  await chmod(tool, 0o755);
  const blocker = join(root, 'deny-network.so');
  await exec('gcc', ['-shared', '-fPIC', join(process.cwd(), 'tests/deny-network.c'), '-o', blocker, '-ldl']);
  const { stdout } = await exec(binary, ['demo'], { env: { ...process.env, PATH: `${root}:${process.env.PATH}`, LD_PRELOAD: blocker, WSB_NETWORK_MARKER: networkMarker } });
  expect(stdout).toContain('Demo — sample data, nothing is saved');
  const demoPath = stdout.match(/Temporary worktree: (.+)/)?.[1];
  expect(demoPath).toBeTruthy();
  await expect(access(demoPath!)).rejects.toThrow();
  await expect(access(marker)).rejects.toThrow();
  await expect(access(networkMarker)).rejects.toThrow();
  await rm(root, { recursive: true, force: true });
});

test('@claim:approved-environment only approved values enter a cleared child environment', async () => {
  const item = await fixture();
  const safeNames = ['PATH', 'HOME', 'USER', 'LOGNAME', 'SHELL', 'TMPDIR', 'TEMP', 'TMP', 'LANG', 'LC_ALL', 'TERM', 'COLORTERM', 'NO_COLOR', 'SYSTEMROOT'];
  const parentEnv = { ...item.env, CI: 'qa-ci-must-not-pass', UNRELATED_TOKEN: 'must-not-pass', GITHUB_TOKEN: 'must-not-pass' };
  for (const name of safeNames) {
    if (name !== 'PATH') parentEnv[name] = name === 'LANG' || name === 'LC_ALL' ? 'C' : `safe-${name}`;
  }
  const result = await exec(binary, ['run', '--config', item.config, '--worktree', item.root, '--', '/usr/bin/env'], {
    env: parentEnv,
  });
  expect(result.stdout).toContain('names: API_TOKEN');
  const childEnv = new Map(result.stdout.split('\n').filter(line => line.includes('=')).map(line => line.split(/=(.*)/s).slice(0, 2) as [string, string]));
  expect([...childEnv.keys()].sort()).toEqual([...safeNames, 'API_TOKEN'].sort());
  expect(childEnv.get('API_TOKEN')).toBe('fixture-value-7x9');
  expect(childEnv.has('CI')).toBe(false);

  await writeFile(item.config, `${await readFile(item.config, 'utf8')}\n[process]\ninherit = ["CI"]\n`);
  const optedIn = await exec(binary, ['run', '--config', item.config, '--worktree', item.root, '--', 'sh', '-c', 'test "$CI" = qa-ci-must-not-pass'], { env: parentEnv });
  expect(optedIn.stdout).toContain('names: API_TOKEN');
  await rm(item.root, { recursive: true, force: true });
});

test('@claim:one-password-provider documented 1Password references use op read', async () => {
  const root = await mkdtemp(join(tmpdir(), 'wsb-op-'));
  const tools = join(root, 'tools');
  await mkdir(tools);
  await exec('git', ['init', '-q'], { cwd: root });
  const op = join(tools, 'op');
  await writeFile(op, '#!/bin/sh\ntest "$1" = read && test "$2" = op://Development/API/token && test "$3" = --no-newline || exit 41\nprintf op-fixture-value\n');
  await chmod(op, 0o755);
  const config = join(root, 'config.toml');
  await writeFile(config, 'version=1\n[[secrets]]\nname="API_TOKEN"\nsource="op://Development/API/token"\nlabels=["development"]\n');
  const env = { ...process.env, PATH: `${tools}:${process.env.PATH}` };
  const checked = await exec(binary, ['check', '--config', config, '--json'], { env });
  expect(JSON.parse(checked.stdout).providers).toEqual(['1password']);
  const result = await exec(binary, ['run', '--config', config, '--worktree', root, '--', 'sh', '-c', 'test "$API_TOKEN" = op-fixture-value'], { env });
  expect(result.stdout).toContain('names: API_TOKEN');
  await rm(root, { recursive: true, force: true });
});

test('check rejects malformed 1Password references before provider access', async () => {
  const root = await mkdtemp(join(tmpdir(), 'wsb-op-invalid-'));
  const tools = join(root, 'tools');
  await mkdir(tools);
  const op = join(tools, 'op');
  await writeFile(op, '#!/bin/sh\nexit 0\n');
  await chmod(op, 0o755);
  const config = join(root, 'config.toml');
  await writeFile(config, 'version=1\n[[secrets]]\nname="API_TOKEN"\nsource="op://x"\nlabels=["development"]\n');
  await expect(exec(binary, ['check', '--config', config], { env: { ...process.env, PATH: `${tools}:${process.env.PATH}` } }))
    .rejects.toMatchObject({ stderr: expect.stringContaining('op://VAULT/ITEM/FIELD') });
  await rm(root, { recursive: true, force: true });
});

test('@claim:broker-stop-revokes stopping the broker kills its leased child', async () => {
  const item = await fixture();
  const marker = join(item.root, 'child.pid');
  const broker = spawnProcess(binary, ['run', '--config', item.config, '--worktree', item.root, '--', 'sh', '-c', `echo $$ > "${marker}"; exec sleep 30`], {
    env: item.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let childPid = 0;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      childPid = Number((await readFile(marker, 'utf8')).trim());
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  expect(childPid).toBeGreaterThan(0);
  broker.kill('SIGINT');
  let stdout = '';
  broker.stdout.on('data', chunk => { stdout += String(chunk); });
  await new Promise<void>((resolve, reject) => {
    broker.once('error', reject);
    broker.once('close', () => resolve());
  });
  expect(stdout).toContain('outcome: broker-stopped');
  expect(() => process.kill(childPid, 0)).toThrow();
  await rm(item.root, { recursive: true, force: true });
});

test('@claim:names-only-receipt receipt, worktree, and provider-reference config never contain the resolved value', async () => {
  const item = await fixture();
  const result = await exec(binary, ['run', '--config', item.config, '--worktree', item.root, '--', 'true'], { env: item.env });
  expect(result.stdout).toContain('names: API_TOKEN');
  expect(result.stdout).not.toContain('fixture-value-7x9');
  const diff = await exec('git', ['diff'], { cwd: item.root });
  expect(diff.stdout).not.toContain('fixture-value-7x9');
  const config = await readFile(item.config, 'utf8');
  expect(config).not.toContain('fixture-value-7x9');
  await rm(item.root, { recursive: true, force: true });
});

test('@claim:production-denied production-labelled mappings stop before provider access', async () => {
  const root = await mkdtemp(join(tmpdir(), 'wsb-prod-'));
  const config = join(root, 'prod.toml');
  await writeFile(config, 'version=1\n[[secrets]]\nname="DEPLOY_KEY"\nsource="op://Prod/key/value"\nlabels=["production"]\n');
  await expect(exec(binary, ['check', '--config', config])).rejects.toMatchObject({ stderr: expect.stringContaining('denied by default') });
  await rm(root, { recursive: true, force: true });
});

test('@claim:lease-expiry expiry stops the child process and reports revocation', async () => {
  const item = await fixture();
  await expect(exec(binary, ['run', '--config', item.config, '--worktree', item.root, '--ttl-seconds', '1', '--', 'sh', '-c', 'sleep 20'], { env: item.env }))
    .rejects.toMatchObject({ code: 124, stdout: expect.stringContaining('outcome: lease-expired') });
  await rm(item.root, { recursive: true, force: true });
});

test('@claim:worktree-root-required nested paths are refused before the child starts', async () => {
  const item = await fixture();
  const nested = join(item.root, 'nested');
  const marker = join(item.root, 'child-started');
  await mkdir(nested);
  await expect(exec(binary, ['run', '--config', item.config, '--worktree', nested, '--', 'sh', '-c', `touch ${marker}`], { env: item.env }))
    .rejects.toMatchObject({ stderr: expect.stringContaining('name the worktree root') });
  await expect(access(marker)).rejects.toThrow();
  await rm(item.root, { recursive: true, force: true });
});

test('@claim:demo-same-origin browser demo makes only same-origin requests', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', request => origins.add(new URL(request.url()).origin));
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved').first()).toBeVisible();
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:recorded-demo-sample recording uses the CLI demo’s two bundled names', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('The recording uses the demo’s two bundled names.')).toBeVisible();
  const { stdout } = await exec(binary, ['demo', '--json']);
  const receipt = JSON.parse(stdout) as { secret_names: string[] };
  expect(receipt.secret_names).toEqual(['DATABASE_URL', 'NPM_TOKEN']);
  await expect(page.locator('.terminal')).toContainText('Approved: DATABASE_URL, NPM_TOKEN');
});

test('@claim:site-no-analytics the landing page makes no third-party request', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', request => origins.add(new URL(request.url()).origin));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Lease secrets to one worktree process' })).toBeVisible();
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:policy-generator the local helper creates development-only references without a network request', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', request => origins.add(new URL(request.url()).origin));
  await page.goto('/');
  await page.getByLabel('Approved variable names').fill('SERVICE_TOKEN');
  await page.getByRole('button', { name: 'Generate team policy' }).click();
  await expect(page.locator('#policy-output')).toContainText('name = "SERVICE_TOKEN"');
  await expect(page.locator('#policy-output')).toContainText('source = "keychain://team/service_token"');
  await expect(page.locator('#policy-output')).toContainText('labels = ["development"]');
  await expect(page.locator('#policy-output')).not.toContainText('fixture-value-7x9');
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:demo-reset reset clears demo storage and restores the first output', async ({ page }) => {
  await page.goto('/demo');
  await page.evaluate(() => sessionStorage.setItem('demo:changed-frame', '9'));
  await page.getByRole('button', { name: 'Reset demo' }).click();
  expect(await page.evaluate(() => sessionStorage.getItem('demo:changed-frame'))).toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem('demo:reset'))).not.toBeNull();
  await expect(page.locator('.terminal')).toContainText('$ wsb demo');
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeFocused();
});

test('@claim:copy-install-command copies an actionable public-source command', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#install');
  await page.getByRole('button', { name: 'Copy install command' }).click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('cargo install --git https://github.com/B-Divyesh/sf-worktree-secret-broker.git --locked');
  await expect(page.getByRole('link', { name: /View source/ })).toHaveAttribute('href', 'https://github.com/B-Divyesh/sf-worktree-secret-broker');
});

test('regression: an unavailable checkout is not advertised', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /buy/i })).toHaveCount(0);
  expect(await page.locator('body').innerText()).not.toContain('$19');
});

test('offline reload works after the service worker controls the built demo', async ({ context, page }) => {
  await page.goto('/demo');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'commit', timeout: 5_000 });
  await expect(page.getByRole('heading', { name: 'Watch a secret lease finish cleanly' })).toBeVisible();
  await expect(page.getByText('Demo — sample data, nothing is saved').first()).toBeVisible();
  await context.setOffline(false);
});

for (const path of ['/', '/demo', '/privacy', '/terms', '/missing']) {
  test(`accessibility baseline on ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect((await page.title()).length).toBeLessThanOrEqual(60);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('production output emits real routes and a designed HTTP 404 override', async () => {
  await expect(access(join(process.cwd(), 'dist/site/404.html'))).resolves.toBeUndefined();
  const config = JSON.parse(await readFile(join(process.cwd(), 'dist/site/staticwebapp.config.json'), 'utf8')) as {
    navigationFallback?: unknown;
    routes?: Array<{ route: string; rewrite?: string }>;
    responseOverrides?: Record<string, { rewrite?: string }>;
  };
  expect(config.navigationFallback).toBeUndefined();
  for (const route of ['/demo', '/privacy', '/terms']) {
    expect(config.routes).toContainEqual({ route, rewrite: '/index.html' });
  }
  expect(config.responseOverrides?.['404']?.rewrite).toBe('/404.html');
});

test('cold hash links and browser Back restore their exact destinations', async ({ page }) => {
  await page.goto('/#install');
  await expect(page.locator('#install h2')).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(1_000);

  await page.goto('/');
  await page.evaluate(() => scrollTo(0, 1_800));
  await page.waitForFunction(() => scrollY > 1_700);
  await page.evaluate(() => (document.querySelector('a[href="/demo"]') as HTMLAnchorElement).click());
  await expect(page).toHaveURL(/\/demo$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.waitForFunction(() => scrollY > 1_700);
});

test('mobile first screen keeps the action visible and has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const undersized = await page.locator('a').evaluateAll(links => links
    .filter(link => {
      const style = getComputedStyle(link);
      return style.visibility !== 'hidden' && style.display !== 'none';
    })
    .map(link => ({ text: link.textContent?.trim(), width: link.getBoundingClientRect().width, height: link.getBoundingClientRect().height }))
    .filter(box => box.width < 44 || box.height < 44));
  expect(undersized).toEqual([]);
});

test('keyboard starts at the skip link and operates the policy helper', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.getByLabel('Approved variable names').focus();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('SERVICE_TOKEN');
  await page.getByRole('button', { name: 'Generate team policy' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#policy-output')).toContainText('name = "SERVICE_TOKEN"');
});
