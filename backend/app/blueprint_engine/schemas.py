"""Universal Blueprint Schema — single source of truth for all architectural data.

Matches the frontend BlueprintSchema type exactly.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class BuildingType(str, Enum):
    HOUSE = "house"
    VILLA = "villa"
    DUPLEX = "duplex"
    APARTMENT = "apartment"
    OFFICE = "office"
    COMMERCIAL = "commercial"
    SHOP = "shop"


class ArchitecturalStyle(str, Enum):
    MODERN = "modern"
    MINIMALIST = "minimalist"
    INDUSTRIAL = "industrial"
    CONTEMPORARY = "contemporary"
    TRADITIONAL = "traditional"
    MEDITERRANEAN = "mediterranean"
    VICTORIAN = "victorian"


class ProjectInfo(BaseModel):
    name: str = Field(default="New Project")
    description: str = Field(default="")
    building_type: BuildingType = Field(default=BuildingType.HOUSE)
    style: ArchitecturalStyle = Field(default=ArchitecturalStyle.MODERN)
    client_name: Optional[str] = None
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    version: str = Field(default="1.0")


class PlotInfo(BaseModel):
    width: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    unit: str = Field(default="ft")


class FloorInfo(BaseModel):
    level: int = Field(..., ge=0)
    name: str = Field(default="Ground Floor")
    height_ft: float = Field(default=10, ge=8, le=20)


class RoomData(BaseModel):
    id: str = Field(default="")
    name: str = Field(..., min_length=1)
    room_type: str = Field(default="generic")
    x: float = Field(..., ge=0)
    y: float = Field(..., ge=0)
    width: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    level: int = Field(default=0)
    color_hex: str = Field(default="#FFFFFF")


class WallData(BaseModel):
    id: str = Field(default="")
    x1: float
    y1: float
    x2: float
    y2: float
    thickness: float = Field(default=0.5, gt=0, le=2)
    wall_type: str = Field(default="interior")


class DoorData(BaseModel):
    id: str = Field(default="")
    x: float
    y: float
    width: float = Field(default=3, gt=1, le=8)
    orientation: str = Field(default="horizontal")
    is_main_entrance: bool = Field(default=False)


class WindowData(BaseModel):
    id: str = Field(default="")
    x: float
    y: float
    width: float = Field(default=4, gt=1, le=12)
    orientation: str = Field(default="horizontal")


class StairData(BaseModel):
    id: str = Field(default="")
    x: float
    y: float
    width: float = Field(default=4, gt=2, le=10)
    height: float = Field(default=8, ge=3, le=20)
    direction: str = Field(default="up")


class BlueprintMetadata(BaseModel):
    generated_by: str = Field(default="AI Architect Engine")
    generation_timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    engine_version: str = Field(default="3.0")
    variant: str = Field(default="A")
    validation_status: str = Field(default="pending")
    validation_errors: List[str] = Field(default_factory=list)


class BlueprintSchema(BaseModel):
    model_config = ConfigDict(validate_default=True, extra="forbid")

    project: ProjectInfo = Field(default_factory=ProjectInfo)
    plot: PlotInfo
    floors: List[FloorInfo] = Field(default_factory=list)
    rooms: List[RoomData] = Field(default_factory=list)
    walls: List[WallData] = Field(default_factory=list)
    doors: List[DoorData] = Field(default_factory=list)
    windows: List[WindowData] = Field(default_factory=list)
    stairs: List[StairData] = Field(default_factory=list)
    metadata: BlueprintMetadata = Field(default_factory=BlueprintMetadata)
