from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.auth import AuthService
from app.schemas.auth import Login, Token, ForgotPassword, ResetPassword, RefreshTokenRequest
from app.schemas.user import User, UserCreate

router = APIRouter()

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    auth_service = AuthService(db)
    return await auth_service.register(user_in)

@router.post("/login", response_model=Token)
async def login(
    login_data: Login,
    db: AsyncSession = Depends(get_db)
):
    auth_service = AuthService(db)
    return await auth_service.login(login_data)

@router.post("/login-form", response_model=Token)
async def login_form(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    auth_service = AuthService(db)
    return await auth_service.login(Login(email=form_data.username, password=form_data.password))

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    auth_service = AuthService(db)
    return await auth_service.refresh_token(refresh_data.refresh_token)

@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPassword,
    db: AsyncSession = Depends(get_db)
):
    auth_service = AuthService(db)
    token = await auth_service.forgot_password(data.email)
    # In a real app, send token via email
    return {"message": "Reset token generated", "token": token}

@router.post("/reset-password")
async def reset_password(
    data: ResetPassword,
    db: AsyncSession = Depends(get_db)
):
    auth_service = AuthService(db)
    return await auth_service.reset_password(data)

@router.post("/logout")
async def logout():
    # Stateless JWT logout is usually handled by deleting token on client side.
    # For extra security, token blacklisting could be implemented here.
    return {"message": "Successfully logged out"}
