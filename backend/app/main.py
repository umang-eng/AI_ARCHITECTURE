# Trigger hot reload for .env changes 5
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Any, cast

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from datetime import datetime, timezone

try:
    from slowapi.extension import _rate_limit_exceeded_handler
except ImportError:  # pragma: no cover - compatibility fallback
    from slowapi import _rate_limit_exceeded_handler

from .core.config import settings
from .middleware.common import ErrorHandlingMiddleware, LoggingMiddleware
from .api.v1.api import api_router
from .utils.logging import setup_logging

logger = logging.getLogger(__name__)

# Setup structured logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: optional model pre-loading on startup."""
    if getattr(settings, "PEFT_LOAD_ON_STARTUP", False):
        try:
            logger.info("pre_loading_peft_model_on_startup")
            from .ai.model_loader import get_model_loader
            loader = get_model_loader()
            adapter = getattr(settings, "PEFT_ACTIVE_ADAPTER", "blueprint_v1")
            await asyncio.to_thread(loader.load, adapter)
            logger.info("peft_model_pre_loaded", extra={"adapter": adapter})
        except Exception as exc:
            logger.warning(f"Failed to pre-load PEFT model: {exc}")
    yield


# Setup rate limiting
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    cast(Any, _rate_limit_exceeded_handler),
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify real origins in settings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middlewares
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(LoggingMiddleware)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
@app.get(f"{settings.API_V1_STR}/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
