"""Tests for the architect API endpoints — blueprint generation, variation, validation."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_generate_blueprint_success(client: AsyncClient):
    response = await client.post("/api/v1/architect/generate-blueprint", json={
        "plot_width": 60,
        "plot_height": 80,
        "bedrooms": 4,
        "bathrooms": 2,
        "floors": 2,
        "building_type": "villa",
        "style": "modern",
        "variant": "A",
        "project_name": "Test Blueprint",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "blueprint" in data
    assert "validation" in data
    assert len(data["blueprint"]["rooms"]) > 0
    assert len(data["blueprint"]["walls"]) > 0


@pytest.mark.asyncio
async def test_generate_blueprint_default_params(client: AsyncClient):
    response = await client.post("/api/v1/architect/generate-blueprint", json={})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["blueprint"]["plot"]["width"] == 60
    assert data["blueprint"]["plot"]["height"] == 80


@pytest.mark.asyncio
async def test_generate_blueprint_all_variants(client: AsyncClient):
    for variant in ["A", "B", "C", "D", "E"]:
        response = await client.post("/api/v1/architect/generate-blueprint", json={
            "plot_width": 60,
            "plot_height": 80,
            "bedrooms": 3,
            "bathrooms": 2,
            "variant": variant,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True, f"Variant {variant} failed: {data['validation']}"
        assert len(data["blueprint"]["rooms"]) > 0


@pytest.mark.asyncio
async def test_generate_variation(client: AsyncClient):
    # First generate a blueprint
    gen_response = await client.post("/api/v1/architect/generate-blueprint", json={
        "plot_width": 60,
        "plot_height": 80,
        "bedrooms": 3,
        "bathrooms": 2,
        "variant": "A",
    })
    blueprint = gen_response.json()["blueprint"]

    # Then generate a variation
    response = await client.post("/api/v1/architect/generate-variation", json={
        "blueprint": blueprint,
        "variant": "B",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["blueprint"]["rooms"]) > 0


@pytest.mark.asyncio
async def test_validate_blueprint_valid(client: AsyncClient):
    gen_response = await client.post("/api/v1/architect/generate-blueprint", json={
        "plot_width": 60,
        "plot_height": 80,
        "bedrooms": 3,
        "bathrooms": 2,
    })
    blueprint = gen_response.json()["blueprint"]

    response = await client.post("/api/v1/architect/validate-blueprint", json={
        "blueprint": blueprint,
    })
    assert response.status_code == 200
    data = response.json()
    assert "validation" in data
    assert "valid" in data["validation"]


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/v1/architect/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_generate_blueprint_bedroom_count(client: AsyncClient):
    response = await client.post("/api/v1/architect/generate-blueprint", json={
        "plot_width": 80,
        "plot_height": 100,
        "bedrooms": 6,
        "bathrooms": 3,
        "variant": "C",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    bedroom_count = sum(1 for r in data["blueprint"]["rooms"] if r["room_type"] == "bedroom")
    assert bedroom_count == 6
