import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const wranglerToml = readFileSync(
  resolve(process.cwd(), 'wrangler.toml'),
  'utf8'
);

describe('wrangler.toml', () => {
  it('defines an ASSETS binding for built static files', () => {
    expect(wranglerToml).toMatch(/\[assets\]/);
    expect(wranglerToml).toMatch(/directory = "\.\/dist"/);
    expect(wranglerToml).toMatch(/binding = "ASSETS"/);
  });
});

describe('public/.assetsignore', () => {
  it('excludes the generated worker bundle from static asset uploads', () => {
    const assetsIgnore = readFileSync(
      resolve(process.cwd(), 'public/.assetsignore'),
      'utf8'
    );

    expect(assetsIgnore).toMatch(/^_worker\.js\/?$/m);
  });
});
