"""add target_weight to template_exercises

Revision ID: 20260215_0003
Revises: 20260215_0002
Create Date: 2026-02-15 21:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260215_0003'
down_revision = '20260215_0002'
branch_labels = None
depends_on = None


def upgrade():
    # Add target_weight column to template_exercises
    op.add_column('template_exercises', sa.Column('target_weight', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('template_exercises', 'target_weight')
