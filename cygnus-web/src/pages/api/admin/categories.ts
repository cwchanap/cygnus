import type { APIRoute } from 'astro';
import { and, asc, eq, ne } from 'drizzle-orm';
import { isAdminAuthed } from '../../../lib/auth';
import {
  normalizeCategoryName,
  parseCategoryId,
} from '../../../lib/categories';
import { createDb } from '../../../lib/db';
import { categories, songs } from '../../../lib/db/schema';

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function unauthorizedResponse() {
  return jsonResponse({ message: 'Unauthorized' }, 401);
}

function missingDbResponse() {
  return jsonResponse(
    { message: 'Server configuration error: D1 binding missing.' },
    500
  );
}

function validateRuntime(request: Request, locals: App.Locals) {
  if (!isAdminAuthed(request)) {
    return { response: unauthorizedResponse() };
  }

  const runtime = locals.runtime;
  if (!runtime?.env?.DB) {
    return { response: missingDbResponse() };
  }

  return { db: createDb(runtime.env.DB) };
}

async function parseName(request: Request) {
  const body = (await request.json()) as { name?: unknown };
  const name = typeof body.name === 'string' ? body.name.trim() : '';

  if (!name) {
    return {
      error: jsonResponse({ message: 'Category name is required' }, 400),
    };
  }

  return {
    name,
    normalizedName: normalizeCategoryName(name),
    body,
  };
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = validateRuntime(request, locals);
    if ('response' in runtime) return runtime.response;

    const rows = await runtime.db
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
    console.error('GET /api/admin/categories error', err);
    return jsonResponse({ message: 'Internal Server Error' }, 500);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = validateRuntime(request, locals);
    if ('response' in runtime) return runtime.response;

    const parsed = await parseName(request);
    if ('error' in parsed) return parsed.error;

    const existingCategory = await runtime.db
      .select()
      .from(categories)
      .where(eq(categories.normalized_name, parsed.normalizedName))
      .get();

    if (existingCategory) {
      return jsonResponse({ message: 'Category already exists' }, 409);
    }

    await runtime.db
      .insert(categories)
      .values({
        name: parsed.name,
        normalized_name: parsed.normalizedName,
        created_date: new Date().toISOString(),
      })
      .run();

    return jsonResponse({ message: 'Category created successfully' }, 201);
  } catch (err) {
    console.error('POST /api/admin/categories error', err);
    return jsonResponse({ message: 'Internal Server Error' }, 500);
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = validateRuntime(request, locals);
    if ('response' in runtime) return runtime.response;

    const parsed = await parseName(request);
    if ('error' in parsed) return parsed.error;

    const categoryId = parseCategoryId(parsed.body.id as string | null);
    if (!categoryId) {
      return jsonResponse(
        { message: 'Category ID must be a positive integer' },
        400
      );
    }

    const existingCategory = await runtime.db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .get();

    if (!existingCategory) {
      return jsonResponse({ message: 'Category not found' }, 404);
    }

    const duplicateCategory = await runtime.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.normalized_name, parsed.normalizedName),
          ne(categories.id, categoryId)
        )
      )
      .get();

    if (duplicateCategory) {
      return jsonResponse({ message: 'Category already exists' }, 409);
    }

    await runtime.db
      .update(categories)
      .set({
        name: parsed.name,
        normalized_name: parsed.normalizedName,
      })
      .where(eq(categories.id, categoryId))
      .run();

    return jsonResponse({ message: 'Category updated successfully' }, 200);
  } catch (err) {
    console.error('PUT /api/admin/categories error', err);
    return jsonResponse({ message: 'Internal Server Error' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = validateRuntime(request, locals);
    if ('response' in runtime) return runtime.response;

    const url = new URL(request.url);
    const categoryId = parseCategoryId(url.searchParams.get('id'));
    if (!categoryId) {
      return jsonResponse(
        { message: 'Category ID must be a positive integer' },
        400
      );
    }

    const existingCategory = await runtime.db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .get();

    if (!existingCategory) {
      return jsonResponse({ message: 'Category not found' }, 404);
    }

    await runtime.db
      .update(songs)
      .set({ category_id: null })
      .where(eq(songs.category_id, categoryId))
      .run();

    await runtime.db
      .delete(categories)
      .where(eq(categories.id, categoryId))
      .run();

    return jsonResponse({ message: 'Category deleted successfully' }, 200);
  } catch (err) {
    console.error('DELETE /api/admin/categories error', err);
    return jsonResponse({ message: 'Internal Server Error' }, 500);
  }
};
