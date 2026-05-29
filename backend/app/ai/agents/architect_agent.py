"""Architect agent orchestration for requirement extraction and design generation."""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, Mapping

from pydantic import ValidationError

from app.ai.providers.base_provider import BaseAIProvider
from app.ai.prompts.architect_prompt import (
    ARCHITECT_REQUIREMENTS_SYSTEM_PROMPT,
    build_architect_prompt,
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

    async def generate_design(self, requirements: BuildingRequirements) -> AIResponseEnvelope:
        envelope = AIResponseEnvelope()
        prompt = build_architect_prompt(requirements)

        # Provide a very small JSON schema hint (providers may or may not support)
        schema_hint: Dict[str, Any] = {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "summary": {"type": "string"},
                "floors": {"type": "number"},
                "total_area_m2": {"type": "number"},
                "rooms": {"type": "array"},
                "footprint_m2": {"type": "number"},
                "estimated_cost_usd": {"type": "number"},
                "notes": {"type": "string"},
            },
            "required": ["name", "summary"]
        }

        try:
            logger.info("architect_design_generation_started")
            raw = await self.provider.generate_json(prompt, schema=schema_hint)
        except Exception as exc:  # pragma: no cover - provider issues
            logger.exception("architect_design_provider_call_failed")
            envelope.mark_error(f"provider_error: {exc}")
            return envelope

        envelope.raw = raw if isinstance(raw, dict) else {"result": raw}

        # Try to coerce into typed BuildingDesign
        try:
            # If the provider returned nested containers, try common keys
            candidate = raw
            if not isinstance(candidate, dict):
                raise ValueError("provider returned non-dict payload")
            for key in ("data", "result", "design", "payload"):
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
