import uuid
from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models.approval_decision import ApprovalDecision, DecisionAction
from backend.src.models.expense_claim import ExpenseClaim
from backend.src.models.violation_flag import FlagStatus, ViolationFlag


class AuditService:
    async def get_flagged_claims(
        self,
        db: AsyncSession,
        violation_type: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        employee_id: Optional[UUID] = None,
    ) -> list[ExpenseClaim]:
        stmt = (
            select(ExpenseClaim)
            .join(ViolationFlag, ViolationFlag.claim_id == ExpenseClaim.id)
            .where(ViolationFlag.status == FlagStatus.active)
        )
        if violation_type:
            from backend.src.models.policy_rule import PolicyRule
            stmt = stmt.join(PolicyRule, PolicyRule.id == ViolationFlag.rule_id).where(
                PolicyRule.rule_type == violation_type
            )
        if date_from:
            stmt = stmt.where(ExpenseClaim.expense_date >= date_from)
        if date_to:
            stmt = stmt.where(ExpenseClaim.expense_date <= date_to)
        if employee_id:
            stmt = stmt.where(ExpenseClaim.employee_id == employee_id)
        stmt = stmt.distinct().order_by(ExpenseClaim.submitted_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def investigate_claim(
        self, claim_id: UUID, actor_id: UUID, db: AsyncSession
    ) -> ViolationFlag:
        result = await db.execute(
            select(ViolationFlag).where(
                ViolationFlag.claim_id == claim_id,
                ViolationFlag.status == FlagStatus.active,
            )
        )
        flag = result.scalar_one_or_none()
        if not flag:
            raise HTTPException(status_code=404, detail="No active violation flag found for this claim")

        flag.status = FlagStatus.under_investigation
        flag.resolved_by = actor_id

        decision = ApprovalDecision(
            id=uuid.uuid4(),
            claim_id=claim_id,
            actor_id=actor_id,
            action=DecisionAction.investigation_started,
        )
        db.add(decision)
        await db.commit()
        await db.refresh(flag)
        return flag

    async def clear_flag(
        self, claim_id: UUID, actor_id: UUID, resolution_note: str, db: AsyncSession
    ) -> ViolationFlag:
        if not resolution_note or not resolution_note.strip():
            raise HTTPException(status_code=422, detail="resolution_note is required to clear a flag")

        result = await db.execute(
            select(ViolationFlag).where(
                ViolationFlag.claim_id == claim_id,
                ViolationFlag.status.in_([FlagStatus.active, FlagStatus.under_investigation]),
            )
        )
        flag = result.scalar_one_or_none()
        if not flag:
            raise HTTPException(status_code=404, detail="No resolvable violation flag found for this claim")

        flag.status = FlagStatus.cleared
        flag.resolution_note = resolution_note
        flag.resolved_by = actor_id
        flag.resolved_at = datetime.now(timezone.utc)

        decision = ApprovalDecision(
            id=uuid.uuid4(),
            claim_id=claim_id,
            actor_id=actor_id,
            action=DecisionAction.flag_cleared,
            note=resolution_note,
        )
        db.add(decision)
        await db.commit()
        await db.refresh(flag)
        return flag
