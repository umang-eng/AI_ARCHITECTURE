from pydantic import BaseModel, ConfigDict
from typing import Any, Dict
from datetime import datetime

class ProjectVersionBase(BaseModel):
    version_data: Dict[str, Any]

class ProjectVersionCreate(ProjectVersionBase):
    project_id: int
    version_number: int

class ProjectVersion(ProjectVersionBase):
    id: int
    project_id: int
    version_number: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProjectVersionRestore(BaseModel):
    version_id: int
