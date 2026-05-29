import time
import logging
import uuid
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from jose import JWTError

logger = logging.getLogger(__name__)

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except HTTPException as e:
            # Re-raise FastAPI HTTP exceptions to let FastAPI handle them (e.g., custom error responses)
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail, "error_code": "HTTP_EXCEPTION"},
            )
        except SQLAlchemyError as e:
            request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
            logger.error(f"Database error [ID: {request_id}]: {str(e)}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "A database error occurred.",
                    "error_code": "DATABASE_ERROR",
                    "request_id": request_id
                },
            )
        except JWTError as e:
            logger.warning(f"Authentication error: {str(e)}")
            return JSONResponse(
                status_code=401,
                content={"detail": "Could not validate credentials", "error_code": "AUTH_ERROR"},
            )
        except Exception as e:
            request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
            logger.error(f"Unhandled exception [ID: {request_id}]: {str(e)}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal Server Error",
                    "error_code": "INTERNAL_SERVER_ERROR",
                    "request_id": request_id
                },
            )

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        start_time = time.time()
        
        # Log request start
        logger.info(
            f"Request started",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client_host": request.client.host if request.client else "unknown"
            }
        )
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Log request completion
            logger.info(
                f"Request finished",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration": f"{process_time:.4f}s"
                }
            )
            
            response.headers["X-Request-ID"] = request_id
            return response
            
        except Exception as e:
            # Exception is handled by ErrorHandlingMiddleware, but we log duration here too if needed
            process_time = time.time() - start_time
            logger.error(
                f"Request failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration": f"{process_time:.4f}s",
                    "error": str(e)
                }
            )
            raise e
