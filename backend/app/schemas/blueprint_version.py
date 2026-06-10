from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SaveBlueprintRequest(BaseModel):
    name: str = Field(..., min_length=1)
    building_type: str
    style: str
    plot_width: float
    plot_height: float
    seed: int
    blueprint: Dict[str, Any]


class SaveBlueprintResponse(BaseModel):
    success: bool = True
    blueprint_id: int
    version_id: int
    version: int


class BlueprintVersionResponse(BaseModel):
    id: int
    version: int
    seed: int
    blueprint: Dict[str, Any]
    created_at: str


class BlueprintDetailResponse(BaseModel):
    id: int
    name: str
    building_type: str
    style: str
    plot_width: float
    plot_height: float
    current_version: int
    versions: List[BlueprintVersionResponse]
    created_at: str
