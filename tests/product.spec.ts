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

test('@claim:names-only-receipt receipt and worktree never contain the resolved value', async () => {
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

test('@claim:demo-same-origin browser demo makes only same-origin requests', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', request => origins.add(new URL(request.url()).origin));
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved').first()).toBeVisible();
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:paid-policy-tools price, checkout, and license verification are observable', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/worktree-secret-broker/verify?*', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
  }));
  await page.goto('/');
  await expect(page.getByText('$19', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Buy team policy tools/ })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/worktree-secret-broker/checkout');
  await page.getByLabel('Have a license? Paste it').fill('license_test_123');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.getByRole('status')).toHaveText('Team policy tools are active on this device.');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:worktree-secret-broker'))).toBe('license_test_123');
  await expect(page.getByRole('heading', { name: 'Team policy generator' })).toBeVisible();
  await page.getByRole('button', { name: 'Generate team policy' }).click();
  await expect(page.locator('#policy-output')).toContainText('source = "keychain://team/database_url"');
});

for (const path of ['/', '/demo', '/privacy', '/terms', '/missing']) {
  test(`accessibility baseline on ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  });
}

test('mobile first screen keeps the action visible and has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
