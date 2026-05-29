from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.services.admin import AdminService
from app.schemas.admin import SystemStats
from app.database.session import get_db

router = APIRouter()

@router.get("/stats", response_model=SystemStats)
async def get_system_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: deps.User = Depends(deps.get_current_admin_user)
):
    """
    Get system-wide statistics. Only accessible by admins.
    """
    admin_service = AdminService(db)
    return await admin_service.get_system_stats()

@router.get("/users/count")
async def get_users_count(
    db: AsyncSession = Depends(get_db),
    current_admin: deps.User = Depends(deps.get_current_admin_user)
):
    admin_service = AdminService(db)
    return {"count": await admin_service.get_total_users()}

@router.get("/projects/count")
async def get_projects_count(
    db: AsyncSession = Depends(get_db),
    current_admin: deps.User = Depends(deps.get_current_admin_user)
):
    admin_service = AdminService(db)
    return {"count": await admin_service.get_total_projects()}

@router.get("/storage/usage")
async def get_storage_usage(
    db: AsyncSession = Depends(get_db),
    current_admin: deps.User = Depends(deps.get_current_admin_user)
):
    admin_service = AdminService(db)
    return await admin_service.get_storage_usage()

@router.get("/sessions/active")
async def get_active_sessions(
    db: AsyncSession = Depends(get_db),
    current_admin: deps.User = Depends(deps.get_current_admin_user)
):
    admin_service = AdminService(db)
    return {"active_sessions": await admin_service.get_active_sessions()}
