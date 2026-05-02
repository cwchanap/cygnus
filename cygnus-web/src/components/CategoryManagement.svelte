<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  interface Category {
    id: number;
    name: string;
  }

  const dispatch = createEventDispatcher<{ changed: void }>();

  let categories: Category[] = [];
  let newCategory = '';
  let loading = true;
  let error = '';
  let savingId: number | null = null;
  let deletingId: number | null = null;

  async function readMessage(response: Response) {
    try {
      const body = await response.json();
      return typeof body.message === 'string'
        ? body.message
        : response.statusText;
    } catch {
      return response.statusText;
    }
  }

  async function fetchCategories() {
    try {
      loading = true;
      error = '';

      const response = await fetch('/api/admin/categories');
      if (!response.ok) {
        throw new Error(await readMessage(response));
      }

      const data = await response.json();
      categories = data.categories ?? [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to fetch categories';
    } finally {
      loading = false;
    }
  }

  async function createCategory() {
    const name = newCategory.trim();
    if (!name) return;

    try {
      error = '';
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error(await readMessage(response));
      }

      newCategory = '';
      await fetchCategories();
      dispatch('changed');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create category';
    }
  }

  async function renameCategory(category: Category) {
    const name = category.name.trim();
    if (!name) {
      error = 'Category name is required';
      return;
    }

    try {
      savingId = category.id;
      error = '';
      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: category.id, name }),
      });

      if (!response.ok) {
        throw new Error(await readMessage(response));
      }

      await fetchCategories();
      dispatch('changed');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to rename category';
    } finally {
      savingId = null;
    }
  }

  async function deleteCategory(category: Category) {
    if (
      !confirm(
        `Delete category "${category.name}"? Songs in this category will become uncategorized.`
      )
    ) {
      return;
    }

    try {
      deletingId = category.id;
      error = '';
      const response = await fetch(`/api/admin/categories?id=${category.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(await readMessage(response));
      }

      await fetchCategories();
      dispatch('changed');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete category';
    } finally {
      deletingId = null;
    }
  }

  onMount(() => {
    fetchCategories();
  });
</script>

<section class="mb-8 border-b border-white/20 pb-8">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 class="text-2xl font-bold text-white">Categories</h2>
    </div>

    <form
      class="flex flex-col gap-3 sm:flex-row sm:items-end"
      on:submit|preventDefault={createCategory}
    >
      <div>
        <label
          for="new-category"
          class="block text-sm font-medium text-cyan-200">New category</label
        >
        <input
          id="new-category"
          type="text"
          bind:value={newCategory}
          class="mt-1 w-full rounded-md border border-blue-400/30 bg-blue-900/40 px-3 py-2 text-blue-100 placeholder-blue-300/60 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 sm:w-64"
        />
      </div>
      <button
        type="submit"
        class="rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-cyan-500"
      >
        Create Category
      </button>
    </form>
  </div>

  {#if error}
    <div
      class="mt-4 rounded-lg border border-red-400/50 bg-red-500/20 px-4 py-3 text-red-300"
    >
      {error}
    </div>
  {/if}

  {#if loading}
    <div class="py-6 text-white/70">Loading categories...</div>
  {:else if categories.length === 0}
    <div class="py-6 text-white/70">No categories configured</div>
  {:else}
    <div class="mt-5 space-y-3">
      {#each categories as category (category.id)}
        <div
          class="flex flex-col gap-3 rounded-lg border border-white/15 bg-white/5 p-3 sm:flex-row sm:items-center"
        >
          <input
            aria-label={`Category ${category.id}`}
            type="text"
            bind:value={category.name}
            class="min-w-0 flex-1 rounded-md border border-white/30 bg-white/15 px-3 py-2 text-white placeholder-white/60 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <div class="flex gap-2">
            <button
              type="button"
              on:click={() => renameCategory(category)}
              disabled={savingId === category.id}
              class="rounded bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {savingId === category.id ? 'Saving...' : 'Rename'}
            </button>
            <button
              type="button"
              on:click={() => deleteCategory(category)}
              disabled={deletingId === category.id}
              class="rounded bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              {deletingId === category.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</section>
