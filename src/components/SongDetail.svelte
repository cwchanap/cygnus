<script lang="ts">
  export let song: {
    id: string;
    title: string;
    origin: string;
    bpm: number;
    releaseDate: string;
    previewImage?: string;
  } | null = null;
</script>

<div class="bg-gradient-to-br from-blue-900/90 via-blue-800/85 to-cyan-900/90 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-blue-400/30">
  {#if song}
    <div class="space-y-6">
      <!-- Song Title -->
      <div>
        <h1 class="text-3xl font-bold text-white mb-2">{song.title}</h1>
        <p class="text-cyan-200 text-lg">Created with {song.origin}</p>
      </div>

      <!-- Preview Image Placeholder -->
      <div class="bg-gradient-to-r from-blue-700/50 to-cyan-700/50 rounded-lg h-64 flex items-center justify-center border-2 border-dashed border-blue-400/50">
        <div class="text-center text-cyan-200">
          <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
          </svg>
          <p class="text-sm font-medium">Preview Image</p>
          <p class="text-xs opacity-75">Coming Soon</p>
        </div>
      </div>

      <!-- Song Details -->
      <div class="grid grid-cols-2 gap-6">
        <div class="bg-blue-800/40 rounded-lg p-4 border border-blue-400/30">
          <h3 class="text-sm font-semibold text-cyan-300 uppercase tracking-wide mb-2">BPM</h3>
          <p class="text-2xl font-bold text-white">{song.bpm}</p>
        </div>
        <div class="bg-blue-800/40 rounded-lg p-4 border border-blue-400/30">
          <h3 class="text-sm font-semibold text-cyan-300 uppercase tracking-wide mb-2">Release Date</h3>
          <p class="text-lg font-semibold text-white">{song.releaseDate}</p>
        </div>
      </div>

      <!-- Play Button Placeholder -->
      <button class="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
        <svg class="w-6 h-6 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>
        Play Preview
      </button>
    </div>
  {:else}
    <div class="h-full flex items-center justify-center text-center">
      <div class="text-cyan-300">
        <svg class="w-24 h-24 mx-auto mb-6 opacity-30" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-1.194-.26-2.327-.743-3.343a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
        <h2 class="text-xl font-semibold mb-2 text-white">Select a Song</h2>
        <p class="text-cyan-200">Choose a composition from the list to view details</p>
      </div>
    </div>
  {/if}
</div>
