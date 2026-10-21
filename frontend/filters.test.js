import { describe, it, expect, beforeAll } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia } from 'pinia';
import HomeView from './src/views/HomeView.vue';
import fixtures from './tests/fixtures.json';

// Данные — снимок реального каталога (tests/fixtures.json), без живого API:
// тесты работают и локально, и в CI.
const real = fixtures.cocktails;
const filters = fixtures.filters;

beforeAll(() => {
  globalThis.fetch = async (url) => {
    const body = String(url).includes('/filters') ? filters : real;
    return {ok: true, status: 200, json: async () => body};
  };
});

const mountView = async () => {
  const w = mount(HomeView, { global: { plugins: [createPinia()] } });
  await flushPromises();
  await flushPromises();
  return w;
};

const cards = (w) => w.findAll('.card').length;
const buttonByText = (w, text) => w.findAll('button').find((b) => b.text().trim() === text);
// кнопки-иконки содержат ещё и подсказку с числом («big volume · 12»)
const buttonContains = (w, text) => w.findAll('button').find((b) => b.text().includes(text));

describe('каталог: фильтры из базы', () => {
  it('после загрузки показывает все коктейли', async () => {
    const w = await mountView();
    expect(real.length).toBeGreaterThan(40);
    expect(cards(w)).toBe(real.length);
  });

  it('кнопки фильтров нарисованы из /api/filters', async () => {
    const w = await mountView();
    const categoryFilters = filters.filter((f) => f.kind === 'category');
    expect(categoryFilters.length).toBeGreaterThan(0);
    for (const filter of categoryFilters) {
      expect(buttonByText(w, filter.label)).toBeTruthy();
    }
  });

  it('Classics фильтрует по категории', async () => {
    const w = await mountView();
    await buttonByText(w, 'Classics').trigger('click');
    await flushPromises();
    const expected = real.filter((c) => c.iba_category === 'Classics').length;
    expect(cards(w)).toBe(expected);
  });

  it('второй фильтр не обнуляет список (нет накопления)', async () => {
    const w = await mountView();
    await buttonByText(w, 'Classics').trigger('click');
    await flushPromises();
    await buttonByText(w, 'Unforgettables').trigger('click');
    await flushPromises();
    const expected = real.filter((c) => c.iba_category === 'Unforgettables').length;
    expect(cards(w)).toBe(expected);
  });

  it('повторный клик снимает фильтр', async () => {
    const w = await mountView();
    await buttonByText(w, 'Classics').trigger('click');
    await flushPromises();
    await buttonByText(w, 'Classics').trigger('click');
    await flushPromises();
    expect(cards(w)).toBe(real.length);
  });

  it('volume-фильтр считает по порогу из базы', async () => {
    const w = await mountView();
    const volumeFilter = filters.find((f) => f.kind === 'volume');
    await buttonContains(w, volumeFilter.label).trigger('click');
    await flushPromises();
    const expected = real.filter((c) => c.volume > volumeFilter.threshold).length;
    expect(cards(w)).toBe(expected);
  });
});
