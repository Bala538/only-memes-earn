import { build } from 'esbuild';
import { readFileSync } from 'fs';

try {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
  const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];

  build({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    external,
    sourcemap: true,
    outfile: 'dist/server.cjs',
  }).catch((err) => {
    console.error('Esbuild compilation failed:', err);
    process.exit(1);
  });
} catch (e) {
  console.error('Failed to read package.json or execute build:', e);
  process.exit(1);
}
