from pydantic import BaseModel, ConfigDict
from typing import Any, Dict, Optional
from datetime import datetime

class BuildingDesignBase(BaseModel):
    design_name: Optional[str] = None
    design_type: Optional[str] = None
    design_data: Optional[Dict[str, Any]] = None

class BuildingDesignCreate(BuildingDesignBase):
    design_name: str
    design_type: str
    design_data: Dict[str, Any]
    project_id: int

class BuildingDesignUpdate(BuildingDesignBase):
    pass

class BuildingDesign(BuildingDesignBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
