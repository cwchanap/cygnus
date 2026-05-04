import type { APIRoute } from 'astro';
import { createDb } from '../../../lib/db';
import { categories, songs } from '../../../lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { isAdminAuthed } from '../../../lib/auth';
import { resolveSongCategoryId } from '../../../lib/categoryValidation';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!isAdminAuthed(request)) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const runtime = locals.runtime;
    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({
          message: 'Server configuration error: D1 binding missing.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const parsedPage = parseInt(url.searchParams.get('page') || '1', 10);
    const parsedLimit = parseInt(url.searchParams.get('limit') || '10', 10);
    const MAX_PAGE = 1000;
    const parsedPageSafe = Math.max(
      1,
      Number.isNaN(parsedPage) ? 1 : parsedPage
    );
    const page = Math.min(MAX_PAGE, parsedPageSafe);
    const limit = Math.min(
      100,
      Math.max(1, Number.isNaN(parsedLimit) ? 10 : parsedLimit)
    );
    const offset = (page - 1) * limit;

    const db = createDb(runtime.env.DB);

    // Get total count for pagination
    const totalCount = await db.$count(songs);

    // Get paginated songs
    const rows = await db
      .select({
        id: songs.id,
        song_name: songs.song_name,
        artist: songs.artist,
        bpm: songs.bpm,
        release_date: songs.release_date,
        is_released: songs.is_released,
        created_date: songs.created_date,
        origin: songs.origin,
        r2_key: songs.r2_key,
        categoryId: songs.category_id,
        categoryName: categories.name,
      })
      .from(songs)
      .leftJoin(categories, eq(songs.category_id, categories.id))
      .orderBy(desc(songs.created_date))
      .limit(limit)
      .offset(offset)
      .all();

    const songsList = rows.map((song) => ({
      id: song.id,
      song_name: song.song_name,
      artist: song.artist,
      bpm: song.bpm,
      release_date: song.release_date,
      is_released: song.is_released,
      created_date: song.created_date,
      origin: song.origin,
      r2_key: song.r2_key,
      categoryId: song.categoryId ?? null,
      categoryName: song.categoryName ?? null,
    }));

    return new Response(
      JSON.stringify({
        songs: songsList,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.max(1, Math.ceil(totalCount / limit)),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('GET /api/admin/songs error', err);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request, locals, url }) => {
  try {
    // Check authentication
    if (!isAdminAuthed(request)) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const runtime = locals.runtime;
    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({
          message: 'Server configuration error: D1 binding missing.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const songId = url.searchParams.get('id');
    if (!songId) {
      return new Response(JSON.stringify({ message: 'Song ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const parsedId = parseInt(songId, 10);
    if (Number.isNaN(parsedId) || parsedId <= 0) {
      return new Response(
        JSON.stringify({ message: 'Song ID must be a positive integer' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const db = createDb(runtime.env.DB);

    // Verify the song exists before deleting
    const existing = await db
      .select({ id: songs.id })
      .from(songs)
      .where(eq(songs.id, parsedId))
      .get();

    if (!existing) {
      return new Response(JSON.stringify({ message: 'Song not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.delete(songs).where(eq(songs.id, parsedId)).run();

    return new Response(
      JSON.stringify({ message: 'Song deleted successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('DELETE /api/admin/songs error', err);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!isAdminAuthed(request)) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const runtime = locals.runtime;
    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({
          message: 'Server configuration error: D1 binding missing.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const songId = formData.get('id');
    const songName = formData.get('song_name');
    const artist = formData.get('artist');
    const bpm = formData.get('bpm');
    const releaseDate = formData.get('release_date');
    const isReleased = formData.get('is_released');
    const origin = formData.get('origin');
    const categoryIdValue = formData.get('categoryId');

    if (!songId || !songName || !artist) {
      return new Response(
        JSON.stringify({ message: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const parsedSongId = parseInt(songId as string, 10);
    if (Number.isNaN(parsedSongId) || parsedSongId <= 0) {
      return new Response(
        JSON.stringify({ message: 'Song ID must be a positive integer' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let parsedBpm: number | undefined;
    if (bpm) {
      parsedBpm = parseInt(bpm as string, 10);
      if (Number.isNaN(parsedBpm)) {
        return new Response(
          JSON.stringify({ message: 'BPM must be a valid integer' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    const db = createDb(runtime.env.DB);

    // Verify the song exists before updating
    const existing = await db
      .select({ id: songs.id })
      .from(songs)
      .where(eq(songs.id, parsedSongId))
      .get();

    if (!existing) {
      return new Response(JSON.stringify({ message: 'Song not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only resolve and update category_id when the field was explicitly present
    // in the form data. This preserves the existing category when clients omit
    // the field, while still allowing an explicit blank value to mean uncategorized.
    const hasCategoryField = formData.has('categoryId');
    let resolvedCategory:
      | { categoryId: number | null }
      | { response: Response }
      | null = null;

    if (hasCategoryField) {
      resolvedCategory = await resolveSongCategoryId(db, categoryIdValue);
      if ('response' in resolvedCategory) {
        return resolvedCategory.response;
      }
    }

    // Build update set, only including category_id when explicitly provided
    const updateData: Record<string, unknown> = {
      song_name: songName as string,
      artist: artist as string,
      bpm: parsedBpm,
      release_date: releaseDate as string,
      is_released: isReleased ? isReleased === 'true' : undefined,
      origin: origin as string,
    };

    if (resolvedCategory) {
      updateData.category_id = resolvedCategory.categoryId;
    }

    await db
      .update(songs)
      .set(updateData)
      .where(eq(songs.id, parsedSongId))
      .run();

    return new Response(
      JSON.stringify({ message: 'Song updated successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('PUT /api/admin/songs error', err);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
