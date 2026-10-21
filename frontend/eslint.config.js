import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      // окружение задаём пакетом globals, а не руками: eslint-plugin-vue 10
      // больше не подмешивает browser-глобали в конфиг
      globals: {...globals.browser, ...globals.node}
    },
    rules: {
      // имя файла = имя компонента, поэтому односложные имена допустимы
      'vue/multi-word-component-names': 'off',
      // форматирование не ловим — этим занимается редактор
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  {
    files: ['*.test.js', 'test-setup.js', 'vitest.config.js', 'vite.config.js'],
    languageOptions: {
      globals: {...globals.browser, ...globals.node, describe: 'readonly', it: 'readonly', expect: 'readonly', beforeEach: 'readonly', beforeAll: 'readonly', vi: 'readonly'}
    }
  }
];
