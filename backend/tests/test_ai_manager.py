import pytest
from typing import Any, Dict, Optional

from app.ai.manager import AIManager
from app.ai.providers.base_provider import BaseAIProvider
from app.ai.providers.local_provider import LocalModelProvider


# 1. Custom Stub Provider to verify dynamic registration (DI)
class StubProvider(BaseAIProvider):
    def __init__(self, name: str = "stub-model"):
        self.name = name

    async def generate_text(self, prompt: str, **kwargs: Any) -> str:
        return f"stub response for {prompt}"

    async def generate_json(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        return {"stub": "data"}

    async def get_model_info(self) -> Dict[str, Any]:
        return {"provider": "stub-provider", "model": self.name}


# 2. Test initial state of AIManager
def test_manager_initial_state():
    manager = AIManager(default_provider_name="deepseek")
    
    # Should automatically have deepseek and local registered
    available = manager.list_available_providers()
    assert "deepseek" in available
    assert "local" in available
    
    # default provider should be deepseek
    provider = manager.get_provider()
    assert provider is not None
    info = pytest.mark.asyncio(lambda: provider.get_model_info())
    
    # Fetching explicitly deepseek works
    ds_provider = manager.get_provider("deepseek")
    assert ds_provider is not None


# 3. Test Dynamic Provider Registration (Dependency Injection)
def test_manager_register_provider():
    manager = AIManager()
    
    custom_stub = StubProvider(name="custom-v1")
    manager.register_provider("custom", custom_stub)
    
    assert "custom" in manager.list_available_providers()
    
    resolved = manager.get_provider("custom")
    assert resolved == custom_stub


# 4. Test Dynamic Provider Switching at runtime
def test_manager_set_default_provider():
    manager = AIManager()
    
    custom_stub = StubProvider(name="custom-v2")
    manager.register_provider("custom", custom_stub)
    
    # Switch active provider
    manager.set_default_provider("custom")
    
    # Default provider should resolve to custom
    assert manager.get_provider() == custom_stub
    
    # Trying to switch to a non-existent provider raises ValueError
    with pytest.raises(ValueError, match="not registered"):
        manager.set_default_provider("non-existent-provider")


# 5. Test Fallback resolution logic
def test_manager_fallback_behavior():
    manager = AIManager()
    
    # Fetching a non-existent provider yields deepseek and prints warning (caught implicitly)
    fallback = manager.get_provider("phantom-provider")
    assert fallback == manager.get_provider("deepseek")


# 6. Test LocalModelProvider conformance & local execution stubs
@pytest.mark.asyncio
async def test_local_provider_conformance():
    provider = LocalModelProvider(
        base_url="http://localhost:9999/v1",  # dummy unreachable port
        default_model="llama3-conformance"
    )
    
    info = await provider.get_model_info()
    assert info["provider"] == "local"
    assert info["model"] == "llama3-conformance"
    assert info["base_url"] == "http://localhost:9999/v1"
    
    # Should gracefully return mock fallback when local server is unreachable
    text = await provider.generate_text("Design room layout")
    assert "[LOCAL MOCK fallback]" in text
    
    # generate_json should also succeed via mock fallback
    js_data = await provider.generate_json("Design dimensions")
    assert js_data["success"] is True
    assert isinstance(js_data["json"], dict)
