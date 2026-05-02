CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_date TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_normalized_name_unique
  ON categories (normalized_name);

ALTER TABLE songs ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
