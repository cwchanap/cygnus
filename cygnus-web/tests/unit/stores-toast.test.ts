import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with an empty toast list', async () => {
    const { toastStore } = await import('../../src/stores/toast');
    expect(get(toastStore)).toEqual([]);
  });

  it('adds a toast with show()', async () => {
    const { toastStore } = await import('../../src/stores/toast');
    toastStore.show('Hello', 'info');
    const toasts = get(toastStore);
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Hello');
    expect(toasts[0].type).toBe('info');
    expect(toasts[0].id).toBeDefined();
  });

  it('defaults to type "info" when no type given', async () => {
    const { toastStore } = await import('../../src/stores/toast');
    toastStore.show('Default type');
    const toasts = get(toastStore);
    expect(toasts[0].type).toBe('info');
  });

  it('supports all toast types: success, error, info', async () => {
    const { toastStore } = await import('../../src/stores/toast');
    toastStore.show('Success!', 'success');
    toastStore.show('Error!', 'error');
    toastStore.show('Info!', 'info');
    const toasts = get(toastStore);
    expect(toasts).toHaveLength(3);
    expect(toasts.map((t) => t.type)).toEqual(['success', 'error', 'info']);
  });

  it('assigns unique ids to each toast', async () => {
    const { toastStore } = await import('../../src/stores/toast');
    toastStore.show('First');
    toastStore.show('Second');
    const toasts = get(toastStore);
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });

  it('remove() removes a toast by id', async () => {
    const { toastStore } = await import('../../src/stores/toast');
    toastStore.show('Removable');
    const id = get(toastStore)[0].id;
    toastStore.remove(id);
    expect(get(toastStore)).toHaveLength(0);
  });

  it('remove() does not affect other toasts', async () => {
    const { toastStore } = await import('../../src/stores/toast');
    toastStore.show('First');
    toastStore.show('Second');
    const firstId = get(toastStore)[0].id;
    toastStore.remove(firstId);
    const remaining = get(toastStore);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].message).toBe('Second');
  });

  it('remove() is a no-op for unknown ids', async () => {
    const { toastStore } = await import('../../src/stores/toast');
    toastStore.show('Existing');
    toastStore.remove('nonexistent-id');
    expect(get(toastStore)).toHaveLength(1);
  });

  it('auto-removes toast after 5 seconds', async () => {
    const { toastStore } = await import('../../src/stores/toast');
    toastStore.show('Auto-dismiss');
    expect(get(toastStore)).toHaveLength(1);
    vi.advanceTimersByTime(5000);
    expect(get(toastStore)).toHaveLength(0);
  });

  it('does not auto-remove before 5 seconds have elapsed', async () => {
    const { toastStore } = await import('../../src/stores/toast');
    toastStore.show('Stays a while');
    vi.advanceTimersByTime(4999);
    expect(get(toastStore)).toHaveLength(1);
  });

  it('each toast auto-removes independently', async () => {
    const { toastStore } = await import('../../src/stores/toast');
    toastStore.show('First');
    vi.advanceTimersByTime(2000);
    toastStore.show('Second');
    vi.advanceTimersByTime(3000); // 5s elapsed for First, 3s for Second
    expect(get(toastStore)).toHaveLength(1);
    expect(get(toastStore)[0].message).toBe('Second');
    vi.advanceTimersByTime(2000); // now 5s for Second too
    expect(get(toastStore)).toHaveLength(0);
  });
});
