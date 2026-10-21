// Node 26 объявляет экспериментальный localStorage, который без
// --localstorage-file недоступен и перекрывает jsdom-овский. Для тестов
// подкладываем простую реализацию в память.
const memory = new Map();

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: (key) => memory.delete(key),
    clear: () => memory.clear()
  }
});
