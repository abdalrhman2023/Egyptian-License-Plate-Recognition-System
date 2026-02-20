<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/YOLOv11-00FFFF?style=for-the-badge&logo=yolo&logoColor=black" />
  <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</p>

# 🛡️ Sentry Egypt Vision

**AI-Powered Egyptian License Plate Recognition System**

A full-stack web application that automatically detects and recognizes Egyptian vehicle license plates from images and videos using deep learning (YOLOv11), performs Arabic OCR, classifies governorates, and provides a comprehensive traffic monitoring dashboard.

---

## 📸 Screenshots

![image](https://github.com/user-attachments/assets/d096f474-ef59-4dcf-9bac-4d5e0f881780)
![image](https://github.com/user-attachments/assets/a94404a4-976f-4dea-9003-3edacc8826d6)

---

## ✨ Features

| Feature                           | Description                                                               |
| --------------------------------- | ------------------------------------------------------------------------- |
| 🎯 **Plate Detection**            | YOLO-based license plate localization on images & videos                  |
| 🔤 **Arabic OCR**                 | Custom-trained YOLO model for Arabic character recognition                |
| 🏛️ **Governorate Classification** | Automatic identification of 27+ Egyptian governorates                     |
| 📊 **Dashboard**                  | Real-time stats, charts (hourly/weekly), and live activity feed           |
| 📹 **Video Processing**           | Frame-by-frame analysis with progress tracking & IoU-based plate tracking |
| 🚨 **Watchlist**                  | Flag specific plates and get automatic alerts on matches                  |
| ⚠️ **Violations**                 | Track and manage traffic violations                                       |
| 📈 **Analytics**                  | Visual charts and trends for detection data                               |
| 📋 **Reports**                    | Export detection reports (CSV)                                            |
| 🔐 **Authentication**             | JWT-based user auth with registration and login                           |
| ⚙️ **Settings**                   | Configurable cameras, speed limits, and system parameters                 |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│       React 18 · TypeScript · Tailwind · shadcn/ui  │
│       Recharts · Framer Motion · React Query         │
└──────────────────────┬──────────────────────────────┘
                       │  REST API (HTTP)
┌──────────────────────▼──────────────────────────────┐
│                   Backend (FastAPI)                   │
│         SQLAlchemy · SQLite · JWT Auth                │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   Routers   │  │   Services   │  │    Auth     │  │
│  │  upload     │  │  detector.py │  │  JWT+Bcrypt │  │
│  │  dashboard  │  │  YOLO models │  │             │  │
│  │  vehicles   │  │  OCR pipeline│  └────────────┘  │
│  │  violations │  │  IoU tracker │                   │
│  │  watchlist  │  └──────────────┘                   │
│  │  analytics  │                                     │
│  │  reports    │                                     │
│  │  settings   │                                     │
│  └─────────────┘                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
web/
├── best.pt                  # OCR model (Arabic character recognition)
├── plate.pt                 # License plate detection model
├── yolo11n.pt               # Base YOLO model
├── train.yaml               # YOLO training configuration
├── requirements.txt         # Python dependencies (Streamlit app)
│
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # App configuration (DB, JWT, paths)
│   ├── database.py          # SQLAlchemy engine & session setup
│   ├── models.py            # ORM models (User, Detection, Job, Violation, Watchlist, Camera, Setting)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── requirements.txt     # Backend Python dependencies
│   ├── auth/
│   │   ├── router.py        # Login & register endpoints
│   │   ├── dependencies.py  # JWT token verification
│   │   └── utils.py         # Password hashing & token creation
│   ├── routers/
│   │   ├── upload.py        # Image/video upload & processing
│   │   ├── dashboard.py     # Dashboard stats & activity feed
│   │   ├── vehicles.py      # Vehicle detection records
│   │   ├── violations.py    # Violation management
│   │   ├── watchlist.py     # Watchlist CRUD
│   │   ├── analytics.py     # Charts & trend data
│   │   ├── reports.py       # CSV report generation
│   │   └── settings.py      # System settings & cameras
│   ├── services/
│   │   └── detector.py      # Core YOLO detection + OCR + tracking pipeline
│   └── static/
│       ├── uploads/         # Uploaded files
│       ├── plates/          # Cropped plate images
│       └── cars/            # Cropped car images
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── src/
│       ├── App.tsx           # Routes & providers
│       ├── lib/api.ts        # API client with auth
│       ├── contexts/
│       │   └── AuthContext.tsx
│       ├── components/
│       │   ├── DashboardLayout.tsx
│       │   └── ui/           # shadcn/ui components
│       └── pages/
│           ├── Dashboard.tsx  # Main dashboard with charts
│           ├── Upload.tsx     # File upload interface
│           ├── LiveFeed.tsx   # Real-time detection feed
│           ├── Vehicles.tsx   # Vehicle records table
│           ├── Violations.tsx # Violations management
│           ├── Watchlist.tsx  # Watchlist management
│           ├── Analytics.tsx  # Analytics charts
│           ├── Reports.tsx    # Report generation
│           ├── Settings.tsx   # System configuration
│           ├── Login.tsx      # Authentication
│           └── Register.tsx   # User registration
│
└── egyptian-license-plates.ipynb  # Jupyter notebook for training/experimentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.11+
- **Node.js** 18+ (with npm or bun)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/Egyptian-License-Plate-Recognition-System.git
cd Egyptian-License-Plate-Recognition-System/project/web
```

### 2. Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

- **Swagger Docs:** `http://localhost:8000/api/docs`
- **ReDoc:** `http://localhost:8000/api/redoc`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or: bun install

# Start development server
npm run dev
# or: bun dev
```

The frontend will be available at `http://localhost:5173`

### 4. Model Files

Make sure the following YOLO model files exist in the `web/` directory:

| File         | Purpose                       |
| ------------ | ----------------------------- |
| `plate.pt`   | License plate detection model |
| `best.pt`    | Arabic character OCR model    |
| `yolo11n.pt` | Base YOLOv11 nano model       |

---

## 🔌 API Endpoints

| Method | Endpoint                  | Description                       |
| ------ | ------------------------- | --------------------------------- |
| `POST` | `/api/auth/register`      | Register a new user               |
| `POST` | `/api/auth/login`         | Login & get JWT token             |
| `GET`  | `/api/auth/me`            | Get current user info             |
| `POST` | `/api/upload`             | Upload image/video for processing |
| `GET`  | `/api/jobs/{id}`          | Get processing job status         |
| `GET`  | `/api/dashboard/stats`    | Dashboard statistics              |
| `GET`  | `/api/dashboard/activity` | Recent detections feed            |
| `GET`  | `/api/dashboard/hourly`   | Hourly detection chart data       |
| `GET`  | `/api/dashboard/weekly`   | Weekly detection chart data       |
| `GET`  | `/api/vehicles`           | List all detected vehicles        |
| `GET`  | `/api/violations`         | List all violations               |
| `GET`  | `/api/watchlist`          | List watchlist entries            |
| `POST` | `/api/watchlist`          | Add plate to watchlist            |
| `GET`  | `/api/analytics/*`        | Analytics & trend data            |
| `GET`  | `/api/reports/export`     | Export CSV report                 |
| `GET`  | `/api/health`             | Health check                      |

---

## 🧠 How Detection Works

```
Image/Video Frame
       │
       ▼
┌──────────────┐
│  plate.pt    │  ← YOLO: Detect license plate bounding boxes
└──────┬───────┘
       │ Crop plate region
       ▼
┌──────────────┐
│   best.pt    │  ← YOLO: Detect individual Arabic characters & digits
└──────┬───────┘
       │ Sort by position (right-to-left for Arabic)
       ▼
┌──────────────┐
│  Arabic Map  │  ← Convert class names → Arabic letters/numbers
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Governorate  │  ← Classify based on letter/number pattern
│ Classifier   │     (Cairo: 3 letters + 3 digits, Giza: 2 letters + 4 digits, etc.)
└──────────────┘
```

**Supported Governorates:** Cairo, Giza, Alexandria, Sharqia, Dakahlia, Monufia, Beheira, Kafr El-Sheikh, Gharbia, Qalyubia, Fayoum, Beni Suef, Minya, Assiut, Sohag, Suez, Ismailia, Port Said, Damietta, North Sinai, South Sinai, Red Sea, Matrouh, New Valley, Qena, Luxor, Aswan.

---

## 🛠️ Tech Stack

### Backend

| Technology            | Usage                     |
| --------------------- | ------------------------- |
| FastAPI               | REST API framework        |
| SQLAlchemy            | ORM & database management |
| SQLite                | Database (zero-config)    |
| Ultralytics (YOLOv11) | Object detection & OCR    |
| OpenCV                | Image/video processing    |
| python-jose + bcrypt  | JWT authentication        |

### Frontend

| Technology           | Usage                   |
| -------------------- | ----------------------- |
| React 18             | UI framework            |
| TypeScript           | Type safety             |
| Vite                 | Build tool & dev server |
| Tailwind CSS         | Utility-first styling   |
| shadcn/ui            | UI component library    |
| Recharts             | Data visualization      |
| Framer Motion        | Animations              |
| TanStack React Query | Server state management |
| React Router v6      | Client-side routing     |

---

## 📝 Environment Variables

| Variable     | Default                              | Description                               |
| ------------ | ------------------------------------ | ----------------------------------------- |
| `SECRET_KEY` | `sentry-egypt-vision-secret-key-...` | JWT signing key (⚠️ change in production) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is for educational and research purposes.

---

<p align="center">
  <b>Sentry Egypt Vision</b> — Built with ❤️ for smarter Egyptian traffic monitoring
</p>
