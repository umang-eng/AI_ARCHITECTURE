"""Architect agent orchestration for requirement extraction and design generation."""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Mapping, Optional

from pydantic import ValidationError

from app.ai.providers.base_provider import BaseAIProvider
from app.ai.prompts.architect_prompt import (
    ARCHITECT_REQUIREMENTS_SYSTEM_PROMPT,
    BLUEPRINT_GENERATION_SYSTEM_PROMPT,
    build_architect_prompt,
    build_blueprint_prompt,
    build_requirements_extraction_prompt,
)
from app.ai.schemas.building_schema import AIResponseEnvelope, BuildingDesign, BuildingRequirements

logger = logging.getLogger(__name__)


class ArchitectAgent:
    """Orchestrates prompt creation, provider calls, and response validation."""

    def __init__(self, provider: BaseAIProvider):
        self.provider = provider

    async def extract_requirements(self, user_prompt: str) -> BuildingRequirements:
        """Extract and validate building requirements from natural language."""
        if not user_prompt or not user_prompt.strip():
            raise ValueError("user_prompt is required")

        prompt = build_requirements_extraction_prompt(user_prompt)
        schema = BuildingRequirements.model_json_schema()

        logger.info("architect_requirements_extraction_started")
        try:
            response = await self.provider.generate_json(
                prompt=prompt,
                system_prompt=ARCHITECT_REQUIREMENTS_SYSTEM_PROMPT,
                schema=schema,
                temperature=0,
            )
        except Exception:
            logger.exception("architect_provider_call_failed")
            raise

        if isinstance(response, dict) and response.get("success") is False:
            err_msg = response.get("error") or "provider_json_generation_failed"
            raise RuntimeError(f"provider_error: {err_msg}")

        candidate = self._extract_json_candidate(response)
        try:
            requirements = BuildingRequirements.model_validate(candidate)
        except ValidationError:
            logger.exception("architect_requirements_validation_failed")
            raise

        logger.info(
            "architect_requirements_extraction_succeeded",
            extra={
                "building_type": requirements.building_type,
                "floors": requirements.floors,
                "bedrooms": requirements.bedrooms,
                "bathrooms": requirements.bathrooms,
            },
        )
        return requirements

    async def generate_design(
        self,
        requirements: BuildingRequirements,
        user_prompt: Optional[str] = None,
    ) -> AIResponseEnvelope:
        envelope = AIResponseEnvelope()
        prompt = build_architect_prompt(requirements, user_prompt=user_prompt)

        # Provide the full spatial Pydantic JSON schema
        schema_hint: Dict[str, Any] = BuildingDesign.model_json_schema()

        try:
            logger.info("architect_design_generation_started")
            raw = await self.provider.generate_json(prompt, schema=schema_hint, temperature=0.75)
        except Exception as exc:  # pragma: no cover - provider issues
            logger.exception("architect_design_provider_call_failed")
            envelope.mark_error(f"provider_error: {exc}")
            return envelope

        if isinstance(raw, dict) and raw.get("success") is False:
            err_msg = raw.get("error") or "provider_json_generation_failed"
            envelope.mark_error(f"provider_error: {err_msg}")
            return envelope

        envelope.raw = raw if isinstance(raw, dict) else {"result": raw}

        # Try to coerce into typed BuildingDesign
        try:
            # If the provider returned nested containers, try common keys
            candidate = raw
            if not isinstance(candidate, dict):
                raise ValueError("provider returned non-dict payload")
            for key in ("json", "data", "result", "design", "payload", "structured"):
                if key in candidate and isinstance(candidate[key], dict):
                    candidate = candidate[key]
                    break

            design = BuildingDesign.model_validate(candidate)
            envelope.payload = design
            envelope.success = True
            logger.info("architect_design_generation_succeeded")
            return envelope

        except ValidationError as v_err:
            logger.exception("architect_design_validation_failed")
            envelope.mark_error(f"validation_error: {v_err}")
            return envelope
        except Exception as err:  # pragma: no cover - defensive
            logger.exception("architect_design_unexpected_error")
            envelope.mark_error(f"unexpected_error: {err}")
            return envelope

    @staticmethod
    def _extract_json_candidate(response: Any) -> Mapping[str, Any]:
        """Normalize provider envelopes into the JSON object to validate."""
        if isinstance(response, str):
            loaded = json.loads(response)
            if isinstance(loaded, dict):
                return loaded
            raise TypeError("provider returned JSON that is not an object")

        if not isinstance(response, dict):
            raise TypeError("provider returned non-dict payload")

        for key in ("json", "data", "result", "structured", "requirements", "payload"):
            value = response.get(key)
            if isinstance(value, dict):
                return value
            if isinstance(value, str):
                loaded = json.loads(value)
                if isinstance(loaded, dict):
                    return loaded

        return response

    async def generate_blueprint_schema(
        self,
        plot_width: float,
        plot_length: float,
        bedrooms: int,
        bathrooms: int,
        floors: int,
        building_type: str,
        style: str,
        has_garage: bool = False,
        has_garden: bool = False,
        has_pool: bool = False,
        has_office: bool = False,
        user_prompt: Optional[str] = None,
        variant: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate a complete BlueprintSchema via AI provider.

        Returns the raw blueprint dict ready for validation.
        Raises on provider or validation errors.
        """
        from app.blueprint_engine.schemas import BlueprintSchema

        prompt = build_blueprint_prompt(
            plot_width=plot_width,
            plot_length=plot_length,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            floors=floors,
            building_type=building_type,
            style=style,
            has_garage=has_garage,
            has_garden=has_garden,
            has_pool=has_pool,
            has_office=has_office,
            user_prompt=user_prompt,
            variant=variant,
        )

        logger.info("architect_blueprint_generation_started", extra={
            "plot": f"{plot_width}x{plot_length}",
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "floors": floors,
        })

        raw = await self.provider.generate_json(
            prompt=prompt,
            system_prompt=BLUEPRINT_GENERATION_SYSTEM_PROMPT,
            temperature=0.7,
        )

        if isinstance(raw, dict) and raw.get("success") is False:
            err_msg = raw.get("error") or "provider_json_generation_failed"
            raise RuntimeError(f"provider_error: {err_msg}")

        # Normalize nested responses
        candidate = raw
        if isinstance(candidate, dict):
            for key in ("json", "data", "result", "structured", "blueprint", "payload"):
                if key in candidate and isinstance(candidate[key], dict):
                    candidate = candidate[key]
                    break

        if not isinstance(candidate, dict):
            raise ValueError("AI returned non-dict blueprint payload")

        # Validate against BlueprintSchema
        try:
            validated = BlueprintSchema.model_validate(candidate)
        except ValidationError as ve:
            logger.warning("architect_blueprint_validation_failed", extra={"errors": str(ve)})
            # Try to repair common issues and re-validate
            repaired = self._repair_blueprint(candidate, plot_width, plot_length, bedrooms, bathrooms, floors)
            validated = BlueprintSchema.model_validate(repaired)

        blueprint_dict = validated.model_dump(mode="json")

        logger.info("architect_blueprint_generation_succeeded", extra={
            "rooms": len(validated.rooms),
            "walls": len(validated.walls),
            "doors": len(validated.doors),
            "windows": len(validated.windows),
        })

        return blueprint_dict

    @staticmethod
    def _repair_blueprint(
        data: Dict[str, Any],
        plot_width: float,
        plot_length: float,
        bedrooms: int,
        bathrooms: int,
        floors: int,
    ) -> Dict[str, Any]:
        """Attempt to repair common AI blueprint issues before validation."""
        import math

        # Ensure required top-level keys
        data.setdefault("project", {})
        data["project"].setdefault("name", "AI Generated Blueprint")
        data["project"].setdefault("building_type", "residential")
        data["project"].setdefault("style", "modern")

        data.setdefault("plot", {})
        data["plot"].setdefault("width", plot_width)
        data["plot"].setdefault("length", plot_length)
        data["plot"].setdefault("unit", "ft")
        # Force plot to match requested dimensions
        data["plot"]["width"] = plot_width
        data["plot"]["length"] = plot_length

        # Ensure floors
        if "floors" not in data or not isinstance(data["floors"], list) or len(data["floors"]) == 0:
            data["floors"] = [
                {"level": i, "name": f"Floor {i+1}", "height_ft": 10}
                for i in range(max(1, floors))
            ]

        # Ensure rooms with correct area_sqft AND clamp to plot bounds
        if "rooms" in data and isinstance(data["rooms"], list):
            for i, room in enumerate(data["rooms"]):
                room.setdefault("id", f"r{i+1}")
                room.setdefault("level", 0)
                room.setdefault("height_ft", 10)
                room.setdefault("is_habitable", True)
                room.setdefault("room_type", "generic")
                room.setdefault("name", f"Room {i+1}")

                # Clamp room position and size to plot boundary
                x = max(0, float(room.get("x", 0)))
                y = max(0, float(room.get("y", 0)))
                w = float(room.get("width", 0))
                l = float(room.get("length", 0))

                # Ensure positive dimensions
                w = max(1, w)
                l = max(1, l)

                # Clamp to plot bounds
                if x + w > plot_width:
                    w = max(1, plot_width - x)
                if y + l > plot_length:
                    l = max(1, plot_length - y)
                # If room starts outside plot, move it inside
                if x >= plot_width:
                    x = max(0, plot_width - w)
                if y >= plot_length:
                    y = max(0, plot_length - l)

                room["x"] = round(x, 1)
                room["y"] = round(y, 1)
                room["width"] = round(w, 1)
                room["length"] = round(l, 1)
                room["area_sqft"] = round(w * l, 1)
                room.setdefault("color_hex", "#FFFFFF")

                # Set sensible default room_type if still generic
                if room["room_type"] == "generic":
                    name_lower = room["name"].lower()
                    if "bedroom" in name_lower or "master" in name_lower:
                        room["room_type"] = "bedroom"
                    elif "bath" in name_lower:
                        room["room_type"] = "bathroom"
                    elif "kitchen" in name_lower:
                        room["room_type"] = "kitchen"
                    elif "living" in name_lower:
                        room["room_type"] = "living"
                    elif "dining" in name_lower:
                        room["room_type"] = "dining"
                    elif "hallway" in name_lower or "corridor" in name_lower:
                        room["room_type"] = "hallway"
                    elif "garage" in name_lower:
                        room["room_type"] = "garage"
                    elif "garden" in name_lower:
                        room["room_type"] = "garden"
                    elif "stair" in name_lower:
                        room["room_type"] = "staircase"
                    elif "office" in name_lower or "study" in name_lower:
                        room["room_type"] = "office"
                    elif "pool" in name_lower:
                        room["room_type"] = "pool"

                # Set sensible default color if still #FFFFFF
                if room["color_hex"] == "#FFFFFF":
                    color_map = {
                        "bedroom": "#E8F4F8", "bathroom": "#F0F8E8",
                        "kitchen": "#FFF8E1", "living": "#FFF3E0",
                        "dining": "#FCE4EC", "hallway": "#F5F5F5",
                        "garage": "#EEEEEE", "garden": "#E8F5E9",
                        "staircase": "#F3E5F5", "office": "#E3F2FD",
                        "pool": "#E0F7FA", "storage": "#FAFAFA",
                    }
                    room["color_hex"] = color_map.get(room["room_type"], "#FFFFFF")
        else:
            data["rooms"] = []

        # Remove rooms that are too small (degenerate)
        data["rooms"] = [r for r in data["rooms"] if r.get("width", 0) > 0.5 and r.get("length", 0) > 0.5]

        # Ensure walls with correct types and deduplication
        if "walls" not in data or not isinstance(data["walls"], list):
            data["walls"] = []
        # Clamp wall coordinates to plot bounds
        for wall in data["walls"]:
            wall["x1"] = max(0, min(plot_width, float(wall.get("x1", 0))))
            wall["y1"] = max(0, min(plot_length, float(wall.get("y1", 0))))
            wall["x2"] = max(0, min(plot_width, float(wall.get("x2", 0))))
            wall["y2"] = max(0, min(plot_length, float(wall.get("y2", 0))))

        # Ensure doors - clamp to plot bounds
        if "doors" not in data or not isinstance(data["doors"], list):
            data["doors"] = []
        for i, door in enumerate(data["doors"]):
            door.setdefault("id", f"d{i+1}")
            door.setdefault("width", 3)
            door.setdefault("height", 7)
            door.setdefault("door_type", "single")
            door.setdefault("level", 0)
            door.setdefault("is_main_entrance", False)
            door["x"] = max(0, min(plot_width, float(door.get("x", 0))))
            door["y"] = max(0, min(plot_length, float(door.get("y", 0))))
            door["width"] = max(1, min(8, float(door.get("width", 3))))

        # Ensure windows - clamp to plot bounds
        if "windows" not in data or not isinstance(data["windows"], list):
            data["windows"] = []
        for i, win in enumerate(data["windows"]):
            win.setdefault("id", f"win{i+1}")
            win.setdefault("width", 4)
            win.setdefault("height", 4)
            win.setdefault("sill_height", 3)
            win.setdefault("window_type", "casement")
            win.setdefault("level", 0)
            win["x"] = max(0, min(plot_width, float(win.get("x", 0))))
            win["y"] = max(0, min(plot_length, float(win.get("y", 0))))
            win["width"] = max(1, min(12, float(win.get("width", 4))))

        # Ensure stairs - clamp to plot bounds
        if "stairs" not in data or not isinstance(data["stairs"], list):
            data["stairs"] = []
        for stair in data["stairs"]:
            stair["x"] = max(0, min(plot_width, float(stair.get("x", 0))))
            stair["y"] = max(0, min(plot_length, float(stair.get("y", 0))))

        # Ensure roof
        data.setdefault("roof", {})
        data["roof"].setdefault("roof_type", "flat")
        data["roof"].setdefault("pitch", 0)
        data["roof"].setdefault("overhang", 1)
        data["roof"].setdefault("height_ft", 2)
        data["roof"].setdefault("material", "concrete")
        data["roof"].setdefault("color_hex", "#808080")

        # Ensure measurements
        data.setdefault("measurements", {})
        total_area = plot_width * plot_length
        data["measurements"]["total_area_sqft"] = total_area
        footprint = sum(
            r.get("width", 0) * r.get("length", 0) for r in data.get("rooms", [])
        )
        data["measurements"]["footprint_sqft"] = round(footprint, 1)
        data["measurements"]["door_count"] = len(data.get("doors", []))
        data["measurements"]["window_count"] = len(data.get("windows", []))

        # Ensure metadata
        data.setdefault("metadata", {})
        data["metadata"].setdefault("generated_by", "AI Architect Engine")
        data["metadata"].setdefault("engine_version", "2.0")
        data["metadata"].setdefault("variant", "A")
        data["metadata"].setdefault("validation_status", "pending")
        data["metadata"].setdefault("validation_errors", [])

        return data
