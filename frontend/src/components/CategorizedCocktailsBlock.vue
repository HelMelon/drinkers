<template>
  <div class="cards-list" >
  <div class="form_toggle">
    <div class="form_toggle-item item-1">
      <input id="fid-1" type="radio" name="radio" v-model="alco" value="domestic" checked>
      <label for="fid-1">domestic</label>
    </div>
    <div class="form_toggle-item item-2">
      <input id="fid-2" type="radio" name="radio" v-model="alco" value="imported">
      <label for="fid-2">imported</label>
    </div>
  </div>
  <Cocktail v-for="cocktail in chosen" :key="cocktail.id" :cocktail="cocktail" :alco="alco"/>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import Cocktail from './Cocktail.vue';
const alco = ref('');
defineProps(['chosen'])
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