import logging
import uuid
import datetime
from typing import List, Optional, Dict, Any
from app.db.mongodb import db_manager
from app.schemas.history import (
    HistoricalEventSchema,
    HistoricalEventCreateSchema,
    HistoricalEventUpdateSchema,
)

logger = logging.getLogger(__name__)

def normalize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize legacy/snake_case keys to camelCase for HistoricalEventSchema."""
    d = dict(doc)
    d.pop("_id", None)
    key_mapping = {
        "event_id": "eventId",
        "event_name": "eventName",
        "event_type": "eventType",
        "location_name": "locationName",
        "event_date": "eventDate",
        "start_time": "startTime",
        "end_time": "endTime",
        "data_type": "dataType",
        "max_rainfall": "maxRainfall",
        "max_radar_dbz": "maxRadarDbz",
        "hail_occurred": "hailOccurred",
        "hail_size_cm": "hailSizeCm",
        "thunderstorm_occurred": "thunderstormOccurred",
        "source_reference": "sourceReference",
        "created_at": "createdAt",
        "timeline_steps": "timelineSteps",
    }
    for old_k, new_k in key_mapping.items():
        if old_k in d and new_k not in d:
            d[new_k] = d.pop(old_k)

    # Fallbacks for legacy/alternative field names
    if "eventName" not in d:
        d["eventName"] = d.get("title", d.get("name", "Historical Convective Event"))
    if "eventDate" not in d:
        d["eventDate"] = d.get("date", d.get("startTime", "2026-05-14"))
    if "dataType" not in d:
        d["dataType"] = "Demonstration Dataset"

    return d

class HistoryService:
    @staticmethod
    async def get_historical_events(
        location: Optional[str] = None,
        event_type: Optional[str] = None,
        date: Optional[str] = None,
        severity: Optional[str] = None,
        data_type: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
    ) -> List[HistoricalEventSchema]:
        """
        Retrieve verified and manually added demonstration historical events from MongoDB Atlas.
        """
        results: List[HistoricalEventSchema] = []

        # 1. MongoDB Atlas Query
        if db_manager.is_connected and db_manager.db is not None:
            try:
                query: Dict[str, Any] = {}
                if location and location.strip():
                    loc_clean = location.replace(" (3 km Radius)", "").strip()
                    query["$or"] = [
                        {"locationName": {"$regex": loc_clean, "$options": "i"}},
                        {"location_name": {"$regex": loc_clean, "$options": "i"}},
                    ]
                if event_type and event_type != "All":
                    query["$or"] = [
                        {"eventType": event_type},
                        {"event_type": event_type},
                    ]
                if date and date.strip():
                    query["$or"] = [
                        {"eventDate": date.strip()},
                        {"event_date": date.strip()},
                    ]
                if severity and severity != "All":
                    query["severity"] = severity
                if data_type and data_type != "All":
                    query["$or"] = [
                        {"dataType": data_type},
                        {"data_type": data_type},
                    ]

                cursor = db_manager.db["historical_events"].find(query).sort("createdAt", -1)
                docs = await cursor.to_list(length=200)

                for raw_doc in docs:
                    norm = normalize_doc(raw_doc)
                    try:
                        results.append(HistoricalEventSchema(**norm))
                    except Exception as e:
                        logger.warning(f"Failed to parse historical event document: {e}")

                return results
            except Exception as e:
                logger.error(f"Error querying MongoDB historical_events: {e}")

        # 2. Resilient In-Memory Store Fallback
        mem_events = db_manager.memory_store.setdefault("historical_events", {})
        for raw_doc in mem_events.values():
            try:
                norm = normalize_doc(raw_doc)
                if location:
                    loc_clean = location.replace(" (3 km Radius)", "").strip().lower()
                    ev_loc = norm.get("locationName", "").lower()
                    if loc_clean not in ev_loc:
                        continue
                if event_type and event_type != "All" and norm.get("eventType") != event_type:
                    continue
                if date and date.strip() and norm.get("eventDate") != date.strip():
                    continue
                if severity and severity != "All" and norm.get("severity") != severity:
                    continue
                if data_type and data_type != "All" and norm.get("dataType") != data_type:
                    continue
                results.append(HistoricalEventSchema(**norm))
            except Exception:
                pass

        # Sort newest first
        results.sort(key=lambda x: x.created_at, reverse=True)
        return results

    @staticmethod
    async def get_historical_event_by_id(event_id: str) -> Optional[HistoricalEventSchema]:
        """Retrieve a specific historical event by eventId."""
        if db_manager.is_connected and db_manager.db is not None:
            try:
                doc = await db_manager.db["historical_events"].find_one({
                    "$or": [{"eventId": event_id}, {"event_id": event_id}]
                })
                if doc:
                    return HistoricalEventSchema(**normalize_doc(doc))
            except Exception as e:
                logger.error(f"Error querying event {event_id} from MongoDB: {e}")

        mem_events = db_manager.memory_store.get("historical_events", {})
        if event_id in mem_events:
            return HistoricalEventSchema(**normalize_doc(mem_events[event_id]))

        return None

    @staticmethod
    async def create_historical_event(
        create_data: HistoricalEventCreateSchema
    ) -> HistoricalEventSchema:
        """
        Create and persist a new historical event record into MongoDB Atlas and in-memory store.
        """
        doc = create_data.model_dump(by_alias=True)
        event_id = f"hist-{uuid.uuid4().hex[:8]}"
        created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

        doc["eventId"] = event_id
        doc["createdAt"] = created_at

        # Save into MongoDB Atlas
        if db_manager.is_connected and db_manager.db is not None:
            try:
                await db_manager.db["historical_events"].insert_one(dict(doc))
                logger.info(f"Persisted historical event {event_id} ({doc['eventName']}) into MongoDB Atlas.")
            except Exception as e:
                logger.error(f"Failed to insert historical event into MongoDB: {e}")

        # Sync to in-memory store
        db_manager.memory_store.setdefault("historical_events", {})
        db_manager.memory_store["historical_events"][event_id] = dict(doc)

        # Trigger automatic hail alert synchronization if hail occurred
        try:
            from app.services.alert_service import alert_service
            await alert_service.sync_historical_hail_alert(doc)
        except Exception as e:
            logger.error(f"Error syncing historical hail alert for {event_id}: {e}")

        return HistoricalEventSchema(**normalize_doc(doc))

    @staticmethod
    async def update_historical_event(
        event_id: str,
        update_data: HistoricalEventUpdateSchema
    ) -> Optional[HistoricalEventSchema]:
        """Update an existing historical event in MongoDB Atlas."""
        update_dict = {
            k: v for k, v in update_data.model_dump(by_alias=True, exclude_unset=True).items()
            if v is not None
        }
        if not update_dict:
            return await HistoryService.get_historical_event_by_id(event_id)

        # Update in MongoDB Atlas
        if db_manager.is_connected and db_manager.db is not None:
            try:
                await db_manager.db["historical_events"].update_one(
                    {"$or": [{"eventId": event_id}, {"event_id": event_id}]},
                    {"$set": update_dict}
                )
                logger.info(f"Updated historical event {event_id} in MongoDB Atlas.")
            except Exception as e:
                logger.error(f"Failed to update historical event in MongoDB: {e}")

        # Update in memory store
        mem_events = db_manager.memory_store.get("historical_events", {})
        if event_id in mem_events:
            mem_events[event_id].update(update_dict)

        updated_event = await HistoryService.get_historical_event_by_id(event_id)

        # Synchronize linked hail alert on update (handles Hail Occurred Yes -> No or attribute changes)
        if updated_event:
            try:
                from app.services.alert_service import alert_service
                await alert_service.sync_historical_hail_alert(updated_event.model_dump(by_alias=True))
            except Exception as e:
                logger.error(f"Error syncing historical hail alert on update for {event_id}: {e}")

        return updated_event

    @staticmethod
    async def delete_historical_event(event_id: str) -> bool:
        """Delete an existing historical event from MongoDB Atlas."""
        deleted = False

        # Delete from MongoDB Atlas
        if db_manager.is_connected and db_manager.db is not None:
            try:
                res = await db_manager.db["historical_events"].delete_one(
                    {"$or": [{"eventId": event_id}, {"event_id": event_id}]}
                )
                if res.deleted_count > 0:
                    deleted = True
                    logger.info(f"Deleted historical event {event_id} from MongoDB Atlas.")
            except Exception as e:
                logger.error(f"Failed to delete event from MongoDB: {e}")

        # Delete from memory store
        mem_events = db_manager.memory_store.get("historical_events", {})
        if event_id in mem_events:
            del mem_events[event_id]
            deleted = True

        # Clean up any associated historical hail alerts
        try:
            from app.services.alert_service import alert_service
            await alert_service.delete_alert_by_historical_event_id(event_id)
        except Exception as e:
            logger.error(f"Error deleting linked alert for {event_id}: {e}")

        return deleted

history_service = HistoryService()
