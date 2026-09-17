import logging
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[Any] = None
    is_connected: bool = False
    
    # In-memory store fallback for demo & offline mode
    memory_store: Dict[str, Dict[str, Any]] = {
        "users": {},
        "alerts": {},
    }

db_manager = DatabaseManager()

async def connect_to_mongo():
    """Attempt connecting to MongoDB / MongoDB Atlas."""
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
        db_manager.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=2000
        )
        # Verify connection
        await db_manager.client.server_info()
        db_manager.db = db_manager.client[settings.MONGODB_DB_NAME]
        db_manager.is_connected = True
        try:
            await db_manager.db.users.create_index("email", unique=True)
            await db_manager.db.users.create_index("id", unique=True)
        except Exception as idx_err:
            logger.warning(f"Could not create user indexes: {idx_err}")
        logger.info("Successfully connected to MongoDB Atlas / Local MongoDB instance.")
    except Exception as e:
        logger.warning(
            f"MongoDB not reachable ({e}). Operating in resilient In-Memory Store mode."
        )
        db_manager.is_connected = False
        db_manager.client = None
        db_manager.db = None

async def close_mongo_connection():
    """Close MongoDB client connection pool."""
    if db_manager.client:
        db_manager.client.close()
        logger.info("Closed MongoDB connection pool.")

def get_database():
    """Retrieve active database instance or None."""
    return db_manager.db
