import useCocktailsStore from '../stores/CocktailsStore.js';
import {storeToRefs} from 'pinia';
import {ref} from 'vue';

const chooseFilter = (filter) => {
    const store = useCocktailsStore();
    store.getCocktails()
    const {cocktails, classics, unforgettables, new_era, gin, rum, tequila, big, sour} = storeToRefs(store)
    let chosen;
    const isIngredients = ref(false);
    const isCategories = ref(false);
    switch (filter) {
        case 'classics':
            chosen = classics.value;
            isCategories.value = !isCategories;
            break;
        case 'unforgettables':
            chosen = unforgettables.value;
            isCategories.value = !isCategories;
            break;
        case 'new_era':
            chosen = new_era.value
            isCategories.value = !isCategories;
            break;
        case 'gin':
            chosen = gin.value
            isIngredients.value = !isIngredients
            break;
        case 'rum':
            chosen = rum.value
            isIngredients.value = !isIngredients
            break;
        case 'tequila':
            chosen = tequila.value
            isIngredients.value = !isIngredients
            break;
        case 'sour':
            chosen = sour.value
            isIngredients.value = !isIngredients
            break;
        case 'big':
            chosen = big.value
            isIngredients.value = !isIngredients
            break;
        default:
            chosen = cocktails.value
            break;
    }
    return { isIngredients, isCategories, chosen };
}

export default chooseFilter;