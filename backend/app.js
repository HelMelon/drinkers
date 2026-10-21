import express from 'express';
import cors from 'cors';
import { pool, query } from './db.js';
import { assertAuthConfig, login as issueLogin, requireAuth } from './auth.js';
import { parseImportContent, planImport } from './import-plan.js';
import { toClientError } from './http-error.js';
import { createRateLimiter } from './rate-limit.js';
import { exportFilename, toCsv, toJson } from './export.js';
import { buildSearchQuery, parsePaging } from './search.js';
import { normalizeCocktail } from './normalize.js';

assertAuthConfig();

const app = express();
app.disable('x-powered-by');

// CORS по списку origin из ALLOWED_ORIGINS (запросы без Origin — curl, SSR — пускаем).
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} не разрешён`));
  },
}));

// Лимит на вход: 5 неудачных попыток за 15 минут с одного IP.
const loginLimiter = createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 });

app.use(express.json({ limit: '8mb' }));

const fail = (res, error, code = 500) => res.status(code).json(toClientError(error, code));

// ---------------------------------------------------------------- авторизация
app.post('/api/login', loginLimiter, (req, res) => {
  const token = issueLogin(req.body?.password);
  if (!token) return res.status(401).json({ status: '401', statusText: 'Неверный пароль' });
  loginLimiter.reset(req.ip);
  return res.json({ token });
});

// ------------------------------------------------------------------ напитки
app.get('/api/cocktails', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM cocktails ORDER BY iba_category, name LIMIT 500');
    res.json(rows);
  } catch (error) {
    fail(res, error);
  }
});

// Серверный поиск по каталогу: /api/cocktails/search?filter=&q=&page=&per_page=&sort=
app.get('/api/cocktails/search', async (req, res) => {
  const paging = parsePaging({ page: req.query.page, perPage: req.query.per_page });
  let filter = null;
  const filterId = String(req.query.filter ?? '').trim();
  try {
    if (filterId) {
      const { rows } = await query('SELECT * FROM filters WHERE id = $1', [filterId]);
      if (!rows.length) return res.status(400).json({ status: '400', statusText: 'Фильтр не найден' });
      filter = {
        kind: rows[0].kind,
        matchValue: rows[0].match_value,
        threshold: rows[0].threshold,
      };
    }

    const built = buildSearchQuery({
      filter,
      q: req.query.q,
      sort: req.query.sort,
      page: paging.page,
      perPage: paging.perPage,
    });

    const limitIndex = built.params.length + 1;
    const offsetIndex = built.params.length + 2;
    const [data, totals] = await Promise.all([
      query(
        `SELECT * FROM cocktails ${built.where} ORDER BY ${built.order} LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
        [...built.params, built.perPage, built.offset],
      ),
      query(`SELECT count(*)::int AS total FROM cocktails ${built.where}`, built.params),
    ]);

    const total = totals.rows[0].total;
    return res.json({
      items: data.rows,
      total,
      page: built.page,
      per_page: built.perPage,
      pages: Math.max(1, Math.ceil(total / built.perPage)),
      filter: filterId || null,
      q: String(req.query.q ?? '').trim() || null,
      sort: String(req.query.sort ?? 'name'),
    });
  } catch (error) {
    return fail(res, error);
  }
});

// Случайный коктейль в рамках фильтра — каталог не тянет всю выборку в браузер.
app.get('/api/cocktails/random', async (req, res) => {
  const filterId = String(req.query.filter ?? '').trim();
  try {
    let filter = null;
    if (filterId) {
      const { rows } = await query('SELECT * FROM filters WHERE id = $1', [filterId]);
      if (!rows.length) return res.status(400).json({ status: '400', statusText: 'Фильтр не найден' });
      filter = { kind: rows[0].kind, matchValue: rows[0].match_value, threshold: rows[0].threshold };
    }
    const built = buildSearchQuery({ filter });
    const { rows } = await query(`SELECT * FROM cocktails ${built.where} ORDER BY random() LIMIT 1`, built.params);
    if (!rows.length) return res.status(404).json({ status: '404', statusText: 'Под фильтр ничего не подходит' });
    return res.json(rows[0]);
  } catch (error) {
    return fail(res, error);
  }
});

app.get('/api/cocktails/:id', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM cocktails WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ status: '404', statusText: 'Коктейль не найден' });
    return res.json(rows[0]);
  } catch (error) {
    return fail(res, error);
  }
});

app.post('/api/cocktails', requireAuth, async (req, res) => {
  const parsed = normalizeCocktail(req.body);
  if (!parsed.ok) return res.status(400).json({ status: '400', statusText: parsed.error });
  const { id, name, composition, volume, price, iba_category: category } = parsed.value;
  try {
    const { rows } = await query(
      `INSERT INTO cocktails (id, name, composition, volume, price, iba_category)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, composition = EXCLUDED.composition,
         volume = EXCLUDED.volume, price = EXCLUDED.price, iba_category = EXCLUDED.iba_category
       RETURNING *`,
      [id, name, composition, volume, price, category],
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    return fail(res, error);
  }
});

app.patch('/api/cocktails/:id', requireAuth, async (req, res) => {
  try {
    const { rows: existing } = await query('SELECT * FROM cocktails WHERE id = $1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ status: '404', statusText: 'Коктейль не найден' });
    const merged = normalizeCocktail({ ...existing[0], ...req.body, id: req.params.id });
    if (!merged.ok) return res.status(400).json({ status: '400', statusText: merged.error });
    const { name, composition, volume, price, iba_category: category } = merged.value;
    const { rows } = await query(
      `UPDATE cocktails SET name=$2, composition=$3, volume=$4, price=$5, iba_category=$6
       WHERE id=$1 RETURNING *`,
      [req.params.id, name, composition, volume, price, category],
    );
    return res.json(rows[0]);
  } catch (error) {
    return fail(res, error);
  }
});

app.delete('/api/cocktails/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM cocktails WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ status: '404', statusText: 'Коктейль не найден' });
    return res.json({ status: 200, deleted: req.params.id });
  } catch (error) {
    return fail(res, error);
  }
});

// ------------------------------------------------------------------ фильтры
const FILTER_COLUMNS = 'id, kind, label, match_value AS "matchValue", threshold, sort_order AS "sortOrder"';

app.get('/api/filters', async (req, res) => {
  try {
    // count считается на сервере: каталог листает страницами и не видит всю выборку
    const { rows } = await query(
      `SELECT ${FILTER_COLUMNS},
         (SELECT count(*) FROM cocktails c WHERE
            (f.kind = 'category' AND c.iba_category = f.match_value)
            OR (f.kind = 'ingredient' AND c.composition ILIKE '%' || f.match_value || '%')
            OR (f.kind = 'volume' AND c.volume > f.threshold)
         )::int AS count
       FROM filters f ORDER BY f.kind, f.sort_order, f.label`,
    );
    res.json(rows);
  } catch (error) {
    fail(res, error);
  }
});

const normalizeFilter = (body = {}) => {
  const kind = String(body.kind ?? '').trim();
  if (!['category', 'ingredient', 'volume'].includes(kind)) {
    return { ok: false, error: 'kind: category | ingredient | volume' };
  }
  const label = String(body.label ?? '').trim();
  if (!label) return { ok: false, error: 'нужна подпись фильтра' };
  const threshold = kind === 'volume' ? Math.round(Number(body.threshold)) : null;
  if (kind === 'volume' && !Number.isFinite(threshold)) return { ok: false, error: 'для volume нужен порог' };
  const matchValue = kind === 'volume' ? null : String(body.matchValue ?? '').trim();
  if (kind !== 'volume' && !matchValue) return { ok: false, error: 'нужно значение для сравнения' };
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Math.round(Number(body.sortOrder)) : 0;
  return { ok: true, value: { kind, label, matchValue, threshold, sortOrder } };
};

app.post('/api/filters', requireAuth, async (req, res) => {
  const parsed = normalizeFilter(req.body);
  if (!parsed.ok) return res.status(400).json({ status: '400', statusText: parsed.error });
  const { kind, label, matchValue, threshold, sortOrder } = parsed.value;
  try {
    const { rows } = await query(
      `INSERT INTO filters (id, kind, label, match_value, threshold, sort_order)
       VALUES (md5(random()::text)::uuid::text, $1,$2,$3,$4,$5) RETURNING ${FILTER_COLUMNS}`,
      [kind, label, matchValue, threshold, sortOrder],
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    return fail(res, error);
  }
});

app.patch('/api/filters/:id', requireAuth, async (req, res) => {
  try {
    const { rows: existing } = await query('SELECT * FROM filters WHERE id = $1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ status: '404', statusText: 'Фильтр не найден' });
    const current = existing[0];
    const merged = normalizeFilter({
      kind: current.kind,
      label: req.body?.label ?? current.label,
      matchValue: req.body?.matchValue ?? current.match_value,
      threshold: req.body?.threshold ?? current.threshold,
      sortOrder: req.body?.sortOrder ?? current.sort_order,
    });
    if (!merged.ok) return res.status(400).json({ status: '400', statusText: merged.error });
    const { label, matchValue, threshold, sortOrder } = merged.value;
    const { rows } = await query(
      `UPDATE filters SET label=$2, match_value=$3, threshold=$4, sort_order=$5
       WHERE id=$1 RETURNING ${FILTER_COLUMNS}`,
      [req.params.id, label, matchValue, threshold, sortOrder],
    );
    return res.json(rows[0]);
  } catch (error) {
    return fail(res, error);
  }
});

app.delete('/api/filters/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM filters WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ status: '404', statusText: 'Фильтр не найден' });
    return res.json({ status: 200, deleted: req.params.id });
  } catch (error) {
    return fail(res, error);
  }
});

// ------------------------------------------------------------------ импорт
/**
 * Тело: { format: 'csv'|'json', content: '<текст файла>', mode: 'merge'|'replace' }
 * Файл читает фронтенд (FileReader) и присылает текстом — multipart не нужен.
 */
app.post('/api/import', requireAuth, async (req, res) => {
  const format = String(req.body?.format ?? '').toLowerCase();
  const mode = String(req.body?.mode ?? 'merge').toLowerCase();
  const content = req.body?.content;

  if (!['csv', 'json'].includes(format)) {
    return res.status(400).json({ status: '400', statusText: 'format: csv | json' });
  }
  if (!['merge', 'replace'].includes(mode)) {
    return res.status(400).json({ status: '400', statusText: 'mode: merge | replace' });
  }
  if (typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ status: '400', statusText: 'файл пустой' });
  }

  let rawRows;
  try {
    rawRows = parseImportContent(format, content);
  } catch (error) {
    return res.status(400).json({ status: '400', statusText: `не удалось разобрать файл: ${error.message}` });
  }

  // Сначала проверяем все строки. Для replace любая битая строка — отказ целиком,
  // иначе DELETE успел бы снести каталог.
  const plan = planImport(rawRows, { mode, lineOffset: format === 'csv' ? 2 : 1 });
  if (plan.rejected) {
    return res.status(400).json({
      status: '400',
      statusText: `импорт отменён: ${plan.errors.length} битых строк(и), каталог не изменён`,
      total: plan.total,
      added: 0,
      updated: 0,
      skipped: plan.errors.length,
      errors: plan.errors.slice(0, 50),
    });
  }

  const report = {
    total: plan.total,
    added: 0,
    updated: 0,
    skipped: plan.errors.length,
    errors: plan.errors.slice(0, 50),
  };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (mode === 'replace') await client.query('DELETE FROM cocktails');

    for (const { raw, value } of plan.prepared) {
      const { name, composition, volume, price, iba_category: category } = value;
      let id = value.id;
      // В CSV из экспорта часто нет id: чтобы повторный импорт не плодил дубли,
      // при отсутствии id ищем существующий коктейль по имени (без учёта регистра).
      if (!String(raw?.id ?? '').trim()) {
        const { rows: same } = await client.query('SELECT id FROM cocktails WHERE lower(name) = lower($1) LIMIT 1', [name]);
        if (same.length) id = same[0].id;
      }
      const { rows } = await client.query(
        `INSERT INTO cocktails (id, name, composition, volume, price, iba_category)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, composition = EXCLUDED.composition,
           volume = EXCLUDED.volume, price = EXCLUDED.price, iba_category = EXCLUDED.iba_category
         RETURNING (xmax = 0) AS inserted`,
        [id, name, composition, volume, price, category],
      );
      if (rows[0]?.inserted) report.added += 1;
      else report.updated += 1;
    }

    await client.query('COMMIT');
    return res.json(report);
  } catch (error) {
    await client.query('ROLLBACK');
    return fail(res, error, 500);
  } finally {
    client.release();
  }
});

// ------------------------------------------------------------------- экспорт
app.get('/api/export', requireAuth, async (req, res) => {
  const format = String(req.query.format ?? 'csv').toLowerCase();
  if (!['csv', 'json'].includes(format)) {
    return res.status(400).json({ status: '400', statusText: 'format: csv | json' });
  }
  try {
    const { rows } = await query('SELECT * FROM cocktails ORDER BY iba_category, name');
    const payload = format === 'json' ? toJson(rows) : toCsv(rows);
    res.setHeader('Content-Type', format === 'json' ? 'application/json; charset=utf-8' : 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${exportFilename(format)}"`);
    // BOM нужен только CSV (Excel без него ломает кириллицу); JSON с BOM не парсится частью клиентов
    return res.send(format === 'csv' ? `\uFEFF${payload}` : payload);
  } catch (error) {
    return fail(res, error);
  }
});

// ------------------------------------------------------------------- сводка
app.get('/api/stats', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT iba_category AS category, count(*)::int AS count FROM cocktails GROUP BY 1 ORDER BY 2 DESC',
    );
    const { rows: totals } = await query('SELECT count(*)::int AS cocktails FROM cocktails');
    const { rows: filters } = await query('SELECT count(*)::int AS filters FROM filters');
    return res.json({ cocktails: totals[0].cocktails, filters: filters[0].filters, categories: rows });
  } catch (error) {
    return fail(res, error);
  }
});

app.use('/api', (req, res) => res.status(404).json({ status: '404', statusText: 'Нет такого метода' }));

// Ошибки, выброшенные middleware (например, CORS), — без утечки деталей.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const isCors = /не разрешён/.test(String(error?.message ?? ''));
  return res.status(isCors ? 403 : 500).json(toClientError(error, isCors ? 403 : 500));
});

export default app;
