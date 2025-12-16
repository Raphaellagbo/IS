Email Prioritizer App

Recent security & UX improvements:

- Require current password for email changes (re-auth) and rate-limit verification resend.
- Email verification tokens expire (24h); client shows expiry notices and can request resend (rate-limited: 1/min, 5/hour).
- Password policy hardened: min 10 chars, must include uppercase, lowercase, digit, and special character. Client-side strength meter added.
- Password reset via email: request link and reset securely (1 hour expiry).
- Password change sends confirmation email.
- Tests added covering password reset, verification rate-limiting, and re-auth flows.
- CI updated: flake8 linting and coverage reporting (Codecov optional).

See tests in `tests/` and scripts in `scripts/` for usage examples.

---

## Database migrations 🔧

This project uses Alembic (via Flask-Migrate) for schema migrations. A migration adding verification rate-limit fields to `User` has been added:

- `migrations/versions/f3e4d5c6b7a8_add_verification_rate_limit_fields.py` — adds `verification_sent_count` and `last_verification_sent_at` fields.

To apply migrations locally:

On PowerShell:

```
$env:FLASK_APP='app.py'
env\Scripts\flask db upgrade
```

Or on CMD:

```
set FLASK_APP=app.py && env\Scripts\flask db upgrade
```

In production, run the same commands on your server and ensure you have backups before applying schema changes.
