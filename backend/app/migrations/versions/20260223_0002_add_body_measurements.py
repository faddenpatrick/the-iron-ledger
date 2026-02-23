"""Add body_measurements table for weight tracking.

Revision ID: 20260223_0002
Revises: 20260223_0001
Create Date: 2026-02-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers
revision = '20260223_0002'
down_revision = '20260223_0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'body_measurements',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('measurement_date', sa.Date(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'measurement_date', name='uq_body_measurements_user_date'),
    )


def downgrade() -> None:
    op.drop_table('body_measurements')
