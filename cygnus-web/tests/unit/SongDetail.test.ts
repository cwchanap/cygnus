import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

  afterEach(() => {
    vi.unstubAllGlobals();
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

    // First click to start playing
    await fireEvent.click(playButton);
    expect(mockAudioInstance.play).toHaveBeenCalled();

    // Wait for the play promise to resolve and component to update
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.getByRole('button', { name: /Pause Preview/i })).toHaveAttribute('aria-pressed', 'true');

    // Second click to pause
    await fireEvent.click(playButton);
    expect(mockAudioInstance.pause).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Play Preview/i })).toHaveAttribute('aria-pressed', 'false');
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

  it('guards against stale play() promises when songs are switched rapidly', async () => {
    // Create a deferred promise that we can control when it resolves
    let resolvePlay1: (() => void) | null = null;
    const deferredPromise1 = new Promise<void>((resolve) => {
      resolvePlay1 = resolve;
    });

    let resolvePlay2: (() => void) | null = null;
    const deferredPromise2 = new Promise<void>((resolve) => {
      resolvePlay2 = resolve;
    });

    // Mock audio instances for each song
    const mockAudio1 = {
      play: vi.fn(() => deferredPromise1),
      pause: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    const mockAudio2 = {
      play: vi.fn(() => deferredPromise2),
      pause: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    // Setup Audio mock to return different instances
    let audioInstanceIndex = 0;
    vi.mocked(Audio).mockImplementation(() => {
      const instance = audioInstanceIndex === 0 ? mockAudio1 : mockAudio2;
      audioInstanceIndex++;
      return instance as unknown as HTMLAudioElement;
    });

    const songWithPreview1 = { ...mockSong, id: '1', previewUrl: 'https://example.com/song1.mp3' };
    const songWithPreview2 = { ...mockSong, id: '2', previewUrl: 'https://example.com/song2.mp3' };
    const songWithoutPreview = { ...mockSong, id: '3' };

    const { rerender } = render(SongDetail, { props: { song: songWithPreview1 } });

    const playButton = screen.getByRole('button', { name: /Play Preview/i });

    // Click play for song 1 (start but don't resolve)
    await fireEvent.click(playButton);
    expect(mockAudio1.play).toHaveBeenCalledTimes(1);

    // Switch to song 2 immediately before song 1's play() resolves
    await rerender({ song: songWithPreview2 });

    // Click play for song 2 (start but don't resolve)
    await fireEvent.click(playButton);
    expect(mockAudio2.play).toHaveBeenCalledTimes(1);

    // Now resolve song 2's play() first (the newer operation)
    resolvePlay2!();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.getByRole('button', { name: /Pause Preview/i })).toHaveAttribute('aria-pressed', 'true');

    // Tear down playback without starting a replacement track
    await rerender({ song: songWithoutPreview });
    const disabledPlayButton = screen.getByRole('button', { name: /Play Preview/i });
    expect(disabledPlayButton).toBeDisabled();
    expect(disabledPlayButton).toHaveAttribute('aria-pressed', 'false');
    expect(mockAudio2.pause).toHaveBeenCalledTimes(1);

    // Now resolve song 1's stale promise (the older operation)
    resolvePlay1!();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.getByRole('button', { name: /Play Preview/i })).toHaveAttribute('aria-pressed', 'false');
    expect(mockAudio2.pause).toHaveBeenCalledTimes(1);
    expect(mockAudio2.play).toHaveBeenCalledTimes(1);
  });

  it('handles multiple rapid play clicks without state corruption', async () => {
    // Mock audio with a slow promise
    let resolvePlay: (() => void) | null = null;
    const deferredPromise = new Promise<void>((resolve) => {
      resolvePlay = resolve;
    });

    mockAudioInstance.play = vi.fn(() => deferredPromise);

    const songWithPreview = { ...mockSong, previewUrl: 'https://example.com/preview.mp3' };
    render(SongDetail, { props: { song: songWithPreview } });

    const playButton = screen.getByRole('button', { name: /Play Preview/i });

    // Rapidly click play multiple times before promise resolves
    await fireEvent.click(playButton);
    await fireEvent.click(playButton);
    await fireEvent.click(playButton);

    // Resolve the deferred promise
    resolvePlay!();
    await new Promise(resolve => setTimeout(resolve, 0));

    // Verify that audio.play() was called (first click)
    expect(mockAudioInstance.play).toHaveBeenCalled();

    // Now the button should work normally
    // Click once more - should start playing
    await fireEvent.click(playButton);
  });
});