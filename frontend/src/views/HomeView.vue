<script setup>
import {computed, ref} from 'vue';
import useCocktailsStore from './../stores/CocktailsStore.js';
import {storeToRefs} from 'pinia';
import CategorizedCocktailsBlock from "../components/CategorizedCocktailsBlock.vue";
import Cocktail from "../components/Cocktail.vue";
import FiltersBar from "../components/FiltersBar.vue";
import {countMatches, matchesFilter} from "../utils/filters.js";

const cocktailsStore = useCocktailsStore();
cocktailsStore.getCocktails();
cocktailsStore.getFilters();

const {randomized, random, cocktails, filters, isLoading, error} = storeToRefs(cocktailsStore);

// Набор фильтров приходит из базы (см. админку) — каталог только рисует его.
const categories = computed(() => filters.value.filter((filter) => filter.kind === 'category'));
const ingredients = computed(() => filters.value.filter((filter) => filter.kind !== 'category'));

// Выбранный фильтр — объект из API; null — весь каталог.
// Список считается ИЗ полного списка, в стор ничего не пишется (иначе фильтры
// накапливались бы и второй клик давал пустой экран).
const activeFilter = ref(null);

const chosen = computed(() => (cocktails.value ?? []).filter((cocktail) => matchesFilter(cocktail, activeFilter.value)));

// счётчики для подсказок: сколько коктейлей попадёт под каждый фильтр
const counts = computed(() => Object.fromEntries(
  filters.value.map((filter) => [filter.id, countMatches(cocktails.value, filter)])
));

const chooseFilter = (filter) => {
  activeFilter.value = activeFilter.value?.id === filter.id ? null : filter;
};

const clear = () => {
  randomized.value = false;
  activeFilter.value = null;
}

/** Повторная загрузка после ошибки API. */
const reload = () => {
  cocktailsStore.getCocktails();
  cocktailsStore.getFilters();
}
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

      <p v-if="isLoading" class="state">Загружаю каталог…</p>

      <div v-else-if="error" class="state error">
        <p>{{ error }}</p>
        <button class="btn" @click="reload">Повторить</button>
      </div>

      <p v-if="activeFilter && !error" class="filter-summary">
        фильтр «{{ activeFilter.label }}» — {{ chosen.length }} из {{ cocktails.length }}
        <span class="clear-random" @click="clear">сбросить</span>
      </p>

      <p v-if="!isLoading && !error && !cocktails.length" class="state empty">
        Каталог пуст. Залейте данные через админку — вкладка «Импорт».
      </p>

      <p v-if="!isLoading && !error && cocktails.length && !chosen.length" class="state empty">
        Под фильтр «{{ activeFilter?.label }}» ничего не нашлось.
        <span class="clear-random" @click="clear">сбросить фильтр</span>
      </p>

      <div class="random-block">
        <button class="btn" :disabled="!chosen.length" @click="cocktailsStore.randomaize(chosen)">
          RANDOM
        </button>
        <span class="clear-random" @click="clear">clear random/filters</span>
      </div>
      <CategorizedCocktailsBlock v-if="!randomized && chosen.length" :chosen="chosen" />
      <div class="cards-list">
        <Cocktail v-if="randomized" :cocktail="random" :alco="'domestic'" />
      </div>
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
</style>
