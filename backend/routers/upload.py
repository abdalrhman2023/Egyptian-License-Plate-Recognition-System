"""File upload & processing routes."""

import uuid
import threading
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Job, Detection, JobStatus, WatchlistEntry, Violation, DetectionStatus
from schemas import JobResponse
from config import UPLOAD_DIR, ALLOWED_VIDEO_EXT, ALLOWED_IMAGE_EXT
from auth.dependencies import get_current_user
from models import User
from services.detector import process_video, process_image

router = APIRouter(prefix="/api", tags=["Upload & Processing"])


def _run_video_job(job_id: str, file_path: str, filename: str, db_url: str):
    """Background thread for video processing."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        job.status = JobStatus.processing.value
        db.commit()

        def progress_cb(current: int, total: int):
            job.processed_frames = current
            job.total_frames = total
            job.progress = round((current / total) * 100, 1) if total > 0 else 0
            db.commit()

        results = process_video(file_path, filename, progress_callback=progress_cb)

        # Check watchlist for each detection
        watchlist_plates = {
            w.plate_number: w
            for w in db.query(WatchlistEntry).filter(WatchlistEntry.is_active == True).all()
        }

        for r in results:
            status = DetectionStatus.normal.value
            plate = r["plate_number"]

            # Check watchlist
            if plate in watchlist_plates:
                status = DetectionStatus.watchlist.value
                wl = watchlist_plates[plate]
                wl.match_count += 1
                wl.last_seen = datetime.utcnow()

            detection = Detection(
                plate_number=r["plate_number"],
                plate_number_arabic=r.get("plate_number_arabic"),
                governorate=r.get("governorate"),
                confidence=r.get("confidence"),
                status=status,
                frame_number=r.get("frame_number", 0),
                timestamp_in_video=r.get("timestamp_in_video"),
                source_file=r.get("source_file"),
                plate_image_path=r.get("plate_image_path"),
                car_image_path=r.get("car_image_path"),
                job_id=job_id,
            )
            db.add(detection)
            db.flush()

            # Create violation for watchlist matches
            if status == DetectionStatus.watchlist.value:
                violation = Violation(
                    detection_id=detection.id,
                    violation_type="watchlist_match",
                    description=f"Watchlist match: {watchlist_plates[plate].reason}",
                    plate_number=plate,
                    location=detection.location,
                    camera=detection.camera,
                )
                db.add(violation)

        job.status = JobStatus.completed.value
        job.progress = 100.0
        job.detections_count = len(results)
        job.completed_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            job.status = JobStatus.failed.value
            job.error_message = str(e)
            db.commit()
    finally:
        db.close()


@router.post("/upload", response_model=JobResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a video or image for plate detection."""
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_VIDEO_EXT and ext not in ALLOWED_IMAGE_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    # Save file
    uid = uuid.uuid4().hex[:8]
    safe_name = f"{uid}_{file.filename}"
    file_path = UPLOAD_DIR / safe_name
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    is_video = ext in ALLOWED_VIDEO_EXT
    job_id = uuid.uuid4().hex

    # Create job record
    job = Job(
        id=job_id,
        filename=file.filename,
        file_type="video" if is_video else "image",
        status=JobStatus.pending.value,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    if is_video:
        # Process in background thread
        from config import DATABASE_URL
        thread = threading.Thread(
            target=_run_video_job,
            args=(job_id, str(file_path), file.filename, DATABASE_URL),
            daemon=True,
        )
        thread.start()
    else:
        # Process image synchronously
        try:
            results = process_image(str(file_path), file.filename)

            watchlist_plates = {
                w.plate_number: w
                for w in db.query(WatchlistEntry).filter(WatchlistEntry.is_active == True).all()
            }

            for r in results:
                status = DetectionStatus.normal.value
                plate = r["plate_number"]

                if plate in watchlist_plates:
                    status = DetectionStatus.watchlist.value
                    wl = watchlist_plates[plate]
                    wl.match_count += 1
                    wl.last_seen = datetime.utcnow()

                detection = Detection(
                    plate_number=r["plate_number"],
                    plate_number_arabic=r.get("plate_number_arabic"),
                    governorate=r.get("governorate"),
                    confidence=r.get("confidence"),
                    status=status,
                    frame_number=0,
                    timestamp_in_video="00:00",
                    source_file=file.filename,
                    plate_image_path=r.get("plate_image_path"),
                    car_image_path=r.get("car_image_path"),
                    job_id=job_id,
                )
                db.add(detection)
                db.flush()

                if status == DetectionStatus.watchlist.value:
                    violation = Violation(
                        detection_id=detection.id,
                        violation_type="watchlist_match",
                        description=f"Watchlist match: {watchlist_plates[plate].reason}",
                        plate_number=plate,
                    )
                    db.add(violation)

            job.status = JobStatus.completed.value
            job.progress = 100.0
            job.detections_count = len(results)
            job.completed_at = datetime.utcnow()
            db.commit()

        except Exception as e:
            job.status = JobStatus.failed.value
            job.error_message = str(e)
            db.commit()

    db.refresh(job)
    return job


@router.get("/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: str, db: Session = Depends(get_db)):
    """Poll job status and progress."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
