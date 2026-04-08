import { describe, it, expect } from 'vitest';
import { isAdminAuthed } from '../../src/lib/auth';

describe('isAdminAuthed', () => {
  it('returns true for admin_auth=1 cookie', () => {
    const req = new Request('http://localhost/', {
      headers: { cookie: 'admin_auth=1' },
    });
    expect(isAdminAuthed(req)).toBe(true);
  });

  it('returns true when admin_auth=1 is among multiple cookies', () => {
    const req = new Request('http://localhost/', {
      headers: { cookie: 'session=abc; admin_auth=1; theme=dark' },
    });
    expect(isAdminAuthed(req)).toBe(true);
  });

  it('returns false for admin_auth=10 (no bypass)', () => {
    const req = new Request('http://localhost/', {
      headers: { cookie: 'admin_auth=10' },
    });
    expect(isAdminAuthed(req)).toBe(false);
  });

  it('returns false for admin_auth=123', () => {
    const req = new Request('http://localhost/', {
      headers: { cookie: 'admin_auth=123' },
    });
    expect(isAdminAuthed(req)).toBe(false);
  });

  it('returns false when no auth cookie', () => {
    const req = new Request('http://localhost/');
    expect(isAdminAuthed(req)).toBe(false);
  });

  it('returns false for empty cookie header', () => {
    const req = new Request('http://localhost/', {
      headers: { cookie: '' },
    });
    expect(isAdminAuthed(req)).toBe(false);
  });

  it('returns false for whitespace-padded cookie value admin_auth= 1', () => {
    const req = new Request('http://localhost/', {
      headers: { cookie: 'admin_auth= 1' },
    });
    expect(isAdminAuthed(req)).toBe(false);
  });
});

import { safeRedirectPath } from '../../src/lib/auth';

describe('safeRedirectPath', () => {
  it('allows safe relative paths', () => {
    expect(safeRedirectPath('/admin')).toBe('/admin');
    expect(safeRedirectPath('/admin/songs')).toBe('/admin/songs');
    expect(safeRedirectPath('/login?next=%2Fadmin')).toBe(
      '/login?next=%2Fadmin'
    );
  });

  it('rejects absolute URLs', () => {
    expect(safeRedirectPath('https://evil.com')).toBe('/admin');
    expect(safeRedirectPath('http://evil.com/steal')).toBe('/admin');
  });

  it('rejects protocol-relative URLs', () => {
    expect(safeRedirectPath('//evil.com')).toBe('/admin');
  });

  it('returns fallback for null or empty', () => {
    expect(safeRedirectPath(null)).toBe('/admin');
    expect(safeRedirectPath('')).toBe('/admin');
  });

  it('respects custom fallback', () => {
    expect(safeRedirectPath('https://evil.com', '/login')).toBe('/login');
  });

  it('rejects paths with backslashes (open-redirect via UA normalization)', () => {
    expect(safeRedirectPath('/\\evil.com')).toBe('/admin');
    expect(safeRedirectPath('/admin\\..\\evil.com')).toBe('/admin');
  });

  it('rejects paths with control characters (header injection)', () => {
    expect(safeRedirectPath('/admin\r\nSet-Cookie: evil=1')).toBe('/admin');
    expect(safeRedirectPath('/path\x00null')).toBe('/admin');
    expect(safeRedirectPath('/path\x1Fctrl')).toBe('/admin');
  });
});
