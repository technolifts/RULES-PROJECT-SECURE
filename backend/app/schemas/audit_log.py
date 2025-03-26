from datetime import datetime
from typing import Dict, Optional, Any
from uuid import UUID
from pydantic import BaseModel

class AuditLog(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime
    
    class Config:
        orm_mode = True
