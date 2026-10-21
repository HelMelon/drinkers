import app from './app.js';

// Точка входа: само приложение живёт в app.js (его импортируют тесты).
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API launched on port ${port}`));
