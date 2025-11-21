<script lang="ts">
  import type { Job } from '../stores/jobs';
  import { midiStore } from '../stores/midi';
  
  export let job: Job;
  
  const API_BASE_URL = import.meta.env.PUBLIC_CRUX_API_URL || 'http://localhost:8000';
  
  function getStatusColor(status: string) {
    switch(status) {
      case 'pending': return 'text-yellow-300 bg-yellow-500/20';
      case 'processing': return 'text-cyan-300 bg-cyan-500/20';
      case 'completed': return 'text-green-300 bg-green-500/20';
      case 'failed': return 'text-red-300 bg-red-500/20';
      default: return 'text-white/80 bg-white/10';
    }
  }
  
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
  
  async function downloadMidi() {
    window.open(`${API_BASE_URL}/api/jobs/${job.job_id}/download`, '_blank');
  }
  
  function previewMidi() {
    midiStore.openPreview(job.job_id);
  }
</script>

<div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:shadow-lg transition-all hover:bg-white/15 drop-shadow-lg">
  <div class="flex items-center justify-between mb-2">
    <div class="flex items-center gap-2">
      <span class="text-sm font-mono text-white/70 drop-shadow-sm">
        {job.job_id.substring(0, 8)}...
      </span>
      <span class="px-2 py-1 rounded text-xs font-medium {getStatusColor(job.status)}">
        {job.status}
      </span>
    </div>
    <span class="text-xs text-white/60 drop-shadow-sm">
      {formatDate(job.created_at)}
    </span>
  </div>
  
  {#if job.metadata?.filename}
    <p class="text-sm text-white mb-2 drop-shadow-sm">
      {job.metadata.filename}
    </p>
  {/if}
  
  {#if job.status === 'processing'}
    <div class="mb-2">
      <div class="w-full bg-white/20 rounded-full h-2 drop-shadow-sm">
        <div 
          class="bg-cyan-500 h-2 rounded-full transition-all duration-300 drop-shadow-sm"
          style="width: {job.progress}%"
        ></div>
      </div>
      <p class="text-xs text-white/70 mt-1 drop-shadow-sm">{job.progress}% complete</p>
    </div>
  {/if}
  
  {#if job.status === 'completed'}
    <div class="flex gap-2 mt-3">
      <button
        on:click={downloadMidi}
        class="flex-1 px-3 py-1.5 bg-cyan-600 text-white text-sm rounded hover:bg-cyan-700 transition-colors drop-shadow-lg"
      >
        Download MIDI
      </button>
      <button
        on:click={previewMidi}
        class="flex-1 px-3 py-1.5 border border-cyan-400 text-cyan-300 text-sm rounded hover:bg-cyan-500/20 transition-colors drop-shadow-lg"
      >
        Preview
      </button>
    </div>
  {/if}
  
  {#if job.status === 'failed' && job.error}
    <div class="mt-2 p-2 bg-red-500/20 border border-red-400/50 rounded backdrop-blur-sm drop-shadow-sm">
      <p class="text-xs text-red-200 drop-shadow-sm">{job.error}</p>
    </div>
  {/if}
</div>
