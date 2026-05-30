from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class GenerateBlueprintRequest(BaseModel):
    prompt: Optional[str] = Field(None, description="Natural language description")
    plot_width: float = Field(default=60, gt=0, description="Plot width in feet")
    plot_height: float = Field(default=80, gt=0, description="Plot height in feet")
    bedrooms: int = Field(default=3, ge=1, description="Number of bedrooms")
    bathrooms: int = Field(default=2, ge=1, description="Number of bathrooms")
    floors: int = Field(default=1, ge=1, le=10, description="Number of floors")
    building_type: str = Field(default="house", description="Building type")
    style: str = Field(default="modern", description="Architectural style")
    variant: Optional[str] = Field(None, description="Layout variant (A, B, C, D, E)")
    seed: Optional[int] = Field(None, description="Random seed")
    project_name: str = Field(default="My Blueprint", description="Project name")


class GenerateBlueprintResponse(BaseModel):
    success: bool = True
    blueprint: Dict[str, Any]
    validation: Dict[str, Any]


class GenerateVariationRequest(BaseModel):
    blueprint: Dict[str, Any]
    variant: str = Field(..., description="New variant letter (A-E)")


class GenerateVariationResponse(BaseModel):
    success: bool = True
    blueprint: Dict[str, Any]
    validation: Dict[str, Any]


class ValidateBlueprintRequest(BaseModel):
    blueprint: Dict[str, Any]


class ValidateBlueprintResponse(BaseModel):
    success: bool = True
    validation: Dict[str, Any]


class BlueprintVersionResponse(BaseModel):
    id: str
    blueprint: Dict[str, Any]
    variant: str
    timestamp: str
