import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../../rate-limit.js';

const fakeRes = () => {
  const res = {
    headers: {},
    code: 200,
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

const call = (limiter, ip = '10.0.0.1') => {
  const req = { ip, socket: { remoteAddress: ip } };
  const res = fakeRes();
  let nextCalled = false;
  limiter(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
};

test('пропускает 5 попыток, шестую — 429', () => {
  const limiter = createRateLimiter({ max: 5, windowMs: 60_000 });
  for (let i = 0; i < 5; i += 1) {
    const { res, nextCalled } = call(limiter);
    assert.equal(nextCalled, true, `попытка ${i + 1} должна проходить`);
    assert.equal(res.headers['X-RateLimit-Remaining'], String(4 - i));
  }
  const { res, nextCalled } = call(limiter);
  assert.equal(nextCalled, false);
  assert.equal(res.code, 429);
  assert.match(res.body.statusText, /Слишком много попыток/);
  assert.ok(Number(res.headers['Retry-After']) > 0);
});

test('лимит считается отдельно по IP', () => {
  const limiter = createRateLimiter({ max: 2, windowMs: 60_000 });
  call(limiter, '1.1.1.1');
  call(limiter, '1.1.1.1');
  const blocked = call(limiter, '1.1.1.1');
  const other = call(limiter, '2.2.2.2');
  assert.equal(blocked.res.code, 429);
  assert.equal(other.nextCalled, true);
});

test('окно истекает — счётчик обнуляется', () => {
  let now = 0;
  const limiter = createRateLimiter({ max: 1, windowMs: 1000, now: () => now });
  assert.equal(call(limiter).nextCalled, true);
  assert.equal(call(limiter).nextCalled, false);
  now = 1500;
  assert.equal(call(limiter).nextCalled, true);
});

test('reset снимает блокировку (успешный вход)', () => {
  const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
  call(limiter);
  assert.equal(call(limiter).nextCalled, false);
  limiter.reset('10.0.0.1');
  assert.equal(call(limiter).nextCalled, true);
});
