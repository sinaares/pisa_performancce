#!/usr/bin/env bash
set -e

echo "=== PISA Performance Backend Startup ==="

# Check required environment variables
REQUIRED_VARS=(
  "SUPABASE_URL"
  "SUPABASE_KEY"
  "SUPABASE_JWT_SECRET"
)

missing=0
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "ERROR: Required environment variable $var is not set."
    missing=1
  fi
done

if [ "$missing" -eq 1 ]; then
  echo "Exiting due to missing environment variables."
  exit 1
fi

# Optional vars
if [ -z "$GROQ_API_KEY" ]; then
  echo "WARNING: GROQ_API_KEY is not set. Chat AI responses will be disabled."
fi

# Check DB connection
echo "Checking Supabase connection..."
python -c "
from app.database import get_supabase
try:
    sb = get_supabase()
    sb.table('teachers').select('id').limit(1).execute()
    print('Database connection: OK')
except Exception as e:
    print(f'Database connection: FAILED ({e})')
    exit(1)
"

echo "Starting uvicorn..."
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "${PORT:-8000}" \
  --workers "${WORKERS:-1}"
