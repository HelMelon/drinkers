<template>
  <section class="filters-editor">
    <p class="hint">
      Фильтры живут в базе: каталог рисует их отсюда. <b>category</b> сравнивает поле
      <code>iba_category</code>, <b>ingredient</b> ищет подстроку в составе,
      <b>volume</b> пропускает коктейли объёмом больше порога.
    </p>

    <div class="grid">
      <div v-for="group in groups" :key="group.kind" class="col">
        <h3>{{ group.title }}</h3>
        <div v-for="filter in group.items" :key="filter.id" class="item">
          <template v-if="editingId === filter.id">
            <input v-model="draft.label" placeholder="подпись" />
            <input
              v-if="filter.kind === 'volume'"
              v-model="draft.threshold"
              type="number"
              min="0"
              placeholder="порог, мл"
            />
            <input v-else v-model="draft.matchValue" placeholder="значение" />
            <input v-model="draft.sortOrder" type="number" class="sort" title="порядок" />
            <span class="actions">
              <button class="btn small" @click="save(filter.id)">✓</button>
              <button class="btn small ghost" @click="cancel">✕</button>
            </span>
          </template>
          <template v-else>
            <span class="label">{{ filter.label }}</span>
            <span class="muted">
              {{ filter.kind === 'volume' ? `объём > ${filter.threshold}` : filter.matchValue }}
            </span>
            <span class="muted sort">#{{ filter.sortOrder }}</span>
            <span class="actions">
              <button class="btn small ghost" @click="startEdit(filter)">✎</button>
              <button class="btn small ghost danger" @click="remove(filter)">🗑</button>
            </span>
          </template>
        </div>
      </div>
    </div>

    <div class="new">
      <h3>Добавить фильтр</h3>
      <div class="item">
        <select v-model="draft.kind">
          <option value="category">category</option>
          <option value="ingredient">ingredient</option>
          <option value="volume">volume</option>
        </select>
        <input v-model="draft.label" placeholder="подпись, напр. vodka" />
        <input
          v-if="draft.kind === 'volume'"
          v-model="draft.threshold"
          type="number"
          min="0"
          placeholder="порог, мл"
        />
        <input v-else v-model="draft.matchValue" placeholder="значение, напр. vodka" />
        <input v-model="draft.sortOrder" type="number" class="sort" title="порядок" />
        <button class="btn small" @click="create">＋</button>
      </div>
    </div>

    <p v-if="error" class="hint">{{ error }}</p>
    <p v-if="notice" class="hint">{{ notice }}</p>
  </section>
</template>

<script setup>
import {computed, onMounted, reactive, ref} from 'vue';
import {api} from '../../api/admin.js';

const filters = ref([]);
const editingId = ref(null);
const error = ref('');
const notice = ref('');

const draft = reactive({kind: 'ingredient', label: '', matchValue: '', threshold: '', sortOrder: 0});

const cancel = () => {
  editingId.value = null;
  Object.assign(draft, {kind: 'ingredient', label: '', matchValue: '', threshold: '', sortOrder: 0});
};

const load = async () => {
  try {
    filters.value = await api('/filters');
  } catch (e) {
    error.value = e.message;
  }
};

onMounted(load);

const TITLES = {category: 'IBA категории', ingredient: 'Ингредиенты', volume: 'Объём'};
const groups = computed(() => ['category', 'ingredient', 'volume'].map((kind) => ({
  kind,
  title: TITLES[kind],
  items: filters.value.filter((filter) => filter.kind === kind)
})));

const startEdit = (filter) => {
  editingId.value = filter.id;
  Object.assign(draft, {
    kind: filter.kind,
    label: filter.label,
    matchValue: filter.matchValue ?? '',
    threshold: filter.threshold ?? '',
    sortOrder: filter.sortOrder ?? 0
  });
};

const save = async (id) => {
  try {
    await api(`/filters/${id}`, {
      method: 'PATCH',
      body: {label: draft.label, matchValue: draft.matchValue, threshold: draft.threshold, sortOrder: draft.sortOrder}
    });
    notice.value = 'Сохранено';
    cancel();
    await load();
  } catch (e) {
    error.value = e.message;
  }
};

const create = async () => {
  try {
    await api('/filters', {method: 'POST', body: {...draft}});
    notice.value = 'Фильтр добавлен';
    cancel();
    await load();
  } catch (e) {
    error.value = e.message;
  }
};

const remove = async (filter) => {
  if (!confirm(`Удалить фильтр «${filter.label}»?`)) return;
  try {
    await api(`/filters/${filter.id}`, {method: 'DELETE'});
    notice.value = 'Удалено';
    await load();
  } catch (e) {
    error.value = e.message;
  }
};

defineExpose({reload: load});
</script>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.col h3, .new h3 { margin: 0 0 6px; font-size: 16px; }
.item {
  display: grid;
  grid-template-columns: 1fr 1.1fr 48px 64px;
  gap: 6px;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid rgba(128, 128, 128, .2);
}
.label { font-weight: 600; }
.muted { opacity: .7; font-size: 13px; }
.sort { text-align: center; }
.actions { display: flex; gap: 4px; justify-content: flex-end; }
input, select {
  width: 100%;
  padding: 5px 7px;
  border: 1px solid rgba(128, 128, 128, .5);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
}
.btn.small { padding: 4px 8px; min-width: 30px; }
.btn.ghost { background: transparent; border: 1px solid currentColor; }
.btn.danger { color: #b3423a; }
.new { margin-top: 16px; }
.hint { font-size: 14px; opacity: .8; }
@media (max-width: 820px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
