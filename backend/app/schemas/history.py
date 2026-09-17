import uuid
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict, field_validator

SeverityType = Literal["Low", "Moderate", "High", "Severe"]
DataType = Literal["Verified Historical Data", "Demonstration Dataset"]
EventType = Literal[
    "Thunderstorm",
    "Hailstorm",
    "Extreme Rainfall",
    "Cloudburst",
    "Squall Line",
    "Other"
]

class HistoricalTimelineStepSchema(BaseModel):
    step: str
    time_offset: str = Field(..., alias="timeOffset")
    radar_dbz: Optional[float] = Field(None, alias="radarDbz")
    rain_rate_mm_h: Optional[float] = Field(None, alias="rainRateMmH")
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = Field(None, alias="windSpeed")
    hail: Optional[str] = None
    thunderstorm: Optional[str] = None
    summary: Optional[str] = None
    source: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

class HistoricalEventCreateSchema(BaseModel):
    event_name: str = Field(..., alias="eventName")
    event_type: str = Field(..., alias="eventType")
    location_name: str = Field(..., alias="locationName")
    latitude: float
    longitude: float
    event_date: str = Field(..., alias="eventDate")
    start_time: str = Field(..., alias="startTime")
    end_time: Optional[str] = Field(None, alias="endTime")
    severity: SeverityType
    data_type: DataType = Field(default="Demonstration Dataset", alias="dataType")
    max_rainfall: Optional[float] = Field(None, alias="maxRainfall")
    max_radar_dbz: Optional[float] = Field(None, alias="maxRadarDbz")
    hail_occurred: bool = Field(default=False, alias="hailOccurred")
    hail_size_cm: Optional[float] = Field(None, alias="hailSizeCm")
    thunderstorm_occurred: bool = Field(default=False, alias="thunderstormOccurred")
    source: str
    source_reference: Optional[str] = Field(None, alias="sourceReference")
    notes: Optional[str] = None
    timeline_steps: Optional[List[HistoricalTimelineStepSchema]] = Field(None, alias="timelineSteps")

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: float) -> float:
        if not (-90.0 <= v <= 90.0):
            raise ValueError("Latitude must be between -90 and 90 degrees.")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: float) -> float:
        if not (-180.0 <= v <= 180.0):
            raise ValueError("Longitude must be between -180 and 180 degrees.")
        return v

    @field_validator("event_name", "event_type", "location_name", "event_date", "start_time", "source")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty.")
        return v.strip()

    model_config = ConfigDict(populate_by_name=True)

class HistoricalEventUpdateSchema(BaseModel):
    event_name: Optional[str] = Field(None, alias="eventName")
    event_type: Optional[str] = Field(None, alias="eventType")
    location_name: Optional[str] = Field(None, alias="locationName")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    event_date: Optional[str] = Field(None, alias="eventDate")
    start_time: Optional[str] = Field(None, alias="startTime")
    end_time: Optional[str] = Field(None, alias="endTime")
    severity: Optional[SeverityType] = None
    data_type: Optional[DataType] = Field(None, alias="dataType")
    max_rainfall: Optional[float] = Field(None, alias="maxRainfall")
    max_radar_dbz: Optional[float] = Field(None, alias="maxRadarDbz")
    hail_occurred: Optional[bool] = Field(None, alias="hailOccurred")
    hail_size_cm: Optional[float] = Field(None, alias="hailSizeCm")
    thunderstorm_occurred: Optional[bool] = Field(None, alias="thunderstormOccurred")
    source: Optional[str] = None
    source_reference: Optional[str] = Field(None, alias="sourceReference")
    notes: Optional[str] = None
    timeline_steps: Optional[List[HistoricalTimelineStepSchema]] = Field(None, alias="timelineSteps")

    model_config = ConfigDict(populate_by_name=True)

class HistoricalEventSchema(BaseModel):
    event_id: str = Field(..., alias="eventId")
    event_name: str = Field(..., alias="eventName")
    event_type: str = Field(..., alias="eventType")
    location_name: str = Field(..., alias="locationName")
    latitude: float
    longitude: float
    event_date: str = Field(..., alias="eventDate")
    start_time: str = Field(..., alias="startTime")
    end_time: Optional[str] = Field(None, alias="endTime")
    severity: SeverityType
    data_type: DataType = Field(default="Demonstration Dataset", alias="dataType")
    max_rainfall: Optional[float] = Field(None, alias="maxRainfall")
    max_radar_dbz: Optional[float] = Field(None, alias="maxRadarDbz")
    hail_occurred: bool = Field(default=False, alias="hailOccurred")
    hail_size_cm: Optional[float] = Field(None, alias="hailSizeCm")
    thunderstorm_occurred: bool = Field(default=False, alias="thunderstormOccurred")
    source: str
    source_reference: Optional[str] = Field(None, alias="sourceReference")
    notes: Optional[str] = None
    created_at: str = Field(..., alias="createdAt")
    timeline_steps: Optional[List[HistoricalTimelineStepSchema]] = Field(None, alias="timelineSteps")

    # Backward-compatible convenience aliases
    @property
    def rainfall(self) -> Optional[str]:
        return f"{self.max_rainfall:.1f} mm/h" if self.max_rainfall is not None else None

    @property
    def radar(self) -> Optional[str]:
        return f"{self.max_radar_dbz:.0f} dBZ" if self.max_radar_dbz is not None else None

    @property
    def hail(self) -> Optional[str]:
        if self.hail_occurred:
            return f"Confirmed ({self.hail_size_cm} cm)" if self.hail_size_cm else "Confirmed"
        return "None Recorded"

    @property
    def thunderstorm(self) -> Optional[str]:
        return "Confirmed" if self.thunderstorm_occurred else "None Recorded"

    model_config = ConfigDict(populate_by_name=True)
