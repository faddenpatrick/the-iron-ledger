"""add lifting cardio split

Revision ID: 0003
Revises: 0002
Create Date: 2026-02-15

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260215_0002'
down_revision = '20260215_0001'
branch_labels = None
depends_on = None


def upgrade():
    # Add workout_type to workouts table
    op.add_column('workouts', sa.Column('workout_type', sa.String(length=20), nullable=False, server_default='lifting'))
    op.create_index('ix_workouts_workout_type', 'workouts', ['workout_type'])

    # Add set tracking fields to sets table
    op.add_column('sets', sa.Column('set_type', sa.String(length=20), nullable=False, server_default='normal'))
    op.add_column('sets', sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('sets', sa.Column('completed_at', sa.DateTime(), nullable=True))

    # Add workout_type to workout_templates table
    op.add_column('workout_templates', sa.Column('workout_type', sa.String(length=20), nullable=False, server_default='lifting'))
    op.create_index('ix_workout_templates_workout_type', 'workout_templates', ['workout_type'])

    # Create composite index for previous performance queries
    op.create_index(
        'ix_sets_user_workout_exercise',
        'sets',
        ['workout_id', 'exercise_id'],
        postgresql_using='btree'
    )


def downgrade():
    # Drop indexes
    op.drop_index('ix_sets_user_workout_exercise', table_name='sets')
    op.drop_index('ix_workout_templates_workout_type', table_name='workout_templates')
    op.drop_index('ix_workouts_workout_type', table_name='workouts')

    # Remove columns from workout_templates
    op.drop_column('workout_templates', 'workout_type')

    # Remove columns from sets
    op.drop_column('sets', 'completed_at')
    op.drop_column('sets', 'is_completed')
    op.drop_column('sets', 'set_type')

    # Remove columns from workouts
    op.drop_column('workouts', 'workout_type')
