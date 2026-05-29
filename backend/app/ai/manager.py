from typing import Dict, Optional
from app.ai.providers.base_provider import BaseAIProvider
from app.ai.providers.openai_provider import OpenAIProvider
from app.ai.providers.claude_provider import ClaudeProvider
from app.ai.providers.gemini_provider import GeminiProvider
from app.ai.providers.deepseek_provider import DeepSeekProvider
from app.core.config import settings

class AIManager:
    """
    Manager to handle dynamic selection of AI providers.
    """
    def __init__(self):
        self._providers: Dict[str, BaseAIProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self):
        # Initialize providers based on available API keys in settings
        if getattr(settings, "OPENAI_API_KEY", None):
            self._providers["openai"] = OpenAIProvider(
                api_key=settings.OPENAI_API_KEY,
                default_model=getattr(settings, "OPENAI_MODEL", "gpt-4-turbo")
            )
        
        if getattr(settings, "CLAUDE_API_KEY", None):
            self._providers["claude"] = ClaudeProvider(
                api_key=settings.CLAUDE_API_KEY,
                default_model=getattr(settings, "CLAUDE_MODEL", "claude-3-5-sonnet-20240620")
            )

        if getattr(settings, "GEMINI_API_KEY", None):
            self._providers["gemini"] = GeminiProvider(
                api_key=settings.GEMINI_API_KEY,
                default_model=getattr(settings, "GEMINI_MODEL", "gemini-1.5-pro")
            )

        if getattr(settings, "DEEPSEEK_API_KEY", None):
            self._providers["deepseek"] = DeepSeekProvider(
                api_key=settings.DEEPSEEK_API_KEY,
                default_model=getattr(settings, "DEEPSEEK_MODEL", "deepseek-chat")
            )

    def get_provider(self, name: Optional[str] = None) -> BaseAIProvider:
        """
        Get a provider by name, or the default provider if name is None.
        """
        provider_name = name or getattr(settings, "DEFAULT_AI_PROVIDER", "openai")
        
        if provider_name not in self._providers:
            # Fallback to the first available provider if the requested one isn't initialized
            if self._providers:
                return next(iter(self._providers.values()))
            raise ValueError(f"No AI providers initialized. Check your API keys in .env")
            
        return self._providers[provider_name]

# Singleton instance for global use
ai_manager = AIManager()
