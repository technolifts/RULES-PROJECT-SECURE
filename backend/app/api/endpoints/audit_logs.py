from typing import Any, List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLog as AuditLogSchema

router = APIRouter()

@router.get("/", response_model=List[AuditLogSchema])
def read_audit_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[UUID] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Any:
    """
    Retrieve audit logs.
    Only admin users can see all logs, regular users can only see their own logs.
    """
    # Check if user is admin (for demonstration, we'll consider the first user as admin)
    is_admin = db.query(User).order_by(User.created_at).first().id == current_user.id
    
    query = db.query(AuditLog)
    
    # Regular users can only see their own logs
    if not is_admin:
        query = query.filter(AuditLog.user_id == current_user.id)
    
    # Apply filters
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    if resource_id:
        query = query.filter(AuditLog.resource_id == resource_id)
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)
    
    # Order by timestamp descending (newest first)
    query = query.order_by(AuditLog.timestamp.desc())
    
    # Paginate results
    logs = query.offset(skip).limit(limit).all()
    
    return logs

@router.get("/summary", response_model=dict)
def get_audit_log_summary(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(7, ge=1, le=30),
) -> Any:
    """
    Get a summary of audit logs for the specified number of days.
    """
    # Check if user is admin
    is_admin = db.query(User).order_by(User.created_at).first().id == current_user.id
    
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get action counts
    action_counts = {}
    actions = db.query(AuditLog.action, db.func.count(AuditLog.id))\
        .filter(AuditLog.timestamp >= start_date)\
        .group_by(AuditLog.action)\
        .all()
    
    for action, count in actions:
        action_counts[action] = count
    
    # Get resource type counts
    resource_counts = {}
    resources = db.query(AuditLog.resource_type, db.func.count(AuditLog.id))\
        .filter(AuditLog.timestamp >= start_date)\
        .group_by(AuditLog.resource_type)\
        .all()
    
    for resource, count in resources:
        resource_counts[resource] = count
    
    # Get user activity
    user_activity = {}
    users = db.query(AuditLog.user_id, db.func.count(AuditLog.id))\
        .filter(AuditLog.timestamp >= start_date)\
        .filter(AuditLog.user_id != None)\
        .group_by(AuditLog.user_id)\
        .all()
    
    for user_id, count in users:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user_activity[user.username] = count
    
    return {
        "period": f"{days} days",
        "total_events": sum(action_counts.values()),
        "actions": action_counts,
        "resources": resource_counts,
        "user_activity": user_activity,
    }
