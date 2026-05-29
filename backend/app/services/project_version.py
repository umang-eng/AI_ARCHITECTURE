from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any, Dict
from app.repositories.project_version import ProjectVersionRepository
from app.repositories.project import ProjectRepository
from app.schemas.project_version import ProjectVersionCreate, ProjectVersion
from app.schemas.project import ProjectUpdate

class ProjectVersionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.version_repo = ProjectVersionRepository(db)
        self.project_repo = ProjectRepository(db)

    async def create_version(self, project_id: int, user_id: int, data: Dict[str, Any]):
        # Verify project ownership
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

        latest_num = await self.version_repo.get_latest_version_number(project_id)
        version_in = ProjectVersionCreate(
            project_id=project_id,
            version_number=latest_num + 1,
            version_data=data
        )
        return await self.version_repo.create(version_in)

    async def get_project_versions(self, project_id: int, user_id: int, skip: int = 0, limit: int = 100):
        # Verify project ownership
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
            
        return await self.version_repo.get_multi_by_project(project_id, skip=skip, limit=limit)

    async def restore_version(self, version_id: int, user_id: int):
        version = await self.version_repo.get_by_id(version_id)
        if not version:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found")
        
        project = await self.project_repo.get_by_id(version.project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

        # Update project with version data
        # Assuming project_description or other fields are stored in version_data
        # This is a generic implementation
        update_data = ProjectUpdate(**version.version_data)
        updated_project = await self.project_repo.update(project.id, update_data)
        
        # Create a new version for the restoration itself (audit trail)
        await self.create_version(project.id, user_id, version.version_data)
        
        return updated_project
