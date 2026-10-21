/**
 * Одно правило фильтрации на весь фронтенд: и каталог, и админка считают
 * попадание одинаково. Фильтр приходит из /api/filters:
 *   { kind: 'category' | 'ingredient' | 'volume', label, matchValue, threshold }
 */
export const matchesFilter = (cocktail, filter) => {
  if (!filter) return true;
  switch (filter.kind) {
    case 'category':
      return cocktail.iba_category === filter.matchValue;
    case 'ingredient':
      return String(cocktail.composition ?? '')
        .toLowerCase()
        .includes(String(filter.matchValue ?? '').toLowerCase());
    case 'volume':
      return Number(cocktail.volume) > Number(filter.threshold);
    default:
      return true;
  }
};

export const countMatches = (cocktails, filter) =>
  (cocktails ?? []).filter((cocktail) => matchesFilter(cocktail, filter)).length;
