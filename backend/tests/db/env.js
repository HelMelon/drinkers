// Переменные окружения ДО импорта приложения: db.js и auth.js читают их
// на этапе загрузки модуля, поэтому этот файл импортируется первым.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  ?? 'postgres://postgres@127.0.0.1:5499/drinkers_test';
process.env.ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'test-password';
process.env.ADMIN_SECRET = process.env.TEST_ADMIN_SECRET ?? 'test-secret-for-integration';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';
process.env.NODE_ENV = 'test';
