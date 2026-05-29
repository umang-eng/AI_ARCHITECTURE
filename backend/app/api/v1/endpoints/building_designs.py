from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.session import get_db
from app.services.building_design import BuildingDesignService
from app.schemas.building_design import BuildingDesign, BuildingDesignCreate, BuildingDesignUpdate
from app.api.deps import get_current_active_user
from app.models.user import User as UserModel

router = APIRouter()

@router.post("/", response_model=BuildingDesign, status_code=status.HTTP_201_CREATED)
async def create_building_design(
    design_in: BuildingDesignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    design_service = BuildingDesignService(db)
    return await design_service.create_design(current_user.id, design_in)

@router.get("/project/{project_id}", response_model=List[BuildingDesign])
async def read_project_designs(
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    design_service = BuildingDesignService(db)
    return await design_service.get_project_designs(current_user.id, project_id, skip=skip, limit=limit)

@router.get("/{design_id}", response_model=BuildingDesign)
async def read_building_design(
    design_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    design_service = BuildingDesignService(db)
    return await design_service.get_design(current_user.id, design_id)

@router.put("/{design_id}", response_model=BuildingDesign)
async def update_building_design(
    design_id: int,
    design_in: BuildingDesignUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    design_service = BuildingDesignService(db)
    return await design_service.update_design(current_user.id, design_id, design_in)

@router.delete("/{design_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_building_design(
    design_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    design_service = BuildingDesignService(db)
    await design_service.delete_design(current_user.id, design_id)
    return None
