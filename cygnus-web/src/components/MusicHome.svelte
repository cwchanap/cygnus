<script lang="ts">
  import SongDetail from './SongDetail.svelte';
  import SongList from './SongList.svelte';
  import { toastStore } from '../stores/toast';
  import { onMount } from 'svelte';
  type Song = {
    id: string;
    title: string;
    origin: string;
    bpm: number;
    releaseDate: string;
    previewUrl?: string;
    previewImage?: string;
    categoryId?: string | null;
    categoryName?: string | null;
  };
  type Category = {
    id: number;
    name: string;
  };

  let songs: Song[] = [];
  let categories: Category[] = [];
  let selectedCategory = 'all';
  let visibleSongs: Song[] = [];
  let fetchGeneration = 0;
  let mounted = false;

  let selectedSong: Song | null = null;

  function handleSongSelected(event: CustomEvent<Song>) {
    selectedSong = event.detail;
  }

  type PaginatedResponse = {
    songs: Song[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };

  async function fetchSongsByCategory(category: string, generation: number) {
    try {
      const limit = 20;
      const MAX_CLIENT_PAGES = 50;
      let url = `/api/songs?page=1&limit=${limit}`;
      if (category !== 'all') {
        url += `&category=${encodeURIComponent(category)}`;
      }

      const firstRes = await fetch(url);
      if (!firstRes.ok)
        throw new Error(`Failed to load songs: ${firstRes.status}`);
      const firstData: PaginatedResponse = await firstRes.json();
      // If a newer fetch was triggered, discard these results
      if (generation !== fetchGeneration) return;
      let fetchedSongs: Song[] = firstData.songs;

      const totalPages = Math.min(
        firstData.pagination.totalPages,
        MAX_CLIENT_PAGES
      );
      if (totalPages > 1) {
        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
          let pageUrl = `/api/songs?page=${page}&limit=${limit}`;
          if (category !== 'all') {
            pageUrl += `&category=${encodeURIComponent(category)}`;
          }
          promises.push(fetch(pageUrl));
        }
        const responses = await Promise.all(promises);
        const dataArr = await Promise.all(
          responses.map((r, index) => {
            if (!r.ok) {
              throw new Error(
                `Failed to load songs page ${index + 2}: ${r.status}`
              );
            }
            return r.json() as Promise<PaginatedResponse>;
          })
        );
        // Check again after async work
        if (generation !== fetchGeneration) return;
        fetchedSongs = [...fetchedSongs, ...dataArr.flatMap((d) => d.songs)];
      }
      songs = fetchedSongs;
    } catch (err) {
      console.error(err);
      toastStore.show('Failed to load songs. Please try again.', 'error');
    }
  }

  // When category changes, fetch filtered songs from the server.
  // Guard with `mounted` so this does not fire during SSR (relative URLs
  // are invalid on the server and would throw "Failed to parse URL").
  $: if (mounted && selectedCategory) {
    const gen = ++fetchGeneration;
    fetchSongsByCategory(selectedCategory, gen);
  }

  $: visibleSongs = songs;

  $: if (
    selectedSong &&
    !visibleSongs.some((song) => song.id === selectedSong?.id)
  ) {
    selectedSong = visibleSongs[0] ?? null;
  }

  // Auto-select the first song when selectedSong was null (e.g. after filtering
  // to an empty category) and the user switches back to a non-empty list.
  $: if (!selectedSong && visibleSongs.length > 0) {
    selectedSong = visibleSongs[0];
  }

  onMount(async () => {
    // Setting mounted = true triggers the reactive statement above,
    // which fetches songs for the initial category.
    mounted = true;
    try {
      const categoriesRes = await fetch('/api/categories');
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        categories = categoriesData.categories ?? [];
      }
    } catch (err) {
      console.error(err);
      toastStore.show('Failed to load categories.', 'error');
    }
  });
</script>

<div class="container mx-auto px-6 py-10">
  <!-- Hero -->
  <div class="mb-10 animate-slide-up">
    <div
      class="inline-flex items-center gap-2.5 bg-[#c2ff00]/[0.08] border border-[#c2ff00]/20 rounded-full px-4 py-1.5 mb-6"
    >
      <div class="w-1.5 h-1.5 rounded-full bg-[#c2ff00] pulse-dot"></div>
      <span
        class="text-[#c2ff00] font-mono text-[10px] uppercase tracking-[0.2em]"
        >AI Drum Transcription</span
      >
    </div>
    <h1
      class="font-display font-black text-white text-5xl md:text-6xl lg:text-7xl leading-none mb-4 tracking-tight"
    >
      CYGNUS<br />
      <span class="text-[#c2ff00]">MUSIC</span>
    </h1>
    <p class="text-[#6060a0] font-mono text-sm max-w-md leading-relaxed">
      AI-powered composition gallery — discover, transcribe,<br
        class="hidden md:inline"
      /> and explore procedurally generated music.
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
      <div class="mb-3">
        <label for="category-filter" class="sr-only">Category filter</label>
        <select
          id="category-filter"
          aria-label="Category filter"
          bind:value={selectedCategory}
          class="w-full rounded-lg border border-white/[0.08] bg-[#0d0c1e] px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-[#c0c0d8] focus:border-[#c2ff00]/40 focus:outline-none"
        >
          <option value="all">All</option>
          {#each categories as category (category.id)}
            <option value={String(category.id)}>{category.name}</option>
          {/each}
          <option value="uncategorized">Uncategorized</option>
        </select>
      </div>
      <SongList
        songs={visibleSongs}
        selectedSongId={selectedSong?.id || null}
        on:songSelected={handleSongSelected}
      />
    </div>
  </div>
</div>
