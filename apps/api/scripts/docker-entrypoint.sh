#!/bin/sh
set -e

# Run database migrations before starting the server.
# dbmate reads DATABASE_URL from the DBMATE_DATABASE_URL env var, or we pass it via -e.
echo "Running database migrations..."
dbmate --url "$DATABASE_URL" --no-dump-schema up

echo "Starting server..."
exec "$@"
