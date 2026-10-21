<template>
  <div class="cards-list">
    <div class="form_toggle">
      <div class="form_toggle-item item-1">
        <input id="fid-1" v-model="alco" type="radio" name="radio" value="domestic" checked>
        <label for="fid-1">domestic</label>
      </div>
      <div class="form_toggle-item item-2">
        <input id="fid-2" v-model="alco" type="radio" name="radio" value="imported">
        <label for="fid-2">imported</label>
      </div>
    </div>
    <Cocktail v-for="cocktail in chosen" :key="cocktail.id" :cocktail="cocktail" :alco="alco" />
  </div>
</template>

<script setup>
import {ref} from 'vue';
import Cocktail from './Cocktail.vue';
// '' раньше давало «домашнюю» цену, но radio визуально не был выбран
const alco = ref('domestic');
defineProps({
  chosen: {type: Array, required: true}
});
</script>
<style>
.form_toggle {
  display: flex;
  overflow: hidden;
}
.form_toggle-item input[type=radio] {
  display: none;
}
.form_toggle-item label {
  display: flex;
  padding: 0 15px;
  line-height: 34px;
  border-right: none;
  cursor: pointer;
  user-select: none;
}

.form_toggle .item-1 label {
  border-radius: 6px 0 0 6px;
}

.form_toggle .item-2 label {
  border-radius: 0 6px 6px 0;
}
</style>