import pytest
from httpx import AsyncClient
from app.ai.manager import ai_manager

class MockAIProvider:
    def __init__(self, response=None, error=None):
        self.response = response
        self.error = error
        self.calls = []

    async def generate_json(self, **kwargs):
        self.calls.append(kwargs)
        if self.error:
            raise self.error
        return self.response

    async def get_model_info(self):
        return {"provider": "mock"}


@pytest.mark.asyncio
async def test_extract_requirements_api_success(client: AsyncClient, monkeypatch):
    mock_payload = {
        "json": {
            "building_type": "commercial",
            "style": "industrial",
            "plot": {"width": 150.0, "length": 200.0, "unit": "m"},
            "floors": 3,
            "bedrooms": 0,
            "bathrooms": 4,
            "features": ["loading dock", "high ceilings"],
            "budget": 2500000.0,
            "parking_spaces": 15,
            "garden": False,
            "swimming_pool": False,
            "office_room": True,
        }
    }
    mock_provider = MockAIProvider(response=mock_payload)
    
    # Monkeypatch get_provider on the global ai_manager to return our MockAIProvider
    monkeypatch.setattr(ai_manager, "get_provider", lambda *args, **kwargs: mock_provider)

    response = await client.post(
        "/api/v1/architect/extract-requirements",
        json={"prompt": "Design a 3-floor industrial office on a 150x200m plot with parking and loading docks."}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["building_type"] == "commercial"
    assert data["style"] == "industrial"
    assert data["plot"]["width"] == 150.0
    assert data["plot"]["length"] == 200.0
    assert data["floors"] == 3
    assert "loading dock" in data["features"]


@pytest.mark.asyncio
async def test_extract_requirements_api_validation_failure(client: AsyncClient, monkeypatch):
    # LLM returns invalid data (e.g. missing required floors or plot schema)
    mock_payload = {
        "json": {
            "building_type": "residential"
            # plot and floors are missing but required
        }
    }
    mock_provider = MockAIProvider(response=mock_payload)
    monkeypatch.setattr(ai_manager, "get_provider", lambda *args, **kwargs: mock_provider)

    response = await client.post(
        "/api/v1/architect/extract-requirements",
        json={"prompt": "Design a small cottage."}
    )
    
    assert response.status_code == 422
    data = response.json()
    assert "errors" in data["detail"]
    assert "message" in data["detail"]


@pytest.mark.asyncio
async def test_extract_requirements_api_provider_failure(client: AsyncClient, monkeypatch):
    mock_provider = MockAIProvider(error=RuntimeError("DeepSeek API is rate limited"))
    monkeypatch.setattr(ai_manager, "get_provider", lambda *args, **kwargs: mock_provider)

    response = await client.post(
        "/api/v1/architect/extract-requirements",
        json={"prompt": "A futuristic dome house."}
    )
    
    assert response.status_code == 500
    data = response.json()
    assert "DeepSeek API is rate limited" in data["detail"]


@pytest.mark.asyncio
async def test_extract_requirements_api_empty_prompt(client: AsyncClient):
    # Tests standard Pydantic validation on request body
    response = await client.post(
        "/api/v1/architect/extract-requirements",
        json={"prompt": ""}
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_analyze_api_success(client: AsyncClient, monkeypatch):
    mock_payload = {
        "json": {
            "building_type": "residential",
            "style": "modern",
            "plot": {"width": 60.0, "length": 80.0, "unit": "ft"},
            "floors": 2,
            "bedrooms": 4,
            "bathrooms": 3,
            "features": ["swimming pool"],
            "budget": 500000.0,
            "parking_spaces": 2,
            "garden": True,
            "swimming_pool": True,
            "office_room": False,
        }
    }
    mock_provider = MockAIProvider(response=mock_payload)
    monkeypatch.setattr(ai_manager, "get_provider", lambda *args, **kwargs: mock_provider)

    response = await client.post(
        "/api/v1/architect/analyze",
        json={"prompt": "Build a modern villa on a 60x80 plot with 4 bedrooms and a swimming pool"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["requirements"]["building_type"] == "residential"
    assert data["requirements"]["style"] == "modern"
    assert data["requirements"]["plot"]["width"] == 60.0
    assert data["requirements"]["plot"]["length"] == 80.0
    assert data["requirements"]["floors"] == 2
    assert data["requirements"]["bedrooms"] == 4
    assert data["requirements"]["swimming_pool"] is True


@pytest.mark.asyncio
async def test_analyze_api_validation_failure(client: AsyncClient, monkeypatch):
    mock_payload = {
        "json": {
            "building_type": "residential"
            # Missing required fields like floors, plot, bedrooms, bathrooms, style
        }
    }
    mock_provider = MockAIProvider(response=mock_payload)
    monkeypatch.setattr(ai_manager, "get_provider", lambda *args, **kwargs: mock_provider)

    response = await client.post(
        "/api/v1/architect/analyze",
        json={"prompt": "Short prompt."}
    )

    assert response.status_code == 422
    data = response.json()
    assert "errors" in data["detail"]
    assert "message" in data["detail"]


@pytest.mark.asyncio
async def test_analyze_api_provider_failure(client: AsyncClient, monkeypatch):
    mock_provider = MockAIProvider(error=RuntimeError("Provider offline"))
    monkeypatch.setattr(ai_manager, "get_provider", lambda *args, **kwargs: mock_provider)

    response = await client.post(
        "/api/v1/architect/analyze",
        json={"prompt": "A modern treehouse."}
    )

    assert response.status_code == 500
    data = response.json()
    assert "Provider offline" in data["detail"]


@pytest.mark.asyncio
async def test_analyze_api_empty_prompt(client: AsyncClient):
    response = await client.post(
        "/api/v1/architect/analyze",
        json={"prompt": ""}
    )
    assert response.status_code == 422

