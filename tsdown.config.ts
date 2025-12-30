import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    'api/index': 'api/index.ts',
  },
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  platform: 'node',
  target: 'node20',
  shims: true,
  treeshake: true,
  external: [], // Bundle all dependencies
  noExternal: [/.*/], // Don't externalize anything
});