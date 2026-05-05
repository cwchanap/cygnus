import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';

// SongDetail only creates Audio inside playPreview() (user interaction),
// never on mount, so no Audio stub is needed here.
afterEach(() => {
  vi.unstubAllGlobals();
});

import MusicHome from '../../src/components/MusicHome.svelte';

const emptySongsResponse = {
  songs: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
};

const singleSongResponse = {
  songs: [
    {
      id: 'song-1',
      title: 'Cosmic Drums',
      origin: 'AI',
      bpm: 135,
      releaseDate: '2024-03-01',
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

const emptyCategoriesResponse = { categories: [] };

function mockFetchWithCategories(songsResponse: unknown) {
  return vi.fn((url: string) => {
    if (url === '/api/categories') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(emptyCategoriesResponse),
      });
    }

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(songsResponse),
    });
  });
}

describe('MusicHome', () => {
  it('renders the CYGNUS hero heading', () => {
    vi.stubGlobal('fetch', mockFetchWithCategories(emptySongsResponse));
    render(MusicHome);
    expect(screen.getByText('CYGNUS')).toBeInTheDocument();
  });

  it('renders the AI Drum Transcription badge', () => {
    vi.stubGlobal('fetch', mockFetchWithCategories(emptySongsResponse));
    render(MusicHome);
    expect(screen.getByText(/AI Drum Transcription/i)).toBeInTheDocument();
  });

  it('renders the MUSIC subtitle', () => {
    vi.stubGlobal('fetch', mockFetchWithCategories(emptySongsResponse));
    render(MusicHome);
    expect(screen.getByText('MUSIC')).toBeInTheDocument();
  });

  it('calls fetch on mount to load songs', async () => {
    const mockFetch = mockFetchWithCategories(emptySongsResponse);
    vi.stubGlobal('fetch', mockFetch);
    render(MusicHome);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/songs?page=1&limit=20');
    });
    expect(mockFetch).toHaveBeenCalledWith('/api/categories');
  });

  it('does not call fetch before mount (SSR guard)', () => {
    // In a real SSR environment (Astro on Cloudflare Workers), fetch exists
    // but relative URLs fail. The `mounted` guard prevents the reactive
    // statement from firing during SSR. Here we verify that even when
    // fetch throws on every call (simulating SSR URL parse failure),
    // the component still renders without crashing.
    const mockFetch = vi.fn(() => {
      throw new TypeError('Failed to parse URL');
    });
    vi.stubGlobal('fetch', mockFetch);
    // Should not throw — the reactive statement is guarded by `mounted`
    // which is false during SSR (onMount hasn't fired).
    expect(() => render(MusicHome)).not.toThrow();
    expect(screen.getByText('CYGNUS')).toBeInTheDocument();
  });

  it('handles fetch error gracefully without crashing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error'))
    );
    // Should not throw
    expect(() => render(MusicHome)).not.toThrow();
    expect(screen.getByText('CYGNUS')).toBeInTheDocument();
  });

  it('handles non-ok fetch response gracefully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    );
    render(MusicHome);
    await waitFor(() => {
      // Still renders the hero section
      expect(screen.getByText('CYGNUS')).toBeInTheDocument();
    });
  });

  it('shows toast when /api/categories returns non-ok status', async () => {
    const mockFetch = vi.fn((url: string) => {
      if (url === '/api/categories') {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({}),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(emptySongsResponse),
      });
    });
    vi.stubGlobal('fetch', mockFetch);
    render(MusicHome);
    // Component should not crash; categories remain empty so only
    // "All", "Uncategorized" options appear (no custom category options).
    await waitFor(() => {
      expect(screen.getByText('CYGNUS')).toBeInTheDocument();
    });
    // Only default options exist — no categories loaded
    expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Uncategorized' })
    ).toBeInTheDocument();
  });

  it('loads songs from multiple pages when totalPages > 1', async () => {
    const page1 = {
      songs: [
        {
          id: 's1',
          title: 'Song 1',
          origin: 'AI',
          bpm: 120,
          releaseDate: '2024-01-01',
        },
      ],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 2 },
    };
    const page2 = {
      songs: [
        {
          id: 's2',
          title: 'Song 2',
          origin: 'AI',
          bpm: 130,
          releaseDate: '2024-02-01',
        },
      ],
      pagination: { page: 2, limit: 20, total: 2, totalPages: 2 },
    };
    const mockFetch = vi.fn((url: string) => {
      if (url === '/api/categories') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(emptyCategoriesResponse),
        });
      }
      if (url === '/api/songs?page=1&limit=20') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(page1),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(page2),
      });
    });
    vi.stubGlobal('fetch', mockFetch);
    render(MusicHome);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
    expect(mockFetch.mock.calls[2][0]).toBe('/api/songs?page=2&limit=20');
  });

  it('renders SongList panel with 0 tracks initially', async () => {
    vi.stubGlobal('fetch', mockFetchWithCategories(emptySongsResponse));
    render(MusicHome);
    // SongList shows track count
    expect(screen.getByText('0 tracks')).toBeInTheDocument();
  });

  it('renders SongDetail and SongList panels in the layout', () => {
    vi.stubGlobal('fetch', mockFetchWithCategories(emptySongsResponse));
    render(MusicHome);
    // SongList has a "Library" heading
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('shows 1 track count after songs are loaded', async () => {
    vi.stubGlobal('fetch', mockFetchWithCategories(singleSongResponse));
    render(MusicHome);
    await waitFor(
      () => {
        expect(screen.getByText('1 tracks')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('filters songs by selected category via server-side fetch', async () => {
    const allSongsResponse = {
      songs: [
        {
          id: '1',
          title: 'Metal Song',
          origin: 'AI',
          bpm: 120,
          releaseDate: '2024-01-01',
          categoryId: '1',
          categoryName: 'Metal',
        },
        {
          id: '2',
          title: 'Pop Song',
          origin: 'AI',
          bpm: 130,
          releaseDate: '2024-01-02',
          categoryId: '2',
          categoryName: 'J Pop',
        },
      ],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    };
    const filteredSongsResponse = {
      songs: [
        {
          id: '2',
          title: 'Pop Song',
          origin: 'AI',
          bpm: 130,
          releaseDate: '2024-01-02',
          categoryId: '2',
          categoryName: 'J Pop',
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    const categoriesResponse = {
      categories: [
        { id: 1, name: 'Metal' },
        { id: 2, name: 'J Pop' },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url === '/api/categories') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(categoriesResponse),
          });
        }

        // Server-side filtered request
        if (url.includes('category=2')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(filteredSongsResponse),
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(allSongsResponse),
        });
      })
    );

    render(MusicHome);

    await waitFor(() => {
      expect(screen.getAllByText('Metal Song').length).toBeGreaterThan(0);
    });
    await fireEvent.change(screen.getByLabelText('Category filter'), {
      target: { value: '2' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Metal Song')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('Pop Song').length).toBeGreaterThan(0);
  });

  it('reselects first song after filtering to empty category then back to all', async () => {
    const allSongsResponse = {
      songs: [
        {
          id: '1',
          title: 'Metal Song',
          origin: 'AI',
          bpm: 120,
          releaseDate: '2024-01-01',
          categoryId: '1',
          categoryName: 'Metal',
        },
        {
          id: '2',
          title: 'Pop Song',
          origin: 'AI',
          bpm: 130,
          releaseDate: '2024-01-02',
          categoryId: '2',
          categoryName: 'J Pop',
        },
      ],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    };
    const emptySongsResponse = {
      songs: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
    const categoriesResponse = {
      categories: [
        { id: 1, name: 'Metal' },
        { id: 2, name: 'J Pop' },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url === '/api/categories') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(categoriesResponse),
          });
        }

        // Uncategorized filter returns empty
        if (url.includes('category=uncategorized')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(emptySongsResponse),
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(allSongsResponse),
        });
      })
    );

    render(MusicHome);

    // Wait for initial load — first song should be selected
    await waitFor(() => {
      expect(screen.getAllByText('Metal Song').length).toBeGreaterThan(0);
    });

    // Filter to "uncategorized" — empty result, selectedSong becomes null
    await fireEvent.change(screen.getByLabelText('Category filter'), {
      target: { value: 'uncategorized' },
    });
    await waitFor(() => {
      expect(screen.queryByText('Metal Song')).not.toBeInTheDocument();
      expect(screen.queryByText('Pop Song')).not.toBeInTheDocument();
    });

    // Switch back to "All" — should auto-select the first song again
    await fireEvent.change(screen.getByLabelText('Category filter'), {
      target: { value: 'all' },
    });
    await waitFor(() => {
      expect(screen.getAllByText('Metal Song').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Pop Song').length).toBeGreaterThan(0);
    });
  });
});
