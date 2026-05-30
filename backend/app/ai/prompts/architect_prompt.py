"""Prompt templates for the Architect agent."""
from typing import List, Optional

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


def build_architect_prompt(requirements: BuildingRequirements, user_prompt: Optional[str] = None) -> str:
    """Construct a clear, instruction-style prompt for the AI provider to generate 2D spatial layouts.

    The prompt focuses the model on generating a structured JSON object
    describing a high-level building design with room layout coordinates, doors, windows, and stairs.
    """
    import random

    lines: List[str] = []
    lines.append("You are an expert architectural designer. Produce a detailed, high-fidelity 2D blueprint layout JSON object for a proposed building design.")
    lines.append("")

    # Inject dynamic layout focus to ensure layout variance even with the same parameters
    layout_focuses = [
        "Focus on an open-concept flow with spacious corridors and contiguous living areas.",
        "Emphasize a multi-wing design layout that separates quiet private areas (bedrooms, study) from active social areas (living room, kitchen).",
        "Adopt a symmetric central corridor spine layout where rooms align neatly on the left and right sides of a hallway.",
        "Use a space-efficient modern L-shaped footprint that leaves generous outdoor yards and centers around an open courtyard feel.",
        "Design a high-density compact grid arrangement to maximize individual room sizes and minimize unnecessary hallway square footage."
    ]
    selected_focus = random.choice(layout_focuses)
    seed_tag = random.randint(1000, 9999)
    lines.append(f"Layout Concept Focus: {selected_focus}")
    lines.append(f"Design Variant ID: V-{seed_tag}")
    lines.append("")
    
    if user_prompt:
        lines.append("Original User Prompt Context (Use this ONLY for aesthetic style, theme, and special room/feature requests. Do NOT use any dimensions, bedroom counts, bathroom counts, or floor counts specified in this text; strictly follow the Project Constraints below):")
        lines.append(f'"{user_prompt.strip()}"')
        lines.append("")

    lines.append("Project Constraints:")
    lines.append(f"- Building type: {requirements.building_type}")
    lines.append(f"- Style: {requirements.style}")
    lines.append(f"- Plot dimensions ({requirements.plot.unit}): {requirements.plot.width} wide x {requirements.plot.length} long")
    lines.append(f"- Floors: {requirements.floors}")
    lines.append(f"- Bedrooms: {requirements.bedrooms}")
    lines.append(f"- Bathrooms: {requirements.bathrooms}")
    if requirements.features:
        lines.append(f"- Key features: {', '.join(requirements.features)}")
    if requirements.budget is not None:
        lines.append(f"- Budget (USD): {requirements.budget}")

    lines.append("")
    lines.append("Generate a logical and highly professional 2D floorplan. Placements must sit inside the plot bounds (0 <= x + width <= plot_width and 0 <= y + length <= plot_length).")
    lines.append("Structure the JSON output matching this strict schema:")
    lines.append("{")
    lines.append('  "id": "design-uuid",')
    lines.append('  "name": "Design Name",')
    lines.append('  "summary": "Brief design summary",')
    lines.append('  "floors": integer,')
    lines.append('  "total_area_m2": number,')
    lines.append('  "rooms": [')
    lines.append('    {')
    lines.append('      "name": "One single clean room name from: Living Room, Kitchen, Master Bedroom, Bedroom 2, Bathroom, Office, Garden, Pool, Garage",')
    lines.append('      "area_m2": number,')
    lines.append('      "x": number,')
    lines.append('      "y": number,')
    lines.append('      "width": number,')
    lines.append('      "length": number')
    lines.append('    }')
    lines.append('  ],')
    lines.append('  "doors": [')
    lines.append('    {')
    lines.append('      "x": number,')
    lines.append('      "y": number,')
    lines.append('      "orientation": "horizontal | vertical",')
    lines.append('      "swing": "inward-left | inward-right | outward-left | outward-right"')
    lines.append('    }')
    lines.append('  ],')
    lines.append('  "windows": [')
    lines.append('    {')
    lines.append('      "x": number,')
    lines.append('      "y": number,')
    lines.append('      "width": number,')
    lines.append('      "orientation": "horizontal | vertical"')
    lines.append('    }')
    lines.append('  ],')
    lines.append('  "stairs": [')
    lines.append('    {')
    lines.append('      "x": number,')
    lines.append('      "y": number,')
    lines.append('      "width": number,')
    lines.append('      "length": number,')
    lines.append('      "direction": "up | down"')
    lines.append('    }')
    lines.append('  ],')
    lines.append('  "footprint_m2": number,')
    lines.append('  "estimated_cost_usd": number,')
    lines.append('  "notes": "string"')
    lines.append("}")
    lines.append("")
    lines.append("CRITICAL DESIGN & COORDINATE RULES:")
    lines.append("1. SCALE AND FOOTPRINT:")
    lines.append(f"   - The plot size is {requirements.plot.width} x {requirements.plot.length} ({requirements.plot.unit}).")
    lines.append("   - The building MUST occupy a realistic proportion of the plot (usually between 45% and 75% of the plot width and length).")
    lines.append(f"   - For example, on a {requirements.plot.width}x{requirements.plot.length} plot, do not design a tiny building (like 10x15). Design a substantial building footprint of about {round(requirements.plot.width * 0.6)}x{round(requirements.plot.length * 0.6)}, positioned cleanly in the plot.")
    lines.append("   - Centered Placement: Center the building inside the plot by leaving nice margins on the sides for yard/garden (e.g. start building x around 15% to 20% of plot width, and y around 15% to 20% of plot length).")
    lines.append("")
    lines.append("2. STRICT NON-OVERLAPPING TILING:")
    lines.append("   - Rooms in the main building MUST tile side-by-side cleanly and share adjoining wall borders. They MUST NOT OVERLAP.")
    lines.append("   - Under NO circumstances should rooms share identical (x, y) coordinates. Each room box (x, y, width, length) must be distinct.")
    lines.append("   - Example ground floor tiling: If the building starts at x=10, y=10 with total size 40x40:")
    lines.append("     - Living Room: x=10, y=10, width=25, length=25")
    lines.append("     - Kitchen: x=10, y=35, width=25, length=15 (adjacent to Living Room)")
    lines.append("     - Guest Bath: x=35, y=10, width=15, length=15")
    lines.append("     - Entrance/Stairs: x=35, y=25, width=15, length=25")
    lines.append("")
    lines.append("3. DOORS AND WINDOWS ON WALL LINES:")
    lines.append("   - Doors must sit exactly on the interface (border) between two rooms, or on the external border of the building (for entrance doors).")
    lines.append("   - Windows must sit exactly on the external walls (outer borders) of the room boxes to face the outside.")
    lines.append("")
    lines.append("4. OUTDOOR AMENITIES:")
    lines.append("   - If a garden or swimming pool is requested, place it outside the main building footprint but completely inside the plot bounds (e.g., in the remaining 25% to 35% margin of the plot).")
    lines.append("")
    lines.append("5. STAIRS:")
    lines.append(f"   - Since you have {requirements.floors} floor(s): If floors > 1, you MUST include a Staircase element in the stairs array, placed inside the building footprint next to the living room or central hallway.")
    lines.append("")
    lines.append("Output ONLY valid JSON. Do not include markdown wraps or code block syntax.")
    
    return "\n".join(lines)


# ── Blueprint Generation Prompt ──────────────────────────────────────────────

BLUEPRINT_GENERATION_SYSTEM_PROMPT = """You are an expert architectural blueprint generator.

You generate complete, professional architectural floor plans as structured JSON.

Your output MUST be a single valid JSON object matching the BlueprintSchema format exactly.
Do NOT include markdown code blocks, comments, or any text outside the JSON.

CRITICAL RULES:
1. All coordinates are in FEET. The plot uses (x, y) where x is horizontal (0=left, plot_width=right) and y is vertical (0=top, plot_length=bottom).
2. Rooms MUST tile cleanly inside the plot boundary with NO overlaps.
3. Every room MUST have width > 0 and length > 0.
4. Doors sit ON the shared wall between two rooms or on the exterior wall for main entrance.
5. Windows sit ON exterior walls only (plot boundary edges).
6. If floors > 1, include a staircase room.
7. Room area_sqft = width * length (compute correctly).
8. All room IDs must be unique strings like "r1", "r2", etc.
9. All wall IDs must be unique strings like "w1", "w2", etc.
10. All door IDs must be unique strings like "d1", "d2", etc.
11. All window IDs must be unique strings like "win1", "win2", etc.
12. Room color_hex must be a valid hex color like "#E8F4F8".
13. Wall thickness must be 0.5 for interior, 0.75 for exterior.
14. Doors must have width between 2.5 and 8.
15. Windows must have width between 1 and 12.
16. Every habitable room (bedroom, bathroom, kitchen, living, dining, office) MUST have at least one door touching its boundary.
17.室外 amenities (garden, pool, garage) go OUTSIDE the main building footprint but INSIDE the plot.
"""


def build_blueprint_prompt(
    plot_width: float,
    plot_length: float,
    bedrooms: int,
    bathrooms: int,
    floors: int,
    building_type: str,
    style: str,
    has_garage: bool = False,
    has_garden: bool = False,
    has_pool: bool = False,
    has_office: bool = False,
    user_prompt: Optional[str] = None,
    variant: Optional[str] = None,
) -> str:
    """Build a prompt that instructs the AI to generate a complete BlueprintSchema."""
    import random

    lines: List[str] = []

    # Dynamic layout focus for variance
    layout_focuses = [
        "L-Shape layout with a central hallway separating living areas from bedrooms.",
        "Corridor-style layout with rooms arranged on both sides of a central corridor.",
        "Open-plan layout with a large open-concept living/kitchen/dining area and separate bedroom wing.",
        "H-Layout with two wings connected by a central living room bridge.",
        "Courtyard layout with rooms arranged around a central open courtyard.",
        "Compact grid layout maximizing room sizes with minimal hallway space.",
    ]
    selected_focus = random.choice(layout_focuses)
    variant_id = f"V-{random.randint(1000, 9999)}"

    lines.append(f"Layout Concept: {selected_focus}")
    lines.append(f"Design Variant: {variant or 'auto'} ({variant_id})")
    lines.append("")

    if user_prompt:
        lines.append(f'User Vision: "{user_prompt.strip()}"')
        lines.append("(Use this for style/theme/amenity context only. Follow the exact dimensions below.)")
        lines.append("")

    lines.append("PROJECT SPECIFICATIONS:")
    lines.append(f"- Plot: {plot_width} ft wide x {plot_length} ft long")
    lines.append(f"- Building Type: {building_type}")
    lines.append(f"- Style: {style}")
    lines.append(f"- Floors: {floors}")
    lines.append(f"- Bedrooms: {bedrooms}")
    lines.append(f"- Bathrooms: {bathrooms}")
    if has_garage:
        lines.append("- Include: Garage")
    if has_garden:
        lines.append("- Include: Garden (outdoor, inside plot boundary)")
    if has_pool:
        lines.append("- Include: Swimming Pool (outdoor, inside plot boundary)")
    if has_office:
        lines.append("- Include: Home Office/Study")
    lines.append("")

    lines.append("OUTPUT FORMAT - Return this exact JSON structure:")
    lines.append("{")
    lines.append('  "project": {')
    lines.append('    "name": "Project Name",')
    lines.append(f'    "building_type": "{building_type}",')
    lines.append(f'    "style": "{style}"')
    lines.append("  },")
    lines.append('  "plot": {')
    lines.append(f'    "width": {plot_width},')
    lines.append(f'    "length": {plot_length},')
    lines.append('    "unit": "ft"')
    lines.append("  },")
    lines.append('  "floors": [')
    for i in range(floors):
        lines.append(f'    {{"level": {i}, "name": "Floor {i+1}", "height_ft": 10}}' + ("," if i < floors - 1 else ""))
    lines.append("  ],")
    lines.append('  "rooms": [')
    lines.append('    {')
    lines.append('      "id": "r1", "name": "Living Room", "room_type": "living",')
    lines.append('      "x": 0, "y": 0, "width": 25, "length": 20,')
    lines.append('      "level": 0, "area_sqft": 500, "is_habitable": true, "color_hex": "#FFF3E0"')
    lines.append("    },")
    lines.append("    ... more rooms ...")
    lines.append("  ],")
    lines.append('  "walls": [')
    lines.append('    {"id": "w1", "x1": 0, "y1": 0, "x2": ' + str(plot_width) + ', "y2": 0, "thickness": 0.75, "wall_type": "exterior"},')
    lines.append("    ... interior walls deduplicated ...")
    lines.append("  ],")
    lines.append('  "doors": [')
    lines.append('    {"id": "d1", "x": 12.5, "y": 20, "width": 3, "height": 7, "door_type": "single", "level": 0, "is_main_entrance": false}')
    lines.append("  ],")
    lines.append('  "windows": [')
    lines.append('    {"id": "win1", "x": 12, "y": 0, "width": 4, "height": 4, "sill_height": 3, "window_type": "casement", "level": 0}')
    lines.append("  ],")
    lines.append('  "stairs": [],')
    lines.append('  "roof": {"roof_type": "flat", "pitch": 0, "overhang": 1, "height_ft": 2, "material": "concrete", "color_hex": "#808080"},')
    lines.append('  "measurements": {')
    lines.append(f'    "total_area_sqft": {plot_width * plot_length},')
    lines.append('    "footprint_sqft": 0,')
    lines.append('    "door_count": 0,')
    lines.append('    "window_count": 0')
    lines.append("  },")
    lines.append('  "metadata": {')
    lines.append('    "generated_by": "AI Architect Engine",')
    lines.append(f'    "variant": "{variant or "A"}",')
    lines.append('    "validation_status": "pending"')
    lines.append("  }")
    lines.append("}")
    lines.append("")

    lines.append("COORDINATE RULES (MUST FOLLOW EXACTLY):")
    lines.append(f"1. ABSOLUTE RULE: Every room's x + width MUST be <= {plot_width} and y + length MUST be <= {plot_length}. No exceptions. If a room extends beyond this, it will be rejected.")
    lines.append(f"2. ABSOLUTE RULE: Every room's x >= 0 and y >= 0. No negative coordinates allowed.")
    lines.append(f"3. The plot boundary is a HARD LIMIT at x={plot_width}, y={plot_length}. Think of it as a wall you cannot pass.")
    lines.append(f"4. Building footprint should occupy 50-75% of the plot. Start building at x around {round(plot_width*0.10)}-{round(plot_width*0.20)}, y around {round(plot_length*0.10)}-{round(plot_length*0.20)}.")
    lines.append("5. Rooms must tile side-by-side sharing walls. NO overlapping rooms. NO gaps between interior rooms.")
    lines.append("6. Compute area_sqft = width * length for every room.")
    lines.append("7. Walls: Use 0.75 thickness for exterior (plot boundary), 0.5 for interior. Deduplicate shared walls.")
    lines.append("8. Place doors on shared walls between rooms. Each bedroom/bathroom/kitchen/living/dining needs at least one door.")
    lines.append("9. Place windows on exterior walls (plot boundary edges) only.")
    lines.append("10. If a garden/pool is requested, place it OUTSIDE the building footprint but INSIDE the plot boundary. Garden/pool coordinates must still be within 0,0 to {plot_width},{plot_length}.")
    lines.append("11. If floors > 1, include a staircase room inside the building.")
    lines.append("")
    lines.append("VALIDATION EXAMPLE:")
    lines.append(f"Plot: {plot_width}x{plot_length} ft")
    lines.append(f"Good: Room at x=5, y=5, width=20, length=15 -> ends at x=25, y=20 (within bounds)")
    lines.append(f"BAD: Room at x=50, y=70, width=20, length=15 -> ends at x=70, y=85 (EXCEEDS plot! REJECTED)")
    lines.append("")
    lines.append("ROOM COLORS:")
    lines.append("- bedroom: #E8F4F8, bathroom: #F0F8E8, kitchen: #FFF8E1")
    lines.append("- living: #FFF3E0, dining: #FCE4EC, hallway: #F5F5F5")
    lines.append("- garage: #EEEEEE, garden: #E8F5E9, staircase: #F3E5F5")
    lines.append("- office: #E3F2FD, pool: #E0F7FA, storage: #FAFAFA")
    lines.append("")
    lines.append("Output ONLY valid JSON. No markdown. No code blocks. No comments.")

    return "\n".join(lines)
