from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

# Shared properties
class DocumentBase(BaseModel):
    description: Optional[str] = None

# Properties to receive via API on creation
class DocumentCreate(DocumentBase):
    pass

# Properties to receive via API on update
class DocumentUpdate(DocumentBase):
    pass

# Properties to return via API
class Document(DocumentBase):
    id: UUID
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True
