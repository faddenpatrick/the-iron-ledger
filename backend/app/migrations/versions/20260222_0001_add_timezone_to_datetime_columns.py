"""add timezone awareness to all datetime columns

Revision ID: 20260222_0001
Revises: 20260215_0003
Create Date: 2026-02-22 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260222_0001'
down_revision = '20260215_0003'
branch_labels = None
depends_on = None

# All tables and their DateTime columns that need timezone awareness
TABLES_COLUMNS = [
    # users
    ('users', 'created_at'),
    ('users', 'updated_at'),
    # user_settings
    ('user_settings', 'created_at'),
    ('user_settings', 'updated_at'),
    # exercises
    ('exercises', 'created_at'),
    ('exercises', 'updated_at'),
    ('exercises', 'deleted_at'),
    # workout_templates
    ('workout_templates', 'created_at'),
    ('workout_templates', 'updated_at'),
    ('workout_templates', 'deleted_at'),
    # workouts
    ('workouts', 'started_at'),
    ('workouts', 'completed_at'),
    ('workouts', 'created_at'),
    ('workouts', 'updated_at'),
    ('workouts', 'deleted_at'),
    # sets
    ('sets', 'completed_at'),
    ('sets', 'created_at'),
    # meal_categories
    ('meal_categories', 'created_at'),
    ('meal_categories', 'updated_at'),
    ('meal_categories', 'deleted_at'),
    # foods
    ('foods', 'created_at'),
    ('foods', 'updated_at'),
    ('foods', 'deleted_at'),
    # meals
    ('meals', 'meal_time'),
    ('meals', 'created_at'),
    ('meals', 'updated_at'),
    ('meals', 'deleted_at'),
    # meal_items
    ('meal_items', 'created_at'),
]


def upgrade():
    for table, column in TABLES_COLUMNS:
        op.alter_column(
            table,
            column,
            type_=sa.DateTime(timezone=True),
            existing_type=sa.DateTime(),
            existing_nullable=True,
        )


def downgrade():
    for table, column in TABLES_COLUMNS:
        op.alter_column(
            table,
            column,
            type_=sa.DateTime(),
            existing_type=sa.DateTime(timezone=True),
            existing_nullable=True,
        )
