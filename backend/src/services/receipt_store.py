import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

ALLOWED_TYPES = {"image/jpeg", "image/png", "application/pdf"}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB


class ReceiptStore:
    def __init__(self) -> None:
        self.storage_path = Path(os.getenv("RECEIPT_STORAGE_PATH", "/data/receipts"))

    async def save(self, file: UploadFile) -> str:
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=422,
                detail="Receipt must be a JPEG, PNG, or PDF file",
            )
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=422, detail="Receipt file is empty or unreadable")
        if len(content) > MAX_SIZE:
            raise HTTPException(status_code=422, detail="Receipt file exceeds 10 MB limit")

        self.storage_path.mkdir(parents=True, exist_ok=True)
        filename = file.filename or "upload"
        ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
        dest = self.storage_path / f"{uuid.uuid4()}.{ext}"
        dest.write_bytes(content)
        return str(dest)
