import test from 'node:test';
import assert from 'node:assert/strict';
import { parseImportContent, planImport } from '../../import-plan.js';

const good = { name: 'Negroni', composition: 'gin, vermouth', volume: '90', price: '14 20', iba_category: 'Unforgettables' };
const broken = { name: '', volume: 'abc' };

test('replace с битой строкой — отказ целиком, ничего не применяется', () => {
  const plan = planImport([good, broken], { mode: 'replace' });
  assert.equal(plan.rejected, true);
  assert.equal(plan.prepared.length, 0, 'при replace нельзя применять часть данных');
  assert.equal(plan.errors.length, 1);
  assert.equal(plan.errors[0].line, 3, 'номер строки с учётом заголовка');
  assert.match(plan.errors[0].message, /название/);
});

test('merge с битой строкой — валидные применяются, битые в отчёт', () => {
  const plan = planImport([good, broken], { mode: 'merge' });
  assert.equal(plan.rejected, false);
  assert.equal(plan.prepared.length, 1);
  assert.equal(plan.prepared[0].value.name, 'Negroni');
  assert.deepEqual(plan.prepared[0].value.price, [14, 20]);
  assert.equal(plan.prepared[0].value.volume, 90);
  assert.equal(plan.errors.length, 1);
});

test('replace без ошибок проходит целиком', () => {
  const plan = planImport([good], { mode: 'replace' });
  assert.equal(plan.rejected, false);
  assert.equal(plan.prepared.length, 1);
});

test('CSV с заголовком разбирается в объекты', () => {
  const csv = 'name,composition,volume,price,iba_category\nNegroni,"gin, vermouth",90,14 20,Unforgettables\n';
  const rows = parseImportContent('csv', csv);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, 'Negroni');
  assert.equal(rows[0].composition, 'gin, vermouth');
});

test('JSON не массив — понятная ошибка', () => {
  assert.throws(() => parseImportContent('json', '{"name":"x"}'), /массивом/);
});
