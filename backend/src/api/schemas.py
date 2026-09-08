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


class DecisionRequest(BaseModel):
    action: str
    note: Optional[str] = None


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recipient_id: UUID
    claim_id: UUID
    event_type: str
    message: str
    is_read: bool
    created_at: datetime


class WeekendExceptionRequest(BaseModel):
    employee_id: UUID
    date_from: date
    date_to: date


class WeekendExceptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    employee_id: UUID
    date_from: date
    date_to: date
    approved_by: UUID
    created_at: datetime


class ClearFlagRequest(BaseModel):
    resolution_note: str


class PolicyRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    rule_type: str
    name: str
    threshold_value: Optional[Decimal]
    enforcement_action: str
    category_id: Optional[UUID]
    is_enabled: bool
    updated_at: datetime


class PolicyRuleUpdateRequest(BaseModel):
    threshold_value: Optional[Decimal] = None
    enforcement_action: Optional[str] = None
    is_enabled: Optional[bool] = None
