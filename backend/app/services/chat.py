from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.repositories.chat import ChatMessageRepository
from app.repositories.project import ProjectRepository
from app.schemas.chat import ChatMessageCreate

class ChatMessageService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.chat_repo = ChatMessageRepository(db)
        self.project_repo = ProjectRepository(db)

    async def save_message(self, user_id: int, project_id: int, message_in: ChatMessageCreate):
        # Verify project ownership
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

        return await self.chat_repo.create(message_in)

    async def get_conversation(self, user_id: int, project_id: int, skip: int = 0, limit: int = 100):
        # Verify project ownership
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
            
        return await self.chat_repo.get_multi_by_project(project_id, skip=skip, limit=limit)

    async def delete_conversation(self, user_id: int, project_id: int):
        # Verify project ownership
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

        return await self.chat_repo.delete_by_project(project_id)
