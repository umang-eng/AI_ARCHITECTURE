from typing import Any, Dict, Optional
from app.ai.providers.base_provider import BaseAIProvider

class DeepSeekProvider(BaseAIProvider):
    def __init__(self, api_key: str, default_model: str = "deepseek-chat"):
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
        # Implementation for DeepSeek API call
        return f"[DeepSeek Mock Response] to: {prompt[:50]}..."

    async def generate_json(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        schema: Optional[Dict[str, Any]] = None,
        **kwargs: Any
    ) -> Dict[str, Any]:
        # Implementation for DeepSeek JSON mode
        return {"mock": "deepseek_json_response", "prompt_preview": prompt[:50]}

    async def get_model_info(self) -> Dict[str, Any]:
        return {
            "provider": "deepseek",
            "model": self.default_model
        }
