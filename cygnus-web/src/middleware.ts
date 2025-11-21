import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (_context, next) => {
  // No-op middleware. Cloudflare bindings are provided by the Cloudflare adapter
  // via `locals.runtime.env` when running under Wrangler or platformProxy.
  return next();
});
