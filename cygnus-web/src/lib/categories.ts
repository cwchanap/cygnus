export type CategoryDto = {
  id: number;
  name: string;
};

export function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

export function parseCategoryId(
  value: FormDataEntryValue | string | null
): number | null {
  if (value == null) return null;
  const raw = String(value).trim();
  if (raw === '') return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function categoryDisplayName(name: string | null | undefined): string {
  return name ?? 'Uncategorized';
}
