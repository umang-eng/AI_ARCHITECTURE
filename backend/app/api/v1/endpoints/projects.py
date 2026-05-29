from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.session import get_db
from app.services.project import ProjectService
from app.schemas.project import Project, ProjectCreate, ProjectUpdate
from app.api.deps import get_current_active_user
from app.models.user import User as UserModel

router = APIRouter()

@router.post("/", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    project_service = ProjectService(db)
    return await project_service.create_project(current_user.id, project_in)

@router.get("/", response_model=List[Project])
async def read_projects(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    project_service = ProjectService(db)
    return await project_service.get_user_projects(current_user.id, skip=skip, limit=limit)

@router.get("/{project_id}", response_model=Project)
async def read_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    project_service = ProjectService(db)
    return await project_service.get_project(project_id, current_user.id)

@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    project_service = ProjectService(db)
    return await project_service.update_project(project_id, current_user.id, project_in)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    project_service = ProjectService(db)
    await project_service.delete_project(project_id, current_user.id)
    return None
