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

async function waitForFileNumber(path: string): Promise<number> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const value = Number((await readFile(path, 'utf8')).trim());
      if (value > 1) return value;
    } catch {
      // The shell has not written its marker yet.
    }
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error(`timed out waiting for ${path}`);
}

async function processIsGone(pid: number): Promise<boolean> {
  try {
    const { stdout } = await exec('ps', ['-o', 'stat=', '-p', String(pid)]);
    return !stdout.trim() || stdout.trim().startsWith('Z');
  } catch {
    return true;
  }
}

function forceStop(pid: number): void {
  try { process.kill(pid, 'SIGKILL'); } catch { /* already gone */ }
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

test('@claim:os-keychain-provider documented Linux and macOS keychain commands resolve only the approved value', async () => {
  await exec('cargo', ['test', 'tests::os_keychain_provider_contract', '--', '--exact']);
  const root = await mkdtemp(join(tmpdir(), 'wsb-keychain-'));
  const tools = join(root, 'tools');
  const argumentsFile = join(root, 'secret-tool-arguments');
  await mkdir(tools);
  await exec('git', ['init', '-q'], { cwd: root });
  const provider = join(tools, 'secret-tool');
  await writeFile(provider, `#!/bin/sh\nprintf '%s\\n' "$@" > "${argumentsFile}"\nprintf os-keychain-fixture-value\n`);
  await chmod(provider, 0o755);
  const config = join(root, 'config.toml');
  await writeFile(config, 'version=1\n[[secrets]]\nname="DATABASE_URL"\nsource="keychain://my-app/database-url"\nlabels=["development"]\n');
  const env = { ...process.env, PATH: `${tools}:${process.env.PATH}`, UNRELATED_TOKEN: 'must-not-pass' };
  const checked = await exec(binary, ['check', '--config', config, '--json'], { env });
  expect(JSON.parse(checked.stdout).providers).toEqual(['os-keychain']);
  const result = await exec(binary, ['run', '--config', config, '--worktree', root, '--', 'sh', '-c', 'test "$DATABASE_URL" = os-keychain-fixture-value && test -z "$UNRELATED_TOKEN"'], { env });
  expect((await readFile(argumentsFile, 'utf8')).trim().split('\n')).toEqual(['lookup', 'service', 'my-app', 'account', 'database-url']);
  expect(result.stdout).toContain('names: DATABASE_URL');
  expect(result.stdout).not.toContain('os-keychain-fixture-value');
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

test('@claim:broker-stop-revokes SIGINT, SIGTERM, SIGHUP, expiry, and parent death revoke the complete child process group', async () => {
  const item = await fixture();
  const brokers: Array<ReturnType<typeof spawnProcess>> = [];
  const pids: number[] = [];
  try {
    for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
      const leaderMarker = join(item.root, `${signal}-leader.pid`);
      const descendantMarker = join(item.root, `${signal}-descendant.pid`);
      const broker = spawnProcess(binary, ['run', '--config', item.config, '--worktree', item.root, '--json', '--', 'sh', '-c', `echo $$ > "${leaderMarker}"; sleep 30 & echo $! > "${descendantMarker}"; wait`], {
        env: item.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      brokers.push(broker);
      let stdout = '';
      broker.stdout.on('data', chunk => { stdout += String(chunk); });
      const leader = await waitForFileNumber(leaderMarker);
      const descendant = await waitForFileNumber(descendantMarker);
      pids.push(leader, descendant);
      broker.kill(signal);
      await new Promise<void>((resolve, reject) => {
        broker.once('error', reject);
        broker.once('close', () => resolve());
      });
      expect(stdout).toContain('"outcome":"broker-stopped"');
      expect(await processIsGone(leader)).toBe(true);
      expect(await processIsGone(descendant)).toBe(true);
    }

    const expiryLeader = join(item.root, 'expiry-leader.pid');
    const expiryDescendant = join(item.root, 'expiry-descendant.pid');
    await expect(exec(binary, ['run', '--config', item.config, '--worktree', item.root, '--json', '--ttl-seconds', '1', '--', 'sh', '-c', `echo $$ > "${expiryLeader}"; sleep 30 & echo $! > "${expiryDescendant}"; wait`], { env: item.env }))
      .rejects.toMatchObject({ code: 124, stdout: expect.stringContaining('"outcome":"lease-expired"') });
    const expiryPids = [await waitForFileNumber(expiryLeader), await waitForFileNumber(expiryDescendant)];
    pids.push(...expiryPids);
    for (const pid of expiryPids) expect(await processIsGone(pid)).toBe(true);

    const parentDeathLeader = join(item.root, 'parent-death-leader.pid');
    const parentDeathDescendant = join(item.root, 'parent-death-descendant.pid');
    const broker = spawnProcess(binary, ['run', '--config', item.config, '--worktree', item.root, '--json', '--', 'sh', '-c', `echo $$ > "${parentDeathLeader}"; sleep 30 & echo $! > "${parentDeathDescendant}"; wait`], {
      env: item.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    brokers.push(broker);
    let parentDeathReceipt = '';
    broker.stdout.on('data', chunk => { parentDeathReceipt += String(chunk); });
    const parentDeathPids = [await waitForFileNumber(parentDeathLeader), await waitForFileNumber(parentDeathDescendant)];
    pids.push(...parentDeathPids);
    broker.kill('SIGKILL');
    await new Promise<void>((resolve, reject) => {
      broker.once('error', reject);
      broker.once('close', () => resolve());
    });
    expect(parentDeathReceipt).toContain('"outcome":"broker-parent-died"');
    for (const pid of parentDeathPids) expect(await processIsGone(pid)).toBe(true);
  } finally {
    brokers.forEach(broker => forceStop(broker.pid!));
    pids.forEach(forceStop);
    await rm(item.root, { recursive: true, force: true });
  }
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
  await page.goto('/?demo=1');
  await expect(page.getByText('Demo — sample data, nothing is saved to your real data').first()).toBeVisible();
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

test('@claim:policy-helper-input-boundary rejects duplicate names without collecting secrets or contacting a third party', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', request => origins.add(new URL(request.url()).origin));
  await page.goto('/');
  const form = page.locator('#policy-desk');
  await expect(form.locator('input')).toHaveCount(0);
  await expect(form.locator('textarea')).toHaveCount(1);
  await expect(form.getByLabel('Approved variable names')).toBeVisible();
  await expect(form.getByLabel('Provider')).toBeVisible();
  await expect(form.getByLabel('Lease length')).toBeVisible();
  expect((await form.innerText()).toLowerCase()).not.toContain('secret value');
  await page.getByLabel('Approved variable names').fill('TOKEN TOKEN');
  await page.getByRole('button', { name: 'Generate team policy' }).click();
  await expect(page.locator('#policy-output')).toHaveText('TOKEN is approved more than once. Keep one entry.');
  await expect(page.locator('#policy-output')).not.toContainText('[[secrets]]');
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:demo-reset reset clears demo storage and restores the first output', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.evaluate(() => sessionStorage.setItem('demo:changed-frame', '9'));
  await page.getByRole('button', { name: 'Reset demo' }).click();
  expect(await page.evaluate(() => sessionStorage.getItem('demo:changed-frame'))).toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem('demo:session'))).toBe('sample-receipt');
  await expect(page.locator('.terminal')).toContainText('$ wsb demo');
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeFocused();
});

test('@claim:demo-browser-isolation demo storage never alters real browser data', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('real:local-sentinel', 'do-not-change');
    sessionStorage.setItem('real:session-sentinel', 'do-not-change');
  });
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/?demo=1$/);
  await expect(page.getByText('Demo — sample data, nothing is saved to your real data').first()).toBeVisible();
  expect(await page.evaluate(() => ({
    local: localStorage.getItem('real:local-sentinel'),
    session: sessionStorage.getItem('real:session-sentinel'),
    demo: sessionStorage.getItem('demo:session'),
  }))).toEqual({ local: 'do-not-change', session: 'do-not-change', demo: 'sample-receipt' });
  await page.getByRole('button', { name: 'Reset demo' }).click();
  expect(await page.evaluate(() => ({
    local: localStorage.getItem('real:local-sentinel'),
    session: sessionStorage.getItem('real:session-sentinel'),
    demoKeys: [...Object.keys(sessionStorage), ...Object.keys(localStorage)].filter(key => key.startsWith('demo:')).sort(),
  }))).toEqual({ local: 'do-not-change', session: 'do-not-change', demoKeys: ['demo:session'] });
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => ({
    local: localStorage.getItem('real:local-sentinel'),
    session: sessionStorage.getItem('real:session-sentinel'),
    demoKeys: [...Object.keys(sessionStorage), ...Object.keys(localStorage)].filter(key => key.startsWith('demo:')),
  }))).toEqual({ local: 'do-not-change', session: 'do-not-change', demoKeys: [] });
});

test('@claim:recorded-demo-receipt browser recording matches every bundled CLI receipt field', async ({ page }) => {
  await page.goto('/?demo=1');
  const { stdout } = await exec(binary, ['demo', '--json']);
  const receipt = JSON.parse(stdout) as {
    lease_id: string; worktree: string; secret_names: string[]; started_at_unix: number;
    expires_at_unix: number; outcome: string; revoked_at_unix: number;
  };
  const transcript = await page.locator('.terminal').innerText();
  expect(transcript).toContain(`Receipt ${receipt.lease_id}`);
  expect(transcript).toContain(`names: ${receipt.secret_names.join(', ')}`);
  expect(transcript).toContain(`started: ${receipt.started_at_unix}`);
  expect(transcript).toContain(`expires: ${receipt.expires_at_unix}`);
  expect(transcript).toContain(`outcome: ${receipt.outcome}`);
  expect(transcript).toContain(`revoked: ${receipt.revoked_at_unix}`);
  expect(transcript).toContain('Temporary worktree removed.');
  await expect(access(receipt.worktree)).rejects.toThrow();
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
  await expect(page.getByRole('heading', { name: 'See the CLI run with sample worktree data' })).toBeVisible();
  await expect(page.getByText('Demo — sample data, nothing is saved to your real data').first()).toBeVisible();
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
  const staticPages = [
    ['demo', 'Demo — Worktree Secret Broker', 'See the CLI run with isolated sample worktree data and a names-only receipt.'],
    ['privacy', 'Privacy — Worktree Secret Broker', 'Read how the CLI and its isolated browser sample handle local data.'],
    ['terms', 'Terms — Worktree Secret Broker', 'Read the MIT license terms and safe-use limits for Worktree Secret Broker.'],
    ['404', 'Page not found — Worktree Secret Broker', 'Return to Worktree Secret Broker from a path that does not exist.'],
  ] as const;
  for (const [route, title, description] of staticPages) {
    const path = route === '404' ? 'dist/site/404.html' : `dist/site/${route}/index.html`;
    const page = await readFile(join(process.cwd(), path), 'utf8');
    expect(page).toContain(`<title>${title}</title>`);
    expect(page).toContain(`content="${description}"`);
    expect(page).toContain(`<link rel="canonical" href="https://worktree-secret-broker.sociobot.in/${route}">`);
  }
  expect(config.routes?.some(route => route.rewrite === '/index.html')).toBe(false);
  expect(config.responseOverrides?.['404']?.rewrite).toBe('/404.html');
});

test('each route updates its social metadata after client navigation', async ({ page }) => {
  const expected = [
    ['/', 'Worktree Secret Broker — Lease development secrets', 'Give one worktree process only the development secrets it needs, without copying a secret file.'],
    ['/demo', 'Demo — Worktree Secret Broker', 'See the CLI run with isolated sample worktree data and a names-only receipt.'],
    ['/privacy', 'Privacy — Worktree Secret Broker', 'Read how the CLI and its isolated browser sample handle local data.'],
    ['/terms', 'Terms — Worktree Secret Broker', 'Read the MIT license terms and safe-use limits for Worktree Secret Broker.'],
    ['/missing', 'Page not found — Worktree Secret Broker', 'Return to Worktree Secret Broker from a path that does not exist.'],
  ] as const;
  for (const [path, title, description] of expected) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description);
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', title);
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', description);
  }
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
