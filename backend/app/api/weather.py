from typing import List, Optional
from fastapi import APIRouter, Query
from app.schemas.weather import CurrentWeatherResponse, DataSourceSchema, HourlyForecastResponse, GeocodeResultSchema
from app.services.weather_service import weather_service

router = APIRouter(prefix="/weather", tags=["Weather Telemetry"])

@router.get("/geocode", response_model=List[GeocodeResultSchema])
async def search_locations(
    q: str = Query(..., min_length=2, description="Place name, city, district or address to search"),
):
    """Search locations via OpenStreetMap Nominatim with in-memory caching."""
    return await weather_service.geocode_location(q)

@router.get("/current", response_model=CurrentWeatherResponse)
async def get_current_weather(
    lat: Optional[float] = Query(None, description="User latitude coordinates"),
    lon: Optional[float] = Query(None, description="User longitude coordinates"),
    location: Optional[str] = Query(None, description="User location name or district"),
):
    """Retrieve real-time surface automated station and satellite weather observation."""
    return await weather_service.get_current_weather(lat=lat, lon=lon, location=location)

@router.get("/forecast", response_model=HourlyForecastResponse)
async def get_hourly_forecast(
    lat: Optional[float] = Query(None, description="User latitude coordinates"),
    lon: Optional[float] = Query(None, description="User longitude coordinates"),
    location: Optional[str] = Query(None, description="User location name or district"),
):
    """Retrieve 0-6 hour high-resolution hourly forecast slices."""
    return await weather_service.get_hourly_forecast(lat=lat, lon=lon, location=location)

@router.get("/sources", response_model=List[DataSourceSchema])
async def get_data_sources():
    """Retrieve telemetry pipeline status across AWS, Radar, Satellite, and Lightning."""
    return weather_service.get_data_sources()
