import os


def test_verification_migration_exists():
    """Ensure there is an Alembic migration that adds the verification rate-limit fields."""
    versions_dir = os.path.join(os.path.dirname(
        __file__), '..', 'migrations', 'versions')
    # normalize path
    versions_dir = os.path.normpath(versions_dir)
    files = os.listdir(versions_dir)
    found = any(f.startswith('f3e4d5c6b7a8') for f in files)
    assert found, "Missing Alembic migration for verification rate limit fields (f3e4d5c6b7a8)"
