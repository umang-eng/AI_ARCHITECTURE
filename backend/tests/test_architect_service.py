"""Unit tests for ArchitectService.

These tests exercise the service layer in isolation using a fake provider,
verifying prompt → agent → validation → cache behaviour without touching
any HTTP transport or real AI provider.
"""
import pytest
from pydantic import ValidationError

from app.ai.agents.architect_agent import ArchitectAgent
from app.services.architect import ArchitectService


# ── Fake provider ────────────────────────────────────────────────────

class FakeProvider:
    """Minimal provider stub that returns canned responses."""

    def __init__(self, response=None, error=None):
        self.response = response
        self.error = error
        self.calls: list = []

    async def generate_json(self, **kwargs):
        self.calls.append(kwargs)
        if self.error:
            raise self.error
        return self.response

    async def get_model_info(self):
        return {"provider": "fake"}


# ── Helpers ──────────────────────────────────────────────────────────

VALID_REQUIREMENTS_PAYLOAD = {
    "json": {
        "building_type": "residential",
        "style": "modern",
        "plot": {"width": 50.0, "length": 70.0, "unit": "ft"},
        "floors": 2,
        "bedrooms": 3,
        "bathrooms": 2,
        "features": ["open kitchen", "balcony"],
        "budget": 250000.0,
        "parking_spaces": 1,
        "garden": True,
        "swimming_pool": False,
        "office_room": True,
    }
}


def _build_service(response=None, error=None) -> ArchitectService:
    provider = FakeProvider(response=response, error=error)
    agent = ArchitectAgent(provider=provider)
    return ArchitectService(agent=agent)


# ── analyze_requirements ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_analyze_requirements_success():
    service = _build_service(response=VALID_REQUIREMENTS_PAYLOAD)

    result = await service.analyze_requirements(
        "Modern 2-floor house on 50x70 plot, 3 beds, 2 baths, open kitchen, parking, garden, office."
    )

    assert result["success"] is True
    assert result["session_id"]  # non-empty
    assert result["elapsed_ms"] >= 0

    req = result["requirements"]
    assert req.building_type == "residential"
    assert req.style == "modern"
    assert req.plot.width == 50.0
    assert req.plot.length == 70.0
    assert req.floors == 2
    assert req.bedrooms == 3
    assert req.bathrooms == 2
    assert req.office_room is True
    assert "balcony" in req.features


@pytest.mark.asyncio
async def test_analyze_requirements_custom_session_id():
    service = _build_service(response=VALID_REQUIREMENTS_PAYLOAD)

    result = await service.analyze_requirements(
        "A cozy villa.", session_id="my-session-42"
    )

    assert result["session_id"] == "my-session-42"


@pytest.mark.asyncio
async def test_analyze_requirements_empty_prompt_raises():
    service = _build_service(response=VALID_REQUIREMENTS_PAYLOAD)

    with pytest.raises(ValueError, match="non-empty"):
        await service.analyze_requirements("")


@pytest.mark.asyncio
async def test_analyze_requirements_blank_prompt_raises():
    service = _build_service(response=VALID_REQUIREMENTS_PAYLOAD)

    with pytest.raises(ValueError, match="non-empty"):
        await service.analyze_requirements("   ")


@pytest.mark.asyncio
async def test_analyze_requirements_validation_error():
    bad_payload = {"json": {"building_type": "residential"}}  # missing many fields
    service = _build_service(response=bad_payload)

    with pytest.raises(ValidationError):
        await service.analyze_requirements("An incomplete house.")


@pytest.mark.asyncio
async def test_analyze_requirements_provider_error():
    service = _build_service(error=RuntimeError("API down"))

    with pytest.raises(RuntimeError, match="API down"):
        await service.analyze_requirements("Doesn't matter.")


# ── Result caching ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_cached_requirements_round_trip():
    service = _build_service(response=VALID_REQUIREMENTS_PAYLOAD)

    result = await service.analyze_requirements(
        "Cache test.", session_id="cache-1"
    )

    cached = service.get_cached_requirements("cache-1")
    assert cached is not None
    assert cached.building_type == result["requirements"].building_type
    assert cached.floors == result["requirements"].floors


@pytest.mark.asyncio
async def test_cached_requirements_missing_session():
    service = _build_service(response=VALID_REQUIREMENTS_PAYLOAD)

    assert service.get_cached_requirements("nonexistent") is None


# ── Future stubs ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_floorplan_not_implemented():
    service = _build_service(response=VALID_REQUIREMENTS_PAYLOAD)
    await service.analyze_requirements("stub test", session_id="stub-1")

    with pytest.raises(NotImplementedError, match="floorplan"):
        await service.generate_floorplan("stub-1")


@pytest.mark.asyncio
async def test_generate_cost_estimation_not_implemented():
    service = _build_service(response=VALID_REQUIREMENTS_PAYLOAD)
    await service.analyze_requirements("stub test", session_id="stub-2")

    with pytest.raises(NotImplementedError, match="cost_estimation"):
        await service.generate_cost_estimation("stub-2")


@pytest.mark.asyncio
async def test_generate_design_options_not_implemented():
    service = _build_service(response=VALID_REQUIREMENTS_PAYLOAD)
    await service.analyze_requirements("stub test", session_id="stub-3")

    with pytest.raises(NotImplementedError, match="design_options"):
        await service.generate_design_options("stub-3")


@pytest.mark.asyncio
async def test_future_stubs_require_prior_analysis():
    service = _build_service(response=VALID_REQUIREMENTS_PAYLOAD)

    with pytest.raises(ValueError, match="No cached requirements"):
        await service.generate_floorplan("no-such-session")

    with pytest.raises(ValueError, match="No cached requirements"):
        await service.generate_cost_estimation("no-such-session")

    with pytest.raises(ValueError, match="No cached requirements"):
        await service.generate_design_options("no-such-session")
