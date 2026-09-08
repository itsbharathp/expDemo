from dataclasses import dataclass
from enum import Enum
from typing import Optional
from uuid import UUID


class UserRole(str, Enum):
    employee = "employee"
    manager = "manager"
    auditor = "auditor"
    admin = "admin"


@dataclass
class CurrentUser:
    id: UUID
    name: str
    role: UserRole
    manager_id: Optional[UUID] = None
    department: Optional[str] = None
