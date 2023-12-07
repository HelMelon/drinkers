<template>
  <h2>Whose there</h2>
<button @click.prevent="log">BOOP</button>
  <form @submit.prevent="log(login, password)">
    <label for="login">Login:</label>
    <input type="text"
           name="login"
           id="login"
           :modelValue="login"

           placeholder="what's ur name"
           required
    />
    <label id="pass" for="password">Password:</label>
    <input type="password"
           name="password"
           id="password"
           v-bind="password"
           placeholder="speak, friend, and enter"
           required
    />
    <input type="submit" value="Enter"/>
  </form>
</template>

<script setup>
defineProps(['login', 'password'])
const emit = defineEmits(['logging', 'update:modelValue']);
import {ref} from 'vue';
const login = ref('');
const password = ref('');

function log () {
  emit('logging', {login, password})
}


</script>

<style scoped>

</style>