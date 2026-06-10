"""AI manager: register and select providers for higher-level tasks.

Provides a unified orchestration layer to manage, dynamically configure, and switch
between multiple underlying AI providers (DeepSeek, OpenAI, Claude, Gemini, Local).
"""
from __future__ import annotations

import logging
from typing import Dict, List, Optional

from app.ai.agents.architect_agent import ArchitectAgent
from app.ai.providers.base_provider import BaseAIProvider
from app.ai.providers.deepseek_provider import DeepSeekProvider
from app.ai.schemas.building_schema import AIResponseEnvelope, BuildingRequirements
from app.core.config import settings

logger = logging.getLogger(__name__)


class AIManager:
    """Manages AI model providers dynamically based on settings and runtime changes.
    
    Supports:
    - Lazy loading of provider instances to avoid boot failures on missing SDK keys.
    - Constructor Injection / Dynamic registration of provider instances.
    - Configuration-driven selection.
    - Runtime provider switching.
    """

    def __init__(self, default_provider_name: Optional[str] = None):
        self._providers: Dict[str, BaseAIProvider] = {}
        self._default_provider_name: str = (
            default_provider_name 
            or getattr(settings, "DEFAULT_AI_PROVIDER", "deepseek")
        )
        self._initialize_providers()

    def _initialize_providers(self) -> None:
        """Register configured AI providers based on setting variables."""
        # 0. PEFT/QLoRA local model (trained adapter on Qwen)
        try:
            from app.ai.providers.peft_provider import PeftProvider
            peft_adapter = getattr(settings, "PEFT_ACTIVE_ADAPTER", "blueprint_v1")
            self._providers["peft"] = PeftProvider(adapter_name=peft_adapter)
            logger.info(f"Registered PEFT provider with adapter '{peft_adapter}'")
        except Exception as exc:
            logger.debug(f"PEFT provider registration bypassed: {exc}")

        # 1. DeepSeek: Default fallback provider (available as a mock if keys are absent)
        self._providers["deepseek"] = DeepSeekProvider(
            api_key=getattr(settings, "DEEPSEEK_API_KEY", None),
            default_model=getattr(settings, "DEEPSEEK_MODEL", None),
            base_url=getattr(settings, "DEEPSEEK_API_URL", None)
        )

        # 2. Local Models (Ollama or similar engine)
        try:
            from app.ai.providers.local_provider import LocalModelProvider
            self._providers["local"] = LocalModelProvider(
                base_url=getattr(settings, "LOCAL_MODEL_URL", None),
                default_model=getattr(settings, "LOCAL_MODEL_NAME", None)
            )
        except Exception as exc:
            logger.warning(f"Failed to register local model provider: {exc}")

        # 3. Optional abstract SDK wraps (lazy imports protect app boot)
        try:
            from app.ai.providers.openai_provider import OpenAIProvider
            if getattr(settings, "OPENAI_API_KEY", None):
                self._providers["openai"] = OpenAIProvider(
                    api_key=settings.OPENAI_API_KEY,
                    default_model=getattr(settings, "OPENAI_MODEL", None)
                )
            else:
                # Register a stub provider for interface compatibility
                self._providers["openai"] = OpenAIProvider(
                    api_key="stub-key",
                    default_model=getattr(settings, "OPENAI_MODEL", "gpt-4-turbo")
                )
        except Exception as exc:
            logger.debug(f"OpenAI provider registration bypassed: {exc}")

        try:
            from app.ai.providers.claude_provider import ClaudeProvider
            if getattr(settings, "CLAUDE_API_KEY", None):
                self._providers["claude"] = ClaudeProvider(
                    api_key=settings.CLAUDE_API_KEY,
                    default_model=getattr(settings, "CLAUDE_MODEL", None)
                )
            else:
                self._providers["claude"] = ClaudeProvider(
                    api_key="stub-key",
                    default_model=getattr(settings, "CLAUDE_MODEL", "claude-3-5-sonnet-20240620")
                )
        except Exception as exc:
            logger.debug(f"Claude provider registration bypassed: {exc}")

        try:
            from app.ai.providers.gemini_provider import GeminiProvider
            if getattr(settings, "GEMINI_API_KEY", None):
                self._providers["gemini"] = GeminiProvider(
                    api_key=settings.GEMINI_API_KEY,
                    default_model=getattr(settings, "GEMINI_MODEL", None)
                )
            else:
                self._providers["gemini"] = GeminiProvider(
                    api_key="stub-key",
                    default_model=getattr(settings, "GEMINI_MODEL", "gemini-1.5-pro")
                )
        except Exception as exc:
            logger.debug(f"Gemini provider registration bypassed: {exc}")

    def register_provider(self, name: str, provider: BaseAIProvider) -> None:
        """Dynamically register or override a provider instance at runtime (Dependency Injection)."""
        if not name:
            raise ValueError("Provider name cannot be empty.")
        self._providers[name.lower()] = provider
        logger.info(f"Dynamically registered provider '{name}'")

    def set_default_provider(self, name: str) -> None:
        """Switch the default active provider dynamically at runtime."""
        provider_key = name.lower()
        if provider_key not in self._providers:
            raise ValueError(
                f"Cannot set '{name}' as default. Provider not registered. "
                f"Registered providers: {self.list_available_providers()}"
            )
        self._default_provider_name = provider_key
        logger.info(f"AI default provider dynamically switched to '{provider_key}'")

    def get_provider(self, name: Optional[str] = None) -> BaseAIProvider:
        """Resolve and return a registered provider.
        
        Falls back to active runtime default if 'name' is None.
        If the target provider is not configured, it issues a warning and resolves
        gracefully to deepseek fallback.
        """
        target_name = name or self._default_provider_name
        provider_key = target_name.lower()

        if provider_key in self._providers:
            return self._providers[provider_key]

        logger.warning(
            f"Requested AI provider '{target_name}' is not configured/available. "
            f"Falling back to DeepSeek provider."
        )
        if "deepseek" in self._providers:
            return self._providers["deepseek"]

        raise RuntimeError("No AI providers configured, including fallback DeepSeek.")

    def list_available_providers(self) -> List[str]:
        """Return the list of all registered provider names."""
        return list(self._providers.keys())

    # ── High level task orchestrators ───────────────────────────────────────

    async def generate_building_design(
        self, requirements: BuildingRequirements, provider_name: Optional[str] = None
    ) -> AIResponseEnvelope:
        """Orchestrate design generation on the selected provider."""
        provider = self.get_provider(provider_name)
        agent = ArchitectAgent(provider=provider)
        return await agent.generate_design(requirements)

    async def extract_building_requirements(
        self, prompt: str, provider_name: Optional[str] = None
    ) -> BuildingRequirements:
        """Orchestrate building requirement extraction on the selected provider."""
        provider = self.get_provider(provider_name)
        agent = ArchitectAgent(provider=provider)
        return await agent.extract_requirements(prompt)


# Exposed global singleton for default API route usages
ai_manager = AIManager()
default_manager = ai_manager
