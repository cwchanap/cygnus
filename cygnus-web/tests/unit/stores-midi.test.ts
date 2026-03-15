import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

// --- Mock Tone.js ---
const mockTransport = {
  start: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  schedule: vi.fn().mockReturnValue(1),
  clear: vi.fn(),
  seconds: 0,
  position: 0,
};
const mockSynthInstance = {
  toDestination: vi.fn().mockReturnThis(),
  triggerAttackRelease: vi.fn(),
};
const MockPolySynth = vi.fn().mockReturnValue(mockSynthInstance);

vi.mock('tone', () => ({
  Transport: mockTransport,
  PolySynth: MockPolySynth,
  Synth: {},
  start: vi.fn().mockResolvedValue(undefined),
}));

// --- Mock @tonejs/midi ---
const mockMidiInstance = {
  duration: 30,
  tracks: [
    {
      notes: [
        { name: 'C4', duration: 0.5, time: 0, velocity: 0.8, midi: 60 },
        { name: 'E4', duration: 0.5, time: 1, velocity: 0.7, midi: 64 },
      ],
    },
  ],
};
const MockMidi = vi.fn().mockReturnValue(mockMidiInstance);
vi.mock('@tonejs/midi', () => ({ Midi: MockMidi }));

// --- Mock config ---
vi.mock('../../src/lib/config', () => ({
  API_BASE_URL: 'http://localhost:8000',
}));

const mockFetch = vi.fn();

describe('midiStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockTransport.seconds = 0;
    mockTransport.schedule.mockReturnValue(1);
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('has correct initial state', async () => {
    const { midiStore } = await import('../../src/stores/midi');
    const state = get(midiStore);
    expect(state).toEqual({
      isOpen: false,
      jobId: null,
      midiData: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null,
    });
  });

  it('openPreview() sets isOpen, jobId, midiData, and duration on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    });
    const { midiStore } = await import('../../src/stores/midi');
    await midiStore.openPreview('job-123');
    const state = get(midiStore);
    expect(state.isOpen).toBe(true);
    expect(state.jobId).toBe('job-123');
    expect(state.midiData).toBe(mockMidiInstance);
    expect(state.duration).toBe(30);
    expect(state.error).toBeNull();
  });

  it('openPreview() fetches from the correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    });
    const { midiStore } = await import('../../src/stores/midi');
    await midiStore.openPreview('abc-999');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/jobs/abc-999/download'
    );
  });

  it('openPreview() sets error state when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const { midiStore } = await import('../../src/stores/midi');
    await midiStore.openPreview('bad-job');
    const state = get(midiStore);
    expect(state.isOpen).toBe(true);
    expect(state.error).toMatch(/Failed to load MIDI preview/i);
    expect(state.midiData).toBeNull();
  });

  it('openPreview() sets error state on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network down'));
    const { midiStore } = await import('../../src/stores/midi');
    await midiStore.openPreview('net-err');
    const state = get(midiStore);
    expect(state.isOpen).toBe(true);
    expect(state.error).toContain('Network down');
    expect(state.midiData).toBeNull();
  });

  it('openPreviewFromArrayBuffer() sets state without fetch', async () => {
    const { midiStore } = await import('../../src/stores/midi');
    const buffer = new ArrayBuffer(8);
    await midiStore.openPreviewFromArrayBuffer(buffer);
    const state = get(midiStore);
    expect(state.isOpen).toBe(true);
    expect(state.jobId).toBeNull();
    expect(state.midiData).toBe(mockMidiInstance);
    expect(state.duration).toBe(30);
    expect(state.error).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('openPreviewFromArrayBuffer() sets error when Midi constructor throws', async () => {
    MockMidi.mockImplementationOnce(() => {
      throw new Error('Bad buffer');
    });
    const { midiStore } = await import('../../src/stores/midi');
    await midiStore.openPreviewFromArrayBuffer(new ArrayBuffer(0));
    const state = get(midiStore);
    expect(state.isOpen).toBe(true);
    expect(state.error).toContain('Bad buffer');
    expect(state.midiData).toBeNull();
  });

  it('play() starts transport and sets isPlaying=true', async () => {
    const { midiStore } = await import('../../src/stores/midi');
    await midiStore.play();
    expect(mockTransport.start).toHaveBeenCalled();
    expect(get(midiStore).isPlaying).toBe(true);
  });

  it('pause() pauses transport and sets isPlaying=false', async () => {
    const { midiStore } = await import('../../src/stores/midi');
    await midiStore.play();
    midiStore.pause();
    expect(mockTransport.pause).toHaveBeenCalled();
    expect(get(midiStore).isPlaying).toBe(false);
  });

  it('stop() stops transport and resets currentTime to 0', async () => {
    const { midiStore } = await import('../../src/stores/midi');
    await midiStore.play();
    midiStore.stop();
    expect(mockTransport.stop).toHaveBeenCalled();
    const state = get(midiStore);
    expect(state.isPlaying).toBe(false);
    expect(state.currentTime).toBe(0);
  });

  it('seek() updates currentTime', async () => {
    const { midiStore } = await import('../../src/stores/midi');
    midiStore.seek(15);
    expect(get(midiStore).currentTime).toBe(15);
  });

  it('close() resets all state to initial values', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    });
    const { midiStore } = await import('../../src/stores/midi');
    await midiStore.openPreview('job-456');
    midiStore.close();
    expect(get(midiStore)).toEqual({
      isOpen: false,
      jobId: null,
      midiData: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null,
    });
  });

  it('scheduleMidiPlayback schedules notes on transport', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    });
    const { midiStore } = await import('../../src/stores/midi');
    await midiStore.openPreview('schedule-test');
    // 2 notes in the mock MIDI, so schedule should be called twice
    expect(mockTransport.schedule).toHaveBeenCalledTimes(2);
  });
});
