import type { APIRoute } from 'astro';
import { createDb } from '@/lib/db';

export const POST: APIRoute = async (context) => {
  const { request, locals } = context;
  const runtime = locals.runtime;
  // Check if Cloudflare bindings are available
  if (!runtime?.env) {
    console.error('Cloudflare environment bindings are not available.');
    return new Response(
      JSON.stringify({ message: 'Server configuration error: Cloudflare bindings missing.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const formData = await request.formData();
    const passkey = formData.get('passkey');

    if (passkey !== runtime.env.PASSKEY) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const songFile = formData.get('song') as File;
    const songName = formData.get('song_name') as string;
    const artist = formData.get('artist') as string;
    const bpm = formData.get('bpm') as string;
    const releaseDate = formData.get('release_date') as string;
    const isReleased = formData.get('is_released') != null && String(formData.get('is_released')) !== 'false';
    const origin = formData.get('origin') as string;

    if (!songFile || !songName || !artist) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bucket = runtime.env.CYGNUS_BUCKET;
    const db = createDb(runtime.env.DB);

    const r2Key = `songs/${Date.now()}-${songFile.name}`;
    await bucket.put(r2Key, await songFile.arrayBuffer());

    await db
      .insertInto('songs')
      .values({
        song_name: songName,
        artist: artist,
        bpm: parseInt(bpm, 10),
        release_date: releaseDate,
        is_released: isReleased,
        origin: origin,
        created_date: new Date().toISOString(),
        r2_key: r2Key,
      })
      .execute();

    return new Response(JSON.stringify({ message: 'Song uploaded successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ message: 'Upload failed: ' + errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
