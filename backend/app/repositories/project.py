from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from typing import List
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate

class ProjectRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, project_id: int) -> Project | None:
        result = await self.db.execute(select(Project).filter(Project.id == project_id))
        return result.scalars().first()

    async def get_multi_by_user(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Project]:
        result = await self.db.execute(
            select(Project)
            .filter(Project.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create(self, obj_in: ProjectCreate, user_id: int) -> Project:
        db_obj = Project(
            project_name=obj_in.project_name,
            project_description=obj_in.project_description,
            building_type=obj_in.building_type,
            status=obj_in.status,
            user_id=user_id
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, project_id: int, obj_in: ProjectUpdate) -> Project | None:
        update_data = obj_in.model_dump(exclude_unset=True)
        if update_data:
            await self.db.execute(
                update(Project)
                .where(Project.id == project_id)
                .values(**update_data)
            )
            await self.db.commit()
        return await self.get_by_id(project_id)

    async def delete(self, project_id: int) -> bool:
        await self.db.execute(delete(Project).where(Project.id == project_id))
        await self.db.commit()
        return True
