<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let songs: Array<{
    id: string;
    title: string;
    origin: string;
    bpm: number;
    releaseDate: string;
  }> = [];
  
  export let selectedSongId: string | null = null;
  
  function selectSong(song: any) {
    dispatch('songSelected', song);
  }
  
  // Mock data for infinite scroll simulation
  let visibleCount = 10;
  let isLoading = false;
  
  function loadMore() {
    if (isLoading || visibleCount >= songs.length) return;
    
    isLoading = true;
    setTimeout(() => {
      visibleCount = Math.min(visibleCount + 10, songs.length);
      isLoading = false;
    }, 500);
  }
  
  function handleScroll(event: Event) {
    const target = event.target as HTMLElement;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 100) {
      loadMore();
    }
  }
</script>

<div class="bg-gradient-to-br from-blue-900/90 via-blue-800/85 to-cyan-900/90 backdrop-blur-sm rounded-xl shadow-2xl border border-blue-400/30 h-full min-h-[1200px] max-h-[1200px] flex flex-col">
  <!-- Header -->
  <div class="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-xl">
    <h2 class="text-xl font-bold">Music Library</h2>
    <p class="text-blue-100 text-sm">{songs.length} compositions</p>
  </div>
  
  <!-- Song List -->
  <div class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-800/50" on:scroll={handleScroll}>
    {#if songs.length === 0}
      <div class="h-full flex items-center justify-center text-center p-8">
        <div class="text-cyan-300">
          <svg class="w-16 h-16 mx-auto mb-4 opacity-30" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
          </svg>
          <h3 class="text-lg font-semibold mb-2 text-white">No Songs Yet</h3>
          <p class="text-cyan-200 text-sm">Music compositions will appear here</p>
        </div>
      </div>
    {:else}
      <div class="divide-y divide-blue-400/20">
        {#each songs.slice(0, visibleCount) as song (song.id)}
        <button
          class="w-full p-4 text-left hover:bg-blue-700/40 transition-all duration-300 border-l-4 {selectedSongId === song.id ? 'border-cyan-400 bg-blue-700/50' : 'border-transparent hover:border-blue-400/50'}"
          on:click={() => selectSong(song)}
        >
          <div class="flex justify-between items-start">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-white truncate">{song.title}</h3>
              <p class="text-sm text-cyan-200 mt-1">{song.origin}</p>
              <div class="flex items-center gap-4 mt-2 text-xs text-blue-300">
                <span class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                  </svg>
                  {song.bpm} BPM
                </span>
                <span>{song.releaseDate}</span>
              </div>
            </div>
            {#if selectedSongId === song.id}
              <div class="ml-2 text-cyan-400">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
            {/if}
          </div>
        </button>
      {/each}
      
      {#if isLoading}
        <div class="p-4 text-center">
          <div class="inline-flex items-center text-cyan-300">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading more songs...
          </div>
        </div>
      {/if}
      
      {#if visibleCount >= songs.length && songs.length > 10}
        <div class="p-4 text-center text-blue-300 text-sm">
          All songs loaded
        </div>
      {/if}
      </div>
    {/if}
  </div>
</div>
