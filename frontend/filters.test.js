import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia } from 'pinia';
import HomeView from './src/views/HomeView.vue';
import fixtures from './tests/fixtures.json';
import { installFetchStub } from './tests/fakeApi.js';

// Каталог работает через серверный поиск: страница по 25, фильтр и пагинация в SQL.
// Фикстуры повторяют контракт API, поэтому тесты не зависят от живого бэкенда.
const PER_PAGE = 25;

const mountView = async () => {
  const w = mount(HomeView, { global: { plugins: [createPinia()] } });
  await flushPromises();
  await flushPromises();
  return w;
};

const cards = (w) => w.findAll('.card').length;
const buttonByText = (w, text) => w.findAll('button').find((b) => b.text().trim() === text);

beforeEach(() => {
  installFetchStub(fixtures);
});

describe('каталог: серверный поиск по страницам', () => {
  it('первая страница — не больше 25 карточек и счётчик «из 47»', async () => {
    const w = await mountView();
    expect(fixtures.cocktails.length).toBe(47);
    expect(cards(w)).toBe(PER_PAGE);
    expect(w.text()).toContain(`показано ${PER_PAGE} из 47`);
  });

  it('«Показать ещё» догружает остаток', async () => {
    const w = await mountView();
    const more = w.findAll('button').find((b) => b.text().includes('Показать ещё'));
    expect(more).toBeTruthy();
    await more.trigger('click');
    await flushPromises();
    expect(cards(w)).toBe(47);
    expect(w.findAll('button').some((b) => b.text().includes('Показать ещё'))).toBe(false);
  });

  it('фильтр по категории перезапрашивает страницу', async () => {
    const w = await mountView();
    await buttonByText(w, 'Classics').trigger('click');
    await flushPromises();
    const expected = fixtures.cocktails.filter((c) => c.iba_category === 'Classics').length;
    expect(cards(w)).toBe(expected);
    expect(w.text()).toContain(`из ${expected}`);
  });

  it('второй фильтр не накапливается на первый', async () => {
    const w = await mountView();
    await buttonByText(w, 'Classics').trigger('click');
    await flushPromises();
    await buttonByText(w, 'Unforgettables').trigger('click');
    await flushPromises();
    const expected = fixtures.cocktails.filter((c) => c.iba_category === 'Unforgettables').length;
    expect(cards(w)).toBe(expected);
  });

  it('повторный клик по активному фильтру возвращает весь каталог', async () => {
    const w = await mountView();
    await buttonByText(w, 'Classics').trigger('click');
    await flushPromises();
    await buttonByText(w, 'Classics').trigger('click');
    await flushPromises();
    expect(w.text()).toContain('показано 25 из 47');
  });

  it('фильтр по объёму считает по порогу из базы', async () => {
    const w = await mountView();
    const volumeFilter = fixtures.filters.find((f) => f.kind === 'volume');
    await w.findAll('button').find((b) => b.text().includes(volumeFilter.label)).trigger('click');
    await flushPromises();
    const expected = fixtures.cocktails.filter((c) => c.volume > volumeFilter.threshold).length;
    expect(cards(w)).toBe(Math.min(expected, PER_PAGE));
  });

  it('кнопки фильтров рисуются из /api/filters и несут aria-pressed', async () => {
    const w = await mountView();
    const chip = buttonByText(w, 'Classics');
    expect(chip.attributes('aria-pressed')).toBe('false');
    await chip.trigger('click');
    await flushPromises();
    expect(buttonByText(w, 'Classics').attributes('aria-pressed')).toBe('true');
  });
});
