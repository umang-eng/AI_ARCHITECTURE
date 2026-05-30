"""Comprehensive unit tests for ArchitectService.

Exercises the service layer in total isolation using a FakeProvider.
Every test verifies prompt → agent → validation → cache behaviour
without touching HTTP or a real AI provider.

Test matrix
-----------
1. Modern villa            – full end-to-end happy path
2. Apartment building      – high-rise multi-unit analysis
3. Office building         – commercial specs, zero bedrooms
4. Invalid prompt          – LLM returns wrong types → ValidationError
5. Empty prompt            – raises ValueError immediately
6. Partial information     – LLM omits required fields → ValidationError
7. Missing dimensions      – no plot → ValidationError
8. Caching                 – session round-trip, overwrite, miss
9. Session ID              – auto-generated vs. caller-supplied
10. Future stubs           – floorplan, cost, design options
11. elapsed_ms             – timing sanity check
"""
from __future__ import annotations

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


# ── Payloads ─────────────────────────────────────────────────────────

MODERN_VILLA = {
    "json": {
        "building_type": "residential",
        "style": "modern",
        "plot": {"width": 60.0, "length": 80.0, "unit": "ft"},
        "floors": 2,
        "bedrooms": 4,
        "bathrooms": 3,
        "features": ["swimming pool", "open kitchen", "balcony", "home theater"],
        "budget": 500000.0,
        "parking_spaces": 2,
        "garden": True,
        "swimming_pool": True,
        "office_room": False,
    }
}

APARTMENT_BUILDING = {
    "json": {
        "building_type": "residential",
        "style": "contemporary",
        "plot": {"width": 30.0, "length": 40.0, "unit": "m"},
        "floors": 12,
        "bedrooms": 72,
        "bathrooms": 80,
        "features": ["elevator", "rooftop terrace", "gym", "concierge"],
        "budget": 18000000.0,
        "parking_spaces": 90,
        "garden": False,
        "swimming_pool": True,
        "office_room": False,
    }
}

OFFICE_BUILDING = {
    "json": {
        "building_type": "commercial",
        "style": "industrial",
        "plot": {"width": 100.0, "length": 150.0, "unit": "m"},
        "floors": 5,
        "bedrooms": 0,
        "bathrooms": 20,
        "features": ["conference hall", "server room", "cafeteria", "loading dock"],
        "budget": 8000000.0,
        "parking_spaces": 100,
        "garden": True,
        "swimming_pool": False,
        "office_room": True,
    }
}


def _service(response=None, error=None) -> ArchitectService:
    provider = FakeProvider(response=response, error=error)
    agent = ArchitectAgent(provider=provider)
    return ArchitectService(agent=agent)


# ── 1  Modern villa ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_modern_villa():
    service = _service(response=MODERN_VILLA)
    result = await service.analyze_requirements(
        "Design a modern 2-floor villa on a 60x80 ft plot with 4 bedrooms, "
        "3 bathrooms, swimming pool, open kitchen, balcony, home theater, "
        "garden, and 2 parking spaces. Budget $500k.",
        session_id="villa-1",
    )

    assert result["success"] is True
    assert result["session_id"] == "villa-1"
    assert result["elapsed_ms"] >= 0

    req = result["requirements"]
    assert req.building_type == "residential"
    assert req.style == "modern"
    assert req.plot.width == 60.0
    assert req.plot.length == 80.0
    assert req.plot.unit == "ft"
    assert req.floors == 2
    assert req.bedrooms == 4
    assert req.bathrooms == 3
    assert req.budget == 500000.0
    assert req.parking_spaces == 2
    assert req.garden is True
    assert req.swimming_pool is True
    assert req.office_room is False
    assert "swimming pool" in req.features
    assert "home theater" in req.features


# ── 2  Apartment building ───────────────────────────────────────────

@pytest.mark.asyncio
async def test_apartment_building():
    service = _service(response=APARTMENT_BUILDING)
    result = await service.analyze_requirements(
        "12-floor contemporary apartment building on a 30x40m plot, "
        "72 bedrooms, 80 bathrooms, elevator, gym, rooftop terrace, pool, "
        "concierge, 90 parking spaces, $18M budget.",
        session_id="apt-1",
    )

    assert result["success"] is True
    req = result["requirements"]
    assert req.building_type == "residential"
    assert req.style == "contemporary"
    assert req.floors == 12
    assert req.bedrooms == 72
    assert req.bathrooms == 80
    assert req.plot.unit == "m"
    assert req.parking_spaces == 90
    assert req.swimming_pool is True
    assert "elevator" in req.features
    assert "gym" in req.features


# ── 3  Office building ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_office_building():
    service = _service(response=OFFICE_BUILDING)
    result = await service.analyze_requirements(
        "5-floor industrial office on 100x150m plot, no bedrooms, "
        "20 bathrooms, conference hall, server room, cafeteria, loading dock, "
        "100 parking, garden, dedicated office, $8M budget.",
        session_id="office-1",
    )

    assert result["success"] is True
    req = result["requirements"]
    assert req.building_type == "commercial"
    assert req.style == "industrial"
    assert req.floors == 5
    assert req.bedrooms == 0
    assert req.office_room is True
    assert req.garden is True
    assert "conference hall" in req.features
    assert "loading dock" in req.features


# ── 4  Invalid prompt (garbage LLM output) ──────────────────────────

@pytest.mark.asyncio
async def test_invalid_prompt_garbage_output():
    garbage = {
        "json": {
            "building_type": 999,
            "style": False,
            "plot": "invalid",
            "floors": "NaN",
            "bedrooms": -10,
            "bathrooms": None,
        }
    }
    service = _service(response=garbage)

    with pytest.raises(ValidationError):
        await service.analyze_requirements("asdfghjkl gibberish nonsense")


# ── 5  Empty prompt ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_empty_prompt():
    service = _service(response=MODERN_VILLA)

    with pytest.raises(ValueError, match="non-empty"):
        await service.analyze_requirements("")


@pytest.mark.asyncio
async def test_whitespace_only_prompt():
    service = _service(response=MODERN_VILLA)

    with pytest.raises(ValueError, match="non-empty"):
        await service.analyze_requirements("   \t\n  ")


@pytest.mark.asyncio
async def test_none_prompt():
    service = _service(response=MODERN_VILLA)

    with pytest.raises(ValueError, match="non-empty"):
        await service.analyze_requirements(None)


# ── 6  Partial information ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_partial_info_missing_required():
    partial = {
        "json": {
            "building_type": "residential",
            "style": "minimalist",
            # Missing: plot, floors, bedrooms, bathrooms
        }
    }
    service = _service(response=partial)

    with pytest.raises(ValidationError) as exc_info:
        await service.analyze_requirements("A home, not many details given.")

    error_fields = {e["loc"][0] for e in exc_info.value.errors()}
    assert "plot" in error_fields
    assert "floors" in error_fields


@pytest.mark.asyncio
async def test_partial_info_optional_defaults():
    minimal_valid = {
        "json": {
            "building_type": "residential",
            "style": "rustic",
            "plot": {"width": 20.0, "length": 25.0, "unit": "m"},
            "floors": 1,
            "bedrooms": 1,
            "bathrooms": 1,
        }
    }
    service = _service(response=minimal_valid)
    result = await service.analyze_requirements("Tiny cabin.")

    req = result["requirements"]
    assert req.budget is None
    assert req.parking_spaces is None
    assert req.garden is None
    assert req.swimming_pool is None
    assert req.features == []


# ── 7  Missing dimensions ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_missing_plot_entirely():
    no_plot = {
        "json": {
            "building_type": "residential",
            "style": "modern",
            "floors": 2,
            "bedrooms": 3,
            "bathrooms": 2,
        }
    }
    service = _service(response=no_plot)

    with pytest.raises(ValidationError) as exc_info:
        await service.analyze_requirements("A house with no plot info.")

    error_fields = {e["loc"][0] for e in exc_info.value.errors()}
    assert "plot" in error_fields


@pytest.mark.asyncio
async def test_missing_plot_width():
    bad_plot = {
        "json": {
            "building_type": "residential",
            "style": "modern",
            "plot": {"length": 60.0, "unit": "ft"},  # no width
            "floors": 1,
            "bedrooms": 1,
            "bathrooms": 1,
        }
    }
    service = _service(response=bad_plot)

    with pytest.raises(ValidationError):
        await service.analyze_requirements("House missing plot width.")


@pytest.mark.asyncio
async def test_zero_plot_dimension():
    zero_dim = {
        "json": {
            "building_type": "residential",
            "style": "modern",
            "plot": {"width": 0, "length": 50.0, "unit": "ft"},
            "floors": 1,
            "bedrooms": 1,
            "bathrooms": 1,
        }
    }
    service = _service(response=zero_dim)

    with pytest.raises(ValidationError):
        await service.analyze_requirements("Zero width plot.")


@pytest.mark.asyncio
async def test_negative_plot_dimension():
    neg_dim = {
        "json": {
            "building_type": "residential",
            "style": "modern",
            "plot": {"width": -10.0, "length": 50.0, "unit": "ft"},
            "floors": 1,
            "bedrooms": 1,
            "bathrooms": 1,
        }
    }
    service = _service(response=neg_dim)

    with pytest.raises(ValidationError):
        await service.analyze_requirements("Negative width plot.")


# ── 8  Caching ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_cache_stores_after_analysis():
    service = _service(response=MODERN_VILLA)
    await service.analyze_requirements("Cache test.", session_id="c1")

    cached = service.get_cached_requirements("c1")
    assert cached is not None
    assert cached.building_type == "residential"


@pytest.mark.asyncio
async def test_cache_overwrites_on_same_session():
    service = _service(response=MODERN_VILLA)
    await service.analyze_requirements("First run.", session_id="same")

    # Swap the provider response for subsequent call
    service._agent.provider.response = OFFICE_BUILDING
    await service.analyze_requirements("Second run.", session_id="same")

    cached = service.get_cached_requirements("same")
    assert cached.building_type == "commercial"


@pytest.mark.asyncio
async def test_cache_miss_returns_none():
    service = _service(response=MODERN_VILLA)
    assert service.get_cached_requirements("nonexistent") is None


@pytest.mark.asyncio
async def test_cache_not_populated_on_failure():
    service = _service(error=RuntimeError("boom"))

    with pytest.raises(RuntimeError):
        await service.analyze_requirements("fail", session_id="bad")

    assert service.get_cached_requirements("bad") is None


@pytest.mark.asyncio
async def test_multiple_sessions_coexist():
    service = _service(response=MODERN_VILLA)
    await service.analyze_requirements("Villa.", session_id="s1")

    service._agent.provider.response = OFFICE_BUILDING
    await service.analyze_requirements("Office.", session_id="s2")

    s1 = service.get_cached_requirements("s1")
    s2 = service.get_cached_requirements("s2")
    assert s1.building_type == "residential"
    assert s2.building_type == "commercial"


# ── 9  Session ID ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_auto_generated_session_id():
    service = _service(response=MODERN_VILLA)
    result = await service.analyze_requirements("Auto session.")

    sid = result["session_id"]
    assert isinstance(sid, str)
    assert len(sid) > 0


@pytest.mark.asyncio
async def test_custom_session_id_preserved():
    service = _service(response=MODERN_VILLA)
    result = await service.analyze_requirements("Custom.", session_id="my-id-99")

    assert result["session_id"] == "my-id-99"


# ── 10  Provider errors ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_provider_runtime_error():
    service = _service(error=RuntimeError("API down"))

    with pytest.raises(RuntimeError, match="API down"):
        await service.analyze_requirements("Doesn't matter.")


@pytest.mark.asyncio
async def test_provider_connection_error():
    service = _service(error=ConnectionError("DNS failure"))

    with pytest.raises(ConnectionError, match="DNS failure"):
        await service.analyze_requirements("Any prompt.")


@pytest.mark.asyncio
async def test_provider_timeout_error():
    service = _service(error=TimeoutError("30s exceeded"))

    with pytest.raises(TimeoutError, match="30s exceeded"):
        await service.analyze_requirements("Timeout test.")


# ── 11  Future stubs ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_floorplan_requires_prior_analysis():
    service = _service(response=MODERN_VILLA)

    with pytest.raises(ValueError, match="No cached requirements"):
        await service.generate_floorplan("no-session")


@pytest.mark.asyncio
async def test_floorplan_not_implemented():
    service = _service(response=MODERN_VILLA)
    await service.analyze_requirements("stub", session_id="fp")

    with pytest.raises(NotImplementedError, match="floorplan"):
        await service.generate_floorplan("fp")


@pytest.mark.asyncio
async def test_cost_estimation_requires_prior_analysis():
    service = _service(response=MODERN_VILLA)

    with pytest.raises(ValueError, match="No cached requirements"):
        await service.generate_cost_estimation("no-session")


@pytest.mark.asyncio
async def test_cost_estimation_not_implemented():
    service = _service(response=MODERN_VILLA)
    await service.analyze_requirements("stub", session_id="ce")

    with pytest.raises(NotImplementedError, match="cost_estimation"):
        await service.generate_cost_estimation("ce")


@pytest.mark.asyncio
async def test_design_options_requires_prior_analysis():
    service = _service(response=MODERN_VILLA)

    with pytest.raises(ValueError, match="No cached requirements"):
        await service.generate_design_options("no-session")


@pytest.mark.asyncio
async def test_design_options_not_implemented():
    service = _service(response=MODERN_VILLA)
    await service.analyze_requirements("stub", session_id="do")

    with pytest.raises(NotImplementedError, match="design_options"):
        await service.generate_design_options("do")


# ── 12  Elapsed time ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_elapsed_ms_is_positive():
    service = _service(response=MODERN_VILLA)
    result = await service.analyze_requirements("Timing check.")

    assert isinstance(result["elapsed_ms"], float)
    assert result["elapsed_ms"] >= 0
