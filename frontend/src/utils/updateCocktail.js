const updateCocktail = async (id, name, composition, volume, price, category) => {
    console.log(id, name, composition, volume, price, category)
    // const data = {
    //     "name":
    //     name,
    //     "composition":
    //     composition,
    //     "volume":
    //     volume,
    //     "price":
    //     price,
    //     "category":
    //     category
    // }
    // console.log(data)
    // try {
    //     await fetch('http://localhost:4000/api/cocktails/' + id, {
    //         method: 'PATCH',
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify(data)
    //     })
    // } catch
    //     (error) {
    //     console.error(error.message)
    // }
}
export default updateCocktail;