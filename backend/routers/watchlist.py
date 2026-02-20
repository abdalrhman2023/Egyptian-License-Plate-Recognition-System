"""Watchlist management routes."""

from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import WatchlistEntry, User
from schemas import WatchlistCreate, WatchlistUpdate, WatchlistResponse
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api/watchlist", tags=["Watchlist"])


@router.get("", response_model=list[WatchlistResponse])
def list_watchlist(
    active_only: bool = Query(True),
    db: Session = Depends(get_db),
):
    """Get all watchlist entries."""
    q = db.query(WatchlistEntry)
    if active_only:
        q = q.filter(WatchlistEntry.is_active == True)
    return q.order_by(WatchlistEntry.created_at.desc()).all()


@router.post("", response_model=WatchlistResponse, status_code=201)
def add_to_watchlist(
    data: WatchlistCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a plate to the watchlist."""
    existing = (
        db.query(WatchlistEntry)
        .filter(WatchlistEntry.plate_number == data.plate_number)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Plate already in watchlist")

    entry = WatchlistEntry(
        plate_number=data.plate_number,
        plate_number_arabic=data.plate_number_arabic,
        reason=data.reason,
        priority=data.priority,
        created_by=current_user.username,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/{entry_id}", response_model=WatchlistResponse)
def get_watchlist_entry(entry_id: int, db: Session = Depends(get_db)):
    """Get a specific watchlist entry."""
    entry = db.query(WatchlistEntry).filter(WatchlistEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.patch("/{entry_id}", response_model=WatchlistResponse)
def update_watchlist_entry(
    entry_id: int,
    data: WatchlistUpdate,
    db: Session = Depends(get_db),
):
    """Update a watchlist entry."""
    entry = db.query(WatchlistEntry).filter(WatchlistEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    if data.reason is not None:
        entry.reason = data.reason
    if data.priority is not None:
        entry.priority = data.priority
    if data.is_active is not None:
        entry.is_active = data.is_active

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}")
def delete_watchlist_entry(entry_id: int, db: Session = Depends(get_db)):
    """Remove a plate from the watchlist."""
    entry = db.query(WatchlistEntry).filter(WatchlistEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Entry removed from watchlist"}


@router.get("/check/{plate_number}")
def check_watchlist(plate_number: str, db: Session = Depends(get_db)):
    """Check if a plate is in the watchlist."""
    entry = (
        db.query(WatchlistEntry)
        .filter(WatchlistEntry.plate_number == plate_number, WatchlistEntry.is_active == True)
        .first()
    )
    return {"in_watchlist": entry is not None, "entry": entry}
