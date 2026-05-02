# Song Category Design

## Summary

Add configurable song categories managed by admins. Each song belongs to at most one configured category. Categories are visible in the public music gallery, where listeners can filter songs by category.

## Problem

Songs currently have no category model. Admins can upload and edit songs, but they cannot maintain a controlled category list such as `Metal` or `J Pop`. The public gallery also cannot display or filter by category.

## Goals

- Let admins create, rename, and delete categories.
- Restrict each song to a single configured category.
- Require a category on upload and edit when at least one category exists.
- Preserve songs when a category is deleted by making them uncategorized.
- Expose category data through public APIs.
- Show category labels and category filtering in the public music UI.

## Non-Goals

- Multiple categories per song.
- Nested or hierarchical categories.
- Category artwork, descriptions, colors, or manual ordering.
- Dedicated public category landing pages.

## Existing Context

- Song metadata is stored in the `songs` D1 table and modeled in `cygnus-web/src/lib/db/schema.ts`.
- Admin upload uses `cygnus-web/src/components/AdminUpload.svelte` and `cygnus-web/src/pages/api/upload.ts`.
- Admin list, edit, and delete behavior lives in `cygnus-web/src/components/SongManagement.svelte` and `cygnus-web/src/pages/api/admin/songs.ts`.
- Public library data comes from `cygnus-web/src/pages/api/songs.ts` and renders through `MusicHome.svelte`, `SongList.svelte`, and `SongDetail.svelte`.

## Data Model

### New `categories` Table

Add a D1 table:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `name TEXT NOT NULL`
- `normalized_name TEXT NOT NULL`
- `created_date TEXT NOT NULL`

Add a unique index on `normalized_name`.

`normalized_name` is derived by trimming and lowercasing the category name. This makes `J Pop` and `j pop` duplicates while preserving the display label chosen by the admin.

### Songs Table Change

Add nullable `category_id INTEGER` to `songs`.

- `NULL` means `Uncategorized`.
- A song can have at most one category.
- The Drizzle schema should expose both `categories` and `songs.category_id`.

### Delete Behavior

Deleting a category must not delete songs. The delete operation:

1. updates all songs using the category to `category_id = NULL`
2. deletes the category row

This keeps category management lightweight and avoids destructive song operations.

## API Design

### Admin Category API

Add authenticated category CRUD at `/api/admin/categories`.

- `GET`: returns all categories ordered by `normalized_name` ascending.
- `POST`: creates a category from a submitted name.
- `PUT`: renames a category by ID.
- `DELETE`: deletes a category by ID and uncategorizes affected songs.

Validation:

- reject empty names after trimming
- reject duplicate names after normalization
- reject invalid, missing, or nonexistent IDs
- return clear `400` responses for invalid input and `404` for missing rows

### Admin Song API

Extend `/api/admin/songs` to include category metadata:

- `categoryId`
- `categoryName`

Extend `PUT` to accept `categoryId`.

Validation:

- when any categories exist, `categoryId` is required
- supplied category IDs must exist
- stale or deleted category IDs are rejected

### Upload API

Extend `/api/upload` to accept `categoryId` and validate it the same way as admin song updates.

If no categories exist, upload may proceed with `category_id = NULL`. If at least one category exists, upload must include a valid configured category.

### Public Categories API

Add `/api/categories`, returning all configured categories ordered by `normalized_name` ascending.

This gives the public filter a stable source of truth, including categories that currently have zero songs.

### Public Songs API

Extend `/api/songs` so each song includes category metadata for display.

Add optional filtering with a `category` query parameter:

- omitted: all songs
- category ID string: only songs in that configured category
- `uncategorized`: only songs with `category_id IS NULL`

## Admin UI

### Category Management

Add a focused category management section to the existing admin song workflow, preferably on `/admin/songs` near the song table.

It supports:

- listing categories
- creating categories
- inline renaming
- deleting with confirmation

The UI should surface API validation messages for empty names, duplicate names, stale IDs, and failed deletes.

### Song Upload

Update `AdminUpload.svelte` to load categories and render a single category select.

Behavior:

- if no categories exist, upload can proceed uncategorized
- if categories exist, category selection is required
- the submitted form sends `categoryId`
- category load failures should prevent silent invalid submissions and show a clear error

### Song Editing

Update `SongManagement.svelte` to show category in the table and include category selection in inline edit mode.

Behavior:

- read mode shows the configured category name or `Uncategorized`
- edit mode uses the current category list
- saving with a missing or stale category returns the API error to the admin

## Public UI

### Category Display

Show category metadata in:

- `SongList.svelte`, near existing song metadata
- `SongDetail.svelte`, for the selected song

Uncategorized songs display as `Uncategorized`.

### Category Filtering

Add a compact filter in `MusicHome.svelte` with:

- `All`
- one option per configured category
- `Uncategorized`

Selecting a filter narrows the visible songs. If the currently selected song no longer matches the filter, the UI selects the first visible song. If no songs match, the detail panel clears.

The first implementation can filter client-side after loading songs and categories, while `/api/songs` also supports server-side category filtering for future narrower fetches.

## Data Flow

### Admin Creates Category

1. admin submits a name
2. API trims and normalizes it
3. API rejects empty or duplicate names
4. API inserts the category
5. UI refreshes category-dependent controls

### Admin Uploads Song

1. upload form loads configured categories
2. admin selects a category when categories exist
3. form submits `categoryId` with song metadata and files
4. API validates the category
5. API inserts the song with `category_id`

### Admin Renames Category

1. admin submits a new name for an existing category
2. API validates normalized uniqueness
3. API updates the category row
4. songs keep their relationship through `category_id`

### Admin Deletes Category

1. admin confirms deletion
2. API sets matching songs to `category_id = NULL`
3. API deletes the category
4. admin and public UIs display affected songs as `Uncategorized`

### Public Filtering

1. public UI loads configured categories
2. public UI loads songs with category metadata
3. UI renders filter options
4. selected filter narrows the visible list
5. selected song is adjusted if it no longer belongs in the filtered list

## Error Handling

- Category names are trimmed before validation and normalization.
- Duplicate names are rejected case-insensitively.
- Category lists are sorted by `normalized_name` for stable display.
- API validation failures return useful messages for the UI to display.
- Empty states remain usable when there are no categories, no songs, or no songs in the selected category.
- If a category disappears between form load and submit, the API rejects the request and the UI shows the returned message.

## Testing

Add or update coverage for:

- migration creates `categories`, unique normalized names, and `songs.category_id`
- Drizzle schema exposes the new table and column
- admin category API create, list, rename, delete, duplicate rejection, and empty-name rejection
- category deletion uncategorizes affected songs
- upload rejects missing or invalid `categoryId` when categories exist
- admin song update rejects missing or invalid `categoryId` when categories exist
- `/api/categories` returns configured categories, including categories with zero songs
- `/api/songs` returns category metadata and supports category filtering
- `AdminUpload.svelte` renders and requires category selection when needed
- `SongManagement.svelte` displays and edits categories
- public UI shows category labels and filters songs correctly
- focused Playwright coverage for creating a category, assigning it to a song, and filtering publicly

## Implementation Notes

- Reuse the existing admin authentication pattern from current admin API routes.
- Keep the first version intentionally single-category. A many-to-many model can be added later only if real usage demands it.
- Prefer small, local UI additions over rewriting the admin page.
- Use shared validation helpers if category validation starts to duplicate across upload and song update routes.
