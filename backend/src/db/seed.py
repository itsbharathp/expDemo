"""Seed default categories and policy rules. Run: python -m backend.src.db.seed"""
import asyncio
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select

from backend.src.db.session import AsyncSessionLocal
from backend.src.models.expense_category import ExpenseCategory
from backend.src.models.policy_rule import EnforcementAction, PolicyRule, RuleType

CATEGORIES = [
    {"name": "Meal", "spending_cap": Decimal("25.00"), "receipt_exemption_threshold": None},
    {"name": "Travel", "spending_cap": Decimal("500.00"), "receipt_exemption_threshold": Decimal("50.00")},
    {"name": "Accommodation", "spending_cap": Decimal("300.00"), "receipt_exemption_threshold": Decimal("100.00")},
    {"name": "Other", "spending_cap": Decimal("200.00"), "receipt_exemption_threshold": Decimal("25.00")},
]

POLICY_RULES = [
    {
        "rule_type": RuleType.auto_approve_threshold,
        "name": "Auto-Approve Threshold",
        "threshold_value": Decimal("50.00"),
        "enforcement_action": EnforcementAction.flag,
        "is_enabled": True,
    },
    {
        "rule_type": RuleType.weekend_policy,
        "name": "Weekend Policy",
        "threshold_value": None,
        "enforcement_action": EnforcementAction.require_review,
        "is_enabled": True,
    },
    {
        "rule_type": RuleType.duplicate_detection,
        "name": "Duplicate Detection (7 days)",
        "threshold_value": None,
        "enforcement_action": EnforcementAction.flag,
        "is_enabled": True,
    },
    {
        "rule_type": RuleType.retroactive_submission,
        "name": "90-Day Retroactive Limit",
        "threshold_value": Decimal("90"),
        "enforcement_action": EnforcementAction.reject,
        "is_enabled": True,
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        for cat_data in CATEGORIES:
            result = await db.execute(
                select(ExpenseCategory).where(ExpenseCategory.name == cat_data["name"])
            )
            if not result.scalar_one_or_none():
                db.add(ExpenseCategory(**cat_data))

        for rule_data in POLICY_RULES:
            result = await db.execute(
                select(PolicyRule).where(PolicyRule.rule_type == rule_data["rule_type"])
            )
            if not result.scalar_one_or_none():
                db.add(PolicyRule(id=uuid.uuid4(), updated_at=datetime.now(timezone.utc), **rule_data))

        await db.commit()
        print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
