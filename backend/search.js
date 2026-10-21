/**
 * Построение SQL для серверного поиска/фильтрации каталога.
 * Вынесено отдельно от роутов, чтобы покрывать юнит-тестами без базы:
 * все значения уходят параметрами, конкатенации пользовательских строк нет.
 */

export const SORTS = {
  name: 'name ASC',
  category: 'iba_category ASC, name ASC',
  volume: 'volume DESC, name ASC',
  new: 'name ASC',
};

/** Экранирует спецсимволы LIKE, чтобы `%` и `_` из запроса не расширяли выборку. */
export const escapeLike = (value) => String(value).replace(/[\\%_]/g, (char) => `\\${char}`);

/** Пустая строка / null / undefined из query-строки значат «не задано». */
const toNumber = (value, fallback) => {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? Math.floor(number) : fallback;
};

export const parsePaging = ({ page, perPage } = {}) => {
  const pageNumber = toNumber(page, 1);
  const perPageNumber = toNumber(perPage, 25);
  return {
    page: Math.max(1, pageNumber),
    perPage: Math.min(100, Math.max(1, perPageNumber)),
  };
};

/**
 * @param {{filter?: object|null, q?: string, sort?: string, page?: number, perPage?: number}} options
 * @returns {{where: string, params: Array, order: string, page: number, perPage: number, offset: number}}
 */
export const buildSearchQuery = ({ filter = null, q = '', sort = 'name', page = 1, perPage = 25 } = {}) => {
  const conditions = [];
  const params = [];

  if (filter) {
    if (filter.kind === 'category') {
      params.push(filter.matchValue);
      conditions.push(`iba_category = $${params.length}`);
    } else if (filter.kind === 'ingredient') {
      params.push(`%${escapeLike(filter.matchValue ?? '')}%`);
      conditions.push(`composition ILIKE $${params.length}`);
    } else if (filter.kind === 'volume') {
      params.push(Number(filter.threshold));
      conditions.push(`volume > $${params.length}`);
    }
  }

  const search = String(q ?? '').trim();
  if (search) {
    params.push(`%${escapeLike(search)}%`);
    conditions.push(`(name ILIKE $${params.length} OR composition ILIKE $${params.length})`);
  }

  const paging = parsePaging({ page, perPage });
  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
    order: SORTS[String(sort)] ?? SORTS.name,
    page: paging.page,
    perPage: paging.perPage,
    offset: (paging.page - 1) * paging.perPage,
  };
};
