from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.deps import get_db, require_manager
from backend.src.api.schemas import ClaimResponse, DecisionRequest
from backend.src.models.user import CurrentUser
from backend.src.services.claim_service import ClaimService

router = APIRouter(tags=["manager"])

_claim_service = ClaimService()


@router.get("/claims", response_model=list[ClaimResponse])
async def get_review_queue(
    current_user: CurrentUser = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await _claim_service.get_manager_queue(current_user.id, db)


@router.post("/claims/{claim_id}/decision", response_model=ClaimResponse)
async def decide_claim(
    claim_id: UUID,
    body: DecisionRequest,
    current_user: CurrentUser = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await _claim_service.decide_claim(claim_id, current_user.id, body.action, body.note, db)
