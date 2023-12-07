<script setup>
import useCocktailsStore from './../stores/CocktailsStore.js';
import {storeToRefs} from 'pinia';
import CategorizedCocktailsBlock from "../components/CategorizedCocktailsBlock.vue";
import Cocktail from "../components/Cocktail.vue";
import Ingredients from '../components/Filters/Ingredients.vue'

const cocktailsStore = useCocktailsStore();
cocktailsStore.getCocktails();
const {
  randomized,
  random,
  cocktails, classics, unforgettables, new_era, gin, rum, tequila, big, sour
} = storeToRefs(cocktailsStore);

const clear = () => {
  randomized.value = false;
  chosen.value = cocktails.value;
  isIngredients.value = false;
  isCategories.value = false;
}
import Categories from "../components/Filters/Categories.vue";
import {ref} from 'vue';

let chosen = ref(cocktails.value);
let isIngredients = ref(false);
let isCategories = ref(false);

const chooseFilter = (filter) => {
  switch (filter) {
    case 'classics':
      chosen.value = classics.value;
      isCategories.value = true;
      break;
    case 'unforgettables':
      chosen.value = unforgettables.value;
      isCategories.value = true;
      break;
    case 'new_era':
      chosen.value = new_era.value
      isCategories.value = true;
      break;
    case 'gin':
      chosen.value = gin.value
      isIngredients.value = true;
      break;
    case 'rum':
      chosen.value = rum.value
      isIngredients.value = true;
      break;
    case 'tequila':
      chosen.value = tequila.value
      isIngredients.value = true;
      break;
    case 'sour':
      chosen.value = sour.value
      isIngredients.value = true;
      break;
    case 'big':
      chosen.value = big.value
      isIngredients.value = true;
      break;
    default:
      chosen.value = cocktails.value
      break;
  }
  return {isIngredients, isCategories, chosen};
}
</script>

<template>
  <main>
    <div class="view cocktails">
      <h1>Choose ur death</h1>
      <hr>
      <div class="desktop">
        <Categories v-if="!isIngredients" @filterate="chooseFilter"/>
        <Ingredients v-if="!isCategories" @filterate="chooseFilter"/>
      </div>
      <div class="mobile">
        <div class="burger-menu">
          <input id="menu-toggle" type="checkbox"/>
          <label class="menu-btn" for="menu-toggle">
            <span></span>
          </label>
          <nav class="nav-mobile menubox">
            <Categories v-if="!isIngredients" @filterate="chooseFilter"/>
            <Ingredients v-if="!isCategories" @filterate="chooseFilter"/>
          </nav>
        </div>
        <div class="random-block">
          <button @click="cocktailsStore.randomaize(chosen)" class="btn">
            RANDOM
          </button>
          <span @click="clear" class="clear-random">clear random/filters</span>
        </div>
      </div>
      <CategorizedCocktailsBlock v-if="!randomized" :chosen="chosen"/>
      <Cocktail v-if="randomized" :cocktail="random"/>
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

@media (min-width: 1024px) {
  .burger-menu {
    display: none;
  }
}

@media (max-width: 1024px) {
  .burger-menu {
    display: block;
  }
}

.burger-menu {
  width: 30px;
  position: relative;
}

.menu-btn {
  display: flex;
  align-items: center;
  position: absolute;
  top: 0;
  right: 0;
  width: 30px;
  height: 30px;
  cursor: pointer;
  z-index: 1;
}

.menu-btn > span,
.menu-btn > span::before,
.menu-btn > span::after {
  display: block;
  position: absolute;
  width: 100%;
  height: 2px;
  transition-duration: 0.25s;
}

.menu-btn > span::before {
  content: '';
  top: -8px;
}

.menu-btn > span::after {
  content: 'filter';
  top: 8px;
}

.menubox {
  z-index: 100;
  display: block;
  position: fixed;
  visibility: hidden;
  top: 0;
  right: -100%;
  width: 300px;
  height: 100%;
  margin: 0;
  padding: 50px 25px;
  list-style: none;
  transition-duration: 0.25s;
}

#menu-toggle {
  opacity: 0;
}

#menu-toggle:checked ~ .menu-btn > span {
  transform: rotate(45deg);
}

#menu-toggle:checked ~ .menu-btn > span::before {
  top: 0;
  transform: rotate(0);
}

#menu-toggle:checked ~ .menu-btn > span::after {
  top: 0;
  transform: rotate(90deg);
}

#menu-toggle:checked ~ .menubox {
  visibility: visible;
  right: 0;
}

@media (max-width: 320px) {
  .menubox {
    width: 100%;
    text-align: center;
  }
}
</style>
