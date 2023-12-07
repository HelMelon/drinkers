<template>
  <h2>IBA categories</h2>
  <div class="categories">
    <button class="btn" @click="choose('unforgettables')">Unforgetables</button>
    <button class="btn" @click="choose('classics')">Classics</button>
    <button class="btn" @click="choose('new_era')">New Era</button>
  </div>
</template>

<script setup>
const emit = defineEmits(
    ['filterate']
);
const choose = (category) => {
  emit('filterate', category)
}
</script>

<style scoped>
.categories {
  display: flex;
  gap: 2em;
  justify-content: center;
}

.categories button {
  width: 20%;
}
@media (max-width: 760px) {
  .categories {
    flex-direction: column;
  }
  .categories button {
    width: 100%;
  }
}

.categories button:target {
  color: red;
}
</style>