<template>
  <main>
    <div class="view admin">
      <h1>Admin</h1>

      <template v-if="!logged">
        <form class="login" @submit.prevent="doLogin">
          <input v-model="password" type="password" placeholder="пароль" autocomplete="current-password" />
          <button class="btn" type="submit" :disabled="isBusy">Войти</button>
        </form>
        <p v-if="error" class="hint">{{ error }}</p>
      </template>

      <template v-else>
        <div class="bar">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="btn tab"
            :class="{active: current === tab.id}"
            @click="current = tab.id"
          >
            {{ tab.title }}
          </button>
          <span class="spacer"></span>
          <button class="btn ghost" @click="doLogout">Выйти</button>
        </div>

        <p v-if="stats" class="stats">
          коктейлей: <b>{{ stats.cocktails }}</b> · фильтров: <b>{{ stats.filters }}</b>
        </p>

        <CocktailsEditor v-if="current === 'cocktails'" ref="cocktailsEditor" />
        <FiltersEditor v-if="current === 'filters'" />
        <ImportPanel v-if="current === 'import'" @imported="onImported" />
      </template>
    </div>
  </main>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import {api, isLoggedIn, login, logout} from '../api/admin.js';
import CocktailsEditor from '../components/admin/CocktailsEditor.vue';
import FiltersEditor from '../components/admin/FiltersEditor.vue';
import ImportPanel from '../components/admin/ImportPanel.vue';

const tabs = [
  {id: 'cocktails', title: 'Напитки'},
  {id: 'filters', title: 'Фильтры'},
  {id: 'import', title: 'Импорт'}
];

const logged = ref(isLoggedIn());
const password = ref('');
const error = ref('');
const isBusy = ref(false);
const current = ref('cocktails');
const stats = ref(null);
const cocktailsEditor = ref(null);

const loadStats = async () => {
  try {
    stats.value = await api('/stats');
  } catch (e) {
    error.value = e.message;
  }
};

onMounted(() => {
  if (logged.value) loadStats();
});

const doLogin = async () => {
  isBusy.value = true;
  error.value = '';
  try {
    await login(password.value);
    logged.value = true;
    password.value = '';
    await loadStats();
  } catch (e) {
    error.value = e.message;
  } finally {
    isBusy.value = false;
  }
};

const doLogout = () => {
  logout();
  logged.value = false;
  stats.value = null;
};

const onImported = async () => {
  await loadStats();
  await cocktailsEditor.value?.reload();
};
</script>

<style scoped>
.view.admin { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
.login { display: flex; gap: 10px; justify-content: center; margin-bottom: 10px; }
.login input {
  padding: 8px 12px;
  border: 1px solid rgba(128, 128, 128, .5);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  min-width: 220px;
}
.bar { display: flex; gap: 8px; align-items: center; margin: 8px 0 12px; flex-wrap: wrap; }
.spacer { flex: 1; }
.tab.active { outline: 2px solid currentColor; outline-offset: 2px; }
.btn.ghost { background: transparent; border: 1px solid currentColor; }
.stats { opacity: .75; font-size: 14px; margin: 0 0 12px; }
.hint { font-size: 14px; text-align: center; }
</style>
