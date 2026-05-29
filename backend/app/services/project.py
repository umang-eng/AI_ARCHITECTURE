from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.repositories.project import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate

class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.project_repo = ProjectRepository(db)

    async def create_project(self, user_id: int, project_in: ProjectCreate):
        return await self.project_repo.create(project_in, user_id)

    async def get_project(self, project_id: int, user_id: int):
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
        return project

    async def get_user_projects(self, user_id: int, skip: int = 0, limit: int = 100):
        return await self.project_repo.get_multi_by_user(user_id, skip=skip, limit=limit)

    async def update_project(self, project_id: int, user_id: int, project_in: ProjectUpdate):
        project = await self.get_project(project_id, user_id)
        return await self.project_repo.update(project.id, project_in)

    async def delete_project(self, project_id: int, user_id: int):
        project = await self.get_project(project_id, user_id)
        return await self.project_repo.delete(project.id)
