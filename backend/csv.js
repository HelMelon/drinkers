/**
 * Разбор табличных файлов (CSV / TSV / ;-разделитель) без внешних зависимостей.
 * Поддерживает кавычки, экранированные кавычки (""), переводы строк внутри поля.
 * Возвращает массив объектов; первая строка считается заголовком, если в ней
 * есть слово из EXPECTED_HEADERS.
 */

export const EXPECTED_HEADERS = ['id', 'name', 'composition', 'volume', 'price', 'iba_category'];

const detectDelimiter = (line) => {
  const counts = [
    ['\t', (line.match(/\t/g) || []).length],
    [';', (line.match(/;/g) || []).length],
    [',', (line.match(/,/g) || []).length],
  ].sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
};

const splitRows = (text, delimiter) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
};

export const parseTable = (rawText) => {
  const text = String(rawText || '').replace(/^\uFEFF/, '');
  if (!text.trim()) return { headers: [], rows: [], delimiter: ',' };

  const firstLine = text.split('\n')[0];
  const delimiter = detectDelimiter(firstLine);
  const cells = splitRows(text, delimiter);

  const firstRow = (cells[0] || []).map((cell) => cell.trim().toLowerCase());
  const hasHeader = firstRow.some((cell) => EXPECTED_HEADERS.includes(cell));
  const headers = hasHeader ? firstRow : EXPECTED_HEADERS;
  const dataRows = hasHeader ? cells.slice(1) : cells;

  const rows = dataRows.map((cellsRow) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = (cellsRow[index] ?? '').trim();
    });
    return item;
  });

  return { headers, rows, delimiter, hasHeader };
};
