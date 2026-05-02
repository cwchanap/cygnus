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
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(emptySongsResponse),
    });
    vi.stubGlobal('fetch', mockFetch);
    render(MusicHome);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/songs?page=1&limit=20');
    });
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

  it('filters songs by selected category', async () => {
    const songsResponse = {
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

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(songsResponse),
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
});
