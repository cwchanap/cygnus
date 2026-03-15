import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SongList from '../../src/components/SongList.svelte';

type Song = {
  id: string;
  title: string;
  origin: string;
  bpm: number;
  releaseDate: string;
  previewUrl?: string;
  previewImage?: string;
};

function makeSongs(count: number): Song[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `song-${i + 1}`,
    title: `Track ${i + 1}`,
    origin: 'AI',
    bpm: 120 + i,
    releaseDate: '2024-01-01',
  }));
}

describe('SongList', () => {
  it('shows empty state when songs array is empty', () => {
    render(SongList, { props: { songs: [] } });
    expect(screen.getByText(/No tracks yet/i)).toBeInTheDocument();
  });

  it('shows track count in the header', () => {
    render(SongList, { props: { songs: makeSongs(5) } });
    expect(screen.getByText('5 tracks')).toBeInTheDocument();
  });

  it('shows 0 tracks in header for empty list', () => {
    render(SongList, { props: { songs: [] } });
    expect(screen.getByText('0 tracks')).toBeInTheDocument();
  });

  it('renders song titles', () => {
    render(SongList, { props: { songs: makeSongs(3) } });
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Track 2')).toBeInTheDocument();
    expect(screen.getByText('Track 3')).toBeInTheDocument();
  });

  it('renders BPM badge for each song', () => {
    render(SongList, {
      props: {
        songs: [
          {
            id: '1',
            title: 'Beat',
            origin: 'AI',
            bpm: 140,
            releaseDate: '2024-01-01',
          },
        ],
      },
    });
    expect(screen.getByText('140')).toBeInTheDocument();
  });

  it('renders origin label for each song', () => {
    render(SongList, {
      props: {
        songs: [
          {
            id: '1',
            title: 'Beat',
            origin: 'Human',
            bpm: 100,
            releaseDate: '2024-01-01',
          },
        ],
      },
    });
    // CSS `uppercase` is a visual transform; DOM text content is the raw value
    expect(screen.getByText('Human')).toBeInTheDocument();
  });

  it('pads track indices with leading zero (01, 02, ...)', () => {
    render(SongList, { props: { songs: makeSongs(2) } });
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
  });

  it('renders only first 10 songs initially for large lists', () => {
    render(SongList, { props: { songs: makeSongs(25) } });
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Track 10')).toBeInTheDocument();
    expect(screen.queryByText('Track 11')).not.toBeInTheDocument();
  });

  it('shows all songs when count is 10 or less', () => {
    render(SongList, { props: { songs: makeSongs(10) } });
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(`Track ${i}`)).toBeInTheDocument();
    }
  });

  it('renders each song as a clickable button', async () => {
    const songs = makeSongs(3);
    render(SongList, { props: { songs } });
    const buttons = screen.getAllByRole('button');
    // All songs should be buttons that can be clicked without error
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      await expect(fireEvent.click(button)).resolves.not.toThrow();
    }
  });

  it('shows the "Library" heading', () => {
    render(SongList, { props: { songs: [] } });
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('does not show "— End of library —" footer when not all items are visible yet', () => {
    // 11 songs means initially only 10 are visible (visibleCount starts at 10)
    render(SongList, { props: { songs: makeSongs(11) } });
    expect(screen.queryByText(/End of library/i)).not.toBeInTheDocument();
  });

  it('applies selected styling when selectedSongId matches', () => {
    const songs = makeSongs(2);
    render(SongList, { props: { songs, selectedSongId: 'song-1' } });
    const buttons = screen.getAllByRole('button');
    // First button (song-1) should have selected class containing c2ff00
    expect(buttons[0].className).toContain('border-l-[#c2ff00]');
    // Second button should not be selected
    expect(buttons[1].className).toContain('border-l-transparent');
  });
});
