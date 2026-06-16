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
    prompt: Optional[str] = Field(None, description="Natural language blueprint description")
    plot_width: Optional[float] = Field(None, description="Plot width")
    plot_height: Optional[float] = Field(None, description="Plot height/length")
    bedrooms: Optional[int] = Field(None, description="Number of bedrooms")
    bathrooms: Optional[int] = Field(None, description="Number of bathrooms")
    floors: Optional[int] = Field(None, description="Number of floors")
    building_type: Optional[str] = Field(None, description="Building type")
    style: Optional[str] = Field(None, description="Architectural style")
    variant: Optional[str] = Field(None, description="Variant name")
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


def to_frontend_blueprint(blueprint_json: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize and translate a generated blueprint JSON to the exact format expected by the frontend validator."""
    if not isinstance(blueprint_json, dict):
        blueprint_json = {}

    # Extract or fallback for plot
    plot_raw = blueprint_json.get("plot", {})
    if isinstance(plot_raw, list) and len(plot_raw) > 0:
        plot_raw = plot_raw[0]
    if not isinstance(plot_raw, dict):
        plot_raw = {}

    pw = plot_raw.get("width") or plot_raw.get("plot_width") or plot_raw.get("plot_width_feet") or 60.0
    ph = plot_raw.get("height") or plot_raw.get("length") or plot_raw.get("plot_length") or plot_raw.get("plot_length_feet") or 80.0
    
    try:
        pw = float(pw)
    except (ValueError, TypeError):
        pw = 60.0
    try:
        ph = float(ph)
    except (ValueError, TypeError):
        ph = 80.0

    frontend_plot = {"width": pw, "height": ph}

    # Extract and clean rooms
    rooms_raw = blueprint_json.get("rooms")
    if not isinstance(rooms_raw, list):
        rooms_raw = blueprint_json.get("blueprint")
    if not isinstance(rooms_raw, list):
        rooms_raw = []

    VALID_ROOM_TYPES = {
        "bedroom", "master_bedroom", "kitchen", "living_room", "dining",
        "bathroom", "hallway", "garage", "garden", "office", "utility",
        "laundry", "closet", "study", "balcony", "terrace", "pool", "storage", "living"
    }

    frontend_rooms = []
    for i, r in enumerate(rooms_raw):
        if not isinstance(r, dict):
            continue
        
        rx = r.get("x") or r.get("room_x") or 0.0
        ry = r.get("y") or r.get("room_y") or 0.0
        rw = r.get("width") or r.get("room_width") or 10.0
        rh = r.get("height") or r.get("length") or r.get("room_length") or r.get("room_height") or 10.0

        try:
            rx = float(rx)
            ry = float(ry)
            rw = float(rw)
            rh = float(rh)
        except (ValueError, TypeError):
            rx, ry, rw, rh = 0.0, 0.0, 10.0, 10.0

        rid = r.get("id") or r.get("room_id") or f"room_{i+1}"
        
        raw_type = r.get("type") or r.get("room_type") or r.get("name") or "bedroom"
        raw_type_str = str(raw_type).lower().strip()

        if raw_type_str in VALID_ROOM_TYPES:
            rtype = raw_type_str
        elif "living" in raw_type_str or "lounge" in raw_type_str or "family" in raw_type_str:
            rtype = "living_room"
        elif "master" in raw_type_str:
            rtype = "master_bedroom"
        elif "bed" in raw_type_str:
            rtype = "bedroom"
        elif "bath" in raw_type_str or "wash" in raw_type_str or "toilet" in raw_type_str or "wc" in raw_type_str:
            rtype = "bathroom"
        elif "kitchen" in raw_type_str:
            rtype = "kitchen"
        elif "din" in raw_type_str:
            rtype = "dining"
        elif "hall" in raw_type_str or "stair" in raw_type_str or "corridor" in raw_type_str:
            rtype = "hallway"
        elif "garden" in raw_type_str or "yard" in raw_type_str or "lawn" in raw_type_str or "courtyard" in raw_type_str:
            rtype = "garden"
        elif "pool" in raw_type_str:
            rtype = "pool"
        elif "study" in raw_type_str:
            rtype = "study"
        elif "office" in raw_type_str:
            rtype = "office"
        elif "garage" in raw_type_str:
            rtype = "garage"
        elif "closet" in raw_type_str:
            rtype = "closet"
        elif "store" in raw_type_str:
            rtype = "storage"
        elif "utility" in raw_type_str or "laundry" in raw_type_str:
            rtype = "utility"
        else:
            rtype = "bedroom"

        frontend_rooms.append({
            "id": str(rid),
            "type": rtype,
            "x": rx,
            "y": ry,
            "width": rw,
            "height": rh
        })

    # Extract and clean doors
    doors_raw = blueprint_json.get("doors") or []
    if not isinstance(doors_raw, list):
        doors_raw = []

    frontend_doors = []
    for i, d in enumerate(doors_raw):
        if not isinstance(d, dict):
            continue
        dx = d.get("x") or 0.0
        dy = d.get("y") or 0.0
        dw = d.get("width") or 3.0
        did = d.get("id") or d.get("door_id") or f"door_{i+1}"
        d_orient = d.get("orientation") or "horizontal"
        if d_orient not in ("horizontal", "vertical"):
            d_orient = "horizontal"

        try:
            dx = float(dx)
            dy = float(dy)
            dw = float(dw)
        except (ValueError, TypeError):
            dx, dy, dw = 0.0, 0.0, 3.0

        frontend_doors.append({
            "id": str(did),
            "x": dx,
            "y": dy,
            "width": dw,
            "orientation": d_orient
        })

    # Extract and clean windows
    windows_raw = blueprint_json.get("windows") or []
    if not isinstance(windows_raw, list):
        windows_raw = []

    frontend_windows = []
    for i, w in enumerate(windows_raw):
        if not isinstance(w, dict):
            continue
        wx = w.get("x") or 0.0
        wy = w.get("y") or 0.0
        ww = w.get("width") or 4.0
        wid = w.get("id") or w.get("window_id") or f"window_{i+1}"
        w_orient = w.get("orientation") or "horizontal"
        if w_orient not in ("horizontal", "vertical"):
            w_orient = "horizontal"

        try:
            wx = float(wx)
            wy = float(wy)
            ww = float(ww)
        except (ValueError, TypeError):
            wx, wy, ww = 0.0, 0.0, 4.0

        frontend_windows.append({
            "id": str(wid),
            "x": wx,
            "y": wy,
            "width": ww,
            "orientation": w_orient
        })

    return {
        "plot": frontend_plot,
        "rooms": frontend_rooms,
        "doors": frontend_doors,
        "windows": frontend_windows
    }


# ── Endpoints ─────────────────────────────────────────────────────────

@router.post("/generate", response_model=BlueprintGenerateResponse)
async def generate_blueprint_from_ai(request: BlueprintGenerateRequest):
    """Generate a blueprint using the trained PEFT model.

    The model takes natural language and outputs structured JSON blueprint data.
    """
    logger.info("peft_blueprint_generation_started", extra={"prompt_len": len(request.prompt) if request.prompt else 0})

    try:
        # Try local PEFT model first
        try:
            # Check CUDA capability to bypass local model loading on macOS (instantly)
            import torch
            if not torch.cuda.is_available():
                raise RuntimeError("CUDA is not available, bypassing local PEFT model loading on macOS")

            provider = PeftProvider(
                max_new_tokens=request.max_tokens,
                temperature=request.temperature,
            )

            # Use the architect agent's blueprint generation system prompt
            from app.ai.prompts.architect_prompt import BLUEPRINT_GENERATION_SYSTEM_PROMPT

            system = request.system_prompt or BLUEPRINT_GENERATION_SYSTEM_PROMPT
            
            # Construct structured instruction for the PEFT model matching its training data
            w = int(request.plot_width or 60)
            h = int(request.plot_height or 80)
            style = request.style or "modern"
            btype = request.building_type or "villa"
            beds = request.bedrooms or 3
            baths = request.bathrooms or 2
            
            peft_prompt = f"{style} {btype} {w}x{h} {beds} Bedrooms {baths} Bathrooms"

            result = await provider.generate_json(
                prompt=peft_prompt,
                system_prompt=system,
            )
            
            if not result.get("success"):
                raise RuntimeError(result.get("error", "PEFT provider success=False"))
        except Exception as exc:
            logger.warning(f"Local PEFT/QLoRA generation failed, falling back to AIManager: {exc}")
            
            from app.ai.manager import ai_manager
            from app.blueprint_engine.schemas import BlueprintSchema
            from app.ai.prompts.architect_prompt import build_blueprint_prompt, BLUEPRINT_GENERATION_SYSTEM_PROMPT

            fallback_provider = ai_manager.get_provider()
            logger.info(f"Using fallback provider: {fallback_provider.__class__.__name__}")
            
            prompt_lower = request.prompt.lower() if request.prompt else ""
            has_garage = "garage" in prompt_lower
            has_garden = "garden" in prompt_lower or "courtyard" in prompt_lower
            has_pool = "pool" in prompt_lower or "swimming" in prompt_lower
            has_office = "office" in prompt_lower or "study" in prompt_lower
            
            full_prompt = build_blueprint_prompt(
                plot_width=request.plot_width or 60.0,
                plot_length=request.plot_height or 80.0,
                bedrooms=request.bedrooms or 3,
                bathrooms=request.bathrooms or 2,
                floors=request.floors or 1,
                building_type=request.building_type or "villa",
                style=request.style or "modern",
                has_garage=has_garage,
                has_garden=has_garden,
                has_pool=has_pool,
                has_office=has_office,
                user_prompt=request.prompt,
                variant=request.variant or "A"
            )
            
            system = request.system_prompt or BLUEPRINT_GENERATION_SYSTEM_PROMPT
            system_prompt = system + "\nYou must strictly output valid JSON conforming to the BlueprintSchema."
            schema = BlueprintSchema.model_json_schema()
            
            result = await fallback_provider.generate_json(
                prompt=full_prompt,
                system_prompt=system_prompt,
                schema=schema,
                temperature=request.temperature,
            )

        if not result.get("success"):
            return BlueprintGenerateResponse(
                success=False,
                error=result.get("error", "generation_failed"),
                raw_output=result.get("raw"),
                adapter=result.get("model", "fallback"),
            )

        blueprint_json = result.get("json", {})
        frontend_data = to_frontend_blueprint(blueprint_json)
        
        return BlueprintGenerateResponse(
            success=True,
            blueprint=frontend_data,
            adapter=result.get("model", "fallback"),
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
