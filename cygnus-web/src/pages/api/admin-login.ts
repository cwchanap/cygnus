import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
  const { request, locals } = context;
  const runtime = locals.runtime;
  const reqUrl0 = new URL(request.url);
  const isLocalDev =
    reqUrl0.hostname === 'localhost' || reqUrl0.hostname === '127.0.0.1';

  const buildRedirectResponse = (location: string, headers?: Headers) => {
    const h = headers ?? new Headers();
    if (!h.has('Location')) h.append('Location', location);
    if (isLocalDev) {
      // Dev-only fallback: some proxies may not honor 303 + Location or drop Set-Cookie
      const safeHref = (() => {
        try {
          const u = new URL(location, reqUrl0.origin);
          return u.pathname + u.search;
        } catch {
          return '/admin';
        }
      })();
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${safeHref}"><title>Redirecting…</title></head><body><p>Redirecting to <a href="${safeHref}">${safeHref}</a>…</p><script>window.location.replace(${JSON.stringify(safeHref)});</script></body></html>`;
      if (!h.has('Content-Type'))
        h.set('Content-Type', 'text/html; charset=UTF-8');
      return new Response(html, { status: 200, headers: h });
    }
    return new Response(null, { status: 303, headers: h });
  };

  if (!runtime?.env) {
    const reqUrl = new URL(request.url);
    const nextParam = reqUrl.searchParams.get('next') || '/admin';
    const headers = new Headers();
    headers.append(
      'Location',
      `/login?error=1&next=${encodeURIComponent(nextParam)}`
    );
    return buildRedirectResponse(
      `/login?error=1&next=${encodeURIComponent(nextParam)}`,
      headers
    );
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
    const reqUrl2 = new URL(request.url);
    const nextRaw = formData.get('next');
    const nextParam =
      (typeof nextRaw === 'string' && nextRaw) ||
      reqUrl2.searchParams.get('next') ||
      '/admin';
    const isHttps = reqUrl2.protocol === 'https:';
    const secure = isHttps ? '; Secure' : '';
    const expires = new Date(Date.now() + 86400 * 1000).toUTCString();
    const expired = new Date(0).toUTCString();

    if (typeof passkey !== 'string' || passkey !== runtime.env.PASSKEY) {
      const headers = new Headers();
      headers.append(
        'Set-Cookie',
        `admin_auth=; Max-Age=0; Expires=${expired}; Path=/; HttpOnly; SameSite=Strict${secure}`
      );
      headers.append(
        'Location',
        `/login?error=1&next=${encodeURIComponent(nextParam)}`
      );
      return buildRedirectResponse(
        `/login?error=1&next=${encodeURIComponent(nextParam)}`,
        headers
      );
    }

    const headers = new Headers();
    headers.append(
      'Set-Cookie',
      `admin_auth=1; Max-Age=86400; Expires=${expires}; Path=/; HttpOnly; SameSite=Strict${secure}`
    );
    headers.append('Location', nextParam);
    return buildRedirectResponse(nextParam, headers);
  } catch {
    const reqUrl = new URL(request.url);
    const nextParam = reqUrl.searchParams.get('next') || '/admin';
    const headers = new Headers();
    headers.append(
      'Location',
      `/login?error=1&next=${encodeURIComponent(nextParam)}`
    );
    return buildRedirectResponse(
      `/login?error=1&next=${encodeURIComponent(nextParam)}`,
      headers
    );
  }
};
