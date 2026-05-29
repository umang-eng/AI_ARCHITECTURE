from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from typing import List, Optional
from app.models.chat import ChatMessage
from app.schemas.chat import ChatMessageCreate

class ChatMessageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_multi_by_project(self, project_id: int, skip: int = 0, limit: int = 100) -> List[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .filter(ChatMessage.project_id == project_id)
            .order_by(ChatMessage.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create(self, obj_in: ChatMessageCreate) -> ChatMessage:
        db_obj = ChatMessage(
            project_id=obj_in.project_id,
            role=obj_in.role,
            message=obj_in.message
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def delete_by_project(self, project_id: int) -> bool:
        await self.db.execute(delete(ChatMessage).where(ChatMessage.project_id == project_id))
        await self.db.commit()
        return True
