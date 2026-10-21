import './env.js';
import test, { after, before, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../../app.js';
import { apiFetch, closePool, insertCocktail, resetDatabase, startServer } from './helpers.js';

let server;

before(async () => {
  server = await startServer(app);
});

after(async () => {
  await server.stop();
  await closePool();
});

beforeEach(async () => {
  await resetDatabase();
  // 30 коктейлей: часть с джином, часть большие, категории разные
  for (let i = 1; i <= 30; i += 1) {
    await insertCocktail({
      id: `c${String(i).padStart(2, '0')}`,
      name: `Cocktail ${String(i).padStart(2, '0')}`,
      composition: i % 3 === 0 ? 'gin, lime juice' : 'rum, sugar',
      volume: i % 2 === 0 ? 200 : 90,
      iba_category: i % 5 === 0 ? 'New Era' : 'Classics',
    });
  }
});

describe('GET /api/cocktails/search', () => {
  test('первая страница: 25 из 30, pages=2', async () => {
    const { status, data } = await apiFetch(server.base, '/api/cocktails/search');
    assert.equal(status, 200);
    assert.equal(data.items.length, 25);
    assert.equal(data.total, 30);
    assert.equal(data.page, 1);
    assert.equal(data.pages, 2);
  });

  test('вторая страница отдаёт остаток', async () => {
    const { data } = await apiFetch(server.base, '/api/cocktails/search?page=2');
    assert.equal(data.items.length, 5);
    assert.equal(data.page, 2);
  });

  test('per_page ограничен сотней', async () => {
    const { data } = await apiFetch(server.base, '/api/cocktails/search?per_page=500');
    assert.equal(data.per_page, 100);
    assert.equal(data.items.length, 30);
  });

  test('фильтр по категории', async () => {
    const { data: filters } = await apiFetch(server.base, '/api/filters');
    const classics = filters.find((filter) => filter.matchValue === 'Classics');
    const { data } = await apiFetch(server.base, `/api/cocktails/search?filter=${classics.id}&per_page=100`);
    assert.equal(data.total, 24);
    assert.ok(data.items.every((item) => item.iba_category === 'Classics'));
  });

  test('фильтр по объёму', async () => {
    const { data: filters } = await apiFetch(server.base, '/api/filters');
    const volume = filters.find((filter) => filter.kind === 'volume');
    const { data } = await apiFetch(server.base, `/api/cocktails/search?filter=${volume.id}&per_page=100`);
    assert.equal(data.total, 15);
    assert.ok(data.items.every((item) => item.volume > volume.threshold));
  });

  test('поиск по составу', async () => {
    const { data } = await apiFetch(server.base, '/api/cocktails/search?q=gin&per_page=100');
    assert.equal(data.total, 10);
  });

  test('неизвестный фильтр → 400', async () => {
    const { status } = await apiFetch(server.base, '/api/cocktails/search?filter=nope');
    assert.equal(status, 400);
  });

  test('сортировка по объёму — убывание', async () => {
    const { data } = await apiFetch(server.base, '/api/cocktails/search?sort=volume&per_page=5');
    const volumes = data.items.map((item) => item.volume);
    assert.deepEqual(volumes, [...volumes].sort((a, b) => b - a));
  });
});

describe('GET /api/cocktails/random', () => {
  test('возвращает коктейль из выборки', async () => {
    const { status, data } = await apiFetch(server.base, '/api/cocktails/random');
    assert.equal(status, 200);
    assert.match(data.id, /^c\d{2}$/);
  });

  test('учитывает фильтр', async () => {
    const { data: filters } = await apiFetch(server.base, '/api/filters');
    const volume = filters.find((filter) => filter.kind === 'volume');
    const { data } = await apiFetch(server.base, `/api/cocktails/random?filter=${volume.id}`);
    assert.ok(data.volume > volume.threshold);
  });
});

describe('GET /api/filters: счётчики', () => {
  test('каждый фильтр отдаёт count, совпадающий с поиском', async () => {
    const { data: filters } = await apiFetch(server.base, '/api/filters');
    assert.ok(filters.length >= 4);
    for (const filter of filters) {
      const { data } = await apiFetch(server.base, `/api/cocktails/search?filter=${filter.id}`);
      assert.equal(data.total, filter.count, `фильтр ${filter.label}: count ≠ total`);
    }
  });
});
