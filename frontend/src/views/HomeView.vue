<script setup>
import {computed, onMounted, ref} from 'vue';
import useCocktailsStore from './../stores/CocktailsStore.js';
import {storeToRefs} from 'pinia';
import CategorizedCocktailsBlock from "../components/CategorizedCocktailsBlock.vue";
import Cocktail from "../components/Cocktail.vue";
import FiltersBar from "../components/FiltersBar.vue";

const cocktailsStore = useCocktailsStore();
const {randomized, random, cocktails, filters, isLoading, error, total, page, pages, hasMore} =
  storeToRefs(cocktailsStore);

// Фильтрация, поиск и пагинация — на сервере (SQL). Каталог только просит страницу.
onMounted(() => {
  cocktailsStore.getFilters();
  cocktailsStore.search();
});

// Набор фильтров приходит из базы (см. админку), count для подсказок уже посчитан.
const categories = computed(() => filters.value.filter((filter) => filter.kind === 'category'));
const ingredients = computed(() => filters.value.filter((filter) => filter.kind !== 'category'));
const counts = computed(() => Object.fromEntries(filters.value.map((filter) => [filter.id, filter.count ?? 0])));

const activeFilter = ref(null);

/** Сколько уже показано из найденного. */
const shown = computed(() => cocktails.value.length);

const chooseFilter = (filter) => {
  activeFilter.value = activeFilter.value?.id === filter.id ? null : filter;
  cocktailsStore.search({filterId: activeFilter.value?.id ?? null});
};

/** Догрузить следующую страницу к текущей выборке. */
const loadMore = () => {
  cocktailsStore.search({filterId: activeFilter.value?.id ?? null, page: page.value + 1, append: true});
};

const clear = () => {
  randomized.value = false;
  activeFilter.value = null;
  cocktailsStore.search();
};

const reload = () => {
  cocktailsStore.getFilters();
  cocktailsStore.search({filterId: activeFilter.value?.id ?? null});
};

const pickRandom = () => cocktailsStore.randomize(activeFilter.value?.id ?? null);
</script>

<template>
  <main>
    <div class="view cocktails">
      <h1>Choose ur death</h1>
      <hr>
      <FiltersBar
        v-if="!randomized && !error"
        :categories="categories"
        :ingredients="ingredients"
        :active="activeFilter"
        :counts="counts"
        @choose="chooseFilter"
      />

      <p v-if="isLoading && !cocktails.length" class="state">Загружаю каталог…</p>

      <div v-else-if="error" class="state error">
        <p>{{ error }}</p>
        <button class="btn" @click="reload">Повторить</button>
      </div>

      <p v-if="!error && total" class="filter-summary">
        <template v-if="activeFilter">фильтр «{{ activeFilter.label }}» — </template>
        показано {{ shown }} из {{ total }}
        <span v-if="activeFilter" class="clear-random" @click="clear">сбросить</span>
      </p>

      <p v-if="!isLoading && !error && !total" class="state empty">
        {{ activeFilter ? `Под фильтр «${activeFilter.label}» ничего не нашлось.` : 'Каталог пуст. Залейте данные через админку — вкладка «Импорт».' }}
        <span v-if="activeFilter" class="clear-random" @click="clear">сбросить фильтр</span>
      </p>

      <div class="random-block">
        <button class="btn" :disabled="!total" @click="pickRandom">RANDOM</button>
        <span class="clear-random" @click="clear">clear random/filters</span>
      </div>
      <CategorizedCocktailsBlock v-if="!randomized && cocktails.length" :chosen="cocktails" />
      <div class="cards-list">
        <Cocktail v-if="randomized" :cocktail="random" :alco="'domestic'" />
      </div>

      <p v-if="!randomized && hasMore" class="state more">
        <button class="btn" :disabled="isLoading" @click="loadMore">
          {{ isLoading ? 'Загружаю…' : `Показать ещё (${total - shown})` }}
        </button>
        <span class="pages">страница {{ page }} из {{ pages }}</span>
      </p>
    </div>
  </main>
</template>

<style>
hr {
  width: 30%;
  text-align: center;
  margin: 0 auto 30px;
  border-width: 2px;
}

.state {
  text-align: center;
  opacity: .8;
  margin: 18px 0;
}

.state.error {
  color: #b3423a;
}

.state.error p {
  margin: 0 0 10px;
}

.state.empty {
  opacity: .6;
}

.state.more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: 22px;
}

.state.more .pages {
  font-size: 13px;
  opacity: .6;
}
</style>
