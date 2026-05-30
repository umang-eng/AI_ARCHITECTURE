"""Comprehensive unit tests for ArchitectAgent.

Each test uses a FakeProvider that returns canned DeepSeek-style envelopes.
The test matrix covers the 7 required scenarios plus design generation,
the JSON candidate extractor, and edge cases.

Test matrix
-----------
1. Modern villa            – full residential extraction
2. Apartment building      – high-rise multi-unit
3. Office building         – commercial with zero bedrooms
4. Invalid prompt          – provider returns garbage, validation fails
5. Empty prompt            – raises ValueError before provider call
6. Partial information     – LLM omits required fields → ValidationError
7. Missing dimensions      – no ``plot`` key → ValidationError
8. Design generation       – generate_design happy path
9. Design validation error – generate_design with bad schema
10. JSON candidate extractor – all normalisation branches
"""
from __future__ import annotations

import json
import pytest
from pydantic import ValidationError

from app.ai.agents.architect_agent import ArchitectAgent


# ── Fake provider ────────────────────────────────────────────────────

class FakeProvider:
    """Stub provider that records calls and returns canned data."""

    def __init__(self, response=None, error=None):
        self.response = response
        self.error = error
        self.calls: list = []

    async def generate_json(self, *args, **kwargs):
        self.calls.append({"args": args, **kwargs})
        if self.error:
            raise self.error
        return self.response

    async def generate_text(self, *args, **kwargs):
        return ""

    async def get_model_info(self):
        return {"provider": "fake"}


# ── Payloads ─────────────────────────────────────────────────────────

MODERN_VILLA = {
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

APARTMENT_BUILDING = {
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

OFFICE_BUILDING = {
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


def _agent(response=None, error=None) -> ArchitectAgent:
    return ArchitectAgent(provider=FakeProvider(response=response, error=error))


# ── 1  Modern villa ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_modern_villa_extraction():
    agent = _agent(response={"json": MODERN_VILLA})
    req = await agent.extract_requirements(
        "Design a modern 2-floor villa on a 60x80 ft plot with 4 bedrooms, "
        "3 bathrooms, swimming pool, open kitchen, balcony, home theater, "
        "garden, and 2 parking spaces. Budget $500k."
    )

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
async def test_apartment_building_extraction():
    agent = _agent(response={"json": APARTMENT_BUILDING})
    req = await agent.extract_requirements(
        "12-floor contemporary apartment building on a 30x40m plot, "
        "72 bedrooms, 80 bathrooms, elevator, rooftop terrace, gym, pool, "
        "concierge, 90 parking spaces, $18M budget."
    )

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
async def test_office_building_extraction():
    agent = _agent(response={"json": OFFICE_BUILDING})
    req = await agent.extract_requirements(
        "5-floor industrial office on 100x150m plot, no bedrooms, "
        "20 bathrooms, conference hall, server room, cafeteria, loading dock, "
        "100 parking, garden, dedicated office, $8M budget."
    )

    assert req.building_type == "commercial"
    assert req.style == "industrial"
    assert req.floors == 5
    assert req.bedrooms == 0
    assert req.bathrooms == 20
    assert req.office_room is True
    assert req.garden is True
    assert req.swimming_pool is False
    assert "conference hall" in req.features
    assert "loading dock" in req.features


# ── 4  Invalid prompt (garbage LLM output) ──────────────────────────

@pytest.mark.asyncio
async def test_invalid_prompt_garbage_output():
    """LLM returns recognizable JSON but values are wrong types."""
    garbage = {
        "building_type": 12345,  # should be str
        "style": True,           # should be str
        "plot": "not a dict",
        "floors": "NaN",
        "bedrooms": -5,
        "bathrooms": None,
    }
    agent = _agent(response={"json": garbage})

    with pytest.raises(ValidationError):
        await agent.extract_requirements("asdfghjkl random gibberish")


# ── 5  Empty prompt ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_empty_prompt_raises_value_error():
    agent = _agent(response={"json": MODERN_VILLA})

    with pytest.raises(ValueError, match="user_prompt is required"):
        await agent.extract_requirements("")


@pytest.mark.asyncio
async def test_whitespace_only_prompt_raises():
    agent = _agent(response={"json": MODERN_VILLA})

    with pytest.raises(ValueError, match="user_prompt is required"):
        await agent.extract_requirements("   \t\n  ")


@pytest.mark.asyncio
async def test_none_prompt_raises():
    agent = _agent(response={"json": MODERN_VILLA})

    with pytest.raises(ValueError, match="user_prompt is required"):
        await agent.extract_requirements(None)


# ── 6  Partial information ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_partial_info_missing_required_fields():
    """LLM returns only building_type and style but omits plot, floors, etc."""
    partial = {
        "building_type": "residential",
        "style": "minimalist",
    }
    agent = _agent(response={"json": partial})

    with pytest.raises(ValidationError) as exc_info:
        await agent.extract_requirements("A small home, not many details.")

    # Should complain about at least plot, floors, bedrooms, bathrooms
    error_fields = {e["loc"][0] for e in exc_info.value.errors()}
    assert "plot" in error_fields
    assert "floors" in error_fields
    assert "bedrooms" in error_fields
    assert "bathrooms" in error_fields


@pytest.mark.asyncio
async def test_partial_info_optional_fields_default():
    """Optional fields like budget, parking, garden default to None/empty."""
    minimal_valid = {
        "building_type": "residential",
        "style": "rustic",
        "plot": {"width": 20.0, "length": 25.0, "unit": "m"},
        "floors": 1,
        "bedrooms": 1,
        "bathrooms": 1,
    }
    agent = _agent(response={"json": minimal_valid})
    req = await agent.extract_requirements("Tiny cabin in the woods.")

    assert req.budget is None
    assert req.parking_spaces is None
    assert req.garden is None
    assert req.swimming_pool is None
    assert req.office_room is None
    assert req.features == []


# ── 7  Missing dimensions ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_missing_plot_raises_validation_error():
    no_plot = {
        "building_type": "residential",
        "style": "modern",
        "floors": 2,
        "bedrooms": 3,
        "bathrooms": 2,
        "features": [],
    }
    agent = _agent(response={"json": no_plot})

    with pytest.raises(ValidationError) as exc_info:
        await agent.extract_requirements("A house with no plot info.")

    error_fields = {e["loc"][0] for e in exc_info.value.errors()}
    assert "plot" in error_fields


@pytest.mark.asyncio
async def test_missing_plot_width_raises():
    bad_plot = {
        "building_type": "residential",
        "style": "modern",
        "plot": {"length": 60.0, "unit": "ft"},  # no width
        "floors": 1,
        "bedrooms": 1,
        "bathrooms": 1,
    }
    agent = _agent(response={"json": bad_plot})

    with pytest.raises(ValidationError):
        await agent.extract_requirements("House missing width.")


@pytest.mark.asyncio
async def test_zero_dimension_raises():
    zero_plot = {
        "building_type": "residential",
        "style": "modern",
        "plot": {"width": 0, "length": 50.0, "unit": "ft"},  # width=0 violates gt=0
        "floors": 1,
        "bedrooms": 1,
        "bathrooms": 1,
    }
    agent = _agent(response={"json": zero_plot})

    with pytest.raises(ValidationError):
        await agent.extract_requirements("Plot with zero width.")


# ── Provider errors ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_provider_runtime_error_surfaces():
    agent = _agent(error=RuntimeError("DeepSeek API timeout"))

    with pytest.raises(RuntimeError, match="DeepSeek API timeout"):
        await agent.extract_requirements("Any valid prompt.")


@pytest.mark.asyncio
async def test_provider_connection_error_surfaces():
    agent = _agent(error=ConnectionError("DNS resolution failed"))

    with pytest.raises(ConnectionError, match="DNS resolution failed"):
        await agent.extract_requirements("Another valid prompt.")


# ── Agent passes correct parameters ─────────────────────────────────

@pytest.mark.asyncio
async def test_agent_sends_temperature_zero():
    provider = FakeProvider(response={"json": MODERN_VILLA})
    agent = ArchitectAgent(provider=provider)
    await agent.extract_requirements("Temperature check.")

    assert provider.calls[0]["temperature"] == 0


@pytest.mark.asyncio
async def test_agent_sends_schema():
    provider = FakeProvider(response={"json": MODERN_VILLA})
    agent = ArchitectAgent(provider=provider)
    await agent.extract_requirements("Schema check.")

    schema = provider.calls[0]["schema"]
    assert schema["title"] == "BuildingRequirements"
    assert "properties" in schema


@pytest.mark.asyncio
async def test_agent_sends_system_prompt():
    provider = FakeProvider(response={"json": MODERN_VILLA})
    agent = ArchitectAgent(provider=provider)
    await agent.extract_requirements("System prompt check.")

    assert "system_prompt" in provider.calls[0]
    assert "expert architect" in provider.calls[0]["system_prompt"].lower()


# ── Design generation ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_design_success():
    from app.ai.schemas.building_schema import BuildingRequirements, Plot

    design_response = {
        "name": "Modern Villa Alpha",
        "summary": "A stunning modern villa with open layout.",
        "floors": 2,
        "total_area_m2": 350.0,
        "rooms": [{"name": "Master Bedroom", "area_m2": 30.0, "x": 0.0, "y": 0.0, "width": 5.0, "length": 6.0}],
        "footprint_m2": 175.0,
        "estimated_cost_usd": 480000.0,
        "notes": "South-facing orientation recommended.",
    }
    provider = FakeProvider(response=design_response)
    agent = ArchitectAgent(provider=provider)

    requirements = BuildingRequirements(
        building_type="residential", style="modern",
        plot=Plot(width=60, length=80, unit="ft"),
        floors=2, bedrooms=4, bathrooms=3,
    )
    envelope = await agent.generate_design(requirements)

    assert envelope.success is True
    assert envelope.payload is not None
    assert envelope.payload.name == "Modern Villa Alpha"
    assert envelope.payload.floors == 2
    assert len(envelope.payload.rooms) == 1


@pytest.mark.asyncio
async def test_generate_design_validation_failure():
    from app.ai.schemas.building_schema import BuildingRequirements, Plot

    # Missing required "name" and "summary"
    bad_design = {"floors": 2}
    provider = FakeProvider(response=bad_design)
    agent = ArchitectAgent(provider=provider)

    requirements = BuildingRequirements(
        building_type="residential", style="modern",
        plot=Plot(width=60, length=80, unit="ft"),
        floors=2, bedrooms=4, bathrooms=3,
    )
    envelope = await agent.generate_design(requirements)

    assert envelope.success is False
    assert envelope.error is not None
    assert "validation_error" in envelope.error


# ── JSON candidate extractor ────────────────────────────────────────

def test_extract_json_candidate_from_string():
    data = {"building_type": "residential"}
    result = ArchitectAgent._extract_json_candidate(json.dumps(data))
    assert result == data


def test_extract_json_candidate_from_dict_with_json_key():
    result = ArchitectAgent._extract_json_candidate({"json": {"a": 1}})
    assert result == {"a": 1}


def test_extract_json_candidate_from_dict_with_requirements_key():
    result = ArchitectAgent._extract_json_candidate({"requirements": {"b": 2}})
    assert result == {"b": 2}


def test_extract_json_candidate_from_string_nested_in_key():
    result = ArchitectAgent._extract_json_candidate({"data": json.dumps({"c": 3})})
    assert result == {"c": 3}


def test_extract_json_candidate_from_flat_dict():
    flat = {"building_type": "commercial", "floors": 3}
    result = ArchitectAgent._extract_json_candidate(flat)
    assert result == flat


def test_extract_json_candidate_non_dict_raises():
    with pytest.raises(TypeError, match="non-dict"):
        ArchitectAgent._extract_json_candidate(42)


def test_extract_json_candidate_string_non_object_raises():
    with pytest.raises(TypeError, match="not an object"):
        ArchitectAgent._extract_json_candidate(json.dumps([1, 2, 3]))
