# StormGuard AI - FastAPI Backend

AI-Based Convective-Scale Nowcasting for Thunderstorms, Hail & Extreme Rainfall (0–6 Hours)

## 1. Quick Start

### Prerequisites
- Python 3.11+
- Virtual Environment (`venv`)
- MongoDB (Local or MongoDB Atlas)

### Setup & Run
```bash
# 1. Navigate to backend directory
cd backend

# 2. Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the development server
python run.py
# or directly:
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The server will be available at:
- **API Root**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Healthcheck**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 2. API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/signup`: Register new user with bcrypt password hashing
- `POST /api/auth/login`: Authenticate and receive signed JWT access token
- `POST /api/auth/forgot-password`: Request password reset instructions
- `GET /api/auth/me`: Retrieve current authenticated profile (requires Bearer token)

### Weather Telemetry (`/api/weather`)
- `GET /api/weather/current`: Real-time surface station weather observation
- `GET /api/weather/sources`: Status matrix of data sources (Radar, Satellite, AWS, Lightning)

### Convective Nowcasting (`/api/nowcast`)
- `GET /api/nowcast/threats`: Multi-hazard probabilities (Thunderstorm, Hail, Extreme Rainfall)
- `GET /api/nowcast/timeline`: 0–6 hour nowcasting step predictions
- `GET /api/nowcast/storm-cells`: Tracked convective storm cell kinematics & vector path
- `GET /api/nowcast/risk-zones`: Spatial GIS convective risk zones (Zones A, B, C, D)
- `GET /api/nowcast/insight`: AI-generated convective synopsis (Groq LPU ready)

### Early Warnings (`/api/alerts`)
- `GET /api/alerts/active`: Active severe weather alert for the region
- `GET /api/alerts/recent`: Chronological log of recent alerts
