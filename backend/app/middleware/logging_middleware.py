"""Request/response logging middleware for FastAPI."""

import time
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger: structlog.stdlib.BoundLogger = structlog.get_logger("middleware.http")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log every HTTP request and response with timing information."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = uuid.uuid4().hex[:12]
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        start = time.perf_counter()
        method = request.method
        path = request.url.path

        logger.info(
            "request_started",
            http_method=method,
            http_path=path,
        )

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.error(
                "request_failed",
                http_method=method,
                http_path=path,
                duration_ms=duration_ms,
                exc_info=True,
            )
            raise

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        status_code = response.status_code

        log_kw = dict(
            http_method=method,
            http_path=path,
            http_status=status_code,
            duration_ms=duration_ms,
        )

        if status_code >= 500:
            logger.error("request_completed", **log_kw)
        elif status_code >= 400:
            logger.warning("request_completed", **log_kw)
        else:
            logger.info("request_completed", **log_kw)

        return response
