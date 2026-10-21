# frontend

Vue 3 SPA каталога коктейлей: страницы каталога и админки, Pinia-сторы, компоненты
фильтров и импорта.

Полное описание проекта — в [корневом README](../README.md) и в [`docs/`](../docs/):

- [возможности](../docs/FEATURES.md) — что умеют каталог и админка;
- [архитектура](../docs/ARCHITECTURE.md) — слои, контракт API, решения;
- [план развития](../docs/ROADMAP.md) и [аудит](../docs/AUDIT.md).

```bash
npm install
npm run dev     # http://localhost:5173, API ожидается на :4000
npm run lint
npm test        # vitest + jsdom, фикстуры — без живого API
npm run build
```

Структура:

```
src/views/        HomeView (каталог), AdminView (админка), AboutView (заглушка)
src/components/   Cocktail, FiltersBar, admin/{CocktailsEditor,FiltersEditor,ImportPanel}
src/stores/       CocktailsStore: страницы, фильтры, ошибки, random
src/api/admin.js  авторизация админки, запросы, скачивание экспорта
tests/            fixtures.json (снимок каталога) и fakeApi.js (эмулятор /search)
```
