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
    favs() {
      return this.cocktails.filter((cock) => cock.isFav);
    },
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
    randomaize(filter) {
      switch (filter) {
        case "tequila":
          this.random = this.tequila[Math.floor(Math.random() * this.tequila.length)]
          this.randomized = true;

          break;
        case "rum":
          this.random = this.rum[Math.floor(Math.random() * this.rum.length)];
          this.randomized = true;
          break;
        case "big":
          this.random = this.big[Math.floor(Math.random() * this.big.length)]
          this.randomized = true;

          break;
        case "sour":
          this.random = this.sour[Math.floor(Math.random() * this.sour.length)];
          this.randomized = true;

          break;
        case "gin":
          this.random = this.gin[Math.floor(Math.random() * this.gin.length)];
          this.randomized = true;

          break;
        case "favs":
          this.random = this.favs[Math.floor(Math.random() * this.favs.length)];
          this.randomized = true;

          break;

        default:
          this.random = this.cocktails[Math.floor(Math.random() * this.cocktails.length)]
          this.randomized = true;

          break;
      }
    },
  },
});

export default useCocktailsStore;
