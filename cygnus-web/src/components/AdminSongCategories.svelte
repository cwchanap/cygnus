<script lang="ts">
  import CategoryManagement from './CategoryManagement.svelte';
  import SongManagement from './SongManagement.svelte';

  let refreshVersion = 0;

  function refreshSongs() {
    refreshVersion += 1;
  }
</script>

<CategoryManagement on:changed={refreshSongs} />
{#key refreshVersion}
  <SongManagement />
{/key}
