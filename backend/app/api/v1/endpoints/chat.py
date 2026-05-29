from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.session import get_db
from app.services.chat import ChatMessageService
from app.schemas.chat import ChatMessage, ChatMessageCreate
from app.api.deps import get_current_active_user
from app.models.user import User as UserModel

router = APIRouter()

@router.post("/{project_id}/messages", response_model=ChatMessage, status_code=status.HTTP_201_CREATED)
async def save_chat_message(
    project_id: int,
    message_in: ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    chat_service = ChatMessageService(db)
    return await chat_service.save_message(current_user.id, project_id, message_in)

@router.get("/{project_id}/messages", response_model=List[ChatMessage])
async def read_chat_conversation(
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    chat_service = ChatMessageService(db)
    return await chat_service.get_conversation(current_user.id, project_id, skip=skip, limit=limit)

@router.delete("/{project_id}/messages", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_conversation(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    chat_service = ChatMessageService(db)
    await chat_service.delete_conversation(current_user.id, project_id)
    return None
