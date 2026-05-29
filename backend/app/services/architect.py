"""Service layer for architectural AI analysis.

ArchitectService is the single coordination point between API endpoints and
the AI agent layer.  It owns:
  1. Prompt reception & validation
  2. ArchitectAgent orchestration
  3. Post-agent Pydantic schema validation
  4. In-memory result caching for downstream project creation

The service accepts its dependencies (ArchitectAgent) via constructor injection
so it can be trivially tested with fakes/mocks and swapped at the DI boundary.
"""
from __future__ import annotations

import logging
import time
import uuid
from typing import Any, Dict, Optional

from pydantic import ValidationError

from app.ai.agents.architect_agent import ArchitectAgent
from app.ai.schemas.building_schema import (
    AIResponseEnvelope,
    BuildingRequirements,
)

logger = logging.getLogger(__name__)


class ArchitectService:
    """Coordinates AI-driven architectural analysis tasks.

    Parameters
    ----------
    agent : ArchitectAgent
        The agent instance that wraps the AI provider.  Injected so
        the caller (endpoint / test) controls which provider backs it.
    """

    def __init__(self, agent: ArchitectAgent) -> None:
        self._agent = agent
        # In-memory cache keyed by session id → latest BuildingRequirements.
        # Used by downstream flows (project creation, floorplan gen, etc.)
        # to avoid re-extracting the same requirements.
        self._results_cache: Dict[str, BuildingRequirements] = {}

    # ------------------------------------------------------------------
    # Core method
    # ------------------------------------------------------------------

    async def analyze_requirements(
        self,
        prompt: str,
        *,
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Extract, validate, and cache building requirements from *prompt*.

        Parameters
        ----------
        prompt : str
            Natural language description of the desired building.
        session_id : str, optional
            A caller-supplied correlation id.  When omitted a UUID is
            generated automatically.  The id is returned in the response
            and can be used to retrieve cached results later.

        Returns
        -------
        dict
            ``{"success": True, "session_id": ..., "requirements": BuildingRequirements,
              "elapsed_ms": ...}``
            on success.

        Raises
        ------
        ValueError
            If *prompt* is empty or blank.
        ValidationError
            If the AI output cannot be coerced into a valid
            ``BuildingRequirements`` schema.
        RuntimeError
            If the underlying AI provider is unreachable.
        """
        if not prompt or not prompt.strip():
            raise ValueError("prompt must be a non-empty string")

        sid = session_id or uuid.uuid4().hex[:12]

        logger.info(
            "architect_service_analyze_started",
            extra={"session_id": sid, "prompt_length": len(prompt)},
        )

        t0 = time.monotonic()

        # --- 1. Delegate to the agent (provider call + JSON extraction) ---
        try:
            requirements = await self._agent.extract_requirements(prompt)
        except ValidationError:
            logger.exception(
                "architect_service_validation_failed",
                extra={"session_id": sid},
            )
            raise
        except Exception:
            logger.exception(
                "architect_service_agent_failed",
                extra={"session_id": sid},
            )
            raise

        elapsed_ms = round((time.monotonic() - t0) * 1000, 2)

        # --- 2. Cache for downstream use (project creation, floorplan, etc.) ---
        self._results_cache[sid] = requirements

        logger.info(
            "architect_service_analyze_succeeded",
            extra={
                "session_id": sid,
                "elapsed_ms": elapsed_ms,
                "building_type": requirements.building_type,
                "style": requirements.style,
                "floors": requirements.floors,
            },
        )

        return {
            "success": True,
            "session_id": sid,
            "requirements": requirements,
            "elapsed_ms": elapsed_ms,
        }

    # ------------------------------------------------------------------
    # Cache access
    # ------------------------------------------------------------------

    def get_cached_requirements(
        self, session_id: str
    ) -> Optional[BuildingRequirements]:
        """Retrieve previously extracted requirements by *session_id*."""
        return self._results_cache.get(session_id)

    # ------------------------------------------------------------------
    # Future expansion stubs
    # ------------------------------------------------------------------

    async def generate_floorplan(
        self,
        session_id: str,
    ) -> Dict[str, Any]:
        """Generate a floorplan layout from cached requirements.

        .. note:: Not yet implemented — raises ``NotImplementedError``.
        """
        requirements = self._results_cache.get(session_id)
        if requirements is None:
            raise ValueError(
                f"No cached requirements for session_id={session_id!r}. "
                "Call analyze_requirements first."
            )
        raise NotImplementedError(
            "generate_floorplan is planned for a future release"
        )

    async def generate_cost_estimation(
        self,
        session_id: str,
    ) -> Dict[str, Any]:
        """Produce a cost estimation report from cached requirements.

        .. note:: Not yet implemented — raises ``NotImplementedError``.
        """
        requirements = self._results_cache.get(session_id)
        if requirements is None:
            raise ValueError(
                f"No cached requirements for session_id={session_id!r}. "
                "Call analyze_requirements first."
            )
        raise NotImplementedError(
            "generate_cost_estimation is planned for a future release"
        )

    async def generate_design_options(
        self,
        session_id: str,
    ) -> Dict[str, Any]:
        """Generate multiple design alternatives from cached requirements.

        .. note:: Not yet implemented — raises ``NotImplementedError``.
        """
        requirements = self._results_cache.get(session_id)
        if requirements is None:
            raise ValueError(
                f"No cached requirements for session_id={session_id!r}. "
                "Call analyze_requirements first."
            )
        raise NotImplementedError(
            "generate_design_options is planned for a future release"
        )
