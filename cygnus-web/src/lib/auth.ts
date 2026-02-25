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
