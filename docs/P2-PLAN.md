# P2: план по шагам

Порядок важен: CI — это страховка для обновления зависимостей, поэтому тесты
идут первыми. Каждый шаг заканчивается проверкой, без которой дальше не идём.

---

## Шаг 1. Тесты бэкенда на живом Postgres (≈4 ч)

**Проблема сейчас:** 19 тестов проверяют только чистые функции (лимитер, разбор
импорта, формат ошибок, CSV). Ни один не подтверждает, что SQL-запросы и роуты
работают: `api.js` сразу вызывает `app.listen()`, поэтому приложение нельзя
импортировать в тест.

1.1. Разделить `backend/api.js` на два файла:
   - `backend/app.js` — создаёт и настраивает express-приложение, `export default app`;
   - `backend/server.js` — `import app` + `app.listen(PORT)`;
   - `package.json`: `start`/`prod` → `node --env-file-if-exists=.env server.js`.

1.2. `backend/tests/helpers/db.js`: подключение к `drinkers_test`, функции
   `resetTables()` (TRUNCATE cocktails, filters RESTART IDENTITY), `seedFilters()`,
   `insertCocktail()` для фикстур.

1.3. `backend/tests/api.test.js` — интеграционные тесты через `app.listen(0)`
   и `fetch` (без новых зависимостей):
   - `POST /api/login`: верный пароль → токен, неверный → 401;
   - `PATCH /api/cocktails/:id` без токена → 401, с токеном → поле изменилось;
   - `POST /api/import` merge и replace на фикстурах;
   - `GET /api/export` → 401 без токена, CSV с заголовком с токеном;
   - CRUD фильтров: create → GET видит → delete.

1.4. Скрипты: `test` (unit, без БД — быстро), `test:db` (интеграционные,
   `--test-concurrency=1`), `test:all`.

1.5. **Готово, когда:** `npm run test:all` проходит на чистой базе
   (`db:init` на `drinkers_test` → 19 + N тестов зелёные).

---

## Шаг 2. CI на GitHub Actions (≈2 ч)

2.1. **Сначала убрать зависимость фронтенд-тестов от живого API.** Сейчас
   `filters.test.js` и `admin.test.js` ходят на `127.0.0.1:4000` — в CI это упадёт.
   Перенести данные в `frontend/tests/fixtures.json` (47 записей + 9 фильтров) и
   подставлять их в стаб `fetch`. Заодно тесты станут быстрее и детерминированными.

2.2. `.github/workflows/ci.yml`:
   - `services: postgres:16` c `health-cmd: pg_isready`;
   - job `backend`: `npm ci`, `npm run db:init`, `npm run test:all`;
   - job `frontend`: `npm ci`, `npm run lint`, `npm test`, `npm run build`;
   - кэш npm по `package-lock.json`; Node 22 (не 26 — стабильнее для CI).

2.3. Защита: в репозитории включить required check `CI`, запретить прямой пуш в `main`
   (по желанию — правила ветки).

2.4. **Готово, когда:** PR с любым изменением показывает зелёный CI, а специально
   сломанный тест — красный.

---

## Шаг 3. Обновление зависимостей и 44 алерта (≈4–6 ч, рискованный)

Делать по одной группе, после каждой — `npm test`, `npm run build`, `npm run lint`.

3.1. Зафиксировать «до»: `npm outdated`, `npm audit --json > audit-before.json`,
   список алертов: `gh api repos/HelMelon/drinkers/dependabot/alerts`.

3.2. Фронтенд, безопасная группа: `vue 3.3 → 3.5`, `pinia 2 → 3`,
   `vue-router 4 → 4.x latest`, `@vue/test-utils`, `jsdom 25 → 26`. Проверить тесты.

3.3. Фронтенд, сборка: `vite 4 → 7`, `@vitejs/plugin-vue 4 → 5`,
   `vitest 1 → 3`. Vite 7 требует Node ≥20.19 — у нас 26, ок. Возможные правки:
   `vite.config.js` (target), `vitest.config.js` (`environmentOptions` синтаксис не менялся).
   Прогнать `npm run build` и глазами открыть `/` и `/admin`.

3.4. Бэкенд: `express 4 → 5` — мажор с ловушками:
   - `path-to-regexp` v8: шаблоны `*` больше не работают (у нас таких нет),
     `app.use('/api', ...)` для 404 — валиден;
   - асинхронные ошибки в express 5 пробрасываются сами, поэтому `try/catch`
     в роутах можно оставить (не мешает), но `fail()` остаётся нужен;
   - `res.status().send()` и `req.query` — совместимы.
   После апгрейда — интеграционные тесты шага 1.

3.5. Закрыть остатки: `npm audit fix`, обновить `pg`, `cors`. Проверить, что
   `gh api .../dependabot/alerts | jq length` уменьшился до нуля или объяснить,
   какие advisories без фикса.

3.6. **Готово, когда:** тесты зелёные, сборка проходит, `/` и `/admin` работают,
   алертов 0 (или все оставшиеся — «fix not available»), в `CHANGELOG`-заметке
   перечислены мажоры.

---

## Шаг 4. Серверная фильтрация и пагинация (≈6 ч)

4.1. Новый эндпоинт `GET /api/cocktails/search` — старый `/api/cocktails` не трогаем,
   чтобы не ломать админку и тесты.
   Параметры: `filter=<id>`, `q=<поиск по name/composition>`, `page=1`, `per_page=25`,
   `sort=name|category|volume`.
   Ответ: `{items: [...], total: 47, page: 1, per_page: 25, pages: 2}`.

4.2. SQL собирать по строке фильтра из таблицы `filters`:
   - `category` → `iba_category = $n`;
   - `ingredient` → `composition ILIKE '%' || $n || '%'`;
   - `volume` → `volume > $n`;
   всё через параметры, никакой конкатенации значений.

4.3. Индексы: `cocktails(iba_category)` и `lower(name)` уже есть в `schema.sql`;
   для `ILIKE '%…%'` при росте — `CREATE EXTENSION pg_trgm` + GIN-индекс (отдельной
   миграцией, не сразу).

4.4. Фронтенд: `HomeView` переключается на `/search`, показывает «N из M» из `total`
   и кнопку «Показать ещё» (+25). RANDOM — через `?random=1` на том же фильтре,
   чтобы не тянуть всё в браузер.

4.5. Тесты: интеграционные — фильтр+пагинация+поиск дают ожидаемые `total`;
   фронтенд — «Показать ещё» добавляет карточки, счётчик обновляется.

4.6. **Готово, когда:** при 47 записях страница отдаёт 25, `total=47`; фильтр на
   сервере даёт тот же результат, что раньше в браузере.

---

## Шаг 5. Docker и `.env` (≈3 ч)

5.1. `backend/Dockerfile.api`: `node:22-alpine`, `npm ci --omit=dev`,
   `CMD ["node", "server.js"]`, `HEALTHCHECK` на `/api/stats`.

5.2. `Dockerfile.web`: stage 1 — `node:22-alpine` + `npm ci` + `npm run build`;
   stage 2 — `nginx:alpine` + `dist` + `nginx.conf`.

5.3. `nginx.conf`:
   - `location /api/ { proxy_pass http://api:4000; }`
   - `try_files $uri $uri/ /index.html;` ← это же закрывает шаг 6 для Docker-деплоя.

5.4. `docker-compose.yml`: сервисы `db` (postgres:16, volume, healthcheck),
   `api` (`env_file: ./backend/.env`, `depends_on: db healthy`), `web` (порт 8080).
   Отдельный one-off: `docker compose run --rm api npm run db:init`.

5.5. `.dockerignore`: `node_modules`, `dist`, `.pgdata`, `.env`, `*.log`.

5.6. **Готово, когда:** `docker compose up -d --build` → `docker compose run --rm api npm run db:init`
   → `curl localhost:8080/api/cocktails` отдаёт данные, `/admin` открывается,
   перезапуск не теряет базу (volume).

---

## Шаг 6. Rewrite для SPA (≈30 мин, если не сделан в шаге 5)

Нужен только для деплоя статикой. Правило: всё, что не файл и не `/api`, отдаёт
`index.html`.

6.1. Nginx (если фронт отдельно от compose):
```nginx
location / { try_files $uri $uri/ /index.html; }
```

6.2. Netlify — `frontend/public/_redirects`:
```
/*    /index.html   200
```

6.3. Apache — `frontend/public/.htaccess`:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

6.4. **Готово, когда:** прямой заход на `/admin` (и `/admin/`, и `/some/deep/link`)
   отдаёт 200 и приложение, а `/api/cocktails` по-прежнему уходит в API.

---

## Шаг 7. Картинки коктейлей (≈6–8 ч)

Делать последним: это единственная фича, которая меняет схему и добавляет файловое
хранилище.

7.1. Схема: `ALTER TABLE cocktails ADD COLUMN IF NOT EXISTS image_url text;`
   В `schema.sql` — сразу в `CREATE TABLE`. Импорт/экспорт получает новую колонку
   (обратная совместимость: старые файлы без неё читаются как NULL).

7.2. Вариант «минимум» (2 ч): только ссылка. В админке поле `image_url`,
   в карточке `<img loading="lazy" :src="cocktail.image_url">` с заглушкой при ошибке.

7.3. Вариант «загрузка файла» (4–6 ч):
   - эндпоинт `POST /api/uploads` (токен): принимает data-URL/base64, проверяет
     MIME и размер (≤2 МБ), пишет в `backend/uploads/<hash>.<ext>`, отдаёт `/uploads/...`;
   - `app.use('/uploads', express.static(...))`;
   - сжатие — **в браузере** через `canvas` (без нативной зависимости `sharp`),
     максимум 1200 px по длинной стороне;
   - в админке drag&drop в карточке коктейля.

7.4. Фронтенд: карточка с картинкой, `alt` = название, заглушка-иконка, если пусто.

7.5. Тесты: загрузка отклоняет не-картинку и файл >2 МБ; карточка рендерит `img`
   при наличии `image_url` и заглушку без него.

7.6. **Готово, когда:** в админке загрузил фото → оно видно в каталоге → экспорт
   содержит `image_url` → импорт переносит картинки.

---

## Сводка

| Шаг | Что | Оценка | Риск |
|---|---|---|---|
| 1 | Тесты бэкенда на Postgres | 4 ч | низкий |
| 2 | CI (+ фикстуры для фронт-тестов) | 2 ч | низкий |
| 3 | Зависимости, 44 алерта | 4–6 ч | **высокий** (два мажора) |
| 4 | Серверная фильтрация и пагинация | 6 ч | средний (меняет контракт фронта) |
| 5 | Docker + compose | 3 ч | низкий |
| 6 | Rewrite для SPA | 0,5 ч | низкий |
| 7 | Картинки | 6–8 ч | средний (схема + файлы) |

**Итого ≈ 26–30 ч.** Если делать по одному шагу в день — неделя с запасом.

### Рекомендация по порядку

Шаги 1–2 делать вместе (CI без тестов бессмысленен, тесты без CI не запускаются).
Шаг 3 — отдельной веткой, чтобы откат был одним `git revert`. Шаг 4 — только после
зелёного CI, потому что он меняет контракт API. Шаги 5–6 логично объединить: rewrite
всё равно нужен для nginx. Шаг 7 — последним и отдельной веткой.

---

## Статус: шаги 1 и 2 закрыты (21.10.2026)

### Шаг 1 — тесты бэкенда на живом Postgres

- `api.js` разрезан на `app.js` (создаёт express-приложение, `export default app`)
  и `server.js` (только `listen`). `start`/`prod` → `server.js`.
- `backend/tests/unit/` — 19 юнит-тестов (лимитер, импорт, экспорт, ошибки).
- `backend/tests/db/` — 14 интеграционных: приложение поднимается на свободном
  порту (`app.listen(0)`), запросы идут через `fetch`, база `drinkers_test`
  пересоздаётся перед каждым тестом (`TRUNCATE` + `schema.sql`).
  Покрыто: логин (верный/неверный), `401` на закрытых методах, список без токена,
  `PATCH` (в т.ч. 404), создание/удаление, CRUD фильтров, импорт merge/replace,
  экспорт CSV/JSON, отказ на неизвестный формат, `stats`, CORS (403/200).
- Скрипты: `test` (юнит, ~0.2 с), `test:db`, `test:all`.
- Баг, который поймали интеграционные тесты: в отчёте импорта номер строки для
  JSON был сдвинут на 1 (код предполагал CSV-заголовок). Исправлено через
  `lineOffset` (2 для CSV, 1 для JSON).

**Проверка:** `npm run test:all` → `19 passed` + `14 passed`.

### Шаг 2 — CI

- Фронтенд-тесты больше не зависят от живого API: данные в
  `frontend/tests/fixtures.json` (47 коктейлей, 9 фильтров), `filters.test.js`
  и `admin.test.js` читают снимок.
- `.github/workflows/ci.yml`: job `backend` (Postgres 16 service → `npm ci` →
  `db:init` → юнит → интеграционные) и job `frontend` (`npm ci` → `eslint` →
  17 тестов → `vite build`); кэш npm, Node 22, `concurrency` с отменой старых прогонов.
- Полная эмуляция CI локально с нуля: `npm ci` в обоих пакетах (лок-файлы в синхроне),
  затем `db:init` → 19 юнит → 14 интеграционных; `lint` → 17 тестов → сборка 101 КБ.

**Что осталось вручную:** закоммитить и запушить — только после этого GitHub
реально прогонит workflow. В настройках репозитория включить required check `CI`
и запрет прямого пуша в `main`.

---

## Статус: шаг 3 закрыт (21.10.2026)

**Исходно:** 44 открытых алерта Dependabot (14 high) — все в трёх местах:
vite × 22, транзитивные nanoid/postcss/rollup/esbuild, express-стек
(qs, body-parser, express, path-to-regexp, cookie, send, serve-static).

**Три коммита, по одной группе:**

| Коммит | Что | Итог |
|---|---|---|
| `f683dbc` | express 4.18 → **4.22.3**, pg 8.11 → 8.23, cors 2.8.6, `audit fix` | без мажоров; закрыты qs / body-parser / path-to-regexp / cookie / send / serve-static / proxy-addr |
| `3e0e546` | vue 3.3 → **3.5.44**, pinia 2.1 → **2.3.1**, vue-router 4.2 → **4.6.4**, `audit fix` | без мажоров; nanoid / postcss / rollup закрыты |
| `27506b0` | vite 4.5 → **8.3**, plugin-vue 4 → **6**, vitest 1.6 → **5.0**, eslint-plugin-vue 9 → **10** (+ vue-eslint-parser 10, `globals`) | dev-инструменты, связаны через vite — только вместе |

**Проверено после каждого коммита:** 19 юнит + 14 интеграционных (Postgres),
17 фронтенд-тестов, линт 0/0, сборка, `npm audit` — **0 уязвимостей в обоих пакетах**.
CI на GitHub (Node 22) — зелёный на `27506b0`.

**Грабли, которые встретились:**
- `npm install` падает с ERESOLVE, если ставить pinia 2.3 при vue 3.3: pinia 2.3
  требует vue ≥3.5.11. Порядок: сначала vue, потом pinia.
- eslint-plugin-vue 10 нельзя поставить поверх 9-й: конфликт peer'а
  `vue-eslint-parser` 9/10. Решение: `npm uninstall eslint-plugin-vue`, затем установка 10-й.
- plugin-vue 10 больше не подмешивает browser-глобали: `confirm`, `FileReader`
  стали `no-undef`. Заменили ручной список на пакет `globals`.

**Осталось проверить:** Dependabot пересчитывает алерты не мгновенно — после пуша
счётчик может отставать. Локальный `npm audit` в обоих пакетах уже 0.

---

## Статус: шаг 4 закрыт (21.10.2026)

**Новые эндпоинты (старые не тронуты):**

| Метод | Что |
|---|---|
| `GET /api/cocktails/search?filter=&q=&page=&per_page=&sort=` | `{items, total, page, per_page, pages}`; фильтр по id из таблицы `filters`, поиск по имени и составу, сортировка `name / category / volume` |
| `GET /api/cocktails/random?filter=` | случайный коктейль в рамках фильтра (`ORDER BY random()`) |
| `GET /api/filters` | то же плюс `count` — счётчик совпадений считается в SQL |

**SQL собирается в `backend/search.js`**: только параметры, значения фильтра берутся
из строки `filters`; `%` и `_` в поиске экранируются (`escapeLike`), неизвестная
сортировка падает на `name`, `per_page` зажат в 1..100.

**Фронтенд:** страница по 25, кнопка «Показать ещё (N)», счётчик «показано N из M»,
RANDOM через сервер (браузер больше не держит весь каталог). `utils/filters.js`
удалён — дублировать фильтрацию на клиенте больше не нужно.

**Проверено на живом стеке (47 коктейлей):**

- страница 1 → 25 из 47, `pages=2`; страница 2 → 22;
- `filter=Classics` → 11, все `Classics`;
- `q=lime` → 16; `random` → один коктейль;
- счётчики фильтров: Classics 11, Unforgettables 11, New Era 5, Not categorized 20,
  gin 14, tequila 8, rum 10, sour 16, big volume 20 — совпадают с `total` каждого фильтра.

**Тесты:** бэкенд 29 юнит + 25 интеграционных (в т.ч. сверка `count` фильтра с `total`
поиска), фронтенд 16. Линт и сборка — чисто. CI на GitHub — зелёный.

**Осталось из P2:** docker + `.env` (шаг 5), rewrite для SPA (шаг 6), картинки (шаг 7).
