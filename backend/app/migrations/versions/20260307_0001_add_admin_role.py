"""Add is_admin column to users table.

Revision ID: 20260307_0001
Revises: 20260306_0001
Create Date: 2026-03-07
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '20260307_0001'
down_revision = '20260306_0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default=sa.text('false'))
    )


def downgrade() -> None:
    op.drop_column('users', 'is_admin')
