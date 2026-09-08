"""Local dev bootstrap: create tables + seed data using SQLite."""
import asyncio, os, sys, uuid
from decimal import Decimal
from datetime import datetime, timezone

# Point at project root so imports resolve
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./expense.db")
os.environ.setdefault("SECRET_KEY", "demo-secret-key-32-chars-long-ok")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("RECEIPT_STORAGE_PATH", "./receipts")

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select, text

# Import Base and all models so metadata is populated
from backend.src.db.session import Base
import backend.src.models.expense_category  # noqa
import backend.src.models.policy_rule       # noqa
import backend.src.models.expense_claim     # noqa
import backend.src.models.violation_flag    # noqa
import backend.src.models.approval_decision # noqa
import backend.src.models.notification      # noqa
import backend.src.models.weekend_exception # noqa

from backend.src.models.expense_category import ExpenseCategory
from backend.src.models.policy_rule import PolicyRule, RuleType, EnforcementAction

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_async_engine(DATABASE_URL, echo=False)
Session = async_sessionmaker(engine, expire_on_commit=False)

CATEGORIES = [
    {"name": "Meal",          "spending_cap": Decimal("25.00"),  "receipt_exemption_threshold": None},
    {"name": "Travel",        "spending_cap": Decimal("500.00"), "receipt_exemption_threshold": Decimal("50.00")},
    {"name": "Accommodation", "spending_cap": Decimal("300.00"), "receipt_exemption_threshold": Decimal("100.00")},
    {"name": "Other",         "spending_cap": Decimal("200.00"), "receipt_exemption_threshold": Decimal("25.00")},
]

POLICY_RULES = [
    {"rule_type": RuleType.auto_approve_threshold, "name": "Auto-Approve Threshold ($50)",  "threshold_value": Decimal("50.00"),  "enforcement_action": EnforcementAction.flag,           "is_enabled": True},
    {"rule_type": RuleType.weekend_policy,         "name": "Weekend Policy",                "threshold_value": None,              "enforcement_action": EnforcementAction.require_review, "is_enabled": True},
    {"rule_type": RuleType.duplicate_detection,    "name": "Duplicate Detection (7 days)",  "threshold_value": None,              "enforcement_action": EnforcementAction.flag,           "is_enabled": True},
    {"rule_type": RuleType.retroactive_submission, "name": "90-Day Retroactive Limit",      "threshold_value": Decimal("90"),     "enforcement_action": EnforcementAction.reject,         "is_enabled": True},
    {"rule_type": RuleType.spending_cap,           "name": "Category Spending Cap",         "threshold_value": None,              "enforcement_action": EnforcementAction.reject,         "is_enabled": True},
    {"rule_type": RuleType.receipt_required,       "name": "Receipt Required",              "threshold_value": None,              "enforcement_action": EnforcementAction.reject,         "is_enabled": True},
]

async def main():
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Tables created")

    async with Session() as db:
        for cat_data in CATEGORIES:
            r = await db.execute(select(ExpenseCategory).where(ExpenseCategory.name == cat_data["name"]))
            if not r.scalar_one_or_none():
                db.add(ExpenseCategory(id=uuid.uuid4(), **cat_data))
        for rule_data in POLICY_RULES:
            r = await db.execute(select(PolicyRule).where(PolicyRule.rule_type == rule_data["rule_type"]))
            if not r.scalar_one_or_none():
                db.add(PolicyRule(id=uuid.uuid4(), updated_at=datetime.now(timezone.utc), **rule_data))
        await db.commit()
    print("✓ Seed data inserted (4 categories, 6 policy rules)")
    print("✓ Bootstrap complete — run: PYTHONPATH=. .venv/bin/uvicorn backend.src.main:app --reload --port 8000")

asyncio.run(main())
