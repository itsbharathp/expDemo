import uuid
from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models.expense_claim import ClaimStatus, ExpenseClaim
from backend.src.models.policy_rule import PolicyRule
from backend.src.models.violation_flag import FlagStatus, ViolationFlag
from backend.src.services.policy_engine import PolicyEngineService

_engine = PolicyEngineService()


class ClaimService:
    async def submit_claim(
        self,
        employee_id: UUID,
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
