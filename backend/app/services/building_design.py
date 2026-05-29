from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.repositories.building_design import BuildingDesignRepository
from app.repositories.project import ProjectRepository
from app.schemas.building_design import BuildingDesignCreate, BuildingDesignUpdate

class BuildingDesignService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.design_repo = BuildingDesignRepository(db)
        self.project_repo = ProjectRepository(db)

    async def create_design(self, user_id: int, design_in: BuildingDesignCreate):
        # Verify project ownership
        project = await self.project_repo.get_by_id(design_in.project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

        return await self.design_repo.create(design_in)

    async def get_design(self, user_id: int, design_id: int):
        design = await self.design_repo.get_by_id(design_id)
        if not design:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Design not found")
        
        project = await self.project_repo.get_by_id(design.project_id)
        if project.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
            
        return design

    async def get_project_designs(self, user_id: int, project_id: int, skip: int = 0, limit: int = 100):
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
            
        return await self.design_repo.get_multi_by_project(project_id, skip=skip, limit=limit)

    async def update_design(self, user_id: int, design_id: int, design_in: BuildingDesignUpdate):
        await self.get_design(user_id, design_id)  # Validate ownership
        return await self.design_repo.update(design_id, design_in)

    async def delete_design(self, user_id: int, design_id: int):
        await self.get_design(user_id, design_id)  # Validate ownership
        return await self.design_repo.delete(design_id)
