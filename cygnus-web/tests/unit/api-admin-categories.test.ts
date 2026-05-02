/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDb } from '../../src/lib/db';
import { categories, songs } from '../../src/lib/db/schema';

vi.mock('../../src/lib/db', () => ({
  createDb: vi.fn(),
}));

import { DELETE, GET, POST, PUT } from '../../src/pages/api/admin/categories';

const mockAll = vi.fn();
const mockGet = vi.fn();
const mockRun = vi.fn();
const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockValues = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();
const mockSet = vi.fn().mockReturnThis();
const mockDelete = vi.fn().mockReturnThis();
const mockBatch = vi.fn();
const mockBind = vi.fn();
const mockPrepare = vi.fn();

const mockDb = {
  select: mockSelect,
  from: mockFrom,
  orderBy: mockOrderBy,
  where: mockWhere,
  all: mockAll,
  get: mockGet,
  insert: mockInsert,
  values: mockValues,
  update: mockUpdate,
  set: mockSet,
  delete: mockDelete,
  run: mockRun,
};

const mockD1 = {
  batch: mockBatch,
  prepare: mockPrepare,
};

const authedLocals = { runtime: { env: { DB: mockD1 } } };
const noDbLocals = { runtime: { env: {} } };

function makeRequest(
  path = '/api/admin/categories',
  options: RequestInit = {}
) {
  return new Request(`http://localhost${path}`, {
    ...options,
    headers: {
      cookie: 'admin_auth=1',
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
}

function routeContext(
  path = '/api/admin/categories',
  options: RequestInit = {}
) {
  return {
    request: makeRequest(path, options),
    locals: authedLocals,
    url: new URL(`http://localhost${path}`),
  } as any;
}

function unauthedRouteContext(
  path = '/api/admin/categories',
  options: RequestInit = {}
) {
  return {
    request: new Request(`http://localhost${path}`, options),
    locals: authedLocals,
    url: new URL(`http://localhost${path}`),
  } as any;
}

function noDbRouteContext(
  path = '/api/admin/categories',
  options: RequestInit = {}
) {
  return {
    request: makeRequest(path, options),
    locals: noDbLocals,
    url: new URL(`http://localhost${path}`),
  } as any;
}

function jsonRequest(body: unknown, method: string) {
  return {
    method,
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  };
}

function setupDb() {
  vi.mocked(createDb).mockReturnValue(mockDb as any);
  mockAll.mockResolvedValue([]);
  mockGet.mockResolvedValue(undefined);
  mockRun.mockResolvedValue({});
  mockSelect.mockReturnThis();
  mockFrom.mockReturnThis();
  mockOrderBy.mockReturnThis();
  mockWhere.mockReturnThis();
  mockInsert.mockReturnThis();
  mockValues.mockReturnThis();
  mockUpdate.mockReturnThis();
  mockSet.mockReturnThis();
  mockDelete.mockReturnThis();
  mockBatch.mockResolvedValue([]);
  mockBind.mockImplementation(function bind(this: unknown) {
    return this;
  });
  mockPrepare.mockImplementation((sql: string) => ({
    sql,
    bind: mockBind,
  }));
}

describe('/api/admin/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDb();
  });

  it('GET requires admin auth', async () => {
    const resp = await GET({
      request: new Request('http://localhost/api/admin/categories'),
      locals: authedLocals,
      url: new URL('http://localhost/api/admin/categories'),
    } as any);

    expect(resp.status).toBe(401);
    await expect(resp.json()).resolves.toEqual({ message: 'Unauthorized' });
    expect(createDb).not.toHaveBeenCalled();
  });

  it('POST requires admin auth', async () => {
    const resp = await POST(
      unauthedRouteContext(
        '/api/admin/categories',
        jsonRequest({ name: 'Rock' }, 'POST')
      )
    );

    expect(resp.status).toBe(401);
    await expect(resp.json()).resolves.toEqual({ message: 'Unauthorized' });
    expect(createDb).not.toHaveBeenCalled();
  });

  it('PUT requires admin auth', async () => {
    const resp = await PUT(
      unauthedRouteContext(
        '/api/admin/categories',
        jsonRequest({ id: 1, name: 'Rock' }, 'PUT')
      )
    );

    expect(resp.status).toBe(401);
    await expect(resp.json()).resolves.toEqual({ message: 'Unauthorized' });
    expect(createDb).not.toHaveBeenCalled();
  });

  it('DELETE requires admin auth', async () => {
    const resp = await DELETE(
      unauthedRouteContext('/api/admin/categories?id=1')
    );

    expect(resp.status).toBe(401);
    await expect(resp.json()).resolves.toEqual({ message: 'Unauthorized' });
    expect(createDb).not.toHaveBeenCalled();
  });

  it('GET returns 500 JSON when D1 binding is missing', async () => {
    const resp = await GET(noDbRouteContext());

    expect(resp.status).toBe(500);
    await expect(resp.json()).resolves.toEqual({
      message: 'Server configuration error: D1 binding missing.',
    });
    expect(createDb).not.toHaveBeenCalled();
  });

  it('POST returns 500 JSON when D1 binding is missing', async () => {
    const resp = await POST(
      noDbRouteContext(
        '/api/admin/categories',
        jsonRequest({ name: 'Rock' }, 'POST')
      )
    );

    expect(resp.status).toBe(500);
    await expect(resp.json()).resolves.toEqual({
      message: 'Server configuration error: D1 binding missing.',
    });
    expect(createDb).not.toHaveBeenCalled();
  });

  it('PUT returns 500 JSON when D1 binding is missing', async () => {
    const resp = await PUT(
      noDbRouteContext(
        '/api/admin/categories',
        jsonRequest({ id: 1, name: 'Rock' }, 'PUT')
      )
    );

    expect(resp.status).toBe(500);
    await expect(resp.json()).resolves.toEqual({
      message: 'Server configuration error: D1 binding missing.',
    });
    expect(createDb).not.toHaveBeenCalled();
  });

  it('DELETE returns 500 JSON when D1 binding is missing', async () => {
    const resp = await DELETE(noDbRouteContext('/api/admin/categories?id=1'));

    expect(resp.status).toBe(500);
    await expect(resp.json()).resolves.toEqual({
      message: 'Server configuration error: D1 binding missing.',
    });
    expect(createDb).not.toHaveBeenCalled();
  });

  it('GET lists categories as id and name', async () => {
    mockAll.mockResolvedValue([
      {
        id: 1,
        name: 'Ambient',
        normalized_name: 'ambient',
        created_date: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        name: 'Rock',
        normalized_name: 'rock',
        created_date: '2026-01-02T00:00:00.000Z',
      },
    ]);

    const resp = await GET(routeContext());

    expect(resp.status).toBe(200);
    await expect(resp.json()).resolves.toEqual({
      categories: [
        { id: 1, name: 'Ambient' },
        { id: 2, name: 'Rock' },
      ],
    });
    expect(mockOrderBy).toHaveBeenCalledOnce();
  });

  it('POST rejects empty names', async () => {
    const resp = await POST(
      routeContext(
        '/api/admin/categories',
        jsonRequest({ name: '   ' }, 'POST')
      )
    );

    expect(resp.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('POST returns 400 for malformed JSON', async () => {
    const resp = await POST(
      routeContext('/api/admin/categories', {
        method: 'POST',
        body: '{"name":',
        headers: { 'content-type': 'application/json' },
      })
    );

    expect(resp.status).toBe(400);
    await expect(resp.json()).resolves.toEqual({
      message: 'Invalid JSON body',
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('POST returns 400 for a null JSON body', async () => {
    const resp = await POST(
      routeContext('/api/admin/categories', {
        method: 'POST',
        body: 'null',
        headers: { 'content-type': 'application/json' },
      })
    );

    expect(resp.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('POST rejects duplicate normalized names', async () => {
    mockGet.mockResolvedValue({ id: 1, name: 'Rock' });

    const resp = await POST(
      routeContext(
        '/api/admin/categories',
        jsonRequest({ name: '  rock  ' }, 'POST')
      )
    );

    expect(resp.status).toBe(409);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('POST creates with trimmed display name and normalized name', async () => {
    const resp = await POST(
      routeContext(
        '/api/admin/categories',
        jsonRequest({ name: '  J Pop  ' }, 'POST')
      )
    );

    expect(resp.status).toBe(201);
    await expect(resp.json()).resolves.toEqual({
      message: 'Category created successfully',
    });
    expect(mockFrom).toHaveBeenCalledWith(categories);
    expect(mockInsert).toHaveBeenCalledWith(categories);
    expect(mockValues).toHaveBeenCalledWith({
      name: 'J Pop',
      normalized_name: 'j pop',
      created_date: expect.any(String),
    });
  });

  it('POST maps insert unique constraint races to duplicate validation', async () => {
    mockRun.mockRejectedValue(
      new Error(
        'D1_ERROR: UNIQUE constraint failed: categories.normalized_name'
      )
    );

    const resp = await POST(
      routeContext(
        '/api/admin/categories',
        jsonRequest({ name: 'Rock' }, 'POST')
      )
    );

    expect(resp.status).toBe(409);
    await expect(resp.json()).resolves.toEqual({
      message: 'Category already exists',
    });
  });

  it('PUT renames an existing category', async () => {
    mockGet
      .mockResolvedValueOnce({ id: 3, name: 'Rock' })
      .mockResolvedValueOnce(undefined);

    const resp = await PUT(
      routeContext(
        '/api/admin/categories',
        jsonRequest({ id: 3, name: '  Progressive Rock  ' }, 'PUT')
      )
    );

    expect(resp.status).toBe(200);
    await expect(resp.json()).resolves.toEqual({
      message: 'Category updated successfully',
    });
    expect(mockSet).toHaveBeenCalledWith({
      name: 'Progressive Rock',
      normalized_name: 'progressive rock',
    });
  });

  it('PUT returns 400 for invalid category ID', async () => {
    const resp = await PUT(
      routeContext(
        '/api/admin/categories',
        jsonRequest({ id: 'abc', name: 'Rock' }, 'PUT')
      )
    );

    expect(resp.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('PUT returns 400 for non-positive category ID', async () => {
    const resp = await PUT(
      routeContext(
        '/api/admin/categories',
        jsonRequest({ id: 0, name: 'Rock' }, 'PUT')
      )
    );

    expect(resp.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('PUT returns 400 for empty trimmed name', async () => {
    const resp = await PUT(
      routeContext(
        '/api/admin/categories',
        jsonRequest({ id: 1, name: '   ' }, 'PUT')
      )
    );

    expect(resp.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('PUT returns 400 for a null JSON body', async () => {
    const resp = await PUT(
      routeContext('/api/admin/categories', {
        method: 'PUT',
        body: 'null',
        headers: { 'content-type': 'application/json' },
      })
    );

    expect(resp.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('PUT rejects duplicate normalized names from a different category', async () => {
    mockGet
      .mockResolvedValueOnce({ id: 3, name: 'Rock' })
      .mockResolvedValueOnce({ id: 4, name: 'Metal' });

    const resp = await PUT(
      routeContext(
        '/api/admin/categories',
        jsonRequest({ id: 3, name: '  metal  ' }, 'PUT')
      )
    );

    expect(resp.status).toBe(409);
    await expect(resp.json()).resolves.toEqual({
      message: 'Category already exists',
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('PUT returns 404 for missing category ID', async () => {
    mockGet.mockResolvedValue(undefined);

    const resp = await PUT(
      routeContext(
        '/api/admin/categories',
        jsonRequest({ id: 404, name: 'Rock' }, 'PUT')
      )
    );

    expect(resp.status).toBe(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('DELETE returns 404 when valid category ID does not exist', async () => {
    mockGet.mockResolvedValue(undefined);

    const resp = await DELETE(routeContext('/api/admin/categories?id=404'));

    expect(resp.status).toBe(404);
    await expect(resp.json()).resolves.toEqual({
      message: 'Category not found',
    });
    expect(mockBatch).not.toHaveBeenCalled();
  });

  it('DELETE deletes a category and uncategorizes songs first', async () => {
    mockGet.mockResolvedValue({ id: 5, name: 'Metal' });

    const resp = await DELETE(routeContext('/api/admin/categories?id=5'));

    expect(resp.status).toBe(200);
    await expect(resp.json()).resolves.toEqual({
      message: 'Category deleted successfully',
    });
    expect(mockFrom).toHaveBeenCalledWith(categories);
    expect(mockUpdate).not.toHaveBeenCalledWith(songs);
    expect(mockDelete).not.toHaveBeenCalledWith(categories);
    expect(mockBatch).toHaveBeenCalledOnce();
    const [statements] = mockBatch.mock.calls[0];
    expect(statements).toHaveLength(2);
    expect(mockPrepare.mock.calls[0][0]).toContain(
      'UPDATE songs SET category_id = NULL WHERE category_id = ?'
    );
    expect(mockPrepare.mock.calls[1][0]).toContain(
      'DELETE FROM categories WHERE id = ?'
    );
    expect(mockPrepare.mock.invocationCallOrder[0]).toBeLessThan(
      mockPrepare.mock.invocationCallOrder[1]
    );
    expect(mockBind).toHaveBeenNthCalledWith(1, 5);
    expect(mockBind).toHaveBeenNthCalledWith(2, 5);
  });

  it('DELETE returns 400 for invalid ID', async () => {
    const resp = await DELETE(routeContext('/api/admin/categories?id=abc'));

    expect(resp.status).toBe(400);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
