from pydantic import BaseModel, Field
from app.ai.schemas.building_schema import BuildingRequirements

class ExtractRequirementsRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Natural language prompt describing the building specifications.")

class AnalyzeRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Natural language prompt describing the building specifications.")

class AnalyzeResponse(BaseModel):
    success: bool = True
    requirements: BuildingRequirements

