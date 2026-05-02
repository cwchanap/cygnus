/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/db', () => ({
  createDb: vi.fn(),
}));

import { createDb } from '../../src/lib/db';
import { GET } from '../../src/pages/api/songs';

const mockSongs = [
  {
    id: 1,
    song_name: 'Test Song',
    origin: 'AI',
    bpm: 120,
    release_date: '2024-01-01',
    preview_r2_key: null as string | null,
    categoryId: null as number | null,
    categoryName: null as string | null,
  },
];

function makeMockDb(songs = mockSongs, total = 1) {
  return {
    $count: vi.fn().mockResolvedValue(total),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue(songs),
  };
}

function makeApiEvent(url: string, env: Record<string, unknown> = { DB: {} }) {
  const req = new Request(url);
  return { locals: { runtime: { env } }, request: req } as any;
}

describe('GET /api/songs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns paginated songs with pagination metadata', async () => {
    vi.mocked(createDb).mockReturnValue(makeMockDb() as any);
    const resp = await GET(
      makeApiEvent('http://localhost/api/songs?page=1&limit=5')
    );
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.songs).toHaveLength(1);
    expect(body.songs[0].title).toBe('Test Song');
    expect(body.songs[0].categoryId).toBeNull();
    expect(body.songs[0].categoryName).toBeNull();
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(5);
    expect(body.pagination.total).toBe(1);
  });

  it('returns category metadata', async () => {
    vi.mocked(createDb).mockReturnValue(
      makeMockDb(
        [
          {
            id: 1,
            song_name: 'Test Song',
            origin: 'AI',
            bpm: 120,
            release_date: '2024-01-01',
            preview_r2_key: null,
            categoryId: 2,
            categoryName: 'Drum and Bass',
          },
        ],
        1
      ) as any
    );

    const resp = await GET(makeApiEvent('http://localhost/api/songs'));

    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.songs[0]).toMatchObject({
      categoryId: '2',
      categoryName: 'Drum and Bass',
    });
  });

  it('applies uncategorized category filter', async () => {
    const mockDb = makeMockDb([], 0);
    vi.mocked(createDb).mockReturnValue(mockDb as any);

    const resp = await GET(
      makeApiEvent('http://localhost/api/songs?category=uncategorized')
    );

    expect(resp.status).toBe(200);
    expect(mockDb.where).toHaveBeenCalled();
    expect(mockDb.$count).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything()
    );
  });

  it('returns 400 for invalid category filter', async () => {
    const mockDb = makeMockDb([], 0);
    vi.mocked(createDb).mockReturnValue(mockDb as any);

    const resp = await GET(
      makeApiEvent('http://localhost/api/songs?category=not-a-category')
    );

    expect(resp.status).toBe(400);
    expect(await resp.json()).toEqual({ message: 'Invalid category filter' });
    expect(createDb).not.toHaveBeenCalled();
  });

  it('applies category ID filter and uses filtered count', async () => {
    const mockDb = makeMockDb(
      [
        {
          id: 1,
          song_name: 'Test Song',
          origin: 'AI',
          bpm: 120,
          release_date: '2024-01-01',
          preview_r2_key: null,
          categoryId: 3,
          categoryName: 'House',
        },
      ],
      7
    );
    vi.mocked(createDb).mockReturnValue(mockDb as any);

    const resp = await GET(
      makeApiEvent('http://localhost/api/songs?category=3&limit=5')
    );

    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(mockDb.where).toHaveBeenCalled();
    expect(mockDb.$count).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything()
    );
    expect(body.pagination.total).toBe(7);
    expect(body.pagination.totalPages).toBe(2);
  });

  it('returns 500 when DB binding is missing', async () => {
    const resp = await GET(makeApiEvent('http://localhost/api/songs', {}));
    expect(resp.status).toBe(500);
  });

  it('caps limit at 50', async () => {
    const mockDb = makeMockDb([], 0);
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    await GET(makeApiEvent('http://localhost/api/songs?limit=999'));
    expect(mockDb.limit).toHaveBeenCalledWith(50);
  });

  it('uses default limit of 20 when not specified', async () => {
    const mockDb = makeMockDb([], 0);
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    await GET(makeApiEvent('http://localhost/api/songs'));
    expect(mockDb.limit).toHaveBeenCalledWith(20);
  });

  it('caps page at MAX_PAGE (1000) to prevent expensive OFFSET scans', async () => {
    const mockDb = makeMockDb([], 0);
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    const resp = await GET(
      makeApiEvent('http://localhost/api/songs?page=9999&limit=1')
    );
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as { pagination: { page: number } };
    // page should be capped at 1000, offset = (1000 - 1) * 1 = 999
    expect(body.pagination.page).toBe(1000);
    expect(mockDb.offset).toHaveBeenCalledWith(999);
  });

  it('returns totalPages as at least 1 when totalCount is 0', async () => {
    const mockDb = makeMockDb([], 0);
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    const resp = await GET(makeApiEvent('http://localhost/api/songs'));
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as {
      pagination: { total: number; totalPages: number };
    };
    expect(body.pagination.total).toBe(0);
    expect(body.pagination.totalPages).toBe(1);
  });

  it('emits previewUrl for audio previews (audio/ keys)', async () => {
    const songsWithAudioPreview = [
      {
        id: 1,
        song_name: 'Test Song',
        origin: 'AI',
        bpm: 120,
        release_date: '2024-01-01',
        preview_r2_key: 'audio/test-song.mp3',
        categoryId: null,
        categoryName: null,
      },
    ];
    vi.mocked(createDb).mockReturnValue(
      makeMockDb(songsWithAudioPreview, 1) as any
    );
    const resp = await GET(makeApiEvent('http://localhost/api/songs'));
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as {
      songs: Array<{
        previewUrl?: string;
        previewImage?: string;
        categoryId: string | null;
        categoryName: string | null;
      }>;
    };
    expect(body.songs[0].previewUrl).toBe(
      '/api/file?key=audio%2Ftest-song.mp3'
    );
    expect(body.songs[0].previewImage).toBeUndefined();
    expect(body.songs[0].categoryId).toBeNull();
    expect(body.songs[0].categoryName).toBeNull();
  });

  it('omits previewUrl for legacy/invalid keys that /api/file rejects (e.g., songs/, midi/)', async () => {
    const songsWithLegacyKey = [
      {
        id: 1,
        song_name: 'Test Song',
        origin: 'AI',
        bpm: 120,
        release_date: '2024-01-01',
        preview_r2_key: 'songs/test-song.mp3',
        categoryId: null,
        categoryName: null,
      },
    ];
    vi.mocked(createDb).mockReturnValue(
      makeMockDb(songsWithLegacyKey, 1) as any
    );
    const resp = await GET(makeApiEvent('http://localhost/api/songs'));
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as {
      songs: Array<{ previewUrl?: string; previewImage?: string }>;
    };
    expect(body.songs[0].previewUrl).toBeUndefined();
    expect(body.songs[0].previewImage).toBeUndefined();
  });

  it('emits previewImage for image previews (preview/ keys)', async () => {
    const songsWithImagePreview = [
      {
        id: 1,
        song_name: 'Test Song',
        origin: 'AI',
        bpm: 120,
        release_date: '2024-01-01',
        preview_r2_key: 'preview/123456-test.png',
        categoryId: null,
        categoryName: null,
      },
    ];
    vi.mocked(createDb).mockReturnValue(
      makeMockDb(songsWithImagePreview, 1) as any
    );
    const resp = await GET(makeApiEvent('http://localhost/api/songs'));
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as {
      songs: Array<{ previewUrl?: string; previewImage?: string }>;
    };
    expect(body.songs[0].previewUrl).toBeUndefined();
    expect(body.songs[0].previewImage).toBe(
      '/api/file?key=preview%2F123456-test.png'
    );
  });

  it('omits both previewUrl and previewImage when preview_r2_key is null', async () => {
    const songsWithoutPreview = [
      {
        id: 1,
        song_name: 'Test Song',
        origin: 'AI',
        bpm: 120,
        release_date: '2024-01-01',
        preview_r2_key: null,
        categoryId: null,
        categoryName: null,
      },
    ];
    vi.mocked(createDb).mockReturnValue(
      makeMockDb(songsWithoutPreview, 1) as any
    );
    const resp = await GET(makeApiEvent('http://localhost/api/songs'));
    expect(resp.status).toBe(200);
    const body = (await resp.json()) as {
      songs: Array<{ previewUrl?: string; previewImage?: string }>;
    };
    expect(body.songs[0].previewUrl).toBeUndefined();
    expect(body.songs[0].previewImage).toBeUndefined();
  });
});
