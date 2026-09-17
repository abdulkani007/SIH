import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection, db_manager
from app.api import auth, weather, nowcast, alerts, history

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("stormguard-ai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect database
    logger.info("Initializing StormGuard AI backend services...")
    await connect_to_mongo()
    yield
    # Shutdown: Close connections
    logger.info("Shutting down StormGuard AI backend services...")
    await close_mongo_connection()

app = FastAPI(
    title="StormGuard AI Operations API",
    description="AI-Based Convective-Scale Nowcasting for Thunderstorms, Hail & Extreme Rainfall (0–6 Hours)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(weather.router, prefix=settings.API_V1_STR)
app.include_router(nowcast.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(history.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "StormGuard AI Operations API",
        "version": "1.0.0",
        "status": "operational",
        "docs_url": "/docs",
    }

@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "StormGuard AI Backend",
        "database_connected": db_manager.is_connected,
        "database_mode": "MongoDB Atlas" if db_manager.is_connected else "In-Memory Resilient",
    }
