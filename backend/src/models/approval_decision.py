import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import ForeignKey, String, Text, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.src.db.session import Base


class DecisionAction(str, Enum):
    approved = "approved"
    rejected = "rejected"
    investigation_started = "investigation_started"
    flag_cleared = "flag_cleared"


class ApprovalDecision(Base):
    __tablename__ = "approval_decisions"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("expense_claims.id"), nullable=False
    )
    actor_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    action: Mapped[str] = mapped_column(String(30), nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    claim: Mapped["ExpenseClaim"] = relationship("ExpenseClaim", lazy="select")  # noqa: F821
