from typing import Any, Dict, Optional
from app.ai.providers.base_provider import BaseAIProvider

class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: str, default_model: str = "gemini-1.5-pro"):
        self.api_key = api_key
        self.default_model = default_model

    async def generate_text(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any
    ) -> str:
        # Implementation for Google Gemini API call
        return f"[Gemini Mock Response] to: {prompt[:50]}..."

    async def generate_json(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        schema: Optional[Dict[str, Any]] = None,
        **kwargs: Any
    ) -> Dict[str, Any]:
        # Implementation for Gemini JSON mode
        return {"mock": "gemini_json_response", "prompt_preview": prompt[:50]}

    async def get_model_info(self) -> Dict[str, Any]:
        return {
            "provider": "google",
            "model": self.default_model
        }
