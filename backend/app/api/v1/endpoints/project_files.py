from fastapi import APIRouter, Depends, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.session import get_db
from app.services.project_file import ProjectFileService
from app.schemas.project_file import ProjectFile
from app.api.deps import get_current_active_user
from app.models.user import User as UserModel

router = APIRouter()

@router.post("/{project_id}/upload", response_model=ProjectFile, status_code=status.HTTP_201_CREATED)
async def upload_project_file(
    project_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    file_service = ProjectFileService(db)
    return await file_service.upload_file(project_id, current_user.id, file)

@router.get("/{project_id}/files", response_model=List[ProjectFile])
async def list_project_files(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    file_service = ProjectFileService(db)
    return await file_service.get_project_files(project_id, current_user.id)

@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_file(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    file_service = ProjectFileService(db)
    await file_service.delete_file(file_id, current_user.id)
    return None
