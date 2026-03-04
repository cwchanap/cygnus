<script lang="ts">
  export let song: {
    id: string;
    title: string;
    origin: string;
    bpm: number;
    releaseDate: string;
    previewImage?: string;
  } | null = null;

  // Generate waveform bar heights with a natural envelope shape
  const barCount = 52;
  const barHeights = Array.from({ length: barCount }, (_, i) => {
    const x = i / barCount;
    const envelope = Math.sin(x * Math.PI) * 0.7 + 0.3;
    const detail = Math.abs(Math.sin(i * 1.7 + 0.4) * 0.5 + Math.sin(i * 3.1) * 0.3);
    return Math.max(12, Math.round(envelope * detail * 100));
  });
</script>

<div class="bg-[#0d0c1e] border border-white/[0.06] rounded-xl h-full min-h-[680px] flex flex-col overflow-hidden">
  {#if song}
    <div class="flex flex-col h-full p-7 gap-6">

      <!-- Now Playing indicator -->
      <div class="flex items-center gap-3">
        <div class="flex items-end gap-[3px] h-4">
          {#each [0,1,2,3,4,5,6,7,8,9] as barIdx (barIdx)}
            <div
              class="waveform-bar"
              style="--bar-delay: {barIdx * 0.09}s; --bar-height: {20 + Math.abs(Math.sin(barIdx * 1.1)) * 70}%;"
            ></div>
          {/each}
        </div>
        <span class="text-[#c2ff00] font-mono text-[10px] uppercase tracking-[0.2em]">Now Playing</span>
      </div>

      <!-- Title block -->
      <div>
        <h1 class="font-display font-black text-white text-3xl md:text-4xl leading-tight break-words">{song.title}</h1>
        <p class="text-[#6060a0] font-mono text-xs mt-2 uppercase tracking-widest">via {song.origin}</p>
      </div>

      <!-- Waveform visualization -->
      <div class="flex-1 min-h-[220px] bg-[#080716] rounded-lg border border-white/[0.05] flex flex-col items-stretch justify-center relative overflow-hidden">
        <!-- Grid lines -->
        <div
          class="absolute inset-0 opacity-100 pointer-events-none"
          style="background-image: linear-gradient(rgba(194,255,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(194,255,0,0.04) 1px, transparent 1px); background-size: 40px 40px;"
        ></div>

        <!-- Horizontal center line -->
        <div class="absolute left-0 right-0 top-1/2 border-t border-[#c2ff00]/10"></div>

        <!-- Bars container -->
        <div class="flex items-end justify-center gap-[3px] px-8 py-6 h-full">
          {#each barHeights as height, i (i)}
            <div
              class="waveform-bar flex-shrink-0"
              style="--bar-delay: {i * 0.04}s; --bar-height: {height}%;"
            ></div>
          {/each}
        </div>

        <!-- Label -->
        <div class="absolute bottom-3 left-4 text-[#2a2a52] font-mono text-[9px] uppercase tracking-widest select-none">
          Audio Waveform
        </div>

        <!-- Scan line effect -->
        <div class="absolute inset-y-0 w-8 pointer-events-none scan-line"
          style="background: linear-gradient(90deg, transparent, rgba(194,255,0,0.06), transparent);"></div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-[#080716] rounded-lg p-5 border border-white/[0.05]">
          <div class="text-[#6060a0] font-mono text-[9px] uppercase tracking-[0.2em] mb-2">BPM</div>
          <div class="text-[#c2ff00] font-mono text-4xl font-bold leading-none tabular-nums">{song.bpm}</div>
        </div>
        <div class="bg-[#080716] rounded-lg p-5 border border-white/[0.05]">
          <div class="text-[#6060a0] font-mono text-[9px] uppercase tracking-[0.2em] mb-2">Release</div>
          <div class="text-white font-mono text-base font-bold leading-none">{song.releaseDate}</div>
        </div>
      </div>

      <!-- Play button -->
      <button class="w-full bg-[#c2ff00] hover:bg-[#d4ff33] active:bg-[#aaee00] text-[#060614] font-display font-black py-4 px-6 rounded-lg transition-all duration-100 flex items-center justify-center gap-3 text-sm tracking-widest uppercase">
        <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>
        Play Preview
      </button>

    </div>
  {:else}
    <!-- Empty state -->
    <div class="flex-1 flex flex-col items-center justify-center text-center p-12">
      <div class="w-16 h-16 rounded-full bg-[#c2ff00]/[0.08] border border-[#c2ff00]/15 flex items-center justify-center mb-6">
        <svg class="w-7 h-7 text-[#c2ff00]/60" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-1.194-.26-2.327-.743-3.343a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
      <h2 class="font-display font-black text-white text-2xl mb-2 tracking-wide">SELECT A TRACK</h2>
      <p class="text-[#6060a0] font-mono text-xs uppercase tracking-widest">Choose a composition from the library</p>
    </div>
  {/if}
</div>

<style>
  .scan-line {
    animation: scan-line 4s linear infinite;
  }

  @keyframes scan-line {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(1200%); }
  }
</style>
