"""Initial schema — all core tables

Revision ID: 001
Revises:
Create Date: 2026-09-08
"""

from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "expense_categories",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("spending_cap", sa.Numeric(10, 2), nullable=False),
        sa.Column("receipt_exemption_threshold", sa.Numeric(10, 2), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )

    op.create_table(
        "policy_rules",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("rule_type", sa.String(50), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("threshold_value", sa.Numeric(10, 2), nullable=True),
        sa.Column("enforcement_action", sa.String(20), nullable=False),
        sa.Column(
            "category_id",
            sa.UUID(),
            sa.ForeignKey("expense_categories.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    op.create_table(
        "expense_claims",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("employee_id", sa.UUID(), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("expense_date", sa.Date(), nullable=False),
        sa.Column(
            "category_id",
            sa.UUID(),
            sa.ForeignKey("expense_categories.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("merchant_name", sa.String(255), nullable=False),
        sa.Column("receipt_path", sa.String(500), nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="submitted"),
        sa.Column(
            "submitted_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("reviewed_by", sa.UUID(), nullable=True),
        sa.Column("reviewed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "parent_claim_id",
            sa.UUID(),
            sa.ForeignKey("expense_claims.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    op.create_table(
        "violation_flags",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column(
            "claim_id",
            sa.UUID(),
            sa.ForeignKey("expense_claims.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "rule_id",
            sa.UUID(),
            sa.ForeignKey("policy_rules.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("status", sa.String(30), nullable=False, server_default="active"),
        sa.Column(
            "raised_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("resolved_by", sa.UUID(), nullable=True),
        sa.Column("resolved_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("resolution_note", sa.Text(), nullable=True),
    )

    op.create_table(
        "approval_decisions",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column(
            "claim_id",
            sa.UUID(),
            sa.ForeignKey("expense_claims.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("actor_id", sa.UUID(), nullable=False),
        sa.Column("action", sa.String(30), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "decided_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("recipient_id", sa.UUID(), nullable=False),
        sa.Column(
            "claim_id",
            sa.UUID(),
            sa.ForeignKey("expense_claims.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(30), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # Indexes for common queries
    op.create_index("ix_expense_claims_employee_date", "expense_claims", ["employee_id", "expense_date"])
    op.create_index("ix_expense_claims_status", "expense_claims", ["status"])
    op.create_index("ix_violation_flags_status_raised", "violation_flags", ["status", "raised_at"])
    op.create_index("ix_policy_rules_type_enabled", "policy_rules", ["rule_type", "is_enabled", "updated_at"])


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("approval_decisions")
    op.drop_table("violation_flags")
    op.drop_table("expense_claims")
    op.drop_table("policy_rules")
    op.drop_table("expense_categories")
