<script lang="ts">
  import type { Job } from '../stores/jobs';
  import { midiStore } from '../stores/midi';
  
  export let job: Job;
  
  const API_BASE_URL = import.meta.env.PUBLIC_CRUX_API_URL || 'http://localhost:8000';
  
  function getStatusColor(status: string) {
    switch(status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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

<div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
  <div class="flex items-center justify-between mb-2">
    <div class="flex items-center gap-2">
      <span class="text-sm font-mono text-gray-500">
        {job.job_id.substring(0, 8)}...
      </span>
      <span class="px-2 py-1 rounded text-xs font-medium {getStatusColor(job.status)}">
        {job.status}
      </span>
    </div>
    <span class="text-xs text-gray-500">
      {formatDate(job.created_at)}
    </span>
  </div>
  
  {#if job.metadata?.filename}
    <p class="text-sm text-gray-700 mb-2">
      {job.metadata.filename}
    </p>
  {/if}
  
  {#if job.status === 'processing'}
    <div class="mb-2">
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style="width: {job.progress}%"
        ></div>
      </div>
      <p class="text-xs text-gray-500 mt-1">{job.progress}% complete</p>
    </div>
  {/if}
  
  {#if job.status === 'completed'}
    <div class="flex gap-2 mt-3">
      <button
        on:click={downloadMidi}
        class="flex-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
      >
        Download MIDI
      </button>
      <button
        on:click={previewMidi}
        class="flex-1 px-3 py-1.5 border border-purple-600 text-purple-600 text-sm rounded hover:bg-purple-50 transition-colors"
      >
        Preview
      </button>
    </div>
  {/if}
  
  {#if job.status === 'failed' && job.error}
    <div class="mt-2 p-2 bg-red-50 border border-red-200 rounded">
      <p class="text-xs text-red-600">{job.error}</p>
    </div>
  {/if}
</div>
