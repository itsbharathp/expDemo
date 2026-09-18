import os
from typing import Callable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from backend.src.models.user import CurrentUser, UserRole

SECRET_KEY = os.environ.get("SECRET_KEY")
# Fix #65: refuse to start with a missing secret key — no insecure default
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is not set. "
        "Set a strong random secret (e.g. `openssl rand -hex 32`) before starting the server."
    )
ALGORITHM = os.environ.get("ALGORITHM", "HS256")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> CurrentUser:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise credentials_exc

    user_id = payload.get("sub")
    role_str = payload.get("role")
    if not user_id or not role_str:
        raise credentials_exc

    try:
        role = UserRole(role_str)
    except ValueError:
        raise credentials_exc

    manager_id_str = payload.get("manager_id")
    return CurrentUser(
        id=UUID(user_id),
        name=payload.get("name", ""),
        role=role,
        manager_id=UUID(manager_id_str) if manager_id_str else None,
        department=payload.get("department"),
    )


def _role_guard(required_role: UserRole) -> Callable:
    async def dependency(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted to {required_role.value} role",
            )
        return user

    return dependency


require_employee = _role_guard(UserRole.employee)
require_manager = _role_guard(UserRole.manager)
require_auditor = _role_guard(UserRole.auditor)
require_admin = _role_guard(UserRole.admin)
