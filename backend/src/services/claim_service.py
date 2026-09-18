import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models.approval_decision import ApprovalDecision, DecisionAction
from backend.src.models.expense_claim import ClaimStatus, ExpenseClaim
from backend.src.models.policy_rule import PolicyRule
from backend.src.models.violation_flag import FlagStatus, ViolationFlag
from backend.src.services.notification_service import NotificationService
from backend.src.services.policy_engine import PolicyEngineService

_engine = PolicyEngineService()


class ClaimService:
    async def submit_claim(
        self,
        employee_id: UUID,
        manager_id: Optional[UUID],
        amount: Decimal,
        currency: str,
        expense_date: date,
        category_id: UUID,
        merchant_name: str,
        receipt_path: Optional[str],
        db: AsyncSession,
    ) -> ExpenseClaim:
        claim_data = {
            "employee_id": employee_id,
            "amount": amount,
            "category_id": category_id,
            "expense_date": expense_date,
            "receipt_path": receipt_path,
            "merchant_name": merchant_name,
        }

        action, flag_dicts = await _engine.evaluate(claim_data, db)

        if action == "reject":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=flag_dicts,
            )

        claim_status = (
            ClaimStatus.approved if action == "approved" else ClaimStatus.pending_review
        )

        claim = ExpenseClaim(
            id=uuid.uuid4(),
            employee_id=employee_id,
            manager_id=manager_id,
            amount=amount,
            currency=currency,
            expense_date=expense_date,
            category_id=category_id,
            merchant_name=merchant_name,
            receipt_path=receipt_path,
            status=claim_status,
        )
        db.add(claim)
        await db.flush()  # get claim.id before creating flags

        for flag_dict in flag_dicts:
            rule_result = await db.execute(
                select(PolicyRule).where(PolicyRule.rule_type == flag_dict["rule_type"])
            )
            rule = rule_result.scalar_one_or_none()
            if rule:
                vf = ViolationFlag(
                    id=uuid.uuid4(),
                    claim_id=claim.id,
                    rule_id=rule.id,
                    status=FlagStatus.active,
                )
                db.add(vf)

        await db.commit()
        await db.refresh(claim)
        return claim

    async def get_claim(
        self, claim_id: UUID, employee_id: UUID, db: AsyncSession
    ) -> ExpenseClaim:
        result = await db.execute(
            select(ExpenseClaim).where(ExpenseClaim.id == claim_id)
        )
        claim = result.scalar_one_or_none()
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        if claim.employee_id != employee_id:
            raise HTTPException(status_code=403, detail="Access denied")
        return claim

    async def get_manager_queue(
        self, manager_id: UUID, db: AsyncSession
    ) -> list[ExpenseClaim]:
        result = await db.execute(
            select(ExpenseClaim)
            .where(
                ExpenseClaim.status == ClaimStatus.pending_review,
                ExpenseClaim.manager_id == manager_id,
            )
            .order_by(ExpenseClaim.submitted_at.asc())
        )
        return list(result.scalars().all())

    async def decide_claim(
        self,
        claim_id: UUID,
        actor_id: UUID,
        action: str,
        note: Optional[str],
        db: AsyncSession,
    ) -> ExpenseClaim:
        result = await db.execute(select(ExpenseClaim).where(ExpenseClaim.id == claim_id))
        claim = result.scalar_one_or_none()
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")

        # Fix #61: verify the acting manager is the one assigned to this claim
        if claim.manager_id != actor_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not the assigned manager for this claim",
            )

        flags_result = await db.execute(
            select(ViolationFlag).where(ViolationFlag.claim_id == claim_id)
        )
        flags = list(flags_result.scalars().all())
        if any(f.status == FlagStatus.under_investigation for f in flags):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Claim is locked under investigation",
            )

        if action not in ("approved", "rejected"):
            raise HTTPException(status_code=422, detail="action must be 'approved' or 'rejected'")
        if action == "rejected" and not note:
            raise HTTPException(status_code=422, detail="note is required when rejecting a claim")

        claim.status = action
        claim.reviewed_by = actor_id
        claim.reviewed_at = datetime.now(timezone.utc)

        decision = ApprovalDecision(
            id=uuid.uuid4(),
            claim_id=claim_id,
            actor_id=actor_id,
            action=action,
            note=note,
        )
        db.add(decision)

        await NotificationService().send(
            recipient_id=claim.employee_id,
            claim_id=claim_id,
            event_type=action,
            message=f"Your expense claim has been {action}." + (f" Reason: {note}" if note else ""),
            db=db,
        )

        await db.commit()
        await db.refresh(claim)
        return claim
