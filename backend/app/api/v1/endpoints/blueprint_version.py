import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.blueprint import Blueprint, BlueprintVersion
from app.schemas.blueprint_version import (
    SaveBlueprintRequest,
    SaveBlueprintResponse,
    BlueprintDetailResponse,
    BlueprintVersionResponse,
)
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/save", response_model=SaveBlueprintResponse, status_code=200)
async def save_blueprint(
    request: SaveBlueprintRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    blueprint = Blueprint(
        user_id=user.id,
        name=request.name,
        building_type=request.building_type,
        style=request.style,
        plot_width=request.plot_width,
        plot_height=request.plot_height,
        current_version=1,
    )
    db.add(blueprint)
    await db.flush()

    version = BlueprintVersion(
        blueprint_id=blueprint.id,
        version=1,
        seed=request.seed,
        blueprint_data=request.blueprint,
    )
    db.add(version)
    await db.commit()
    await db.refresh(blueprint)
    await db.refresh(version)

    return SaveBlueprintResponse(
        blueprint_id=blueprint.id,
        version_id=version.id,
        version=1,
    )


@router.get("/{blueprint_id}", response_model=BlueprintDetailResponse, status_code=200)
async def get_blueprint(
    blueprint_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Blueprint).where(Blueprint.id == blueprint_id, Blueprint.user_id == user.id)
    )
    blueprint = result.scalar_one_or_none()
    if not blueprint:
        raise HTTPException(status_code=404, detail="Blueprint not found")

    versions_result = await db.execute(
        select(BlueprintVersion)
        .where(BlueprintVersion.blueprint_id == blueprint_id)
        .order_by(BlueprintVersion.version)
    )
    versions = versions_result.scalars().all()

    return BlueprintDetailResponse(
        id=blueprint.id,
        name=blueprint.name,
        building_type=blueprint.building_type,
        style=blueprint.style,
        plot_width=blueprint.plot_width,
        plot_height=blueprint.plot_height,
        current_version=blueprint.current_version,
        versions=[
            BlueprintVersionResponse(
                id=v.id,
                version=v.version,
                seed=v.seed,
                blueprint=v.blueprint_data,
                created_at=v.created_at.isoformat() if v.created_at else "",
            )
            for v in versions
        ],
        created_at=blueprint.created_at.isoformat() if blueprint.created_at else "",
    )
