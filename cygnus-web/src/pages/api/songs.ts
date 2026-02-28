import type { APIRoute } from 'astro';
import { createDb } from '../../lib/db';
import { songs } from '../../lib/db/schema';
import { desc, type InferSelectModel } from 'drizzle-orm';

export const GET: APIRoute = async ({ locals, request }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({ message: 'Server configuration error: D1 binding missing.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const parsedPage = parseInt(url.searchParams.get('page') || '1');
    const parsedLimit = parseInt(url.searchParams.get('limit') || '20');
    const MAX_PAGE = 1000;
    const parsedPageSafe = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage);
    const page = Math.min(MAX_PAGE, parsedPageSafe);
    const limit = Math.min(50, Math.max(1, Number.isNaN(parsedLimit) ? 20 : parsedLimit));
    const offset = (page - 1) * limit;

    const db = createDb(runtime.env.DB);
    const totalCount = await db.$count(songs);
    const rows: Pick<
      InferSelectModel<typeof songs>,
      'id' | 'song_name' | 'origin' | 'bpm' | 'release_date'
    >[] = await db
      .select({
        id: songs.id,
        song_name: songs.song_name,
        origin: songs.origin,
        bpm: songs.bpm,
        release_date: songs.release_date,
      })
      .from(songs)
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
    }));

    return new Response(
      JSON.stringify({
        songs: songsList,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.min(Math.ceil(totalCount / limit), MAX_PAGE),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('GET /api/songs error', err);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
