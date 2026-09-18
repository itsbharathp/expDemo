from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.deps import require_employee
from backend.src.api.schemas import ClaimResponse
from backend.src.db.session import get_db
from backend.src.models.user import CurrentUser
from backend.src.services.claim_service import ClaimService
from backend.src.services.receipt_store import ReceiptStore

router = APIRouter(tags=["claims"])
_claim_svc = ClaimService()
_receipt_store = ReceiptStore()


@router.post("/", response_model=ClaimResponse)
async def submit_claim(
    amount: float = Form(...),
    currency: str = Form(default="USD"),
    expense_date: date = Form(...),
    category_id: UUID = Form(...),
    merchant_name: str = Form(...),
    receipt: Optional[UploadFile] = File(None),
    current_user: CurrentUser = Depends(require_employee),
    db: AsyncSession = Depends(get_db),
) -> ClaimResponse:
    receipt_path: Optional[str] = None
    if receipt and receipt.filename:
        receipt_path = await _receipt_store.save(receipt)

    claim = await _claim_svc.submit_claim(
        employee_id=current_user.id,
        manager_id=current_user.manager_id,
        amount=Decimal(str(amount)),
        currency=currency,
        expense_date=expense_date,
        category_id=category_id,
        merchant_name=merchant_name,
        receipt_path=receipt_path,
        db=db,
    )
    return ClaimResponse.model_validate(claim)


@router.get("/{claim_id}", response_model=ClaimResponse)
async def get_claim(
    claim_id: UUID,
    current_user: CurrentUser = Depends(require_employee),
    db: AsyncSession = Depends(get_db),
) -> ClaimResponse:
    claim = await _claim_svc.get_claim(
        claim_id=claim_id, employee_id=current_user.id, db=db
    )
    return ClaimResponse.model_validate(claim)
