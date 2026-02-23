"""Add supplements and supplement_logs tables.

Revision ID: 20260223_0003
Revises: 20260223_0002
Create Date: 2026-02-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers
revision = '20260223_0003'
down_revision = '20260223_0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'supplements',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('brand', sa.String(100), nullable=True),
        sa.Column('dosage', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'name', name='uq_supplements_user_name'),
    )

    op.create_table(
        'supplement_logs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('supplement_id', UUID(as_uuid=True), sa.ForeignKey('supplements.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('log_date', sa.Date(), nullable=False),
        sa.Column('taken', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('supplement_id', 'log_date', name='uq_supplement_logs_supplement_date'),
    )


def downgrade() -> None:
    op.drop_table('supplement_logs')
    op.drop_table('supplements')
