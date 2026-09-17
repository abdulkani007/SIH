from typing import List, Tuple, Literal, Optional, Dict, Any
from pydantic import BaseModel

SeverityType = Literal["Low", "Moderate", "High", "Severe"]

class CurrentWeatherResponse(BaseModel):
    temperature: float
    condition: str
    feels_like: float
    humidity: int
    wind_speed: float
    wind_direction: str
    pressure: int
    rainfall: float
    visibility: float
    uv_index: int
    cloud_cover: int
    dew_point: float
    location: str
    updated_at: str

class HazardThreatSchema(BaseModel):
    id: str
    title: str
    subtitle: str = "Tomorrow.io Weather Data"
    is_available: bool = True
    unavailable_reason: Optional[str] = None
    probability: Optional[int] = None
    probability_label: str = ""
    severity: SeverityType
    trend: Literal["Increasing", "Steady", "Decreasing", "Unavailable"]
    trend_values: List[Optional[float]] = []
    peak_value: Optional[float] = None
    expected_window: str = "Time window unavailable"
    data_quality: str = "Confidence: Not available"
    source_label: str = "Tomorrow.io API v4"
    icon_name: str
    description: str
    input_factors: Dict[str, str] = {}
    prediction_source: Optional[Literal["KOLKATA_CONVLSTM", "TOMORROW_IO_RISK_ENGINE"]] = None

class NowcastStepSchema(BaseModel):
    time_label: str
    hour_offset: int
    thunderstorm_prob: int
    hail_prob: int
    extreme_rainfall_prob: int
    overall_severity: SeverityType
    summary: str
    expected_precip_rate: str
    prediction_source: Optional[Literal["KOLKATA_CONVLSTM", "TOMORROW_IO_RISK_ENGINE"]] = None
    source_label: Optional[str] = None

class StormCellSchema(BaseModel):
    id: str
    name: str
    current_location: str
    coordinates: Tuple[float, float]
    direction: str
    direction_degrees: int
    speed_km_h: float
    intensity: SeverityType
    expected_arrival: str
    confidence_percent: int
    echo_top_km: float
    max_reflectivity_dbz: float
    prediction_source: Optional[Literal["KOLKATA_CONVLSTM", "TOMORROW_IO_RISK_ENGINE"]] = None
    source_label: Optional[str] = None

class RiskZoneSchema(BaseModel):
    id: str
    name: str
    severity: SeverityType
    center: Tuple[float, float]
    coordinates: List[Tuple[float, float]]
    thunderstorm_prob: int
    hail_prob: int
    extreme_rain_prob: int
    expected_time: str
    confidence_percent: int
    affected_population: str
    prediction_source: Optional[Literal["KOLKATA_CONVLSTM", "TOMORROW_IO_RISK_ENGINE"]] = None
    source_label: Optional[str] = None

class DataSourceSchema(BaseModel):
    name: str
    status: Literal["Connected", "Ready", "Degraded"]
    latency_ms: int
    protocol: str

class AIInsightSchema(BaseModel):
    quote: str
    confidence: str
    model_name: str
    runtime_status: str

class GeocodeResultSchema(BaseModel):
    name: str
    display_name: str
    latitude: float
    longitude: float
    type: Optional[str] = None
    state: Optional[str] = None

class AssistantQuerySchema(BaseModel):
    question: str
    location: str = "Active Sector"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_source: Optional[str] = "gps"
    temperature: float = 31.0
    humidity: int = 84
    pressure: int = 1008
    rainfall_rate: float = 0.0
    reflectivity_dbz: Optional[float] = None
    storm_cell_name: Optional[str] = None
    storm_cell_speed: Optional[float] = None
    storm_cell_direction: Optional[str] = None
    expected_arrival: Optional[str] = None
    threat_thunderstorm: Optional[int] = 0
    threat_hail: Optional[int] = None
    threat_rain: Optional[int] = 0
    source_label: Optional[str] = "Tomorrow.io API v4"
    updated_at: Optional[str] = None

class AssistantResponseSchema(BaseModel):
    answer: str
    confidence: str = "91%"
    model: str = "Groq (qwen/qwen3.8-27b)"
    referenced_telemetry: dict = {}


class HourlyForecastStepSchema(BaseModel):
    time_label: str
    hour_offset: int
    iso_time: Optional[str] = None
    temperature: float
    humidity: int
    wind_speed: float
    wind_direction: str
    pressure: int
    precipitation_intensity: float
    precipitation_probability: int
    rain_accumulation: float
    cloud_cover: int
    condition: str
    thunderstorm_prob: int
    hail_prob: int
    extreme_rainfall_prob: int
    overall_severity: SeverityType
    prediction_source: Optional[Literal["KOLKATA_CONVLSTM", "TOMORROW_IO_RISK_ENGINE"]] = None
    source_label: Optional[str] = None

class HourlyForecastResponse(BaseModel):
    location: str
    latitude: float
    longitude: float
    source: str
    updated_at: str
    steps: List[HourlyForecastStepSchema]
    prediction_source: Optional[Literal["KOLKATA_CONVLSTM", "TOMORROW_IO_RISK_ENGINE"]] = None
