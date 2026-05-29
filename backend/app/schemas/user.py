from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[UserRole] = UserRole.USER
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    email: EmailStr
    name: str
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class UserInDB(User):
    hashed_password: str
