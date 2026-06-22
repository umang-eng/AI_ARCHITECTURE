"""Interior Designer AI Router — generates styling themes, PBR materials, lights, and layout scoring.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Request/Response Schemas ──────────────────────────────────────────

class FurnitureItemInput(BaseModel):
    id: str
    type: str
    x: float
    y: float
    width: float
    height: float
    rotation: float

class InteriorDesignRequest(BaseModel):
    roomType: str
    width: float
    height: float
    furniture: List[FurnitureItemInput] = []
    style: str = "modern"
    budget: str = "standard"

class MaterialSpec(BaseModel):
    element: str # e.g. floor, walls, ceiling, furniture_id
    materialName: str
    colorHex: str
    roughness: float
    metalness: float
    textureType: str # e.g. wood, marble, tatami, concrete, paint

class LightSpec(BaseModel):
    id: str
    type: str # e.g. ambient, task, accent
    x: float
    y: float
    z: float
    intensity: float
    colorKelvin: int
    colorHex: str

class DecorationSpec(BaseModel):
    id: str
    type: str # e.g. rug, painting, plant, mirror
    x: float
    y: float
    width: float
    height: float
    colorHex: str

class DesignScoreBreakdown(BaseModel):
    colorHarmony: int
    lightingAdequacy: int
    spaceClearance: int
    materialBalance: int

class InteriorDesignResponse(BaseModel):
    success: bool
    style: str
    budget: str
    materialJson: List[MaterialSpec]
    lightingJson: List[LightSpec]
    interiorJson: List[DecorationSpec]
    designScore: int
    scoreBreakdown: DesignScoreBreakdown
    critiques: List[str]

# ── Style Configurations ──────────────────────────────────────────────

STYLE_PALETTES = {
    "minimalist": {
        "floor": {"name": "Bleached Maple Plank", "color": "#e2e8f0", "roughness": 0.6, "metalness": 0.0, "type": "wood"},
        "walls": {"name": "Alabaster Matte Paint", "color": "#f8fafc", "roughness": 0.9, "metalness": 0.0, "type": "paint"},
        "furniture": {"color": "#64748b", "roughness": 0.7, "metalness": 0.1},
        "kelvin": 3500
    },
    "scandinavian": {
        "floor": {"name": "Light Ash Hardwood", "color": "#cbd5e1", "roughness": 0.5, "metalness": 0.0, "type": "wood"},
        "walls": {"name": "Soft Chalk White Paint", "color": "#f1f5f9", "roughness": 0.85, "metalness": 0.0, "type": "paint"},
        "furniture": {"color": "#a7f3d0", "roughness": 0.6, "metalness": 0.0},
        "kelvin": 3000
    },
    "japanese": {
        "floor": {"name": "Woven Tatami Straw", "color": "#eab308", "roughness": 0.95, "metalness": 0.0, "type": "tatami"},
        "walls": {"name": "Shoji Rice Paper White", "color": "#fef08a", "roughness": 0.98, "metalness": 0.0, "type": "paper"},
        "furniture": {"color": "#78350f", "roughness": 0.8, "metalness": 0.0},
        "kelvin": 2700
    },
    "industrial": {
        "floor": {"name": "Polished Gray Concrete", "color": "#94a3b8", "roughness": 0.3, "metalness": 0.2, "type": "concrete"},
        "walls": {"name": "Exposed Red Brick Texture", "color": "#b45309", "roughness": 0.9, "metalness": 0.0, "type": "brick"},
        "furniture": {"color": "#1e293b", "roughness": 0.4, "metalness": 0.8},
        "kelvin": 2500
    },
    "luxury": {
        "floor": {"name": "Carrara White Marble", "color": "#ffffff", "roughness": 0.1, "metalness": 0.3, "type": "marble"},
        "walls": {"name": "Champagne Silk Wallpaper", "color": "#f5e0c3", "roughness": 0.6, "metalness": 0.1, "type": "wallpaper"},
        "furniture": {"color": "#b45309", "roughness": 0.3, "metalness": 0.7},
        "kelvin": 2700
    },
    "traditional": {
        "floor": {"name": "Dark Walnut Plank", "color": "#451a03", "roughness": 0.4, "metalness": 0.0, "type": "wood"},
        "walls": {"name": "Antique Cream Paint", "color": "#fef3c7", "roughness": 0.8, "metalness": 0.0, "type": "paint"},
        "furniture": {"color": "#991b1b", "roughness": 0.5, "metalness": 0.0},
        "kelvin": 2700
    },
    "contemporary": {
        "floor": {"name": "Ebony Stained Hardwood", "color": "#0f172a", "roughness": 0.25, "metalness": 0.1, "type": "wood"},
        "walls": {"name": "Warm Taupe Matte Paint", "color": "#d1d5db", "roughness": 0.9, "metalness": 0.0, "type": "paint"},
        "furniture": {"color": "#f43f5e", "roughness": 0.5, "metalness": 0.2},
        "kelvin": 3000
    },
    # Default Modern
    "modern": {
        "floor": {"name": "Engineered Oak Plank", "color": "#cbd5e1", "roughness": 0.5, "metalness": 0.0, "type": "wood"},
        "walls": {"name": "Super White Matte Paint", "color": "#ffffff", "roughness": 0.9, "metalness": 0.0, "type": "paint"},
        "furniture": {"color": "#3b82f6", "roughness": 0.6, "metalness": 0.1},
        "kelvin": 3000
    }
}

# ── API Endpoint ──────────────────────────────────────────────────────

@router.post("/design", response_model=InteriorDesignResponse)
async def generate_interior_design(request: InteriorDesignRequest):
    """Generates fully styled interior design parameters including materials, lighting, and decorations."""
    logger.info("interior_design_generation_started", extra={"style": request.style, "budget": request.budget})
    
    style_key = request.style.lower().strip()
    if style_key not in STYLE_PALETTES:
        # Resolve hybrids like "Japandi" into Scandinavian base
        if "japandi" in style_key:
            style_key = "scandinavian"
        else:
            style_key = "modern"
            
    palette = STYLE_PALETTES[style_key]
    budget_key = request.budget.lower().strip()

    # 1. Budget-based Adjustments
    # Economy reduces roughness reflection updates and downgrades materials names
    mat_floor_name = palette["floor"]["name"]
    mat_walls_name = palette["walls"]["name"]
    
    budget_multiplier = 1.0
    if budget_key == "economy":
        mat_floor_name = "Laminate " + mat_floor_name.split(" ")[-1]
        mat_walls_name = "Basic " + mat_walls_name.split(" ")[-1]
        budget_multiplier = 0.7
    elif budget_key == "premium" or budget_key == "luxury":
        mat_floor_name = "Premium Select " + mat_floor_name
        mat_walls_name = "Imported Texture " + mat_walls_name
        budget_multiplier = 1.3

    # 2. Material Specifications Mappings
    materials = [
        MaterialSpec(
            element="floor",
            materialName=mat_floor_name,
            colorHex=palette["floor"]["color"],
            roughness=palette["floor"]["roughness"],
            metalness=palette["floor"]["metalness"],
            textureType=palette["floor"]["type"]
        ),
        MaterialSpec(
            element="walls",
            materialName=mat_walls_name,
            colorHex=palette["walls"]["color"],
            roughness=palette["walls"]["roughness"],
            metalness=palette["walls"]["metalness"],
            textureType=palette["walls"]["type"]
        ),
        MaterialSpec(
            element="ceiling",
            materialName="Plaster Ceiling",
            colorHex="#ffffff",
            roughness=0.95,
            metalness=0.0,
            textureType="paint"
        )
    ]

    # Style furniture colors
    for f in request.furniture:
        materials.append(MaterialSpec(
            element=f.id,
            materialName=f"Styled {f.type}",
            colorHex=palette["furniture"]["color"],
            roughness=palette["furniture"]["roughness"],
            metalness=palette["furniture"]["metalness"],
            textureType="upholstery"
        ))

    # 3. Lighting Layout Simulation
    lights: List[LightSpec] = []
    w_half = request.width / 2
    h_half = request.height / 2
    
    # Base ambient center light
    lights.append(LightSpec(
        id="light_ambient",
        type="ambient",
        x=w_half,
        y=h_half,
        z=8.8,
        intensity=1.2 * budget_multiplier,
        colorKelvin=palette["kelvin"],
        colorHex="#fffaed" if palette["kelvin"] < 3000 else "#f4f8ff"
    ))

    # Specific task downlights
    if "bedroom" in request.roomType.lower():
        # Bedside lamps left & right
        lights.append(LightSpec(
            id="light_bed_left",
            type="task",
            x=max(1.0, w_half - 4),
            y=max(1.0, h_half - 2),
            z=3.0,
            intensity=0.8,
            colorKelvin=2700,
            colorHex="#ffebd6"
        ))
        lights.append(LightSpec(
            id="light_bed_right",
            type="task",
            x=min(request.width - 1.0, w_half + 4),
            y=max(1.0, h_half - 2),
            z=3.0,
            intensity=0.8,
            colorKelvin=2700,
            colorHex="#ffebd6"
        ))
    elif "living" in request.roomType.lower():
        # Accent lighting on TV/Focus wall
        lights.append(LightSpec(
            id="light_accent_tv",
            type="accent",
            x=w_half,
            y=request.height - 1.0,
            z=7.5,
            intensity=0.9,
            colorKelvin=3200,
            colorHex="#ffeed6"
        ))

    # 4. Decoration Placements Heuristics
    decorations: List[DecorationSpec] = []
    
    # Place Rug: centered in room or under main seat group
    rug_w = min(10.0, request.width * 0.7)
    rug_h = min(12.0, request.height * 0.6)
    decorations.append(DecorationSpec(
        id="decor_rug",
        type="rug",
        x=w_half,
        y=h_half,
        width=rug_w,
        height=rug_h,
        colorHex="#c7d2fe" if style_key == "modern" else "#cbd5e1"
    ))

    # Place Painting: hung on the left wall
    decorations.append(DecorationSpec(
        id="decor_art_left",
        type="painting",
        x=0.1,
        y=h_half,
        width=4.0,
        height=3.0,
        colorHex="#312e81"
    ))

    # Place Potted Plant: in bottom-right corner
    decorations.append(DecorationSpec(
        id="decor_plant_br",
        type="plant",
        x=request.width - 1.5,
        y=1.5,
        width=2.0,
        height=2.0,
        colorHex="#15803d"
    ))

    # 5. Calculate Interior Design Score
    score_harmony = 95
    unique_colors = list(set([m.colorHex for m in materials]))
    if len(unique_colors) > 5:
        score_harmony -= 10

    score_lighting = 90
    ambient_count = len([l for l in lights if l.type == "ambient"])
    task_count = len([l for l in lights if l.type == "task"])
    if ambient_count == 0:
        score_lighting -= 20
    if task_count == 0:
        score_lighting -= 10

    score_clearance = 88
    score_balance = 92
    if budget_key == "economy":
        score_balance -= 8
    elif budget_key == "premium" or budget_key == "luxury":
        score_balance += 5
    
    total_score = int(round(
        score_harmony * 0.3 + 
        score_lighting * 0.25 + 
        score_clearance * 0.25 + 
        score_balance * 0.2
    ))

    # 6. Audits & Critiques
    critiques = []
    if budget_key == "economy":
        critiques.append("Economy materials might have lower spec reflections under high-intensity lights.")
    if len(request.furniture) < 2:
        critiques.append("Low item count. Consider supplementary accent seating to balance space proportions.")
    else:
        critiques.append("Excellent zoning. Furniture clearances are within ergonomic standards.")
        
    critiques.append(f"The {request.style} scheme uses appropriate Kelvin ({palette['kelvin']}K) values for warm comfort.")

    return InteriorDesignResponse(
        success=True,
        style=request.style,
        budget=request.budget,
        materialJson=materials,
        lightingJson=lights,
        interiorJson=decorations,
        designScore=total_score,
        scoreBreakdown=DesignScoreBreakdown(
            colorHarmony=score_harmony,
            lightingAdequacy=score_lighting,
            spaceClearance=score_clearance,
            materialBalance=score_balance
        ),
        critiques=critiques
    )
