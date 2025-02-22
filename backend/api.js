import pg from 'pg';
import express from 'express';
import cors from 'cors';

const { Pool } = pg;
const router = new express.Router();
const pool = new Pool({
    connectionString: 'postgres://qpigkfaq:V8lmFoRfvK9qe_fJwawdgSyEBOEpCW5A@ella.db.elephantsql.com/qpigkfaq'
});
const app = express();

app.use(cors());
app.use(express.json());

router.route('/cocktails')
    .get(async (req, res) => {
        try {
            const rez = await pool.query(`SELECT * FROM cocktails LIMIT 50`);
            res.send(rez.rows);
        } catch (e) {
            res.status(500).send({
                status: '500',
                statusText: `${e.message}`
            });
        }
    })
    .post(async (req, res) => {
        const { id, name, composition, volume, price } = req.body;

        try {
            const query = `
                INSERT INTO cocktails (id, name, composition, volume, price)
                VALUES ($1, $2, $3, $4, $5)
            `;
            await pool.query(query, [id, name, composition, volume, price]);
            res.send({ status: 200 });
        } catch (e) {
            res.status(500).send({
                status: '500',
                statusText: `${e.message}`
            });
        }
    });

app.use('/api', router);
app.listen(4000, () => console.log(`API launched on port 4000`));
