import { parseTable } from './csv.js';
import { normalizeCocktail } from './normalize.js';

/**
 * Разбор содержимого файла импорта. Бросает исключение с понятным текстом,
 * если формат не тот — вызывающая сторона превращает это в 400.
 */
export const parseImportContent = (format, content) => {
  if (format === 'json') {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) throw new Error('JSON должен быть массивом коктейлей');
    return parsed;
  }
  return parseTable(content).rows;
};

/**
 * Двухфазный импорт: сначала проверяем ВСЕ строки, потом пишем в базу.
 *
 * mode = 'replace' — каталог будет очищен, поэтому любая битая строка означает
 * отказ целиком (иначе можно остаться с половиной данных).
 * mode = 'merge'   — валидные строки применяются, битые попадают в отчёт.
 *
 * lineOffset — сдвиг номера строки для отчёта: 2 для CSV (первая строка — заголовок),
 * 1 для JSON (заголовка нет).
 */
export const planImport = (rawRows, { mode = 'merge', lineOffset = 2 } = {}) => {
  const prepared = [];
  const errors = [];

  rawRows.forEach((raw, index) => {
    const parsed = normalizeCocktail(raw);
    if (parsed.ok) {
      prepared.push({ raw, value: parsed.value });
    } else {
      errors.push({
        line: index + lineOffset,
        message: parsed.error,
        name: String(raw?.name ?? ''),
      });
    }
  });

  const rejected = mode === 'replace' && errors.length > 0;

  return {
    prepared: rejected ? [] : prepared,
    errors,
    rejected,
    total: rawRows.length,
  };
};
