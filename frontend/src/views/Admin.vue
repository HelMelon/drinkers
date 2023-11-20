<template>
  <CocktailsTable v-if="isLoggedIn" :cocktails="cocktails" />
  <LoginForm v-else @logging="handleLogging(login, password)"/>
</template>

<script setup>
import {ref} from 'vue'
import LoginForm from '@/components/LoginForm.vue';
import CocktailsTable from "@/components/CocktailsTable.vue";
import {storeToRefs} from "pinia";

import useCocktailsStore from "@/stores/CocktailsStore";


const isLoggedIn = ref(false);

const handleLogging = (login, password) => {
  console.log(login, password)
  // if (data.login.value === 'admin' && data.password.value === '123') {
  //   isLoggedIn.value = !isLoggedIn.value;
  // }
}
const cocktailsStore = useCocktailsStore();
cocktailsStore.getCocktails()
const {cocktails} = storeToRefs(cocktailsStore);

const editCocktail = (id) => {
  const isEditing = cocktails.value.find(cocktail => cocktail.id === id).isEditing
  cocktails.value.find(cocktail => cocktail.id === id).isEditing = !isEditing
}

// const name = ref('');
// const composition = ref('');
// const volume = ref(0);
// const price = ref('');
// const category = ref('');


</script>
<style>
h2 {
  text-align: center;
  font-family: Serenita, serif;
  font-size: 40px;
  line-height: 100px;
}

label {
  font-size: 20px;
}

.day label {
  color: #0b2625;
}

.day input {
  border-color: #0b2625;
  color: #0b2625;
}

.day input::placeholder {
  color: #0b2625;
}

.night label {
  color: #769d9c;
}

.night input {
  border-color: #769d9c;
  color: #769d9c;
}

.night input::placeholder {
  color: #769d9c;
}

form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-content: center;
  text-align: center;
  width: 50%;
  margin: 0 auto;
}

input, textarea {
  border-radius: 4px;
  border-width: 2px;
  border-style: solid;
  padding: 10px;
  font-size: 20px;
}

input::placeholder {
  font-size: 20px;
  opacity: 0.3;
}

input[type="submit"] {
  width: 20%;
  color: #769d9c;
  font-size: 20px;
  margin: 0 auto;
}

tr {
  border-bottom-style: solid;
  border-bottom-width: 1px;
  padding: 10px 15px;
  position: relative;
  vertical-align: middle;
}

.night tr {
  border-bottom-style: solid;
  border-bottom-width: 1px;
  font-size: 20px;
  line-height: 50px;
}

.night table {
  color: #769d9c;
}

.day table {
  color: #0b2625;
}

td, th {
  text-align: left;
  border-right-width: 1px;
  border-right-style: solid;
  width: 20%;
  line-height: normal;
  padding: inherit;
  vertical-align: middle;
  display: table-cell;
}

td:last-of-type, th:last-of-type, tbody tr:last-of-type {
  border: none;
}

table {
  width: 90%;
  margin-inline: auto;
}

table input, textarea {
  width: 100%;
}

.material-symbols-outlined {
  cursor: pointer;
}

.last {
  border-right: none;
}
</style>