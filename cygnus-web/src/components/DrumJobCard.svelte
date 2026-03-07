<script lang="ts">
  import type { Job } from '../stores/jobs';
  import { midiStore } from '../stores/midi';

  export let job: Job;

  const API_BASE_URL = import.meta.env.PUBLIC_CRUX_API_URL || 'http://localhost:8000';

  function getStatusStyles(status: Job['status']): { dot: string; text: string; bg: string } {
    switch (status) {
      case 'pending':    return { dot: 'bg-yellow-400', text: 'text-yellow-300', bg: 'bg-yellow-500/10 border-yellow-500/20' };
      case 'processing': return { dot: 'bg-[#c2ff00] pulse-dot', text: 'text-[#c2ff00]', bg: 'bg-[#c2ff00]/[0.06] border-[#c2ff00]/15' };
      case 'completed':  return { dot: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20' };
      case 'failed':     return { dot: 'bg-red-400', text: 'text-red-300', bg: 'bg-red-500/10 border-red-500/20' };
      default:           return { dot: 'bg-white/30', text: 'text-white/50', bg: 'bg-white/[0.04] border-white/10' };
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  async function downloadMidi() {
    const url = `${API_BASE_URL}/api/jobs/${job.job_id}/download`;
    const newWin = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWin) {
      newWin.opener = null;
    } else {
      try {
        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            Accept: 'audio/midi,audio/x-midi,application/octet-stream',
          },
        });

        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const filenameBase = job.metadata?.filename?.replace(/\.[^/.]+$/, '') || `job-${job.job_id}`;
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `${filenameBase}.mid`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      } catch (error) {
        console.error('[DrumJobCard] Failed to download MIDI file:', error);
      }
    }
  }

  function previewMidi() {
    midiStore.openPreview(job.job_id);
  }

  $: styles = getStatusStyles(job.status);
  $: clampedProgress = Math.max(0, Math.min(100, job.progress));
</script>

<div class="bg-[#080716] border border-white/[0.05] rounded-lg p-4 hover:border-white/10 transition-colors duration-150">
  <!-- Header row -->
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center gap-2.5">
      <div class="w-1.5 h-1.5 rounded-full flex-shrink-0 {styles.dot}"></div>
      <span class="font-mono text-[10px] text-[#6060a0] tabular-nums">{job.job_id.substring(0, 8)}…</span>
      <span class="px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-wider {styles.text} {styles.bg}">
        {job.status}
      </span>
    </div>
    <span class="text-[#3a3a6a] font-mono text-[9px]">{formatDate(job.created_at)}</span>
  </div>

  <!-- Filename -->
  {#if job.metadata?.filename}
    <p class="text-white/80 text-sm font-medium mb-3 truncate">{job.metadata.filename}</p>
  {/if}

  <!-- Progress bar (processing) -->
  {#if job.status === 'processing'}
    <div class="mb-3">
      <div class="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
        <div
          class="bg-[#c2ff00] h-1.5 rounded-full transition-all duration-300"
          style="width: {clampedProgress}%"
        ></div>
      </div>
      <p class="text-[#6060a0] font-mono text-[10px] mt-1 tabular-nums">{clampedProgress}% complete</p>
    </div>
  {/if}

  <!-- Actions (completed) -->
  {#if job.status === 'completed'}
    <div class="flex gap-2 mt-3">
      <button
        on:click={downloadMidi}
        class="flex-1 px-3 py-2 bg-[#c2ff00] hover:bg-[#d4ff33] text-[#060614] font-display font-black text-[10px] uppercase tracking-widest rounded-lg transition-all duration-100"
      >
        Download MIDI
      </button>
      <button
        on:click={previewMidi}
        class="flex-1 px-3 py-2 border border-white/10 text-[#6060a0] hover:text-white hover:border-white/20 font-mono text-[10px] uppercase tracking-widest rounded-lg transition-all duration-100"
      >
        Preview
      </button>
    </div>
  {/if}

  <!-- Error -->
  {#if job.status === 'failed'}
    <div class="mt-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
      <p class="text-red-300 font-mono text-[11px] leading-relaxed">
        {job.error ?? 'Transcription failed. Please try again.'}
      </p>
    </div>
  {/if}
</div>
