/**
 * Экспорт каталога: CSV (для таблиц) и JSON (полный бэкап).
 * Формат цены в CSV — «14 20», тот же, что понимает импорт.
 */
const csvCell = (value) => {
  if (value === null || value === undefined) return '';
  const text = Array.isArray(value) ? value.join(' ') : String(value);
  return /[",;\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const COCKTAIL_COLUMNS = ['id', 'name', 'composition', 'volume', 'price', 'iba_category'];

export const toCsv = (rows, columns = COCKTAIL_COLUMNS) => {
  const header = columns.join(',');
  const body = rows.map((row) => columns.map((column) => csvCell(row[column])).join(','));
  return [header, ...body].join('\n') + '\n';
};

export const toJson = (rows, columns = COCKTAIL_COLUMNS) =>
  JSON.stringify(rows.map((row) => Object.fromEntries(columns.map((column) => [column, row[column]]))), null, 2) + '\n';

export const exportFilename = (format, date = new Date()) => {
  const stamp = date.toISOString().slice(0, 10);
  return `cocktails-${stamp}.${format === 'json' ? 'json' : 'csv'}`;
};
