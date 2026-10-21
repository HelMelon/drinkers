import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia } from 'pinia';
import HomeView from './src/views/HomeView.vue';

// Здесь проверяем именно состояния экрана: загрузка, ошибка API, пустой каталог,
// пустой результат фильтра. Данные — стабы, чтобы не зависеть от бэкенда.
const filters = [
  {id: 'cat-classics', kind: 'category', label: 'Classics', matchValue: 'Classics', threshold: null, sortOrder: 1},
  {id: 'cat-empty', kind: 'category', label: 'Пустая категория', matchValue: 'Nope', threshold: null, sortOrder: 2}
];

const cocktail = (name, category = 'Classics') => ({
  id: name.toLowerCase(), name, composition: 'gin, lime', volume: 100, price: [10], iba_category: category
});

const stubFetch = ({cocktails = [], fail = false} = {}) => {
  globalThis.fetch = async (url) => {
    if (fail) throw new Error('network down');
    const body = String(url).includes('/filters') ? filters : cocktails;
    return {ok: true, status: 200, json: async () => body};
  };
};

const mountView = async () => {
  const w = mount(HomeView, {global: {plugins: [createPinia()]}});
  await flushPromises();
  await flushPromises();
  return w;
};

beforeEach(() => {
  globalThis.fetch = undefined;
});

describe('состояния экрана', () => {
  it('ошибка API: сообщение и кнопка «Повторить»', async () => {
    stubFetch({fail: true});
    const w = await mountView();
    expect(w.text()).toContain('Не удалось загрузить каталог');
    const retry = w.findAll('button').find((b) => b.text() === 'Повторить');
    expect(retry).toBeTruthy();
    expect(w.findAll('.card').length).toBe(0);
  });

  it('пустой каталог: подсказка про импорт', async () => {
    stubFetch({cocktails: []});
    const w = await mountView();
    expect(w.text()).toContain('Каталог пуст');
    expect(w.text()).not.toContain('ничего не нашлось');
  });

  it('пустой результат фильтра: подсказка со сбросом', async () => {
    stubFetch({cocktails: [cocktail('Negroni')]});
    const w = await mountView();
    await w.findAll('button').find((b) => b.text().trim() === 'Пустая категория').trigger('click');
    await flushPromises();
    expect(w.text()).toContain('ничего не нашлось');
    expect(w.findAll('.card').length).toBe(0);
  });

  it('сброс фильтра возвращает карточки', async () => {
    stubFetch({cocktails: [cocktail('Negroni'), cocktail('Manhattan')]});
    const w = await mountView();
    await w.findAll('button').find((b) => b.text().trim() === 'Пустая категория').trigger('click');
    await flushPromises();
    await w.findAll('span').find((s) => s.text().includes('сбросить фильтр'))?.trigger('click');
    await flushPromises();
    expect(w.findAll('.card').length).toBeGreaterThan(0);
  });

  it('у активного фильтра aria-pressed=true', async () => {
    stubFetch({cocktails: [cocktail('Negroni')]});
    const w = await mountView();
    const chip = w.findAll('button').find((b) => b.text().trim() === 'Classics');
    expect(chip.attributes('aria-pressed')).toBe('false');
    await chip.trigger('click');
    await flushPromises();
    expect(w.findAll('button').find((b) => b.text().trim() === 'Classics').attributes('aria-pressed')).toBe('true');
  });
});
