import crypto from 'node:crypto';

// Минимальная авторизация без внешних зависимостей:
// пароль сравнивается с ADMIN_PASSWORD (по умолчанию 'admin' — для локалки),
// взамен выдаётся подписанный HMAC-токен со сроком жизни 12 часов.
// Для сервера задать свои ADMIN_PASSWORD и ADMIN_SECRET в .env.

const PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const SECRET = process.env.ADMIN_SECRET || 'drinkers-dev-secret';
const TTL_MS = 12 * 60 * 60 * 1000;

/**
 * Проверка конфигурации на старте: в production дефолтные пароль и секрет
 * запрещены — иначе админка открыта всем, кто читал репозиторий.
 */
export const assertAuthConfig = () => {
  const isProd = process.env.NODE_ENV === 'production';
  if (!process.env.ADMIN_PASSWORD) {
    if (isProd) throw new Error('ADMIN_PASSWORD не задан: в production пароль по умолчанию запрещён');
    console.warn('[auth] ADMIN_PASSWORD не задан — используется "admin" (только для локальной разработки)');
  }
  if (isProd && (!process.env.ADMIN_SECRET || process.env.ADMIN_SECRET === 'drinkers-dev-secret')) {
    throw new Error('ADMIN_SECRET не задан или остался дефолтным: в production подписывать токены им нельзя');
  }
};

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const sign = (payload) => crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/** Проверяет пароль и возвращает токен либо null. */
export const login = (password) => {
  if (!password || !safeEqual(password, PASSWORD)) return null;
  const payload = b64url(JSON.stringify({ exp: Date.now() + TTL_MS }));
  return `${payload}.${sign(payload)}`;
};

/** Проверяет срок жизни и подпись токена. */
export const verifyToken = (token) => {
  if (typeof token !== 'string' || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  if (!safeEqual(signature, sign(payload))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
};

/** Express-middleware: пропускает только запросы с валидным Bearer-токеном. */
export const requireAuth = (req, res, next) => {
  const header = req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!verifyToken(token)) {
    return res.status(401).json({ status: '401', statusText: 'Нужен вход в админку' });
  }
  return next();
};
