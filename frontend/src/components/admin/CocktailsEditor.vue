<template>
  <section class="editor">
    <div class="row head">
      <span>Название</span>
      <span>Состав</span>
      <span>Объём</span>
      <span>Цена (дом./имп.)</span>
      <span>Категория</span>
      <span></span>
    </div>

    <div v-for="cocktail in cocktails" :key="cocktail.id" class="row">
      <template v-if="editingId === cocktail.id">
        <input v-model="draft.name" placeholder="название" />
        <input v-model="draft.composition" placeholder="ром, лайм, сироп" />
        <input v-model="draft.volume" type="number" min="1" placeholder="150" />
        <input v-model="draft.price" placeholder="14 20" />
        <input v-model="draft.iba_category" list="categories" placeholder="Classics" />
        <span class="actions">
          <button class="btn small" @click="save(cocktail.id)">✓</button>
          <button class="btn small ghost" @click="cancel">✕</button>
        </span>
      </template>
      <template v-else>
        <span class="name">{{ cocktail.name }}</span>
        <span class="muted">{{ cocktail.composition || '—' }}</span>
        <span>{{ cocktail.volume }} мл</span>
        <span>{{ (cocktail.price || []).join(' / ') || '—' }}</span>
        <span class="muted">{{ cocktail.iba_category }}</span>
        <span class="actions">
          <button class="btn small ghost" @click="startEdit(cocktail)">✎</button>
          <button class="btn small ghost danger" @click="remove(cocktail)">🗑</button>
        </span>
      </template>
    </div>

    <div class="row new">
      <input v-model="draft.name" placeholder="название" />
      <input v-model="draft.composition" placeholder="ром, лайм, сироп" />
      <input v-model="draft.volume" type="number" min="1" placeholder="150" />
      <input v-model="draft.price" placeholder="14 20" />
      <input v-model="draft.iba_category" list="categories" placeholder="Classics" />
      <span class="actions">
        <button class="btn small" @click="create">＋</button>
      </span>
    </div>

    <datalist id="categories">
      <option v-for="category in categories" :key="category" :value="category" />
    </datalist>

    <p v-if="error" class="hint">{{ error }}</p>
    <p v-if="notice" class="hint">{{ notice }}</p>
  </section>
</template>

<script setup>
import {onMounted, reactive, ref} from 'vue';
import {api} from '../../api/admin.js';

const cocktails = ref([]);
const editingId = ref(null);
const error = ref('');
const notice = ref('');
const categories = ref([]);

const draft = reactive({name: '', composition: '', volume: '', price: '', iba_category: ''});

const reset = () => Object.assign(draft, {name: '', composition: '', volume: '', price: '', iba_category: ''});

const load = async () => {
  error.value = '';
  try {
    cocktails.value = await api('/cocktails');
    const stats = await api('/stats');
    categories.value = stats.categories.map((item) => item.category);
  } catch (e) {
    error.value = e.message;
  }
};

onMounted(load);

const startEdit = (cocktail) => {
  editingId.value = cocktail.id;
  Object.assign(draft, {
    name: cocktail.name,
    composition: cocktail.composition ?? '',
    volume: cocktail.volume,
    price: (cocktail.price || []).join(' '),
    iba_category: cocktail.iba_category ?? ''
  });
};

const cancel = () => {
  editingId.value = null;
  reset();
};

const save = async (id) => {
  try {
    await api(`/cocktails/${id}`, {method: 'PATCH', body: {...draft}});
    notice.value = 'Сохранено';
    editingId.value = null;
    reset();
    await load();
  } catch (e) {
    error.value = e.message;
  }
};

const create = async () => {
  try {
    await api('/cocktails', {method: 'POST', body: {...draft}});
    notice.value = `Добавлен «${draft.name}»`;
    reset();
    await load();
  } catch (e) {
    error.value = e.message;
  }
};

const remove = async (cocktail) => {
  if (!confirm(`Удалить «${cocktail.name}»?`)) return;
  try {
    await api(`/cocktails/${cocktail.id}`, {method: 'DELETE'});
    notice.value = 'Удалено';
    await load();
  } catch (e) {
    error.value = e.message;
  }
};

defineExpose({reload: load});
</script>

<style scoped>
.editor { display: flex; flex-direction: column; gap: 6px; }
.row {
  display: grid;
  grid-template-columns: 1.3fr 2fr 0.6fr 0.9fr 1fr 90px;
  gap: 8px;
  align-items: center;
  border-bottom: 1px solid rgba(128, 128, 128, .25);
  padding: 6px 0;
}
.head { font-weight: 600; opacity: .7; font-size: 13px; }
.new { border-top: 1px dashed rgba(128, 128, 128, .4); padding-top: 10px; }
input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid rgba(128, 128, 128, .5);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
}
.name { font-weight: 600; }
.muted { opacity: .7; font-size: 14px; }
.actions { display: flex; gap: 4px; justify-content: flex-end; }
.btn.small { padding: 4px 8px; min-width: 32px; }
.btn.ghost { background: transparent; border: 1px solid currentColor; }
.btn.danger { color: #b3423a; }
.hint { margin: 6px 0 0; font-size: 14px; }
@media (max-width: 820px) {
  .row { grid-template-columns: 1fr 1fr; }
  .head { display: none; }
}
</style>
