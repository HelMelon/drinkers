import pg from 'pg';

const { Pool } = pg;

// Один пул на процесс: connectionString берём из DATABASE_URL (см. backend/.env.example).
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => {
  console.error('[db] pool error:', err.message);
});

export const query = (text, params) => pool.query(text, params);

/** Идентификатор в стиле исходных данных: 11 символов base36. */
export const newId = () => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 11; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
};
