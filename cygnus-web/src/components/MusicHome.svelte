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
    previewImage?: string;
  };
  let songs: Song[] = [];
  
  let selectedSong: Song | null = null;
  
  function handleSongSelected(event: CustomEvent<Song>) {
    selectedSong = event.detail;
  }

  onMount(async () => {
    try {
      const res = await fetch('/api/songs');
      if (!res.ok) throw new Error(`Failed to load songs: ${res.status}`);
      const data: Song[] = await res.json();
      songs = data;
      if (!selectedSong && songs.length > 0) {
        selectedSong = songs[0];
      }
    } catch (err) {
      console.error(err);
    }
  });
</script>

<div class="container mx-auto px-6 py-8">
  <div class="text-center mb-12">
    <h1 class="text-5xl font-bold text-white mb-4 drop-shadow-lg">
      Welcome to Cygnus Music
    </h1>
    <p class="text-xl text-white/90 drop-shadow-md max-w-3xl mx-auto">
      Discover and explore AI-generated music compositions with beautiful ocean blue aesthetics
    </p>
  </div>
  
  <!-- Animated wave overlay -->
  <div class="absolute bottom-0 left-0 w-full h-32 opacity-30">
    <svg class="wave-animation" viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path d="M0,60 C150,100 350,0 600,60 C850,120 1050,20 1200,60 L1200,120 L0,120 Z" fill="url(#waveGradient)"/>
    </svg>
    <svg class="wave-animation wave-2" viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path d="M0,80 C300,140 600,40 900,80 C1050,100 1150,60 1200,80 L1200,120 L0,120 Z" fill="url(#waveGradient2)"/>
    </svg>
  </div>
  
  <!-- SVG Gradients for waves -->
  <svg width="0" height="0" class="absolute">
    <defs>
      <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgba(59, 130, 246, 0.6);stop-opacity:1" />
        <stop offset="50%" style="stop-color:rgba(6, 182, 212, 0.8);stop-opacity:1" />
        <stop offset="100%" style="stop-color:rgba(59, 130, 246, 0.6);stop-opacity:1" />
      </linearGradient>
      <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgba(6, 182, 212, 0.4);stop-opacity:1" />
        <stop offset="50%" style="stop-color:rgba(59, 130, 246, 0.6);stop-opacity:1" />
        <stop offset="100%" style="stop-color:rgba(6, 182, 212, 0.4);stop-opacity:1" />
      </linearGradient>
    </defs>
  </svg>
  
  <!-- Content wrapper -->
  <div class="relative z-10">
  <!-- Main Content -->
  <main class="py-8">
    <div class="flex justify-center">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl w-full px-6">
        <!-- Song Detail Panel (Left) -->
        <div class="lg:col-span-2 flex justify-center items-center">
          <div class="w-full max-w-4xl transform hover:scale-[1.02] transition-all duration-500 hover:drop-shadow-2xl">
            <SongDetail song={selectedSong} />
          </div>
        </div>
        
        <!-- Song List Panel (Right) -->
        <div class="lg:col-span-1 flex justify-center items-start">
          <div class="w-full max-w-md transform hover:scale-[1.02] transition-all duration-500 hover:drop-shadow-2xl">
            <SongList
              songs={songs}
              selectedSongId={selectedSong?.id || null}
              on:songSelected={handleSongSelected}
            />
          </div>
        </div>
      </div>
    </div>
  </main>
  </div>
</div>

<style>
  /* Wave animations */
  .wave-animation {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    animation: wave 4s ease-in-out infinite;
  }
  
  .wave-2 {
    animation: wave 6s ease-in-out infinite reverse;
    opacity: 0.7;
  }
  
  @keyframes wave {
    0%, 100% {
      transform: translateX(0px);
    }
    50% {
      transform: translateX(-20px);
    }
  }
  
  /* Fade in up animation */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.8s ease-out forwards;
  }
  
  .animation-delay-300 {
    animation-delay: 0.3s;
    opacity: 0;
  }
  
  .animation-delay-500 {
    animation-delay: 0.5s;
    opacity: 0;
  }
  
  .animation-delay-700 {
    animation-delay: 0.7s;
    opacity: 0;
  }
  
  /* Shimmer effect for title */
  @keyframes shimmer {
    0% {
      background-position: -200% center;
    }
    100% {
      background-position: 200% center;
    }
  }
  
  .animate-shimmer {
    background-size: 200% auto;
    animation: shimmer 3s linear infinite;
  }
  
  /* Enhanced hover effects */
  .hover\:drop-shadow-2xl:hover {
    filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15));
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .wave-animation {
      height: 60px;
    }
  }
</style>
