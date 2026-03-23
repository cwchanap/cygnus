/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Additional coverage for /api/admin/songs – success paths and missing-DB branches
 * that are not covered by the existing api-admin-songs.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDb } from '../../src/lib/db';

vi.mock('../../src/lib/db', () => ({
  createDb: vi.fn(),
}));

import { GET, DELETE, PUT } from '../../src/pages/api/admin/songs';

// Authenticated request helper – merges caller headers with auth/content-type
function authedRequest(path: string, options: RequestInit = {}) {
  // Normalise caller headers (Headers | Record | array) into a mutable instance
  const merged = new Headers(options.headers as HeadersInit | undefined);

  if (options.body instanceof FormData) {
    const boundary = '----Boundary' + Math.random().toString(36).slice(2);
    const formData = options.body;
    const parts: string[] = [];
    formData.forEach((value, key) => {
      parts.push(`--${boundary}`);
      parts.push(`Content-Disposition: form-data; name="${key}"`);
      parts.push('');
      parts.push(String(value));
    });
    parts.push(`--${boundary}--`);
    merged.set('content-type', `multipart/form-data; boundary=${boundary}`);
    merged.set('cookie', 'admin_auth=1');
    return new Request(`http://localhost${path}`, {
      ...options,
      body: parts.join('\r\n'),
      headers: merged,
    });
  }
  merged.set('cookie', 'admin_auth=1');
  return new Request(`http://localhost${path}`, {
    ...options,
    headers: merged,
  });
}

// DB mock
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

function setupMockDb() {
  vi.mocked(createDb).mockReturnValue(mockDb as any);
  mockAll.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
  mockRun.mockResolvedValue({});
  mockLimit.mockReturnThis();
  mockOffset.mockReturnThis();
  mockOrderBy.mockReturnThis();
  mockSelectFn.mockReturnThis();
  mockFrom.mockReturnThis();
  mockDeleteFn.mockReturnThis();
  mockWhere.mockReturnThis();
  mockUpdateFn.mockReturnThis();
  mockSet.mockReturnThis();
}

const authedLocals = { runtime: { env: { DB: {} } } };
const noDbLocals = { runtime: { env: {} } };

describe('GET /api/admin/songs - missing DB (authenticated)', () => {
  it('returns 500 when DB binding is absent', async () => {
    const resp = await GET({
      request: authedRequest('/api/admin/songs'),
      locals: noDbLocals,
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(500);
    const body = await resp.json();
    expect(body.message).toContain('D1 binding missing');
  });
});

describe('GET /api/admin/songs - success', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockDb();
  });

  it('returns 200 with songs list and pagination', async () => {
    const rows = [
      {
        id: 1,
        song_name: 'Beat',
        artist: 'Composer',
        bpm: 120,
        release_date: '2024-01-01',
        is_released: true,
        created_date: '2024-01-01T00:00:00Z',
        origin: 'AI',
        r2_key: 'songs/beat.mid',
      },
    ];
    mockAll.mockResolvedValue(rows);
    mockCount.mockResolvedValue(1);

    const resp = await GET({
      request: authedRequest('/api/admin/songs'),
      locals: authedLocals,
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.songs).toHaveLength(1);
    expect(body.songs[0].song_name).toBe('Beat');
    expect(body.pagination.total).toBe(1);
  });

  it('returns 500 when DB throws', async () => {
    mockCount.mockRejectedValue(new Error('DB error'));
    const resp = await GET({
      request: authedRequest('/api/admin/songs'),
      locals: authedLocals,
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(500);
  });
});

describe('DELETE /api/admin/songs - missing DB (authenticated)', () => {
  it('returns 500 when DB binding is absent', async () => {
    const resp = await DELETE({
      request: authedRequest('/api/admin/songs?id=1'),
      locals: noDbLocals,
      url: new URL('http://localhost/api/admin/songs?id=1'),
    } as any);
    expect(resp.status).toBe(500);
  });
});

describe('DELETE /api/admin/songs - success', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockDb();
  });

  it('returns 200 after successful deletion', async () => {
    const resp = await DELETE({
      request: authedRequest('/api/admin/songs?id=5'),
      locals: authedLocals,
      url: new URL('http://localhost/api/admin/songs?id=5'),
    } as any);
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.message).toContain('deleted successfully');
  });

  it('returns 400 for id=0 (not a positive integer)', async () => {
    const resp = await DELETE({
      request: authedRequest('/api/admin/songs?id=0'),
      locals: authedLocals,
      url: new URL('http://localhost/api/admin/songs?id=0'),
    } as any);
    expect(resp.status).toBe(400);
  });

  it('returns 500 when DB throws during deletion', async () => {
    mockWhere.mockReturnThis();
    mockRun.mockRejectedValue(new Error('DB error'));
    const resp = await DELETE({
      request: authedRequest('/api/admin/songs?id=1'),
      locals: authedLocals,
      url: new URL('http://localhost/api/admin/songs?id=1'),
    } as any);
    expect(resp.status).toBe(500);
  });
});

describe('PUT /api/admin/songs - missing DB (authenticated)', () => {
  it('returns 500 when DB binding is absent', async () => {
    const fd = new FormData();
    fd.append('id', '1');
    fd.append('song_name', 'Test');
    fd.append('artist', 'Artist');
    const resp = await PUT({
      request: authedRequest('/api/admin/songs', { method: 'PUT', body: fd }),
      locals: noDbLocals,
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(500);
  });
});

describe('PUT /api/admin/songs - validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockDb();
  });

  it('returns 400 when song_name is missing', async () => {
    const fd = new FormData();
    fd.append('id', '1');
    fd.append('artist', 'Artist');
    // song_name absent
    const resp = await PUT({
      request: authedRequest('/api/admin/songs', { method: 'PUT', body: fd }),
      locals: authedLocals,
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(400);
  });

  it('returns 400 when id is not a positive integer', async () => {
    const fd = new FormData();
    fd.append('id', '-5');
    fd.append('song_name', 'Test');
    fd.append('artist', 'Artist');
    const resp = await PUT({
      request: authedRequest('/api/admin/songs', { method: 'PUT', body: fd }),
      locals: authedLocals,
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(400);
  });
});

describe('PUT /api/admin/songs - success', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockDb();
  });

  it('returns 200 after successful update', async () => {
    const fd = new FormData();
    fd.append('id', '1');
    fd.append('song_name', 'Updated Song');
    fd.append('artist', 'New Artist');
    fd.append('bpm', '130');
    fd.append('release_date', '2024-06-01');
    fd.append('is_released', 'true');
    fd.append('origin', 'AI');

    const resp = await PUT({
      request: authedRequest('/api/admin/songs', { method: 'PUT', body: fd }),
      locals: authedLocals,
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.message).toContain('updated successfully');
  });

  it('returns 200 when bpm field is absent (optional)', async () => {
    const fd = new FormData();
    fd.append('id', '2');
    fd.append('song_name', 'No BPM Song');
    fd.append('artist', 'Artist');

    const resp = await PUT({
      request: authedRequest('/api/admin/songs', { method: 'PUT', body: fd }),
      locals: authedLocals,
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(200);
  });

  it('returns 500 when DB throws during update', async () => {
    mockRun.mockRejectedValue(new Error('DB write error'));
    const fd = new FormData();
    fd.append('id', '1');
    fd.append('song_name', 'Test');
    fd.append('artist', 'Artist');

    const resp = await PUT({
      request: authedRequest('/api/admin/songs', { method: 'PUT', body: fd }),
      locals: authedLocals,
      url: new URL('http://localhost/api/admin/songs'),
    } as any);
    expect(resp.status).toBe(500);
  });
});
