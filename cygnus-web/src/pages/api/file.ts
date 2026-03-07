import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env?.CYGNUS_BUCKET) {
      return new Response(
        JSON.stringify({ message: 'Server configuration error: R2 binding missing.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const key = url.searchParams.get('key');
    if (!key) {
      return new Response(
        JSON.stringify({ message: 'Key parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Only allow known key prefixes to prevent unauthorized access to arbitrary R2 objects
    const isAllowedKey = key.startsWith('audio/') || key.startsWith('preview/');
    if (!isAllowedKey || key.includes('..')) {
      return new Response(
        JSON.stringify({ message: 'Invalid key' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the object from R2
    const object = await runtime.env.CYGNUS_BUCKET.get(key);

    if (!object) {
      return new Response(
        JSON.stringify({ message: 'File not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine content type based on file extension
    let contentType = 'application/octet-stream';
    const lowerKey = key.toLowerCase();
    if (lowerKey.endsWith('.mp3')) {
      contentType = 'audio/mpeg';
    } else if (lowerKey.endsWith('.wav')) {
      contentType = 'audio/wav';
    } else if (lowerKey.endsWith('.m4a')) {
      contentType = 'audio/mp4';
    } else if (lowerKey.endsWith('.flac')) {
      contentType = 'audio/flac';
    } else if (lowerKey.endsWith('.png')) {
      contentType = 'image/png';
    } else if (lowerKey.endsWith('.jpg') || lowerKey.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (lowerKey.endsWith('.gif')) {
      contentType = 'image/gif';
    }

    return new Response(object.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('GET /api/file error', { key: url.searchParams.get('key'), err });
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
