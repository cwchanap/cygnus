<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  type Song = {
    id: string;
    title: string;
    origin: string;
    bpm: number;
    releaseDate: string;
    previewUrl?: string;
    previewImage?: string;
  };

  export let songs: Song[] = [];
  export let selectedSongId: string | null = null;

  function selectSong(song: Song) {
    dispatch('songSelected', song);
  }

  let visibleCount = 10;
  let isLoading = false;

  function loadMore() {
    if (isLoading || visibleCount >= songs.length) return;
    isLoading = true;
    setTimeout(() => {
      visibleCount = Math.min(visibleCount + 10, songs.length);
      isLoading = false;
    }, 400);
  }

  function handleScroll(event: Event) {
    const target = event.target as HTMLElement;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 100) {
      loadMore();
    }
  }

  function padIndex(n: number): string {
    return n.toString().padStart(2, '0');
  }
</script>

<div class="bg-[#0d0c1e] border border-white/[0.06] rounded-xl h-full min-h-[680px] max-h-[680px] flex flex-col overflow-hidden">

  <!-- Header -->
  <div class="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
    <span class="font-display font-black text-white text-sm tracking-wider uppercase">Library</span>
    <span class="text-[#6060a0] font-mono text-[10px] uppercase tracking-widest">{songs.length} tracks</span>
  </div>

  <!-- List -->
  <div class="flex-1 overflow-y-auto" on:scroll={handleScroll} style="scrollbar-width: thin; scrollbar-color: #2a2a52 transparent;">
    {#if songs.length === 0}
      <div class="h-full flex flex-col items-center justify-center p-8 text-center">
        <svg class="w-10 h-10 text-[#2a2a52] mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
        </svg>
        <p class="text-[#6060a0] font-mono text-[10px] uppercase tracking-widest">No tracks yet</p>
      </div>
    {:else}
      {#each songs.slice(0, visibleCount) as song, i (song.id)}
        <button
          class="w-full px-5 py-3.5 text-left transition-all duration-150 border-l-2 flex items-center gap-4 group
            {selectedSongId === song.id
              ? 'border-l-[#c2ff00] bg-[#c2ff00]/[0.05]'
              : 'border-l-transparent hover:border-l-white/10 hover:bg-white/[0.025]'}"
          on:click={() => selectSong(song)}
        >
          <!-- Track number -->
          <span class="font-mono text-[10px] tabular-nums flex-shrink-0 w-6 text-right
            {selectedSongId === song.id ? 'text-[#c2ff00]' : 'text-[#3a3a6a] group-hover:text-[#6060a0]'}">
            {padIndex(i + 1)}
          </span>

          <!-- Track info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <h3 class="font-semibold text-sm truncate leading-snug
                {selectedSongId === song.id ? 'text-white' : 'text-[#c0c0d8] group-hover:text-white'}">
                {song.title}
              </h3>
              <!-- BPM badge -->
              <span class="flex-shrink-0 font-mono text-[9px] tabular-nums px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.06]
                {selectedSongId === song.id ? 'text-[#c2ff00] border-[#c2ff00]/20 bg-[#c2ff00]/[0.08]' : 'text-[#6060a0]'}">
                {song.bpm}
              </span>
            </div>
            <p class="text-[#6060a0] font-mono text-[10px] mt-0.5 uppercase tracking-wider truncate">{song.origin}</p>
          </div>

          <!-- Selected chevron -->
          {#if selectedSongId === song.id}
            <svg class="w-3.5 h-3.5 text-[#c2ff00] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          {/if}
        </button>
      {/each}

      {#if isLoading}
        <div class="px-5 py-4 flex items-center gap-3 text-[#6060a0]">
          <svg class="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="font-mono text-[10px] uppercase tracking-widest">Loading...</span>
        </div>
      {/if}

      {#if visibleCount >= songs.length && songs.length > 10}
        <div class="px-5 py-4 text-center">
          <span class="text-[#3a3a6a] font-mono text-[9px] uppercase tracking-widest">— End of library —</span>
        </div>
      {/if}
    {/if}
  </div>
</div>
