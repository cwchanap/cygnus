<script lang="ts">
  import SongDetail from './SongDetail.svelte';
  import SongList from './SongList.svelte';
  import { onMount } from 'svelte';
  type Song = {
    id: string;
    title: string;
    origin: string;
    bpm: number;
    releaseDate: string;
    previewUrl?: string;
    previewImage?: string;
  };
  let songs: Song[] = [];

  let selectedSong: Song | null = null;

  function handleSongSelected(event: CustomEvent<Song>) {
    selectedSong = event.detail;
  }

  type PaginatedResponse = {
    songs: Song[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };

  onMount(async () => {
    try {
      const limit = 20;
      const MAX_CLIENT_PAGES = 50;

      const firstRes = await fetch(`/api/songs?page=1&limit=${limit}`);
      if (!firstRes.ok) throw new Error(`Failed to load songs: ${firstRes.status}`);
      const firstData: PaginatedResponse = await firstRes.json();
      songs = firstData.songs;

      const totalPages = Math.min(firstData.pagination.totalPages, MAX_CLIENT_PAGES);
      if (totalPages > 1) {
        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
          promises.push(fetch(`/api/songs?page=${page}&limit=${limit}`));
        }
        const responses = await Promise.all(promises);
        const dataArr = await Promise.all(
          responses.map((r, index) => {
            if (!r.ok) {
              throw new Error(`Failed to load songs page ${index + 2}: ${r.status}`);
            }
            return r.json() as Promise<PaginatedResponse>;
          })
        );
        songs = [...songs, ...dataArr.flatMap(d => d.songs)];
      }

      if (!selectedSong && songs.length > 0) {
        selectedSong = songs[0];
      }
    } catch (err) {
      console.error(err);
    }
  });
</script>

<div class="container mx-auto px-6 py-10">
  <!-- Hero -->
  <div class="mb-10 animate-slide-up">
    <div class="inline-flex items-center gap-2.5 bg-[#c2ff00]/[0.08] border border-[#c2ff00]/20 rounded-full px-4 py-1.5 mb-6">
      <div class="w-1.5 h-1.5 rounded-full bg-[#c2ff00] pulse-dot"></div>
      <span class="text-[#c2ff00] font-mono text-[10px] uppercase tracking-[0.2em]">AI Drum Transcription</span>
    </div>
    <h1 class="font-display font-black text-white text-5xl md:text-6xl lg:text-7xl leading-none mb-4 tracking-tight">
      CYGNUS<br/>
      <span class="text-[#c2ff00]">MUSIC</span>
    </h1>
    <p class="text-[#6060a0] font-mono text-sm max-w-md leading-relaxed">
      AI-powered composition gallery — discover, transcribe,<br class="hidden md:inline" /> and explore procedurally generated music.
    </p>
  </div>

  <!-- Main content grid -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-slide-up-delay-2">
    <!-- Song Detail Panel (2/3) -->
    <div class="lg:col-span-2">
      <SongDetail song={selectedSong} />
    </div>

    <!-- Song List Panel (1/3) -->
    <div class="lg:col-span-1">
      <SongList
        songs={songs}
        selectedSongId={selectedSong?.id || null}
        on:songSelected={handleSongSelected}
      />
    </div>
  </div>
</div>
