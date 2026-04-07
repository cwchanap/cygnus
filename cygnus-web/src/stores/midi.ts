import { writable } from 'svelte/store';
import * as Tone from 'tone';
import type { Midi as MidiInstance } from '@tonejs/midi';

// Lazily load MIDI package to avoid SSR/hydration issues
type MidiCtor = typeof import('@tonejs/midi').Midi;
let Midi: MidiCtor | null = null;
async function ensureMidiLoaded() {
  if (Midi) return true;
  try {
    const mod = await import('@tonejs/midi');
    Midi = mod.Midi as MidiCtor;
    return true;
  } catch (error) {
    console.warn('MIDI package not available:', error);
    return false;
  }
}

export interface MidiPreviewState {
  isOpen: boolean;
  midiData: MidiInstance | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
}

function createMidiStore() {
  const { subscribe, set, update } = writable<MidiPreviewState>({
    isOpen: false,
    midiData: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    error: null,
  });

  let synth: Tone.PolySynth | null = null;
  const transport = Tone.Transport;
  let scheduledEvents: number[] = [];
  let playbackInterval: ReturnType<typeof setInterval> | null = null;

  const startPlaybackTracking = () => {
    if (playbackInterval !== null) return;
    playbackInterval = setInterval(() => {
      update((state) => {
        if (state.isPlaying) {
          return { ...state, currentTime: Number(transport.seconds) };
        }
        return state;
      });
    }, 100);
  };

  const stopPlaybackTracking = () => {
    if (playbackInterval !== null) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }
  };

  const openPreviewFromArrayBuffer = async (
    buffer: ArrayBuffer
  ): Promise<boolean> => {
    try {
      const hasMidi = await ensureMidiLoaded();
      if (!hasMidi || !Midi) {
        console.error('MIDI package failed to load — cannot display preview');
        update((state) => ({
          ...state,
          isOpen: true,
          midiData: null,
          duration: 0,
          error:
            'MIDI preview is unavailable (package failed to load). Please refresh the page.',
        }));
        return false;
      }

      const midi = new Midi(buffer);

      update((state) => ({
        ...state,
        isOpen: true,
        midiData: midi,
        duration: midi.duration,
        currentTime: Number(transport.seconds),
        error: null,
      }));

      // Initialize synth for playback
      if (!synth) {
        synth = new Tone.PolySynth(Tone.Synth, {
          envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.3,
            release: 0.5,
          },
        }).toDestination();
      }

      scheduleMidiPlayback(midi);
      return true;
    } catch (error) {
      console.error('Error opening MIDI from buffer:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      update((state) => ({
        ...state,
        isOpen: true,
        midiData: null,
        duration: 0,
        error: `Failed to open MIDI preview: ${msg}`,
      }));
      return false;
    }
  };

  type Note = {
    name: string;
    duration: number;
    time: number;
    velocity: number;
    midi: number;
  };
  type Track = { notes: Note[] };
  const scheduleMidiPlayback = (midi: MidiInstance) => {
    // Clear previous events
    scheduledEvents.forEach((id) => transport.clear(id));
    scheduledEvents = [];

    // Schedule new events from all tracks
    (midi.tracks as unknown as Track[]).forEach((track) => {
      track.notes.forEach((note) => {
        const eventId = transport.schedule((time) => {
          synth?.triggerAttackRelease(
            note.name,
            note.duration,
            time,
            note.velocity
          );
        }, note.time);
        scheduledEvents.push(eventId);
      });
    });
  };

  const play = async () => {
    await Tone.start();
    transport.start();
    startPlaybackTracking();
    update((state) => ({ ...state, isPlaying: true }));
  };

  const pause = () => {
    transport.pause();
    stopPlaybackTracking();
    update((state) => ({ ...state, isPlaying: false }));
  };

  const stop = () => {
    transport.stop();
    stopPlaybackTracking();
    transport.position = 0;
    update((state) => ({
      ...state,
      isPlaying: false,
      currentTime: 0,
    }));
  };

  const seek = (time: number) => {
    transport.position = time;
    update((state) => ({ ...state, currentTime: time }));
  };

  const close = () => {
    stop();
    set({
      isOpen: false,
      midiData: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null,
    });
  };

  return {
    subscribe,
    openPreviewFromArrayBuffer,
    play,
    pause,
    stop,
    seek,
    close,
  };
}

export const midiStore = createMidiStore();
