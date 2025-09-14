<script lang="ts">
  import { midiStore } from '../stores/midi';
  import { jobsStore } from '../stores/jobs';

  function toggleMidiPreview() {
    console.log('MIDI button clicked!');
    // Redirect to dedicated MIDI preview page
    window.location.href = '/midi-preview';
  }

  $: hasMidiJobs = $jobsStore.some(job => job.status === 'completed' && job.result_url);
</script>

<button
  on:click={() => {
    console.log('=== MIDI BUTTON CLICKED DIRECTLY ===');
    window.location.href = '/midi-preview';
  }}
  on:mousedown={() => console.log('MIDI button mouse down')}
  on:mouseenter={() => console.log('MIDI button mouse enter')}
  class="text-white hover:text-white transition-all duration-300 hover:scale-110 hover:drop-shadow-lg bg-red-500 px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer border-2 border-red-300 font-bold text-lg"
  title="MIDI Preview"
  type="button"
  style="position: relative; z-index: 1000;"
>
  🔴 MIDI 🔴
</button>
