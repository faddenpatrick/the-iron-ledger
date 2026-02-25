"""add tally mode to template exercises

Revision ID: 20260224_0001
Revises: 20260223_0003
Create Date: 2026-02-24
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260224_0001'
down_revision = '20260223_0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'template_exercises',
        sa.Column('tally_mode', sa.Boolean(), nullable=False, server_default='false')
    )


def downgrade() -> None:
    op.drop_column('template_exercises', 'tally_mode')
