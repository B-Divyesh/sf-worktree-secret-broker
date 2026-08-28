import { cp, mkdir } from 'node:fs/promises';
await mkdir('dist/bin', { recursive: true });
await cp('target/release/wsb', 'dist/bin/wsb');
