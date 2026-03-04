"""Rename coach personas from named individuals to archetypes.

Revision ID: 20260304_0001
Revises: 20260228_0001
Create Date: 2026-03-04
"""
from alembic import op


# revision identifiers
revision = '20260304_0001'
down_revision = '20260228_0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Map old coach types to new archetype keys
    op.execute(
        "UPDATE user_settings SET coach_type = 'old_school' "
        "WHERE coach_type = 'arnold'"
    )
    op.execute(
        "UPDATE user_settings SET coach_type = 'strategic' "
        "WHERE coach_type = 'jay_cutler'"
    )
    op.execute(
        "UPDATE user_settings SET coach_type = 'relentless' "
        "WHERE coach_type IN ('cam_hanes', 'goggins')"
    )

    # Update server default for new users
    op.alter_column(
        'user_settings', 'coach_type',
        server_default='old_school'
    )

    # Clear all cached insights (old prompts, old coach types)
    op.execute("DELETE FROM coach_insights")


def downgrade() -> None:
    op.execute(
        "UPDATE user_settings SET coach_type = 'arnold' "
        "WHERE coach_type = 'old_school'"
    )
    op.execute(
        "UPDATE user_settings SET coach_type = 'jay_cutler' "
        "WHERE coach_type = 'strategic'"
    )
    op.execute(
        "UPDATE user_settings SET coach_type = 'cam_hanes' "
        "WHERE coach_type = 'relentless'"
    )
    op.execute(
        "UPDATE user_settings SET coach_type = 'arnold' "
        "WHERE coach_type IN ('functional', 'wellness')"
    )
    op.alter_column(
        'user_settings', 'coach_type',
        server_default='arnold'
    )
    op.execute("DELETE FROM coach_insights")
