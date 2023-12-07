<template>
    <h2>Hello friend</h2>
    <table>
      <thead>
      <tr>
        <th>Name</th>
        <th>Composition</th>
        <th>Volume</th>
        <th>Price</th>
        <th colspan="2">IBA category</th>
      </tr>
      </thead>
      <tbody>

        <TableInner :cocktails="cocktails" />

        <!--        <td v-if="!cocktail.isEditing">{{ cocktail.name }}</td>-->
        <!--        <td v-else><input type="text" @input="name = $event.target.value" :value="cocktail.name" /></td>-->

        <!--        <td v-if="!cocktail.isEditing">{{ cocktail.composition }}</td>-->
        <!--        <td v-else><input type="text" @input="composition = $event.target.value" :value="cocktail.composition" /></td>-->

        <!--        <td v-if="!cocktail.isEditing">{{ cocktail.volume }}</td>-->
        <!--        <td v-else><input type="text" @input="volume = $event.target.value" :value="cocktail.volume" /></td>-->

        <!--        <td v-if="!cocktail.isEditing">{{ cocktail.price.toString().replace(',', ', ') }}</td>-->
        <!--        <td v-else><input type="text" @input="price = $event.target.value" :value="cocktail.price" /></td>-->

        <!--        <td class="last" v-if="!cocktail.isEditing">{{ cocktail.iba_category === 'Not categorized' ? '-' : cocktail.iba_category }}</td>-->
        <!--        <td class="last" v-else><input type="text" @input="category = $event.target.value" :value="cocktail.iba_category" /></td>-->

        <!--        <td v-if="!cocktail.isEditing" class="material-symbols-outlined" @click.self="editCocktail(cocktail.id)">edit</td>-->
        <!--        <td v-else class="material-symbols-outlined" @click="updateCocktail(cocktail.id, name, composition, volume, price, category)">save</td>-->


      </tbody>
    </table>
</template>

<script setup>
import TableInner from "@/components/TableInner";
defineEmits([''])
defineProps(['cocktails'])
</script>

<style scoped>

</style>