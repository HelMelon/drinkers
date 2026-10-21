<template>
  <div class="filters-bar">
    <div v-if="categories.length" class="group">
      <h2>IBA categories</h2>
      <div class="row">
        <button
          v-for="filter in categories"
          :key="filter.id"
          class="btn chip"
          :class="{active: active && active.id === filter.id}"
          :aria-pressed="active && active.id === filter.id ? 'true' : 'false'"
          @click="$emit('choose', filter)"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <div v-if="ingredients.length" class="group">
      <h2>Filters</h2>
      <div class="row">
        <button
          v-for="filter in ingredients"
          :key="filter.id"
          class="btn icon-btn tooltip"
          :class="{active: active && active.id === filter.id}"
          :aria-pressed="active && active.id === filter.id ? 'true' : 'false'"
          :aria-label="`${filter.label}, коктейлей: ${counts[filter.id] ?? 0}`"
          @click="$emit('choose', filter)"
        >
          <component :is="iconFor(filter)" v-if="iconFor(filter)" />
          <span v-else class="chip-text">{{ filter.label }}</span>
          <span class="tooltiptext">{{ filter.label }} · {{ counts[filter.id] ?? 0 }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import Gin from './Filters/icons/Gin.vue';
import Rum from './Filters/icons/Rum.vue';
import Tequila from './Filters/icons/Tequila.vue';
import Sour from './Filters/icons/Sour.vue';
import BigVolume from './Filters/icons/BigVolume.vue';

defineProps({
  categories: {type: Array, default: () => []},
  ingredients: {type: Array, default: () => []},
  active: {type: Object, default: null},
  counts: {type: Object, default: () => ({})}
});
defineEmits(['choose']);

// Иконки есть только для «родных» фильтров; для новых из админки — текстовая кнопка.
const ICONS = {
  'gin': Gin,
  'rum': Rum,
  'tequila': Tequila,
  'sour': Sour,
  'big volume': BigVolume
};

const iconFor = (filter) => ICONS[String(filter.label).toLowerCase()] ?? null;
</script>

<style scoped>
.filters-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
  justify-content: center;
}

.chip {
  min-width: 120px;
  padding: 8px 16px;
}

.icon-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chip-text {
  font-size: 12px;
  line-height: 1.1;
  text-align: center;
  word-break: break-word;
}

.btn.active {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.tooltip {
  position: relative;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 110px;
  text-align: center;
  border-radius: 6px;
  padding: 4px 0;
  position: absolute;
  z-index: 1;
  font-size: 14px;
  top: -34px;
  left: 50%;
  transform: translateX(-50%);
}

.tooltip:hover .tooltiptext {
  visibility: visible;
}

@media (max-width: 760px) {
  .row {
    flex-direction: column;
    align-items: stretch;
  }
  .icon-btn {
    width: 100%;
    border-radius: 12px;
  }
}
</style>
