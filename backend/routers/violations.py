"""Violation management routes."""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Violation
from schemas import ViolationResponse, ViolationListResponse

router = APIRouter(prefix="/api/violations", tags=["Violations"])


@router.get("", response_model=ViolationListResponse)
def list_violations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    violation_type: str = Query(None),
    resolved: bool = Query(None),
    db: Session = Depends(get_db),
):
    """List all violations with filtering."""
    q = db.query(Violation)

    if violation_type:
        q = q.filter(Violation.violation_type == violation_type)
    if resolved is not None:
        q = q.filter(Violation.resolved == resolved)

    total = q.count()
    items = (
        q.order_by(Violation.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ViolationListResponse(items=items, total=total)


@router.get("/{violation_id}", response_model=ViolationResponse)
def get_violation(violation_id: int, db: Session = Depends(get_db)):
    """Get a specific violation."""
    v = db.query(Violation).filter(Violation.id == violation_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Violation not found")
    return v


@router.patch("/{violation_id}/resolve")
def resolve_violation(violation_id: int, db: Session = Depends(get_db)):
    """Mark a violation as resolved."""
    v = db.query(Violation).filter(Violation.id == violation_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Violation not found")
    v.resolved = True
    db.commit()
    return {"message": "Violation resolved"}


@router.get("/stats/summary")
def violation_stats(db: Session = Depends(get_db)):
    """Get violation summary statistics."""
    total = db.query(func.count(Violation.id)).scalar() or 0
    resolved = db.query(func.count(Violation.id)).filter(Violation.resolved == True).scalar() or 0
    pending = total - resolved

    by_type = (
        db.query(Violation.violation_type, func.count(Violation.id))
        .group_by(Violation.violation_type)
        .all()
    )

    return {
        "total": total,
        "resolved": resolved,
        "pending": pending,
        "by_type": {t: c for t, c in by_type},
    }
