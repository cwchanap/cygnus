<script lang="ts">
  let message = '';

  async function handleSubmit(event: SubmitEvent) {
    console.log('Form submission triggered');
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      interface ApiResponse {
        message: string;
      }
      const result: ApiResponse = await response.json();

      if (response.ok) {
        message = result.message;
        form.reset();
      } else {
        message = `Error: ${result.message || response.statusText}`;
      }
    } catch (error) {
      console.error('Upload failed:', error);
      message = 'Upload failed. See console for details.';
    }
  }
</script>

<div class="max-w-2xl mx-auto p-8 bg-gradient-to-br from-blue-900/90 via-blue-800/85 to-cyan-900/90 backdrop-blur-sm rounded-xl shadow-2xl border border-blue-400/30 text-blue-50">
  <h1 class="text-3xl font-bold mb-6 text-white">Admin Song Upload</h1>
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div>
      <label for="song" class="block text-sm font-medium text-cyan-200">Song File</label>
      <input type="file" id="song" name="song" required accept="audio/*" class="mt-1 block w-full text-sm text-blue-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r from-blue-600 to-cyan-600 file:text-white hover:file:from-blue-700 hover:file:to-cyan-700">
    </div>
    <div>
      <label for="preview_image" class="block text-sm font-medium text-cyan-200">Preview Image (optional)</label>
      <input type="file" id="preview_image" name="preview_image" accept="image/*" class="mt-1 block w-full text-sm text-blue-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r from-blue-600 to-cyan-600 file:text-white hover:file:from-blue-700 hover:file:to-cyan-700">
    </div>
    <div>
      <label for="song_name" class="block text-sm font-medium text-cyan-200">Song Name</label>
      <input type="text" id="song_name" name="song_name" required class="mt-1 block w-full px-3 py-2 bg-blue-900/40 border border-blue-400/30 rounded-md shadow-sm placeholder-blue-300/60 text-blue-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 sm:text-sm">
    </div>
    <div>
      <label for="artist" class="block text-sm font-medium text-cyan-200">Artist</label>
      <input type="text" id="artist" name="artist" required class="mt-1 block w-full px-3 py-2 bg-blue-900/40 border border-blue-400/30 rounded-md shadow-sm placeholder-blue-300/60 text-blue-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 sm:text-sm">
    </div>
    <div>
      <label for="bpm" class="block text-sm font-medium text-cyan-200">BPM</label>
      <input type="number" id="bpm" name="bpm" required class="mt-1 block w-full px-3 py-2 bg-blue-900/40 border border-blue-400/30 rounded-md shadow-sm placeholder-blue-300/60 text-blue-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 sm:text-sm">
    </div>
    <div>
      <label for="release_date" class="block text-sm font-medium text-cyan-200">Release Date</label>
      <input type="date" id="release_date" name="release_date" required class="mt-1 block w-full px-3 py-2 bg-blue-900/40 border border-blue-400/30 rounded-md shadow-sm text-blue-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 sm:text-sm">
    </div>
    <div>
      <label for="origin" class="block text-sm font-medium text-cyan-200">Origin</label>
      <input type="text" id="origin" name="origin" required class="mt-1 block w-full px-3 py-2 bg-blue-900/40 border border-blue-400/30 rounded-md shadow-sm placeholder-blue-300/60 text-blue-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 sm:text-sm">
    </div>
    <div class="flex items-center">
      <input type="checkbox" id="is_released" name="is_released" value="true" class="h-4 w-4 text-cyan-400 bg-blue-900/40 border-blue-400/30 rounded focus:ring-cyan-400">
      <label for="is_released" class="ml-2 block text-sm text-cyan-200">Is Released?</label>
    </div>
    <button type="submit" class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transform hover:-translate-y-0.5 transition">
      Upload Song
    </button>
  </form>
  {#if message}
    <p class="mt-4 text-center text-sm text-blue-100" class:text-destructive={message.startsWith('Error:')}>{message}</p>
  {/if}
</div>
