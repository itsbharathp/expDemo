import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from sqlalchemy import Date, ForeignKey, Numeric, String, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.src.db.session import Base


class ClaimStatus(str, Enum):
    submitted = "submitted"
    pending_review = "pending_review"
    approved = "approved"
    rejected = "rejected"
    resubmitted = "resubmitted"


class ExpenseClaim(Base):
    __tablename__ = "expense_claims"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    manager_id: Mapped[Optional[uuid.UUID]] = mapped_column(PGUUID(as_uuid=True), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("expense_categories.id"), nullable=False
    )
    merchant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    receipt_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default=ClaimStatus.submitted)
    submitted_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(PGUUID(as_uuid=True), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    parent_claim_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("expense_claims.id"), nullable=True
    )

    category: Mapped["ExpenseCategory"] = relationship(  # noqa: F821
        "ExpenseCategory", lazy="joined"
    )
    violation_flags: Mapped[list["ViolationFlag"]] = relationship(  # noqa: F821
        "ViolationFlag", back_populates="claim", lazy="select"
    )
