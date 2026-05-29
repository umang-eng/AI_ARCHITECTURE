"""AI manager: register and select providers for higher-level tasks.

This implementation detects available providers from `app.core.config.settings`
and exposes a stable `ai_manager` singleton suitable for injection into FastAPI
endpoints or services.
"""
from __future__ import annotations

from typing import Dict, Optional

from app.ai.agents.architect_agent import ArchitectAgent
from app.ai.providers.base_provider import BaseAIProvider
from app.ai.providers.deepseek_provider import DeepSeekProvider
from app.ai.schemas.building_schema import AIResponseEnvelope, BuildingRequirements
from app.core.config import settings


class AIManager:
    def __init__(self):
        self._providers: Dict[str, BaseAIProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self) -> None:
        # Import optional adapters lazily so missing SDKs don't break startup.
        try:
            from app.ai.providers.openai_provider import OpenAIProvider as openai_provider_cls
        except Exception:
            openai_provider_cls = None  # type: ignore

        try:
            from app.ai.providers.claude_provider import ClaudeProvider as claude_provider_cls
        except Exception:
            claude_provider_cls = None  # type: ignore

        try:
            from app.ai.providers.gemini_provider import GeminiProvider as gemini_provider_cls
        except Exception:
            gemini_provider_cls = None  # type: ignore

        # Register providers based on configured keys
        if getattr(settings, "OPENAI_API_KEY", None) and openai_provider_cls:
            self._providers["openai"] = openai_provider_cls(api_key=settings.OPENAI_API_KEY, default_model=getattr(settings, "OPENAI_MODEL", None))

        if getattr(settings, "CLAUDE_API_KEY", None) and claude_provider_cls:
            self._providers["claude"] = claude_provider_cls(api_key=settings.CLAUDE_API_KEY, default_model=getattr(settings, "CLAUDE_MODEL", None))

        if getattr(settings, "GEMINI_API_KEY", None) and gemini_provider_cls:
            self._providers["gemini"] = gemini_provider_cls(api_key=settings.GEMINI_API_KEY, default_model=getattr(settings, "GEMINI_MODEL", None))

        # Deepseek is our safe fallback (may be mock if no key provided)
        self._providers.setdefault("deepseek", DeepSeekProvider(api_key=getattr(settings, "DEEPSEEK_API_KEY", None)))

    def get_provider(self, name: Optional[str] = None) -> BaseAIProvider:
        provider_name = name or getattr(settings, "DEFAULT_AI_PROVIDER", "deepseek")
        if provider_name in self._providers:
            return self._providers[provider_name]

        # Fallback to any available provider
        if self._providers:
            return next(iter(self._providers.values()))

        raise RuntimeError("No AI providers are available. Configure at least one provider API key.")

    async def generate_building_design(self, requirements: BuildingRequirements, provider_name: Optional[str] = None) -> AIResponseEnvelope:
        provider = self.get_provider(provider_name)
        agent = ArchitectAgent(provider=provider)
        return await agent.generate_design(requirements)

    async def extract_building_requirements(self, prompt: str, provider_name: Optional[str] = "deepseek") -> BuildingRequirements:
        provider = self.get_provider(provider_name)
        agent = ArchitectAgent(provider=provider)
        return await agent.extract_requirements(prompt)


# Singleton instance for import-use
ai_manager = AIManager()
default_manager = ai_manager
