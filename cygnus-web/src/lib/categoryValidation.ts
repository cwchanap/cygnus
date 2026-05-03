import { eq } from 'drizzle-orm';
import { parseCategoryId } from './categories';
import type { createDb } from './db';
import { categories } from './db/schema';

export async function resolveSongCategoryId(
  db: ReturnType<typeof createDb>,
  value: FormDataEntryValue | null
): Promise<{ categoryId: number | null } | { response: Response }> {
  const categoryCount = await db.$count(categories);
  // Forms submit categoryId="" for uncategorized; treat blank as missing
  const normalized =
    value != null && String(value).trim() !== '' ? value : null;
  const hasValue = normalized != null;
  const categoryId = parseCategoryId(normalized);

  if (!hasValue && categoryCount > 0) {
    return {
      response: new Response(
        JSON.stringify({ message: 'Category ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  if (!hasValue && categoryCount === 0) {
    return { categoryId: null };
  }

  if (categoryId == null) {
    return {
      response: new Response(
        JSON.stringify({
          message:
            value != null && String(value).trim() !== ''
              ? 'Category ID must be a valid positive integer'
              : 'Category ID must refer to an existing category',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  const category = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .get();

  if (!category) {
    return {
      response: new Response(
        JSON.stringify({
          message: 'Category ID must refer to an existing category',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  return { categoryId };
}
