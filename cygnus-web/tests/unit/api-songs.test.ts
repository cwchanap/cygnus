/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/db', () => ({
  createDb: vi.fn(),
}));

import { createDb } from '../../src/lib/db';
import { GET } from '../../src/pages/api/songs';

const mockSongs = [
  { id: 1, song_name: 'Test Song', origin: 'AI', bpm: 120, release_date: '2024-01-01' },
];

function makeMockDb(songs = mockSongs, total = 1) {
  return {
    $count: vi.fn().mockResolvedValue(total),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue(songs),
  };
}

describe('GET /api/songs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns paginated songs with pagination metadata', async () => {
    vi.mocked(createDb).mockReturnValue(makeMockDb() as any);
    const req = new Request('http://localhost/api/songs?page=1&limit=5');
    const resp = await GET({ locals: { runtime: { env: { DB: {} } } }, request: req } as any);
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.songs).toHaveLength(1);
    expect(body.songs[0].title).toBe('Test Song');
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(5);
    expect(body.pagination.total).toBe(1);
  });

  it('returns 500 when DB binding is missing', async () => {
    const req = new Request('http://localhost/api/songs');
    const resp = await GET({ locals: { runtime: { env: {} } }, request: req } as any);
    expect(resp.status).toBe(500);
  });

  it('caps limit at 50', async () => {
    const mockDb = makeMockDb([], 0);
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    const req = new Request('http://localhost/api/songs?limit=999');
    await GET({ locals: { runtime: { env: { DB: {} } } }, request: req } as any);
    expect(mockDb.limit).toHaveBeenCalledWith(50);
  });

  it('uses default limit of 20 when not specified', async () => {
    const mockDb = makeMockDb([], 0);
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    const req = new Request('http://localhost/api/songs');
    await GET({ locals: { runtime: { env: { DB: {} } } }, request: req } as any);
    expect(mockDb.limit).toHaveBeenCalledWith(20);
  });

  it('caps page at MAX_PAGE (1000) to prevent expensive OFFSET scans', async () => {
    const mockDb = makeMockDb([], 0);
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    const req = new Request('http://localhost/api/songs?page=9999&limit=1');
    const resp = await GET({ locals: { runtime: { env: { DB: {} } } }, request: req } as any);
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { pagination: { page: number } };
    // page should be capped at 1000, offset = (1000 - 1) * 1 = 999
    expect(body.pagination.page).toBe(1000);
    expect(mockDb.offset).toHaveBeenCalledWith(999);
  });

  it('returns totalPages as at least 1 when totalCount is 0', async () => {
    const mockDb = makeMockDb([], 0);
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    const req = new Request('http://localhost/api/songs');
    const resp = await GET({ locals: { runtime: { env: { DB: {} } } }, request: req } as any);
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { pagination: { total: number; totalPages: number } };
    expect(body.pagination.total).toBe(0);
    expect(body.pagination.totalPages).toBe(1);
  });
});
