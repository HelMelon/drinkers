import test from 'node:test';
import assert from 'node:assert/strict';
import { exportFilename, toCsv, toJson } from '../../export.js';

const rows = [
  { id: 'a1', name: 'Negroni', composition: 'gin, sweet vermouth, bitter', volume: 90, price: [14, 20], iba_category: 'Unforgettables' },
  { id: 'a2', name: 'Say "hi"', composition: 'rum; lime', volume: 200, price: [12], iba_category: 'Not categorized' },
];

test('CSV: заголовок и строки в порядке колонок', () => {
  const [header, first] = toCsv(rows).trim().split('\n');
  assert.equal(header, 'id,name,composition,volume,price,iba_category');
  assert.equal(first, 'a1,Negroni,"gin, sweet vermouth, bitter",90,14 20,Unforgettables');
});

test('CSV: кавычки и точки с запятой экранируются', () => {
  const line = toCsv(rows).trim().split('\n')[2];
  assert.ok(line.includes('"Say ""hi"""'), line);
  assert.ok(line.includes('"rum; lime"'), line);
});

test('CSV: цена-массив склеивается пробелом (формат импорта)', () => {
  const line = toCsv(rows).trim().split('\n')[1];
  assert.ok(line.includes(',14 20,'), line);
});

test('CSV оканчивается переводом строки', () => {
  assert.ok(toCsv(rows).endsWith('\n'));
});

test('JSON: только колонки каталога и валидный массив', () => {
  const parsed = JSON.parse(toJson(rows));
  assert.equal(parsed.length, 2);
  assert.deepEqual(Object.keys(parsed[0]), ['id', 'name', 'composition', 'volume', 'price', 'iba_category']);
  assert.deepEqual(parsed[0].price, [14, 20]);
});

test('имя файла с датой', () => {
  const date = new Date('2026-10-21T10:00:00Z');
  assert.equal(exportFilename('csv', date), 'cocktails-2026-10-21.csv');
  assert.equal(exportFilename('json', date), 'cocktails-2026-10-21.json');
  assert.equal(exportFilename('что-то', date), 'cocktails-2026-10-21.csv');
});
