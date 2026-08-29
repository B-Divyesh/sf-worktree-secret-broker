import { spawn, execFile as execFileCallback } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const binary = join(process.cwd(), 'dist/bin/wsb');
const results = [];
const secret = 'qa-secret-value-7x9-never-print';

function pass(caseName, evidence) {
  results.push({ case: caseName, result: 'PASS', evidence });
}

async function expectFailure(caseName, args, options, expectedCode, expectedText) {
  try {
    await execFile(binary, args, options);
    throw new Error(`${caseName}: unexpectedly exited 0`);
  } catch (error) {
    if (error.code !== expectedCode || !`${error.stdout ?? ''}${error.stderr ?? ''}`.includes(expectedText)) throw error;
    pass(caseName, `exit ${error.code}; ${expectedText}`);
  }
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'wsb-independent-'));
  const tools = join(root, 'tools');
  await mkdir(tools);
  await execFile('git', ['init', '-q'], { cwd: root });
  const marker = join(root, 'provider-ready');
  const provider = join(tools, 'secret-tool');
  await writeFile(provider, `#!/bin/sh\n[ -f "${marker}" ] || exit 9\nprintf %s '${secret}'\n`);
  await chmod(provider, 0o755);
  const config = join(root, 'config.toml');
  await writeFile(config, 'version=1\nlease_minutes=15\n[[secrets]]\nname="API_TOKEN"\nsource="keychain://qa/token"\nlabels=["development"]\n');
  const env = { ...process.env, PATH: `${tools}:${process.env.PATH}`, UNRELATED_TOKEN: 'must-not-pass', CI: 'must-not-pass' };
  return { root, tools, marker, config, env };
}

async function waitForPid(path) {
  for (let i = 0; i < 100; i += 1) {
    try {
      const pid = Number((await readFile(path, 'utf8')).trim());
      if (pid > 1) return pid;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error(`timed out waiting for ${path}`);
}

async function gone(pid) {
  try {
    const { stdout } = await execFile('ps', ['-o', 'stat=', '-p', String(pid)]);
    return !stdout.trim() || stdout.trim().startsWith('Z');
  } catch {
    return true;
  }
}

async function waitGone(pid) {
  for (let i = 0; i < 100; i += 1) {
    if (await gone(pid)) return true;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  return false;
}

async function runSignal(item, signal) {
  const leaderFile = join(item.root, `${signal}-leader.pid`);
  const descendantFile = join(item.root, `${signal}-descendant.pid`);
  const broker = spawn(binary, ['run', '--config', item.config, '--worktree', item.root, '--json', '--', 'sh', '-c', `echo $$ > "${leaderFile}"; sleep 30 & echo $! > "${descendantFile}"; wait`], { env: item.env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = ''; let stderr = '';
  broker.stdout.on('data', chunk => { stdout += chunk; });
  broker.stderr.on('data', chunk => { stderr += chunk; });
  const leader = await waitForPid(leaderFile);
  const descendant = await waitForPid(descendantFile);
  const cmdlines = await Promise.all([broker.pid, leader, descendant].map(async pid => {
    try { return await readFile(`/proc/${pid}/cmdline`, 'utf8'); } catch { return ''; }
  }));
  if (cmdlines.some(value => value.includes(secret))) throw new Error(`${signal}: secret appeared in process command line`);
  broker.kill(signal);
  await new Promise((resolve, reject) => { broker.once('error', reject); broker.once('close', resolve); });
  if (!stdout.includes('"outcome":"broker-stopped"')) throw new Error(`${signal}: missing receipt: ${stdout} ${stderr}`);
  if (!(await waitGone(leader)) || !(await waitGone(descendant))) throw new Error(`${signal}: descendant survived`);
  pass(`${signal} revocation`, 'leader and background descendant gone; names-only broker-stopped receipt');
}

async function runParentDeath(item) {
  const leaderFile = join(item.root, 'parent-death-leader.pid');
  const descendantFile = join(item.root, 'parent-death-descendant.pid');
  const broker = spawn(binary, ['run', '--config', item.config, '--worktree', item.root, '--json', '--', 'sh', '-c', `echo $$ > "${leaderFile}"; sleep 30 & echo $! > "${descendantFile}"; wait`], { env: item.env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  broker.stdout.on('data', chunk => { stdout += chunk; });
  const leader = await waitForPid(leaderFile);
  const descendant = await waitForPid(descendantFile);
  broker.kill('SIGKILL');
  await new Promise((resolve, reject) => { broker.once('error', reject); broker.once('close', resolve); });
  if (!stdout.includes('"outcome":"broker-parent-died"')) throw new Error(`parent death: missing supervisor receipt: ${stdout}`);
  if (!(await waitGone(leader)) || !(await waitGone(descendant))) throw new Error('parent death: descendant survived');
  if (stdout.includes(secret)) throw new Error('parent death: secret leaked in receipt');
  pass('forced broker death', 'supervisor killed leader and descendant; names-only broker-parent-died receipt');
}

async function main() {
  const item = await fixture();
  try {
    await expectFailure('provider failure', ['check', '--config', item.config], { env: item.env }, 1, 'provider could not resolve');
  } catch (error) {
    // check validates provider presence, while resolution failure occurs on run.
    await expectFailure('provider failure', ['run', '--config', item.config, '--worktree', item.root, '--', 'true'], { env: item.env }, 1, 'provider could not resolve');
  }
  await writeFile(item.marker, 'ready');

  const normal = await execFile(binary, ['run', '--config', item.config, '--worktree', item.root, '--json', '--', 'sh', '-c', 'test -z "$UNRELATED_TOKEN" && test -z "$CI" && printf %s "$API_TOKEN" | sha256sum'], { env: item.env });
  const receipt = JSON.parse(normal.stdout.trim().split('\n').at(-1));
  const expectedDigest = createHash('sha256').update(secret).digest('hex');
  if (!normal.stdout.includes(expectedDigest)) throw new Error('normal: child did not hash approved value');
  if (normal.stdout.includes(secret) || JSON.stringify(receipt).includes(secret)) throw new Error('normal: resolved value leaked to output');
  if (receipt.outcome !== 'child-exited' || receipt.child_exit_code !== 0) throw new Error('normal: bad receipt');
  const diff = await execFile('git', ['diff'], { cwd: item.root });
  if (diff.stdout.includes(secret)) throw new Error('normal: secret leaked to git diff');
  pass('normal least-privilege run', 'approved value reached child; CI and unrelated token cleared; names-only receipt and clean git diff');

  const nested = join(item.root, 'nested');
  await mkdir(nested);
  await expectFailure('nested worktree refusal', ['run', '--config', item.config, '--worktree', nested, '--', 'true'], { env: item.env }, 1, 'name the worktree root');

  for (const [minutes, code, text] of [[0, 1, 'between 1 and 1440'], [1441, 1, 'between 1 and 1440']]) {
    await expectFailure(`lease boundary ${minutes}`, ['run', '--config', item.config, '--worktree', item.root, '--ttl', String(minutes), '--', 'true'], { env: item.env }, code, text);
  }
  const maxLease = await execFile(binary, ['run', '--config', item.config, '--worktree', item.root, '--ttl', '1440', '--json', '--', 'true'], { env: item.env });
  if (JSON.parse(maxLease.stdout).outcome !== 'child-exited') throw new Error('max lease failed');
  pass('lease boundary 1440', 'accepted');

  const prodConfig = join(item.root, 'prod.toml');
  await writeFile(prodConfig, 'version=1\n[[secrets]]\nname="DEPLOY_KEY"\nsource="keychain://qa/token"\nlabels=["PrOdUcTiOn"]\n');
  await expectFailure('production default deny', ['run', '--config', prodConfig, '--worktree', item.root, '--', 'true'], { env: item.env }, 1, 'denied by default');
  const override = await execFile(binary, ['run', '--config', prodConfig, '--worktree', item.root, '--allow-production', '--json', '--', 'true'], { env: item.env });
  if (JSON.parse(override.stdout).outcome !== 'child-exited') throw new Error('production override failed');
  pass('explicit production override', 'accepted only with --allow-production');

  await expectFailure('child exit propagation', ['run', '--config', item.config, '--worktree', item.root, '--json', '--', 'sh', '-c', 'exit 37'], { env: item.env }, 37, '"child_exit_code":37');
  await expectFailure('one-second expiry', ['run', '--config', item.config, '--worktree', item.root, '--ttl-seconds', '1', '--json', '--', 'sleep', '30'], { env: item.env }, 124, '"outcome":"lease-expired"');

  await runSignal(item, 'SIGTERM');
  await runSignal(item, 'SIGHUP');
  await runSignal(item, 'SIGINT');
  await runParentDeath(item);

  const concurrent = await Promise.all([1, 2].map(() => execFile(binary, ['run', '--config', item.config, '--worktree', item.root, '--json', '--', 'true'], { env: item.env })));
  if (concurrent.some(value => JSON.parse(value.stdout).outcome !== 'child-exited')) throw new Error('concurrent run failed');
  pass('two concurrent leases', 'both exited 0 with independent receipts');

  const initPath = join(item.root, 'starter.toml');
  await execFile(binary, ['init', '--output', initPath]);
  await expectFailure('init overwrite refusal', ['init', '--output', initPath], {}, 1, 'already exists');

  console.log(JSON.stringify({ binary, results }, null, 2));
  await rm(item.root, { recursive: true, force: true });
}

main().catch(async error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
