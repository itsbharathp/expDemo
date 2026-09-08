from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ClaimResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    employee_id: UUID
    amount: Decimal
    currency: str
    expense_date: date
    category_id: UUID
    merchant_name: str
    receipt_path: Optional[str]
    status: str
    submitted_at: datetime
