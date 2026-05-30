import pytest
from typing import Any, Dict, Optional
from unittest.mock import AsyncMock, MagicMock

from app.ai.providers.gemini_provider import GeminiProvider


class MockUsageMetadata:
    def __init__(self, prompt: int = 15, candidates: int = 25, total: int = 40):
        self.prompt_token_count = prompt
        self.candidates_token_count = candidates
        self.total_token_count = total


class MockGenerateContentResponse:
    def __init__(self, text: str, usage: MockUsageMetadata):
        self.text = text
        self.usage_metadata = usage


# 1. Test successful text generation
@pytest.mark.asyncio
async def test_gemini_generate_text_success(monkeypatch):
    provider = GeminiProvider(api_key="test-gemini-key")
    
    mock_client = MagicMock()
    mock_aio = MagicMock()
    
    async def mock_generate_content(*args, **kwargs):
        return MockGenerateContentResponse(
            text="Gemini generated room outline",
            usage=MockUsageMetadata(20, 30, 50)
        )
        
    mock_aio.generate_content = mock_generate_content
    mock_client.aio.models = mock_aio
    provider.client = mock_client

    result = await provider.generate_text("Design room outline")
    assert result == "Gemini generated room outline"


# 2. Test successful JSON generation
@pytest.mark.asyncio
async def test_gemini_generate_json_success(monkeypatch):
    provider = GeminiProvider(api_key="test-gemini-key")
    
    mock_client = MagicMock()
    mock_aio = MagicMock()
    
    payload = {"building_type": "residential", "floors": 2}
    
    async def mock_generate_content(*args, **kwargs):
        import json
        return MockGenerateContentResponse(
            text=json.dumps(payload),
            usage=MockUsageMetadata(25, 35, 60)
        )
        
    mock_aio.generate_content = mock_generate_content
    mock_client.aio.models = mock_aio
    provider.client = mock_client

    result = await provider.generate_json("Design modern house specification")
    assert result["success"] is True
    assert result["json"]["building_type"] == "residential"
    assert result["json"]["floors"] == 2
    assert result["provider"] == "gemini"


# 3. Test generate_json error boundaries
@pytest.mark.asyncio
async def test_gemini_generate_json_error(monkeypatch):
    provider = GeminiProvider(api_key="test-gemini-key")
    
    mock_client = MagicMock()
    mock_aio = MagicMock()
    
    async def mock_generate_content_error(*args, **kwargs):
        raise RuntimeError("Google API Quota Exceeded")
        
    mock_aio.generate_content = mock_generate_content_error
    mock_client.aio.models = mock_aio
    provider.client = mock_client

    result = await provider.generate_json("Design under error conditions")
    assert result["success"] is False
    assert "Google API Quota Exceeded" in result["error"]


def test_clean_schema_for_gemini():
    provider = GeminiProvider(api_key="test-key")
    dirty_schema = {
        "title": "Plot",
        "type": "object",
        "properties": {
            "width": {
                "type": "number",
                "exclusiveMinimum": 0
            },
            "length": {
                "type": "number",
                "exclusiveMaximum": 500
            },
            "features": {
                "type": "array",
                "items": [
                    {"type": "string", "exclusiveMinimum": 1}
                ]
            }
        }
    }
    
    clean = provider._clean_schema_for_gemini(dirty_schema)
    
    assert "exclusiveMinimum" not in clean["properties"]["width"]
    assert clean["properties"]["width"]["minimum"] == 0
    assert "exclusiveMaximum" not in clean["properties"]["length"]
    assert clean["properties"]["length"]["maximum"] == 500
    assert "exclusiveMinimum" not in clean["properties"]["features"]["items"][0]
    assert clean["properties"]["features"]["items"][0]["minimum"] == 1
