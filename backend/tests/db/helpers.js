import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { query, pool } from '../../db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(here, '..', '..', 'schema.sql');

/** Схема + базовый набор фильтров (идемпотентно). */
export const applySchema = async () => {
  await query(fs.readFileSync(schemaPath, 'utf8'));
};

/** Чистая база: пустые таблицы и штатные фильтры. */
export const resetDatabase = async () => {
  await query('TRUNCATE cocktails, filters');
  await applySchema();
};

export const closePool = () => pool.end();

/** Поднимает приложение на свободном порту и возвращает базовый URL. */
export const startServer = async (app) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  return {
    base: `http://127.0.0.1:${port}`,
    stop: () => new Promise((resolve) => server.close(resolve)),
  };
};

export const insertCocktail = async (overrides = {}) => {
  const row = {
    id: overrides.id ?? `t${Math.random().toString(36).slice(2, 10)}`,
    name: overrides.name ?? 'Test cocktail',
    composition: overrides.composition ?? 'gin, lime juice',
    volume: overrides.volume ?? 100,
    price: overrides.price ?? [14, 20],
    iba_category: overrides.iba_category ?? 'Classics',
  };
  await query(
    `INSERT INTO cocktails (id, name, composition, volume, price, iba_category)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [row.id, row.name, row.composition, row.volume, row.price, row.iba_category],
  );
  return row;
};

/** Хелпер для запросов: сразу подставляет токен и разбирает JSON. */
export const apiFetch = async (base, path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data, headers: res.headers, text };
};

export const loginAsAdmin = async (base) => {
  const { status, data } = await apiFetch(base, '/api/login', {
    method: 'POST',
    body: { password: process.env.ADMIN_PASSWORD },
  });
  if (status !== 200) throw new Error(`логин не удался: ${status}`);
  return data.token;
};
