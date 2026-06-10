"""PEFT/QLoRA provider — wraps ModelLoader into the BaseAIProvider interface.

This provider talks directly to the local GPU-loaded model (no HTTP).
It is the production path for the trained blueprint adapter.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional

from app.ai.providers.base_provider import BaseAIProvider
from app.ai.model_loader import get_model_loader

logger = logging.getLogger(__name__)


class PeftProvider(BaseAIProvider):
    """AI provider backed by a locally loaded PEFT/QLoRA model.

    Uses the singleton ModelLoader to avoid redundant GPU loads.
    All inference is async via asyncio.to_thread inside ModelLoader.
    """

    DEFAULT_SYSTEM_PROMPT = (
        "You are an expert architect AI. "
        "Generate accurate building designs and blueprints in JSON format."
    )

    def __init__(
        self,
        adapter_name: Optional[str] = None,
        max_new_tokens: int = 2048,
        temperature: float = 0.1,
    ) -> None:
        self._adapter_name = adapter_name
        self._max_new_tokens = max_new_tokens
        self._temperature = temperature

    async def _ensure_loaded(self) -> None:
        loader = get_model_loader()
        if not loader.is_loaded:
            await asyncio.to_thread(loader.load, self._adapter_name)
        elif self._adapter_name and loader.active_adapter != self._adapter_name:
            await loader.swap_adapter_async(self._adapter_name)

    # ── BaseAIProvider interface ───────────────────────────────────────

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any,
    ) -> str:
        await self._ensure_loaded()

        messages = self._build_messages(prompt, system_prompt)
        loader = get_model_loader()

        result = await loader.generate_async(
            messages=messages,
            max_new_tokens=max_tokens or self._max_new_tokens,
            temperature=temperature,
            do_sample=temperature > 0,
        )
        return result

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        schema: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        await self._ensure_loaded()

        # Append JSON schema hint to prompt for better structured output
        augmented_prompt = prompt
        if schema:
            augmented_prompt += (
                "\n\nRespond ONLY with valid JSON matching this schema:\n"
                + json.dumps(schema, indent=2)
            )

        messages = self._build_messages(augmented_prompt, system_prompt)
        loader = get_model_loader()

        raw = await loader.generate_async(
            messages=messages,
            max_new_tokens=self._max_new_tokens,
            temperature=self._temperature,
            do_sample=self._temperature > 0,
        )

        # Parse JSON from response
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                return {
                    "success": True,
                    "json": parsed,
                    "raw": raw,
                    "status": 200,
                    "error": None,
                    "provider": "peft",
                    "model": loader.active_adapter,
                }
        except json.JSONDecodeError:
            pass

        # Try to extract JSON from markdown code blocks
        extracted = self._extract_json_from_markdown(raw)
        if extracted is not None:
            return {
                "success": True,
                "json": extracted,
                "raw": raw,
                "status": 200,
                "error": None,
                "provider": "peft",
                "model": loader.active_adapter,
            }

        return {
            "success": False,
            "json": {},
            "raw": raw,
            "status": 200,
            "error": "json_parse_failed",
            "provider": "peft",
            "model": loader.active_adapter,
        }

    async def get_model_info(self) -> Dict[str, Any]:
        loader = get_model_loader()
        info = loader.get_info()
        info["provider"] = "peft"
        return info

    # ── Helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _build_messages(prompt: str, system_prompt: Optional[str]) -> List[Dict[str, str]]:
        messages: List[Dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        return messages

    @staticmethod
    def _extract_json_from_markdown(text: str) -> Optional[Dict[str, Any]]:
        """Extract JSON from ```json ... ``` code blocks."""
        import re
        patterns = [
            r"```json\s*\n(.*?)\n\s*```",
            r"```\s*\n(.*?)\n\s*```",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    continue
        return None
