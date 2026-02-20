"""Report generation routes."""

import csv
import io
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Detection, Violation

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/summary")
def report_summary(
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """Get a summary report for the past N days."""
    cutoff = datetime.utcnow() - timedelta(days=days)

    total_detections = db.query(func.count(Detection.id)).filter(
        Detection.created_at >= cutoff
    ).scalar() or 0

    unique_plates = db.query(func.count(func.distinct(Detection.plate_number))).filter(
        Detection.created_at >= cutoff
    ).scalar() or 0

    total_violations = db.query(func.count(Violation.id)).filter(
        Violation.created_at >= cutoff
    ).scalar() or 0

    resolved_violations = db.query(func.count(Violation.id)).filter(
        Violation.created_at >= cutoff,
        Violation.resolved == True,
    ).scalar() or 0

    avg_confidence = db.query(func.avg(Detection.confidence)).filter(
        Detection.created_at >= cutoff,
        Detection.confidence.isnot(None),
    ).scalar()

    # Top governorates
    top_gov = (
        db.query(Detection.governorate, func.count(Detection.id))
        .filter(Detection.created_at >= cutoff, Detection.governorate.isnot(None))
        .group_by(Detection.governorate)
        .order_by(func.count(Detection.id).desc())
        .limit(5)
        .all()
    )

    # Violation breakdown
    violation_breakdown = (
        db.query(Violation.violation_type, func.count(Violation.id))
        .filter(Violation.created_at >= cutoff)
        .group_by(Violation.violation_type)
        .all()
    )

    return {
        "period_days": days,
        "total_detections": total_detections,
        "unique_plates": unique_plates,
        "total_violations": total_violations,
        "resolved_violations": resolved_violations,
        "pending_violations": total_violations - resolved_violations,
        "average_confidence": round(avg_confidence * 100, 1) if avg_confidence and avg_confidence < 1 else round(avg_confidence, 1) if avg_confidence else 0,
        "top_governorates": [{"governorate": g, "count": c} for g, c in top_gov],
        "violation_breakdown": {t: c for t, c in violation_breakdown},
    }


@router.get("/export/csv")
def export_csv(
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """Export detections as CSV for the past N days."""
    cutoff = datetime.utcnow() - timedelta(days=days)

    detections = (
        db.query(Detection)
        .filter(Detection.created_at >= cutoff)
        .order_by(Detection.created_at.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Plate Number", "Arabic", "Governorate", "Confidence",
        "Status", "Camera", "Location", "Source File", "Created At",
    ])

    for d in detections:
        writer.writerow([
            d.id, d.plate_number, d.plate_number_arabic, d.governorate,
            round(d.confidence * 100, 1) if d.confidence else "",
            d.status, d.camera or "", d.location or "", d.source_file or "",
            d.created_at.isoformat() if d.created_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=detections_{days}d.csv"},
    )
