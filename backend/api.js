import pg from 'pg';
import express from 'express';
import cors from 'cors';

const router = new express.Router;
const client = new pg.Client('postgres://qpigkfaq:V8lmFoRfvK9qe_fJwawdgSyEBOEpCW5A@ella.db.elephantsql.com/qpigkfaq');
const app = express();

app.use(cors())

client.connect();

router.route('/cocktails')
    .get(async (req, res) => {
        try {
            const rez = await client.query(`SELECT *
                                            FROM cocktails
                                            LIMIT 50`);
            res.send(rez.rows);

        } catch (e) {
            res.send({
                status: '500',
                statusText: e
            })
        }
    })
    .post(async (req, res) => {
        const {id, name, composition, volume, price, gin, rum, tequila, lime} = req.body;

        const queries = data.map((cockt) => {
            // fill the DB tables
            // const priceFormatter = cockt.price.join(', ');
            // return `INSERT INTO cocktails(id, name, composition, volume, price, iba_category, is_fav)
            //         values ('${cockt.id}', '${cockt.name}', '${cockt.composition}', ${cockt.volume}, '{${priceFormatter}
            //                 }',
            //                 '${cockt.iba_category}', false)`
            // console.log(cockt.composition);
            // return `INSERT INTO ingredients(gin, rum, tequila, lime, cocktail_id)
            //         values (${cockt.composition.includes('gin')}, ${cockt.composition.includes('rum')},
            //                 ${cockt.composition.includes('tequila')}, ${cockt.composition.includes('lime')},
            //                 '${cockt.id}')`
        })

        queries.map(async query => {
            await client.query(query);
        });

        res.send({status: 200});
    })
router.route('/cocktails/:id')
    .patch(async (req, res) => {


        
        // const {name, composition, volume, price, category} = req.body;
        // const priceFormatter = `{ ${price.join(', ')} }`;
        // const query = `UPDATE
        //                    cocktails
        //                SET name        = ${name},
        //                    composition = ${composition},
        //                    volume      = ${volume},
        //                    price = ${priceFormatter},
        //                    iba_category = ${category}
        //                WHERE id = '${req.params.id}'`
        // await client.query(query)
        // await res.sendStatus()
    })


app.use(express.json())
app.use('/api', router);
app.listen(4000, () => console.log(`api launched on port 4000`))


// const dbConnection = client.connect();
//
// router.get('/cocktails', function () {
//     client.connect(async () => {
//         await client.query(`SELECT *
//                             FROM cocktails`);
//         await client.end()
//     })
// });
// router.get('/cocktails/:filter', function (req) {
//     client.connect(async () => {
//         await client.query(`SELECT *
//                             FROM cocktails
//                                      INNER JOIN ingredients ON cocktails.id = ingredients.cocktail_id
//                             WHERE ingredients.${req.params.filter} = true`)
//         await client.end()
//     })
// });
// router.post('/cocktails', function (req, res) {
//     const {id, name, composition, volume, price, gin, rum, tequila, lime} = req.body;
//     client.connect(async () => {
//         await client.query(`INSERT INTO cocktails(id, name, composition, volume, price)
//                             values ($1, $2, $3, $4, $5)`, [id, name, composition, volume, price])
//         await client.query(`INSERT INTO ingredients(gin, rum, tequila, lime, cocktail_id)
//                             values ($1, $2, $3, $4, $5)`, [gin, rum, tequila, lime, id])
//         await client.end()
//     });
// })
// router.put('/cocktails/:id', function (req) {
//     client.connect(async () => {
//         await client.query(`UPDATE
//                                 cocktails
//                             SET price = ${req.body}
//                             WHERE id = ${req.params.id}`)
//         await client.end()
//     });
// });
// router.delete('/cocktails/:id', function (req) {
//     client.connect(async () => {
//         await client.query(`DELETE
//                             FROM cocktails
//                             WHERE id = ${req.params.id}`)
//         await client.end()
//     });
// });
//
// app.use(express.json())
// app.use('/api', router);
// app.listen(4000, () => console.log(`api launched on port 4000`))
//
