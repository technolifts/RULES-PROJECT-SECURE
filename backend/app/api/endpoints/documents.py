import os
import uuid
from datetime import datetime
from typing import Any, List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.document import Document
from app.models.share_link import ShareLink
from app.models.user import User
from app.schemas.document import Document as DocumentSchema, DocumentCreate
from app.utils.audit import create_audit_log
from app.utils.files import validate_file, save_file

router = APIRouter()

@router.post("/", response_model=DocumentSchema, status_code=status.HTTP_201_CREATED)
async def create_document(
    *,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    description: str = Form(None),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Upload a new document."""
    # Validate file
    validate_file(file)
    
    # Save file
    filename = f"{uuid.uuid4()}{os.path.splitext(file.filename)[1]}"
    file_path = await save_file(file, filename)
    
    # Create document in database
    document = Document(
        filename=filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=os.path.getsize(file_path),
        mime_type=file.content_type,
        description=description,
        owner_id=current_user.id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Create audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="create",
        resource_type="document",
        resource_id=str(document.id),
    )
    
    return document

@router.get("/", response_model=List[DocumentSchema])
def read_documents(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get all documents for current user."""
    documents = (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return documents

@router.get("/{document_id}", response_model=DocumentSchema)
def read_document(
    *,
    db: Session = Depends(get_db),
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get a specific document."""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    # Check if user is the owner
    if document.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    return document

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    *,
    db: Session = Depends(get_db),
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete a document."""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    # Check if user is the owner
    if document.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Delete file
    try:
        os.remove(document.file_path)
    except OSError:
        pass
    
    # Create audit log before deleting the document
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="delete",
        resource_type="document",
        resource_id=str(document.id),
    )
    
    # Delete document from database
    db.delete(document)
    db.commit()
    
    return None

@router.get("/{document_id}/download")
def download_document(
    *,
    db: Session = Depends(get_db),
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Download a document."""
    from fastapi.responses import FileResponse
    
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    # Check if user is the owner
    if document.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Check if file exists
    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server",
        )
    
    # Create audit log for download
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="download",
        resource_type="document",
        resource_id=str(document.id),
    )
    
    return FileResponse(
        path=document.file_path,
        filename=document.original_filename,
        media_type=document.mime_type,
    )

@router.get("/{document_id}/shared/{token}")
def get_shared_document(
    *,
    db: Session = Depends(get_db),
    document_id: uuid.UUID,
    token: str,
) -> Any:
    """Get document via share link."""
    # Validate share link
    share_link = db.query(ShareLink).filter(ShareLink.token == token).first()
    if not share_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found",
        )
    
    # Check if share link is for this document
    if share_link.document_id != document_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid share link for this document",
        )
    
    # Check if share link is active
    if not share_link.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Share link is inactive",
        )
    
    # Check if share link is expired
    if share_link.expires_at and share_link.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Share link has expired",
        )
    
    # Get document
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    # Create audit log for access via share link
    create_audit_log(
        db=db,
        action="access_via_share",
        resource_type="document",
        resource_id=str(document.id),
        details={"share_link_id": str(share_link.id)},
    )
    
    return document

@router.get("/shared/{token}/download")
def download_shared_document(
    *,
    db: Session = Depends(get_db),
    token: str,
) -> Any:
    """Download document via share link."""
    from fastapi.responses import FileResponse
    
    # Validate share link
    share_link = db.query(ShareLink).filter(ShareLink.token == token).first()
    if not share_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found",
        )
    
    # Check if share link is active
    if not share_link.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Share link is inactive",
        )
    
    # Check if share link is expired
    if share_link.expires_at and share_link.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Share link has expired",
        )
    
    # Get document
    document = db.query(Document).filter(Document.id == share_link.document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    # Check if file exists
    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server",
        )
    
    # Create audit log for download via share link
    create_audit_log(
        db=db,
        action="download_via_share",
        resource_type="document",
        resource_id=str(document.id),
        details={"share_link_id": str(share_link.id)},
    )
    
    return FileResponse(
        path=document.file_path,
        filename=document.original_filename,
        media_type=document.mime_type,
    )
