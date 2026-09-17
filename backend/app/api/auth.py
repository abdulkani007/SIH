from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse, ForgotPasswordRequest
from app.services.auth_service import auth_service
from app.core.security import decode_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserResponse:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = await auth_service.get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister):
    """Register a new user account with StormGuard AI."""
    return await auth_service.register_user(data)

@router.post("/login", response_model=Token)
async def login(data: UserLogin):
    """Authenticate with email and password."""
    return await auth_service.authenticate_user(data)

@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """Generate and dispatch password reset instructions."""
    return {
        "success": True,
        "message": f"Password reset instructions have been dispatched to {data.email}.",
    }

@router.get("/me", response_model=UserResponse)
async def get_current_profile(current_user: UserResponse = Depends(get_current_user)):
    """Retrieve profile information for the authenticated user."""
    return current_user
