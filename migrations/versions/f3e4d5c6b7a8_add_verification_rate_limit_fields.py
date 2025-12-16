"""add verification rate limit fields

Revision ID: f3e4d5c6b7a8
Revises: c3d4e5f6a7b8_add_email_confirm_fields
Create Date: 2025-12-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f3e4d5c6b7a8'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    existing = [row[1] for row in conn.execute(
        sa.text("PRAGMA table_info('user')")).fetchall()]
    if 'verification_sent_count' not in existing:
        op.add_column('user', sa.Column('verification_sent_count',
                      sa.Integer(), nullable=False, server_default='0'))
    if 'last_verification_sent_at' not in existing:
        op.add_column('user', sa.Column(
            'last_verification_sent_at', sa.DateTime(), nullable=True))


def downgrade():
    # Drop the added columns
    op.drop_column('user', 'last_verification_sent_at')
    op.drop_column('user', 'verification_sent_count')
