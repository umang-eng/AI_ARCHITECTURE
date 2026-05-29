"""FastAPI routes for the Architect AI subsystem.

All business logic lives in ``ArchitectService``; this module is purely the
HTTP boundary: request parsing, DI wiring, response serialisation, and
HTTP-status error mapping.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError

from app.ai.agents.architect_agent import ArchitectAgent
from app.ai.manager import AIManager, ai_manager
from app.ai.schemas.building_schema import BuildingRequirements
from app.schemas.architect import (
    AnalyzeRequest,
    AnalyzeResponse,
    ExtractRequirementsRequest,
)
from app.services.architect import ArchitectService

router = APIRouter()
logger = logging.getLogger(__name__)


# ── Dependency Injection ─────────────────────────────────────────────

def get_ai_manager() -> AIManager:
    """Provide the global AIManager singleton."""
    return ai_manager


def get_architect_agent(
    manager: AIManager = Depends(get_ai_manager),
) -> ArchitectAgent:
    """Build an ArchitectAgent backed by the configured DeepSeek provider."""
    provider = manager.get_provider("deepseek")
    return ArchitectAgent(provider=provider)


def get_architect_service(
    agent: ArchitectAgent = Depends(get_architect_agent),
) -> ArchitectService:
    """Build an ArchitectService wrapping the injected agent."""
    return ArchitectService(agent=agent)


# ── Endpoints ────────────────────────────────────────────────────────

@router.post(
    "/extract-requirements",
    response_model=BuildingRequirements,
    status_code=status.HTTP_200_OK,
)
async def extract_requirements(
    request: ExtractRequirementsRequest,
    service: ArchitectService = Depends(get_architect_service),
):
    """Extract structured building requirements from a natural language prompt.

    Delegates to ``ArchitectService.analyze_requirements`` and returns the
    validated ``BuildingRequirements`` schema directly.
    """
    logger.info(
        "api_extract_requirements_started",
        extra={"prompt_length": len(request.prompt)},
    )

    try:
        result = await service.analyze_requirements(request.prompt)
        requirements: BuildingRequirements = result["requirements"]

        logger.info(
            "api_extract_requirements_succeeded",
            extra={
                "building_type": requirements.building_type,
                "style": requirements.style,
                "floors": requirements.floors,
                "bedrooms": requirements.bedrooms,
                "bathrooms": requirements.bathrooms,
            },
        )
        return requirements

    except ValidationError as val_err:
        logger.exception("api_extract_requirements_validation_failed")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "AI generated invalid building specifications",
                "errors": val_err.errors(),
            },
        )
    except ValueError as val_err:
        logger.warning(
            "api_extract_requirements_bad_request",
            extra={"error": str(val_err)},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        logger.exception("api_extract_requirements_failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during requirement extraction: {exc}",
        )


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_200_OK,
)
async def analyze_prompt(
    request: AnalyzeRequest,
    service: ArchitectService = Depends(get_architect_service),
):
    """Analyse a prompt and return a validated requirements envelope.

    The response shape matches ``{"success": true, "requirements": {…}}``.
    All orchestration and caching is handled by ``ArchitectService``.
    """
    logger.info(
        "api_analyze_prompt_started",
        extra={"prompt_length": len(request.prompt)},
    )

    try:
        result = await service.analyze_requirements(request.prompt)

        logger.info(
            "api_analyze_prompt_succeeded",
            extra={
                "session_id": result["session_id"],
                "elapsed_ms": result["elapsed_ms"],
                "building_type": result["requirements"].building_type,
                "style": result["requirements"].style,
                "floors": result["requirements"].floors,
            },
        )
        return AnalyzeResponse(
            success=True,
            requirements=result["requirements"],
        )

    except ValidationError as val_err:
        logger.exception("api_analyze_validation_failed")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Extracted specifications failed response validation",
                "errors": val_err.errors(),
            },
        )
    except ValueError as val_err:
        logger.warning(
            "api_analyze_bad_request", extra={"error": str(val_err)}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        logger.exception("api_analyze_failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during architectural prompt analysis: {exc}",
        )
