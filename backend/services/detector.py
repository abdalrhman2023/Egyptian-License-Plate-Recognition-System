"""
License plate detection, OCR, tracking, and video/image processing.
Ported from plate_tracker.py — the core YOLO + OCR pipeline.
"""

import cv2
import numpy as np
import uuid
from datetime import datetime
from typing import Callable, Optional
from ultralytics import YOLO

from config import PLATE_MODEL_PATH, OCR_MODEL_PATH, PLATES_DIR, CARS_DIR

# ── Lazy-loaded model singletons ───────────────────────────────────────
_plate_model: Optional[YOLO] = None
_ocr_model: Optional[YOLO] = None


def get_plate_model() -> YOLO:
    global _plate_model
    if _plate_model is None:
        _plate_model = YOLO(PLATE_MODEL_PATH)
    return _plate_model


def get_ocr_model() -> YOLO:
    global _ocr_model
    if _ocr_model is None:
        _ocr_model = YOLO(OCR_MODEL_PATH)
    return _ocr_model


# ── Character mapping ─────────────────────────────────────────────────

NUMBER_MAP = {
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
    '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
}

LETTER_MAP = {
    'alif': 'ا', 'baa': 'ب', 'taa': 'ت', 'thaa': 'ث',
    'jeem': 'ج', 'haa': 'ح', 'khaa': 'خ', 'daal': 'د',
    'zaal': 'ذ', 'raa': 'ر', 'zay': 'ز', 'seen': 'س',
    'sheen': 'ش', 'saad': 'ص', 'daad': 'ض', 'Taa': 'ط',
    'Thaa': 'ظ', 'ain': 'ع', 'ghayn': 'غ', 'faa': 'ف',
    'qaaf': 'ق', 'kaaf': 'ك', 'laam': 'ل', 'meem': 'م',
    'noon': 'ن', 'haah': 'ه', 'waw': 'و', 'yaa': 'ي',
    '7aa': 'ح',
}

ARABIC_TO_ENGLISH_NUM = {v: k for k, v in NUMBER_MAP.items()}

GOV_PATTERNS = {
    "س": "الإسكندرية", "ر": "الشرقية", "د": "الدقهلية",
    "م": "المنوفية", "ب": "البحيرة", "ل": "كفر الشيخ",
    "ع": "الغربية", "ق": "القليوبية", "ف": "الفيوم",
    "و": "بني سويف", "ن": "المنيا", "ى": "أسيوط",
    "ه": "سوهاج",
    "ط س": "السويس", "ط ص": "الإسماعيلية", "ط ع": "بورسعيد",
    "ط د": "دمياط", "ط ا": "شمال سيناء", "ط ج": "جنوب سيناء",
    "ط ر": "البحر الأحمر",
    "ج هـ": "مطروح", "ج ب": "الوادي الجديد",
    "ص ا": "قنا", "ص ق": "الأقصر", "ص و": "أسوان",
}


def map_to_arabic(numbers: list[str], letters: list[str]) -> str:
    arabic_numbers = [NUMBER_MAP.get(n, n) for n in reversed(numbers)]
    arabic_letters = [LETTER_MAP.get(l, l) for l in reversed(letters)]
    return ' '.join(arabic_letters + arabic_numbers)


def classify_governorate(arabic_plate_text: str) -> str:
    tokens = arabic_plate_text.split()
    if len(tokens) < 3:
        return "غير معروفة"
    letters = [t for t in tokens if t not in "٠١٢٣٤٥٦٧٨٩"]
    numbers = [t for t in tokens if t in "٠١٢٣٤٥٦٧٨٩"]
    if len(letters) == 3 and len(numbers) == 3:
        return "القاهرة"
    if len(letters) == 2 and len(numbers) == 4:
        return "الجيزة"
    key = f"{letters[0]} {letters[1]}" if len(letters) >= 2 else (letters[0] if letters else "")
    return GOV_PATTERNS.get(key, "محافظة غير معروفة")


# ── IoU tracker ────────────────────────────────────────────────────────

def iou(box1: list, box2: list) -> float:
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - inter
    return inter / union if union > 0 else 0


class PlateTracker:
    def __init__(self, iou_threshold: float = 0.3):
        self.tracks: dict = {}
        self.next_id: int = 0
        self.iou_threshold = iou_threshold

    def update(self, detections: list[dict]) -> list[tuple]:
        if not self.tracks:
            results = []
            for det in detections:
                tid = self.next_id
                self.next_id += 1
                self.tracks[tid] = {"box": det["box"], "best_conf": det["score"]}
                results.append((tid, det, True))
            return results

        track_ids = list(self.tracks.keys())
        matched_tracks, matched_dets = set(), set()
        results = []

        pairs = []
        for i, tid in enumerate(track_ids):
            for j, det in enumerate(detections):
                score = iou(self.tracks[tid]["box"], det["box"])
                pairs.append((score, i, j))
        pairs.sort(reverse=True)

        for score, i, j in pairs:
            if score < self.iou_threshold:
                break
            tid = track_ids[i]
            if tid in matched_tracks or j in matched_dets:
                continue
            matched_tracks.add(tid)
            matched_dets.add(j)
            is_better = detections[j]["score"] > self.tracks[tid]["best_conf"]
            if is_better:
                self.tracks[tid]["best_conf"] = detections[j]["score"]
            self.tracks[tid]["box"] = detections[j]["box"]
            results.append((tid, detections[j], is_better))

        for j, det in enumerate(detections):
            if j not in matched_dets:
                tid = self.next_id
                self.next_id += 1
                self.tracks[tid] = {"box": det["box"], "best_conf": det["score"]}
                results.append((tid, det, True))

        return results


# ── OCR ────────────────────────────────────────────────────────────────

def ocr_plate(plate_crop: np.ndarray) -> tuple[str, str, str]:
    """Run OCR on a plate crop → (english_text, arabic_text, governorate)."""
    ocr = get_ocr_model()
    result = ocr.predict(source=plate_crop, conf=0.25, verbose=False)[0]
    sorted_boxes = sorted(result.boxes, key=lambda b: b.xyxy[0][0].item())

    numbers, letters = [], []
    for box in sorted_boxes:
        label = result.names[int(box.cls)]
        if label.isdigit():
            numbers.append(label)
        else:
            letters.append(label)

    arabic_text = map_to_arabic(numbers, letters)
    english_text = ' '.join(reversed(letters)) + ' ' + ' '.join(reversed(numbers))
    english_text = english_text.strip()
    governorate = classify_governorate(arabic_text)
    return english_text, arabic_text, governorate


# ── Save crops ─────────────────────────────────────────────────────────

def save_crops(frame: np.ndarray, box: list[int]) -> tuple[str, str]:
    """Save plate crop and car crop, return relative paths."""
    x1, y1, x2, y2 = box
    uid = uuid.uuid4().hex[:8]

    # Plate crop
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) if len(frame.shape) == 3 else frame
    plate_crop = frame_rgb[y1:y2, x1:x2]
    plate_filename = f"plate_{uid}.jpg"
    cv2.imwrite(str(PLATES_DIR / plate_filename), cv2.cvtColor(plate_crop, cv2.COLOR_RGB2BGR))

    # Car crop (wider region around plate)
    pad = 100
    h, w = frame.shape[:2]
    cx1, cy1 = max(0, x1 - pad * 3), max(0, y1 - pad * 3)
    cx2, cy2 = min(w, x2 + pad * 3), min(h, y2 + pad * 3)
    car_crop = frame[cy1:cy2, cx1:cx2]
    car_filename = f"car_{uid}.jpg"
    if len(car_crop.shape) == 3 and car_crop.shape[2] == 3:
        cv2.imwrite(str(CARS_DIR / car_filename), cv2.cvtColor(car_crop, cv2.COLOR_RGB2BGR))
    else:
        cv2.imwrite(str(CARS_DIR / car_filename), car_crop)

    return f"plates/{plate_filename}", f"cars/{car_filename}"


# ── Process video ──────────────────────────────────────────────────────

def process_video(
    video_path: str,
    video_name: str,
    progress_callback: Optional[Callable[[int, int], None]] = None,
    skip_frames: int = 5,
) -> list[dict]:
    """Full video processing pipeline with tracking and OCR."""
    plate_model = get_plate_model()
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Cannot open video file")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    tracker = PlateTracker(iou_threshold=0.3)
    best_detections: dict = {}

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % skip_frames != 0:
            frame_idx += 1
            continue

        results = plate_model(frame, verbose=False)[0]
        detections = []
        for box_data in results.boxes.data.tolist():
            x1, y1, x2, y2, score, cls = box_data
            detections.append({
                "box": [int(x1), int(y1), int(x2), int(y2)],
                "score": score,
                "frame": frame.copy(),
                "frame_idx": frame_idx,
            })

        if detections:
            tracked = tracker.update(detections)
            for track_id, det, is_new_or_better in tracked:
                if is_new_or_better:
                    best_detections[track_id] = det

        if progress_callback and total_frames > 0:
            progress_callback(frame_idx, total_frames)

        frame_idx += 1

    cap.release()

    # OCR on best detections
    saved_plates = []
    for track_id, det in best_detections.items():
        frame = det["frame"]
        x1, y1, x2, y2 = det["box"]
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        plate_crop = frame_rgb[y1:y2, x1:x2]

        if plate_crop.size == 0:
            continue

        try:
            english_text, arabic_text, governorate = ocr_plate(plate_crop)
        except Exception:
            english_text, arabic_text, governorate = "unknown", "غير معروف", "غير معروفة"

        if not english_text.strip() or english_text.strip() == "unknown":
            continue

        plate_path, car_path = save_crops(frame, det["box"])
        timestamp_sec = det["frame_idx"] / fps
        timestamp_str = datetime.utcfromtimestamp(timestamp_sec).strftime("%M:%S")

        saved_plates.append({
            "track_id": track_id,
            "plate_number": english_text,
            "plate_number_arabic": arabic_text,
            "governorate": governorate,
            "confidence": round(det["score"], 4),
            "frame_number": det["frame_idx"],
            "timestamp_in_video": timestamp_str,
            "source_file": video_name,
            "plate_image_path": plate_path,
            "car_image_path": car_path,
        })

    return saved_plates


# ── Process image ──────────────────────────────────────────────────────

def process_image(image_path: str, image_name: str) -> list[dict]:
    """Process a single image and return detection results."""
    plate_model = get_plate_model()
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("Cannot read image")

    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = plate_model(image_rgb, verbose=False)[0]
    saved = []

    for box_data in results.boxes.data.tolist():
        x1, y1, x2, y2, score, cls = [int(v) if i < 4 else v for i, v in enumerate(box_data)]
        plate_crop = image_rgb[y1:y2, x1:x2]
        if plate_crop.size == 0:
            continue

        try:
            english_text, arabic_text, governorate = ocr_plate(plate_crop)
        except Exception:
            continue

        if not english_text.strip():
            continue

        plate_path, car_path = save_crops(image, [x1, y1, x2, y2])

        saved.append({
            "plate_number": english_text,
            "plate_number_arabic": arabic_text,
            "governorate": governorate,
            "confidence": round(score, 4),
            "frame_number": 0,
            "timestamp_in_video": "00:00",
            "source_file": image_name,
            "plate_image_path": plate_path,
            "car_image_path": car_path,
        })

    return saved
