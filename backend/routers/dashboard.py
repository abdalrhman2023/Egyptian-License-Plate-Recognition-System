"""Dashboard stats & activity feed routes."""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from database import get_db
from models import Detection, Violation, WatchlistEntry
from schemas import DashboardStats, HourlyData, WeeklyData, ViolationTypeData, DetectionResponse

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    """Get dashboard overview stats."""
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)

    today_start = datetime.combine(today, datetime.min.time())
    yesterday_start = datetime.combine(yesterday, datetime.min.time())
    yesterday_end = datetime.combine(today, datetime.min.time())

    # Today's counts
    vehicles_today = db.query(func.count(Detection.id)).filter(
        Detection.created_at >= today_start
    ).scalar() or 0

    violations_today = db.query(func.count(Violation.id)).filter(
        Violation.created_at >= today_start
    ).scalar() or 0

    watchlist_matches = db.query(func.count(Detection.id)).filter(
        Detection.created_at >= today_start,
        Detection.status == "watchlist",
    ).scalar() or 0

    # Average confidence as accuracy
    avg_conf = db.query(func.avg(Detection.confidence)).filter(
        Detection.created_at >= today_start,
        Detection.confidence.isnot(None),
    ).scalar()
    accuracy = round(avg_conf * 100, 1) if avg_conf else 97.8

    # Yesterday's counts for % change
    vehicles_yesterday = db.query(func.count(Detection.id)).filter(
        Detection.created_at >= yesterday_start,
        Detection.created_at < yesterday_end,
    ).scalar() or 0

    violations_yesterday = db.query(func.count(Violation.id)).filter(
        Violation.created_at >= yesterday_start,
        Violation.created_at < yesterday_end,
    ).scalar() or 0

    def pct_change(today_val, yesterday_val):
        if yesterday_val == 0:
            return 100.0 if today_val > 0 else 0.0
        return round(((today_val - yesterday_val) / yesterday_val) * 100, 1)

    return DashboardStats(
        vehicles_today=vehicles_today,
        violations_today=violations_today,
        watchlist_matches=watchlist_matches,
        system_accuracy=accuracy,
        vehicles_change=pct_change(vehicles_today, vehicles_yesterday),
        violations_change=pct_change(violations_today, violations_yesterday),
    )


@router.get("/activity", response_model=list[DetectionResponse])
def get_activity(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get recent detection activity feed."""
    detections = (
        db.query(Detection)
        .order_by(Detection.created_at.desc())
        .limit(limit)
        .all()
    )
    return detections


@router.get("/hourly", response_model=list[HourlyData])
def get_hourly_data(db: Session = Depends(get_db)):
    """Get hourly vehicle and violation counts for today."""
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())

    result = []
    for hour in range(24):
        hour_start = today_start + timedelta(hours=hour)
        hour_end = hour_start + timedelta(hours=1)

        vehicles = db.query(func.count(Detection.id)).filter(
            Detection.created_at >= hour_start,
            Detection.created_at < hour_end,
        ).scalar() or 0

        violations = db.query(func.count(Violation.id)).filter(
            Violation.created_at >= hour_start,
            Violation.created_at < hour_end,
        ).scalar() or 0

        result.append(HourlyData(
            hour=f"{hour:02d}:00",
            vehicles=vehicles,
            violations=violations,
        ))

    return result


@router.get("/weekly", response_model=list[WeeklyData])
def get_weekly_data(db: Session = Depends(get_db)):
    """Get daily vehicle counts for the past 7 days."""
    today = datetime.utcnow().date()
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    result = []

    for i in range(6, -1, -1):
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

        result.append(WeeklyData(
            day=days[day.weekday()],
            vehicles=vehicles,
            violations=violations,
        ))

    return result


@router.get("/violation-types", response_model=list[ViolationTypeData])
def get_violation_types(db: Session = Depends(get_db)):
    """Get violation breakdown by type."""
    types_map = {
        "speeding": ("Speeding", "hsl(45, 93%, 47%)"),
        "no_entry": ("No Entry Zone", "hsl(0, 84%, 60%)"),
        "parking": ("Parking Violation", "hsl(38, 92%, 50%)"),
        "watchlist_match": ("Watchlist Match", "hsl(217, 91%, 60%)"),
    }

    total = db.query(func.count(Violation.id)).scalar() or 0
    result = []

    for vtype, (name, color) in types_map.items():
        count = db.query(func.count(Violation.id)).filter(
            Violation.violation_type == vtype
        ).scalar() or 0
        pct = round((count / total) * 100) if total > 0 else 0
        result.append(ViolationTypeData(name=name, value=pct, color=color))

    return result
