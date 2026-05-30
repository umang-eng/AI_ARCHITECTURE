from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, Optional

from google import genai
from google.genai import types

from app.ai.providers.base_provider import BaseAIProvider
from app.ai.monitoring import ai_call_context
from app.ai.middleware import track_ai_call

logger = logging.getLogger(__name__)


class GeminiProvider(BaseAIProvider):
    """Google Gemini AI model provider using the official google-genai SDK."""

    DEFAULT_MODEL = "gemini-2.5-flash"

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_model: Optional[str] = None,
    ) -> None:
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.default_model_name = (
            default_model or os.getenv("GEMINI_MODEL") or self.DEFAULT_MODEL
        )
        
        # Initialize the official GenAI client
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    def _get_client(self) -> genai.Client:
        """Helper to get client or raise configuration error."""
        if not self.client:
            raise RuntimeError(
                "GeminiProvider API key is not configured. "
                "Set GEMINI_API_KEY in your environment/settings."
            )
        return self.client

    @track_ai_call
    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any,
    ) -> str:
        client = self._get_client()
        model_name = model or self.default_model_name

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
            max_output_tokens=max_tokens,
        )

        try:
            # Execute async content generation using client.aio
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )

            # Extract and store token usage metrics in contextvars
            if response.usage_metadata:
                ai_call_context.set({
                    "usage": {
                        "prompt_tokens": response.usage_metadata.prompt_token_count or 0,
                        "completion_tokens": response.usage_metadata.candidates_token_count or 0,
                        "total_tokens": response.usage_metadata.total_token_count or 0,
                    }
                })

            if response.text is not None:
                return response.text

            raise RuntimeError("Gemini returned an empty text response.")

        except Exception as exc:
            logger.exception("gemini_text_generation_failed")
            raise RuntimeError(f"gemini_error: {exc}") from exc

    def _clean_schema_for_gemini(self, schema: Any) -> Any:
        """Recursively clean the JSON schema to remove Gemini-incompatible fields like exclusiveMinimum and additionalProperties."""
        if isinstance(schema, dict):
            cleaned = {}
            for k, v in schema.items():
                if k in ("additionalProperties", "additional_properties"):
                    continue
                elif k == "exclusiveMinimum":
                    cleaned["minimum"] = v
                elif k == "exclusiveMaximum":
                    cleaned["maximum"] = v
                else:
                    cleaned[k] = self._clean_schema_for_gemini(v)
            return cleaned
        elif isinstance(schema, list):
            return [self._clean_schema_for_gemini(item) for item in schema]
        return schema

    @track_ai_call
    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        schema: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        client = self._get_client()
        model_name = model or self.default_model_name

        cleaned_schema = self._clean_schema_for_gemini(schema) if schema is not None else None

        # Request a JSON-formatted response
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=kwargs.get("temperature", 0.75),
            response_mime_type="application/json",
            response_schema=cleaned_schema,
        )

        try:
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )

            # Extract and store token usage metrics in contextvars
            if response.usage_metadata:
                ai_call_context.set({
                    "usage": {
                        "prompt_tokens": response.usage_metadata.prompt_token_count or 0,
                        "completion_tokens": response.usage_metadata.candidates_token_count or 0,
                        "total_tokens": response.usage_metadata.total_token_count or 0,
                    }
                })

            text = response.text
            if not text:
                raise RuntimeError("Gemini returned empty content for JSON request.")

            # Load and parse the returned JSON string
            decoded = json.loads(text.strip())
            
            # Conforming response structure expected by caller
            return {
                "success": True,
                "json": decoded,
                "raw": text,
                "status": 200,
                "error": None,
                "provider": "gemini",
                "model": model_name,
            }

        except Exception as exc:
            logger.exception("gemini_json_generation_failed")
            # Conforming failure structure
            return {
                "success": False,
                "json": None,
                "raw": None,
                "status": 500,
                "error": str(exc),
                "provider": "gemini",
                "model": model_name,
            }

    async def get_model_info(self) -> Dict[str, Any]:
        return {"provider": "gemini", "model": self.default_model_name}
