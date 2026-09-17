from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from app.schemas.alert import (
    EarlyWarningSchema,
    AlertLogSchema,
    GenerateAlertExplanationRequest,
    GenerateAlertExplanationResponse,
    SendAlertEmailRequest,
    SendAlertEmailResponse,
)
from app.services.nowcast_engine import nowcast_engine
from app.services.ai_alert_generator import generate_alert_explanation
from app.services.email_service import send_alert_email

router = APIRouter(prefix="/alerts", tags=["Severe Weather Alerts"])

@router.get("/active", response_model=EarlyWarningSchema)
async def get_active_warning(
    location: Optional[str] = Query(None, description="Active user location or sector"),
    lat: Optional[float] = Query(None, description="Latitude coordinates"),
    lon: Optional[float] = Query(None, description="Longitude coordinates"),
):
    """Retrieve the primary severe weather alert for the monitoring region."""
    return await nowcast_engine.get_early_warning(location=location, lat=lat, lon=lon)

@router.get("/recent", response_model=List[AlertLogSchema])
async def get_recent_alerts(
    location: Optional[str] = Query(None, description="Active user location or sector"),
    lat: Optional[float] = Query(None, description="Latitude coordinates"),
    lon: Optional[float] = Query(None, description="Longitude coordinates"),
):
    """Retrieve chronological history of recent warning dispatches based on real nowcast conditions and stored historical event dispatches."""
    from app.services.alert_service import alert_service

    # 1. Stored alerts from MongoDB Atlas / in-memory store
    stored_raw = await alert_service.get_stored_alerts()
    stored_alerts: List[AlertLogSchema] = []
    for s in stored_raw:
        try:
            stored_alerts.append(AlertLogSchema(**s))
        except Exception:
            pass

    # 2. Live nowcast alerts evaluated against meteorological thresholds
    try:
        live_alerts = await nowcast_engine.get_recent_alerts(lat=lat, lon=lon, location=location)
    except Exception:
        live_alerts = []

    # Combine: stored historical alerts + live nowcast threshold alerts
    return stored_alerts + live_alerts

@router.post("/generate-ai-explanation", response_model=GenerateAlertExplanationResponse)
async def api_generate_alert_explanation(payload: GenerateAlertExplanationRequest):
    """Generate concise Groq AI natural-language meteorological alert explanation strictly grounded in provided telemetry."""
    data = payload.alert_data or {}
    if payload.alert_id and "id" not in data and "alertId" not in data:
        data["alertId"] = payload.alert_id
    res = generate_alert_explanation(data)
    return GenerateAlertExplanationResponse(**res)

@router.post("/send-email", response_model=SendAlertEmailResponse)
async def api_send_alert_email(payload: SendAlertEmailRequest):
    """Dispatch emergency weather alert email strictly to recipient entered in 'To' using backend SMTP."""
    result = send_alert_email(
        to_email=payload.to,
        subject=payload.subject,
        message=payload.message,
        alert_data=payload.alert_data,
    )
    return SendAlertEmailResponse(**result)
