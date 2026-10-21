# Drinkers — каталог коктейлей

Веб-каталог коктейлей: фильтры по категориям и ингредиентам, карточки рецептов
и админка для редактирования. Фронтенд — Vue 3 SPA, API — Express + PostgreSQL.

## Что умеет

- каталог коктейлей, сгруппированный по категориям
- фильтры по ингредиентам (джин, ром, текила, sour) и по объёму
- карточка коктейля с составом
- админка: вход по паролю, таблица коктейлей, форма редактирования рецепта

## Стек

| Слой | Что используется |
|---|---|
| Frontend | Vue 3 (`<script setup>`), Pinia, Vue Router, Vite |
| Backend | Node.js (ESM), Express, `pg` |
| БД | PostgreSQL, таблица `cocktails` |

Стили — свой CSS с дизайн-токенами в `frontend/src/assets/`, без UI-библиотек.
Иконки фильтров — SVG-компоненты.

## Структура

```
backend/                 # Express API + подключение к PostgreSQL
frontend/src/
  components/            # Header, Cocktail, CategorizedCocktailsBlock, Filters/*
  components/AdminPanel/ # LoginForm, CocktailsTable, EditingCocktailForm
  stores/CocktailsStore.js  # Pinia
  router/index.js
start.sh                 # поднимает бэкенд и фронтенд одной командой
```

## Запуск

Нужен PostgreSQL. Схема и сид лежат в репозитории — руками ничего создавать не надо.

```bash
# 1. переменные окружения
cp backend/.env.example backend/.env      # DATABASE_URL, ADMIN_PASSWORD, ADMIN_SECRET

# 2. схема + фильтры (+ сид каталога, если таблица пустая)
cd backend && npm install && npm run db:init

# 3. обе части сразу
./start.sh

# или по отдельности
cd backend  && npm start                     # API на http://localhost:4000
cd frontend && npm install && npm run dev    # Vite dev-сервер
```

`npm run db:init -- --seed` дополнительно перезаливает все 47 коктейлей из
`backend/seed/cocktails.json` (upsert по id). Без флага сид применяется только
к пустой таблице.

`backend` читает `.env` сам (`node --env-file-if-exists=.env`), экспортировать
переменные вручную не нужно.

### Конфигурация

| Переменная | По умолчанию | Зачем |
|---|---|---|
| `DATABASE_URL` | — | обязательна |
| `ADMIN_PASSWORD` | `admin` (только вне production) | вход в админку |
| `ADMIN_SECRET` | dev-значение | подпись токенов; в production дефолт запрещён |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | CORS-список |
| `NODE_ENV` | — | `production` включает строгие проверки на старте |
| `PORT` | `4000` | порт API |

В `production` API не стартует, если не заданы `ADMIN_PASSWORD` и `ADMIN_SECRET` —
чтобы админка не открылась дефолтным паролем.

Вход ограничен: 5 попыток за 15 минут с одного IP (`429` + `Retry-After`).
Успешный вход сбрасывает счётчик.

API отдаёт `GET /cocktails` (до 500 записей) и маршруты редактирования для админки.

## Админка

Открывается по адресу `/admin` (ссылка `admin` в шапке). Вход по паролю из
`ADMIN_PASSWORD` (по умолчанию `admin` — для локалки; на сервере задать свой
и `ADMIN_SECRET`). Токен живёт 12 часов в `localStorage`, подписывается HMAC.

Три вкладки:

| Вкладка | Что делает |
|---|---|
| **Напитки** | таблица коктейлей: правка любого поля в строке, добавление, удаление |
| **Фильтры** | фильтры каталога живут в таблице `filters`: `category` (сравнение `iba_category`), `ingredient` (подстрока в составе), `volume` (порог в мл). Можно менять подпись, значение, порядок, добавлять и удалять |
| **Импорт** | загрузка CSV/TSV/JSON с предпросмотром и отчётом |

### Импорт файлов

Колонки: `id, name, composition, volume, price, iba_category`.
`id` можно не заполнять — тогда совпадение ищется по названию, повторный импорт
не плодит дубли. Цена — одно или два числа (`14` или `14 20`): домашняя / импортная.

```csv
name,composition,volume,price,iba_category
"Negroni","gin, sweet vermouth, bitter",90,14 20,Unforgettables
```

Режимы: **merge** (обновить совпадающие, добавить новые) и **replace**
(удалить весь каталог и залить только файл). В режиме `replace` файл сначала
проверяется целиком: одна битая строка — импорт отменяется, каталог остаётся
как был. В `merge` валидные строки применяются, битые попадают в отчёт с номером
строки. Файл читается в браузере и уходит на сервер текстом — multipart не нужен,
зависимостей не добавилось.

### Экспорт (бэкап)

Вкладка «Импорт» → «Скачать CSV» / «Скачать JSON». Формат CSV — тот же, что
принимает импорт (цена через пробел), поэтому файл можно залить обратно:

```bash
# токен берём из /api/login, дальше подставляем его в заголовок Authorization
curl -H "Authorization: Bearer <токен из /api/login>" "$API/export?format=csv" -o backup.csv
```

CSV отдаётся с BOM — Excel открывает кириллицу правильно.

### API

| Метод | Путь | Доступ |
|---|---|---|
| `POST` | `/api/login` | — |
| `GET` | `/api/cocktails`, `/api/filters`, `/api/stats` | — |
| `POST/PATCH/DELETE` | `/api/cocktails/:id` | токен |
| `POST/PATCH/DELETE` | `/api/filters/:id` | токен |
| `POST` | `/api/import` | токен |
| `GET` | `/api/export?format=csv\|json` | токен |

### CI

`.github/workflows/ci.yml` — два джоба на каждый push/PR в `main`:

| Джоб | Что делает |
|---|---|
| `backend` | Postgres 16 как service → `npm ci` → `db:init` → юнит-тесты → интеграционные |
| `frontend` | `npm ci` → `eslint` → 17 тестов (фикстуры, без живого API) → `vite build` |

Фронтенд-тесты данные берут из `frontend/tests/fixtures.json` (снимок каталога),
поэтому CI не нужен запущенный API. Интеграционные тесты подключаются к
`TEST_DATABASE_URL` (в CI — service-контейнер).

### Тесты

```bash
cd frontend && npm test        # vitest + jsdom: каталог, состояния, админка (17 тестов)
cd frontend && npm run lint    # eslint (flat config, vue + js)
cd backend  && npm test        # node:test, юнит: лимитер, импорт, экспорт, ошибки (19)
cd backend  && npm run test:db # интеграционные на живом Postgres (14)
cd backend  && npm run test:all
```

Интеграционные тесты работают на отдельной базе `drinkers_test`:

```bash
createdb drinkers_test
DATABASE_URL=postgres://postgres@127.0.0.1:5432/drinkers_test npm run db:init
npm run test:db
```

Своя база задаётся через `TEST_DATABASE_URL`.

Тесты каталога ходят за настоящими данными в запущенный API на `:4000`.
