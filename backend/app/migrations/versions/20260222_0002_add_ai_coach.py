"""Add AI coach: coach_type to user_settings, coach_insights table.

Revision ID: 20260222_0002
Revises: 20260222_0001
Create Date: 2026-02-22
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers
revision = '20260222_0002'
down_revision = '20260222_0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add coach_type to user_settings
    op.add_column(
        'user_settings',
        sa.Column('coach_type', sa.String(50), nullable=False, server_default='arnold')
    )

    # Create coach_insights table
    op.create_table(
        'coach_insights',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('coach_type', sa.String(50), nullable=False),
        sa.Column('insight', sa.Text(), nullable=False),
        sa.Column('insight_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'insight_date', name='uq_coach_insights_user_date'),
    )


def downgrade() -> None:
    op.drop_table('coach_insights')
    op.drop_column('user_settings', 'coach_type')
