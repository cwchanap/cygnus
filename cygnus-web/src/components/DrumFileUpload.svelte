<script lang="ts">
  import { toastStore } from '../stores/toast';
  // tfjsTranscriber and midiStore are imported dynamically to avoid SSR/test side effects

  let dragover = false;
  let fileInput: HTMLInputElement;
  let selectedFile: File | null = null;
  let isTranscribing = false;

  const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/flac'];

  function handleFile(file: File) {
    if (file.size > 50 * 1024 * 1024) {
      toastStore.show('File too large. Maximum size is 50MB.', 'error');
      return;
    }

    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|flac)$/i)) {
      toastStore.show('Invalid file type. Please upload MP3, WAV, M4A, or FLAC.', 'error');
      return;
    }

    selectedFile = file;
    toastStore.show(`${file.name} ready. Click "Transcribe in Browser" to start.`, 'success');
  }

  async function runTfjsTranscription() {
    if (!selectedFile) {
      toastStore.show('Please choose a file first.', 'error');
      return;
    }
    isTranscribing = true;
    try {
      toastStore.show('Running in-browser transcription…', 'success');
      const { transcribeInBrowser } = await import('../lib/drum/tfjsTranscriber');
      const buffer = await transcribeInBrowser(selectedFile);
      const { midiStore } = await import('../stores/midi');
      await midiStore.openPreviewFromArrayBuffer(buffer);
      toastStore.show('Transcription complete! Opening preview…', 'success');
    } catch (error) {
      console.error('[DrumFileUpload] Transcription error:', error);
      toastStore.show(
        `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      isTranscribing = false;
    }
  }

  function resetFile() {
    selectedFile = null;
    if (fileInput) fileInput.value = '';
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragover = false;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) handleFile(files[0]);
  }

  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) handleFile(files[0]);
  }
</script>

<div class="w-full">
  {#if !selectedFile}
    <!-- Drop zone -->
    <div
      class="border-2 border-dashed rounded-lg p-10 text-center transition-all duration-150 cursor-pointer
        {dragover
          ? 'border-[#c2ff00]/60 bg-[#c2ff00]/[0.04]'
          : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'}"
      role="button"
      aria-label="Upload drum audio drop zone"
      tabindex="0"
      on:click={() => fileInput?.click()}
      on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInput?.click();
        }
      }}
      on:dragover|preventDefault={() => (dragover = true)}
      on:dragleave|preventDefault={() => (dragover = false)}
      on:drop={handleDrop}
    >
      <!-- Upload icon -->
      <div class="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
        <svg class="w-6 h-6 text-[#6060a0]" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <p class="text-white font-semibold mb-1">Drop your drum audio here</p>
      <p class="text-[#6060a0] font-mono text-xs mb-6">MP3 · WAV · M4A · FLAC — max 50MB</p>

      <input
        type="file"
        accept=".mp3,.wav,.m4a,.flac,audio/*"
        class="hidden"
        bind:this={fileInput}
        on:change={handleFileSelect}
        data-testid="file-input"
      />

      <button
        on:click|stopPropagation={() => fileInput?.click()}
        class="px-6 py-2.5 bg-[#c2ff00] hover:bg-[#d4ff33] active:bg-[#aaee00] text-[#060614] font-display font-black text-xs uppercase tracking-widest rounded-lg transition-all duration-100"
      >
        Choose File
      </button>
    </div>

  {:else}
    <!-- File ready state -->
    <div class="bg-[#080716] border border-[#c2ff00]/20 rounded-lg p-6">
      <div class="flex items-start justify-between mb-5">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <div class="w-1.5 h-1.5 rounded-full bg-[#c2ff00] pulse-dot"></div>
            <span class="text-[#c2ff00] font-mono text-[10px] uppercase tracking-widest">File Ready</span>
          </div>
          <p class="text-white font-semibold text-sm">{selectedFile.name}</p>
          <p class="text-[#6060a0] font-mono text-xs mt-0.5">{formatFileSize(selectedFile.size)}</p>
        </div>
        <button
          on:click={resetFile}
          class="text-[#6060a0] hover:text-white transition-colors p-1"
          title="Choose a different file"
          aria-label="Remove selected file"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <button
        on:click={runTfjsTranscription}
        disabled={isTranscribing}
        class="w-full px-5 py-3 bg-[#c2ff00] hover:bg-[#d4ff33] active:bg-[#aaee00] text-[#060614] font-display font-black text-xs uppercase tracking-widest rounded-lg transition-all duration-100 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        data-testid="tfjs-transcribe-button"
      >
        {#if isTranscribing}
          <svg class="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Transcribing…
        {:else}
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7v10l9-5-9-5z" />
          </svg>
          Transcribe in Browser
        {/if}
      </button>
    </div>
  {/if}
</div>
