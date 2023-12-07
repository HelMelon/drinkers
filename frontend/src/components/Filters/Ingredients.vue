<template>
  <h2>Filters</h2>
  <div class="filter">
    <nav class="filter">

      <button class="btn tooltip" @click="filterit('gin')">
        <span class="tooltiptext">gin</span>
        <Gin/>
      </button>
      <button class="btn tooltip" @click="filterit('tequila')">
        <span class="tooltiptext">tequila</span>
        <Tequila/>
      </button>
      <button class="btn tooltip" @click="filterit('rum')">
        <span class="tooltiptext">rum</span>
        <Rum/>
      </button>
      <button class="btn tooltip" @click="filterit('big')">
        <span class="tooltiptext">big volume</span>
        <BigVolume/>
      </button>
      <button class="btn tooltip" @click="filterit('sour')">
        <span class="tooltiptext">sour</span>
        <Sour/>
      </button>
    </nav>
  </div>
</template>

<script setup>
import Tequila from "./icons/Tequila.vue";
import Gin from './icons/Gin.vue'
import Rum from "./icons/Rum.vue";
import Sour from "./icons/Sour.vue";
import BigVolume from "./icons/BigVolume.vue";
const emit = defineEmits(['filterate']);
const filterit = (filterName) => {
  emit('filterate', filterName)
}
</script>

<style scoped>
.filter {
  justify-content: center;
  display: flex;
  gap: 1em;
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

.tooltip {
  position: relative;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 100px;
  text-align: center;
  border-radius: 6px;
  padding: 5px 0;
  position: absolute;
  z-index: 1;
  font-size: 14px;
  top: -35px;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
}

.tooltip .tooltiptext::after {
  content: " ";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;

}
</style>
