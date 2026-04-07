import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

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
const MockPolySynth = vi.fn(function () {
  return mockSynthInstance;
});

vi.mock('tone', () => ({
  Transport: mockTransport,
  PolySynth: MockPolySynth,
  Synth: {},
  start: vi.fn().mockResolvedValue(undefined),
}));

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
const MockMidi = vi.fn(function () {
  return mockMidiInstance;
});
vi.mock('@tonejs/midi', () => ({ Midi: MockMidi }));

describe('midiStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockTransport.seconds = 0;
    mockTransport.position = 0;
    mockTransport.schedule.mockReturnValue(1);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('starts with local preview state only', async () => {
    const { midiStore } = await import('../../src/stores/midi');

    expect(
      (midiStore as unknown as { openPreview?: unknown }).openPreview
    ).toBeUndefined();
    expect(get(midiStore)).toEqual({
      isOpen: false,
      midiData: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null,
    });
  });

  it('opens a local MIDI preview from an array buffer without using fetch', async () => {
    const fetchSpy = vi.mocked(fetch);
    const { midiStore } = await import('../../src/stores/midi');

    const result = await midiStore.openPreviewFromArrayBuffer(
      new ArrayBuffer(8)
    );

    expect(result).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(get(midiStore)).toEqual({
      isOpen: true,
      midiData: mockMidiInstance,
      isPlaying: false,
      currentTime: 0,
      duration: 30,
      error: null,
    });
    expect(mockTransport.schedule).toHaveBeenCalledTimes(2);
  });

  it('stores a local preview error when MIDI parsing fails', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    MockMidi.mockImplementationOnce(() => {
      throw new Error('Bad buffer');
    });
    const { midiStore } = await import('../../src/stores/midi');

    const result = await midiStore.openPreviewFromArrayBuffer(
      new ArrayBuffer(0)
    );

    expect(result).toBe(false);
    expect(get(midiStore)).toEqual({
      isOpen: true,
      midiData: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: 'Failed to open MIDI preview: Bad buffer',
    });
    consoleError.mockRestore();
  });

  it('plays, pauses, seeks, stops, and closes the local preview', async () => {
    const { midiStore } = await import('../../src/stores/midi');

    await midiStore.openPreviewFromArrayBuffer(new ArrayBuffer(8));
    await midiStore.play();
    expect(mockTransport.start).toHaveBeenCalled();
    expect(get(midiStore).isPlaying).toBe(true);

    midiStore.pause();
    expect(mockTransport.pause).toHaveBeenCalled();
    expect(get(midiStore).isPlaying).toBe(false);

    midiStore.seek(15);
    expect(get(midiStore).currentTime).toBe(15);

    midiStore.stop();
    expect(mockTransport.stop).toHaveBeenCalled();
    expect(get(midiStore).currentTime).toBe(0);

    midiStore.close();
    expect(get(midiStore)).toEqual({
      isOpen: false,
      midiData: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null,
    });
  });
});
