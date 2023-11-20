<script setup>
import { RouterView } from 'vue-router'
import Header from "./components/Header.vue";
import {onMounted } from 'vue';
import getTheme from "./utils/themesSwitcher.js";
onMounted(() => {
  document.getElementById('app').classList.add(getTheme());
});
</script>

<template>
  <Header />
  <RouterView />
</template>
