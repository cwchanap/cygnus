# Song Category Design

## Summary

Add configurable song categories managed by admins. A song belongs to at most one category, and that category must come from the admin-managed category list. Categories must also appear in the public music UI so users can see a song's category and filter the library by category.

## Problem

Songs currently have no category model. Admins can upload and edit songs, but they cannot define a controlled list of categories such as `Metal` or `J Pop`, and the public library cannot display or filter songs by category.

## Goals

- Let admins create, rename, and delete categories.
- Restrict songs to a single configured category.
- Require a category when at least one category exists.
- Allow songs to become uncategorized when their category is deleted.
- Expose category data to the public song API.
- Add category display and filtering to the public music UI.

## Non-Goals

- Multiple categories per song.
- Nested or hierarchical categories.
- Per-category artwork, descriptions, colors, or ordering rules.
- Separate public category landing pages.

## Existing Context

- Song metadata is stored in the `songs` D1 table and modeled in `cygnus-web/src/lib/db/schema.ts`.
- Admin upload uses `cygnus-web/src/components/AdminUpload.svelte` and `cygnus-web/src/pages/api/upload.ts`.
- Admin edit/delete/list behavior lives in `cygnus-web/src/components/SongManagement.svelte` and `cygnus-web/src/pages/api/admin/songs.ts`.
- Public library data comes from `cygnus-web/src/pages/api/songs.ts` and is rendered by `MusicHome.svelte`, `SongList.svelte`, and `SongDetail.svelte`.

## Data Model

### New table: `categories`

Add a new D1 table for admin-managed categories with:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `name TEXT NOT NULL`
- `normalized_name TEXT NOT NULL`
- `created_date TEXT NOT NULL`
- unique index on `normalized_name`

`normalized_name` exists only to enforce case-insensitive uniqueness and should be derived from trimmed, lowercased input.

### Changes to `songs`

Add a nullable `category_id INTEGER` column to `songs`.

- `NULL` means the song is uncategorized.
- Songs still belong to at most one category.
- The Drizzle schema should model the new column and expose category shape in typed query results.

### Delete behavior

Deleting a category must not delete songs. Instead:

1. all songs using that category are updated to `category_id = NULL`
2. the category row is deleted

This keeps the admin action lightweight and matches the approved behavior.

## Admin Experience

### Category management

Add category management to the admin area as a focused UI for:

- listing categories
- creating a category
- renaming a category
- deleting a category

This can live on the existing `/admin/songs` page beside or above the song table, or as a closely related admin section linked from the current admin navigation. The important constraint is that category management stays inside the current admin workflow and does not become a separate subsystem.

### Song upload

Update `AdminUpload.svelte` so the upload form loads configured categories and renders a single-select category input.

Behavior:

- if no categories exist, upload may proceed without category selection
- if one or more categories exist, category becomes required
- the UI should make the required state obvious
- the submitted payload sends `categoryId`

### Song editing

Update `SongManagement.svelte` so inline edit mode includes category selection from the configured category list.

Behavior:

- current category is shown in read mode
- edit mode uses the same allowed category list as upload
- uncategorized songs display as `Uncategorized`
- save is rejected if the chosen category no longer exists

## Public Experience

### Song display

Expose category in the public library and show it in the main UI.

Expected UI impact:

- `SongList.svelte` shows each song's category alongside existing metadata
- `SongDetail.svelte` shows the selected song's category in the detail panel
- uncategorized songs display as `Uncategorized`

### Category filtering

Add a category filter to the public music UI in `MusicHome.svelte`.

Behavior:

- include an `All` option
- include one option per configured category
- include an `Uncategorized` option
- selecting a filter updates the visible song list and selected song behavior consistently

The public source of truth for configured categories should be a lightweight public categories endpoint so the UI can show categories even when they currently have zero songs. The selected filter can still be applied client-side in the first version, but the songs API must also support category filtering so the backend contract is ready for narrower fetches and future expansion.

## API Design

### Admin category API

Add admin-only endpoints for category CRUD. A single route such as `/api/admin/categories` is sufficient.

Required operations:

- `GET` returns all categories ordered by `normalized_name` ascending
- `POST` creates a category
- `PUT` renames a category
- `DELETE` deletes a category and uncategorizes affected songs

Validation:

- reject empty names
- reject duplicate names after normalization
- reject updates/deletes for nonexistent category IDs

### Admin song API

Extend `/api/admin/songs` responses to include:

- `categoryId`
- `categoryName` or equivalent nested category metadata needed by the UI

Extend song update handling to accept `categoryId` and validate:

- when categories exist, a category is required
- if `categoryId` is supplied, it must refer to an existing category

### Upload API

Extend `/api/upload` to accept `categoryId` with the same validation rules used by admin song updates.

### Public songs API

Extend `/api/songs` so each song includes category data for display.

Add optional category filtering support with a `category` query parameter that supports:

- all songs when omitted
- a specific configured category by category ID string
- `uncategorized` for songs whose `category_id` is `NULL`

### Public categories API

Add a lightweight public endpoint such as `/api/categories` that returns the configured categories ordered by `normalized_name` ascending.

This endpoint exists so the public filter can render:

- all configured categories, including categories with zero songs
- a stable source of truth for category labels and IDs

## Data Flow

### Admin create category

1. admin submits a category name
2. API normalizes and validates it
3. API inserts the category row
4. UI refreshes the category list and any dependent song form options

### Admin upload song

1. upload form fetches categories
2. admin selects one category when categories exist
3. form submits `categoryId` with song metadata and files
4. API validates the category and inserts the song row with `category_id`

### Admin rename category

1. admin submits a new category name
2. API validates uniqueness on normalized name
3. API updates the category row only
4. songs retain their relationship through `category_id`

### Admin delete category

1. admin requests deletion
2. API sets matching songs to `category_id = NULL`
3. API deletes the category
4. admin and public UIs display those songs as `Uncategorized`

### Public filtering

1. public UI loads configured categories from the public categories endpoint
2. public UI loads songs with category metadata
3. public UI renders filter options including `All`, every configured category, and `Uncategorized`
4. selecting a filter narrows the visible list
5. if the active selection is filtered out, the UI selects the first visible song, or clears the selection when no songs remain visible

## Validation and Error Handling

- Category names are trimmed before validation and normalization.
- `J Pop` and `j pop` must be treated as duplicates.
- Category-related API failures return clear `400` responses for invalid input and `404` where an ID no longer exists.
- If categories exist and a song request omits category selection, the API returns a validation error rather than silently assigning uncategorized.
- If a category disappears between form load and submit, the API rejects the request and the UI surfaces the returned message.
- Category lists returned by admin APIs and used in filter controls should be sorted by normalized name ascending for stable UX.
- UI empty states should remain usable when there are no songs, no categories, or no songs for the selected filter.

## Testing

Add or update coverage for:

### Schema and data access

- migration adds `categories` and `songs.category_id`
- category uniqueness works through normalized names
- deleting a category uncategorizes related songs

### Admin API

- create category
- reject duplicate or empty category names
- rename category
- delete category and clear song references
- reject invalid `categoryId` on song upload/update
- require category when categories exist

### Admin UI and e2e

- category management controls render for admins
- admin can create, rename, and delete categories
- upload form enforces category when categories exist
- song edit flow can assign and change category

### Public UI and API

- `/api/songs` returns category metadata
- `/api/categories` returns the complete configured category list, including categories with zero songs
- public library shows category labels
- category filter narrows the visible list correctly
- `Uncategorized` filter shows songs with `NULL category_id`

## Open Implementation Notes

- Reuse existing admin authentication patterns from current admin routes.
- Prefer small, focused UI additions over a large admin page rewrite.
- Keep the first version simple: controlled categories, single-select song assignment, and public filtering/display only.
