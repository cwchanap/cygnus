/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { POST } from '../../src/pages/api/admin-login';

const PASSKEY = 'testpass';

function makeLocals(passkey = PASSKEY) {
  return { runtime: { env: { PASSKEY: passkey } } };
}

function makePostRequest(
  url: string,
  fields: Record<string, string> = {},
  headers: Record<string, string> = {}
) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) {
    body.append(k, v);
  }
  return new Request(url, {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      ...headers,
    },
  });
}

describe('POST /api/admin-login - no runtime env', () => {
  it('redirects to login with error when runtime.env is absent (localhost returns HTML)', async () => {
    const req = makePostRequest('http://localhost/api/admin-login');
    const resp = await POST({ request: req, locals: {} } as any);
    // On localhost without runtime env -> dev HTML redirect
    expect(resp.status).toBe(200);
    const text = await resp.text();
    expect(text).toContain('/login');
    expect(text).toContain('error=1');
  });

  it('redirects to login with error when runtime.env is absent (non-local returns 303)', async () => {
    const req = makePostRequest('https://example.com/api/admin-login');
    const resp = await POST({ request: req, locals: {} } as any);
    expect(resp.status).toBe(303);
    expect(resp.headers.get('location')).toContain('/login?error=1');
  });
});

describe('POST /api/admin-login - CSRF protection', () => {
  it('returns 403 when origin header does not match request host', async () => {
    const req = makePostRequest(
      'http://example.com/api/admin-login',
      {},
      { origin: 'http://evil.com' }
    );
    const resp = await POST({ request: req, locals: makeLocals() } as any);
    expect(resp.status).toBe(403);
    const body = await resp.json();
    expect(body.message).toContain('CSRF');
  });

  it('returns 403 when referer header does not match request host', async () => {
    const req = makePostRequest(
      'http://example.com/api/admin-login',
      {},
      { referer: 'http://evil.com/login' }
    );
    const resp = await POST({ request: req, locals: makeLocals() } as any);
    expect(resp.status).toBe(403);
  });

  it('passes CSRF check when origin header is absent', async () => {
    // No origin or referer -> assume OK (returns redirect, not 403)
    const req = makePostRequest('https://example.com/api/admin-login', {
      passkey: PASSKEY,
    });
    const resp = await POST({ request: req, locals: makeLocals() } as any);
    expect(resp.status).not.toBe(403);
  });

  it('passes CSRF check when origin matches host', async () => {
    const req = makePostRequest(
      'https://example.com/api/admin-login',
      { passkey: PASSKEY },
      { origin: 'https://example.com' }
    );
    const resp = await POST({ request: req, locals: makeLocals() } as any);
    expect(resp.status).not.toBe(403);
  });
});

describe('POST /api/admin-login - wrong passkey', () => {
  it('clears auth cookie and redirects to login (non-local)', async () => {
    const req = makePostRequest('https://example.com/api/admin-login', {
      passkey: 'wrongpass',
    });
    const resp = await POST({ request: req, locals: makeLocals() } as any);
    expect(resp.status).toBe(303);
    const setCookie = resp.headers.get('set-cookie');
    expect(setCookie).toContain('Max-Age=0');
    expect(resp.headers.get('location')).toContain('/login?error=1');
  });

  it('clears auth cookie and returns HTML redirect on localhost', async () => {
    const req = makePostRequest('http://localhost/api/admin-login', {
      passkey: 'wrongpass',
    });
    const resp = await POST({ request: req, locals: makeLocals() } as any);
    expect(resp.status).toBe(200);
    const setCookie = resp.headers.get('set-cookie');
    expect(setCookie).toContain('Max-Age=0');
    const text = await resp.text();
    expect(text).toContain('<!doctype html>');
    expect(text).toContain('/login');
  });

  it('redirects to login preserving next param from form data', async () => {
    const req = makePostRequest('https://example.com/api/admin-login', {
      passkey: 'wrongpass',
      next: '/admin/songs',
    });
    const resp = await POST({ request: req, locals: makeLocals() } as any);
    expect(resp.status).toBe(303);
    expect(resp.headers.get('location')).toContain('next=');
  });
});

describe('POST /api/admin-login - correct passkey', () => {
  it('sets admin_auth=1 cookie and redirects to /admin (non-local, no next param)', async () => {
    const req = makePostRequest('https://example.com/api/admin-login', {
      passkey: PASSKEY,
    });
    const resp = await POST({ request: req, locals: makeLocals() } as any);
    expect(resp.status).toBe(303);
    const setCookie = resp.headers.get('set-cookie');
    expect(setCookie).toContain('admin_auth=1');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    expect(setCookie).toContain('Secure');
    expect(resp.headers.get('location')).toBe('/admin');
  });

  it('redirects to safe next param after successful login', async () => {
    const req = makePostRequest('https://example.com/api/admin-login', {
      passkey: PASSKEY,
      next: '/admin/songs',
    });
    const resp = await POST({ request: req, locals: makeLocals() } as any);
    expect(resp.status).toBe(303);
    expect(resp.headers.get('location')).toBe('/admin/songs');
  });

  it('ignores unsafe next param and falls back to /admin', async () => {
    const req = makePostRequest('https://example.com/api/admin-login', {
      passkey: PASSKEY,
      next: 'https://evil.com/steal',
    });
    const resp = await POST({ request: req, locals: makeLocals() } as any);
    expect(resp.status).toBe(303);
    expect(resp.headers.get('location')).toBe('/admin');
  });

  it('returns HTML redirect on localhost with admin_auth=1 cookie', async () => {
    const req = makePostRequest('http://localhost/api/admin-login', {
      passkey: PASSKEY,
    });
    const resp = await POST({ request: req, locals: makeLocals() } as any);
    expect(resp.status).toBe(200);
    const setCookie = resp.headers.get('set-cookie');
    expect(setCookie).toContain('admin_auth=1');
    const text = await resp.text();
    expect(text).toContain('<!doctype html>');
    expect(text).toContain('window.location.replace');
  });

  it('does not set Secure flag on http (non-localhost)', async () => {
    // Non-HTTPS non-localhost - e.g., when behind a proxy in test env
    const req = makePostRequest('http://example.com/api/admin-login', {
      passkey: PASSKEY,
    });
    const resp = await POST({ request: req, locals: makeLocals() } as any);
    const setCookie = resp.headers.get('set-cookie');
    // http -> no Secure flag
    expect(setCookie).not.toContain('Secure');
  });
});
