import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Numeric, String, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from backend.src.db.session import Base


class RuleType(str, Enum):
    spending_cap = "spending_cap"
    receipt_required = "receipt_required"
    weekend_policy = "weekend_policy"
    duplicate_detection = "duplicate_detection"
    auto_approve_threshold = "auto_approve_threshold"
    retroactive_submission = "retroactive_submission"


class EnforcementAction(str, Enum):
    reject = "reject"
    flag = "flag"
    require_review = "require_review"


class PolicyRule(Base):
    __tablename__ = "policy_rules"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    rule_type: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    threshold_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    enforcement_action: Mapped[str] = mapped_column(String(20), nullable=False)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("expense_categories.id", ondelete="SET NULL"), nullable=True
    )
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
