import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/lib/db', () => ({
  createDb: vi.fn(),
}));

import { GET, DELETE, PUT } from '../../src/pages/api/admin/songs';

const noDbLocals = { runtime: { env: {} } };

function makeRequest(path = '/api/admin/songs', cookie?: string) {
  return new Request(`http://localhost${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

describe('GET /api/admin/songs - auth', () => {
  it('returns 401 with no auth cookie', async () => {
    const resp = await GET({
      request: makeRequest(),
      locals: noDbLocals,
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(401);
  });

  it('returns 401 for bypass attempt admin_auth=10', async () => {
    const resp = await GET({
      request: makeRequest('/api/admin/songs', 'admin_auth=10'),
      locals: noDbLocals,
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(401);
  });

  it('returns 401 for bypass attempt admin_auth=123', async () => {
    const resp = await GET({
      request: makeRequest('/api/admin/songs', 'admin_auth=123'),
      locals: noDbLocals,
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(401);
  });
});

describe('DELETE /api/admin/songs - auth', () => {
  it('returns 401 with no auth cookie', async () => {
    const resp = await DELETE({
      request: makeRequest('/api/admin/songs?id=1'),
      locals: noDbLocals,
      url: new URL('http://localhost/api/admin/songs?id=1'),
    } as any);
    expect(resp.status).toBe(401);
  });
});

describe('PUT /api/admin/songs - auth', () => {
  it('returns 401 with no auth cookie', async () => {
    const resp = await PUT({
      request: makeRequest(),
      locals: noDbLocals,
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(401);
  });
});
