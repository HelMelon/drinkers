import { newId } from './db.js';

/**
 * Приводит строку из файла/формы к виду таблицы cocktails и валидирует её.
 * Цена в исходных данных — массив (домашняя / импортная), поэтому принимаем:
 *   "14", "14 20", "14|20", "14,20", "[14,20]", "{14,20}" → [14,20]
 */
export const parsePrice = (value) => {
  if (Array.isArray(value)) return value.map((item) => Math.round(Number(item))).filter(Number.isFinite);
  if (value === null || value === undefined || value === '') return [];
  const numbers = String(value)
    .replace(/[[\]{}]/g, ' ')
    .split(/[^0-9.]+/)
    .filter((part) => part !== '')
    .map((part) => Math.round(Number(part)))
    .filter((number) => Number.isFinite(number));
  return numbers;
};

/**
 * @returns {{ok: true, value: object} | {ok: false, error: string}}
 */
export const normalizeCocktail = (input) => {
  const source = input || {};
  const name = String(source.name ?? '').trim();
  if (!name) return { ok: false, error: 'пустое название' };

  const volume = Number(String(source.volume ?? '').replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(volume) || volume <= 0) return { ok: false, error: 'объём должен быть числом' };

  const price = parsePrice(source.price);
  const category = String(source.iba_category ?? '').trim() || 'Not categorized';

  return {
    ok: true,
    value: {
      id: String(source.id ?? '').trim() || newId(),
      name,
      composition: String(source.composition ?? '').trim() || null,
      volume: Math.round(volume),
      price,
      iba_category: category,
    },
  };
};
