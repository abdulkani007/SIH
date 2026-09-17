from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.history import (
    HistoricalEventSchema,
    HistoricalEventCreateSchema,
    HistoricalEventUpdateSchema,
)
from app.services.history_service import history_service

router = APIRouter(tags=["Historical Severe Weather Events"])

@router.get("/historical-events", response_model=List[HistoricalEventSchema])
@router.get("/history/events", response_model=List[HistoricalEventSchema])
async def get_historical_events(
    location: Optional[str] = Query(None, description="Filter historical events for location"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    date: Optional[str] = Query(None, description="Filter by event date"),
    severity: Optional[str] = Query(None, description="Filter by severity level"),
    data_type: Optional[str] = Query(None, description="Filter by data type: Verified Historical Data or Demonstration Dataset"),
    lat: Optional[float] = Query(None, description="User latitude"),
    lon: Optional[float] = Query(None, description="User longitude"),
):
    """
    Retrieve verified and demonstration historical weather events from MongoDB Atlas archive.
    """
    return await history_service.get_historical_events(
        location=location,
        event_type=event_type,
        date=date,
        severity=severity,
        data_type=data_type,
        lat=lat,
        lon=lon,
    )

@router.post("/historical-events", response_model=HistoricalEventSchema, status_code=status.HTTP_201_CREATED)
@router.post("/history/events", response_model=HistoricalEventSchema, status_code=status.HTTP_201_CREATED)
async def create_historical_event(event_in: HistoricalEventCreateSchema):
    """
    Manually add a historical event record (Verified Historical Data or Demonstration Dataset)
    and persist it to MongoDB Atlas.
    """
    return await history_service.create_historical_event(event_in)

@router.get("/historical-events/{event_id}", response_model=HistoricalEventSchema)
@router.get("/history/events/{event_id}", response_model=HistoricalEventSchema)
async def get_historical_event(event_id: str):
    """Retrieve details and verified time-series for a specific historical event."""
    event = await history_service.get_historical_event_by_id(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Historical event '{event_id}' not found in database archive."
        )
    return event

@router.put("/historical-events/{event_id}", response_model=HistoricalEventSchema)
@router.put("/history/events/{event_id}", response_model=HistoricalEventSchema)
async def update_historical_event(event_id: str, update_in: HistoricalEventUpdateSchema):
    """Update an existing historical event record in MongoDB Atlas."""
    updated = await history_service.update_historical_event(event_id, update_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Historical event '{event_id}' not found to update."
        )
    return updated

@router.delete("/historical-events/{event_id}")
@router.delete("/history/events/{event_id}")
async def delete_historical_event(event_id: str):
    """Delete a historical event record from MongoDB Atlas."""
    success = await history_service.delete_historical_event(event_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Historical event '{event_id}' not found to delete."
        )
    return {"message": f"Historical event '{event_id}' deleted successfully.", "eventId": event_id}
