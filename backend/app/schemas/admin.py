from pydantic import BaseModel
from typing import Dict

class StorageUsage(BaseModel):
    bytes: int
    kb: float
    mb: float
    gb: float

class SystemStats(BaseModel):
    total_users: int
    total_projects: int
    storage_usage: StorageUsage
    active_sessions: int
