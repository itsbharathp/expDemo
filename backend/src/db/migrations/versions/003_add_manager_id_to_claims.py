"""Migration 003: add manager_id to expense_claims for correct queue scoping.

Revision ID: 003
Revises: 002
Create Date: 2026-09-18

Why: Fix #60 — get_manager_queue previously returned ALL pending claims
     company-wide. Adding manager_id (populated from the employee's JWT at
     submission time) allows the queue to be scoped to a manager's direct
     reports only.
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "expense_claims",
        sa.Column(
            "manager_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("expense_claims", "manager_id")
