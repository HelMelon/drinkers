<template>
  <form>
    <input type="text" @input="name = $event.target.value" :value="cocktail.name"/>
    <input type="text" @input="composition = $event.target.value" :value="cocktail.composition"/>
    <input type="text" @input="volume = $event.target.value" :value="cocktail.volume"/>
    <input type="text" @input="price = $event.target.value" :value="cocktail.price"/>
    <input type="text" @input="category = $event.target.value" :value="cocktail.iba_category"/>
    <span v-else class="material-symbols-outlined"
          @click="updateCocktail(cocktail.id, name, composition, volume, price, category)">save</span>
  </form>
</template>

<script setup>
const props = defineProps({
  cocktail: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['save'])
</script>

<style scoped>

</style>