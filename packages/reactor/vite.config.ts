import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true,
      },
    }),
    dts({
      include: ['src/**/*.ts', 'src/**/*.svelte.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.bench.ts'],
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'plugins/index': resolve(__dirname, 'src/plugins/index.ts'),
        'devtools/devtools': resolve(__dirname, 'src/devtools/devtools.ts'),
        'utils/index': resolve(__dirname, 'src/utils/index.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ['svelte', 'svelte/reactivity'],
      output: {
        preserveModules: false,
      },
    },
    sourcemap: true,
    minify: false,
  },
});
