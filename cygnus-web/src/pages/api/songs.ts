import type { APIRoute } from 'astro';
import { parseCategoryId } from '../../lib/categories';
import { createDb } from '../../lib/db';
import { categories, songs } from '../../lib/db/schema';
import { desc, eq, isNull, type SQL } from 'drizzle-orm';

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function parseCategoryFilter(value: string | null): SQL | null | Response {
  if (value == null) return null;

  const trimmedValue = value.trim();
  if (trimmedValue === 'uncategorized') {
    return isNull(songs.category_id);
  }

  const categoryId = parseCategoryId(trimmedValue);
  if (categoryId == null) {
    return jsonResponse({ message: 'Invalid category filter' }, 400);
  }

  return eq(songs.category_id, categoryId);
}

export const GET: APIRoute = async ({ locals, request }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env?.DB) {
      return jsonResponse(
        {
          message: 'Server configuration error: D1 binding missing.',
        },
        500
      );
    }

    const url = new URL(request.url);
    const categoryFilter = parseCategoryFilter(
      url.searchParams.get('category')
    );
    if (categoryFilter instanceof Response) {
      return categoryFilter;
    }

    const parsedPage = parseInt(url.searchParams.get('page') || '1', 10);
    const parsedLimit = parseInt(url.searchParams.get('limit') || '20', 10);
    const MAX_PAGE = 1000;
    const parsedPageSafe = Math.max(
      1,
      Number.isNaN(parsedPage) ? 1 : parsedPage
    );
    const page = Math.min(MAX_PAGE, parsedPageSafe);
    const limit = Math.min(
      50,
      Math.max(1, Number.isNaN(parsedLimit) ? 20 : parsedLimit)
    );
    const offset = (page - 1) * limit;

    const db = createDb(runtime.env.DB);
    const totalCount = categoryFilter
      ? await db.$count(songs, categoryFilter)
      : await db.$count(songs);
    const query = db
      .select({
        id: songs.id,
        song_name: songs.song_name,
        origin: songs.origin,
        bpm: songs.bpm,
        release_date: songs.release_date,
        preview_r2_key: songs.preview_r2_key,
        categoryId: songs.category_id,
        categoryName: categories.name,
      })
      .from(songs)
      .leftJoin(categories, eq(songs.category_id, categories.id));

    const filteredQuery = categoryFilter ? query.where(categoryFilter) : query;
    const rows = await filteredQuery
      .orderBy(desc(songs.id))
      .limit(limit)
      .offset(offset)
      .all();

    const songsList = rows.map((r) => ({
      id: String(r.id),
      title: r.song_name,
      origin: r.origin,
      bpm: r.bpm,
      releaseDate: r.release_date,
      categoryId: r.categoryId == null ? null : String(r.categoryId),
      categoryName: r.categoryName ?? null,
      // Only emit audio preview URL for keys that /api/file accepts (audio/ prefix)
      // to avoid returning URLs that will 400 on legacy/imported data
      previewUrl:
        r.preview_r2_key && r.preview_r2_key.startsWith('audio/')
          ? `/api/file?key=${encodeURIComponent(r.preview_r2_key)}`
          : undefined,
      // Emit previewImage for image previews from admin upload flow (preview/ prefix)
      previewImage:
        r.preview_r2_key && r.preview_r2_key.startsWith('preview/')
          ? `/api/file?key=${encodeURIComponent(r.preview_r2_key)}`
          : undefined,
    }));

    return jsonResponse(
      {
        songs: songsList,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.max(
            1,
            Math.min(Math.ceil(totalCount / limit), MAX_PAGE)
          ),
        },
      },
      200
    );
  } catch (err) {
    console.error('GET /api/songs error', err);
    return jsonResponse({ message: 'Internal Server Error' }, 500);
  }
};
