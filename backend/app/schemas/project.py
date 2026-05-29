from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.project import ProjectStatus

class ProjectBase(BaseModel):
    project_name: Optional[str] = None
    project_description: Optional[str] = None
    building_type: Optional[str] = None
    status: Optional[ProjectStatus] = ProjectStatus.DRAFT

class ProjectCreate(ProjectBase):
    project_name: str
    building_type: str

class ProjectUpdate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
