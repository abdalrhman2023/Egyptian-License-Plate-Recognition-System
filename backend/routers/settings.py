"""System settings routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Setting, Camera, User
from schemas import SettingResponse, SettingUpdate, CameraCreate, CameraResponse
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api/settings", tags=["Settings"])

# ── Default settings ──────────────────────────────────────────────────

DEFAULT_SETTINGS = {
    "detection_confidence": {"value": "0.25", "description": "Minimum confidence for plate detection"},
    "skip_frames": {"value": "5", "description": "Process every N-th frame in video"},
    "default_speed_limit": {"value": "60", "description": "Default speed limit (km/h)"},
    "auto_watchlist_alert": {"value": "true", "description": "Auto-alert on watchlist matches"},
    "data_retention_days": {"value": "90", "description": "Days to keep detection data"},
}


def _ensure_defaults(db: Session):
    """Insert default settings if they don't exist."""
    for key, info in DEFAULT_SETTINGS.items():
        existing = db.query(Setting).filter(Setting.key == key).first()
        if not existing:
            db.add(Setting(key=key, value=info["value"], description=info["description"]))
    db.commit()


@router.get("", response_model=list[SettingResponse])
def list_settings(db: Session = Depends(get_db)):
    """Get all system settings."""
    _ensure_defaults(db)
    return db.query(Setting).all()


@router.put("/{key}", response_model=SettingResponse)
def update_setting(
    key: str,
    data: SettingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a setting value."""
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")
    setting.value = data.value
    db.commit()
    db.refresh(setting)
    return setting


# ── Camera management ─────────────────────────────────────────────────

@router.get("/cameras", response_model=list[CameraResponse])
def list_cameras(db: Session = Depends(get_db)):
    """Get all cameras."""
    return db.query(Camera).all()


@router.post("/cameras", response_model=CameraResponse, status_code=201)
def add_camera(
    data: CameraCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a new camera."""
    camera = Camera(name=data.name, location=data.location, speed_limit=data.speed_limit)
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera


@router.delete("/cameras/{camera_id}")
def delete_camera(camera_id: int, db: Session = Depends(get_db)):
    """Delete a camera."""
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    db.delete(camera)
    db.commit()
    return {"message": "Camera deleted"}
