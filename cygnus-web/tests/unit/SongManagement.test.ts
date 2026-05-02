import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import AdminSongCategories from '../../src/components/AdminSongCategories.svelte';

const mockSongs = [
  {
    id: 1,
    song_name: 'Drum Beat',
    artist: 'AI Composer',
    bpm: 120,
    release_date: '2024-01-15',
    is_released: true,
    created_date: '2024-01-10T12:00:00Z',
    origin: 'AI',
    r2_key: 'songs/drum-beat.mid',
    categoryId: 1,
    categoryName: 'Drum and Bass',
  },
  {
    id: 2,
    song_name: 'Jazz Groove',
    artist: 'Neural Net',
    bpm: 95,
    release_date: '2024-02-01',
    is_released: false,
    created_date: '2024-01-20T09:00:00Z',
    origin: 'AI',
    r2_key: 'songs/jazz-groove.mid',
    categoryId: null,
    categoryName: null,
  },
];

const mockCategories = [
  { id: 1, name: 'Drum and Bass' },
  { id: 2, name: 'House' },
];

const paginatedResponse = {
  songs: mockSongs,
  pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

const emptyResponse = {
  songs: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
};

function stubSongManagementFetch({
  songsResponse = paginatedResponse,
  categoriesResponse = { categories: mockCategories },
  songsOk = true,
  categoriesOk = true,
}: {
  songsResponse?: typeof paginatedResponse;
  categoriesResponse?: { categories: typeof mockCategories };
  songsOk?: boolean;
  categoriesOk?: boolean;
} = {}) {
  const mockFetch = vi
    .fn()
    .mockImplementation((url: string, options?: RequestInit) => {
      if (url === '/api/admin/categories') {
        return Promise.resolve({
          ok: categoriesOk,
          status: categoriesOk ? 200 : 500,
          json: () => Promise.resolve(categoriesResponse),
        });
      }

      if (url.startsWith('/api/admin/songs') && !options?.method) {
        return Promise.resolve({
          ok: songsOk,
          status: songsOk ? 200 : 500,
          json: () => Promise.resolve(songsResponse),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

beforeEach(() => {
  vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

import SongManagement from '../../src/components/SongManagement.svelte';

describe('SongManagement', () => {
  it('shows loading state initially', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    render(SongManagement);
    expect(screen.getByText(/Loading songs/i)).toBeInTheDocument();
  });

  it('renders the songs table after loading', async () => {
    stubSongManagementFetch();
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getByText('Drum Beat')).toBeInTheDocument();
    });
    expect(screen.getByText('Jazz Groove')).toBeInTheDocument();
  });

  it('renders artist column', async () => {
    stubSongManagementFetch();
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getByText('AI Composer')).toBeInTheDocument();
    });
  });

  it('shows "Released" badge for released songs', async () => {
    stubSongManagementFetch();
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getByText('Released')).toBeInTheDocument();
    });
  });

  it('shows "Draft" badge for unreleased songs', async () => {
    stubSongManagementFetch();
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });
  });

  it('shows "No songs found" when empty', async () => {
    stubSongManagementFetch({ songsResponse: emptyResponse });
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getByText(/No songs found/i)).toBeInTheDocument();
    });
  });

  it('shows error message on fetch failure', async () => {
    stubSongManagementFetch({ songsOk: false });
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch songs/i)).toBeInTheDocument();
    });
  });

  it('enters edit mode when Edit button is clicked', async () => {
    stubSongManagementFetch();
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(2);
    });
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await fireEvent.click(editButtons[0]);
    // Should show Save and Cancel buttons
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('exits edit mode when Cancel button is clicked', async () => {
    stubSongManagementFetch();
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(2);
    });
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await fireEvent.click(editButtons[0]);
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await fireEvent.click(cancelButton);
    // Edit mode should be gone, Edit buttons back
    expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(2);
  });

  it('calls DELETE endpoint when Delete is confirmed', async () => {
    const mockFetch = stubSongManagementFetch();
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(
        2
      );
    });
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/songs?id='),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('does not call DELETE when confirm is cancelled', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));
    const mockFetch = stubSongManagementFetch();
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(
        2
      );
    });
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await fireEvent.click(deleteButtons[0]);
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/songs?id='),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('submits PUT request when Save is clicked in edit mode', async () => {
    const mockFetch = stubSongManagementFetch();
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(2);
    });
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await fireEvent.click(editButtons[0]);
    const saveButton = screen.getByRole('button', { name: /save/i });
    await fireEvent.click(saveButton);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/songs',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  it('renders table headers', async () => {
    stubSongManagementFetch();
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getByText('Song Name')).toBeInTheDocument();
    });
    expect(screen.getByText('Artist')).toBeInTheDocument();
    expect(screen.getByText('BPM')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders category column and uncategorized fallback', async () => {
    stubSongManagementFetch();
    render(SongManagement);

    await waitFor(() => {
      expect(screen.getByText('Category')).toBeInTheDocument();
    });
    expect(screen.getByText('Drum and Bass')).toBeInTheDocument();
    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
  });

  it('shows category select in edit mode', async () => {
    stubSongManagementFetch();
    render(SongManagement);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(2);
    });
    await fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0]);

    const select = screen.getByLabelText(/Category/i) as HTMLSelectElement;
    expect(select.name).toBe('categoryId');
    expect(select.value).toBe('1');
    expect(screen.getByRole('option', { name: 'House' })).toBeInTheDocument();
  });

  it('keeps edit controls unavailable while categories are loading', async () => {
    const categoryPromise = new Promise(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/admin/categories') {
          return categoryPromise;
        }

        if (url.startsWith('/api/admin/songs') && !options?.method) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(paginatedResponse),
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      })
    );

    render(SongManagement);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByText(/Loading songs/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /edit/i })
    ).not.toBeInTheDocument();
  });

  it('refetches songs and categories when category management changes categories', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/admin/categories' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ message: 'Category created successfully' }),
          });
        }

        if (url === '/api/admin/categories') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ categories: mockCategories }),
          });
        }

        if (url.startsWith('/api/admin/songs') && !options?.method) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(paginatedResponse),
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });
    vi.stubGlobal('fetch', fetchMock);

    render(AdminSongCategories);

    await waitFor(() => {
      expect(screen.getByText('Drum Beat')).toBeInTheDocument();
    });

    const initialSongFetchCount = fetchMock.mock.calls.filter(
      ([url, options]) =>
        typeof url === 'string' &&
        url.startsWith('/api/admin/songs') &&
        !(options as RequestInit | undefined)?.method
    ).length;
    const initialCategoryFetchCount = fetchMock.mock.calls.filter(
      ([url, options]) =>
        url === '/api/admin/categories' &&
        !(options as RequestInit | undefined)?.method
    ).length;

    await fireEvent.input(screen.getByLabelText(/New category/i), {
      target: { value: 'Techno' },
    });
    await fireEvent.click(
      screen.getByRole('button', { name: /Create Category/i })
    );

    await waitFor(() => {
      const songFetchCount = fetchMock.mock.calls.filter(
        ([url, options]) =>
          typeof url === 'string' &&
          url.startsWith('/api/admin/songs') &&
          !(options as RequestInit | undefined)?.method
      ).length;
      const categoryFetchCount = fetchMock.mock.calls.filter(
        ([url, options]) =>
          url === '/api/admin/categories' &&
          !(options as RequestInit | undefined)?.method
      ).length;

      expect(songFetchCount).toBeGreaterThan(initialSongFetchCount);
      expect(categoryFetchCount).toBeGreaterThan(initialCategoryFetchCount);
    });
  });
});
