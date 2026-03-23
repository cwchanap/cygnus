import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';

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
  },
];

const paginatedResponse = {
  songs: mockSongs,
  pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

const emptyResponse = {
  songs: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
};

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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(paginatedResponse),
      })
    );
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getByText('Drum Beat')).toBeInTheDocument();
    });
    expect(screen.getByText('Jazz Groove')).toBeInTheDocument();
  });

  it('renders artist column', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(paginatedResponse),
      })
    );
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getByText('AI Composer')).toBeInTheDocument();
    });
  });

  it('shows "Released" badge for released songs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(paginatedResponse),
      })
    );
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getByText('Released')).toBeInTheDocument();
    });
  });

  it('shows "Draft" badge for unreleased songs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(paginatedResponse),
      })
    );
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });
  });

  it('shows "No songs found" when empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(emptyResponse),
      })
    );
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getByText(/No songs found/i)).toBeInTheDocument();
    });
  });

  it('shows error message on fetch failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    );
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch songs/i)).toBeInTheDocument();
    });
  });

  it('enters edit mode when Edit button is clicked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(paginatedResponse),
      })
    );
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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(paginatedResponse),
      })
    );
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
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(paginatedResponse),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) // DELETE
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(paginatedResponse),
      }); // re-fetch
    vi.stubGlobal('fetch', mockFetch);
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
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(paginatedResponse),
    });
    vi.stubGlobal('fetch', mockFetch);
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(
        2
      );
    });
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await fireEvent.click(deleteButtons[0]);
    // Only the initial GET call, no DELETE
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('submits PUT request when Save is clicked in edit mode', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(paginatedResponse),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) // PUT
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(paginatedResponse),
      }); // re-fetch
    vi.stubGlobal('fetch', mockFetch);
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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(paginatedResponse),
      })
    );
    render(SongManagement);
    await waitFor(() => {
      expect(screen.getByText('Song Name')).toBeInTheDocument();
    });
    expect(screen.getByText('Artist')).toBeInTheDocument();
    expect(screen.getByText('BPM')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});
