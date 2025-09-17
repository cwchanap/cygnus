import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Drizzle schema for D1 (SQLite)
export const songs = sqliteTable('songs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  song_name: text('song_name').notNull(),
  artist: text('artist').notNull(),
  bpm: integer('bpm').notNull(),
  release_date: text('release_date').notNull(),
  // D1 stores booleans as integers. Drizzle maps this via mode: 'boolean'.
  is_released: integer('is_released', { mode: 'boolean' }).notNull(),
  created_date: text('created_date').notNull(),
  origin: text('origin').notNull(),
  r2_key: text('r2_key').notNull(),
});

// Export schema object for typed db instance
export const schema = { songs };
