"""Architect API endpoints — blueprint generation, variation, validation."""
import logging
import random
import math
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import ValidationError as PydanticValidationError

from app.blueprint_engine.schemas import (
    BlueprintSchema,
    BlueprintMetadata,
    ProjectInfo,
    PlotInfo,
    FloorInfo,
    RoomData,
    WallData,
    DoorData,
    WindowData,
    StairData,
    BuildingType,
    ArchitecturalStyle,
)
from app.schemas.architect import (
    GenerateBlueprintRequest,
    GenerateBlueprintResponse,
    GenerateVariationRequest,
    GenerateVariationResponse,
    ValidateBlueprintRequest,
    ValidateBlueprintResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)

# ── ID Generator ─────────────────────────────────────────────────────

_id_counter = 0

def _uid(prefix: str) -> str:
    global _id_counter
    _id_counter += 1
    return f"{prefix}{_id_counter}"

def _reset_ids() -> None:
    global _id_counter
    _id_counter = 0

# ── Room Colors ──────────────────────────────────────────────────────

ROOM_COLORS = {
    "bedroom": "#E8F4F8",
    "bathroom": "#F0F8E8",
    "kitchen": "#FFF8E1",
    "living": "#FFF3E0",
    "dining": "#FCE4EC",
    "hallway": "#F5F5F5",
    "garage": "#EEEEEE",
    "garden": "#E8F5E9",
    "staircase": "#F3E5F5",
    "office": "#E3F2FD",
    "pool": "#E0F7FA",
    "storage": "#FAFAFA",
    "generic": "#FFFFFF",
}

MIN_ROOM_SIZES = {
    "bedroom": (8, 8),
    "bathroom": (5, 5),
    "kitchen": (8, 8),
    "living": (10, 8),
    "dining": (6, 6),
    "hallway": (3, 3),
    "garage": (10, 18),
    "office": (8, 8),
    "staircase": (4, 6),
}

# ── Seeded Random ────────────────────────────────────────────────────

def _seeded_random(seed: int):
    s = seed
    def _next():
        nonlocal s
        s = (s * 16807 + 0) % 2147483647
        return (s - 1) / 2147483646
    return _next

# ── Layout Templates ─────────────────────────────────────────────────

def _make_room(name: str, room_type: str, x: float, y: float, w: float, h: float, level: int = 0) -> RoomData:
    return RoomData(
        id=_uid("r"),
        name=name,
        room_type=room_type,
        x=max(0, round(x)),
        y=max(0, round(y)),
        width=max(1, round(w)),
        height=max(1, round(h)),
        level=level,
        color_hex=ROOM_COLORS.get(room_type, "#FFFFFF"),
    )

def _template_modern_villa(pw: float, ph: float, beds: int, baths: int, seed: int) -> List[RoomData]:
    rooms: List[RoomData] = []
    bW = round(pw * 0.65)
    bH = round(ph * 0.65)
    bX = round((pw - bW) / 2)
    bY = round((ph - bH) / 2)

    topH = round(bH * 0.4)
    livingW = round(bW * 0.5)
    kitchenW = bW - livingW

    rooms.append(_make_room("Living Room", "living", bX, bY, livingW, topH))
    rooms.append(_make_room("Kitchen", "kitchen", bX + livingW, bY, kitchenW, round(topH * 0.55)))
    rooms.append(_make_room("Dining", "dining", bX + livingW, bY + round(topH * 0.55), kitchenW, round(topH * 0.45)))

    hallH = 5
    rooms.append(_make_room("Hallway", "hallway", bX, bY + topH, bW, hallH))

    botY = bY + topH + hallH
    botH = bH - topH - hallH
    colW = bW // max(1, min(3, beds + baths))
    cx, cy, colIdx = bX, botY, 0

    for i in range(beds):
        rW = colW - 1
        rH = botH // max(1, (beds + baths) // 3) - 1
        name = "Master Bedroom" if i == 0 else f"Bedroom {i + 1}"
        rooms.append(_make_room(name, "bedroom", cx, cy, rW, max(10, rH)))
        cy += rH + 1
        if cy >= botY + botH or (cy >= botY + botH // 2 and colIdx < 2):
            colIdx += 1
            cx += colW
            cy = botY

    for i in range(baths):
        rW = colW - 1
        rH = 7
        name = "Bathroom" if i == 0 else f"Bathroom {i + 1}"
        rooms.append(_make_room(name, "bathroom", cx, cy, rW, max(5, rH)))
        cy += rH + 1
        if cy >= botY + botH:
            colIdx += 1
            cx += colW
            cy = botY

    return rooms

def _template_corridor(pw: float, ph: float, beds: int, baths: int, seed: int) -> List[RoomData]:
    rooms: List[RoomData] = []
    bW = round(pw * 0.65)
    bH = round(ph * 0.65)
    bX = round((pw - bW) / 2)
    bY = round((ph - bH) / 2)

    corridorW = 5
    corridorX = bX + round(bW * 0.45)
    leftW = corridorX - bX
    rightX = corridorX + corridorW
    rightW = bX + bW - rightX

    rooms.append(_make_room("Corridor", "hallway", corridorX, bY, corridorW, bH))

    topH = round(bH * 0.45)
    rooms.append(_make_room("Living Room", "living", bX, bY, leftW, topH))
    rooms.append(_make_room("Kitchen", "kitchen", bX, bY + topH, leftW, bH - topH))

    rightRooms = beds + baths
    roomH = bH // max(1, rightRooms)
    ry = bY

    for i in range(beds):
        name = "Master Bedroom" if i == 0 else f"Bedroom {i + 1}"
        actual_h = roomH if i < rightRooms - 1 else (bY + bH - ry)
        rooms.append(_make_room(name, "bedroom", rightX, ry, rightW, max(10, actual_h)))
        ry += actual_h

    for i in range(baths):
        name = "Bathroom" if i == 0 else f"Bathroom {i + 1}"
        actual_h = roomH if i < baths - 1 else (bY + bH - ry)
        rooms.append(_make_room(name, "bathroom", rightX, ry, rightW, max(5, actual_h)))
        ry += actual_h

    return rooms

def _template_open_plan(pw: float, ph: float, beds: int, baths: int, seed: int) -> List[RoomData]:
    rooms: List[RoomData] = []
    bW = round(pw * 0.7)
    bH = round(ph * 0.65)
    bX = round((pw - bW) / 2)
    bY = round((ph - bH) / 2)

    topH = round(bH * 0.35)
    thirdW = bW // 3

    rooms.append(_make_room("Living Room", "living", bX, bY, thirdW, topH))
    rooms.append(_make_room("Kitchen", "kitchen", bX + thirdW, bY, thirdW, topH))
    rooms.append(_make_room("Dining", "dining", bX + thirdW * 2, bY, bW - thirdW * 2, topH))

    hallH = 4
    rooms.append(_make_room("Hallway", "hallway", bX, bY + topH, bW, hallH))

    botY = bY + topH + hallH
    botH = bH - topH - hallH
    allRooms = beds + baths
    cols = math.ceil(math.sqrt(allRooms))
    rows = math.ceil(allRooms / cols)
    cellW = bW // max(1, cols)
    cellH = botH // max(1, rows)

    idx = 0
    for r in range(rows):
        for c in range(cols):
            if idx >= allRooms:
                break
            isBed = idx < beds
            name = "Master Bedroom" if idx == 0 else (f"Bedroom {idx + 1}" if isBed else f"Bathroom {idx - beds + 1}")
            rtype = "bedroom" if isBed else "bathroom"
            rooms.append(_make_room(name, rtype, bX + c * cellW, botY + r * cellH, cellW - 1, cellH - 1))
            idx += 1

    return rooms

def _template_h_layout(pw: float, ph: float, beds: int, baths: int, seed: int) -> List[RoomData]:
    rooms: List[RoomData] = []
    bW = round(pw * 0.75)
    bH = round(ph * 0.6)
    bX = round((pw - bW) / 2)
    bY = round((ph - bH) / 2)

    wingW = round(bW * 0.35)
    bridgeW = bW - wingW * 2
    bridgeX = bX + wingW
    bridgeH = round(bH * 0.3)
    bridgeY = bY + round((bH - bridgeH) / 2)

    rooms.append(_make_room("Living Room", "living", bridgeX, bridgeY, bridgeW, bridgeH))
    if bridgeY > bY + 4:
        rooms.append(_make_room("Kitchen", "kitchen", bridgeX, bY, bridgeW, bridgeY - bY))
    if bridgeY + bridgeH < bY + bH - 4:
        rooms.append(_make_room("Dining", "dining", bridgeX, bridgeY + bridgeH, bridgeW, bY + bH - bridgeY - bridgeH))

    leftCount = math.ceil(beds / 2)
    leftH = bH // max(1, leftCount)
    for i in range(leftCount):
        name = "Master Bedroom" if i == 0 else f"Bedroom {i + 1}"
        rooms.append(_make_room(name, "bedroom", bX, bY + i * leftH, wingW, leftH - 1))

    rightNames = []
    for i in range(leftCount, beds):
        rightNames.append((f"Bedroom {i + 1}", "bedroom"))
    for i in range(baths):
        rightNames.append((f"Bathroom {i + 1}" if i > 0 else "Bathroom", "bathroom"))
    if not rightNames:
        rightNames.append(("Office", "office"))

    rightH = bH // max(1, len(rightNames))
    for i, (name, rtype) in enumerate(rightNames):
        rooms.append(_make_room(name, rtype, bX + wingW + bridgeW, bY + i * rightH, wingW, rightH - 1))

    return rooms

def _template_courtyard(pw: float, ph: float, beds: int, baths: int, seed: int) -> List[RoomData]:
    rooms: List[RoomData] = []
    bW = round(pw * 0.8)
    bH = round(ph * 0.8)
    bX = round((pw - bW) / 2)
    bY = round((ph - bH) / 2)

    borderW = round(bW * 0.25)
    borderH = round(bH * 0.25)

    topRooms = [("Living Room", "living"), ("Kitchen", "kitchen"), ("Dining", "dining")]
    topRW = bW // len(topRooms)
    for i, (name, rtype) in enumerate(topRooms):
        rooms.append(_make_room(name, rtype, bX + i * topRW, bY, topRW, borderH))

    botNames = ["Master Bedroom"] + [f"Bedroom {i+1}" for i in range(1, beds)]
    botRW = bW // max(1, len(botNames))
    for i, name in enumerate(botNames):
        rooms.append(_make_room(name, "bedroom", bX + i * botRW, bY + bH - borderH, botRW, borderH))

    innerH = bH - borderH * 2
    leftBath = math.ceil(baths / 2)
    leftH = innerH // max(1, leftBath)
    for i in range(leftBath):
        name = "Bathroom" if i == 0 else f"Bathroom {i + 1}"
        rooms.append(_make_room(name, "bathroom", bX, bY + borderH + i * leftH, borderW, leftH))

    rightBath = baths - leftBath
    for i in range(rightBath):
        rooms.append(_make_room(f"Bathroom {leftBath + i + 1}", "bathroom", bX + bW - borderW, bY + borderH + i * leftH, borderW, leftH))

    rooms.append(_make_room("Courtyard", "garden", bX + borderW, bY + borderH, bW - borderW * 2, innerH))

    return rooms

def _template_split_level(pw: float, ph: float, beds: int, baths: int, seed: int) -> List[RoomData]:
    rooms: List[RoomData] = []
    # Use more of the plot for the building
    bW = round(pw * 0.75)
    bH = round(ph * 0.85)
    bX = round((pw - bW) / 2)
    bY = round((ph - bH) / 2)

    totalRight = beds + baths
    minRoomH = 10

    # Top section: Living + Kitchen (smaller to give more room to bedrooms)
    topH = round(bH * 0.3)
    splitW = round(bW * 0.5)
    stairW = 6

    rooms.append(_make_room("Living Room", "living", bX, bY, splitW, topH))
    rooms.append(_make_room("Kitchen", "kitchen", bX + splitW, bY, bW - splitW, topH))

    # Bottom section: Dining + Staircase + Bedrooms/Bathrooms
    botY = bY + topH
    botH = bH - topH

    rooms.append(_make_room("Dining", "dining", bX, botY, splitW, botH))
    rooms.append(_make_room("Staircase", "staircase", bX + bW - stairW, botY, stairW, botH))

    # Right side: bedrooms + bathrooms stacked vertically
    rightX = bX + splitW
    rightW = bW - splitW - stairW
    rightH = botH
    slotH = rightH // max(1, totalRight)

    allRooms = [("Master Bedroom", "bedroom")] + [(f"Bedroom {i+1}", "bedroom") for i in range(1, beds)]
    allRooms += [("Bathroom", "bathroom")] + [(f"Bathroom {i+1}", "bathroom") for i in range(1, baths)]

    ry = botY
    for idx, (name, rtype) in enumerate(allRooms):
        remaining = botY + botH - ry
        h = remaining if idx == totalRight - 1 else remaining // max(1, totalRight - idx)
        rooms.append(_make_room(name, rtype, rightX, ry, rightW, max(1, h)))
        ry += h

    return rooms

# ── Variant Map ──────────────────────────────────────────────────────

VARIANT_MAP = {
    "A": [_template_modern_villa],
    "B": [_template_corridor, _template_courtyard],
    "C": [_template_open_plan, _template_h_layout],
    "D": [_template_split_level],
    "E": [_template_courtyard, _template_open_plan],
}

ALL_TEMPLATES = [_template_modern_villa, _template_corridor, _template_open_plan, _template_h_layout, _template_courtyard, _template_split_level]

# ── Wall Builder ─────────────────────────────────────────────────────

def _build_walls(rooms: List[RoomData], pw: float, ph: float) -> List[WallData]:
    wall_map: Dict[str, WallData] = {}

    def add(x1, y1, x2, y2, wtype="interior"):
        x1, y1, x2, y2 = round(x1), round(y1), round(x2), round(y2)
        key = f"v{x1},{min(y1,y2)}-{max(y1,y2)}" if x1 == x2 else f"h{y1},{min(x1,x2)}-{max(x1,x2)}"
        if key not in wall_map:
            wall_map[key] = WallData(id=_uid("w"), x1=x1, y1=y1, x2=x2, y2=y2,
                                      thickness=0.75 if wtype == "exterior" else 0.5, wall_type=wtype)

    add(0, 0, pw, 0, "exterior")
    add(pw, 0, pw, ph, "exterior")
    add(pw, ph, 0, ph, "exterior")
    add(0, ph, 0, 0, "exterior")

    for room in rooms:
        add(room.x, room.y, room.x + room.width, room.y)
        add(room.x + room.width, room.y, room.x + room.width, room.y + room.height)
        add(room.x + room.width, room.y + room.height, room.x, room.y + room.height)
        add(room.x, room.y + room.height, room.x, room.y)

    return list(wall_map.values())

def _place_doors(rooms: List[RoomData]) -> List[DoorData]:
    doors: List[DoorData] = []
    placed = set()

    for i in range(len(rooms)):
        for j in range(i + 1, len(rooms)):
            a, b = rooms[i], rooms[j]
            pair = (a.id, b.id)
            if pair in placed:
                continue

            if abs(a.y + a.height - b.y) < 1 or abs(b.y + b.height - a.y) < 1:
                oStart = max(a.x, b.x)
                oEnd = min(a.x + a.width, b.x + b.width)
                if oEnd - oStart >= 4:
                    doorX = round(oStart + (oEnd - oStart) / 2)
                    doorY = a.y + a.height if abs(a.y + a.height - b.y) < 1 else b.y + b.height
                    doors.append(DoorData(id=_uid("d"), x=doorX, y=doorY, width=3, orientation="horizontal"))
                    placed.add(pair)
                    continue

            if abs(a.x + a.width - b.x) < 1 or abs(b.x + b.width - a.x) < 1:
                oStart = max(a.y, b.y)
                oEnd = min(a.y + a.height, b.y + b.height)
                if oEnd - oStart >= 4:
                    doorX = a.x + a.width if abs(a.x + a.width - b.x) < 1 else b.x + b.width
                    doorY = round(oStart + (oEnd - oStart) / 2)
                    doors.append(DoorData(id=_uid("d"), x=doorX, y=doorY, width=3, orientation="vertical"))
                    placed.add(pair)

    return doors

def _place_windows(rooms: List[RoomData], pw: float, ph: float) -> List[WindowData]:
    windows: List[WindowData] = []
    skip = {"hallway", "staircase", "storage", "garden"}

    for room in rooms:
        if room.room_type in skip:
            continue
        if room.y == 0 and room.width >= 6:
            windows.append(WindowData(id=_uid("win"), x=round(room.x + room.width / 2), y=0, width=min(4, round(room.width * 0.4)), orientation="horizontal"))
        if abs(room.y + room.height - ph) < 1 and room.width >= 6:
            windows.append(WindowData(id=_uid("win"), x=round(room.x + room.width / 2), y=ph, width=min(4, round(room.width * 0.4)), orientation="horizontal"))
        if room.x == 0 and room.height >= 6:
            windows.append(WindowData(id=_uid("win"), x=0, y=round(room.y + room.height / 2), width=min(4, round(room.height * 0.4)), orientation="vertical"))
        if abs(room.x + room.width - pw) < 1 and room.height >= 6:
            windows.append(WindowData(id=_uid("win"), x=pw, y=round(room.y + room.height / 2), width=min(4, round(room.height * 0.4)), orientation="vertical"))

    return windows

# ── Main Generator ───────────────────────────────────────────────────

def _generate_layout(
    pw: float, ph: float, beds: int, baths: int, floors: int,
    building_type: str, style: str, variant: str = "A",
    seed: Optional[int] = None, project_name: str = "My Blueprint",
) -> BlueprintSchema:
    _reset_ids()
    actual_seed = seed if seed is not None else random.randint(1, 2**31)

    templates = VARIANT_MAP.get(variant, ALL_TEMPLATES)
    rng = _seeded_random(actual_seed)
    template = templates[int(rng() * len(templates))]

    rooms = template(pw, ph, max(1, beds), max(1, baths), actual_seed)

    # Clamp to plot bounds (gentle - don't force min sizes that cause overlaps)
    for room in rooms:
        room.x = max(0, min(pw - room.width, room.x))
        room.y = max(0, min(ph - room.height, room.y))
        room.width = min(room.width, pw - room.x)
        room.height = min(room.height, ph - room.y)

    walls = _build_walls(rooms, pw, ph)
    doors = _place_doors(rooms)
    windows = _place_windows(rooms, pw, ph)

    stairs: List[StairData] = []
    if floors > 1:
        hall = next((r for r in rooms if r.room_type in ("hallway", "staircase")), None)
        if hall:
            stairW = min(6, round(hall.width * 0.6))
            stairH = min(10, round(hall.height * 0.6))
            if stairW >= 3 and stairH >= 3:
                stairs.append(StairData(
                    id=_uid("s"),
                    x=hall.x + round(hall.width * 0.2),
                    y=hall.y + round(hall.height * 0.2),
                    width=stairW,
                    height=stairH,
                    direction="up",
                ))

    return BlueprintSchema(
        project=ProjectInfo(name=project_name, building_type=building_type, style=style),
        plot=PlotInfo(width=pw, height=ph),
        floors=[FloorInfo(level=i, name=f"Floor {i+1}") for i in range(floors)],
        rooms=rooms,
        walls=walls,
        doors=doors,
        windows=windows,
        stairs=stairs,
        metadata=BlueprintMetadata(
            generated_by="AI Architect Layout Engine",
            engine_version="3.0",
            variant=variant,
        ),
    )

# ── Validation ───────────────────────────────────────────────────────

def _validate(blueprint: BlueprintSchema) -> Dict[str, Any]:
    errors: List[str] = []
    warnings: List[str] = []
    rooms = blueprint.rooms
    pw, ph = blueprint.plot.width, blueprint.plot.height

    for room in rooms:
        if room.x < -0.01 or room.y < -0.01:
            errors.append(f"Room '{room.name}' at negative coords ({room.x}, {room.y})")
        if room.x + room.width > pw + 0.01:
            errors.append(f"Room '{room.name}' extends {room.x + room.width - pw:.1f} beyond plot width")
        if room.y + room.height > ph + 0.01:
            errors.append(f"Room '{room.name}' extends {room.y + room.height - ph:.1f} beyond plot height")

    for i in range(len(rooms)):
        for j in range(i + 1, len(rooms)):
            a, b = rooms[i], rooms[j]
            ox = a.x < b.x + b.width and a.x + a.width > b.x
            oy = a.y < b.y + b.height and a.y + a.height > b.y
            if ox and oy:
                ow = min(a.x + a.width, b.x + b.width) - max(a.x, b.x)
                oh = min(a.y + a.height, b.y + b.height) - max(a.y, b.y)
                if ow > 0.5 and oh > 0.5:
                    errors.append(f"Rooms '{a.name}' and '{b.name}' overlap {ow:.1f}x{oh:.1f}")

    for room in rooms:
        min_dim = MIN_ROOM_SIZES.get(room.room_type)
        if min_dim:
            if room.width < min_dim[0]:
                errors.append(f"Room '{room.name}' width {room.width:.1f} < min {min_dim[0]}")
            if room.height < min_dim[1]:
                errors.append(f"Room '{room.name}' height {room.height:.1f} < min {min_dim[1]}")

    valid = len(errors) == 0
    blueprint.metadata.validation_status = "valid" if valid else "invalid"
    blueprint.metadata.validation_errors = errors + warnings

    return {"valid": valid, "errors": errors, "warnings": warnings}

# ── Endpoints ────────────────────────────────────────────────────────

@router.post("/generate-blueprint", response_model=GenerateBlueprintResponse, status_code=200)
async def generate_blueprint(request: GenerateBlueprintRequest):
    logger.info("api_generate_blueprint_started")
    try:
        blueprint = _generate_layout(
            pw=request.plot_width,
            ph=request.plot_height,
            beds=request.bedrooms,
            baths=request.bathrooms,
            floors=request.floors,
            building_type=request.building_type,
            style=request.style,
            variant=request.variant or "A",
            seed=request.seed,
            project_name=request.project_name,
        )
        validation = _validate(blueprint)
        return GenerateBlueprintResponse(
            success=validation["valid"],
            blueprint=blueprint.model_dump(mode="json"),
            validation=validation,
        )
    except Exception as exc:
        logger.exception("api_generate_blueprint_failed")
        raise HTTPException(status_code=500, detail=f"Blueprint generation failed: {exc}")


@router.post("/generate-variation", response_model=GenerateVariationResponse, status_code=200)
async def generate_variation(request: GenerateVariationRequest):
    logger.info("api_generate_variation_started")
    try:
        bp = BlueprintSchema.model_validate(request.blueprint)
        blueprint = _generate_layout(
            pw=bp.plot.width,
            ph=bp.plot.height,
            beds=sum(1 for r in bp.rooms if r.room_type == "bedroom"),
            baths=sum(1 for r in bp.rooms if r.room_type == "bathroom"),
            floors=max(1, len(bp.floors)),
            building_type=bp.project.building_type.value,
            style=bp.project.style.value,
            variant=request.variant,
            project_name=bp.project.name,
        )
        validation = _validate(blueprint)
        return GenerateVariationResponse(
            success=validation["valid"],
            blueprint=blueprint.model_dump(mode="json"),
            validation=validation,
        )
    except Exception as exc:
        logger.exception("api_generate_variation_failed")
        raise HTTPException(status_code=500, detail=f"Variation generation failed: {exc}")


@router.post("/validate-blueprint", response_model=ValidateBlueprintResponse, status_code=200)
async def validate_blueprint_endpoint(request: ValidateBlueprintRequest):
    try:
        bp = BlueprintSchema.model_validate(request.blueprint)
        validation = _validate(bp)
        return ValidateBlueprintResponse(success=validation["valid"], validation=validation)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Validation failed: {exc}")


@router.get("/health")
async def health_check():
    return {"status": "healthy", "engine": "layout-engine-v3"}
