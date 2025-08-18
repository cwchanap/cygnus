import type { APIRoute } from 'astro';
import { createDb } from '../../lib/db';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({ message: 'Server configuration error: D1 binding missing.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = createDb(runtime.env.DB);
    try {
      const rows = await db
        .selectFrom('songs')
        .select(['id', 'song_name', 'origin', 'bpm', 'release_date'])
        .orderBy('id', 'desc')
        .limit(100)
        .execute();

      const songs = rows.map((r) => ({
        id: String(r.id),
        title: r.song_name,
        origin: r.origin,
        bpm: r.bpm,
        releaseDate: r.release_date,
      }));

      return new Response(JSON.stringify(songs), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } finally {
      await db.destroy();
    }
  } catch (err) {
    console.error('GET /api/songs error', err);
    return new Response(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
