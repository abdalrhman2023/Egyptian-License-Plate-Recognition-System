"""Application configuration."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent  # web/ directory where model files live

# ── Database ───────────────────────────────────────────────────────────
DATABASE_URL = f"sqlite:///{BASE_DIR / 'sentry.db'}"

# ── JWT ────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "sentry-egypt-vision-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# ── YOLO Models ────────────────────────────────────────────────────────
PLATE_MODEL_PATH = str(PROJECT_DIR / "plate.pt")
OCR_MODEL_PATH = str(PROJECT_DIR / "best.pt")

# ── Static files ───────────────────────────────────────────────────────
STATIC_DIR = BASE_DIR / "static"
UPLOAD_DIR = STATIC_DIR / "uploads"
PLATES_DIR = STATIC_DIR / "plates"
CARS_DIR = STATIC_DIR / "cars"

for d in [UPLOAD_DIR, PLATES_DIR, CARS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ── Allowed file types ─────────────────────────────────────────────────
ALLOWED_VIDEO_EXT = {".mp4", ".avi", ".mov", ".mkv", ".wmv"}
ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".bmp"}
