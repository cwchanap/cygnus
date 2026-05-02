# Song Category Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-configured song categories, require songs to use configured categories when available, and expose category display/filtering in the public music gallery.

**Architecture:** Add a `categories` table and nullable `songs.category_id`, then expose category CRUD through an authenticated admin API. Upload, admin song edit, and public songs APIs will share the same category validation and response shape. UI changes stay local to the existing admin song workflow and public gallery components.

**Tech Stack:** Astro 5 API routes, Svelte 5 components, Cloudflare D1 with Drizzle ORM, Vitest unit tests, Playwright e2e tests, Bun/Nx scripts.

---

## File Structure

- Create `cygnus-web/migrations/0003_add_categories.sql`: D1 migration for `categories`, unique normalized names, and `songs.category_id`.
- Modify `cygnus-web/src/lib/db/schema.ts`: Drizzle `categories` table and `songs.category_id`.
- Create `cygnus-web/src/lib/categories.ts`: category normalization, parsing, and validation helpers shared by routes.
- Create `cygnus-web/src/pages/api/admin/categories.ts`: authenticated category CRUD.
- Create `cygnus-web/src/pages/api/categories.ts`: public category list endpoint.
- Modify `cygnus-web/src/pages/api/upload.ts`: accept and validate `categoryId` before inserting songs.
- Modify `cygnus-web/src/pages/api/admin/songs.ts`: return category metadata and validate `categoryId` on update.
- Modify `cygnus-web/src/pages/api/songs.ts`: return category metadata and support category filtering.
- Create `cygnus-web/src/components/CategoryManagement.svelte`: focused admin category management UI.
- Modify `cygnus-web/src/components/AdminUpload.svelte`: category select on upload.
- Modify `cygnus-web/src/components/SongManagement.svelte`: category display/edit in song table.
- Modify `cygnus-web/src/components/MusicHome.svelte`: load categories, filter visible songs, and selected-song adjustment.
- Modify `cygnus-web/src/components/SongList.svelte`: show category labels in the library list.
- Modify `cygnus-web/src/components/SongDetail.svelte`: show category in selected song detail.
- Add and update unit tests under `cygnus-web/tests/unit/`.
- Update focused e2e coverage in `cygnus-web-e2e/tests/admin-song-management.spec.ts`.

## Task 1: Schema And Category Helpers

**Files:**
- Create: `cygnus-web/migrations/0003_add_categories.sql`
- Modify: `cygnus-web/src/lib/db/schema.ts`
- Create: `cygnus-web/src/lib/categories.ts`
- Test: `cygnus-web/tests/unit/categories.test.ts`

- [ ] **Step 1: Write failing helper tests**

Create `cygnus-web/tests/unit/categories.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  normalizeCategoryName,
  parseCategoryId,
  categoryDisplayName,
} from '../../src/lib/categories';

describe('category helpers', () => {
  it('normalizes names by trimming and lowercasing', () => {
    expect(normalizeCategoryName('  J Pop  ')).toBe('j pop');
    expect(normalizeCategoryName('METAL')).toBe('metal');
  });

  it('rejects blank normalized names', () => {
    expect(normalizeCategoryName('   ')).toBe('');
  });

  it('parses positive category IDs', () => {
    expect(parseCategoryId('42')).toBe(42);
  });

  it('returns null for missing or invalid category IDs', () => {
    expect(parseCategoryId(null)).toBeNull();
    expect(parseCategoryId('')).toBeNull();
    expect(parseCategoryId('abc')).toBeNull();
    expect(parseCategoryId('-1')).toBeNull();
  });

  it('uses Uncategorized when category name is missing', () => {
    expect(categoryDisplayName(null)).toBe('Uncategorized');
    expect(categoryDisplayName('Metal')).toBe('Metal');
  });
});
```

- [ ] **Step 2: Run helper tests to verify failure**

Run: `bun run test:unit -- categories.test.ts`

Expected: FAIL because `cygnus-web/src/lib/categories.ts` does not exist.

- [ ] **Step 3: Add migration**

Create `cygnus-web/migrations/0003_add_categories.sql`:

```sql
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_date TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_normalized_name_unique
  ON categories (normalized_name);

ALTER TABLE songs ADD COLUMN category_id INTEGER;
```

- [ ] **Step 4: Update Drizzle schema**

In `cygnus-web/src/lib/db/schema.ts`, add `categories` and `category_id`:

```ts
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  normalized_name: text('normalized_name').notNull().unique(),
  created_date: text('created_date').notNull(),
});

export const songs = sqliteTable('songs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  song_name: text('song_name').notNull(),
  artist: text('artist').notNull(),
  bpm: integer('bpm').notNull(),
  release_date: text('release_date').notNull(),
  is_released: integer('is_released', { mode: 'boolean' }).notNull(),
  created_date: text('created_date').notNull(),
  origin: text('origin').notNull(),
  r2_key: text('r2_key').notNull(),
  preview_r2_key: text('preview_r2_key'),
  category_id: integer('category_id'),
});

export const schema = { songs, categories };
```

- [ ] **Step 5: Add category helper module**

Create `cygnus-web/src/lib/categories.ts`:

```ts
export type CategoryDto = {
  id: number;
  name: string;
};

export function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

export function parseCategoryId(value: FormDataEntryValue | string | null): number | null {
  if (value == null) return null;
  const raw = String(value).trim();
  if (raw === '') return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function categoryDisplayName(name: string | null | undefined): string {
  return name ?? 'Uncategorized';
}
```

- [ ] **Step 6: Run helper tests to verify pass**

Run: `bun run test:unit -- categories.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit schema and helpers**

```bash
git add cygnus-web/migrations/0003_add_categories.sql cygnus-web/src/lib/db/schema.ts cygnus-web/src/lib/categories.ts cygnus-web/tests/unit/categories.test.ts
git commit -m "feat: add category schema and helpers"
```

## Task 2: Admin Category API

**Files:**
- Create: `cygnus-web/src/pages/api/admin/categories.ts`
- Test: `cygnus-web/tests/unit/api-admin-categories.test.ts`

- [ ] **Step 1: Write failing admin category API tests**

Create `cygnus-web/tests/unit/api-admin-categories.test.ts` with mocked Drizzle chains:

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/db', () => ({ createDb: vi.fn() }));

import { createDb } from '../../src/lib/db';
import { DELETE, GET, POST, PUT } from '../../src/pages/api/admin/categories';

const mockAll = vi.fn();
const mockGet = vi.fn();
const mockRun = vi.fn();
const mockValues = vi.fn(() => ({ run: mockRun }));
const mockSet = vi.fn(() => ({ where: vi.fn(() => ({ run: mockRun })) }));
const mockWhereRun = vi.fn(() => ({ run: mockRun }));

const mockDb = {
  select: vi.fn(() => mockDb),
  from: vi.fn(() => mockDb),
  orderBy: vi.fn(() => mockDb),
  where: vi.fn(() => mockDb),
  all: mockAll,
  get: mockGet,
  insert: vi.fn(() => ({ values: mockValues })),
  update: vi.fn(() => ({ set: mockSet })),
  delete: vi.fn(() => ({ where: mockWhereRun })),
};

function authedRequest(path = '/api/admin/categories', init: RequestInit = {}) {
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: {
      cookie: 'admin_auth=1',
      ...((init.headers as Record<string, string>) ?? {}),
    },
  });
}

function jsonRequest(body: unknown, method = 'POST') {
  return authedRequest('/api/admin/categories', {
    method,
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('/api/admin/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createDb).mockReturnValue(mockDb as any);
    mockAll.mockResolvedValue([{ id: 1, name: 'Metal', normalized_name: 'metal' }]);
    mockGet.mockResolvedValue(null);
    mockRun.mockResolvedValue({});
  });

  it('requires admin auth', async () => {
    const resp = await GET({
      request: new Request('http://localhost/api/admin/categories'),
      locals: { runtime: { env: { DB: {} } } },
    } as any);
    expect(resp.status).toBe(401);
  });

  it('lists categories', async () => {
    const resp = await GET({
      request: authedRequest(),
      locals: { runtime: { env: { DB: {} } } },
    } as any);
    expect(resp.status).toBe(200);
    await expect(resp.json()).resolves.toEqual({
      categories: [{ id: 1, name: 'Metal' }],
    });
  });

  it('rejects empty category names', async () => {
    const resp = await POST({
      request: jsonRequest({ name: '   ' }),
      locals: { runtime: { env: { DB: {} } } },
    } as any);
    expect(resp.status).toBe(400);
  });

  it('rejects duplicate normalized names', async () => {
    mockGet.mockResolvedValue({ id: 1, name: 'Metal' });
    const resp = await POST({
      request: jsonRequest({ name: ' metal ' }),
      locals: { runtime: { env: { DB: {} } } },
    } as any);
    expect(resp.status).toBe(400);
  });

  it('creates a category', async () => {
    const resp = await POST({
      request: jsonRequest({ name: 'J Pop' }),
      locals: { runtime: { env: { DB: {} } } },
    } as any);
    expect(resp.status).toBe(201);
    expect(mockValues).toHaveBeenCalledWith({
      name: 'J Pop',
      normalized_name: 'j pop',
      created_date: expect.any(String),
    });
  });

  it('renames a category', async () => {
    mockGet.mockResolvedValueOnce({ id: 2, name: 'Rock' }).mockResolvedValueOnce(null);
    const resp = await PUT({
      request: jsonRequest({ id: 2, name: 'Alt Rock' }, 'PUT'),
      locals: { runtime: { env: { DB: {} } } },
    } as any);
    expect(resp.status).toBe(200);
    expect(mockSet).toHaveBeenCalledWith({
      name: 'Alt Rock',
      normalized_name: 'alt rock',
    });
  });

  it('deletes a category and uncategorizes songs', async () => {
    mockGet.mockResolvedValue({ id: 3, name: 'Metal' });
    const resp = await DELETE({
      request: authedRequest('/api/admin/categories?id=3', { method: 'DELETE' }),
      locals: { runtime: { env: { DB: {} } } },
      url: new URL('http://localhost/api/admin/categories?id=3'),
    } as any);
    expect(resp.status).toBe(200);
    expect(mockSet).toHaveBeenCalledWith({ category_id: null });
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `bun run test:unit -- api-admin-categories.test.ts`

Expected: FAIL because the API route does not exist.

- [ ] **Step 3: Implement `/api/admin/categories`**

Create `cygnus-web/src/pages/api/admin/categories.ts` with authenticated handlers using `isAdminAuthed`, `createDb`, `categories`, `songs`, `eq`, and `asc`.

Key implementation shape:

```ts
import type { APIRoute } from 'astro';
import { asc, eq } from 'drizzle-orm';
import { isAdminAuthed } from '../../../lib/auth';
import { normalizeCategoryName, parseCategoryId } from '../../../lib/categories';
import { createDb } from '../../../lib/db';
import { categories, songs } from '../../../lib/db/schema';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function requireDb(request: Request, locals: App.Locals) {
  if (!isAdminAuthed(request)) return { response: json({ message: 'Unauthorized' }, 401) };
  const runtime = locals.runtime;
  if (!runtime?.env?.DB) {
    return { response: json({ message: 'Server configuration error: D1 binding missing.' }, 500) };
  }
  return { db: createDb(runtime.env.DB) };
}
```

Implement each handler with these responses:

- `GET`: `{ categories: rows.map(({ id, name }) => ({ id, name })) }`
- `POST`: `201` with `{ message: 'Category created successfully' }`
- `PUT`: `200` with `{ message: 'Category updated successfully' }`
- `DELETE`: `200` with `{ message: 'Category deleted successfully' }`

- [ ] **Step 4: Run admin category API tests**

Run: `bun run test:unit -- api-admin-categories.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit admin category API**

```bash
git add cygnus-web/src/pages/api/admin/categories.ts cygnus-web/tests/unit/api-admin-categories.test.ts
git commit -m "feat: add admin category API"
```

## Task 3: Upload And Admin Song Category Validation

**Files:**
- Modify: `cygnus-web/src/pages/api/upload.ts`
- Modify: `cygnus-web/src/pages/api/admin/songs.ts`
- Test: `cygnus-web/tests/unit/api-upload.test.ts`
- Test: `cygnus-web/tests/unit/api-admin-songs.test.ts`

- [ ] **Step 1: Add failing upload validation tests**

Append tests to `cygnus-web/tests/unit/api-upload.test.ts`:

```ts
it('requires categoryId when categories exist', async () => {
  const categoryCountDb = {
    $count: vi.fn().mockResolvedValue(1),
    insert: mockInsert,
  };
  vi.mocked(createDb).mockReturnValue(categoryCountDb as any);
  const req = makeRequest({ form: makeFullForm({ passkey: 'secret' }) });
  const resp = await POST({ request: req, locals: { runtime: mockRuntime } } as any);
  expect(resp.status).toBe(400);
  await expect(resp.json()).resolves.toMatchObject({
    message: expect.stringMatching(/category/i),
  });
});

it('stores category_id when categoryId is valid', async () => {
  const mockGet = vi.fn().mockResolvedValue({ id: 7, name: 'Metal' });
  const categoryDb = {
    $count: vi.fn().mockResolvedValue(1),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    get: mockGet,
    insert: mockInsert,
  };
  vi.mocked(createDb).mockReturnValue(categoryDb as any);
  const req = makeRequest({
    form: makeFullForm({ passkey: 'secret', categoryId: '7' }),
  });
  const resp = await POST({ request: req, locals: { runtime: mockRuntime } } as any);
  expect(resp.status).toBe(200);
  expect(mockInsertValues).toHaveBeenCalledWith(
    expect.objectContaining({ category_id: 7 })
  );
});
```

- [ ] **Step 2: Add failing admin song update tests**

Append tests to `cygnus-web/tests/unit/api-admin-songs.test.ts`:

```ts
it('returns category metadata in admin song list', async () => {
  mockAll.mockResolvedValue([
    {
      id: 1,
      song_name: 'Song',
      artist: 'Artist',
      bpm: 120,
      release_date: '2024-01-01',
      is_released: true,
      created_date: '2024-01-01T00:00:00.000Z',
      origin: 'AI',
      r2_key: 'songs/song.mp3',
      category_id: 4,
      category_name: 'Metal',
    },
  ]);
  mockCount.mockResolvedValue(1);
  const resp = await GET({
    request: makeAuthedRequest('/api/admin/songs'),
    locals: { runtime: { env: { DB: {} } } },
    url: new URL('http://localhost/api/admin/songs'),
  } as any);
  expect(resp.status).toBe(200);
  const body = await resp.json();
  expect(body.songs[0]).toMatchObject({
    categoryId: 4,
    categoryName: 'Metal',
  });
});

it('requires categoryId on update when categories exist', async () => {
  const formData = new FormData();
  formData.append('id', '1');
  formData.append('song_name', 'Test');
  formData.append('artist', 'Artist');
  formData.append('bpm', '120');
  const categoryDb = {
    $count: vi.fn().mockResolvedValue(1),
  };
  vi.mocked(createDb).mockReturnValue(categoryDb as any);
  const resp = await PUT({
    request: makeAuthedRequest('/api/admin/songs', { method: 'PUT', body: formData }),
    locals: { runtime: { env: { DB: {} } } },
    url: new URL('http://localhost/api/admin/songs'),
  } as any);
  expect(resp.status).toBe(400);
});
```

- [ ] **Step 3: Run tests to verify failure**

Run: `bun run test:unit -- api-upload.test.ts api-admin-songs.test.ts`

Expected: FAIL because category validation and response fields are missing.

- [ ] **Step 4: Add route-local validation flow**

In both routes, use this sequence:

```ts
const categoryCount = await db.$count(categories);
const parsedCategoryId = parseCategoryId(formData.get('categoryId'));

if (categoryCount > 0 && !parsedCategoryId) {
  return new Response(JSON.stringify({ message: 'Category is required' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

let categoryId: number | null = null;
if (parsedCategoryId) {
  const category = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, parsedCategoryId))
    .get();

  if (!category) {
    return new Response(JSON.stringify({ message: 'Category does not exist' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  categoryId = parsedCategoryId;
}
```

Then include `category_id: categoryId` in insert/update values.

- [ ] **Step 5: Return category metadata from admin song list**

Update `/api/admin/songs` `GET` to use a left join or selected SQL alias returning `category_id` and category name. The response object must include:

```ts
categoryId: song.category_id,
categoryName: song.category_name ?? null,
```

- [ ] **Step 6: Run route tests**

Run: `bun run test:unit -- api-upload.test.ts api-admin-songs.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit song category validation**

```bash
git add cygnus-web/src/pages/api/upload.ts cygnus-web/src/pages/api/admin/songs.ts cygnus-web/tests/unit/api-upload.test.ts cygnus-web/tests/unit/api-admin-songs.test.ts
git commit -m "feat: validate song categories in admin flows"
```

## Task 4: Public Category APIs

**Files:**
- Create: `cygnus-web/src/pages/api/categories.ts`
- Modify: `cygnus-web/src/pages/api/songs.ts`
- Test: `cygnus-web/tests/unit/api-categories.test.ts`
- Test: `cygnus-web/tests/unit/api-songs.test.ts`

- [ ] **Step 1: Write failing public categories test**

Create `cygnus-web/tests/unit/api-categories.test.ts`:

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/db', () => ({ createDb: vi.fn() }));

import { createDb } from '../../src/lib/db';
import { GET } from '../../src/pages/api/categories';

describe('GET /api/categories', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns configured categories', async () => {
    const db = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue([
        { id: 1, name: 'J Pop' },
        { id: 2, name: 'Metal' },
      ]),
    };
    vi.mocked(createDb).mockReturnValue(db as any);
    const resp = await GET({
      request: new Request('http://localhost/api/categories'),
      locals: { runtime: { env: { DB: {} } } },
    } as any);
    expect(resp.status).toBe(200);
    await expect(resp.json()).resolves.toEqual({
      categories: [
        { id: 1, name: 'J Pop' },
        { id: 2, name: 'Metal' },
      ],
    });
  });

  it('returns 500 when DB binding is missing', async () => {
    const resp = await GET({
      request: new Request('http://localhost/api/categories'),
      locals: { runtime: { env: {} } },
    } as any);
    expect(resp.status).toBe(500);
  });
});
```

- [ ] **Step 2: Add failing public song category tests**

Append to `cygnus-web/tests/unit/api-songs.test.ts`:

```ts
it('returns category metadata for songs', async () => {
  vi.mocked(createDb).mockReturnValue(
    makeMockDb([
      {
        id: 1,
        song_name: 'Test Song',
        origin: 'AI',
        bpm: 120,
        release_date: '2024-01-01',
        preview_r2_key: null,
        category_id: 5,
        category_name: 'Metal',
      },
    ], 1) as any
  );
  const resp = await GET(makeApiEvent('http://localhost/api/songs'));
  const body = await resp.json();
  expect(body.songs[0]).toMatchObject({
    categoryId: 5,
    categoryName: 'Metal',
  });
});

it('supports uncategorized filtering', async () => {
  const mockDb = makeMockDb([], 0);
  vi.mocked(createDb).mockReturnValue(mockDb as any);
  const resp = await GET(makeApiEvent('http://localhost/api/songs?category=uncategorized'));
  expect(resp.status).toBe(200);
  expect(mockDb.where).toHaveBeenCalled();
});

it('rejects invalid category filters', async () => {
  vi.mocked(createDb).mockReturnValue(makeMockDb([], 0) as any);
  const resp = await GET(makeApiEvent('http://localhost/api/songs?category=abc'));
  expect(resp.status).toBe(400);
});
```

Update the local `makeMockDb` helper to include `leftJoin` and `where` chain functions:

```ts
leftJoin: vi.fn().mockReturnThis(),
where: vi.fn().mockReturnThis(),
```

- [ ] **Step 3: Run tests to verify failure**

Run: `bun run test:unit -- api-categories.test.ts api-songs.test.ts`

Expected: FAIL because `/api/categories` does not exist and `/api/songs` lacks category support.

- [ ] **Step 4: Implement `/api/categories`**

Create `cygnus-web/src/pages/api/categories.ts`:

```ts
import type { APIRoute } from 'astro';
import { asc } from 'drizzle-orm';
import { createDb } from '../../lib/db';
import { categories } from '../../lib/db/schema';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env?.DB) {
      return new Response(JSON.stringify({ message: 'Server configuration error: D1 binding missing.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rows = await createDb(runtime.env.DB)
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .orderBy(asc(categories.normalized_name))
      .all();

    return new Response(JSON.stringify({ categories: rows }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('GET /api/categories error', err);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 5: Extend `/api/songs`**

Update selected columns and mapping:

```ts
id: songs.id,
song_name: songs.song_name,
origin: songs.origin,
bpm: songs.bpm,
release_date: songs.release_date,
preview_r2_key: songs.preview_r2_key,
category_id: songs.category_id,
category_name: categories.name,
```

Map response fields:

```ts
categoryId: r.category_id ? String(r.category_id) : null,
categoryName: r.category_name ?? null,
```

For filtering:

```ts
const categoryFilter = url.searchParams.get('category');
if (categoryFilter === 'uncategorized') {
  query = query.where(isNull(songs.category_id));
} else if (categoryFilter) {
  const parsedCategoryId = parseCategoryId(categoryFilter);
  if (!parsedCategoryId) return json({ message: 'Invalid category filter' }, 400);
  query = query.where(eq(songs.category_id, parsedCategoryId));
}
```

Use the same filter for `totalCount` so pagination matches the filtered result.

- [ ] **Step 6: Run public API tests**

Run: `bun run test:unit -- api-categories.test.ts api-songs.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit public category APIs**

```bash
git add cygnus-web/src/pages/api/categories.ts cygnus-web/src/pages/api/songs.ts cygnus-web/tests/unit/api-categories.test.ts cygnus-web/tests/unit/api-songs.test.ts
git commit -m "feat: expose public song categories"
```

## Task 5: Admin Category UI

**Files:**
- Create: `cygnus-web/src/components/CategoryManagement.svelte`
- Modify: `cygnus-web/src/components/AdminUpload.svelte`
- Modify: `cygnus-web/src/components/SongManagement.svelte`
- Modify: `cygnus-web/src/pages/admin/songs.astro`
- Test: `cygnus-web/tests/unit/CategoryManagement.test.ts`
- Test: `cygnus-web/tests/unit/AdminUpload.test.ts`
- Test: `cygnus-web/tests/unit/SongManagement.test.ts`

- [ ] **Step 1: Write failing CategoryManagement tests**

Create `cygnus-web/tests/unit/CategoryManagement.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import CategoryManagement from '../../src/components/CategoryManagement.svelte';

afterEach(() => vi.unstubAllGlobals());

describe('CategoryManagement', () => {
  it('loads and displays categories', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ categories: [{ id: 1, name: 'Metal' }] }),
    }));
    render(CategoryManagement);
    await expect(screen.findByText('Metal')).resolves.toBeInTheDocument();
  });

  it('creates a category and refreshes the list', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ categories: [] }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: 'ok' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ categories: [{ id: 1, name: 'J Pop' }] }) });
    vi.stubGlobal('fetch', fetchMock);
    render(CategoryManagement);
    await fireEvent.input(screen.getByLabelText('New category'), { target: { value: 'J Pop' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Create Category' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/admin/categories', expect.objectContaining({ method: 'POST' })));
    await expect(screen.findByText('J Pop')).resolves.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Add failing upload/category select test**

Append to `cygnus-web/tests/unit/AdminUpload.test.ts`:

```ts
it('renders category select when categories exist', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ categories: [{ id: 2, name: 'Metal' }] }),
  }));
  render(AdminUpload);
  await expect(screen.findByLabelText('Category')).resolves.toBeRequired();
  expect(screen.getByRole('option', { name: 'Metal' })).toBeInTheDocument();
});
```

- [ ] **Step 3: Add failing SongManagement category test**

Append to `cygnus-web/tests/unit/SongManagement.test.ts`:

```ts
it('shows category column and category names', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      songs: [{
        id: 1,
        song_name: 'Track',
        artist: 'Artist',
        bpm: 120,
        release_date: '2024-01-01',
        is_released: true,
        created_date: '2024-01-01T00:00:00.000Z',
        origin: 'AI',
        r2_key: 'songs/track.mp3',
        categoryId: 3,
        categoryName: 'Metal',
      }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    }),
  }));
  render(SongManagement);
  await expect(screen.findByText('Category')).resolves.toBeInTheDocument();
  expect(screen.getByText('Metal')).toBeInTheDocument();
});
```

- [ ] **Step 4: Run UI tests to verify failure**

Run: `bun run test:unit -- CategoryManagement.test.ts AdminUpload.test.ts SongManagement.test.ts`

Expected: FAIL because the new component and category UI fields do not exist.

- [ ] **Step 5: Implement CategoryManagement**

Create `cygnus-web/src/components/CategoryManagement.svelte` with:

```svelte
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  type Category = { id: number; name: string };
  const dispatch = createEventDispatcher<{ changed: void }>();

  let categories: Category[] = [];
  let newName = '';
  let error = '';
  let loading = true;

  async function fetchCategories() {
    loading = true;
    error = '';
    const response = await fetch('/api/admin/categories');
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    categories = data.categories;
    loading = false;
  }

  async function createCategory() {
    const response = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    const data = await response.json();
    if (!response.ok) {
      error = data.message || 'Failed to create category';
      return;
    }
    newName = '';
    await fetchCategories();
    dispatch('changed');
  }

  onMount(() => {
    fetchCategories().catch((err) => {
      loading = false;
      error = err instanceof Error ? err.message : 'Failed to fetch categories';
    });
  });
</script>
```

Add rename/delete controls in the same component using `PUT` and `DELETE` with the same refresh and `changed` dispatch pattern.

- [ ] **Step 6: Wire CategoryManagement into admin song page**

In `cygnus-web/src/pages/admin/songs.astro`, import and render above `SongManagement`:

```astro
import CategoryManagement from '../../components/CategoryManagement.svelte';
```

```astro
<div class="space-y-8">
  <CategoryManagement client:load />
  <SongManagement client:load />
</div>
```

- [ ] **Step 7: Update AdminUpload category select**

Load categories on mount and add:

```svelte
<div>
  <label for="categoryId" class="block text-sm font-medium text-cyan-200">Category</label>
  <select
    id="categoryId"
    name="categoryId"
    required={categories.length > 0}
    class="mt-1 block w-full px-3 py-2 bg-blue-900/40 border border-blue-400/30 rounded-md shadow-sm text-blue-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 sm:text-sm"
  >
    {#if categories.length === 0}
      <option value="">No configured categories</option>
    {:else}
      <option value="">Select category</option>
      {#each categories as category (category.id)}
        <option value={category.id}>{category.name}</option>
      {/each}
    {/if}
  </select>
</div>
```

- [ ] **Step 8: Update SongManagement category column and edit select**

Extend `Song` and `editForm` with `categoryId` and `categoryName`. Add a `Category` table header after `Artist`, render `song.categoryName ?? 'Uncategorized'`, and in edit mode render a `select` with configured categories. Append `categoryId` in `saveEdit`.

- [ ] **Step 9: Run admin UI tests**

Run: `bun run test:unit -- CategoryManagement.test.ts AdminUpload.test.ts SongManagement.test.ts`

Expected: PASS.

- [ ] **Step 10: Commit admin category UI**

```bash
git add cygnus-web/src/components/CategoryManagement.svelte cygnus-web/src/components/AdminUpload.svelte cygnus-web/src/components/SongManagement.svelte cygnus-web/src/pages/admin/songs.astro cygnus-web/tests/unit/CategoryManagement.test.ts cygnus-web/tests/unit/AdminUpload.test.ts cygnus-web/tests/unit/SongManagement.test.ts
git commit -m "feat: add admin category management UI"
```

## Task 6: Public Category Display And Filtering

**Files:**
- Modify: `cygnus-web/src/components/MusicHome.svelte`
- Modify: `cygnus-web/src/components/SongList.svelte`
- Modify: `cygnus-web/src/components/SongDetail.svelte`
- Test: `cygnus-web/tests/unit/MusicHome.test.ts`
- Test: `cygnus-web/tests/unit/SongList.test.ts`
- Test: `cygnus-web/tests/unit/SongDetail.test.ts`

- [ ] **Step 1: Add failing SongList and SongDetail tests**

Append to `SongList.test.ts`:

```ts
it('renders category label for each song', () => {
  render(SongList, {
    props: {
      songs: [{
        id: '1',
        title: 'Beat',
        origin: 'AI',
        bpm: 140,
        releaseDate: '2024-01-01',
        categoryName: 'Metal',
      }],
    },
  });
  expect(screen.getByText('Metal')).toBeInTheDocument();
});
```

Append to `SongDetail.test.ts`:

```ts
it('renders category for selected song', () => {
  render(SongDetail, {
    props: { song: { ...mockSong, categoryName: 'J Pop' } },
  });
  expect(screen.getByText('J Pop')).toBeInTheDocument();
});
```

- [ ] **Step 2: Add failing MusicHome filter test**

Append to `MusicHome.test.ts`:

```ts
it('filters songs by selected category', async () => {
  const songsResponse = {
    songs: [
      { id: '1', title: 'Metal Song', origin: 'AI', bpm: 120, releaseDate: '2024-01-01', categoryId: '1', categoryName: 'Metal' },
      { id: '2', title: 'Pop Song', origin: 'AI', bpm: 130, releaseDate: '2024-01-02', categoryId: '2', categoryName: 'J Pop' },
    ],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  };
  const categoriesResponse = { categories: [{ id: 1, name: 'Metal' }, { id: 2, name: 'J Pop' }] };
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url === '/api/categories') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(categoriesResponse) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(songsResponse) });
  }));
  render(MusicHome);
  await expect(screen.findByText('Metal Song')).resolves.toBeInTheDocument();
  await fireEvent.change(screen.getByLabelText('Category filter'), { target: { value: '2' } });
  expect(screen.queryByText('Metal Song')).not.toBeInTheDocument();
  expect(screen.getByText('Pop Song')).toBeInTheDocument();
});
```

- [ ] **Step 3: Run public UI tests to verify failure**

Run: `bun run test:unit -- MusicHome.test.ts SongList.test.ts SongDetail.test.ts`

Expected: FAIL because category fields and filter UI are missing.

- [ ] **Step 4: Update shared Song shapes**

In `MusicHome.svelte`, `SongList.svelte`, and `SongDetail.svelte`, extend `Song`:

```ts
categoryId?: string | null;
categoryName?: string | null;
```

- [ ] **Step 5: Add category display**

In `SongList.svelte`, render:

```svelte
<p class="text-[#8080b8] font-mono text-[9px] mt-1 uppercase tracking-wider truncate">
  {song.categoryName ?? 'Uncategorized'}
</p>
```

In `SongDetail.svelte`, add a third stat panel or compact metadata row:

```svelte
<div class="bg-[#080716] rounded-lg p-5 border border-white/[0.05]">
  <div class="text-[#6060a0] font-mono text-[9px] uppercase tracking-[0.2em] mb-2">Category</div>
  <div class="text-white font-mono text-base font-bold leading-none">{song.categoryName ?? 'Uncategorized'}</div>
</div>
```

- [ ] **Step 6: Load categories and filter in MusicHome**

Add category state:

```ts
type Category = { id: number; name: string };
let categories: Category[] = [];
let selectedCategory = 'all';

$: visibleSongs = selectedCategory === 'all'
  ? songs
  : selectedCategory === 'uncategorized'
    ? songs.filter((song) => !song.categoryId)
    : songs.filter((song) => song.categoryId === selectedCategory);
```

Fetch categories on mount before or alongside songs:

```ts
const categoriesRes = await fetch('/api/categories');
if (categoriesRes.ok) {
  const categoriesData = await categoriesRes.json();
  categories = categoriesData.categories;
}
```

Add selected-song adjustment:

```ts
$: if (selectedSong && !visibleSongs.some((song) => song.id === selectedSong?.id)) {
  selectedSong = visibleSongs[0] ?? null;
}
```

Render filter above `SongList`:

```svelte
<label for="category-filter" class="sr-only">Category filter</label>
<select id="category-filter" aria-label="Category filter" bind:value={selectedCategory}>
  <option value="all">All</option>
  {#each categories as category (category.id)}
    <option value={String(category.id)}>{category.name}</option>
  {/each}
  <option value="uncategorized">Uncategorized</option>
</select>
```

Pass `visibleSongs` to `SongList`.

- [ ] **Step 7: Run public UI tests**

Run: `bun run test:unit -- MusicHome.test.ts SongList.test.ts SongDetail.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit public category UI**

```bash
git add cygnus-web/src/components/MusicHome.svelte cygnus-web/src/components/SongList.svelte cygnus-web/src/components/SongDetail.svelte cygnus-web/tests/unit/MusicHome.test.ts cygnus-web/tests/unit/SongList.test.ts cygnus-web/tests/unit/SongDetail.test.ts
git commit -m "feat: show and filter public song categories"
```

## Task 7: E2E And Full Verification

**Files:**
- Modify: `cygnus-web-e2e/tests/admin-song-management.spec.ts`

- [ ] **Step 1: Add focused e2e assertions**

Add a test that mocks category APIs and confirms the admin UI renders category management:

```ts
test('should create and display configured categories', async ({ page }) => {
  let categories = [{ id: 1, name: 'Metal' }];

  await page.route('/api/admin/categories', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ categories }) });
      return;
    }
    if (route.request().method() === 'POST') {
      categories = [...categories, { id: 2, name: 'J Pop' }];
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ message: 'Category created successfully' }) });
      return;
    }
    await route.fallback();
  });

  await page.route('/api/admin/songs**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ songs: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
    });
  });

  await page.goto('/admin/songs');
  await expect(page.getByText('Metal')).toBeVisible();
  await page.getByLabel('New category').fill('J Pop');
  await page.getByRole('button', { name: 'Create Category' }).click();
  await expect(page.getByText('J Pop')).toBeVisible();
});
```

- [ ] **Step 2: Run focused e2e test**

Run: `bun run test:e2e -- admin-song-management.spec.ts`

Expected: PASS. If browsers are missing, run `bunx playwright install` and rerun the command.

- [ ] **Step 3: Run formatting, lint, unit, and build checks**

Run these commands:

```bash
bun run format:check
bun run lint
bun run test:unit
bun run build
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit e2e and verification fixes**

If Step 1 changed the e2e file or Step 3 required fixes:

```bash
git add cygnus-web-e2e/tests/admin-song-management.spec.ts
git commit -m "test: cover song category workflow"
```

If no file changed in this task, skip the commit and record that full verification passed.

## Self-Review Checklist

- Spec coverage: Tasks cover schema, category CRUD, upload/edit validation, public category APIs, admin UI, public display/filtering, and focused e2e verification.
- Placeholder scan: Plan contains no empty implementation slots, no deferred behavior, and no unspecified validation.
- Type consistency: API fields use `categoryId` and `categoryName`; database fields use `category_id`; category filters use category ID strings or `uncategorized`.
- Scope check: The plan keeps one category per song and avoids multi-category, nested category, artwork, and category landing-page work.
