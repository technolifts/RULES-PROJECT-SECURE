from fastapi import APIRouter

from app.api.endpoints import auth, users, documents, share_links

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(share_links.router, prefix="/share-links", tags=["share-links"])
