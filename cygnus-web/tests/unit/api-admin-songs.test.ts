/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDb } from '../../src/lib/db';

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

// Additional mock setup for authenticated tests
const mockRun = vi.fn().mockResolvedValue({});
const mockAll = vi.fn().mockResolvedValue([]);
const mockCount = vi.fn().mockResolvedValue(0);
const mockLimit = vi.fn().mockReturnThis();
const mockOffset = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn().mockReturnThis();
const mockSelectFn = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockDeleteFn = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockUpdateFn = vi.fn().mockReturnThis();
const mockSet = vi.fn().mockReturnThis();

const mockDb = {
  select: mockSelectFn,
  from: mockFrom,
  orderBy: mockOrderBy,
  limit: mockLimit,
  offset: mockOffset,
  all: mockAll,
  $count: mockCount,
  delete: mockDeleteFn,
  where: mockWhere,
  run: mockRun,
  update: mockUpdateFn,
  set: mockSet,
};

function makeAuthedRequest(path = '/api/admin/songs', options: RequestInit = {}) {
  return new Request(`http://localhost${path}`, {
    ...options,
    headers: { cookie: 'admin_auth=1', ...((options.headers as Record<string, string>) ?? {}) },
  });
}

describe('GET /api/admin/songs - NaN guards', () => {
  beforeEach(() => {
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    vi.clearAllMocks();
    mockAll.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
    mockLimit.mockReturnThis();
    mockOffset.mockReturnThis();
    mockOrderBy.mockReturnThis();
    mockSelectFn.mockReturnThis();
    mockFrom.mockReturnThis();
  });

  it('clamps non-numeric page to 1 (offset=0)', async () => {
    const resp = await GET({
      request: makeAuthedRequest('/api/admin/songs?page=abc'),
      locals: { runtime: { env: { DB: {} } } },
      url: new URL('http://localhost/api/admin/songs?page=abc'),
    } as any);
    expect(resp.status).toBe(200);
    expect(mockOffset).toHaveBeenCalledWith(0);
  });

  it('clamps page to MAX_PAGE (1000)', async () => {
    const resp = await GET({
      request: makeAuthedRequest('/api/admin/songs?page=9999'),
      locals: { runtime: { env: { DB: {} } } },
      url: new URL('http://localhost/api/admin/songs?page=9999'),
    } as any);
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { pagination: { page: number } };
    expect(body.pagination.page).toBe(1000);
  });

  it('returns totalPages as at least 1 when totalCount is 0', async () => {
    mockCount.mockResolvedValue(0);
    const resp = await GET({
      request: makeAuthedRequest('/api/admin/songs'),
      locals: { runtime: { env: { DB: {} } } },
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { pagination: { total: number; totalPages: number } };
    expect(body.pagination.total).toBe(0);
    expect(body.pagination.totalPages).toBe(1);
  });
});

describe('DELETE /api/admin/songs - NaN guard', () => {
  it('returns 400 for non-numeric id (authenticated)', async () => {
    const resp = await DELETE({
      request: makeAuthedRequest('/api/admin/songs?id=abc'),
      locals: { runtime: { env: { DB: {} } } },
      url: new URL('http://localhost/api/admin/songs?id=abc'),
    } as any);
    expect(resp.status).toBe(400);
  });

  it('returns 400 when id param is missing (authenticated)', async () => {
    const resp = await DELETE({
      request: makeAuthedRequest('/api/admin/songs'),
      locals: { runtime: { env: { DB: {} } } },
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(400);
  });
});

describe('PUT /api/admin/songs - NaN guard', () => {
  it('returns 400 for non-numeric bpm (authenticated)', async () => {
    const formData = new FormData();
    formData.append('id', '1');
    formData.append('song_name', 'Test');
    formData.append('artist', 'Artist');
    formData.append('bpm', 'not-a-number');
    const resp = await PUT({
      request: makeAuthedRequest('/api/admin/songs', {
        method: 'PUT',
        body: formData,
      }),
      locals: { runtime: { env: { DB: {} } } },
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(400);
  });
});
