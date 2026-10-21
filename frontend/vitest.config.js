import {defineConfig} from 'vitest/config';
import vue from '@vitejs/plugin-vue';

// Отдельный конфиг для тестов: тот же vue-плагин, что в vite.config.js,
// плюс jsdom с нормальным origin — без него в jsdom нет localStorage.
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {url: 'http://localhost:5173/'}
    },
    setupFiles: ['./test-setup.js'],
    include: ['*.test.js']
  }
});
