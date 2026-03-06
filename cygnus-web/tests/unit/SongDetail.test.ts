import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SongDetail from '../../src/components/SongDetail.svelte';

describe('SongDetail', () => {
  const mockSong = {
    id: '1',
    title: 'Test Song',
    origin: 'AI Generated',
    bpm: 120,
    releaseDate: '2023-01-01',
    previewImage: 'test.jpg',
  };

  let mockAudioInstance: {
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockAudioInstance = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('Audio', vi.fn(() => mockAudioInstance));
  });

  it('renders song details when song is provided', () => {
    render(SongDetail, { props: { song: mockSong } });

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('via AI Generated')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('2023-01-01')).toBeInTheDocument();
  });

  it('renders placeholder when no song is provided', () => {
    render(SongDetail, { props: { song: null } });

    expect(screen.getByText('SELECT A TRACK')).toBeInTheDocument();
    expect(screen.getByText('Choose a composition from the library')).toBeInTheDocument();
  });

  it('renders play button when song is provided', () => {
    render(SongDetail, { props: { song: mockSong } });

    expect(screen.getByRole('button', { name: /Play Preview/i })).toBeInTheDocument();
  });

  it('creates new Audio instance when playPreview is clicked', async () => {
    const songWithPreview = { ...mockSong, previewUrl: 'https://example.com/preview.mp3' };
    render(SongDetail, { props: { song: songWithPreview } });

    const playButton = screen.getByRole('button', { name: /Play Preview/i });
    await fireEvent.click(playButton);

    expect(Audio).toHaveBeenCalledWith('https://example.com/preview.mp3');
    expect(mockAudioInstance.play).toHaveBeenCalled();
  });

  it('pauses audio when playPreview is clicked while playing', async () => {
    const songWithPreview = { ...mockSong, previewUrl: 'https://example.com/preview.mp3' };
    render(SongDetail, { props: { song: songWithPreview } });

    const playButton = screen.getByRole('button', { name: /Play Preview/i });
    
    await fireEvent.click(playButton);
    expect(mockAudioInstance.play).toHaveBeenCalled();
    
    await fireEvent.click(playButton);
    expect(mockAudioInstance.pause).toHaveBeenCalled();
  });

  it('creates new Audio when song previewUrl changes', async () => {
    const songWithPreview1 = { ...mockSong, id: '1', previewUrl: 'https://example.com/song1.mp3' };
    const songWithPreview2 = { ...mockSong, id: '2', previewUrl: 'https://example.com/song2.mp3' };

    const { rerender } = render(SongDetail, { props: { song: songWithPreview1 } });
    
    const playButton = screen.getByRole('button', { name: /Play Preview/i });
    await fireEvent.click(playButton);
    
    expect(Audio).toHaveBeenCalledWith('https://example.com/song1.mp3');
    const prevAudioCall = vi.mocked(Audio).mock.calls.length;

    await rerender({ song: songWithPreview2 });
    await fireEvent.click(playButton);

    expect(Audio).toHaveBeenCalledWith('https://example.com/song2.mp3');
    expect(vi.mocked(Audio).mock.calls.length).toBeGreaterThan(prevAudioCall);
  });
});