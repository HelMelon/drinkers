import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchQuery, escapeLike, parsePaging, SORTS } from '../../search.js';

test('без фильтра и запроса — пустой WHERE и сортировка по имени', () => {
  const built = buildSearchQuery({});
  assert.equal(built.where, '');
  assert.equal(built.order, SORTS.name);
  assert.deepEqual(built.params, []);
});

test('фильтр категории — точное сравнение', () => {
  const built = buildSearchQuery({ filter: { kind: 'category', matchValue: 'Classics' } });
  assert.equal(built.where, 'WHERE iba_category = $1');
  assert.deepEqual(built.params, ['Classics']);
});

test('фильтр ингредиента — ILIKE с экранированием', () => {
  const built = buildSearchQuery({ filter: { kind: 'ingredient', matchValue: 'gin' } });
  assert.equal(built.where, 'WHERE composition ILIKE $1');
  assert.deepEqual(built.params, ['%gin%']);
});

test('фильтр объёма — порог как число', () => {
  const built = buildSearchQuery({ filter: { kind: 'volume', threshold: 150 } });
  assert.equal(built.where, 'WHERE volume > $1');
  assert.deepEqual(built.params, [150]);
});

test('фильтр + поиск: два условия, порядок параметров стабилен', () => {
  const built = buildSearchQuery({
    filter: { kind: 'category', matchValue: 'Classics' },
    q: 'lime',
  });
  assert.equal(built.where, 'WHERE iba_category = $1 AND (name ILIKE $2 OR composition ILIKE $2)');
  assert.deepEqual(built.params, ['Classics', '%lime%']);
});

test('escapeLike нейтрализует % _ и обратный слэш', () => {
  assert.equal(escapeLike('100%_x'), '100\\%\\_x');
  assert.equal(escapeLike('a\\b'), 'a\\\\b');
});

test('поиск с пустой строкой не добавляет условие', () => {
  const built = buildSearchQuery({ q: '   ' });
  assert.equal(built.where, '');
});

test('пагинация: границы и значения по умолчанию', () => {
  assert.deepEqual(parsePaging({}), { page: 1, perPage: 25 });
  assert.deepEqual(parsePaging({ page: 0, perPage: 0 }), { page: 1, perPage: 1 });
  assert.deepEqual(parsePaging({ page: -5, perPage: 500 }), { page: 1, perPage: 100 });
  assert.deepEqual(parsePaging({ page: '3', perPage: '10' }), { page: 3, perPage: 10 });
  assert.deepEqual(parsePaging({ page: 'abc', perPage: null }), { page: 1, perPage: 25 });
});

test('offset считается от страницы', () => {
  const built = buildSearchQuery({ page: 3, perPage: 10 });
  assert.equal(built.offset, 20);
});

test('неизвестная сортировка падает на имя', () => {
  const built = buildSearchQuery({ sort: 'price; DROP TABLE cocktails' });
  assert.equal(built.order, SORTS.name);
});
