from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

SeverityType = Literal["Low", "Moderate", "High", "Severe"]

class EarlyWarningSchema(BaseModel):
    id: str
    title: str
    type: str
    severity: SeverityType
    description: str
    location: str
    expected_window: str
    thunderstorm_prob: int
    extreme_rain_prob: int
    confidence_percent: int
    issued_at: str
    prediction_source: Optional[Literal["KOLKATA_CONVLSTM", "TOMORROW_IO_RISK_ENGINE"]] = None
    source_label: Optional[str] = None

class AlertLogSchema(BaseModel):
    id: str
    title: str
    type: Optional[str] = None
    location: str
    timestamp: str
    severity: SeverityType
    source: str = "Tomorrow.io Weather Data"
    trigger_value: Optional[str] = Field(None, alias="triggerValue")
    threshold: Optional[str] = None
    historical_event_id: Optional[str] = Field(None, alias="historicalEventId")
    data_type: Optional[str] = Field(None, alias="dataType")
    is_historical: bool = Field(default=False, alias="isHistorical")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

class GenerateAlertExplanationRequest(BaseModel):
    alert_id: Optional[str] = Field(None, alias="alertId")
    alert_data: Optional[dict] = Field(default_factory=dict, alias="alertData")

    model_config = ConfigDict(populate_by_name=True)

class GenerateAlertExplanationResponse(BaseModel):
    alert_id: str = Field(..., alias="alertId")
    explanation: str
    model: str
    status: str

    model_config = ConfigDict(populate_by_name=True)

class SendAlertEmailRequest(BaseModel):
    to: str
    alert_id: Optional[str] = Field(None, alias="alertId")
    message: str
    subject: Optional[str] = None
    alert_data: Optional[dict] = Field(None, alias="alertData")

    model_config = ConfigDict(populate_by_name=True)

class SendAlertEmailResponse(BaseModel):
    success: bool
    recipient: Optional[str] = None
    message: Optional[str] = None
    detail: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)
