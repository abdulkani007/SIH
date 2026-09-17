from typing import List, Optional
from fastapi import APIRouter, Query
from app.schemas.weather import (
    HazardThreatSchema,
    NowcastStepSchema,
    StormCellSchema,
    RiskZoneSchema,
    AIInsightSchema,
    AssistantQuerySchema,
    AssistantResponseSchema,
)
from app.services.nowcast_engine import nowcast_engine

router = APIRouter(prefix="/nowcast", tags=["Convective Nowcasting"])

@router.get("/threats", response_model=List[HazardThreatSchema])
async def get_threats(
    lat: Optional[float] = Query(None, description="User latitude coordinates"),
    lon: Optional[float] = Query(None, description="User longitude coordinates"),
    location: Optional[str] = Query(None, description="User location name or district"),
):
    """Retrieve 0-6h multi-hazard probabilities (Thunderstorm, Hail, Extreme Rainfall)."""
    return await nowcast_engine.get_hazard_threats(lat=lat, lon=lon, location=location)

@router.get("/timeline", response_model=List[NowcastStepSchema])
async def get_nowcast_timeline(
    lat: Optional[float] = Query(None, description="User latitude coordinates"),
    lon: Optional[float] = Query(None, description="User longitude coordinates"),
    location: Optional[str] = Query(None, description="User location name or district"),
):
    """Retrieve 0-6 hour hourly nowcasting step predictions."""
    return await nowcast_engine.get_nowcast_timeline(lat=lat, lon=lon, location=location)

@router.get("/storm-cells", response_model=List[StormCellSchema])
async def get_storm_cells(
    lat: Optional[float] = Query(None, description="User latitude coordinates"),
    lon: Optional[float] = Query(None, description="User longitude coordinates"),
    location: Optional[str] = Query(None, description="User location name or district"),
):
    """Retrieve actively tracked convective storm cell coordinates and vector kinematics."""
    return await nowcast_engine.get_tracked_storm_cells(lat=lat, lon=lon, location=location)

@router.get("/risk-zones", response_model=List[RiskZoneSchema])
async def get_risk_zones(
    lat: Optional[float] = Query(None, description="User latitude coordinates"),
    lon: Optional[float] = Query(None, description="User longitude coordinates"),
    location: Optional[str] = Query(None, description="User location name or district"),
):
    """Retrieve GIS spatial polygons for convective hazard zones (Zone A, B, C, D)."""
    return await nowcast_engine.get_risk_zones(lat=lat, lon=lon, location=location)

@router.get("/insight", response_model=AIInsightSchema)
async def get_ai_insight():
    """Retrieve AI-generated convective synopsis (Groq LPU Ready)."""
    return nowcast_engine.get_ai_insight()

@router.post("/assistant", response_model=AssistantResponseSchema)
async def ask_assistant(query: AssistantQuerySchema):
    """Interactive SIH meteorological decision copilot powered by Groq LPU."""
    return nowcast_engine.ask_assistant(query.model_dump())
