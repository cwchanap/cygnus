<script lang="ts">
  import { jobsStore } from '../stores/jobs';
  import { toastStore } from '../stores/toast';

  let dragover = false;
  let fileInput: HTMLInputElement;
  let uploadedFile: { upload_id: string; filename: string; file_size: number } | null = null;
  let isStarting = false;
  let isUploading = false;
  
  const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/flac'];
  const API_BASE_URL = import.meta.env.PUBLIC_CRUX_API_URL || 'http://localhost:9331';
  
  async function handleFileUpload(file: File) {
    // Validate file size
    if (file.size > 50 * 1024 * 1024) {
      toastStore.show('File too large. Maximum size is 50MB.', 'error');
      return;
    }
    
    // Validate file type
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|flac)$/i)) {
      toastStore.show('Invalid file type. Please upload MP3, WAV, M4A, or FLAC.', 'error');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    isUploading = true;
    
    try {
      toastStore.show('Uploading file...', 'success');
      
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json() as { upload_id: string; filename: string; file_size: number };
      uploadedFile = {
        upload_id: result.upload_id,
        filename: result.filename,
        file_size: result.file_size
      };
      
      toastStore.show('File uploaded successfully! Click Start to begin transcription.', 'success');
      
    } catch (error) {
      console.error('Upload error:', error);
      toastStore.show(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      isUploading = false;
    }
  }

  async function startTranscription() {
    if (!uploadedFile) return;
    
    isStarting = true;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          upload_id: uploadedFile.upload_id
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start transcription: ${response.statusText}`);
      }
      
      const result = await response.json() as { job_id: string; metadata: { filename: string } };
      toastStore.show(`Transcription job started for ${result.metadata.filename}`, 'success');
      
      // Start auto-refresh and reload jobs
      jobsStore.startAutoRefresh();
      jobsStore.loadJobs();
      
      // Reset the upload state
      uploadedFile = null;
      
    } catch (error) {
      console.error('Start transcription error:', error);
      toastStore.show(`Failed to start transcription: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      isStarting = false;
    }
  }

  function resetUpload() {
    uploadedFile = null;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragover = false;
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }

  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }
</script>

<div class="w-full">
  {#if !uploadedFile}
    <div
      class="border-2 border-dashed rounded-lg p-8 text-center transition-colors {dragover ? 'border-cyan-400 bg-blue-500/20' : 'border-white/30 hover:border-white/50'}"
      on:dragover|preventDefault={() => dragover = true}
      on:dragleave|preventDefault={() => dragover = false}
      on:drop={handleDrop}
    >
      <svg class="mx-auto h-12 w-12 text-white/70 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      
      <p class="text-lg mb-2 text-white drop-shadow-sm">
        Drop your drum audio file here
      </p>
      <p class="text-sm text-white/80 mb-4 drop-shadow-sm">
        MP3, WAV, M4A, or FLAC (max 50MB)
      </p>
      
      <input
        type="file"
        accept=".mp3,.wav,.m4a,.flac,audio/*"
        class="hidden"
        bind:this={fileInput}
        on:change={handleFileSelect}
        disabled={isUploading}
      />
      
      <button
        on:click={() => fileInput?.click()}
        disabled={isUploading}
        class="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors drop-shadow-lg"
      >
        {isUploading ? 'Uploading...' : 'Choose File'}
      </button>
    </div>
  {:else}
    <div class="bg-green-500/20 border border-green-400/50 rounded-lg p-6 backdrop-blur-sm">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-white drop-shadow-sm">File Ready</h3>
          <p class="text-white/90 drop-shadow-sm">
            {uploadedFile.filename} ({formatFileSize(uploadedFile.file_size)})
          </p>
        </div>
        <button
          on:click={resetUpload}
          class="text-white/70 hover:text-white transition-colors drop-shadow-sm"
          title="Upload different file"
          aria-label="Remove uploaded file"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <button
        on:click={startTranscription}
        disabled={isStarting}
        class="w-full px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 drop-shadow-lg"
      >
        {#if isStarting}
          <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Starting Transcription...
        {:else}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start Transcription
        {/if}
      </button>
    </div>
  {/if}
</div>
