from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.chat import ChatRole

class ChatMessageBase(BaseModel):
    role: ChatRole
    message: str

class ChatMessageCreate(ChatMessageBase):
    project_id: int

class ChatMessage(ChatMessageBase):
    id: int
    project_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
