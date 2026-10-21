import test from 'node:test';
import assert from 'node:assert/strict';
import { toClientError } from '../../http-error.js';

const quietLogger = { error: () => {} };

test('500 не раскрывает текст исключения', () => {
  const error = new Error('relation "cocktails" does not exist at character 15');
  const payload = toClientError(error, 500, quietLogger);
  assert.equal(payload.status, '500');
  assert.equal(payload.statusText, 'Внутренняя ошибка сервера');
  assert.ok(!payload.statusText.includes('cocktails'));
});

test('500 логируется на сервере', () => {
  let logged = null;
  toClientError(new Error('boom'), 500, { error: (_tag, error) => { logged = error; } });
  assert.equal(logged.message, 'boom');
});

test('400 отдаёт наш валидационный текст', () => {
  const payload = toClientError(new Error('объём должен быть числом'), 400, quietLogger);
  assert.equal(payload.status, '400');
  assert.equal(payload.statusText, 'объём должен быть числом');
});

test('assertAuthConfig падает в production без пароля', async () => {
  const { assertAuthConfig } = await import('../../auth.js');
  const saved = { ...process.env };
  process.env.NODE_ENV = 'production';
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_SECRET;
  assert.throws(() => assertAuthConfig(), /ADMIN_PASSWORD/);
  process.env.ADMIN_PASSWORD = 'secret';
  assert.throws(() => assertAuthConfig(), /ADMIN_SECRET/);
  process.env.ADMIN_SECRET = 'really-long-random-value';
  assert.doesNotThrow(() => assertAuthConfig());
  process.env = saved;
});
