from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password, oauth2_scheme
from app.db.session import get_db
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, User as UserSchema
from app.utils.audit import create_audit_log

# Rate limiter to prevent brute force attacks
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()

@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(*, request: Request, db: Session = Depends(get_db), user_in: UserCreate) -> Any:
    """Register a new user."""
    # Check if user with this email already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )
    
    # Check if user with this username already exists
    user = db.query(User).filter(User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists",
        )
    
    # Create new user
    db_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create audit log
    create_audit_log(
        db=db,
        user_id=db_user.id,
        action="register",
        resource_type="user",
        resource_id=str(db_user.id),
    )
    
    return db_user

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(
    request: Request, db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """Login and get access token."""
    # Try to find user by email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # If not found by email, try username
    if not user:
        user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )
    
    # Create audit log
    create_audit_log(
        db=db,
        user_id=user.id,
        action="login",
        resource_type="user",
        resource_id=str(user.id),
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(token: str = Depends(oauth2_scheme)) -> Any:
    """Logout and invalidate token."""
    from app.core.security import add_token_to_blacklist
    
    # Add token to blacklist
    add_token_to_blacklist(token)
    
    return {"message": "Successfully logged out"}
