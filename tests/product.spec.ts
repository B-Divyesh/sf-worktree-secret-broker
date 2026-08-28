import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFile } from 'node:child_process';
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
  const child = 'test "$API_TOKEN" = fixture-value-7x9 && test -z "$UNRELATED_TOKEN"';
  const result = await exec(binary, ['run', '--config', item.config, '--worktree', item.root, '--', 'sh', '-c', child], {
    env: { ...item.env, UNRELATED_TOKEN: 'must-not-pass' },
  });
  expect(result.stdout).toContain('names: API_TOKEN');
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

test('production output keeps deep links and returns the designed 404 document', async () => {
  for (const route of ['demo', 'privacy', 'terms']) {
    await expect(access(join(process.cwd(), 'dist/site', route, 'index.html'))).resolves.toBeUndefined();
  }
  await expect(access(join(process.cwd(), 'dist/site/404.html'))).resolves.toBeUndefined();
  const config = JSON.parse(await readFile(join(process.cwd(), 'dist/site/staticwebapp.config.json'), 'utf8')) as {
    responseOverrides?: Record<string, { rewrite?: string }>;
  };
  expect(config.responseOverrides?.['404']?.rewrite).toBe('/404.html');
});

test('mobile first screen keeps the action visible and has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
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
