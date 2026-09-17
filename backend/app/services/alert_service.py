import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from app.db.mongodb import db_manager

logger = logging.getLogger("stormguard.alerts")

class AlertService:
    """
    Service layer for managing persisted alerts in MongoDB Atlas with in-memory resilient fallback.
    Coordinates automatic alert creation from historical convective events (e.g., Hail Occurred).
    """

    @classmethod
    async def sync_historical_hail_alert(cls, event_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Synchronize an automatic hail alert from a historical event.
        - If hailOccurred is True: upserts a single alert referencing historicalEventId.
        - If hailOccurred is False: removes any alert previously linked to this historical event.
        """
        event_id = str(event_dict.get("eventId") or event_dict.get("event_id") or "")
        if not event_id:
            logger.warning("sync_historical_hail_alert called without valid event ID")
            return None

        hail_occurred = bool(event_dict.get("hailOccurred") or event_dict.get("hail_occurred", False))

        # If hail did not occur, ensure any existing linked alert is removed
        if not hail_occurred:
            await cls.delete_alert_by_historical_event_id(event_id)
            return None

        # Build consistent alert fields
        alert_id = f"alert-hist-hail-{event_id}"
        event_data_type = event_dict.get("dataType") or event_dict.get("data_type") or "Demonstration Dataset"
        alert_data_type = (
            "Demonstration Alert"
            if "Demonstration" in event_data_type
            else "Verified Alert"
        )

        event_date = event_dict.get("eventDate") or event_dict.get("event_date") or ""
        start_time = event_dict.get("startTime") or event_dict.get("start_time") or ""
        event_time = f"{event_date} ({start_time})" if event_date and start_time else (event_date or start_time or "Recorded Timestamp")

        hail_size = event_dict.get("hailSizeCm") or event_dict.get("hail_size_cm")
        trigger_val = f"Reported Hail: {hail_size} cm" if hail_size is not None else "Reported Hail: Confirmed"

        location_name = event_dict.get("locationName") or event_dict.get("location_name") or "Archived Location"
        lat = float(event_dict.get("latitude", 0.0))
        lon = float(event_dict.get("longitude", 0.0))
        severity = event_dict.get("severity", "Moderate")
        source = event_dict.get("source", "Historical Meteorological Archive")

        alert_doc = {
            "id": alert_id,
            "title": "Historical Hail Event",
            "type": "Hail",
            "location": location_name,
            "latitude": lat,
            "longitude": lon,
            "severity": severity,
            "description": "Historical hail event recorded for this location.",
            "timestamp": event_time,
            "source": source,
            "trigger_value": trigger_val,
            "threshold": "Historical Record (Hail Confirmed)",
            "historical_event_id": event_id,
            "data_type": alert_data_type,
            "is_historical": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # 1. MongoDB Atlas persistence
        if db_manager.is_connected and db_manager.db is not None:
            try:
                await db_manager.db["alerts"].update_one(
                    {"historical_event_id": event_id},
                    {"$set": alert_doc},
                    upsert=True
                )
                logger.info(f"Persisted historical hail alert {alert_id} in MongoDB Atlas")
            except Exception as e:
                logger.error(f"Failed to upsert alert in MongoDB: {e}")

        # 2. In-memory fallback
        mem_alerts = db_manager.memory_store.setdefault("alerts", {})
        mem_alerts[alert_id] = alert_doc

        return alert_doc

    @classmethod
    async def delete_alert_by_historical_event_id(cls, event_id: str) -> bool:
        """
        Delete any alert associated with the specified historical event ID.
        """
        deleted = False

        # MongoDB Atlas deletion
        if db_manager.is_connected and db_manager.db is not None:
            try:
                res = await db_manager.db["alerts"].delete_many({
                    "$or": [
                        {"historical_event_id": event_id},
                        {"historicalEventId": event_id},
                    ]
                })
                if res.deleted_count > 0:
                    deleted = True
                    logger.info(f"Deleted {res.deleted_count} linked alerts for historical event {event_id} from MongoDB Atlas")
            except Exception as e:
                logger.error(f"Failed to delete alert from MongoDB: {e}")

        # In-memory deletion
        mem_alerts = db_manager.memory_store.get("alerts", {})
        keys_to_del = [
            k for k, v in mem_alerts.items()
            if v.get("historical_event_id") == event_id or v.get("historicalEventId") == event_id
        ]
        for k in keys_to_del:
            del mem_alerts[k]
            deleted = True

        return deleted

    @classmethod
    async def get_stored_alerts(cls) -> List[Dict[str, Any]]:
        """
        Retrieve all stored alerts from MongoDB Atlas or in-memory store.
        """
        results: List[Dict[str, Any]] = []

        if db_manager.is_connected and db_manager.db is not None:
            try:
                cursor = db_manager.db["alerts"].find({}).sort("created_at", -1)
                async for doc in cursor:
                    doc_copy = dict(doc)
                    doc_copy.pop("_id", None)
                    results.append(doc_copy)
                return results
            except Exception as e:
                logger.error(f"Failed to fetch alerts from MongoDB: {e}")

        # Fallback to memory store
        mem_alerts = db_manager.memory_store.get("alerts", {})
        results = sorted(
            list(mem_alerts.values()),
            key=lambda x: x.get("created_at", ""),
            reverse=True
        )
        return results

alert_service = AlertService()
