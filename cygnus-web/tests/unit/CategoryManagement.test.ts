import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import CategoryManagement from '../../src/components/CategoryManagement.svelte';

const initialCategories = [
  { id: 1, name: 'Drum and Bass' },
  { id: 2, name: 'House' },
];

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
        json: () => Promise.resolve({ categories: initialCategories }),
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
        json: () => Promise.resolve({ categories: initialCategories }),
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
            categories: [...initialCategories, { id: 3, name: 'Techno' }],
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
});
