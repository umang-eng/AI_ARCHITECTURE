from fastapi import APIRouter
from app.api.v1.endpoints import users, auth, projects, project_versions, project_files, chat, building_designs, admin

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(project_versions.router, prefix="/projects", tags=["project_versions"])
api_router.include_router(project_files.router, prefix="/projects", tags=["project_files"])
api_router.include_router(chat.router, prefix="/projects", tags=["chat"])
api_router.include_router(building_designs.router, prefix="/designs", tags=["building_designs"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
