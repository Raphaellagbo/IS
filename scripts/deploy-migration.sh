#!/usr/bin/env bash
set -euo pipefail

# Simple helper to apply Alembic migrations with backups and verification.
# Usage: ./scripts/deploy-migration.sh staging|production /path/to/venv

ENV="$1"
VENV="$2"

if [ -z "$ENV" ] || [ -z "$VENV" ]; then
  echo "Usage: $0 <staging|production> <path-to-venv>"
  exit 2
fi

echo "Deploying migrations to $ENV using venv at $VENV"

# 1) Backup DB - user must customize the backup command for their DB type
echo "--- BACKUP STEP ---"
echo "Please run the appropriate DB backup command for your environment before proceeding."
echo "Example (Postgres): pg_dump -Fc -U <dbuser> -h <host> -f /tmp/db_backup_$(date +%F).dump <dbname>"
read -p "Have you taken a backup? (type YES to continue): " answer
if [ "$answer" != "YES" ]; then
  echo "Aborting - please take a backup and re-run the script."
  exit 1
fi

echo "--- RUNNING MIGRATIONS ---"
source "$VENV/bin/activate" || source "$VENV/Scripts/activate"
export FLASK_APP=app.py
flask db upgrade

echo "--- VERIFY MIGRATION ---"
python - <<'PY'
from sqlalchemy import create_engine, text
from app import app
from models import db
engine = db.engine
with engine.connect() as conn:
    res = conn.execute(text("PRAGMA table_info('user')"))
    cols = [r[1] for r in res.fetchall()]
    print('user table columns:', cols)
    if 'verification_sent_count' in cols and 'last_verification_sent_at' in cols:
        print('Migration verification: OK')
    else:
        print('Migration verification: MISSING COLUMNS')
        raise SystemExit(2)
PY

echo "Migrations applied and verified on $ENV."
