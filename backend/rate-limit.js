/**
 * Простой лимитер попыток в памяти процесса: ключ — IP. Достаточно для одного
 * инстанса API; для нескольких — вынести счётчики в Redis/Postgres.
 */
export const createRateLimiter = ({ max = 5, windowMs = 15 * 60 * 1000, now = () => Date.now() } = {}) => {
  const hits = new Map();

  const prune = (current) => {
    if (hits.size < 5000) return;
    for (const [key, entry] of hits) {
      if (entry.resetAt <= current) hits.delete(key);
    }
  };

  const middleware = (req, res, next) => {
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const current = now();
    prune(current);

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= current) {
      entry = { count: 0, resetAt: current + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    const remaining = Math.max(0, max - entry.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (entry.count > max) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - current) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        status: '429',
        statusText: `Слишком много попыток. Повторите через ${retryAfter} с.`,
      });
    }
    return next();
  };

  middleware.reset = (key) => (key ? hits.delete(key) : hits.clear());
  middleware.size = () => hits.size;
  return middleware;
};
