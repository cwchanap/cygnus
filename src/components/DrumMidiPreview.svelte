<script lang="ts">
  import { midiStore } from '../stores/midi';
  import abcjs from 'abcjs';
  import type { Midi as MidiInstance } from '@tonejs/midi';

  type MidiTrack = MidiInstance['tracks'][number];

  let notationContainer: HTMLDivElement | null = null;
  let abcString = '';
  let isLoading = true;
  
  $: if ($midiStore.midiData && notationContainer) {
    renderNotation($midiStore.midiData);
  }
  
  function convertMidiToAbc(midiData: MidiInstance): string {
    // Convert MIDI to ABC notation format
    let abc = 'X:1\n';
    abc += 'T:Drum Transcription\n';
    abc += 'M:4/4\n';
    abc += 'L:1/16\n';
    abc += 'Q:1/4=120\n';
    abc += 'K:C clef=percussion\n';
    
    // Map drum MIDI notes to ABC percussion notation
    const drumMap: Record<number, string> = {
      36: 'C', // Bass Drum
      38: 'E', // Snare
      42: 'G', // Hi-Hat Closed
      46: 'A', // Hi-Hat Open
      49: 'c', // Crash
      51: 'd', // Ride
      45: 'F', // Tom Low
      47: 'F', // Tom Mid
      48: 'G', // Tom High
    };
    
    if (midiData.tracks.length > 0) {
      const track: MidiTrack = midiData.tracks[0];
      const notes = [...track.notes].sort((a, b) => a.time - b.time);
      
      let currentMeasure = '';
      let currentBeat = 0;
      let measuresWritten = 0;
      const beatsPerMeasure = 16; // 16 sixteenth notes per measure
      
      for (const note of notes) {
        const noteStart = Math.round(note.time * 4); // Convert to 16th notes
        const noteDuration = Math.max(1, Math.round(note.duration * 4));
        
        // Fill rests if needed
        while (currentBeat < noteStart % beatsPerMeasure) {
          currentMeasure += 'z';
          currentBeat++;
          
          if (currentBeat >= beatsPerMeasure) {
            abc += currentMeasure + '|';
            measuresWritten++;
            if (measuresWritten % 4 === 0) abc += '\n';
            currentMeasure = '';
            currentBeat = 0;
          }
        }
        
        // Add the note
        const noteName = drumMap[note.midi] || 'C';
        currentMeasure += noteName;
        currentBeat += noteDuration;
        
        // Handle measure overflow
        if (currentBeat >= beatsPerMeasure) {
          abc += currentMeasure + '|';
          measuresWritten++;
          if (measuresWritten % 4 === 0) abc += '\n';
          currentMeasure = '';
          currentBeat = currentBeat % beatsPerMeasure;
        }
      }
      
      // Add final measure if not empty
      if (currentMeasure) {
        while (currentBeat < beatsPerMeasure) {
          currentMeasure += 'z';
          currentBeat++;
        }
        abc += currentMeasure + '|';
      }
    }
    
    return abc;
  }
  
  function renderNotation(midi: MidiInstance) {
    isLoading = true;
    abcString = convertMidiToAbc(midi);
    
    if (notationContainer) {
      abcjs.renderAbc(notationContainer, abcString, {
        responsive: 'resize',
        visualTranspose: 0,
      });
    }
    isLoading = false;
  }
  
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
</script>

{#if $midiStore.isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="px-6 py-4 border-b flex items-center justify-between">
        <h2 class="text-xl font-semibold">MIDI Preview</h2>
        <button
          on:click={midiStore.close}
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close MIDI preview"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Notation Display -->
      <div class="flex-1 overflow-auto p-6">
        {#if isLoading}
          <div class="flex items-center justify-center py-12">
            <svg class="animate-spin h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        {:else}
          <div bind:this={notationContainer} class="w-full"></div>
        {/if}
      </div>
      
      <!-- Playback Controls -->
      <div class="px-6 py-4 border-t bg-gray-50">
        <div class="flex items-center gap-4">
          <!-- Play/Pause Button -->
          {#if $midiStore.isPlaying}
            <button
              on:click={() => midiStore.pause()}
              class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
              aria-label="Pause playback"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
          {:else}
            <button
              on:click={() => midiStore.play()}
              class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
              aria-label="Play MIDI"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
              </svg>
            </button>
          {/if}
          
          <!-- Stop Button -->
          <button
            on:click={midiStore.stop}
            class="p-2 border border-gray-300 text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Stop playback"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <!-- Time Display -->
          <div class="flex-1 flex items-center gap-2">
            <span class="text-sm text-gray-600">
              {formatTime($midiStore.currentTime)}
            </span>
            <div class="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                class="bg-purple-600 h-2 rounded-full transition-all"
                style="width: {($midiStore.currentTime / $midiStore.duration) * 100}%"
              ></div>
            </div>
            <span class="text-sm text-gray-600">
              {formatTime($midiStore.duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
