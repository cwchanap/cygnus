<script lang="ts">
  import { onMount } from 'svelte';
  import { jobsStore } from '../stores/jobs';
  import DrumJobCard from './DrumJobCard.svelte';
  
  onMount(() => {
    jobsStore.loadJobs();
  });
</script>

<div class="w-full">
  <h2 class="text-xl font-semibold text-gray-800 mb-4">Recent Jobs</h2>
  
  {#if $jobsStore.length === 0}
    <div class="text-center py-8 text-gray-500">
      <svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p>No transcription jobs yet</p>
      <p class="text-sm mt-1">Upload an audio file to get started</p>
    </div>
  {:else}
    <div class="grid gap-3">
      {#each $jobsStore as job (job.job_id)}
        <DrumJobCard {job} />
      {/each}
    </div>
  {/if}
</div>
