"""Pydantic schemas for request/response validation."""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


# ── Auth ───────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Detection ──────────────────────────────────────────────────────────

class DetectionResponse(BaseModel):
    id: int
    plate_number: str
    plate_number_arabic: Optional[str]
    governorate: Optional[str]
    confidence: Optional[float]
    speed: Optional[float]
    speed_limit: Optional[float]
    camera: Optional[str]
    location: Optional[str]
    status: str
    frame_number: int
    timestamp_in_video: Optional[str]
    source_file: Optional[str]
    plate_image_path: Optional[str]
    car_image_path: Optional[str]
    job_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class DetectionListResponse(BaseModel):
    items: list[DetectionResponse]
    total: int
    page: int
    page_size: int


# ── Job ────────────────────────────────────────────────────────────────

class JobResponse(BaseModel):
    id: str
    filename: Optional[str]
    file_type: Optional[str]
    status: str
    progress: float
    total_frames: int
    processed_frames: int
    detections_count: int
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Violation ──────────────────────────────────────────────────────────

class ViolationResponse(BaseModel):
    id: int
    detection_id: Optional[int]
    violation_type: str
    description: Optional[str]
    plate_number: str
    speed: Optional[float]
    speed_limit: Optional[float]
    location: Optional[str]
    camera: Optional[str]
    resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ViolationListResponse(BaseModel):
    items: list[ViolationResponse]
    total: int


# ── Watchlist ──────────────────────────────────────────────────────────

class WatchlistCreate(BaseModel):
    plate_number: str
    plate_number_arabic: Optional[str] = None
    reason: str
    priority: str = "medium"


class WatchlistUpdate(BaseModel):
    reason: Optional[str] = None
    priority: Optional[str] = None
    is_active: Optional[bool] = None


class WatchlistResponse(BaseModel):
    id: int
    plate_number: str
    plate_number_arabic: Optional[str]
    reason: Optional[str]
    priority: str
    is_active: bool
    created_by: Optional[str]
    last_seen: Optional[datetime]
    last_seen_location: Optional[str]
    match_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Dashboard ──────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    vehicles_today: int
    violations_today: int
    watchlist_matches: int
    system_accuracy: float
    vehicles_change: float
    violations_change: float


class HourlyData(BaseModel):
    hour: str
    vehicles: int
    violations: int


class WeeklyData(BaseModel):
    day: str
    vehicles: int
    violations: int


class ViolationTypeData(BaseModel):
    name: str
    value: int
    color: str


# ── Camera ─────────────────────────────────────────────────────────────

class CameraCreate(BaseModel):
    name: str
    location: str
    speed_limit: float = 60.0


class CameraResponse(BaseModel):
    id: int
    name: str
    location: Optional[str]
    speed_limit: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Settings ───────────────────────────────────────────────────────────

class SettingUpdate(BaseModel):
    value: str


class SettingResponse(BaseModel):
    id: int
    key: str
    value: Optional[str]
    description: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Search ─────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str
    page: int = 1
    page_size: int = 20
