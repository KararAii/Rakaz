import * as esbuild from 'esbuild';

await Promise.all([
  esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    platform: 'neutral',
    format: 'esm',
    target: 'es2022',
  }),
  esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.cjs',
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'es2022',
  }),
]);

console.log('built dist/index.js and dist/index.cjs');
