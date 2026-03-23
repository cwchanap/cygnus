import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';

// MusicHome renders SongDetail which creates an Audio element
beforeEach(() => {
  vi.stubGlobal(
    'Audio',
    vi.fn(() => ({
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
});

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

describe('MusicHome', () => {
  it('renders the CYGNUS hero heading', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(emptySongsResponse),
      })
    );
    render(MusicHome);
    expect(screen.getByText('CYGNUS')).toBeInTheDocument();
  });

  it('renders the AI Drum Transcription badge', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(emptySongsResponse),
      })
    );
    render(MusicHome);
    expect(screen.getByText(/AI Drum Transcription/i)).toBeInTheDocument();
  });

  it('renders the MUSIC subtitle', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(emptySongsResponse),
      })
    );
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
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(page1) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(page2) });
    vi.stubGlobal('fetch', mockFetch);
    render(MusicHome);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('renders SongList panel with 0 tracks initially', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(emptySongsResponse),
      })
    );
    render(MusicHome);
    // SongList shows track count
    expect(screen.getByText('0 tracks')).toBeInTheDocument();
  });

  it('renders SongDetail and SongList panels in the layout', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(emptySongsResponse),
      })
    );
    render(MusicHome);
    // SongList has a "Library" heading
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('shows 1 track count after songs are loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(singleSongResponse),
      })
    );
    render(MusicHome);
    await waitFor(
      () => {
        expect(screen.getByText('1 tracks')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
