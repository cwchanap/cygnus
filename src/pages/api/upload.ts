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
    // CSRF protection: allow same-host (ignore port) during dev proxying
    const reqUrl = new URL(request.url);
    const expected = new URL(reqUrl.origin);
    const reqOrigin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const sameHost = (u: string | null) => {
      if (!u) return true; // no header -> assume OK
      try {
        const url = new URL(u);
        return url.hostname === expected.hostname;
      } catch {
        return false;
      }
    };
    if (!sameHost(reqOrigin) || !sameHost(referer)) {
      return new Response(JSON.stringify({ message: 'Forbidden (CSRF)' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cookieHeader = request.headers.get('cookie') ?? '';
    const authed = cookieHeader
      .split(';')
      .some((c) => c.trim().startsWith('admin_auth=1'));

    const formData = await request.formData();
    const passkey = formData.get('passkey');

    if (!authed && passkey !== runtime.env.PASSKEY) {
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
    const originField = formData.get('origin') as string;
    const previewImage = formData.get('preview_image') as File | null;

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

    // Optional: upload preview image to `preview/` folder in the same bucket
    let previewKey: string | null = null;
    if (previewImage && previewImage.size > 0) {
      previewKey = `preview/${Date.now()}-${previewImage.name}`;
      await bucket.put(previewKey, await previewImage.arrayBuffer(), {
        httpMetadata: { contentType: previewImage.type || 'image/png' },
      });
    }

    await db
      .insertInto('songs')
      .values({
        song_name: songName,
        artist: artist,
        bpm: parseInt(bpm, 10),
        release_date: releaseDate,
        is_released: isReleased,
        origin: originField,
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
