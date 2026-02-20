"""Vehicle detection list & search routes."""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from database import get_db
from models import Detection
from schemas import DetectionResponse, DetectionListResponse

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])


@router.get("", response_model=DetectionListResponse)
def list_vehicles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    governorate: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
):
    """List all detected vehicles with filtering and pagination."""
    q = db.query(Detection)

    if status:
        q = q.filter(Detection.status == status)
    if governorate:
        q = q.filter(Detection.governorate == governorate)
    if search:
        q = q.filter(
            or_(
                Detection.plate_number.ilike(f"%{search}%"),
                Detection.plate_number_arabic.ilike(f"%{search}%"),
                Detection.governorate.ilike(f"%{search}%"),
            )
        )

    total = q.count()
    items = (
        q.order_by(Detection.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return DetectionListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/unique")
def unique_plates(db: Session = Depends(get_db)):
    """Get unique plate numbers with best confidence detection."""
    from sqlalchemy import desc

    subq = (
        db.query(
            Detection.plate_number,
            func.max(Detection.confidence).label("best_confidence"),
            func.count(Detection.id).label("count"),
        )
        .group_by(Detection.plate_number)
        .subquery()
    )

    results = (
        db.query(Detection)
        .join(subq, Detection.plate_number == subq.c.plate_number)
        .filter(Detection.confidence == subq.c.best_confidence)
        .order_by(Detection.created_at.desc())
        .all()
    )

    # Deduplicate
    seen = set()
    unique = []
    for r in results:
        if r.plate_number not in seen:
            seen.add(r.plate_number)
            unique.append(r)

    return [DetectionResponse.model_validate(d) for d in unique]


@router.get("/search")
def search_vehicles(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Search vehicles by plate number, Arabic text, or governorate."""
    query = db.query(Detection).filter(
        or_(
            Detection.plate_number.ilike(f"%{q}%"),
            Detection.plate_number_arabic.ilike(f"%{q}%"),
            Detection.governorate.ilike(f"%{q}%"),
        )
    )

    total = query.count()
    items = (
        query.order_by(Detection.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return DetectionListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{detection_id}", response_model=DetectionResponse)
def get_vehicle(detection_id: int, db: Session = Depends(get_db)):
    """Get a specific detection by ID."""
    detection = db.query(Detection).filter(Detection.id == detection_id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    return detection


@router.delete("/{detection_id}")
def delete_vehicle(detection_id: int, db: Session = Depends(get_db)):
    """Delete a detection."""
    detection = db.query(Detection).filter(Detection.id == detection_id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    db.delete(detection)
    db.commit()
    return {"message": "Detection deleted"}


@router.get("/governorates/list")
def list_governorates(db: Session = Depends(get_db)):
    """Get list of all detected governorates."""
    results = (
        db.query(Detection.governorate, func.count(Detection.id).label("count"))
        .filter(Detection.governorate.isnot(None))
        .group_by(Detection.governorate)
        .order_by(func.count(Detection.id).desc())
        .all()
    )
    return [{"governorate": r[0], "count": r[1]} for r in results]
