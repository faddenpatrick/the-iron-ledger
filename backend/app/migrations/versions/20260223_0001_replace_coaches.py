"""Replace endurance and wellness coaches with cam_hanes and goggins.

Revision ID: 20260223_0001
Revises: 20260222_0002
Create Date: 2026-02-23
"""
from alembic import op


# revision identifiers
revision = '20260223_0001'
down_revision = '20260222_0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Migrate users who had old coach types to default (arnold)
    op.execute(
        "UPDATE user_settings SET coach_type = 'arnold' "
        "WHERE coach_type IN ('endurance', 'wellness')"
    )

    # Clear cached insights for old coach types
    op.execute(
        "DELETE FROM coach_insights WHERE coach_type IN ('endurance', 'wellness')"
    )


def downgrade() -> None:
    # No action needed — users were just defaulted to arnold
    pass
