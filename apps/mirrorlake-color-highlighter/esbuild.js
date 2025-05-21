// apps/mirrorlake-color-highlighter/esbuild.js
const esbuild = require('esbuild');
const { existsSync, mkdirSync } = require('fs');
const { join } = require('path');

const outdir = join(__dirname, 'dist');
if (!existsSync(outdir)) {
  mkdirSync(outdir);
}

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['./src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node16',
  sourcemap: !production,
  minify: production,
  logLevel: 'info',
};

if (watch) {
  esbuild.context(buildOptions).then(context => {
    context.watch();
    console.log('Watching for changes...');
  });
} else {
  esbuild.build(buildOptions).catch(() => process.exit(1));
}