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

Нужен PostgreSQL с таблицей `cocktails` (поля рецепта — в `backend/api.js`).

```bash
# 1. переменные окружения
cp backend/.env.example backend/.env      # укажи свой DATABASE_URL

# 2. обе части сразу
./start.sh

# или по отдельности
cd backend  && npm install && npm run prod   # API на http://localhost:4000
cd frontend && npm install && npm run dev    # Vite dev-сервер
```

API отдаёт `GET /cocktails` (первые 50 записей) и маршруты редактирования для админки.
