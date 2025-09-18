<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  interface Song {
    id: number;
    song_name: string;
    artist: string;
    bpm: number;
    release_date: string;
    is_released: boolean;
    created_date: string;
    origin: string;
    r2_key: string;
  }

  interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }

  let songs: Song[] = [];
  let pagination: Pagination = { page: 1, limit: 10, total: 0, totalPages: 0 };
  let loading = true;
  let error = '';
  let deletingId: number | null = null;
  let editingSong: Song | null = null;

  // Form data for editing
  let editForm = {
    song_name: '',
    artist: '',
    bpm: '',
    release_date: '',
    is_released: false,
    origin: ''
  };

  async function fetchSongs(page = 1) {
    try {
      loading = true;
      error = '';

      const response = await fetch(`/api/admin/songs?page=${page}&limit=${pagination.limit}`);
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname);
          return;
        }
        throw new Error('Failed to fetch songs');
      }

      const data = await response.json();
      songs = data.songs;
      pagination = data.pagination;
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error fetching songs:', err);
    } finally {
      loading = false;
    }
  }

  async function deleteSong(songId: number) {
    if (!confirm('Are you sure you want to delete this song? This action cannot be undone.')) {
      return;
    }

    try {
      deletingId = songId;
      const response = await fetch(`/api/admin/songs?id=${songId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname);
          return;
        }
        throw new Error('Failed to delete song');
      }

      // Refresh the current page
      await fetchSongs(pagination.page);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete song';
      console.error('Error deleting song:', err);
    } finally {
      deletingId = null;
    }
  }

  function startEdit(song: Song) {
    editingSong = song;
    editForm = {
      song_name: song.song_name,
      artist: song.artist,
      bpm: song.bpm.toString(),
      release_date: song.release_date,
      is_released: song.is_released,
      origin: song.origin
    };
  }

  function cancelEdit() {
    editingSong = null;
    editForm = { song_name: '', artist: '', bpm: '', release_date: '', is_released: false, origin: '' };
  }

  async function saveEdit() {
    if (!editingSong) return;

    try {
      const formData = new FormData();
      formData.append('id', editingSong.id.toString());
      formData.append('song_name', editForm.song_name);
      formData.append('artist', editForm.artist);
      formData.append('bpm', editForm.bpm);
      formData.append('release_date', editForm.release_date);
      formData.append('is_released', editForm.is_released.toString());
      formData.append('origin', editForm.origin);

      const response = await fetch('/api/admin/songs', {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname);
          return;
        }
        throw new Error('Failed to update song');
      }

      cancelEdit();
      await fetchSongs(pagination.page);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update song';
      console.error('Error updating song:', err);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onMount(() => {
    fetchSongs();
  });
</script>

<div class="song-management">
  {#if error}
    <div class="bg-red-500/20 border border-red-400/50 text-red-300 px-4 py-3 rounded-lg mb-6">
      {error}
    </div>
  {/if}

  {#if loading}
    <div class="text-center py-12">
      <div class="text-white text-lg mb-4">Loading songs...</div>
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
    </div>
  {:else}
    <!-- Songs Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-white">
        <thead>
          <tr class="border-b border-white/20">
            <th class="text-left py-3 px-4 font-semibold">Song Name</th>
            <th class="text-left py-3 px-4 font-semibold">Artist</th>
            <th class="text-left py-3 px-4 font-semibold">BPM</th>
            <th class="text-left py-3 px-4 font-semibold">Release Date</th>
            <th class="text-left py-3 px-4 font-semibold">Status</th>
            <th class="text-left py-3 px-4 font-semibold">Uploaded</th>
            <th class="text-left py-3 px-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each songs as song (song.id)}
            <tr class="border-b border-white/10 hover:bg-white/5 transition-colors">
              <td class="py-3 px-4">
                {#if editingSong?.id === song.id}
                  <input
                    type="text"
                    bind:value={editForm.song_name}
                    class="bg-white/20 border border-white/30 rounded px-2 py-1 text-white placeholder-white/60 w-full"
                  />
                {:else}
                  {song.song_name}
                {/if}
              </td>
              <td class="py-3 px-4">
                {#if editingSong?.id === song.id}
                  <input
                    type="text"
                    bind:value={editForm.artist}
                    class="bg-white/20 border border-white/30 rounded px-2 py-1 text-white placeholder-white/60 w-full"
                  />
                {:else}
                  {song.artist}
                {/if}
              </td>
              <td class="py-3 px-4">
                {#if editingSong?.id === song.id}
                  <input
                    type="number"
                    bind:value={editForm.bpm}
                    class="bg-white/20 border border-white/30 rounded px-2 py-1 text-white placeholder-white/60 w-20"
                  />
                {:else}
                  {song.bpm}
                {/if}
              </td>
              <td class="py-3 px-4">
                {#if editingSong?.id === song.id}
                  <input
                    type="date"
                    bind:value={editForm.release_date}
                    class="bg-white/20 border border-white/30 rounded px-2 py-1 text-white w-36"
                  />
                {:else}
                  {formatDate(song.release_date)}
                {/if}
              </td>
              <td class="py-3 px-4">
                {#if editingSong?.id === song.id}
                  <input
                    type="checkbox"
                    bind:checked={editForm.is_released}
                    class="rounded border-white/30"
                  />
                {:else}
                  <span class="px-2 py-1 rounded text-xs {song.is_released ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}">
                    {song.is_released ? 'Released' : 'Draft'}
                  </span>
                {/if}
              </td>
              <td class="py-3 px-4 text-sm text-white/70">
                {formatDate(song.created_date)}
              </td>
              <td class="py-3 px-4">
                {#if editingSong?.id === song.id}
                  <div class="flex gap-2">
                    <button
                      on:click={saveEdit}
                      class="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm transition-colors"
                    >
                      Save
                    </button>
                    <button
                      on:click={cancelEdit}
                      class="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                {:else}
                  <div class="flex gap-2">
                    <button
                      on:click={() => startEdit(song)}
                      class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      on:click={() => deleteSong(song.id)}
                      disabled={deletingId === song.id}
                      class="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm transition-colors disabled:opacity-50"
                    >
                      {deletingId === song.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if pagination.totalPages > 1}
      <div class="flex justify-center items-center mt-8 gap-4">
        <button
          on:click={() => fetchSongs(pagination.page - 1)}
          disabled={pagination.page <= 1}
          class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Previous
        </button>

        <span class="text-white">
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} total songs)
        </span>

        <button
          on:click={() => fetchSongs(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Next
        </button>
      </div>
    {/if}

    {#if songs.length === 0}
      <div class="text-center py-12">
        <div class="text-white/70 text-lg">No songs found</div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .song-management {
    min-height: 400px;
  }

  input[type="checkbox"] {
    accent-color: rgb(6 182 212);
  }

  input:focus, select:focus {
    outline: none;
    ring: 2px;
    ring-color: rgb(6 182 212);
  }
</style>