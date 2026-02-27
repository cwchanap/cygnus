/**
 * Shared client-side configuration for the cygnus-api Python backend.
 * Import API_BASE_URL from here instead of redeclaring it in each module.
 */
export const API_BASE_URL: string =
  (import.meta.env.PUBLIC_CRUX_API_URL as string) || 'http://localhost:8000';
