import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
  const { request, locals } = context;
  const runtime = locals.runtime;

  if (!runtime?.env) {
    const headers = new Headers();
    headers.append('Location', '/admin?error=1');
    return new Response('Server configuration error', { status: 303, headers });
  }

  try {
    // CSRF protection: allow same-host (ignore port) during dev proxying
    const reqUrl = new URL(request.url);
    const expected = new URL(reqUrl.origin);
    const origin = request.headers.get('origin');
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
    if (!sameHost(origin) || !sameHost(referer)) {
      return new Response(JSON.stringify({ message: 'Forbidden (CSRF)' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const passkey = formData.get('passkey');
    const isHttps = new URL(request.url).protocol === 'https:';
    const secure = isHttps ? '; Secure' : '';
    const expires = new Date(Date.now() + 86400 * 1000).toUTCString();
    const expired = new Date(0).toUTCString();

    if (passkey !== runtime.env.PASSKEY) {
      const headers = new Headers();
      headers.append('Set-Cookie', `admin_auth=; Max-Age=0; Expires=${expired}; Path=/; HttpOnly; SameSite=Strict${secure}`);
      headers.append('Location', '/admin?error=1');
      return new Response(null, { status: 303, headers });
    }

    const headers = new Headers();
    headers.append('Set-Cookie', `admin_auth=1; Max-Age=86400; Expires=${expires}; Path=/; HttpOnly; SameSite=Strict${secure}`);
    headers.append('Location', '/admin');
    return new Response(null, { status: 303, headers });
  } catch {
    const headers = new Headers();
    headers.append('Location', '/admin?error=1');
    return new Response('Login failed', { status: 303, headers });
  }
};
