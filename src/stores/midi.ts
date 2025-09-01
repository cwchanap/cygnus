import { writable } from 'svelte/store';
import MidiPkg from '@tonejs/midi';
import * as Tone from 'tone';

const { Midi } = MidiPkg;

export interface MidiPreviewState {
  isOpen: boolean;
  jobId: string | null;
  midiData: any | null; // Using any since Midi is a class instance
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

// Configure the API base URL for the Crux Python server
const API_BASE_URL = import.meta.env.PUBLIC_CRUX_API_URL || 'http://localhost:9331';

function createMidiStore() {
  const { subscribe, set, update } = writable<MidiPreviewState>({
    isOpen: false,
    jobId: null,
    midiData: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0
  });

  let synth: Tone.PolySynth | null = null;
  const transport = Tone.Transport;
  let scheduledEvents: number[] = [];

  const openPreview = async (jobId: string) => {
    try {
      // Fetch MIDI file from Crux API
      const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/download`);
      if (!response.ok) throw new Error('Failed to fetch MIDI file');
      
      const arrayBuffer = await response.arrayBuffer();
      const midi = new Midi(arrayBuffer);
      
      update(state => ({
        ...state,
        isOpen: true,
        jobId,
        midiData: midi,
        duration: midi.duration,
        currentTime: Number(transport.seconds)
      }));
      
      // Initialize synth for playback
      if (!synth) {
        synth = new Tone.PolySynth(Tone.Synth, {
          envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.3,
            release: 0.5
          }
        }).toDestination();
      }
      
      // Schedule MIDI events for playback
      scheduleMidiPlayback(midi);
      
    } catch (error) {
      console.error('Error loading MIDI:', error);
    }
  };

  const scheduleMidiPlayback = (midi: any) => {
    // Clear previous events
    scheduledEvents.forEach(id => transport.clear(id));
    scheduledEvents = [];
    
    // Schedule new events from all tracks
    midi.tracks.forEach((track: any) => {
      track.notes.forEach((note: any) => {
        const eventId = transport.schedule(time => {
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
    update(state => ({ ...state, isPlaying: true }));
  };

  const pause = () => {
    transport.pause();
    update(state => ({ ...state, isPlaying: false }));
  };

  const stop = () => {
    transport.stop();
    transport.position = 0;
    update(state => ({ 
      ...state, 
      isPlaying: false,
      currentTime: 0
    }));
  };

  const seek = (time: number) => {
    transport.position = time;
    update(state => ({ ...state, currentTime: time }));
  };

  const close = () => {
    stop();
    set({
      isOpen: false,
      jobId: null,
      midiData: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0
    });
  };

  // Update current time during playback
  setInterval(() => {
    update(state => {
      if (state.isPlaying) {
        return { ...state, currentTime: Number(transport.seconds) };
      }
      return state;
    });
  }, 100);

  return {
    subscribe,
    openPreview,
    play,
    pause,
    stop,
    seek,
    close
  };
}

export const midiStore = createMidiStore();
