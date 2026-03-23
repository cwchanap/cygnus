import { describe, it, expect } from 'vitest';
import { cn } from '../../src/lib/utils';

describe('cn', () => {
  it('returns empty string with no arguments', () => {
    expect(cn()).toBe('');
  });

  it('merges two class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes (false is ignored)', () => {
    const isActive = false;
    expect(cn('foo', isActive && 'bar', 'baz')).toBe('foo baz');
  });

  it('handles undefined values', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('handles null values', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar');
  });

  it('resolves tailwind conflicts (last class wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('resolves text-size conflicts', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('merges multiple non-conflicting tailwind classes', () => {
    const result = cn('flex', 'items-center', 'gap-2');
    expect(result).toBe('flex items-center gap-2');
  });

  it('handles array of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles object with truthy/falsy values', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });
});
