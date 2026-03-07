import type { APIRoute } from 'astro';

const ALLOWED_EXTENSIONS = {
  audio: ['.mp3', '.wav', '.m4a', '.webm', '.flac'],
  preview: ['.png', '.jpg', '.jpeg', '.gif'],
} as const;

function getAllowedFileConfig(key: string) {
  const lowerKey = key.toLowerCase();

  if (lowerKey.startsWith('audio/')) {
    return {
      extensions: ALLOWED_EXTENSIONS.audio,
      contentTypes: {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.m4a': 'audio/mp4',
        '.webm': 'audio/webm',
        '.flac': 'audio/flac',
      } as Record<string, string>,
    };
  }

  if (lowerKey.startsWith('preview/')) {
    return {
      extensions: ALLOWED_EXTENSIONS.preview,
      contentTypes: {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
      } as Record<string, string>,
    };
  }

  return null;
}

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
    const fileConfig = getAllowedFileConfig(key);
    if (!fileConfig || key.includes('..')) {
      return new Response(
        JSON.stringify({ message: 'Invalid key' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const lowerKey = key.toLowerCase();
    const extension = fileConfig.extensions.find((ext) => lowerKey.endsWith(ext));
    if (!extension) {
      return new Response(
        JSON.stringify({ message: 'Unsupported file type' }),
        { status: 415, headers: { 'Content-Type': 'application/json' } }
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

    const contentType = fileConfig.contentTypes[extension];

    return new Response(object.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
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
