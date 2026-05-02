/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn(),
}));

import { createDb } from '@/lib/db';
import { POST } from '../../src/pages/api/upload';

const mockRun = vi.fn().mockResolvedValue({});
const mockInsertValues = vi.fn().mockReturnValue({ run: mockRun });
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
const mockPut = vi.fn().mockResolvedValue(undefined);
const mockCount = vi.fn().mockResolvedValue(0);
const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockGet = vi.fn().mockResolvedValue(undefined);

const mockDb = {
  insert: mockInsert,
  $count: mockCount,
  select: mockSelect,
  from: mockFrom,
  where: mockWhere,
  get: mockGet,
};

const mockRuntime = {
  env: {
    DB: {},
    PASSKEY: 'secret',
    CYGNUS_BUCKET: { put: mockPut },
  },
};

// Create a mock file object with arrayBuffer support (jsdom File lacks arrayBuffer())
function mockFile(name: string, size = 1024, type = 'audio/mpeg') {
  return { name, size, type, arrayBuffer: async () => new ArrayBuffer(8) };
}

type FormEntryValue = string | ReturnType<typeof mockFile> | null;

// Build a mock Request that avoids jsdom's unimplemented formData() on File bodies
function makeRequest(
  options: {
    url?: string;
    origin?: string | null;
    referer?: string | null;
    cookie?: string | null;
    form?: Record<string, FormEntryValue>;
  } = {}
) {
  const url = options.url ?? 'http://localhost/api/upload';
  const rawHeaders: Record<string, string | null> = {
    origin: options.origin ?? null,
    referer: options.referer ?? null,
    cookie: options.cookie ?? null,
  };
  const form = options.form ?? {};

  return {
    url,
    headers: { get: (name: string) => rawHeaders[name.toLowerCase()] ?? null },
    formData: async () => ({
      get: (key: string) => (key in form ? form[key] : null),
    }),
  } as unknown as Request;
}

function makeFullForm(
  overrides: Record<string, FormEntryValue> = {}
): Record<string, FormEntryValue> {
  return {
    song: mockFile('track.mp3'),
    song_name: 'Test Track',
    artist: 'Test Artist',
    bpm: '120',
    release_date: '2024-01-01',
    is_released: 'true',
    origin: 'AI',
    ...overrides,
  };
}

describe('POST /api/upload - bindings check', () => {
  it('returns 500 when Cloudflare bindings are missing', async () => {
    const req = makeRequest();
    const resp = await POST({ request: req, locals: { runtime: null } } as any);
    expect(resp.status).toBe(500);
    const body = await resp.json();
    expect(body.message).toMatch(/bindings missing/i);
  });
});

describe('POST /api/upload - CSRF protection', () => {
  beforeEach(() => {
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    vi.clearAllMocks();
    mockRun.mockResolvedValue({});
    mockPut.mockResolvedValue(undefined);
    mockCount.mockResolvedValue(0);
    mockGet.mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockInsertValues });
    mockInsertValues.mockReturnValue({ run: mockRun });
    mockSelect.mockReturnThis();
    mockFrom.mockReturnThis();
    mockWhere.mockReturnThis();
  });

  it('allows request with no origin/referer headers (no header = assume ok)', async () => {
    const req = makeRequest({ form: makeFullForm({ passkey: 'secret' }) });
    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);
    expect(resp.status).toBe(200);
  });

  it('allows request with same-host origin', async () => {
    const req = makeRequest({
      form: makeFullForm({ passkey: 'secret' }),
      origin: 'http://localhost',
      referer: 'http://localhost/admin',
    });
    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);
    expect(resp.status).toBe(200);
  });

  it('blocks cross-origin request (CSRF)', async () => {
    const req = makeRequest({
      form: makeFullForm({ passkey: 'secret' }),
      origin: 'https://evil.com',
    });
    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);
    expect(resp.status).toBe(403);
    const body = await resp.json();
    expect(body.message).toMatch(/CSRF/i);
  });

  it('blocks request with cross-origin referer', async () => {
    const req = makeRequest({
      form: makeFullForm({ passkey: 'secret' }),
      referer: 'https://attacker.com/form',
    });
    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);
    expect(resp.status).toBe(403);
  });
});

describe('POST /api/upload - authentication', () => {
  beforeEach(() => {
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    vi.clearAllMocks();
    mockRun.mockResolvedValue({});
    mockPut.mockResolvedValue(undefined);
    mockCount.mockResolvedValue(0);
    mockGet.mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockInsertValues });
    mockInsertValues.mockReturnValue({ run: mockRun });
    mockSelect.mockReturnThis();
    mockFrom.mockReturnThis();
    mockWhere.mockReturnThis();
  });

  it('returns 401 when no auth cookie and no passkey', async () => {
    const req = makeRequest({ form: makeFullForm() });
    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);
    expect(resp.status).toBe(401);
  });

  it('returns 401 when passkey is wrong', async () => {
    const req = makeRequest({ form: makeFullForm({ passkey: 'wrongpass' }) });
    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);
    expect(resp.status).toBe(401);
  });

  it('allows upload with correct passkey in form', async () => {
    const req = makeRequest({ form: makeFullForm({ passkey: 'secret' }) });
    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);
    expect(resp.status).toBe(200);
  });

  it('allows upload with admin_auth=1 cookie (no passkey needed)', async () => {
    const req = makeRequest({ form: makeFullForm(), cookie: 'admin_auth=1' });
    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);
    expect(resp.status).toBe(200);
  });
});

describe('POST /api/upload - field validation', () => {
  beforeEach(() => {
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    vi.clearAllMocks();
    mockRun.mockResolvedValue({});
    mockPut.mockResolvedValue(undefined);
    mockCount.mockResolvedValue(0);
    mockGet.mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockInsertValues });
    mockInsertValues.mockReturnValue({ run: mockRun });
    mockSelect.mockReturnThis();
    mockFrom.mockReturnThis();
    mockWhere.mockReturnThis();
  });

  it('returns 400 when song file is missing', async () => {
    const req = makeRequest({
      form: makeFullForm({ song: null, passkey: 'secret' }),
    });
    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);
    expect(resp.status).toBe(400);
  });

  it('returns 400 when song_name is missing', async () => {
    const req = makeRequest({
      form: makeFullForm({ song_name: null, passkey: 'secret' }),
    });
    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);
    expect(resp.status).toBe(400);
  });

  it('returns 400 when artist is missing', async () => {
    const req = makeRequest({
      form: makeFullForm({ artist: null, passkey: 'secret' }),
    });
    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);
    expect(resp.status).toBe(400);
    const body = await resp.json();
    expect(body.message).toMatch(/missing required fields/i);
  });
});

describe('POST /api/upload - success case', () => {
  beforeEach(() => {
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    vi.clearAllMocks();
    mockRun.mockResolvedValue({});
    mockPut.mockResolvedValue(undefined);
    mockCount.mockResolvedValue(0);
    mockGet.mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockInsertValues });
    mockInsertValues.mockReturnValue({ run: mockRun });
    mockSelect.mockReturnThis();
    mockFrom.mockReturnThis();
    mockWhere.mockReturnThis();
  });

  it('uploads file to R2 and inserts into DB', async () => {
    const req = makeRequest({ form: makeFullForm({ passkey: 'secret' }) });
    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.message).toMatch(/uploaded successfully/i);
    expect(mockPut).toHaveBeenCalledOnce();
    expect(mockRun).toHaveBeenCalledOnce();
  });

  it('uploads preview image to R2 when provided', async () => {
    const req = makeRequest({
      form: makeFullForm({
        passkey: 'secret',
        preview_image: mockFile('cover.png', 512, 'image/png'),
      }),
    });
    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);
    expect(resp.status).toBe(200);
    // put called twice: song + preview image
    expect(mockPut).toHaveBeenCalledTimes(2);
  });

  it('skips preview upload when preview_image has size 0', async () => {
    const req = makeRequest({
      form: makeFullForm({
        passkey: 'secret',
        preview_image: mockFile('', 0, 'image/png'),
      }),
    });
    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);
    expect(resp.status).toBe(200);
    // put called once: only the song
    expect(mockPut).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/upload - category validation', () => {
  beforeEach(() => {
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    vi.clearAllMocks();
    mockRun.mockResolvedValue({});
    mockPut.mockResolvedValue(undefined);
    mockCount.mockResolvedValue(0);
    mockGet.mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockInsertValues });
    mockInsertValues.mockReturnValue({ run: mockRun });
    mockSelect.mockReturnThis();
    mockFrom.mockReturnThis();
    mockWhere.mockReturnThis();
  });

  it('requires categoryId when categories exist', async () => {
    mockCount.mockResolvedValue(1);
    const req = makeRequest({ form: makeFullForm({ passkey: 'secret' }) });

    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);

    expect(resp.status).toBe(400);
    const body = await resp.json();
    expect(body.message).toMatch(/category/i);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it('stores category_id when categoryId is valid', async () => {
    mockCount.mockResolvedValue(1);
    mockGet.mockResolvedValue({ id: 2 });
    const req = makeRequest({
      form: makeFullForm({ passkey: 'secret', categoryId: '2' }),
    });

    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);

    expect(resp.status).toBe(200);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: 2 })
    );
  });

  it('rejects invalid or nonexistent categoryId', async () => {
    mockCount.mockResolvedValue(1);
    mockGet.mockResolvedValue(undefined);
    const req = makeRequest({
      form: makeFullForm({ passkey: 'secret', categoryId: '999' }),
    });

    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);

    expect(resp.status).toBe(400);
    const body = await resp.json();
    expect(body.message).toMatch(/category/i);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it('allows missing categoryId when no categories exist and inserts category_id null', async () => {
    mockCount.mockResolvedValue(0);
    const req = makeRequest({ form: makeFullForm({ passkey: 'secret' }) });

    const resp = await POST({
      request: req,
      locals: { runtime: mockRuntime },
    } as any);

    expect(resp.status).toBe(200);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: null })
    );
  });
});

describe('POST /api/upload - error handling', () => {
  it('returns 500 when bucket.put throws', async () => {
    const failingRuntime = {
      env: {
        DB: {},
        PASSKEY: 'secret',
        CYGNUS_BUCKET: {
          put: vi.fn().mockRejectedValue(new Error('R2 unavailable')),
        },
      },
    };
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    const req = makeRequest({ form: makeFullForm({ passkey: 'secret' }) });
    const resp = await POST({
      request: req,
      locals: { runtime: failingRuntime },
    } as any);
    expect(resp.status).toBe(500);
    const body = await resp.json();
    expect(body.message).toMatch(/Upload failed/i);
  });
});
