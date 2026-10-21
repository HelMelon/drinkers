/**
 * Фейковый API для тестов каталога: повторяет контракт реального
 * `/api/cocktails/search` (фильтр + поиск + пагинация), но на фикстурах.
 * Нужен, чтобы тесты не зависели от запущенного бэкенда.
 */
const matchesFilter = (cocktail, filter) => {
  if (!filter) return true;
  if (filter.kind === 'category') return cocktail.iba_category === filter.matchValue;
  if (filter.kind === 'ingredient') {
    return String(cocktail.composition ?? '').toLowerCase().includes(String(filter.matchValue).toLowerCase());
  }
  if (filter.kind === 'volume') return Number(cocktail.volume) > Number(filter.threshold);
  return true;
};

export const searchResponse = (fixtures, url) => {
  const params = new URL(url).searchParams;
  const filterId = params.get('filter');
  const q = String(params.get('q') ?? '').trim().toLowerCase();
  const page = Number(params.get('page') ?? 1);
  const perPage = Number(params.get('per_page') ?? 25);

  const filter = fixtures.filters.find((item) => item.id === filterId) ?? null;
  let items = fixtures.cocktails.filter((cocktail) => matchesFilter(cocktail, filter));
  if (q) {
    items = items.filter((cocktail) =>
      `${cocktail.name} ${cocktail.composition ?? ''}`.toLowerCase().includes(q));
  }

  const total = items.length;
  return {
    items: items.slice((page - 1) * perPage, page * perPage),
    total,
    page,
    per_page: perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
    filter: filterId ?? null,
    q: q || null,
    sort: 'name'
  };
};

export const installFetchStub = (fixtures, {fail = false} = {}) => {
  globalThis.fetch = async (url) => {
    if (fail) throw new Error('network down');
    const target = String(url);
    const json = (body) => ({ok: true, status: 200, json: async () => body});
    if (target.includes('/cocktails/search')) return json(searchResponse(fixtures, target));
    if (target.includes('/cocktails/random')) return json(fixtures.cocktails[0]);
    if (target.includes('/filters')) return json(fixtures.filters);
    return json(fixtures.cocktails);
  };
};
