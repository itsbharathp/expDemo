import logging
import os
import time
from contextlib import asynccontextmanager
from typing import List

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from backend.src.api import admin, audit, claims, manager, notifications
from backend.src.db.session import get_db
from backend.src.models.expense_category import ExpenseCategory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("expense_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fix #65: validate critical env vars at startup before accepting any traffic
    secret_key = os.environ.get("SECRET_KEY")
    if not secret_key:
        raise RuntimeError(
            "SECRET_KEY environment variable is not set. "
            "Set a strong random secret before starting the server."
        )
    logger.info("Startup checks passed.")
    yield


app = FastAPI(title="Expense Reimbursement API", version="0.1.0", lifespan=lifespan)

ALLOWED_ORIGINS: List[str] = os.environ.get("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.monotonic()
    response = await call_next(request)
    duration_ms = round((time.monotonic() - start) * 1000, 1)
    logger.info("%s %s %d %.1fms", request.method, request.url.path, response.status_code, duration_ms)
    return response


@app.exception_handler(422)
async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": getattr(exc, "errors", lambda: str(exc))()})


@app.get("/health", tags=["Health"])
async def health() -> dict:
    return {"status": "ok"}


@app.get("/api/v1/categories", tags=["Categories"])
async def list_categories(db=Depends(get_db)):
    result = await db.execute(select(ExpenseCategory).order_by(ExpenseCategory.name))
    return [{"id": str(c.id), "name": c.name, "spending_cap": str(c.spending_cap)} for c in result.scalars().all()]


api_prefix = "/api/v1"
app.include_router(claims.router, prefix=f"{api_prefix}/claims", tags=["Claims"])
app.include_router(manager.router, prefix=f"{api_prefix}/manager", tags=["Manager"])
app.include_router(audit.router, prefix=f"{api_prefix}", tags=["Audit"])
app.include_router(admin.router, prefix=f"{api_prefix}", tags=["Admin"])
app.include_router(notifications.router, prefix=f"{api_prefix}/notifications", tags=["Notifications"])
