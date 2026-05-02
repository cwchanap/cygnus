import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import CategoryManagement from '../../src/components/CategoryManagement.svelte';

const initialCategories = [
  { id: 1, name: 'Drum and Bass' },
  { id: 2, name: 'House' },
];

function makeInitialCategories() {
  return initialCategories.map((category) => ({ ...category }));
}

describe('CategoryManagement', () => {
  beforeEach(() => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads and displays categories', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ categories: makeInitialCategories() }),
      })
    );

    render(CategoryManagement);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Drum and Bass')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('House')).toBeInTheDocument();
  });

  it('creates a category and refreshes the list', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ categories: makeInitialCategories() }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ message: 'Category created successfully' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            categories: [...makeInitialCategories(), { id: 3, name: 'Techno' }],
          }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(CategoryManagement);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Drum and Bass')).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/New category/i);
    await fireEvent.input(input, { target: { value: 'Techno' } });
    await fireEvent.click(
      screen.getByRole('button', { name: /Create Category/i })
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Techno')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/categories',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('renames a category, refreshes the list, and dispatches changed', async () => {
    const changed = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ categories: makeInitialCategories() }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ message: 'Category updated successfully' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            categories: [
              { id: 1, name: 'Breakbeat' },
              { id: 2, name: 'House' },
            ],
          }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(CategoryManagement, { events: { changed } });

    const input = (await screen.findByLabelText(
      'Category 1'
    )) as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'Breakbeat' } });
    await fireEvent.click(screen.getAllByRole('button', { name: 'Rename' })[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Breakbeat')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/categories',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ id: 1, name: 'Breakbeat' }),
      })
    );
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('deletes a category, refreshes the list, and dispatches changed', async () => {
    const changed = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ categories: makeInitialCategories() }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ message: 'Category deleted successfully' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            categories: [{ id: 2, name: 'House' }],
          }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(CategoryManagement, { events: { changed } });

    await waitFor(() => {
      expect(screen.getByLabelText('Category 1')).toHaveValue('Drum and Bass');
    });
    await fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    await waitFor(() => {
      expect(screen.queryByLabelText('Category 1')).not.toBeInTheDocument();
    });
    expect(confirm).toHaveBeenCalledWith(
      'Delete category "Drum and Bass"? Songs in this category will become uncategorized.'
    );
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/categories?id=1', {
      method: 'DELETE',
    });
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('surfaces API errors when category creation fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ categories: makeInitialCategories() }),
      })
      .mockResolvedValueOnce({
        ok: false,
        statusText: 'Conflict',
        json: () => Promise.resolve({ message: 'Category already exists' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(CategoryManagement);

    await waitFor(() => {
      expect(screen.getByLabelText('Category 1')).toHaveValue('Drum and Bass');
    });
    await fireEvent.input(screen.getByLabelText(/New category/i), {
      target: { value: 'House' },
    });
    await fireEvent.click(
      screen.getByRole('button', { name: /Create Category/i })
    );

    await expect(
      screen.findByText('Category already exists')
    ).resolves.toBeInTheDocument();
  });
});
