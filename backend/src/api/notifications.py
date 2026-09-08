from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.deps import get_current_user
from backend.src.db.session import get_db
from backend.src.api.schemas import NotificationResponse
from backend.src.models.notification import Notification
from backend.src.models.user import CurrentUser

router = APIRouter(tags=["notifications"])


@router.get("/", response_model=list[NotificationResponse])
async def get_notifications(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification)
        .where(
            Notification.recipient_id == current_user.id,
            Notification.is_read == False,  # noqa: E712
        )
        .order_by(Notification.created_at.desc())
    )
    return list(result.scalars().all())


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    notification.is_read = True
    await db.commit()
    return {"status": "ok"}
