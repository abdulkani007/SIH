import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.db.mongodb import db_manager, get_database

class AuthService:
    @staticmethod
    async def register_user(data: UserRegister) -> Token:
        db = get_database()
        email = data.email.lower().strip()
        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        hashed_pw = get_password_hash(data.password)

        user_doc = {
            "id": user_id,
            "email": email,
            "username": data.username.strip(),
            "hashed_password": hashed_pw,
            "created_at": datetime.utcnow(),
        }

        # Check existing user
        if db is not None:
            existing = await db.users.find_one({"email": email})
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email already exists.",
                )
            await db.users.insert_one(user_doc)
        else:
            # In-memory storage fallback
            if email in db_manager.memory_store["users"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email already exists.",
                )
            db_manager.memory_store["users"][email] = user_doc

        user_resp = UserResponse(
            id=user_id,
            email=email,
            username=data.username,
            created_at=user_doc["created_at"],
        )
        token = create_access_token(subject=user_id)
        return Token(access_token=token, user=user_resp, message="Registration successful! Welcome to StormGuard AI.")

    @staticmethod
    async def authenticate_user(data: UserLogin) -> Token:
        db = get_database()
        email = data.email.lower().strip()
        user_doc: Optional[Dict[str, Any]] = None

        if db is not None:
            user_doc = await db.users.find_one({"email": email})
        else:
            user_doc = db_manager.memory_store["users"].get(email)

        if not user_doc or not verify_password(data.password, user_doc["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        user_resp = UserResponse(
            id=user_doc["id"],
            email=user_doc["email"],
            username=user_doc["username"],
            created_at=user_doc["created_at"],
        )
        token = create_access_token(subject=user_doc["id"])
        return Token(access_token=token, user=user_resp, message="Authentication successful. Session established.")

    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[UserResponse]:
        db = get_database()
        user_doc = None
        if db is not None:
            user_doc = await db.users.find_one({"id": user_id})
        else:
            for u in db_manager.memory_store["users"].values():
                if u["id"] == user_id:
                    user_doc = u
                    break

        if not user_doc:
            return None
        return UserResponse(
            id=user_doc["id"],
            email=user_doc["email"],
            username=user_doc["username"],
            created_at=user_doc["created_at"],
        )

auth_service = AuthService()
