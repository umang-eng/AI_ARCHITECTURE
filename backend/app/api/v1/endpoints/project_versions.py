from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from app.database.session import get_db
from app.services.project_version import ProjectVersionService
from app.schemas.project_version import ProjectVersion, ProjectVersionRestore
from app.schemas.project import Project
from app.api.deps import get_current_active_user
from app.models.user import User as UserModel

router = APIRouter()

@router.get("/{project_id}/versions", response_model=List[ProjectVersion])
async def read_project_versions(
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    version_service = ProjectVersionService(db)
    return await version_service.get_project_versions(project_id, current_user.id, skip=skip, limit=limit)

@router.post("/{project_id}/versions", response_model=ProjectVersion, status_code=status.HTTP_201_CREATED)
async def create_project_version(
    project_id: int,
    version_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    version_service = ProjectVersionService(db)
    return await version_service.create_version(project_id, current_user.id, version_data)

@router.post("/versions/{version_id}/restore", response_model=Project)
async def restore_project_version(
    version_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    version_service = ProjectVersionService(db)
    return await version_service.restore_version(version_id, current_user.id)
