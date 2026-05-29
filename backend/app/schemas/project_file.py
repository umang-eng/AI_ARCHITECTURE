from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ProjectFileBase(BaseModel):
    file_name: str
    file_type: str
    file_size: int

class ProjectFileCreate(ProjectFileBase):
    project_id: int
    storage_path: str

class ProjectFile(ProjectFileBase):
    id: int
    project_id: int
    storage_path: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
