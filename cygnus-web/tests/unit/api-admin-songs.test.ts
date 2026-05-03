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
const mockLeftJoin = vi.fn().mockReturnThis();
const mockDeleteFn = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockUpdateFn = vi.fn().mockReturnThis();
const mockSet = vi.fn().mockReturnThis();
const mockGet = vi.fn().mockResolvedValue(undefined);

const mockDb = {
  select: mockSelectFn,
  from: mockFrom,
  leftJoin: mockLeftJoin,
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
  get: mockGet,
};

function makeAuthedRequest(
  path = '/api/admin/songs',
  options: RequestInit = {}
) {
  if (options.body instanceof FormData) {
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const formData = options.body;
    const parts: string[] = [];
    formData.forEach((value, key) => {
      parts.push(`--${boundary}`);
      parts.push(`Content-Disposition: form-data; name="${key}"`);
      parts.push('');
      parts.push(String(value));
    });
    parts.push(`--${boundary}--`);
    const body = parts.join('\r\n');
    return new Request(`http://localhost${path}`, {
      ...options,
      body,
      headers: {
        ...((options.headers as Record<string, string>) ?? {}),
        'content-type': `multipart/form-data; boundary=${boundary}`,
        cookie: 'admin_auth=1',
      },
    });
  }
  return new Request(`http://localhost${path}`, {
    ...options,
    headers: {
      cookie: 'admin_auth=1',
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
}

function makeSongForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const fields = {
    id: '1',
    song_name: 'Test',
    artist: 'Artist',
    bpm: '120',
    release_date: '2024-01-01',
    is_released: 'true',
    origin: 'AI',
    ...overrides,
  };

  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }

  return formData;
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
    mockLeftJoin.mockReturnThis();
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
    const body = (await resp.json()) as {
      pagination: { total: number; totalPages: number };
    };
    expect(body.pagination.total).toBe(0);
    expect(body.pagination.totalPages).toBe(1);
  });
});

describe('GET /api/admin/songs - categories', () => {
  beforeEach(() => {
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    vi.clearAllMocks();
    mockCount.mockResolvedValue(1);
    mockAll.mockResolvedValue([
      {
        id: 1,
        song_name: 'Categorized Track',
        artist: 'Artist',
        bpm: 128,
        release_date: '2024-01-01',
        is_released: true,
        created_date: '2024-01-02T00:00:00.000Z',
        origin: 'AI',
        r2_key: 'songs/track.mid',
        categoryId: 2,
        categoryName: 'Drum and Bass',
      },
      {
        id: 2,
        song_name: 'Uncategorized Track',
        artist: 'Artist',
        bpm: 96,
        release_date: '2024-01-03',
        is_released: false,
        created_date: '2024-01-04T00:00:00.000Z',
        origin: 'Human',
        r2_key: 'songs/other.mid',
        categoryId: null,
        categoryName: null,
      },
    ]);
    mockLimit.mockReturnThis();
    mockOffset.mockReturnThis();
    mockOrderBy.mockReturnThis();
    mockSelectFn.mockReturnThis();
    mockFrom.mockReturnThis();
    mockLeftJoin.mockReturnThis();
  });

  it('returns category metadata in admin song list', async () => {
    const resp = await GET({
      request: makeAuthedRequest('/api/admin/songs'),
      locals: { runtime: { env: { DB: {} } } },
      url: new URL('http://localhost/api/admin/songs'),
    } as any);

    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.songs).toEqual([
      expect.objectContaining({
        id: 1,
        categoryId: 2,
        categoryName: 'Drum and Bass',
      }),
      expect.objectContaining({
        id: 2,
        categoryId: null,
        categoryName: null,
      }),
    ]);
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
  beforeEach(() => {
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    vi.clearAllMocks();
    mockCount.mockResolvedValue(0);
    mockGet.mockResolvedValue(undefined);
    mockSelectFn.mockReturnThis();
    mockFrom.mockReturnThis();
    mockWhere.mockReturnThis();
    mockUpdateFn.mockReturnThis();
    mockSet.mockReturnThis();
  });

  it('returns 400 for non-numeric bpm (authenticated)', async () => {
    const formData = makeSongForm({ bpm: 'not-a-number' });
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

describe('PUT /api/admin/songs - category validation', () => {
  beforeEach(() => {
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    vi.clearAllMocks();
    mockRun.mockResolvedValue({});
    mockCount.mockResolvedValue(0);
    mockGet.mockResolvedValue(undefined);
    mockSelectFn.mockReturnThis();
    mockFrom.mockReturnThis();
    mockWhere.mockReturnThis();
    mockUpdateFn.mockReturnThis();
    mockSet.mockReturnThis();
  });

  it('allows missing categoryId when categories exist (uncategorized)', async () => {
    mockCount.mockResolvedValue(1);

    const resp = await PUT({
      request: makeAuthedRequest('/api/admin/songs', {
        method: 'PUT',
        body: makeSongForm(),
      }),
      locals: { runtime: { env: { DB: {} } } },
      url: new URL('http://localhost/api/admin/songs'),
    } as any);

    expect(resp.status).toBe(200);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: null })
    );
  });

  it('updates category_id when categoryId is valid', async () => {
    mockCount.mockResolvedValue(1);
    mockGet.mockResolvedValue({ id: 3 });

    const resp = await PUT({
      request: makeAuthedRequest('/api/admin/songs', {
        method: 'PUT',
        body: makeSongForm({ categoryId: '3' }),
      }),
      locals: { runtime: { env: { DB: {} } } },
      url: new URL('http://localhost/api/admin/songs'),
    } as any);

    expect(resp.status).toBe(200);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: 3 })
    );
  });

  it('rejects invalid or nonexistent categoryId', async () => {
    mockCount.mockResolvedValue(1);
    mockGet.mockResolvedValue(undefined);

    const resp = await PUT({
      request: makeAuthedRequest('/api/admin/songs', {
        method: 'PUT',
        body: makeSongForm({ categoryId: '999' }),
      }),
      locals: { runtime: { env: { DB: {} } } },
      url: new URL('http://localhost/api/admin/songs'),
    } as any);

    expect(resp.status).toBe(400);
    const body = await resp.json();
    expect(body.message).toMatch(/category/i);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('allows missing categoryId when no categories exist and updates category_id null', async () => {
    mockCount.mockResolvedValue(0);

    const resp = await PUT({
      request: makeAuthedRequest('/api/admin/songs', {
        method: 'PUT',
        body: makeSongForm(),
      }),
      locals: { runtime: { env: { DB: {} } } },
      url: new URL('http://localhost/api/admin/songs'),
    } as any);

    expect(resp.status).toBe(200);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: null })
    );
  });

  it('treats blank-string categoryId as missing when no categories exist', async () => {
    mockCount.mockResolvedValue(0);

    const resp = await PUT({
      request: makeAuthedRequest('/api/admin/songs', {
        method: 'PUT',
        body: makeSongForm({ categoryId: '' }),
      }),
      locals: { runtime: { env: { DB: {} } } },
      url: new URL('http://localhost/api/admin/songs'),
    } as any);

    expect(resp.status).toBe(200);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: null })
    );
  });

  it('allows blank-string categoryId when categories exist (uncategorized)', async () => {
    mockCount.mockResolvedValue(1);

    const resp = await PUT({
      request: makeAuthedRequest('/api/admin/songs', {
        method: 'PUT',
        body: makeSongForm({ categoryId: '' }),
      }),
      locals: { runtime: { env: { DB: {} } } },
      url: new URL('http://localhost/api/admin/songs'),
    } as any);

    expect(resp.status).toBe(200);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: null })
    );
  });
});
