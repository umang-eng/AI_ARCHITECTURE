from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from typing import List, Optional
from app.models.building_design import BuildingDesign
from app.schemas.building_design import BuildingDesignCreate, BuildingDesignUpdate

class BuildingDesignRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, design_id: int) -> Optional[BuildingDesign]:
        result = await self.db.execute(select(BuildingDesign).filter(BuildingDesign.id == design_id))
        return result.scalars().first()

    async def get_multi_by_project(self, project_id: int, skip: int = 0, limit: int = 100) -> List[BuildingDesign]:
        result = await self.db.execute(
            select(BuildingDesign)
            .filter(BuildingDesign.project_id == project_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create(self, obj_in: BuildingDesignCreate) -> BuildingDesign:
        db_obj = BuildingDesign(
            project_id=obj_in.project_id,
            design_name=obj_in.design_name,
            design_type=obj_in.design_type,
            design_data=obj_in.design_data
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, design_id: int, obj_in: BuildingDesignUpdate) -> Optional[BuildingDesign]:
        update_data = obj_in.model_dump(exclude_unset=True)
        if update_data:
            await self.db.execute(
                update(BuildingDesign)
                .where(BuildingDesign.id == design_id)
                .values(**update_data)
            )
            await self.db.commit()
        return await self.get_by_id(design_id)

    async def delete(self, design_id: int) -> bool:
        await self.db.execute(delete(BuildingDesign).where(BuildingDesign.id == design_id))
        await self.db.commit()
        return True
