-- D1 (SQLite) schema for songs
CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_name TEXT NOT NULL,
  artist TEXT NOT NULL,
  bpm INTEGER NOT NULL,
  release_date TEXT NOT NULL,
  is_released INTEGER NOT NULL DEFAULT 0,
  created_date TEXT NOT NULL,
  origin TEXT NOT NULL,
  r2_key TEXT NOT NULL
);
