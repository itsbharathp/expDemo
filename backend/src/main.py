import os
from typing import List

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.src.api import admin, audit, claims, manager, notifications

app = FastAPI(title="Expense Reimbursement API", version="0.1.0")

ALLOWED_ORIGINS: List[str] = os.environ.get("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(422)
async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": getattr(exc, "errors", lambda: str(exc))()})


@app.get("/health", tags=["Health"])
async def health() -> dict:
    return {"status": "ok"}


api_prefix = "/api/v1"
app.include_router(claims.router, prefix=f"{api_prefix}/claims", tags=["Claims"])
app.include_router(manager.router, prefix=f"{api_prefix}/manager", tags=["Manager"])
app.include_router(audit.router, prefix=f"{api_prefix}/audit", tags=["Audit"])
app.include_router(admin.router, prefix=f"{api_prefix}/admin", tags=["Admin"])
app.include_router(notifications.router, prefix=f"{api_prefix}/notifications", tags=["Notifications"])
