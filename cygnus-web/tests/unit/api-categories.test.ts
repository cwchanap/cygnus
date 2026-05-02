/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDb } from '../../src/lib/db';
import { categories } from '../../src/lib/db/schema';

vi.mock('../../src/lib/db', () => ({
  createDb: vi.fn(),
}));

import { GET } from '../../src/pages/api/categories';

const mockAll = vi.fn();
const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn().mockReturnThis();

const mockDb = {
  select: mockSelect,
  from: mockFrom,
  orderBy: mockOrderBy,
  all: mockAll,
};

function makeApiEvent(url: string, env: Record<string, unknown> = { DB: {} }) {
  return {
    locals: { runtime: { env } },
    request: new Request(url),
  } as any;
}

describe('GET /api/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    mockAll.mockResolvedValue([]);
    mockSelect.mockReturnThis();
    mockFrom.mockReturnThis();
    mockOrderBy.mockReturnThis();
  });

  it('returns configured categories', async () => {
    mockAll.mockResolvedValue([
      {
        id: 2,
        name: 'Drum and Bass',
        normalized_name: 'drum and bass',
        created_date: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 1,
        name: 'House',
        normalized_name: 'house',
        created_date: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const resp = await GET(makeApiEvent('http://localhost/api/categories'));

    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body).toEqual({
      categories: [
        { id: 2, name: 'Drum and Bass' },
        { id: 1, name: 'House' },
      ],
    });
    expect(mockFrom).toHaveBeenCalledWith(categories);
    expect(mockOrderBy).toHaveBeenCalled();
  });

  it('returns 500 when DB binding missing', async () => {
    const resp = await GET(makeApiEvent('http://localhost/api/categories', {}));

    expect(resp.status).toBe(500);
    expect(await resp.json()).toEqual({
      message: 'Server configuration error: D1 binding missing.',
    });
  });
});
