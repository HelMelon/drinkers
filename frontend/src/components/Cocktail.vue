<template>
  <div class="card">
    <h3>{{ cocktail.name }}</h3>
    <span class="composition">{{ cocktail.composition }}</span>
    <div class="price">
      {{ price }} BYN
    </div>
    <div class="volume">{{ cocktail.volume }} ml</div>
  </div>
</template>

<script setup>
import {computed} from 'vue';

const props = defineProps({
  cocktail: {type: Object, required: true},
  alco: {type: String, default: 'domestic'}
});

// price — массив: [домашняя] или [домашняя, импортная]. Берём нужное значение,
// а если его нет (данные неполные) — первое доступное.
const price = computed(() => {
  const values = Array.isArray(props.cocktail.price) ? props.cocktail.price : [];
  if (!values.length) return '—';
  return props.alco === 'imported' && values.length > 1 ? values[1] : values[0];
});
</script>

<style scoped>
.composition {
  display: block;
}
</style>
