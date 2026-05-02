import type { APIRoute } from 'astro';
import { asc } from 'drizzle-orm';
import { createDb } from '../../lib/db';
import { categories } from '../../lib/db/schema';

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env?.DB) {
      return jsonResponse(
        { message: 'Server configuration error: D1 binding missing.' },
        500
      );
    }

    const db = createDb(runtime.env.DB);
    const rows = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.normalized_name))
      .all();

    return jsonResponse(
      {
        categories: rows.map((category) => ({
          id: category.id,
          name: category.name,
        })),
      },
      200
    );
  } catch (err) {
    console.error('GET /api/categories error', err);
    return jsonResponse({ message: 'Internal Server Error' }, 500);
  }
};
