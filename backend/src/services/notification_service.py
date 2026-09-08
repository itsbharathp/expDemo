import os
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models.notification import Notification


class NotificationService:
    async def send(
        self,
        recipient_id: UUID,
        claim_id: UUID,
        event_type: str,
        message: str,
        db: AsyncSession,
    ) -> None:
        notification = Notification(
            recipient_id=recipient_id,
            claim_id=claim_id,
            event_type=event_type,
            message=message,
        )
        db.add(notification)

        smtp_host = os.getenv("SMTP_HOST", "")
        if smtp_host:
            # Email delivery via SMTP would be dispatched here via BackgroundTasks
            pass
