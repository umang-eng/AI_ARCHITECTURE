import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from app.models.user import User
from app.models.project import Project
from app.core.config import settings
from datetime import datetime, timedelta

class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_total_users(self) -> int:
        result = await self.db.execute(select(func.count(User.id)))
        return result.scalar() or 0

    async def get_total_projects(self) -> int:
        result = await self.db.execute(select(func.count(Project.id)))
        return result.scalar() or 0

    async def get_storage_usage(self) -> dict:
        """
        Calculate storage usage in bytes and return a human-readable format.
        """
        total_size = 0
        upload_dir = settings.UPLOAD_DIR
        
        if os.path.exists(upload_dir):
            for dirpath, dirnames, filenames in os.walk(upload_dir):
                for f in filenames:
                    fp = os.path.join(dirpath, f)
                    # skip if it is symbolic link
                    if not os.path.islink(fp):
                        total_size += os.path.getsize(fp)
        
        return {
            "bytes": total_size,
            "kb": round(total_size / 1024, 2),
            "mb": round(total_size / (1024 * 1024), 2),
            "gb": round(total_size / (1024 * 1024 * 1024), 2)
        }

    async def get_active_sessions(self) -> int:
        """
        Count users who have been active in the last 15 minutes.
        This is a heuristic for 'active sessions' since we don't store tokens in DB.
        """
        fifteen_minutes_ago = datetime.now() - timedelta(minutes=15)
        result = await self.db.execute(
            select(func.count(User.id)).where(User.updated_at >= fifteen_minutes_ago)
        )
        return result.scalar() or 0

    async def get_system_stats(self) -> dict:
        return {
            "total_users": await self.get_total_users(),
            "total_projects": await self.get_total_projects(),
            "storage_usage": await self.get_storage_usage(),
            "active_sessions": await self.get_active_sessions()
        }
