import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import ForeignKey, String, Text, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.src.db.session import Base


class FlagStatus(str, Enum):
    active = "active"
    under_investigation = "under_investigation"
    cleared = "cleared"


class ViolationFlag(Base):
    __tablename__ = "violation_flags"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("expense_claims.id"), nullable=False
    )
    rule_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("policy_rules.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False, default=FlagStatus.active)
    raised_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    resolved_by: Mapped[Optional[uuid.UUID]] = mapped_column(PGUUID(as_uuid=True), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    resolution_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    claim: Mapped["ExpenseClaim"] = relationship(  # noqa: F821
        "ExpenseClaim", back_populates="violation_flags"
    )
    rule: Mapped["PolicyRule"] = relationship("PolicyRule", lazy="joined")  # noqa: F821
