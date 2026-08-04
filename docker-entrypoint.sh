#!/bin/sh
set -e

# Idempotent: only applies migrations that haven't run yet, safe on every restart.
npx prisma migrate deploy

exec "$@"
