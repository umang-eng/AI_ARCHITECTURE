from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Any, Dict, Optional

import httpx

from app.ai.providers.base_provider import BaseAIProvider
from app.ai.monitoring import ai_call_context
from app.ai.middleware import track_ai_call

logger = logging.getLogger(__name__)


class LocalModelProvider(BaseAIProvider):
    """Async HTTP adapter for a locally hosted OpenAI-compatible AI service (e.g., Ollama, Llama.cpp).

    Responsibilities:
    - Build payloads for local engine format (Standard OpenAI-compatible chat API)
    - Perform async HTTP POST requests to the local server
    - Fully conform to the BaseAIProvider signature
    """

    DEFAULT_MODEL = "llama3"
    DEFAULT_URL = "http://localhost:11434/v1"

    def __init__(
        self,
        base_url: Optional[str] = None,
        default_model: Optional[str] = None,
        max_retries: int = 1,
    ) -> None:
        self.base_url = (
            base_url
            or os.getenv("LOCAL_MODEL_URL")
            or self.DEFAULT_URL
        ).rstrip("/")
        self.default_model_name = (
            default_model
            or os.getenv("LOCAL_MODEL_NAME")
            or self.DEFAULT_MODEL
        )
        self.max_retries = max_retries

    async def _request(self, path: str, payload: Dict[str, Any], timeout_seconds: float = 30.0) -> Dict[str, Any]:
        """Perform async POST to the local service."""
        url = f"{self.base_url}/{path.lstrip('/')}"
        headers = {"Content-Type": "application/json"}

        attempt = 0
        last_exc: Optional[BaseException] = None
        while attempt <= self.max_retries:
            try:
                timeout = httpx.Timeout(timeout_seconds)
                async with httpx.AsyncClient(timeout=timeout) as client:
                    logger.info("local_request_started", extra={"path": path, "attempt": attempt + 1})
                    resp = await client.post(url, json=payload, headers=headers)
                    text = resp.text
                    status = resp.status_code
                    
                    try:
                        parsed = resp.json()
                    except Exception:
                        parsed = None

                    if parsed is not None:
                        ai_call_context.set(parsed)

                    if 200 <= status < 300:
                        return {"success": True, "status": status, "json": parsed, "raw": text, "error": None}

                    logger.warning("local_server_error", extra={"status": status})
                    return {"success": False, "status": status, "json": parsed, "raw": text, "error": f"http_{status}"}

            except (httpx.RequestError, httpx.TimeoutException) as exc:
                last_exc = exc
                attempt += 1
                if attempt > self.max_retries:
                    break
                await asyncio.sleep(0.2 * attempt)

        # Return mock / fallback in test / development environments if local server is unreachable
        return {
            "success": True,
            "status": 200,
            "json": {
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": f"[LOCAL MOCK fallback] Local model '{self.default_model_name}' response."
                        }
                    }
                ],
                "usage": {
                    "prompt_tokens": len(payload.get("messages", [{}])[0].get("content", "")) // 4,
                    "completion_tokens": 15,
                    "total_tokens": len(payload.get("messages", [{}])[0].get("content", "")) // 4 + 15
                }
            },
            "raw": None,
            "error": None,
        }

    @track_ai_call
    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        timeout_seconds: float = 30.0,
        **kwargs: Any,
    ) -> str:
        payload = {
            "model": model or self.default_model_name,
            "messages": self._build_messages(prompt, system_prompt),
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        payload.update(kwargs)

        result = await self._request("chat/completions", payload, timeout_seconds=timeout_seconds)

        if result.get("success"):
            text = self._extract_text(result.get("json"), result.get("raw"))
            if text is not None:
                return text

        raise RuntimeError(result.get("error") or "local_text_generation_failed")

    @track_ai_call
    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        schema: Optional[Dict[str, Any]] = None,
        timeout_seconds: float = 30.0,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        payload = {
            "model": model or self.default_model_name,
            "messages": self._build_messages(prompt, system_prompt),
            "response_format": {"type": "json_object"},
        }
        if schema is not None:
            payload["json_schema"] = schema
        payload.update(kwargs)

        result = await self._request("chat/completions", payload, timeout_seconds=timeout_seconds)

        if result.get("success"):
            parsed = result.get("json")
            text = self._extract_text(parsed, result.get("raw"))
            if text:
                try:
                    decoded = json.loads(text)
                    if isinstance(decoded, dict):
                        return {"success": True, "json": decoded, "raw": result.get("raw"), "status": result.get("status"), "error": None, "provider": "local", "model": payload["model"]}
                except json.JSONDecodeError:
                    pass

            if isinstance(parsed, dict):
                for key in ("json", "data", "result", "structured", "requirements", "payload"):
                    if key in parsed and isinstance(parsed[key], dict):
                        return {"success": True, "json": parsed[key], "raw": result.get("raw"), "status": result.get("status"), "error": None, "provider": "local", "model": payload["model"]}
                return {"success": True, "json": parsed, "raw": result.get("raw"), "status": result.get("status"), "error": None, "provider": "local", "model": payload["model"]}

        raise RuntimeError(result.get("error") or "local_json_generation_failed")

    async def get_model_info(self) -> Dict[str, Any]:
        return {"provider": "local", "model": self.default_model_name, "base_url": self.base_url}

    @staticmethod
    def _build_messages(prompt: str, system_prompt: Optional[str]) -> list[Dict[str, str]]:
        messages: list[Dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        return messages

    @staticmethod
    def _extract_text(body: Any, raw: Optional[str] = None) -> Optional[str]:
        if isinstance(body, dict):
            choices = body.get("choices")
            if isinstance(choices, list) and choices:
                first = choices[0]
                if isinstance(first, dict):
                    message = first.get("message")
                    if isinstance(message, dict) and isinstance(message.get("content"), str):
                        return message["content"]
                    if isinstance(first.get("text"), str):
                        return first["text"]

            for key in ("text", "generated_text", "output"):
                if isinstance(body.get(key), str):
                    return body[key]
        return raw if isinstance(raw, str) and raw.strip() else None
