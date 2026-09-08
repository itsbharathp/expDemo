from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.deps import require_auditor
from backend.src.api.schemas import ClearFlagRequest, ClaimResponse
from backend.src.db.session import get_db
from backend.src.services.audit_service import AuditService

router = APIRouter(prefix="/audit", tags=["audit"])

_svc = AuditService()


@router.get("/claims", response_model=list[ClaimResponse])
async def get_flagged_claims(
    violation_type: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    employee_id: Optional[UUID] = Query(None),
    current_user=Depends(require_auditor),
    db: AsyncSession = Depends(get_db),
):
    return await _svc.get_flagged_claims(db, violation_type, date_from, date_to, employee_id)


@router.post("/claims/{claim_id}/investigate")
async def investigate_claim(
    claim_id: UUID,
    current_user=Depends(require_auditor),
    db: AsyncSession = Depends(get_db),
):
    flag = await _svc.investigate_claim(claim_id, current_user.id, db)
    return {"status": flag.status}


@router.post("/claims/{claim_id}/clear")
async def clear_flag(
    claim_id: UUID,
    body: ClearFlagRequest,
    current_user=Depends(require_auditor),
    db: AsyncSession = Depends(get_db),
):
    flag = await _svc.clear_flag(claim_id, current_user.id, body.resolution_note, db)
    return {"status": flag.status}
