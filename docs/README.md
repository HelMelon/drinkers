# Drinkers — каталог коктейлей

Веб-каталог коктейлей с фильтрами, случайным выбором и админкой: рецепты лежат в
PostgreSQL, интерфейс — Vue 3 SPA, API — Express. Проект учебно-портфолийный:
он живёт в GitHub и не разворачивается в интернете.

**Что внутри:** 47 коктейлей (реальные рецепты с ценами), 9 фильтров, три режима
админки (напитки, фильтры, импорт/экспорт), 70 автотестов и CI на GitHub Actions.

---

## Быстрый старт

```bash
# 1. окружение
cp backend/.env.example backend/.env        # DATABASE_URL, ADMIN_PASSWORD, ADMIN_SECRET

# 2. база: схема + фильтры + сид каталога
cd backend && npm install && npm run db:init

# 3. API (http://localhost:4000) и фронтенд (http://localhost:5173) — в двух терминалах
npm start
cd ../frontend && npm install && npm run dev
```

Админка: http://localhost:5173/admin, пароль из `ADMIN_PASSWORD` (по умолчанию `admin`).

---

## Структура репозитория

```
backend/
  app.js            express-приложение (импортируется тестами)
  server.js         точка входа: app.listen
  db.js             пул pg, генератор id
  auth.js           пароль → HMAC-токен, middleware requireAuth
  rate-limit.js     лимит попыток входа (в памяти процесса)
  normalize.js      строка → валидный коктейль (цена, объём)
  csv.js            разбор CSV/TSV без зависимостей
  import-plan.js    двухфазная проверка импорта
  export.js         CSV (с BOM) и JSON
  search.js         построение SQL для фильтров/поиска/пагинации
  http-error.js     безопасные тексты ошибок
  schema.sql        схема + базовые фильтры
  seed/             47 коктейлей
  tests/unit/       29 юнит-тестов (без БД)
  tests/db/         25 интеграционных (реальный Postgres)
frontend/
  src/views/        HomeView (каталог), AdminView (админка), AboutView (заглушка)
  src/components/   карточка, фильтры, блоки админки
  src/stores/       Pinia: каталог, страницы, фильтры, ошибки
  src/api/admin.js  обёртка над API админки + скачивание экспорта
  tests/            фикстуры каталога и мини-эмулятор API для тестов
  *.test.js         16 тестов (vitest + jsdom)
docs/               эта документация
.github/workflows/  CI: Postgres + тесты + линт + сборка
```

---

## Документация

| Файл | О чём |
|---|---|
| [FEATURES.md](FEATURES.md) | что умеет приложение: каталог, фильтры, админка, импорт/экспорт, поведение в крайних случаях |
| [ARCHITECTURE.md](ARCHITECTURE.md) | как устроено: слои, модель данных, контракт API, ключевые решения и почему именно так |
| [ROADMAP.md](ROADMAP.md) | что сделано, что сознательно отложено и что предлагается дальше — с оценками |
| [AUDIT.md](AUDIT.md) | свежий аудит: метрики, безопасность, найденные слабые места |
| [P2-PLAN.md](P2-PLAN.md) | история работ по шагам (P0 → P2) с проверками |

---

## Статус

| Показатель | Значение |
|---|---|
| Тесты | 29 юнит + 25 интеграционных (Postgres) + 16 фронтенд |
| Линт / сборка | eslint 0/0, `vite build` ~200 мс |
| Зависимости | `npm audit`: 0 уязвимостей в обоих пакетах (vite 8, vue 3.5, express 4.22) |
| CI | GitHub Actions: Postgres-сервис, тесты, линт, сборка — на каждый push в `main` |
| Код | ~2 400 строк приложения + ~700 строк тестов |

Подробнее о том, что осталось — [ROADMAP.md](ROADMAP.md).
