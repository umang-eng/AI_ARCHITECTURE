"""AI Requirement Analyzer.

Uses Gemini API to parse natural language building requirements into
structured BuildingRequirements. Falls back to regex-based extraction
when the AI is unavailable.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class AnalyzedRequirements:
    def __init__(
        self,
        building_type: str = "residential",
        style: str = "modern",
        plot_width: float = 60,
        plot_length: float = 80,
        floors: int = 1,
        bedrooms: int = 3,
        bathrooms: int = 2,
        has_garage: bool = False,
        has_garden: bool = False,
        has_pool: bool = False,
        has_office: bool = False,
        parking_spaces: int = 0,
        budget: Optional[float] = None,
        features: Optional[List[str]] = None,
        raw_prompt: str = "",
        confidence: float = 1.0,
    ):
        self.building_type = building_type
        self.style = style
        self.plot_width = plot_width
        self.plot_length = plot_length
        self.floors = floors
        self.bedrooms = bedrooms
        self.bathrooms = bathrooms
        self.has_garage = has_garage
        self.has_garden = has_garden
        self.has_pool = has_pool
        self.has_office = has_office
        self.parking_spaces = parking_spaces
        self.budget = budget
        self.features = features or []
        self.raw_prompt = raw_prompt
        self.confidence = confidence

    def to_dict(self) -> Dict[str, Any]:
        return {
            "building_type": self.building_type,
            "style": self.style,
            "plot": {
                "width": self.plot_width,
                "length": self.plot_length,
                "unit": "ft",
            },
            "floors": self.floors,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "has_garage": self.has_garage,
            "has_garden": self.has_garden,
            "has_pool": self.has_pool,
            "has_office": self.has_office,
            "parking_spaces": self.parking_spaces,
            "budget": self.budget,
            "features": self.features,
        }


REQUIREMENTS_EXTRACTION_PROMPT = """You are an architectural requirements analyst. Extract structured building requirements from the user's natural language description.

Analyze the text and extract:
- building_type: One of: "villa", "house", "apartment", "office", "commercial", "shop", "industrial", "residential"
- style: Architectural style: "modern", "minimalist", "industrial", "contemporary", "traditional", "mediterranean", "victorian"
- plot_width: Plot width in feet (numeric, default 60)
- plot_length: Plot length in feet (numeric, default 80)
- floors: Number of floors (integer, default 1)
- bedrooms: Number of bedrooms (integer, default 3)
- bathrooms: Number of bathrooms (integer, default 2)
- has_garage: Whether a garage is mentioned (boolean)
- has_garden: Whether a garden/yard is mentioned (boolean)
- has_pool: Whether a swimming pool is mentioned (boolean)
- has_office: Whether an office/study is mentioned (boolean)
- parking_spaces: Number of parking spaces (integer, default 0)
- budget: Budget in USD if mentioned, else null
- features: List of any other notable features mentioned

Respond ONLY with valid JSON, no other text.

User prompt: {prompt}"""


async def analyze_with_ai(prompt: str, ai_manager=None) -> Optional[AnalyzedRequirements]:
    """Try to analyze requirements using the AI provider. Returns None if unavailable."""
    if ai_manager is None:
        return None

    try:
        provider = ai_manager.get_provider()
        system_prompt = "You are an architectural requirements analyst. Extract structured building requirements from natural language descriptions. Respond with JSON only."
        user_prompt = REQUIREMENTS_EXTRACTION_PROMPT.format(prompt=prompt)

        schema = {
            "type": "object",
            "properties": {
                "building_type": {"type": "string"},
                "style": {"type": "string"},
                "plot_width": {"type": "number"},
                "plot_length": {"type": "number"},
                "floors": {"type": "integer"},
                "bedrooms": {"type": "integer"},
                "bathrooms": {"type": "integer"},
                "has_garage": {"type": "boolean"},
                "has_garden": {"type": "boolean"},
                "has_pool": {"type": "boolean"},
                "has_office": {"type": "boolean"},
                "parking_spaces": {"type": "integer"},
                "budget": {"type": "number"},
                "features": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["building_type", "style", "plot_width", "plot_length", "floors", "bedrooms", "bathrooms"],
        }

        response = await provider.generate_json(
            prompt=user_prompt,
            system_prompt=system_prompt,
            schema=schema,
            temperature=0.1,
        )

        if isinstance(response, dict) and response.get("success"):
            data = response.get("json") or response.get("data") or {}
            if isinstance(data, str):
                data = json.loads(data)
            return AnalyzedRequirements(
                building_type=data.get("building_type", "residential"),
                style=data.get("style", "modern"),
                plot_width=float(data.get("plot_width", 60)),
                plot_length=float(data.get("plot_length", 80)),
                floors=int(data.get("floors", 1)),
                bedrooms=int(data.get("bedrooms", 3)),
                bathrooms=int(data.get("bathrooms", 2)),
                has_garage=bool(data.get("has_garage", False)),
                has_garden=bool(data.get("has_garden", False)),
                has_pool=bool(data.get("has_pool", False)),
                has_office=bool(data.get("has_office", False)),
                parking_spaces=int(data.get("parking_spaces", 0)),
                budget=data.get("budget"),
                features=data.get("features", []),
                raw_prompt=prompt,
                confidence=0.9,
            )
    except Exception as e:
        logger.warning(f"AI analysis failed, falling back to regex: {e}")

    return None


def analyze_with_regex(prompt: str) -> AnalyzedRequirements:
    """Fallback regex-based requirement extraction."""
    result = AnalyzedRequirements(raw_prompt=prompt, confidence=0.6)

    plot_match = re.search(r"(\d+)\s*[xX×]\s*(\d+)", prompt)
    if plot_match:
        result.plot_width = float(plot_match.group(1))
        result.plot_length = float(plot_match.group(2))

    bed_match = re.search(r"(\d+)\s*(?:bed|bedroom|br)s?\b", prompt, re.IGNORECASE)
    if bed_match:
        result.bedrooms = int(bed_match.group(1))

    bath_match = re.search(r"(\d+)\s*(?:bath|bathroom|ba)s?\b", prompt, re.IGNORECASE)
    if bath_match:
        result.bathrooms = int(bath_match.group(1))

    floor_match = re.search(r"(\d+)\s*(?:floor|story|storey|level)s?\b", prompt, re.IGNORECASE)
    if floor_match:
        result.floors = int(floor_match.group(1))

    result.has_pool = bool(re.search(r"pool|swimming", prompt, re.IGNORECASE))
    result.has_garden = bool(re.search(r"garden|yard|landscape", prompt, re.IGNORECASE))
    result.has_garage = bool(re.search(r"garage|parking", prompt, re.IGNORECASE))
    result.has_office = bool(re.search(r"office|study|workspace", prompt, re.IGNORECASE))

    park_match = re.search(r"(\d+)\s*(?:parking|car|vehicle)s?\b", prompt, re.IGNORECASE)
    if park_match:
        result.parking_spaces = int(park_match.group(1))

    budget_match = re.search(r"(?:budget|cost|spend|worth)\s*(?:of\s*)?[₹$€]?\s*([\d,]+(?:\.\d+)?)", prompt, re.IGNORECASE)
    if budget_match:
        result.budget = float(budget_match.group(1).replace(",", ""))

    if re.search(r"villa", prompt, re.IGNORECASE):
        result.building_type = "villa"
    elif re.search(r"apartment", prompt, re.IGNORECASE):
        result.building_type = "apartment"
    elif re.search(r"office|commercial", prompt, re.IGNORECASE):
        result.building_type = "office" if re.search(r"office", prompt, re.IGNORECASE) else "commercial"
    elif re.search(r"shop|retail|store", prompt, re.IGNORECASE):
        result.building_type = "shop"
    elif re.search(r"industrial|factory|warehouse", prompt, re.IGNORECASE):
        result.building_type = "industrial"
    elif re.search(r"house|residential|home|bungalow|cottage", prompt, re.IGNORECASE):
        result.building_type = "house"

    if re.search(r"modern", prompt, re.IGNORECASE):
        result.style = "modern"
    elif re.search(r"minimalist", prompt, re.IGNORECASE):
        result.style = "minimalist"
    elif re.search(r"industrial", prompt, re.IGNORECASE):
        result.style = "industrial"
    elif re.search(r"contemporary", prompt, re.IGNORECASE):
        result.style = "contemporary"
    elif re.search(r"traditional|classic", prompt, re.IGNORECASE):
        result.style = "traditional"
    elif re.search(r"mediterranean|spanish|italian", prompt, re.IGNORECASE):
        result.style = "mediterranean"
    elif re.search(r"victorian", prompt, re.IGNORECASE):
        result.style = "victorian"

    features = []
    feature_keywords = {
        "balcony": r"balcony|terrace",
        "rooftop": r"rooftop|roof garden|terrace garden",
        "fireplace": r"fireplace|fire pit",
        "basement": r"basement|cellar",
        "home theater": r"home theater|cine|media room",
        "gym": r"gym|fitness|workout",
        "library": r"library|book",
        "guest room": r"guest room|guest house",
        "laundry": r"laundry|utility",
        "prayer room": r"prayer|pooja|temple",
        "walk-in closet": r"walk.in closet|dressing",
        "wine cellar": r"wine cellar|wine",
    }
    for feature_name, pattern in feature_keywords.items():
        if re.search(pattern, prompt, re.IGNORECASE):
            features.append(feature_name)
    result.features = features

    return result


async def analyze_requirements(
    prompt: str,
    ai_manager=None,
) -> AnalyzedRequirements:
    """Analyze building requirements from a natural language prompt.
    
    Tries AI first, falls back to regex-based extraction.
    """
    if not prompt or not prompt.strip():
        return AnalyzedRequirements(raw_prompt=prompt)

    ai_result = await analyze_with_ai(prompt, ai_manager)
    if ai_result:
        return ai_result

    return analyze_with_regex(prompt)
