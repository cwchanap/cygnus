import { join } from 'node:path';

export const e2ePath = (...segments: string[]) =>
  join(process.cwd(), ...segments);

export const repoPath = (...segments: string[]) =>
  join(process.cwd(), '..', ...segments);

export const webPath = (...segments: string[]) =>
  repoPath('cygnus-web', ...segments);
