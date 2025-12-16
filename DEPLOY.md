# Deployment & Migration Checklist

This file documents the safe steps to apply schema migrations and verify verification/resend flows in staging and production.

## Pre-deploy (staging)

1. Take a full backup of the staging DB.
   - Postgres example:
     - pg_dump -Fc -U <dbuser> -h <host> -f /tmp/db_backup_$(date +%F).dump <dbname>
2. Pull latest code and ensure `add-verification-migration` is merged and deployed to the staging host.
3. Run migrations:
   - On the staging host (with virtualenv activated):
     - FLASK_APP=app.py ./env/bin/flask db upgrade
     - Or run `./scripts/deploy-migration.sh staging /path/to/venv` (it prompts for confirmation)
4. Verify columns were added:
   - Check that `verification_sent_count` and `last_verification_sent_at` exist in the `user` table.

## Post-deploy smoke tests (staging)

Run the post-deploy script with a test user:

./scripts/post_deploy_test.sh https://staging.example.com test_user StrongP@ssw0rd

Check server logs for the verification and reset links (if SMTP is not configured in staging).

## Production deploy

1. Take a full backup of production DB (required).
2. Merge PR and deploy code to a maintenance window.
3. Run migrations on production host (same as staging):
   - FLASK_APP=app.py ./env/bin/flask db upgrade
4. Run the post-deploy tests or a limited set of end-to-end tests with a prepared test account.

## Notes
- The verification resend rate-limiting is enforced per-user and may return 429 on too-frequent requests; tests should handle this.
- If SMTP is disabled in staging, verification links are logged to the server logs; you can extract them from logs for manual verification.
- Always ensure DB backups are available and tested before applying schema changes to production.
