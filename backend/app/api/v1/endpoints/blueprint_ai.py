"""Blueprint AI endpoints — generate blueprints using the trained PEFT model.

These endpoints use the local QLoRA adapter for inference (no external API needed).
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.providers.peft_provider import PeftProvider
from app.ai.agents.architect_agent import ArchitectAgent

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Request/Response Schemas ──────────────────────────────────────────

class BlueprintGenerateRequest(BaseModel):
    prompt: str = Field(..., description="Natural language blueprint description")
    system_prompt: Optional[str] = Field(
        None,
        description="Optional system prompt override",
    )
    max_tokens: int = Field(2048, ge=64, le=4096)
    temperature: float = Field(0.1, ge=0.0, le=2.0)


class BlueprintGenerateResponse(BaseModel):
    success: bool
    blueprint: Optional[Dict[str, Any]] = None
    raw_output: Optional[str] = None
    error: Optional[str] = None
    adapter: Optional[str] = None


class AdapterInfoResponse(BaseModel):
    loaded: bool
    active_adapter: Optional[str] = None
    device: Optional[str] = None
    available_adapters: List[str] = []


class SwapAdapterRequest(BaseModel):
    adapter_name: str = Field(..., description="Name of the adapter to swap to")


# ── Endpoints ─────────────────────────────────────────────────────────

@router.post("/generate", response_model=BlueprintGenerateResponse)
async def generate_blueprint_from_ai(request: BlueprintGenerateRequest):
    """Generate a blueprint using the trained PEFT model.

    The model takes natural language and outputs structured JSON blueprint data.
    """
    logger.info("peft_blueprint_generation_started", extra={"prompt_len": len(request.prompt)})

    try:
        provider = PeftProvider(
            max_new_tokens=request.max_tokens,
            temperature=request.temperature,
        )

        # Use the architect agent's blueprint generation system prompt
        from app.ai.prompts.architect_prompt import BLUEPRINT_GENERATION_SYSTEM_PROMPT

        system = request.system_prompt or BLUEPRINT_GENERATION_SYSTEM_PROMPT
        result = await provider.generate_json(
            prompt=request.prompt,
            system_prompt=system,
        )

        if not result.get("success"):
            return BlueprintGenerateResponse(
                success=False,
                error=result.get("error", "generation_failed"),
                raw_output=result.get("raw"),
                adapter=result.get("model"),
            )

        blueprint_json = result.get("json", {})

        # Validate against BlueprintSchema
        from app.blueprint_engine.schemas import BlueprintSchema
        try:
            validated = BlueprintSchema.model_validate(blueprint_json)
            return BlueprintGenerateResponse(
                success=True,
                blueprint=validated.model_dump(mode="json"),
                adapter=result.get("model"),
            )
        except Exception:
            # Return raw JSON if schema validation fails
            logger.warning("peft_blueprint_schema_validation_failed")
            return BlueprintGenerateResponse(
                success=True,
                blueprint=blueprint_json,
                adapter=result.get("model"),
            )

    except Exception as exc:
        logger.exception("peft_blueprint_generation_failed")
        raise HTTPException(status_code=500, detail=f"Blueprint generation failed: {exc}")


@router.post("/extract-requirements")
async def extract_requirements_from_ai(request: BlueprintGenerateRequest):
    """Extract structured building requirements from natural language."""
    logger.info("peft_requirements_extraction_started")

    try:
        provider = PeftProvider(
            max_new_tokens=request.max_tokens,
            temperature=0,  # Deterministic for extraction
        )

        from app.ai.schemas.building_schema import BuildingRequirements
        schema = BuildingRequirements.model_json_schema()

        result = await provider.generate_json(
            prompt=request.prompt,
            system_prompt="Extract building requirements from the user's description. Respond with valid JSON.",
            schema=schema,
        )

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "extraction_failed"))

        return {"success": True, "requirements": result.get("json", {})}

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("peft_requirements_extraction_failed")
        raise HTTPException(status_code=500, detail=f"Requirements extraction failed: {exc}")


@router.get("/model-info", response_model=AdapterInfoResponse)
async def get_model_info():
    """Get information about the currently loaded model and adapter."""
    provider = PeftProvider()
    info = await provider.get_model_info()
    return AdapterInfoResponse(
        loaded=info.get("loaded", False),
        active_adapter=info.get("active_adapter"),
        device=info.get("device"),
        available_adapters=info.get("available_adapters", []),
    )


@router.post("/swap-adapter")
async def swap_adapter(request: SwapAdapterRequest):
    """Hot-swap to a different LoRA adapter without restarting."""
    try:
        from app.ai.model_loader import get_model_loader
        loader = get_model_loader()
        await loader.swap_adapter_async(request.adapter_name)
        return {
            "success": True,
            "active_adapter": loader.active_adapter,
            "message": f"Swapped to adapter '{request.adapter_name}'",
        }
    except Exception as exc:
        logger.exception("adapter_swap_failed")
        raise HTTPException(status_code=500, detail=f"Adapter swap failed: {exc}")


@router.get("/adapters")
async def list_adapters():
    """List all available adapters from the registry."""
    from app.ai.model_loader import ModelRegistry
    registry = ModelRegistry()
    adapters = {}
    for name, cfg in registry._data.get("adapters", {}).items():
        adapters[name] = {
            "description": cfg.get("description"),
            "active": cfg.get("active", False),
            "base_model": cfg.get("base_model"),
            "task_type": cfg.get("task_type"),
        }
    return {"adapters": adapters, "active": registry.active_adapter_name}
