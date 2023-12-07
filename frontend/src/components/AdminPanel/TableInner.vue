<template>
  <tr v-for="cocktail in cocktails" :key="cocktail.id" :data-id="cocktail.id">
    <td>{{ cocktail.name }}</td>
    <td>{{ cocktail.composition }}</td>
    <td>{{ cocktail.volume }}</td>
    <td>{{ cocktail.price.toString().replace(',', ', ') }}</td>
    <td class="last">{{ cocktail.iba_category === 'Not categorized' ? '-' : cocktail.iba_category }}</td>
    <td class="material-symbols-outlined" @click="$emit.editCocktail(cocktail.id)">edit</td>
  </tr>
</template>

<script setup>
defineProps({
  cocktails: {
    type: Array,
    required: true
  }
})

defineEmits(['editCocktail'])

</script>

<style scoped>

</style>