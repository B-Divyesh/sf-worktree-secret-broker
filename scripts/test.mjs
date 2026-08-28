import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('cargo', ['fmt', '--check']);
run('cargo', ['clippy', '--', '-D', 'warnings']);
run('cargo', ['test']);
run('npm', ['run', 'typecheck']);
run('cargo', ['build']);
run('npm', ['run', 'build:site']);
const forwarded = process.argv.slice(2).filter(arg => arg !== '--');
run('npx', ['playwright', 'test', ...forwarded]);
