import {defineStore} from "pinia";

// location.origin уже содержит порт, поэтому нельзя `${location.origin}:4000`.
// Прод и локалка: <protocol>//<hostname>:4000; при необходимости — VITE_API_URL.
const apiBase = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/cocktails$/, '')
  : `${location.protocol}//${location.hostname}:4000/api`;

const useCocktailsStore = defineStore("CocktailsStore", {
  state: () => ({
    // текущая страница каталога (или накопленные страницы после «Показать ещё»)
    cocktails: [],
    total: 0,
    page: 1,
    perPage: 25,
    pages: 1,
    filters: [],
    isLoading: false,
    error: '',
    randomized: false,
    random: {},
    searchUrl: `${apiBase}/cocktails/search`,
    randomUrl: `${apiBase}/cocktails/random`,
    filtersUrl: `${apiBase}/filters`
  }),
  getters: {
    hasMore: (state) => state.page < state.pages
  },
  actions: {
    /**
     * Серверный поиск: фильтрация, поиск по строке и пагинация считаются в SQL.
     * append = true — дозагрузить следующую страницу к текущей выборке.
     */
    async search({filterId = null, q = '', page = 1, append = false} = {}) {
      this.isLoading = true;
      this.error = '';
      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(this.perPage)
        });
        if (filterId) params.set('filter', filterId);
        if (q) params.set('q', q);

        const res = await fetch(`${this.searchUrl}?${params.toString()}`);
        if (!res.ok) throw new Error(`API ответил ${res.status}`);
        const data = await res.json();

        this.cocktails = append ? [...this.cocktails, ...data.items] : data.items;
        this.total = data.total;
        this.page = data.page;
        this.pages = data.pages;
        return data;
      } catch (e) {
        this.error = `Не удалось загрузить каталог: ${e.message}`;
        if (!append) {
          this.cocktails = [];
          this.total = 0;
          this.pages = 1;
        }
        return null;
      } finally {
        this.isLoading = false;
      }
    },
    /** Фильтры живут в базе и правятся в админке; count считается на сервере. */
    async getFilters() {
      try {
        const res = await fetch(this.filtersUrl);
        if (!res.ok) throw new Error(`API ответил ${res.status}`);
        const data = await res.json();
        this.filters = Array.isArray(data) ? data : [];
      } catch (e) {
        this.error = this.error || `Не удалось загрузить фильтры: ${e.message}`;
        this.filters = [];
      }
    },
    /** Случайный коктейль в рамках текущего фильтра — выбирает сервер. */
    async randomize(filterId = null) {
      try {
        const query = filterId ? `?filter=${encodeURIComponent(filterId)}` : '';
        const res = await fetch(`${this.randomUrl}${query}`);
        if (!res.ok) return null;
        this.random = await res.json();
        this.randomized = true;
        return this.random;
      } catch {
        return null;
      }
    },
  },
});

export default useCocktailsStore;
