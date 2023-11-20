<script setup>
import Cocktail from './../components/Cocktail.vue';
import useCocktailsStore from '@/stores/CocktailsStore.js';
import {storeToRefs} from 'pinia';
import Filter from '@/components/Filter.vue';
import {ref} from 'vue';

const filter = ref('all');
const cocktailsStore = useCocktailsStore();
cocktailsStore.getCocktails();
const {
  randomized,
  random,
  cocktails,
  favs,
  sour,
  rum,
  gin,
  tequila,
  big,
} = storeToRefs(cocktailsStore);

const clearRandom = () => {
  randomized.value = false;
  // this.filter = 'all';
}
</script>

<template>
  <main>
    <div class="view cocktails">
      <h1>Choose ur death</h1>
      <!--    <Filter />-->
      <div class="random-block">
        <button @click="cocktailsStore.randomaize(filter)" class="random-btn">
          RANDOM
        </button>
        <span @click="clearRandom" class="clear-random">clear random</span>
      </div>
      <div v-if="!randomized">
        <div class="cards-list" v-if="filter === 'all'">
          <div class="card" v-for="cock in cocktails" :key="cock.id">
            <Cocktail :cocktail="cock"/>
          </div>
        </div>
        <div class="cards-list" v-else-if="filter === 'tequila'">
          <div class="card" v-for="cock in tequila" :key="cock.id">
            <Cocktail :cocktail="cock"/>
          </div>
        </div>
        <div class="cards-list" v-else-if="filter === 'gin'">
          <div class="card" v-for="cock in gin" :key="cock.id">
            <Cocktail :cocktail="cock"/>
          </div>
        </div>
        <div class="cards-list" v-else-if="filter === 'big'">
          <div class="card" v-for="cock in big" :key="cock.id">
            <Cocktail :cocktail="cock"/>
          </div>
        </div>
        <div class="cards-list" v-else-if="filter === 'sour'">
          <div class="card" v-for="cock in sour" :key="cock.id">
            <Cocktail :cocktail="cock"/>
          </div>
        </div>
        <div class="cards-list" v-else-if="filter === 'rum'">
          <div class="card" v-for="cock in rum" :key="cock.id">
            <Cocktail :cocktail="cock"/>
          </div>
        </div>
        <div class="cards-list" v-else-if="filter === 'favs'">
          <div class="card" v-for="cock in favs" :key="cock.id">
            <Cocktail :cocktail="cock"/>
          </div>
        </div>
      </div>
      <div v-if="randomized" class="cards-list">
        <div class="card">
          <Cocktail :cocktail="random"/>
        </div>
      </div>
    </div>

  </main>
</template>

<style>
.filter {
  justify-content: center;
}

.filter button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.filter img {
  width: 30px;
  height: 30px;
}

</style>
