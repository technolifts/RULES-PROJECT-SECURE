from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.gzip import GZipMiddleware

from app.api.api import api_router
from app.core.config import settings
from app.middleware.security_headers import SecurityHeadersMiddleware

# Create rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="DocSecure API",
    description="API for secure document management",
    version="0.1.0",
)

# Add rate limiter to the app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add security middlewares
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1"])
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include API router
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to DocSecure API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
