"""Add section column to coach_insights for multi-section coaching.

Revision ID: 20260306_0001
Revises: 20260304_0001
Create Date: 2026-03-06
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '20260306_0001'
down_revision = '20260304_0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add section column with default for existing rows
    op.add_column(
        'coach_insights',
        sa.Column('section', sa.String(30), nullable=False, server_default='insight')
    )

    # Drop old unique constraint and add new one including section
    op.drop_constraint('uq_coach_insights_user_date', 'coach_insights', type_='unique')
    op.create_unique_constraint(
        'uq_coach_insights_user_date_section',
        'coach_insights',
        ['user_id', 'insight_date', 'section']
    )


def downgrade() -> None:
    # Remove daily_coaching rows before restoring old constraint
    op.execute("DELETE FROM coach_insights WHERE section != 'insight'")

    op.drop_constraint('uq_coach_insights_user_date_section', 'coach_insights', type_='unique')
    op.create_unique_constraint(
        'uq_coach_insights_user_date',
        'coach_insights',
        ['user_id', 'insight_date']
    )
    op.drop_column('coach_insights', 'section')
