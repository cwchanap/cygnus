import { describe, expect, it } from 'vitest';
import {
  normalizeCategoryName,
  parseCategoryId,
  categoryDisplayName,
} from '../../src/lib/categories';

describe('category helpers', () => {
  it('normalizes names by trimming and lowercasing', () => {
    expect(normalizeCategoryName('  J Pop  ')).toBe('j pop');
    expect(normalizeCategoryName('METAL')).toBe('metal');
  });

  it('rejects blank normalized names', () => {
    expect(normalizeCategoryName('   ')).toBe('');
  });

  it('parses positive category IDs', () => {
    expect(parseCategoryId('42')).toBe(42);
  });

  it('returns null for missing or invalid category IDs', () => {
    expect(parseCategoryId(null)).toBeNull();
    expect(parseCategoryId('')).toBeNull();
    expect(parseCategoryId('abc')).toBeNull();
    expect(parseCategoryId('12abc')).toBeNull();
    expect(parseCategoryId('1.5')).toBeNull();
    expect(parseCategoryId('-1')).toBeNull();
  });

  it('uses Uncategorized when category name is missing', () => {
    expect(categoryDisplayName(null)).toBe('Uncategorized');
    expect(categoryDisplayName('Metal')).toBe('Metal');
  });
});
