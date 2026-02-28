"""Add cheat_days table.

Revision ID: 20260228_0001
Revises: 20260224_0001
Create Date: 2026-02-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = '20260228_0001'
down_revision = '20260224_0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'cheat_days',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('cheat_date', sa.Date(), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'cheat_date', name='uq_cheat_days_user_date'),
    )


def downgrade() -> None:
    op.drop_table('cheat_days')
