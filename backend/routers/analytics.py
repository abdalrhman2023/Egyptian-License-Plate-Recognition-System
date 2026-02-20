"""Analytics routes — advanced charts and stats."""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Detection, Violation

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview")
def analytics_overview(db: Session = Depends(get_db)):
    """Get high-level analytics overview."""
    total_detections = db.query(func.count(Detection.id)).scalar() or 0
    total_violations = db.query(func.count(Violation.id)).scalar() or 0
    unique_plates = db.query(func.count(func.distinct(Detection.plate_number))).scalar() or 0
    avg_confidence = db.query(func.avg(Detection.confidence)).scalar() or 0

    return {
        "total_detections": total_detections,
        "total_violations": total_violations,
        "unique_plates": unique_plates,
        "average_confidence": round(avg_confidence * 100, 1) if avg_confidence and avg_confidence < 1 else round(avg_confidence, 1) if avg_confidence else 0,
    }


@router.get("/governorate-distribution")
def governorate_distribution(db: Session = Depends(get_db)):
    """Get detection counts by governorate."""
    results = (
        db.query(Detection.governorate, func.count(Detection.id).label("count"))
        .filter(Detection.governorate.isnot(None))
        .group_by(Detection.governorate)
        .order_by(func.count(Detection.id).desc())
        .all()
    )
    return [{"governorate": r[0], "count": r[1]} for r in results]


@router.get("/daily-trend")
def daily_trend(
    days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db),
):
    """Get daily detection/violation trend for the past N days."""
    result = []
    today = datetime.utcnow().date()

    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = day_start + timedelta(days=1)

        vehicles = db.query(func.count(Detection.id)).filter(
            Detection.created_at >= day_start,
            Detection.created_at < day_end,
        ).scalar() or 0

        violations = db.query(func.count(Violation.id)).filter(
            Violation.created_at >= day_start,
            Violation.created_at < day_end,
        ).scalar() or 0

        result.append({
            "date": day.isoformat(),
            "vehicles": vehicles,
            "violations": violations,
        })

    return result


@router.get("/confidence-distribution")
def confidence_distribution(db: Session = Depends(get_db)):
    """Get detection confidence distribution in buckets."""
    buckets = [(0, 0.5), (0.5, 0.6), (0.6, 0.7), (0.7, 0.8), (0.8, 0.9), (0.9, 1.01)]
    result = []

    for low, high in buckets:
        count = db.query(func.count(Detection.id)).filter(
            Detection.confidence >= low,
            Detection.confidence < high,
        ).scalar() or 0
        label = f"{int(low*100)}-{int(high*100)}%"
        if high > 1:
            label = f"{int(low*100)}-100%"
        result.append({"range": label, "count": count})

    return result


@router.get("/top-plates")
def top_plates(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Get most frequently detected plates."""
    results = (
        db.query(
            Detection.plate_number,
            Detection.plate_number_arabic,
            Detection.governorate,
            func.count(Detection.id).label("count"),
            func.max(Detection.confidence).label("best_confidence"),
        )
        .group_by(Detection.plate_number)
        .order_by(func.count(Detection.id).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "plate_number": r[0],
            "plate_number_arabic": r[1],
            "governorate": r[2],
            "detection_count": r[3],
            "best_confidence": round(r[4], 4) if r[4] else 0,
        }
        for r in results
    ]
