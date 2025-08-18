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

<div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-600 to-cyan-500 relative overflow-hidden">
  <!-- Dynamic animated background layers -->
  <div class="absolute inset-0 bg-gradient-to-r from-blue-400/30 via-cyan-300/40 to-blue-500/30 animate-pulse"></div>
  <div class="absolute inset-0 bg-gradient-to-t from-blue-800/20 via-transparent to-cyan-200/20"></div>
  
  <!-- Floating particles -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="particle particle-1"></div>
    <div class="particle particle-2"></div>
    <div class="particle particle-3"></div>
    <div class="particle particle-4"></div>
    <div class="particle particle-5"></div>
    <div class="particle particle-6"></div>
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
  <svg width="0" height="0">
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
  <div class="relative z-10 flex flex-col min-h-screen">
  <!-- Header -->
  <header class="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 text-white shadow-lg backdrop-blur-sm bg-opacity-90 border-b border-blue-400/30">
    <div class="container mx-auto px-6 py-8">
      <div class="flex items-center justify-between">
        <div class="animate-fade-in-up">
          <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent animate-shimmer">Cygnus Music</h1>
          <p class="text-blue-100 text-lg animate-fade-in-up animation-delay-300">AI-Generated Music Composition Gallery</p>
        </div>
        <div class="hidden md:flex items-center space-x-6 animate-fade-in-up animation-delay-500">
          <nav class="flex space-x-6">
            <a href="/" class="text-blue-100 hover:text-white transition-all duration-300 hover:scale-110 hover:drop-shadow-lg">Home</a>
            <a href="/library" class="text-blue-100 hover:text-white transition-all duration-300 hover:scale-110 hover:drop-shadow-lg">Library</a>
            <a href="/create" class="text-blue-100 hover:text-white transition-all duration-300 hover:scale-110 hover:drop-shadow-lg">Create</a>
            <a href="/about" class="text-blue-100 hover:text-white transition-all duration-300 hover:scale-110 hover:drop-shadow-lg">About</a>
          </nav>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="container mx-auto px-6 py-8 animate-fade-in-up animation-delay-700 flex-grow">
    <div class="flex justify-center">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl w-full">
        <!-- Song Detail Panel (Left) -->
        <div class="lg:col-span-2 flex justify-center items-center">
          <div class="w-full max-w-4xl transform hover:scale-[1.02] transition-all duration-500 hover:drop-shadow-2xl">
            <SongDetail song={selectedSong} />
          </div>
        </div>
        
        <!-- Song List Panel (Right) -->
        <div class="lg:col-span-1 flex justify-center">
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

  <!-- Footer -->
  <footer class="bg-blue-900/80 backdrop-blur-sm text-blue-100 py-6 mt-12 border-t border-blue-400/30">
    <div class="container mx-auto px-6 text-center">
      <p class="animate-fade-in-up">&copy; 2024 Cygnus Music. Exploring the future of AI-generated compositions.</p>
    </div>
  </footer>
  </div>
</div>

<style>
  /* Floating particles animation */
  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: radial-gradient(circle, rgba(6, 182, 212, 0.8) 0%, rgba(59, 130, 246, 0.4) 100%);
    border-radius: 50%;
    animation: float 6s ease-in-out infinite;
  }
  
  .particle-1 {
    top: 20%;
    left: 10%;
    animation-delay: 0s;
    animation-duration: 8s;
  }
  
  .particle-2 {
    top: 60%;
    left: 80%;
    animation-delay: 2s;
    animation-duration: 6s;
  }
  
  .particle-3 {
    top: 80%;
    left: 20%;
    animation-delay: 4s;
    animation-duration: 10s;
  }
  
  .particle-4 {
    top: 30%;
    left: 70%;
    animation-delay: 1s;
    animation-duration: 7s;
  }
  
  .particle-5 {
    top: 50%;
    left: 30%;
    animation-delay: 3s;
    animation-duration: 9s;
  }
  
  .particle-6 {
    top: 10%;
    left: 60%;
    animation-delay: 5s;
    animation-duration: 8s;
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px) translateX(0px) scale(1);
      opacity: 0.7;
    }
    25% {
      transform: translateY(-20px) translateX(10px) scale(1.2);
      opacity: 1;
    }
    50% {
      transform: translateY(-40px) translateX(-5px) scale(0.8);
      opacity: 0.5;
    }
    75% {
      transform: translateY(-20px) translateX(-10px) scale(1.1);
      opacity: 0.8;
    }
  }
  
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
    .particle {
      width: 3px;
      height: 3px;
    }
    
    .wave-animation {
      height: 60px;
    }
  }
</style>
