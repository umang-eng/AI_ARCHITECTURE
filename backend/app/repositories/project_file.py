from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from typing import List, Optional
from app.models.project_file import ProjectFile
from app.schemas.project_file import ProjectFileCreate

class ProjectFileRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, file_id: int) -> Optional[ProjectFile]:
        result = await self.db.execute(select(ProjectFile).filter(ProjectFile.id == file_id))
        return result.scalars().first()

    async def get_multi_by_project(self, project_id: int) -> List[ProjectFile]:
        result = await self.db.execute(
            select(ProjectFile)
            .filter(ProjectFile.project_id == project_id)
            .order_by(ProjectFile.created_at.desc())
        )
        return result.scalars().all()

    async def create(self, obj_in: ProjectFileCreate) -> ProjectFile:
        db_obj = ProjectFile(
            project_id=obj_in.project_id,
            file_name=obj_in.file_name,
            file_type=obj_in.file_type,
            file_size=obj_in.file_size,
            storage_path=obj_in.storage_path
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def delete(self, file_id: int) -> bool:
        await self.db.execute(delete(ProjectFile).where(ProjectFile.id == file_id))
        await self.db.commit()
        return True
