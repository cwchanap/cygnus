/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDb } from '../../src/lib/db';

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

const authedLocals = { runtime: { env: { DB: {} } } };

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
    expect(mockValues).toHaveBeenCalledWith({
      name: 'J Pop',
      normalized_name: 'j pop',
      created_date: expect.any(String),
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

  it('DELETE deletes a category and uncategorizes songs first', async () => {
    mockGet.mockResolvedValue({ id: 5, name: 'Metal' });

    const resp = await DELETE(routeContext('/api/admin/categories?id=5'));

    expect(resp.status).toBe(200);
    await expect(resp.json()).resolves.toEqual({
      message: 'Category deleted successfully',
    });
    expect(mockSet).toHaveBeenCalledWith({ category_id: null });
    expect(mockUpdate.mock.invocationCallOrder[0]).toBeLessThan(
      mockDelete.mock.invocationCallOrder[0]
    );
  });

  it('DELETE returns 400 for invalid ID', async () => {
    const resp = await DELETE(routeContext('/api/admin/categories?id=abc'));

    expect(resp.status).toBe(400);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
