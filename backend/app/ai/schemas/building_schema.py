"""Pydantic v2 schemas for building requirements and design outputs.

These models are intentionally small but explicit so agents/providers can
validate and coerce AI responses into well-typed Python objects.
"""
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class Plot(BaseModel):
    model_config = ConfigDict(extra="forbid")

    width: float = Field(..., gt=0, description="Width of the plot in meters; must be > 0")
    length: float = Field(..., gt=0, description="Length of the plot in meters; must be > 0")
    unit: str = Field(..., description="Unit of measurement, e.g. 'm' or 'meters'")


class BuildingRequirements(BaseModel):
    model_config = ConfigDict(extra="forbid")

    building_type: str = Field(..., description="e.g., residential, commercial")
    style: str = Field(..., description="Architectural style or references")
    plot: Plot = Field(..., description="Plot dimensions and unit")
    floors: int = Field(..., ge=1, description="Number of floors; must be >= 1")
    bedrooms: int = Field(..., ge=0, description="Number of bedrooms; must be >= 0")
    bathrooms: int = Field(..., ge=0, description="Number of bathrooms; must be >= 0")
    budget: Optional[float] = Field(None, description="Optional budget in USD")
    features: List[str] = Field(default_factory=list, description="List of requested features")
    parking_spaces: Optional[int] = Field(None, ge=0, description="Optional parking spaces")
    garden: Optional[bool] = Field(None, description="Whether a garden is required")
    swimming_pool: Optional[bool] = Field(None, description="Whether a swimming pool is required")
    office_room: Optional[bool] = Field(None, description="Whether a dedicated office room is required")


class Room(BaseModel):
    name: str
    area_m2: float


class BuildingDesign(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: Optional[str] = None
    name: str
    summary: str
    floors: Optional[int] = None
    total_area_m2: Optional[float] = None
    rooms: List[Room] = Field(default_factory=list)
    footprint_m2: Optional[float] = None
    estimated_cost_usd: Optional[float] = None
    notes: Optional[str] = None


class AIResponseEnvelope(BaseModel):
    success: bool = True
    payload: Optional[BuildingDesign] = None
    raw: Optional[dict] = None
    error: Optional[str] = None

    def mark_error(self, message: str):
        self.success = False
        self.error = message
