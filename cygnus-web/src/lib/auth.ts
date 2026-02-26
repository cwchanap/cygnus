/**
 * Returns true if the request carries a valid admin auth cookie.
 * Uses exact value matching to prevent bypass via cookies like admin_auth=10.
 */
export function isAdminAuthed(request: Request): boolean {
  return (request.headers.get('cookie') ?? '')
    .split(';')
    .some((c) => {
      const [name, value] = c.trim().split('=');
      return name === 'admin_auth' && value === '1';
    });
}

/**
 * Validates that a redirect destination is a safe relative path on this origin.
 * Returns the path if safe, or the fallback otherwise.
 */
export function safeRedirectPath(raw: string | null, fallback = '/admin'): string {
  if (!raw) return fallback;
  // Must start with / but not // (protocol-relative)
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return fallback;
}
