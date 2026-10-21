import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import AdminView from './src/views/AdminView.vue';
import fixtures from './tests/fixtures.json';

// Мини-API в памяти: проверяем логин, редактирование и переключение вкладок
// без похода в реальный бэкенд (реальный уже покрыт curl-проверками).
const state = {
  cocktails: [],
  filters: [],
  patches: [],
  imports: []
};

beforeAll(() => {
  state.cocktails = structuredClone(fixtures.cocktails);
  state.filters = structuredClone(fixtures.filters);
});

beforeEach(() => {
  localStorage.clear();
  state.patches = [];
  state.imports = [];

  globalThis.fetch = async (url, options = {}) => {
    const path = String(url).replace(/^.*\/api/, '');
    const method = options.method ?? 'GET';
    const body = options.body ? JSON.parse(options.body) : null;
    const json = (payload, status = 200) => ({ ok: status < 400, status, json: async () => payload });

    if (path === '/login') {
      return body?.password === 'admin' ? json({ token: 'test-token' }) : json({ statusText: 'Неверный пароль' }, 401);
    }
    if (path === '/stats') {
      return json({ cocktails: state.cocktails.length, filters: state.filters.length, categories: [] });
    }
    if (path === '/filters') return json(state.filters);
    if (path === '/cocktails' && method === 'GET') return json(state.cocktails);
    if (path.startsWith('/cocktails/') && method === 'PATCH') {
      const id = path.split('/').pop();
      state.patches.push({ id, body });
      const row = state.cocktails.find((c) => c.id === id);
      Object.assign(row, body, { price: [14], volume: Number(body.volume) });
      return json(row);
    }
    if (path.startsWith('/cocktails') && method === 'POST') return json({ id: 'new1', ...body }, 201);
    if (path.startsWith('/cocktails/') && method === 'DELETE') return json({ status: 200 });
    if (path === '/import') {
      state.imports.push(body);
      return json({ total: 1, added: 1, updated: 0, skipped: 0, errors: [] });
    }
    return json({ statusText: 'нет метода' }, 404);
  };
});

const mountAdmin = async () => {
  const w = mount(AdminView);
  await flushPromises();
  return w;
};

const login = async (w, password = 'admin') => {
  await w.find('input[type="password"]').setValue(password);
  await w.find('form.login').trigger('submit');
  await flushPromises();
  await flushPromises();
};

describe('админка', () => {
  it('без токена показывает только форму входа', async () => {
    const w = await mountAdmin();
    expect(w.find('form.login').exists()).toBe(true);
    expect(w.findAll('button.tab').length).toBe(0);
  });

  it('неверный пароль — ошибка, вкладок нет', async () => {
    const w = await mountAdmin();
    await login(w, 'wrong');
    expect(w.text()).toContain('Неверный пароль');
    expect(w.findAll('button.tab').length).toBe(0);
  });

  it('после входа видны вкладки и таблица напитков', async () => {
    const w = await mountAdmin();
    await login(w);
    expect(w.findAll('button.tab').map((b) => b.text())).toEqual(['Напитки', 'Фильтры', 'Импорт']);
    expect(w.findAll('section.editor .row').length).toBeGreaterThan(1);
  });

  it('редактирование напитка уходит в API с новым названием', async () => {
    const w = await mountAdmin();
    await login(w);
    const firstRow = w.findAll('section.editor .row')[1]; // [0] — заголовок
    await firstRow.findAll('button').find((b) => b.text() === '✎').trigger('click');
    const inputs = w.findAll('section.editor .row')[1].findAll('input');
    await inputs[0].setValue('Renamed cocktail');
    await w.findAll('section.editor .row')[1].findAll('button').find((b) => b.text() === '✓').trigger('click');
    await flushPromises();
    expect(state.patches.length).toBe(1);
    expect(state.patches[0].body.name).toBe('Renamed cocktail');
  });

  it('вкладка «Фильтры» показывает фильтры из базы', async () => {
    const w = await mountAdmin();
    await login(w);
    await w.findAll('button.tab').find((b) => b.text() === 'Фильтры').trigger('click');
    await flushPromises();
    for (const filter of state.filters.filter((f) => f.kind === 'category')) {
      expect(w.text()).toContain(filter.label);
    }
  });

  it('вкладка «Импорт» даёт загрузить файл и отправляет его на сервер', async () => {
    const w = await mountAdmin();
    await login(w);
    await w.findAll('button.tab').find((b) => b.text() === 'Импорт').trigger('click');
    await flushPromises();
    expect(w.text()).toContain('Перетащи файл сюда');

    const csv = 'name,composition,volume,price,iba_category\nTest,gin,100,10,Classics\n';
    const file = new File([csv], 'cocktails.csv', { type: 'text/csv' });
    const input = w.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [file] });
    await input.trigger('change');
    // File.text() асинхронный: даём промису дочитать файл
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await flushPromises();

    expect(w.text()).toContain('cocktails.csv');
    await w.findAll('button').find((b) => b.text().includes('Импортировать')).trigger('click');
    await flushPromises();

    expect(state.imports.length).toBe(1);
    expect(state.imports[0].format).toBe('csv');
    expect(state.imports[0].mode).toBe('merge');
    expect(state.imports[0].content).toContain('Test,gin,100,10,Classics');
    expect(w.text()).toContain('добавлено');
  });
});
