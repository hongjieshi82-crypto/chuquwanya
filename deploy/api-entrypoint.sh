#!/bin/sh
set -eu

if [ "${API_STARTUP_MIGRATIONS:-true}" = "true" ]; then
  attempt=1
  max_attempts="${DB_MIGRATION_MAX_ATTEMPTS:-12}"

  until node dist/scripts/migrate.js; do
    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "Database migration failed after ${max_attempts} attempts" >&2
      exit 1
    fi

    echo "Database is not ready; retrying migration (${attempt}/${max_attempts})" >&2
    attempt=$((attempt + 1))
    sleep 5
  done
fi

exec node dist/src/server.js
