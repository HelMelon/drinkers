<template>
  <h3>{{ cocktail.name }}</h3>

  <span style="display: block">{{ cocktail.composition }}</span>
  <div class="price" v-if="cocktail.price > 15">
    expensive {{ cocktail.price[0] }} ryb
  </div>
  <div class="volume">{{ cocktail.volume }} ml</div>
</template>

<script>
import useCocktailsStore from '@/stores/CocktailsStore.js';
import { storeToRefs } from 'pinia';
export default {
  props: ['cocktail'],
  setup() {
    const cocktailsStore = useCocktailsStore();
    const { makeFav } = storeToRefs(cocktailsStore);

    return { cocktailsStore, makeFav };
  },
};
</script>
