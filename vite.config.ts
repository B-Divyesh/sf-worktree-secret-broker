import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname, 'site'),
  publicDir: resolve(__dirname, 'site/public'),
  build: {
    outDir: resolve(__dirname, 'dist/site'),
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true,
  },
});
