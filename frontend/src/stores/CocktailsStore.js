import {defineStore} from "pinia";

const useCocktailsStore = defineStore("CocktailsStore", {
  state: () => ({
    cocktails: [],
    isLoading: false,
    randomized: false,
    random: {},
    apiUrl: `${location.origin}:4000/api/cocktails`
  }),
  getters: {
    gin() {
      return this.cocktails.filter((cock) => cock.composition.includes('gin'));
    },
    tequila() {
      return this.cocktails.filter((cock) => cock.composition.includes('tequila'));
    },
    sour() {
      return this.cocktails.filter((cock) => cock.composition.includes('lime'));
    },
    big() {
      return this.cocktails.filter((cock) => cock.volume > 150);
    },
    rum() {
      return this.cocktails.filter((cock) => cock.composition.includes('rum'));
    },
    classics() {
      return this.cocktails.filter((cock) => cock.iba_category === 'Classics')
    },
    unforgettables() {
      return this.cocktails.filter((cock) => cock.iba_category === 'Unforgettables')
    },
    new_era() {
      return this.cocktails.filter((cock) => cock.iba_category === 'New Era')
    }
  },
  actions: {
    async getCocktails() {
      const res = await fetch(this.apiUrl);
      this.cocktails = await res.json()
      this.cocktails.map(coc => ({...coc, isEditing: false }))
    },
    randomaize(chosen) {
      this.random = chosen[Math.floor(Math.random() * chosen.length)]
      this.randomized = true;
    },
  },
});

export default useCocktailsStore;
