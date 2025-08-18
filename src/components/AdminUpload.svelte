<script lang="ts">
  export let passkeyOptional: boolean = false;
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

<div class="max-w-2xl mx-auto p-8 bg-card text-card-foreground rounded-lg shadow-md">
  <h1 class="text-2xl font-bold mb-6">Admin Song Upload</h1>
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    {#if !passkeyOptional}
      <div>
        <label for="passkey" class="block text-sm font-medium text-muted-foreground">Passkey</label>
        <input type="password" id="passkey" name="passkey" required class="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm">
      </div>
    {/if}
    <div>
      <label for="song" class="block text-sm font-medium text-muted-foreground">Song File</label>
      <input type="file" id="song" name="song" required accept="audio/*" class="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90">
    </div>
    <div>
      <label for="song_name" class="block text-sm font-medium text-muted-foreground">Song Name</label>
      <input type="text" id="song_name" name="song_name" required class="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm">
    </div>
    <div>
      <label for="artist" class="block text-sm font-medium text-muted-foreground">Artist</label>
      <input type="text" id="artist" name="artist" required class="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm">
    </div>
    <div>
      <label for="bpm" class="block text-sm font-medium text-muted-foreground">BPM</label>
      <input type="number" id="bpm" name="bpm" required class="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm">
    </div>
    <div>
      <label for="release_date" class="block text-sm font-medium text-muted-foreground">Release Date</label>
      <input type="date" id="release_date" name="release_date" required class="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring sm:text-sm">
    </div>
    <div>
      <label for="origin" class="block text-sm font-medium text-muted-foreground">Origin</label>
      <input type="text" id="origin" name="origin" required class="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm">
    </div>
    <div class="flex items-center">
      <input type="checkbox" id="is_released" name="is_released" value="true" class="h-4 w-4 text-primary bg-input border-border rounded focus:ring-ring">
      <label for="is_released" class="ml-2 block text-sm text-muted-foreground">Is Released?</label>
    </div>
    <button type="submit" class="w-full appearance-none py-2 px-4 bg-primary text-primary-foreground font-semibold rounded-lg shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-75">
      Upload Song
    </button>
  </form>
  {#if message}
    <p class="mt-4 text-center text-sm" class:text-destructive={message.startsWith('Error:')}>{message}</p>
  {/if}
</div>
