import {defineStore} from "pinia";

// location.origin уже содержит порт, поэтому нельзя `${location.origin}:4000`.
// Прод и локалка: <protocol>//<hostname>:4000; при необходимости — VITE_API_URL.
const apiBase = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/cocktails$/, '')
  : `${location.protocol}//${location.hostname}:4000/api`;

const useCocktailsStore = defineStore("CocktailsStore", {
  state: () => ({
    cocktails: [],
    filters: [],
    isLoading: false,
    error: '',
    randomized: false,
    random: {},
    apiUrl: `${apiBase}/cocktails`,
    filtersUrl: `${apiBase}/filters`
  }),
  actions: {
    async getCocktails() {
      this.isLoading = true;
      this.error = '';
      try {
        const res = await fetch(this.apiUrl);
        if (!res.ok) throw new Error(`API ответил ${res.status}`);
        const data = await res.json();
        this.cocktails = Array.isArray(data) ? data : [];
      } catch (e) {
        this.error = `Не удалось загрузить каталог: ${e.message}`;
        this.cocktails = [];
      } finally {
        this.isLoading = false;
      }
    },
    /** Фильтры живут в базе и правятся в админке — каталог просто рисует их. */
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
    randomaize(chosen) {
      const list = Array.isArray(chosen) ? chosen : [];
      if (!list.length) return;
      this.random = list[Math.floor(Math.random() * list.length)];
      this.randomized = true;
    },
  },
});

export default useCocktailsStore;
