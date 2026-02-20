"""
Sentry Egypt Vision — FastAPI Backend
Main application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import STATIC_DIR
from database import init_db

# ── Import routers ─────────────────────────────────────────────────────
from auth.router import router as auth_router
from routers.upload import router as upload_router
from routers.dashboard import router as dashboard_router
from routers.vehicles import router as vehicles_router
from routers.violations import router as violations_router
from routers.watchlist import router as watchlist_router
from routers.analytics import router as analytics_router
from routers.reports import router as reports_router
from routers.settings import router as settings_router

# ── Create app ─────────────────────────────────────────────────────────

app = FastAPI(
    title="Sentry Egypt Vision API",
    description="AI-Powered Egyptian License Plate Recognition System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files ───────────────────────────────────────────────────────
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# ── Register routers ──────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(dashboard_router)
app.include_router(vehicles_router)
app.include_router(violations_router)
app.include_router(watchlist_router)
app.include_router(analytics_router)
app.include_router(reports_router)
app.include_router(settings_router)


# ── Startup ────────────────────────────────────────────────────────────

@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Sentry Egypt Vision API"}
