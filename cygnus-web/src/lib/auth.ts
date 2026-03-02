/**
 * Returns true if the request carries a valid admin auth cookie.
 * Uses exact value matching to prevent bypass via cookies like admin_auth=10.
 */
export function isAdminAuthed(request: Request): boolean {
  return (request.headers.get('cookie') ?? '')
    .split(';')
    .some((c) => {
      const trimmed = c.trim();
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return false;
      const name = trimmed.slice(0, eqIdx);
      const value = trimmed.slice(eqIdx + 1);
      return name === 'admin_auth' && value === '1';
    });
}

/**
 * Validates that a redirect destination is a safe relative path on this origin.
 * Returns the path if safe, or the fallback otherwise.
 */
export function safeRedirectPath(raw: string | null, fallback = '/admin'): string {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  // Must start with a single / but not // (protocol-relative)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }
  // Reject backslashes, which some user agents normalize into protocol-relative URLs.
  if (trimmed.includes('\\')) {
    return fallback;
  }
  // Reject ASCII control characters (0x00-0x1F, 0x7F) which are not safe in paths.
  const hasControlChar = Array.from(trimmed).some(ch => {
    const code = ch.charCodeAt(0);
    return code <= 0x1F || code === 0x7F;
  });
  if (hasControlChar) {
    return fallback;
  }
  return trimmed;
}
