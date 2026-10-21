/**
 * Тонкая обёртка над API админки: хранит токен в localStorage и подставляет
 * его в Authorization. Пароль целиком живёт на сервере (backend/auth.js).
 */
const TOKEN_KEY = 'drinkers-admin-token';

export const apiBase = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/cocktails$/, '')
  : `${location.protocol}//${location.hostname}:4000/api`;

export const getToken = () => localStorage.getItem(TOKEN_KEY) ?? '';
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export const isLoggedIn = () => Boolean(getToken());

export const login = async (password) => {
  const res = await fetch(`${apiBase}/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({password})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.statusText || 'Не удалось войти');
  setToken(data.token);
  return data.token;
};

export const logout = () => setToken('');

/** Любой запрос к API; при 401 токен сбрасывается и ошибка летит наверх. */
export const api = async (path, {method = 'GET', body} = {}) => {
  const token = getToken();
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {Authorization: `Bearer ${token}`} : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    setToken('');
    throw new Error('Сессия истекла — войди заново');
  }
  if (!res.ok) throw new Error(data.statusText || `HTTP ${res.status}`);
  return data;
};

/**
 * Скачивание всего каталога (CSV или JSON) — тем же форматом, что принимает импорт.
 * Тянем blob'ом, имя файла берём из Content-Disposition.
 */
export const downloadExport = async (format = 'csv') => {
  const token = getToken();
  const res = await fetch(`${apiBase}/export?format=${format}`, {
    headers: token ? {Authorization: `Bearer ${token}`} : {}
  });
  if (res.status === 401) {
    setToken('');
    throw new Error('Сессия истекла — войди заново');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const disposition = res.headers.get('content-disposition') ?? '';
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `cocktails.${format}`;
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
  return name;
};
