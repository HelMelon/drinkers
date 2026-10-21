/**
 * Инициализация базы: применяет schema.sql и заливает сид каталога.
 *
 *   npm run db:init            — схема + фильтры, коктейли только если таблица пуста
 *   npm run db:init -- --seed  — дополнительно upsert'ит все 47 коктейлей из seed/
 *
 * Нужен DATABASE_URL (см. .env.example).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, query } from './db.js';
import { normalizeCocktail } from './normalize.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const forceSeed = process.argv.includes('--seed');

const applySchema = async () => {
  const sql = fs.readFileSync(path.join(here, 'schema.sql'), 'utf8');
  await query(sql);
  console.log('schema.sql применён');
};

const seedCocktails = async (force) => {
  const { rows: existing } = await query('SELECT count(*)::int AS count FROM cocktails');
  if (existing[0].count > 0 && !force) {
    console.log(`коктейли не трогаю: в базе уже ${existing[0].count}`);
    return;
  }
  const raw = JSON.parse(fs.readFileSync(path.join(here, 'seed', 'cocktails.json'), 'utf8'));
  let ok = 0;
  let skipped = 0;
  for (const row of raw) {
    const parsed = normalizeCocktail(row);
    if (!parsed.ok) {
      skipped += 1;
      continue;
    }
    const { id, name, composition, volume, price, iba_category: category } = parsed.value;
    await query(
      `INSERT INTO cocktails (id, name, composition, volume, price, iba_category)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, composition = EXCLUDED.composition,
         volume = EXCLUDED.volume, price = EXCLUDED.price, iba_category = EXCLUDED.iba_category`,
      [id, name, composition, volume, price, category],
    );
    ok += 1;
  }
  console.log(`сид: загружено ${ok}, пропущено ${skipped}`);
};

const main = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('Нет DATABASE_URL. Пример — в backend/.env.example');
    process.exit(1);
  }
  try {
    await applySchema();
    await seedCocktails(forceSeed);
    const { rows } = await query('SELECT count(*)::int AS cocktails FROM cocktails');
    const { rows: filters } = await query('SELECT count(*)::int AS filters FROM filters');
    console.log(`готово: коктейлей ${rows[0].cocktails}, фильтров ${filters[0].filters}`);
  } catch (error) {
    console.error('db:init упал:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

main();
