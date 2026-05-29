from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Any, Dict, Optional

import httpx

from app.ai.providers.base_provider import BaseAIProvider

logger = logging.getLogger(__name__)


class DeepSeekProvider(BaseAIProvider):
    """Async HTTP adapter for DeepSeek-like AI service using httpx.

    Responsibilities:
    - Build provider-specific payloads
    - Perform async HTTP requests with timeout and retries
    - Return structured responses and surface errors cleanly

    The provider uses the environment variable `DEEPSEEK_API_KEY` for auth and
    `DEEPSEEK_API_URL` to override the endpoint.
    """

    DEFAULT_MODEL = "deepseek-chat"

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_model: Optional[str] = None,
        base_url: Optional[str] = None,
        max_retries: int = 3,
        backoff_factor: float = 0.5,
    ) -> None:
        self.api_key = api_key or os.getenv("DEEPSEEK_API_KEY")
        self.default_model_name = default_model or os.getenv("DEEPSEEK_MODEL") or self.DEFAULT_MODEL
        self.base_url = (base_url or os.getenv("DEEPSEEK_API_URL") or "https://api.deepseek.com/v1").rstrip("/")
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor

    async def _request(self, path: str, payload: Dict[str, Any], timeout_seconds: float = 30.0) -> Dict[str, Any]:
        """Perform async POST with retries and timeout, return parsed JSON or raw.

        Returns a dict with keys: success(bool), status(int), json(dict|None), raw(str|None), error(str|None)
        """
        url = f"{self.base_url}/{path.lstrip('/')}"
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        if not self.api_key:
            return {
                "success": True,
                "status": 200,
                "json": {
                    "mock": True,
                    "text": f"[MOCK] DeepSeek generated text for model={self.default_model_name}",
                    "structured": {"note": "mock-structured-output", "preview": (payload.get("prompt") or "")[:200]},
                },
                "raw": None,
                "error": None,
            }

        attempt = 0
        last_exc: Optional[BaseException] = None
        while attempt <= self.max_retries:
            try:
                timeout = httpx.Timeout(timeout_seconds)
                async with httpx.AsyncClient(timeout=timeout) as client:
                    logger.info("deepseek_request_started", extra={"path": path, "attempt": attempt + 1})
                    resp = await client.post(url, json=payload, headers=headers)
                    text = resp.text
                    status = resp.status_code
                    try:
                        parsed = resp.json()
                    except Exception:
                        parsed = None

                    if 200 <= status < 300:
                        return {"success": True, "status": status, "json": parsed, "raw": text, "error": None}

                    # For server errors, raise to trigger retry
                    if 500 <= status < 600:
                        last_exc = RuntimeError(f"server_error:{status}")
                        logger.warning("deepseek_server_error", extra={"status": status, "attempt": attempt + 1})
                        raise last_exc

                    # Client error — do not retry
                    logger.warning("deepseek_client_error", extra={"status": status})
                    return {"success": False, "status": status, "json": parsed, "raw": text, "error": f"http_{status}"}

            except (httpx.RequestError, httpx.TimeoutException, RuntimeError) as exc:
                last_exc = exc
                attempt += 1
                if attempt > self.max_retries:
                    break
                backoff = self.backoff_factor * (2 ** (attempt - 1))
                await asyncio.sleep(backoff)

        return {"success": False, "status": None, "json": None, "raw": None, "error": str(last_exc) if last_exc else "unknown_error"}

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
        """Generate text with DeepSeek's OpenAI-compatible chat API."""
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

        raise RuntimeError(result.get("error") or "deepseek_text_generation_failed")

    async def generate_response(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """Backward-compatible envelope for callers that still expect it."""
        try:
            text = await self.generate_text(*args, **kwargs)
            return {
                "success": True,
                "text": text,
                "status": 200,
                "json": None,
                "raw": text,
                "error": None,
                "provider": "deepseek",
                "model": kwargs.get("model") or self.default_model_name,
            }
        except Exception as exc:
            return {
                "success": False,
                "text": None,
                "status": None,
                "json": None,
                "raw": None,
                "error": str(exc),
                "provider": "deepseek",
                "model": kwargs.get("model") or self.default_model_name,
            }

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        schema: Optional[Dict[str, Any]] = None,
        timeout_seconds: float = 30.0,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Request a structured JSON response. Returns envelope: success, json, raw, status, error, provider, model
        """
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
                        return {"success": True, "json": decoded, "raw": result.get("raw"), "status": result.get("status"), "error": None, "provider": "deepseek", "model": payload["model"]}
                except json.JSONDecodeError:
                    logger.warning("deepseek_json_decode_failed")

            # If provider returns structured payload under common keys, extract
            if isinstance(parsed, dict):
                for key in ("json", "data", "result", "structured", "design", "payload"):
                    if key in parsed and isinstance(parsed[key], dict):
                        return {"success": True, "json": parsed[key], "raw": result.get("raw"), "status": result.get("status"), "error": None, "provider": "deepseek", "model": payload["model"]}
            # If parsed is directly the object
            if isinstance(parsed, dict):
                return {"success": True, "json": parsed, "raw": result.get("raw"), "status": result.get("status"), "error": None, "provider": "deepseek", "model": payload["model"]}

            # Attempt to coerce from raw text
            raw = result.get("raw")
            if isinstance(raw, str):
                try:
                    co = json.loads(raw)
                    if isinstance(co, dict):
                        return {"success": True, "json": co, "raw": raw, "status": result.get("status"), "error": None, "provider": "deepseek", "model": payload["model"]}
                except Exception:
                    pass

        return {"success": False, "json": None, "raw": result.get("raw"), "status": result.get("status"), "error": result.get("error"), "provider": "deepseek", "model": model or self.default_model_name}

    async def get_model_info(self) -> Dict[str, Any]:
        return {"provider": "deepseek", "model": self.default_model_name, "base_url": self.base_url}

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
            response = body.get("response")
            if isinstance(response, dict) and isinstance(response.get("text"), str):
                return response["text"]

        return raw if isinstance(raw, str) and raw.strip() else None
