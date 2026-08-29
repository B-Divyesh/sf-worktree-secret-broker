import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const binary = new URL('../../../dist/bin/wsb', import.meta.url).pathname;
const base = mkdtempSync(join(tmpdir(), 'wsb-verification-4-'));
const worktree = join(base, 'worktree');
const tools = join(base, 'tools');
const config = join(base, 'config.toml');
const provider = join(tools, 'secret-tool');
const secret = 'manual-sentinel-4q8w';
mkdirSync(worktree);
mkdirSync(tools);
spawnSync('git', ['init', '-q'], { cwd: worktree, stdio: 'inherit' });

function setProvider(body = `#!/bin/sh\nprintf '${secret}\\n'\n`) {
  writeFileSync(provider, body, { mode: 0o755 });
  chmodSync(provider, 0o755);
}

function setConfig({ lease = 15, name = 'API_TOKEN', label = 'development', extra = '' } = {}) {
  writeFileSync(config, `version = 1\nlease_minutes = ${lease}\n[[secrets]]\nname = "${name}"\nsource = "keychain://qa/account"\nlabels = ["${label}"]\n${extra}`);
}

function run(args, env = testEnv) {
  const result = spawnSync(binary, args, { env, encoding: 'utf8' });
  return { code: result.status, signal: result.signal, stdout: result.stdout, stderr: result.stderr };
}

function expectFailure(result, fragment, code = 1) {
  assert.equal(result.code, code, JSON.stringify(result));
  assert.match(result.stderr, new RegExp(fragment), JSON.stringify(result));
}

async function waitForFile(path) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (existsSync(path)) return;
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  throw new Error(`timed out waiting for ${path}`);
}

async function lifecycle(signal, ttlSeconds = 10) {
  const marker = join(base, `child-${signal}.pid`);
  const args = ['run', '--config', config, '--worktree', worktree, '--json', '--ttl-seconds', String(ttlSeconds), '--', 'sh', '-c', `echo $$ > "${marker}"; exec sleep 30`];
  const broker = spawn(binary, args, { env: testEnv, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  broker.stdout.on('data', chunk => { stdout += String(chunk); });
  broker.stderr.on('data', chunk => { stderr += String(chunk); });
  await waitForFile(marker);
  const childPid = Number(readFileSync(marker, 'utf8').trim());
  assert.ok(childPid > 1);
  const brokerCmdline = readFileSync(`/proc/${broker.pid}/cmdline`, 'utf8');
  const childCmdline = readFileSync(`/proc/${childPid}/cmdline`, 'utf8');
  const childHadSecretBeforeSignal = readFileSync(`/proc/${childPid}/environ`, 'utf8').includes(`API_TOKEN=${secret}`);
  assert.ok(!brokerCmdline.includes(secret));
  assert.ok(!childCmdline.includes(secret));
  const exitedPromise = new Promise(resolve => {
    broker.once('exit', (code, exitSignal) => resolve({ code, signal: exitSignal }));
  });
  const closedPromise = new Promise(resolve => {
    broker.once('close', (code, closeSignal) => resolve({ code, signal: closeSignal }));
  });
  broker.kill(signal);
  const exited = await Promise.race([
    exitedPromise,
    new Promise(resolve => setTimeout(() => resolve({ code: null, signal: 'TIMEOUT' }), 3000)),
  ]);
  const closed = await Promise.race([
    closedPromise,
    new Promise(resolve => setTimeout(() => resolve({ code: null, signal: 'TIMEOUT' }), 3000)),
  ]);
  await new Promise(resolve => setTimeout(resolve, 300));
  let childAlive = false;
  let childHasSecretAfterSignal = false;
  try {
    const state = readFileSync(`/proc/${childPid}/stat`, 'utf8').split(' ')[2];
    childAlive = state !== 'Z';
    if (childAlive) childHasSecretAfterSignal = readFileSync(`/proc/${childPid}/environ`, 'utf8').includes(`API_TOKEN=${secret}`);
  } catch {}
  if (childAlive) {
    try { process.kill(childPid, 'SIGKILL'); } catch {}
  }
  return { signal, ttlSeconds, childPid, childAlive, childHadSecretBeforeSignal, childHasSecretAfterSignal, brokerCmdline, childCmdline, stdout, stderr, exited, closed };
}

setProvider();
setConfig();
const testEnv = { ...process.env, PATH: `${tools}:${process.env.PATH}`, UNRELATED_TOKEN: 'must-not-pass' };
const evidence = {};

const checked = run(['check', '--config', config, '--json']);
assert.equal(checked.code, 0);
assert.deepEqual(JSON.parse(checked.stdout), {
  valid: true,
  secret_names: ['API_TOKEN'],
  providers: ['os-keychain'],
  lease_minutes: 15,
});
evidence.normal_check = JSON.parse(checked.stdout);

const normal = run(['run', '--config', config, '--worktree', worktree, '--json', '--', 'sh', '-c', 'test "$API_TOKEN" = "manual-sentinel-4q8w"']);
assert.equal(normal.code, 0, JSON.stringify(normal));
const normalReceipt = JSON.parse(normal.stdout);
assert.equal(normalReceipt.outcome, 'child-exited');
assert.deepEqual(normalReceipt.secret_names, ['API_TOKEN']);
assert.ok(!normal.stdout.includes(secret));
evidence.normal_run = normalReceipt;

for (const lease of [1, 1440]) {
  setConfig({ lease });
  const boundary = run(['check', '--config', config, '--json']);
  assert.equal(boundary.code, 0, JSON.stringify(boundary));
  assert.equal(JSON.parse(boundary.stdout).lease_minutes, lease);
}
evidence.lease_boundaries = [1, 1440];

for (const lease of [0, 1441]) {
  setConfig({ lease });
  expectFailure(run(['check', '--config', config]), 'between 1 and 1440');
}
evidence.invalid_lease_values_rejected = [0, 1441];

setConfig({ name: 'BAD-NAME' });
expectFailure(run(['check', '--config', config]), 'not a valid environment variable name');
setConfig({ label: 'PrOdUcTiOn' });
expectFailure(run(['check', '--config', config]), 'denied by default');
assert.equal(run(['check', '--config', config, '--allow-production']).code, 0);
evidence.production_default_deny_and_explicit_override = true;

setConfig();
const nested = join(worktree, 'nested');
mkdirSync(nested);
expectFailure(run(['run', '--config', config, '--worktree', nested, '--', 'true']), 'name the worktree root');
expectFailure(run(['run', '--config', config, '--worktree', worktree]), 'required arguments were not provided', 2);
evidence.invalid_worktree_and_missing_command_rejected = true;

setProvider('#!/bin/sh\nexit 19\n');
expectFailure(run(['run', '--config', config, '--worktree', worktree, '--', 'true']), 'provider could not resolve');
setProvider();
assert.equal(run(['run', '--config', config, '--worktree', worktree, '--', 'true']).code, 0);
evidence.provider_error_recovers_after_correction = true;

const child37 = run(['run', '--config', config, '--worktree', worktree, '--json', '--', 'sh', '-c', 'exit 37']);
assert.equal(child37.code, 37, JSON.stringify(child37));
assert.equal(JSON.parse(child37.stdout).child_exit_code, 37);
evidence.child_exit_code_propagated = 37;

const initPath = join(base, 'init.toml');
assert.equal(run(['init', '--output', initPath]).code, 0);
expectFailure(run(['init', '--output', initPath]), 'already exists');
evidence.init_refuses_overwrite = true;

evidence.sigint = await lifecycle('SIGINT');
evidence.sigterm = await lifecycle('SIGTERM', 1);
evidence.sighup = await lifecycle('SIGHUP', 1);

writeFileSync(new URL('./cli-adversarial-result.json', import.meta.url), `${JSON.stringify(evidence, null, 2)}\n`);
rmSync(base, { recursive: true, force: true });
console.log(JSON.stringify({
  checks: 'passed',
  sigint_child_alive: evidence.sigint.childAlive,
  sigint_outcome: evidence.sigint.stdout,
  sigterm_child_alive: evidence.sigterm.childAlive,
  sigterm_close: evidence.sigterm.closed,
  sighup_child_alive: evidence.sighup.childAlive,
  sighup_exit: evidence.sighup.exited,
}, null, 2));
