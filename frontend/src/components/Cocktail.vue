<template>
  <div class="card">
    <h3>{{ cocktail.name }}</h3>
    <span style="display: block">{{ cocktail.composition }}</span>
    <div class="price">
      {{ alco === 'imported' && cocktail.price.length > 1 ? cocktail.price[1] : cocktail.price[0]  }}
      BYN
    </div>
    <div class="volume">{{ cocktail.volume }} ml</div>
  </div>
</template>

<script setup>
defineProps(['cocktail', 'alco']);
</script>
