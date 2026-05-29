"""Prompt templates for the Architect agent."""
from typing import List

from app.ai.schemas.building_schema import BuildingRequirements


ARCHITECT_REQUIREMENTS_SYSTEM_PROMPT = """You are an expert architect.

Extract building requirements from the user's message.

Return only valid JSON matching this shape:
{
  "building_type": "residential | commercial | mixed-use | other",
  "style": "architectural style or best inferred style",
  "plot": {
    "width": number,
    "length": number,
    "unit": "m | ft"
  },
  "floors": integer,
  "bedrooms": integer,
  "bathrooms": integer,
  "features": ["string"],
  "budget": number or null,
  "parking_spaces": integer or null,
  "garden": boolean or null,
  "swimming_pool": boolean or null,
  "office_room": boolean or null
}

Rules:
- Return JSON only. Do not use markdown.
- Infer reasonable values only when the user's intent is clear.
- Use null only for optional fields.
- Required fields must be present.
- If the user gives plot size like "40x60", set width=40, length=60, and infer unit from context; default to ft when no unit is given.
- Convert words like "two" or "three" to numbers.
- Put amenities and room requests that do not have dedicated fields into features.
"""


def build_requirements_extraction_prompt(user_prompt: str) -> str:
    return f"User message:\n{user_prompt.strip()}"


def build_architect_prompt(requirements: BuildingRequirements) -> str:
    """Construct a clear, instruction-style prompt for the AI provider.

    The prompt focuses the model on generating a structured JSON object
    describing a high-level building design given requirements.
    """
    lines: List[str] = []
    lines.append("You are an expert architectural assistant. Produce a JSON object describing a proposed building design.")
    lines.append("")
    lines.append("Requirements:")
    lines.append(f"- Building type: {requirements.building_type}")
    lines.append(f"- Style: {requirements.style}")
    lines.append(f"- Plot size ({requirements.plot.unit}): {requirements.plot.width} x {requirements.plot.length}")
    lines.append(f"- Floors: {requirements.floors}")
    lines.append(f"- Bedrooms: {requirements.bedrooms}")
    lines.append(f"- Bathrooms: {requirements.bathrooms}")
    if requirements.features:
        lines.append(f"- Key features: {', '.join(requirements.features)}")
    if requirements.budget is not None:
        lines.append(f"- Budget (USD): {requirements.budget}")

    lines.append("")
    lines.append("Output schema (JSON): Provide fields: id, name, summary, floors, total_area_m2, rooms (array with name and area_m2), footprint_m2, estimated_cost_usd, notes")
    lines.append("")
    lines.append("Important:")
    lines.append("- Only output valid JSON. Do not include explanatory text.")
    lines.append("- Ensure numeric fields are numbers and lists are arrays.")

    return "\n".join(lines)
