from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

class BaseAIProvider(ABC):
    """
    Interface for AI model providers.
    """

    @abstractmethod
    async def generate_text(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any
    ) -> str:
        """
        Generate text based on a prompt.
        """
        pass

    @abstractmethod
    async def generate_json(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        schema: Optional[Dict[str, Any]] = None,
        **kwargs: Any
    ) -> Dict[str, Any]:
        """
        Generate structured JSON data.
        """
        pass

    @abstractmethod
    async def get_model_info(self) -> Dict[str, Any]:
        """
        Return information about the current model/provider.
        """
        pass
