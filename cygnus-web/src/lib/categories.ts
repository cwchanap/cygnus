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
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function categoryDisplayName(name: string | null | undefined): string {
  return name ?? 'Uncategorized';
}
