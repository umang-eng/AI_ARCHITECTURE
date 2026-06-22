from fastapi import APIRouter
from app.api.v1.endpoints import users, auth, projects, project_versions, project_files, chat, building_designs, admin, architect, blueprint_ai, vision, reconstruction, interior

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(project_versions.router, prefix="/projects", tags=["project_versions"])
api_router.include_router(project_files.router, prefix="/projects", tags=["project_files"])
api_router.include_router(chat.router, prefix="/projects", tags=["chat"])
api_router.include_router(building_designs.router, prefix="/designs", tags=["building_designs"])
api_router.include_router(architect.router, prefix="/architect", tags=["architect"])
api_router.include_router(blueprint_ai.router, prefix="/blueprint-ai", tags=["blueprint_ai"])
api_router.include_router(vision.router, prefix="/vision", tags=["vision"])
api_router.include_router(reconstruction.router, prefix="/reconstruction", tags=["reconstruction"])
api_router.include_router(interior.router, prefix="/interior", tags=["interior"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
