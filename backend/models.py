"""SQLAlchemy ORM models."""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
import enum

from database import Base


# ── Enums ──────────────────────────────────────────────────────────────

class DetectionStatus(str, enum.Enum):
    normal = "normal"
    speeding = "speeding"
    watchlist = "watchlist"


class ViolationType(str, enum.Enum):
    speeding = "speeding"
    no_entry = "no_entry"
    parking = "parking"
    watchlist_match = "watchlist_match"


class JobStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


# ── User ───────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Detection ──────────────────────────────────────────────────────────

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String(50), index=True, nullable=False)
    plate_number_arabic = Column(String(50), index=True)
    governorate = Column(String(50))
    confidence = Column(Float)
    speed = Column(Float, nullable=True)
    speed_limit = Column(Float, nullable=True)
    camera = Column(String(50), nullable=True)
    location = Column(String(100), nullable=True)
    status = Column(String(20), default=DetectionStatus.normal.value)
    frame_number = Column(Integer, default=0)
    timestamp_in_video = Column(String(20))
    source_file = Column(String(200))
    plate_image_path = Column(String(200))
    car_image_path = Column(String(200))
    job_id = Column(String(50), ForeignKey("jobs.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    job = relationship("Job", back_populates="detections")


# ── Processing Job ─────────────────────────────────────────────────────

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(50), primary_key=True)
    filename = Column(String(200))
    file_type = Column(String(10))  # "video" or "image"
    status = Column(String(20), default=JobStatus.pending.value)
    progress = Column(Float, default=0.0)
    total_frames = Column(Integer, default=0)
    processed_frames = Column(Integer, default=0)
    detections_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    detections = relationship("Detection", back_populates="job")


# ── Violation ──────────────────────────────────────────────────────────

class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("detections.id"))
    violation_type = Column(String(30), nullable=False)
    description = Column(Text)
    plate_number = Column(String(50), index=True)
    speed = Column(Float, nullable=True)
    speed_limit = Column(Float, nullable=True)
    location = Column(String(100))
    camera = Column(String(50))
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    detection = relationship("Detection")


# ── Watchlist ──────────────────────────────────────────────────────────

class WatchlistEntry(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String(50), unique=True, index=True, nullable=False)
    plate_number_arabic = Column(String(50))
    reason = Column(Text)
    priority = Column(String(20), default="medium")  # low, medium, high, critical
    is_active = Column(Boolean, default=True)
    created_by = Column(String(50))
    last_seen = Column(DateTime, nullable=True)
    last_seen_location = Column(String(100), nullable=True)
    match_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Camera ─────────────────────────────────────────────────────────────

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    location = Column(String(100))
    speed_limit = Column(Float, default=60.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Settings ───────────────────────────────────────────────────────────

class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, nullable=False)
    value = Column(Text)
    description = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
