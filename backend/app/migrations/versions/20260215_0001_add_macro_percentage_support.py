"""add macro percentage support

Revision ID: 20260215_0001
Revises: 20240214_0001
Create Date: 2026-02-15

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260215_0001'
down_revision = '20240214_0001'
branch_labels = None
depends_on = None


def upgrade():
    # Add macro percentage columns to user_settings table
    op.add_column('user_settings', sa.Column('macro_input_mode', sa.String(length=20), nullable=False, server_default='grams'))
    op.add_column('user_settings', sa.Column('macro_percentage_protein', sa.Integer(), nullable=True))
    op.add_column('user_settings', sa.Column('macro_percentage_carbs', sa.Integer(), nullable=True))
    op.add_column('user_settings', sa.Column('macro_percentage_fat', sa.Integer(), nullable=True))


def downgrade():
    # Remove macro percentage columns
    op.drop_column('user_settings', 'macro_percentage_fat')
    op.drop_column('user_settings', 'macro_percentage_carbs')
    op.drop_column('user_settings', 'macro_percentage_protein')
    op.drop_column('user_settings', 'macro_input_mode')
