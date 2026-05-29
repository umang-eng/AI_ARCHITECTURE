from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional
from app.models.project_version import ProjectVersion
from app.schemas.project_version import ProjectVersionCreate

class ProjectVersionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, version_id: int) -> Optional[ProjectVersion]:
        result = await self.db.execute(select(ProjectVersion).filter(ProjectVersion.id == version_id))
        return result.scalars().first()

    async def get_latest_version_number(self, project_id: int) -> int:
        result = await self.db.execute(
            select(func.max(ProjectVersion.version_number)).filter(ProjectVersion.project_id == project_id)
        )
        max_version = result.scalar()
        return max_version if max_version is not None else 0

    async def create(self, obj_in: ProjectVersionCreate) -> ProjectVersion:
        db_obj = ProjectVersion(
            project_id=obj_in.project_id,
            version_number=obj_in.version_number,
            version_data=obj_in.version_data
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def get_multi_by_project(self, project_id: int, skip: int = 0, limit: int = 100) -> List[ProjectVersion]:
        result = await self.db.execute(
            select(ProjectVersion)
            .filter(ProjectVersion.project_id == project_id)
            .order_by(ProjectVersion.version_number.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
