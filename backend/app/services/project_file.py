import os
import shutil
import uuid
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.repositories.project_file import ProjectFileRepository
from app.repositories.project import ProjectRepository
from app.schemas.project_file import ProjectFileCreate
from app.core.config import settings

class ProjectFileService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.file_repo = ProjectFileRepository(db)
        self.project_repo = ProjectRepository(db)

    async def upload_file(self, project_id: int, user_id: int, file: UploadFile):
        # 1. Verify project ownership
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

        # 2. Validate file extension
        extension = file.filename.split(".")[-1].lower()
        if extension not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"File extension {extension} not allowed. Supported: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        # 3. Create upload directory if it doesn't exist
        project_dir = os.path.join(settings.UPLOAD_DIR, str(project_id))
        os.makedirs(project_dir, exist_ok=True)

        # 4. Save file to disk with unique name
        file_id = str(uuid.uuid4())
        unique_filename = f"{file_id}_{file.filename}"
        file_path = os.path.join(project_dir, unique_filename)
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Could not save file: {e}")

        # 5. Get file size
        file_size = os.path.getsize(file_path)

        # 6. Save metadata to DB
        file_in = ProjectFileCreate(
            project_id=project_id,
            file_name=file.filename,
            file_type=file.content_type,
            file_size=file_size,
            storage_path=file_path
        )
        return await self.file_repo.create(file_in)

    async def get_project_files(self, project_id: int, user_id: int):
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
            
        return await self.file_repo.get_multi_by_project(project_id)

    async def delete_file(self, file_id: int, user_id: int):
        file_record = await self.file_repo.get_by_id(file_id)
        if not file_record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        
        project = await self.project_repo.get_by_id(file_record.project_id)
        if project.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

        # Delete from disk
        if os.path.exists(file_record.storage_path):
            os.remove(file_record.storage_path)
            
        # Delete from DB
        return await self.file_repo.delete(file_id)
