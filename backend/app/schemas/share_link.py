from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

# Shared properties
class ShareLinkBase(BaseModel):
    document_id: UUID
    expires_at: Optional[datetime] = None

# Properties to receive via API on creation
class ShareLinkCreate(ShareLinkBase):
    pass

# Properties to return via API
class ShareLink(ShareLinkBase):
    id: UUID
    token: str
    is_active: bool
    created_at: datetime
    
    class Config:
        orm_mode = True
