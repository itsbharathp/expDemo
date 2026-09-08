import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models.expense_category import ExpenseCategory
from backend.src.models.expense_claim import ExpenseClaim
from backend.src.models.policy_rule import PolicyRule


class PolicyEngineService:
    _cache: dict[str, Any] = {}
    _cache_checked_at: Optional[datetime] = None

    async def _load_rules(self, db: AsyncSession) -> None:
        result = await db.execute(
            select(PolicyRule).where(PolicyRule.is_enabled == True)  # noqa: E712
        )
        rules = result.scalars().all()
        self._cache = {r.rule_type: r for r in rules}
        self._cache_checked_at = datetime.now(timezone.utc)

    async def _rules(self, db: AsyncSession) -> dict[str, Any]:
        if not self._cache or not self._cache_checked_at:
            await self._load_rules(db)
            return self._cache

        result = await db.execute(
            select(PolicyRule.updated_at)
            .where(PolicyRule.is_enabled == True)  # noqa: E712
            .order_by(PolicyRule.updated_at.desc())
            .limit(1)
        )
        latest = result.scalar_one_or_none()
        if latest and latest.replace(tzinfo=timezone.utc) > self._cache_checked_at:
            await self._load_rules(db)
        return self._cache

    async def evaluate(
        self, claim_data: dict, db: AsyncSession
    ) -> tuple[str, list[dict]]:
        rules = await self._rules(db)
        flags: list[dict] = []

        employee_id: UUID = claim_data["employee_id"]
        amount: Decimal = claim_data["amount"]
        category_id: UUID = claim_data["category_id"]
        expense_date: date = claim_data["expense_date"]
        receipt_path: Optional[str] = claim_data.get("receipt_path")
        merchant_name: str = claim_data["merchant_name"]
        today = date.today()

        # 1. Retroactive submission check
        if (today - expense_date).days > 90:
            return ("reject", [{"rule_type": "retroactive_submission",
                                "message": "Expense date is more than 90 days in the past"}])

        # 2. Spending cap check
        cat_result = await db.execute(
            select(ExpenseCategory).where(ExpenseCategory.id == category_id)
        )
        category = cat_result.scalar_one_or_none()
        if category and amount > category.spending_cap:
            overage = amount - category.spending_cap
            return ("reject", [{"rule_type": "spending_cap",
                                "message": f"Amount exceeds {category.name} cap of "
                                           f"${category.spending_cap:.2f} by ${overage:.2f}"}])

        # 3. Receipt required check
        if category:
            threshold = category.receipt_exemption_threshold
            receipt_required = (threshold is None) or (amount > threshold)
            if receipt_required and receipt_path is None:
                return ("reject", [{"rule_type": "receipt_required",
                                    "message": "A receipt is required for this claim"}])

        # 4. Weekend policy check
        weekday = expense_date.weekday()  # 5=Saturday, 6=Sunday
        if weekday in (5, 6):
            # Check for weekend exception (table may not exist in all envs)
            has_exception = False
            try:
                from backend.src.models.weekend_exception import WeekendException  # noqa: PLC0415
                exc_result = await db.execute(
                    select(WeekendException).where(
                        WeekendException.employee_id == employee_id,
                        WeekendException.date_from <= expense_date,
                        WeekendException.date_to >= expense_date,
                    )
                )
                has_exception = exc_result.scalar_one_or_none() is not None
            except (ImportError, Exception):
                pass

            if not has_exception:
                flags.append({"rule_type": "weekend_policy",
                              "message": "Expense incurred on a weekend requires manager review"})
                return ("require_review", flags)

        # 5. Duplicate detection (7-day window)
        window_start = expense_date - timedelta(days=7)
        dup_result = await db.execute(
            select(ExpenseClaim).where(
                ExpenseClaim.employee_id == employee_id,
                ExpenseClaim.amount == amount,
                ExpenseClaim.merchant_name == merchant_name,
                ExpenseClaim.expense_date >= window_start,
                ExpenseClaim.expense_date <= expense_date,
            )
        )
        if dup_result.scalar_one_or_none() is not None:
            flags.append({"rule_type": "duplicate_detection",
                          "message": "Possible duplicate claim detected within 7 days"})

        # 6. Auto-approve threshold
        if amount <= Decimal("50.00") and not flags:
            return ("approved", [])

        # 7. Default: pending review
        return ("pending_review", flags)
