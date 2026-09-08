from datetime import date, datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.deps import get_current_user, require_admin
from backend.src.api.schemas import (
    PolicyRuleResponse,
    PolicyRuleUpdateRequest,
    WeekendExceptionRequest,
    WeekendExceptionResponse,
)
from backend.src.db.session import get_db
from backend.src.models.policy_rule import PolicyRule
from backend.src.models.weekend_exception import WeekendException

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/weekend-exceptions", response_model=list[WeekendExceptionResponse])
async def list_weekend_exceptions(
    current_user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WeekendException).order_by(WeekendException.date_from)
    )
    return list(result.scalars().all())


@router.post("/weekend-exceptions", response_model=WeekendExceptionResponse, status_code=201)
async def create_weekend_exception(
    body: WeekendExceptionRequest,
    current_user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    exc = WeekendException(
        employee_id=body.employee_id,
        date_from=body.date_from,
        date_to=body.date_to,
        approved_by=current_user.id,
    )
    db.add(exc)
    await db.commit()
    await db.refresh(exc)
    return exc


@router.get("/policy-rules", response_model=list[PolicyRuleResponse])
async def list_policy_rules(
    current_user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PolicyRule))
    return list(result.scalars().all())


@router.patch("/policy-rules/{rule_id}", response_model=PolicyRuleResponse)
async def update_policy_rule(
    rule_id: UUID,
    body: PolicyRuleUpdateRequest,
    current_user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PolicyRule).where(PolicyRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Policy rule not found")
    if body.threshold_value is not None:
        rule.threshold_value = body.threshold_value
    if body.enforcement_action is not None:
        rule.enforcement_action = body.enforcement_action
    if body.is_enabled is not None:
        rule.is_enabled = body.is_enabled
    from datetime import timezone
    from datetime import datetime as dt
    rule.updated_at = dt.now(timezone.utc)
    await db.commit()
    await db.refresh(rule)
    return rule
