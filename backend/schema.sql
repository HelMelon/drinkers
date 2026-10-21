-- Схема drinkers. Применяется через `npm run db:init` (backend/db-init.js).
-- Идемпотентно: повторный запуск ничего не ломает.

CREATE TABLE IF NOT EXISTS cocktails (
  id text PRIMARY KEY,
  name text NOT NULL,
  composition text,
  volume integer NOT NULL CHECK (volume > 0),
  price integer[] NOT NULL DEFAULT '{}',
  iba_category text NOT NULL DEFAULT 'Not categorized'
);

CREATE INDEX IF NOT EXISTS cocktails_category_idx ON cocktails (iba_category);
CREATE INDEX IF NOT EXISTS cocktails_name_lower_idx ON cocktails (lower(name));

CREATE TABLE IF NOT EXISTS filters (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('category', 'ingredient', 'volume')),
  label text NOT NULL,
  match_value text,
  threshold integer,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS filters_kind_idx ON filters (kind, sort_order);

-- Базовый набор фильтров каталога. Дальше он правится в админке.
INSERT INTO filters (id, kind, label, match_value, threshold, sort_order) VALUES
  ('cat-classics', 'category', 'Classics', 'Classics', NULL, 1),
  ('cat-unforgettables', 'category', 'Unforgettables', 'Unforgettables', NULL, 2),
  ('cat-new-era', 'category', 'New Era', 'New Era', NULL, 3),
  ('ing-gin', 'ingredient', 'gin', 'gin', NULL, 1),
  ('ing-tequila', 'ingredient', 'tequila', 'tequila', NULL, 2),
  ('ing-rum', 'ingredient', 'rum', 'rum', NULL, 3),
  ('ing-sour', 'ingredient', 'sour', 'lime', NULL, 4),
  ('vol-big', 'volume', 'big volume', NULL, 150, 5),
  ('cat-not-categorized', 'category', 'Not categorized', 'Not categorized', NULL, 4)
ON CONFLICT (id) DO NOTHING;
