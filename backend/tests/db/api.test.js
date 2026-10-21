import './env.js'; // первым: DATABASE_URL и ADMIN_PASSWORD нужны до импорта app.js
import test, { after, before, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../../app.js';
import { apiFetch, closePool, insertCocktail, loginAsAdmin, resetDatabase, startServer } from './helpers.js';

let server;
let token;

before(async () => {
  server = await startServer(app);
  token = await loginAsAdmin(server.base);
});

after(async () => {
  await server.stop();
  await closePool();
});

beforeEach(async () => {
  await resetDatabase();
});

describe('авторизация', () => {
  test('неверный пароль → 401', async () => {
    const { status, data } = await apiFetch(server.base, '/api/login', {
      method: 'POST',
      body: { password: 'nope' },
    });
    assert.equal(status, 401);
    assert.match(data.statusText, /Неверный пароль/);
  });

  test('закрытые методы без токена → 401', async () => {
    const patch = await apiFetch(server.base, '/api/cocktails/x', { method: 'PATCH', body: { volume: 1 } });
    const exportCsv = await apiFetch(server.base, '/api/export?format=csv');
    const importCall = await apiFetch(server.base, '/api/import', { method: 'POST', body: { format: 'json', content: '[]' } });
    assert.deepEqual([patch.status, exportCsv.status, importCall.status], [401, 401, 401]);
  });
});

describe('коктейли', () => {
  test('список отдаётся без токена', async () => {
    await insertCocktail({ name: 'Negroni', iba_category: 'Unforgettables' });
    const { status, data } = await apiFetch(server.base, '/api/cocktails');
    assert.equal(status, 200);
    assert.equal(data.length, 1);
    assert.equal(data[0].name, 'Negroni');
  });

  test('PATCH меняет поля и видно в следующем GET', async () => {
    const row = await insertCocktail({ name: 'Before', volume: 100 });
    const patched = await apiFetch(server.base, `/api/cocktails/${row.id}`, {
      method: 'PATCH',
      token,
      body: { name: 'After', volume: 175, price: '18 25' },
    });
    assert.equal(patched.status, 200);
    assert.equal(patched.data.name, 'After');
    assert.deepEqual(patched.data.price, [18, 25]);

    const { data } = await apiFetch(server.base, '/api/cocktails');
    assert.equal(data[0].volume, 175);
  });

  test('PATCH несуществующего → 404', async () => {
    const { status } = await apiFetch(server.base, '/api/cocktails/nope', { method: 'PATCH', token, body: { volume: 90 } });
    assert.equal(status, 404);
  });

  test('создание и удаление', async () => {
    const created = await apiFetch(server.base, '/api/cocktails', {
      method: 'POST',
      token,
      body: { name: 'New one', composition: 'rum', volume: 120, price: '12' },
    });
    assert.equal(created.status, 201);
    const id = created.data.id;

    const removed = await apiFetch(server.base, `/api/cocktails/${id}`, { method: 'DELETE', token });
    assert.equal(removed.status, 200);
    const { data } = await apiFetch(server.base, '/api/cocktails');
    assert.equal(data.length, 0);
  });
});

describe('фильтры', () => {
  test('создание, правка, удаление', async () => {
    const created = await apiFetch(server.base, '/api/filters', {
      method: 'POST',
      token,
      body: { kind: 'ingredient', label: 'vodka', matchValue: 'vodka' },
    });
    assert.equal(created.status, 201);
    const id = created.data.id;

    const patched = await apiFetch(server.base, `/api/filters/${id}`, { method: 'PATCH', token, body: { label: 'водка' } });
    assert.equal(patched.status, 200);
    assert.equal(patched.data.label, 'водка');

    const list = await apiFetch(server.base, '/api/filters');
    assert.ok(list.data.some((filter) => filter.id === id));

    const removed = await apiFetch(server.base, `/api/filters/${id}`, { method: 'DELETE', token });
    assert.equal(removed.status, 200);
    const after = await apiFetch(server.base, '/api/filters');
    assert.ok(!after.data.some((filter) => filter.id === id));
  });

  test('volume без порога → 400', async () => {
    const { status } = await apiFetch(server.base, '/api/filters', {
      method: 'POST',
      token,
      body: { kind: 'volume', label: 'big' },
    });
    assert.equal(status, 400);
  });
});

describe('импорт и экспорт', () => {
  test('merge применяет валидные строки и отчитывается о битых', async () => {
    const rows = [
      { name: 'Good', composition: 'gin', volume: 90, price: '14', iba_category: 'Classics' },
      { name: '', volume: 'abc' },
    ];
    const { status, data } = await apiFetch(server.base, '/api/import', {
      method: 'POST',
      token,
      body: { format: 'json', mode: 'merge', content: JSON.stringify(rows) },
    });
    assert.equal(status, 200);
    assert.equal(data.added, 1);
    assert.equal(data.skipped, 1);
    assert.equal(data.errors[0].line, 2);
  });

  test('replace с битой строкой отменяется, данные целы', async () => {
    await insertCocktail({ name: 'Existing' });
    const rows = [{ name: 'Fine', volume: 100 }, { name: '', volume: 0 }];
    const { status, data } = await apiFetch(server.base, '/api/import', {
      method: 'POST',
      token,
      body: { format: 'json', mode: 'replace', content: JSON.stringify(rows) },
    });
    assert.equal(status, 400);
    assert.match(data.statusText, /каталог не изменён/);
    const { data: list } = await apiFetch(server.base, '/api/cocktails');
    assert.equal(list.length, 1);
    assert.equal(list[0].name, 'Existing');
  });

  test('export CSV и JSON отдают данные', async () => {
    await insertCocktail({ name: 'Aperol spritz', composition: 'prosecco, soda', price: [15, 20] });
    const csv = await apiFetch(server.base, '/api/export?format=csv', { token });
    assert.equal(csv.status, 200);
    assert.match(csv.text, /^id,name,composition,volume,price,iba_category/);
    assert.match(csv.text, /Aperol spritz/);
    assert.match(csv.text, /15 20/, 'цена должна быть через пробел');

    const json = await apiFetch(server.base, '/api/export?format=json', { token });
    assert.equal(json.status, 200);
    assert.equal(json.data.length, 1);
    assert.deepEqual(json.data[0].price, [15, 20]);
  });

  test('экспорт отклоняет неизвестный формат', async () => {
    const { status } = await apiFetch(server.base, '/api/export?format=xlsx', { token });
    assert.equal(status, 400);
  });
});

describe('сводка и CORS', () => {
  test('stats считает коктейли и фильтры', async () => {
    await insertCocktail({ name: 'One', iba_category: 'Classics' });
    await insertCocktail({ name: 'Two', iba_category: 'Classics' });
    const { data } = await apiFetch(server.base, '/api/stats');
    assert.equal(data.cocktails, 2);
    assert.ok(data.filters >= 1);
    assert.equal(data.categories.find((item) => item.category === 'Classics').count, 2);
  });

  test('чужой origin режется, свой проходит', async () => {
    const evil = await fetch(`${server.base}/api/cocktails`, { headers: { Origin: 'https://evil.example' } });
    assert.equal(evil.status, 403);
    const good = await fetch(`${server.base}/api/cocktails`, { headers: { Origin: 'http://localhost:5173' } });
    assert.equal(good.status, 200);
    assert.equal(good.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  });
});
