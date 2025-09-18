import type { APIRoute } from 'astro';
import { createDb } from '../../../lib/db';
import { songs } from '../../../lib/db/schema';
import { desc, eq, type InferSelectModel } from 'drizzle-orm';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const cookieAuthed = (request.headers.get('cookie') ?? '')
      .split(';')
      .some((c) => c.trim().startsWith('admin_auth=1'));

    if (!cookieAuthed) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const db = createDb(runtime.env.DB);

    // Get total count for pagination
    const totalCount = await db.$count(songs);

    // Get paginated songs
    const rows: InferSelectModel<typeof songs>[] = await db
      .select()
      .from(songs)
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
    }));

    return new Response(JSON.stringify({
      songs: songsList,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
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
    const cookieAuthed = (request.headers.get('cookie') ?? '')
      .split(';')
      .some((c) => c.trim().startsWith('admin_auth=1'));

    if (!cookieAuthed) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
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
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = createDb(runtime.env.DB);

    // Delete the song
    await db
      .delete(songs)
      .where(eq(songs.id, parseInt(songId)))
      .run();

    return new Response(JSON.stringify({ message: 'Song deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
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
    const cookieAuthed = (request.headers.get('cookie') ?? '')
      .split(';')
      .some((c) => c.trim().startsWith('admin_auth=1'));

    if (!cookieAuthed) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
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

    if (!songId || !songName || !artist) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = createDb(runtime.env.DB);

    // Update the song
    await db
      .update(songs)
      .set({
        song_name: songName as string,
        artist: artist as string,
        bpm: bpm ? parseInt(bpm as string) : undefined,
        release_date: releaseDate as string,
        is_released: isReleased ? (isReleased === 'true') : undefined,
        origin: origin as string,
      })
      .where(eq(songs.id, parseInt(songId as string)))
      .run();

    return new Response(JSON.stringify({ message: 'Song updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('PUT /api/admin/songs error', err);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};