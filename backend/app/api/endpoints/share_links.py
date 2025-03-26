import secrets
import uuid
from datetime import datetime, timedelta
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.document import Document
from app.models.share_link import ShareLink
from app.models.user import User
from app.schemas.share_link import ShareLink as ShareLinkSchema, ShareLinkCreate
from app.utils.audit import create_audit_log

router = APIRouter()

@router.post("/", response_model=ShareLinkSchema, status_code=status.HTTP_201_CREATED)
def create_share_link(
    *,
    db: Session = Depends(get_db),
    share_link_in: ShareLinkCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new share link."""
    # Check if document exists and user is the owner
    document = db.query(Document).filter(Document.id == share_link_in.document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    if document.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Generate token
    token = secrets.token_urlsafe(16)
    
    # Create share link
    share_link = ShareLink(
        token=token,
        document_id=share_link_in.document_id,
        expires_at=share_link_in.expires_at,
    )
    db.add(share_link)
    db.commit()
    db.refresh(share_link)
    
    # Create audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="create",
        resource_type="share_link",
        resource_id=str(share_link.id),
        details={"document_id": str(document.id)},
    )
    
    return share_link

@router.get("/", response_model=List[ShareLinkSchema])
def read_share_links(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get all share links for current user's documents."""
    share_links = (
        db.query(ShareLink)
        .join(Document)
        .filter(Document.owner_id == current_user.id)
        .all()
    )
    return share_links

@router.delete("/{share_link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_share_link(
    *,
    db: Session = Depends(get_db),
    share_link_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete a share link."""
    share_link = db.query(ShareLink).filter(ShareLink.id == share_link_id).first()
    if not share_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found",
        )
    
    # Check if user is the owner of the document
    document = db.query(Document).filter(Document.id == share_link.document_id).first()
    if document.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Create audit log before deleting
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="delete",
        resource_type="share_link",
        resource_id=str(share_link.id),
        details={"document_id": str(document.id)},
    )
    
    # Delete share link
    db.delete(share_link)
    db.commit()
    
    return None

@router.get("/public/{token}", response_model=ShareLinkSchema)
def validate_share_link(
    *,
    db: Session = Depends(get_db),
    token: str,
) -> Any:
    """Validate a share link by token."""
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
    
    return share_link
