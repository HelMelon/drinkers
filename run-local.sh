#!/usr/bin/env bash
# Локальный запуск drinkers: PostgreSQL (:5499) + API (:4000) + Vite (:5173).
# Данные — 47 коктейлей, импортированы из F:\development\cocktails.json
# в отдельный кластер F:\Helios\drinkers\.pgdata (локальный пароль postgres не нужен, auth=trust).
set -e

PG="/c/Program Files/PostgreSQL/18/bin"
DATA="F:/Helios/drinkers/.pgdata"
DB_URL="postgres://postgres@127.0.0.1:5499/drinkers"
ROOT="$(cd "$(dirname "$0")" && pwd)"

if ! "$PG/psql" -h 127.0.0.1 -p 5499 -U postgres -c "select 1" >/dev/null 2>&1; then
  echo "→ поднимаю PostgreSQL на порту 5499"
  "$PG/pg_ctl" -D "$DATA" -l "$DATA/server.log" \
    -o "-p 5499 -c listen_addresses=127.0.0.1" start >/dev/null
  sleep 3
fi

echo "→ API на http://127.0.0.1:4000"
(cd "$ROOT/backend" && DATABASE_URL="$DB_URL" \
  ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}" \
  ADMIN_SECRET="${ADMIN_SECRET:-local-dev-secret}" \
  ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173" \
  node api.js &) 

echo "→ фронтенд на http://127.0.0.1:5173"
cd "$ROOT/frontend" && npm run dev -- --host 127.0.0.1 --port 5173
