import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true,
      },
    }),
  ],
  resolve: {
    alias: {
      'svelte-reactor/plugins': resolve(__dirname, '../../packages/reactor/src/plugins/index.ts'),
      'svelte-reactor': resolve(__dirname, '../../packages/reactor/src/index.ts'),
    },
  },
  server: {
    port: 5174,
  },
  base: '/svelte-reactor/', // GitHub Pages repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
});
