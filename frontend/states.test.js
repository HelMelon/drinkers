import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia } from 'pinia';
import HomeView from './src/views/HomeView.vue';
import fixtures from './tests/fixtures.json';
import { installFetchStub } from './tests/fakeApi.js';

// Состояния экрана: ошибка API, пустой каталог, пустой результат фильтра.
const emptyCatalog = { cocktails: [], filters: fixtures.filters };

const mountView = async () => {
  const w = mount(HomeView, { global: { plugins: [createPinia()] } });
  await flushPromises();
  await flushPromises();
  return w;
};

beforeEach(() => {
  installFetchStub(fixtures);
});

describe('состояния экрана', () => {
  it('ошибка API: сообщение и кнопка «Повторить»', async () => {
    installFetchStub(fixtures, { fail: true });
    const w = await mountView();
    expect(w.text()).toContain('Не удалось загрузить каталог');
    expect(w.findAll('button').some((b) => b.text() === 'Повторить')).toBe(true);
    expect(w.findAll('.card').length).toBe(0);
  });

  it('пустой каталог подсказывает про импорт', async () => {
    installFetchStub(emptyCatalog);
    const w = await mountView();
    expect(w.text()).toContain('Каталог пуст');
  });

  it('фильтр без совпадений: подсказка и сброс', async () => {
    installFetchStub({
      cocktails: fixtures.cocktails,
      filters: [...fixtures.filters, { id: 'cat-empty', kind: 'category', label: 'Пустая', matchValue: 'Nope', threshold: null, sortOrder: 99, count: 0 }]
    });
    const w = await mountView();
    await w.findAll('button').find((b) => b.text().trim() === 'Пустая').trigger('click');
    await flushPromises();
    expect(w.text()).toContain('ничего не нашлось');
    await w.findAll('span').find((s) => s.text().includes('сбросить фильтр')).trigger('click');
    await flushPromises();
    expect(w.findAll('.card').length).toBeGreaterThan(0);
  });
});
