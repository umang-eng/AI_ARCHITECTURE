"""Procedural Blueprint Generation Engine.

Architecture:
  1. Template Registry — predefined layout strategies
  2. Variation Engine — randomization within constraints
  3. Room Placer — overlap-free placement with hallways
  4. Wall Builder — deduplicated wall generation
  5. Door/Window Placer — context-aware placement
  6. Stair Generator — multi-level stair placement

Each call to ``generate_blueprint`` produces a NEW unique layout
by picking a random template and randomizing all proportions.
"""
from __future__ import annotations

import hashlib
import logging
import math
import random
from typing import Any, Callable, Dict, List, Optional, Tuple

from app.blueprint_engine.schemas import (
    ArchitecturalStyle,
    BlueprintMetadata,
    BlueprintSchema,
    BuildingType,
    DoorData,
    DoorType,
    ElevationData,
    ElevationFace,
    FloorInfo,
    MeasurementInfo,
    PlotInfo,
    ProjectInfo,
    RoofData,
    RoofType,
    RoomData,
    StairData,
    StairType,
    WallData,
    WallType,
    WindowData,
    WindowType,
)

logger = logging.getLogger(__name__)

RoomGenerator = Callable[[Dict[str, Any], "IdGen", int], List[RoomData]]


class IdGen:
    """Thread-safe (stateless per call) unique ID generator."""
    def __init__(self) -> None:
        self._counts: Dict[str, int] = {}

    def next(self, prefix: str) -> str:
        self._counts[prefix] = self._counts.get(prefix, 0) + 1
        return f"{prefix}{self._counts[prefix]}"


def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def rand_f(lo: float, hi: float) -> float:
    return lo + random.random() * (hi - lo)


def rand_i(lo: int, hi: int) -> int:
    return random.randint(lo, hi)


def shuffle(items: List[Any]) -> List[Any]:
    items = list(items)
    random.shuffle(items)
    return items


def pick(items: List[Any]) -> Any:
    return random.choice(items)


Weights = List[float]


def weighted_split(total: float, weights: Weights) -> List[float]:
    weight_sum = sum(weights)
    results: List[float] = []
    allocated = 0.0
    for i, w in enumerate(weights):
        if i == len(weights) - 1:
            results.append(total - allocated)
        else:
            s = round((w / weight_sum) * total, 1)
            results.append(s)
            allocated += s
    return results


TEMPLATE_REGISTRY: Dict[str, RoomGenerator] = {}

def register_template(name: str) -> Callable:
    def decorator(fn: RoomGenerator) -> RoomGenerator:
        TEMPLATE_REGISTRY[name] = fn
        return fn
    return decorator


@register_template("l_shape")
def template_l_shape(params: Dict[str, Any], ids: IdGen, seed: int) -> List[RoomData]:
    rng = random.Random(seed)
    pw = params["plot_width"]
    ph = params["plot_height"]
    bedrooms = params["bedrooms"]
    bathrooms = params.get("bathrooms", max(1, bedrooms // 2))
    has_garage = params.get("has_garage", False)
    has_garden = params.get("has_garden", False)

    rooms: List[RoomData] = []

    left_ratio = rng.uniform(0.35, 0.48)
    hallway_w = max(4, round(pw * rng.uniform(0.05, 0.08)))
    left_w = round(pw * left_ratio)
    right_x = left_w + hallway_w
    right_w = pw - right_x

    living_split = rng.uniform(0.45, 0.65)
    living_h = round(ph * living_split)
    kitchen_h = ph - living_h

    if rng.random() > 0.5:
        rooms.append(RoomData(id=ids.next("r"), name="Living Room", room_type="living", x=0, y=0, width=left_w, length=living_h))
        rooms.append(RoomData(id=ids.next("r"), name="Kitchen", room_type="kitchen", x=0, y=living_h, width=left_w, length=kitchen_h))
    else:
        rooms.append(RoomData(id=ids.next("r"), name="Kitchen", room_type="kitchen", x=0, y=0, width=left_w, length=kitchen_h))
        rooms.append(RoomData(id=ids.next("r"), name="Living Room", room_type="living", x=0, y=kitchen_h, width=left_w, length=living_h))

    rooms.append(RoomData(id=ids.next("r"), name="Hallway", room_type="hallway", x=left_w, y=0, width=hallway_w, length=ph))

    right_names: List[str] = []
    for i in range(1, bedrooms + 1):
        right_names.append("Master Bedroom" if i == 1 else f"Bedroom {i}")
    for i in range(1, bathrooms + 1):
        right_names.append("Bathroom" if i == 1 else f"Bathroom {i}")
    if has_garage:
        right_names.append("Garage")
    if has_garden:
        right_names.append("Garden")
    rng.shuffle(right_names)

    n = len(right_names)
    if n <= 4 or right_w < 20:
        weights = [rng.uniform(0.8, 1.2) for _ in right_names]
        total_w = sum(weights)
        cur_y = 0
        for idx, name in enumerate(right_names):
            h = ph - cur_y if idx == n - 1 else round((weights[idx] / total_w) * ph)
            rooms.append(RoomData(id=ids.next("r"), name=name, room_type=_infer_room_type(name), x=right_x, y=cur_y, width=right_w, length=h))
            cur_y += h
    else:
        col_w1 = round(right_w * rng.uniform(0.45, 0.55))
        col_w2 = right_w - col_w1
        col1 = right_names[:math.ceil(n / 2)]
        col2 = right_names[math.ceil(n / 2):]

        w1 = [rng.uniform(0.8, 1.2) for _ in col1]
        tw1 = sum(w1)
        cy1 = 0
        for idx, name in enumerate(col1):
            h = ph - cy1 if idx == len(col1) - 1 else round((w1[idx] / tw1) * ph)
            rooms.append(RoomData(id=ids.next("r"), name=name, room_type=_infer_room_type(name), x=right_x, y=cy1, width=col_w1, length=h))
            cy1 += h

        w2 = [rng.uniform(0.8, 1.2) for _ in col2]
        tw2 = sum(w2)
        cy2 = 0
        for idx, name in enumerate(col2):
            h = ph - cy2 if idx == len(col2) - 1 else round((w2[idx] / tw2) * ph)
            rooms.append(RoomData(id=ids.next("r"), name=name, room_type=_infer_room_type(name), x=right_x + col_w1, y=cy2, width=col_w2, length=h))
            cy2 += h

    return rooms


@register_template("corridor")
def template_corridor(params: Dict[str, Any], ids: IdGen, seed: int) -> List[RoomData]:
    rng = random.Random(seed)
    pw = params["plot_width"]
    ph = params["plot_height"]
    bedrooms = params["bedrooms"]
    bathrooms = params.get("bathrooms", max(1, bedrooms // 2))
    has_garage = params.get("has_garage", False)
    has_garden = params.get("has_garden", False)

    rooms: List[RoomData] = []

    corridor_w = max(5, round(pw * rng.uniform(0.06, 0.10)))
    corridor_offset = rng.uniform(0.38, 0.55)
    corridor_x = round(pw * corridor_offset - corridor_w / 2)
    left_w = corridor_x
    right_x = corridor_x + corridor_w
    right_w = pw - right_x

    rooms.append(RoomData(id=ids.next("r"), name="Corridor", room_type="hallway", x=corridor_x, y=0, width=corridor_w, length=ph))

    all_names: List[str] = ["Living Room", "Kitchen"]
    for i in range(1, bedrooms + 1):
        all_names.append("Master Bedroom" if i == 1 else f"Bedroom {i}")
    for i in range(1, bathrooms + 1):
        all_names.append("Bathroom" if i == 1 else f"Bathroom {i}")
    if has_garage:
        all_names.append("Garage")
    if has_garden:
        all_names.append("Garden")
    rng.shuffle(all_names)

    left_names = all_names[:math.ceil(len(all_names) / 2)]
    right_names = all_names[math.ceil(len(all_names) / 2):]

    lw = [rng.uniform(0.7, 1.3) for _ in left_names]
    ltw = sum(lw)
    ly = 0
    for idx, name in enumerate(left_names):
        h = ph - ly if idx == len(left_names) - 1 else round((lw[idx] / ltw) * ph)
        rooms.append(RoomData(id=ids.next("r"), name=name, room_type=_infer_room_type(name), x=0, y=ly, width=left_w, length=h))
        ly += h

    r_w = [rng.uniform(0.7, 1.3) for _ in right_names]
    rtw = sum(r_w)
    ry = 0
    for idx, name in enumerate(right_names):
        h = ph - ry if idx == len(right_names) - 1 else round((r_w[idx] / rtw) * ph)
        rooms.append(RoomData(id=ids.next("r"), name=name, room_type=_infer_room_type(name), x=right_x, y=ry, width=right_w, length=h))
        ry += h

    return rooms


@register_template("open_plan")
def template_open_plan(params: Dict[str, Any], ids: IdGen, seed: int) -> List[RoomData]:
    rng = random.Random(seed)
    pw = params["plot_width"]
    ph = params["plot_height"]
    bedrooms = params["bedrooms"]
    bathrooms = params.get("bathrooms", max(1, bedrooms // 2))
    has_garage = params.get("has_garage", False)

    rooms: List[RoomData] = []

    top_ratio = rng.uniform(0.32, 0.45)
    top_h = round(ph * top_ratio)
    bottom_h = ph - top_h

    top_names = shuffle(["Living Room", "Kitchen", "Dining"])
    splits = [rng.uniform(0.3, 0.45), rng.uniform(0.25, 0.35)]
    s1_w = round(pw * splits[0])
    s2_w = round(pw * splits[1])
    s3_w = pw - s1_w - s2_w

    rooms.append(RoomData(id=ids.next("r"), name=top_names[0], room_type=_infer_room_type(top_names[0]), x=0, y=0, width=s1_w, length=top_h))
    rooms.append(RoomData(id=ids.next("r"), name=top_names[1], room_type=_infer_room_type(top_names[1]), x=s1_w, y=0, width=s2_w, length=top_h))
    rooms.append(RoomData(id=ids.next("r"), name=top_names[2], room_type=_infer_room_type(top_names[2]), x=s1_w + s2_w, y=0, width=s3_w, length=top_h))

    bottom_names: List[str] = []
    for i in range(1, bedrooms + 1):
        bottom_names.append("Master Bedroom" if i == 1 else f"Bedroom {i}")
    for i in range(1, bathrooms + 1):
        bottom_names.append("Bathroom" if i == 1 else f"Bathroom {i}")
    if has_garage:
        bottom_names.append("Garage")
    rng.shuffle(bottom_names)

    total = len(bottom_names)
    cols = 1 if total <= 2 else (2 if total <= 4 else (3 if total <= 6 else math.ceil(math.sqrt(total))))
    rows = math.ceil(total / cols)

    col_weights = [rng.uniform(0.8, 1.2) for _ in range(cols)]
    col_total = sum(col_weights)
    col_widths: List[float] = []
    allocated = 0.0
    for i in range(cols):
        if i == cols - 1:
            col_widths.append(pw - sum(col_widths))
        else:
            cw = round((col_weights[i] / col_total) * pw, 1)
            col_widths.append(cw)

    col_x: List[float] = []
    cx = 0.0
    for cw in col_widths:
        col_x.append(cx)
        cx += cw

    row_weights = [rng.uniform(0.8, 1.2) for _ in range(rows)]
    row_total = sum(row_weights)
    row_heights: List[float] = []
    for i in range(rows):
        if i == rows - 1:
            row_heights.append(bottom_h - sum(row_heights))
        else:
            rh = round((row_weights[i] / row_total) * bottom_h, 1)
            row_heights.append(rh)

    row_y: List[float] = []
    ry = top_h
    for rh in row_heights:
        row_y.append(ry)
        ry += rh

    for idx, name in enumerate(bottom_names):
        col = idx % cols
        row = idx // cols
        rooms.append(RoomData(
            id=ids.next("r"), name=name, room_type=_infer_room_type(name),
            x=col_x[col], y=row_y[row], width=col_widths[col], length=row_heights[row],
        ))

    return rooms


@register_template("h_layout")
def template_h_layout(params: Dict[str, Any], ids: IdGen, seed: int) -> List[RoomData]:
    rng = random.Random(seed)
    pw = params["plot_width"]
    ph = params["plot_height"]
    bedrooms = params["bedrooms"]
    bathrooms = params.get("bathrooms", max(1, bedrooms // 2))
    has_garage = params.get("has_garage", False)

    rooms: List[RoomData] = []

    bridge_h = max(8, round(ph * rng.uniform(0.15, 0.25)))
    bridge_y = round((ph - bridge_h) * rng.uniform(0.35, 0.55))

    wing_ratio = rng.uniform(0.30, 0.40)
    left_wing_w = round(pw * wing_ratio)
    right_wing_w = round(pw * wing_ratio)
    bridge_x = left_wing_w
    bridge_w = pw - left_wing_w - right_wing_w

    rooms.append(RoomData(id=ids.next("r"), name="Living Room", room_type="living", x=bridge_x, y=bridge_y, width=bridge_w, length=bridge_h))

    if bridge_y > 5:
        rooms.append(RoomData(id=ids.next("r"), name="Kitchen", room_type="kitchen", x=bridge_x, y=0, width=bridge_w, length=bridge_y))
    if bridge_y + bridge_h < ph - 5:
        rooms.append(RoomData(id=ids.next("r"), name="Dining", room_type="dining", x=bridge_x, y=bridge_y + bridge_h, width=bridge_w, length=ph - bridge_y - bridge_h))

    left_names: List[str] = []
    left_bed_count = math.ceil(bedrooms / 2)
    for i in range(1, left_bed_count + 1):
        left_names.append("Master Bedroom" if i == 1 else f"Bedroom {i}")
    left_bath_count = math.ceil(bathrooms / 2)
    for i in range(1, left_bath_count + 1):
        left_names.append("Bathroom" if i == 1 else f"Bathroom {i}")
    rng.shuffle(left_names)

    if left_names:
        lw = [rng.uniform(0.7, 1.3) for _ in left_names]
        ltw = sum(lw)
        ly = 0
        for idx, name in enumerate(left_names):
            h = ph - ly if idx == len(left_names) - 1 else round((lw[idx] / ltw) * ph)
            rooms.append(RoomData(id=ids.next("r"), name=name, room_type=_infer_room_type(name), x=0, y=ly, width=left_wing_w, length=h))
            ly += h

    right_names: List[str] = []
    remain_beds = bedrooms - left_bed_count
    for i in range(remain_beds):
        right_names.append(f"Bedroom {left_bed_count + i + 1}")
    remain_baths = bathrooms - left_bath_count
    for i in range(remain_baths):
        right_names.append(f"Bathroom {left_bath_count + i + 1}")
    if has_garage:
        right_names.append("Garage")
    if not right_names:
        right_names.append("Study")
    rng.shuffle(right_names)

    rx_pos = pw - right_wing_w
    r_w = [rng.uniform(0.7, 1.3) for _ in right_names]
    rtw = sum(r_w)
    ryy = 0
    for idx, name in enumerate(right_names):
        h = ph - ryy if idx == len(right_names) - 1 else round((r_w[idx] / rtw) * ph)
        rooms.append(RoomData(id=ids.next("r"), name=name, room_type=_infer_room_type(name), x=rx_pos, y=ryy, width=right_wing_w, length=h))
        ryy += h

    return rooms


@register_template("courtyard")
def template_courtyard(params: Dict[str, Any], ids: IdGen, seed: int) -> List[RoomData]:
    rng = random.Random(seed)
    pw = params["plot_width"]
    ph = params["plot_height"]
    bedrooms = params["bedrooms"]
    bathrooms = params.get("bathrooms", max(1, bedrooms // 2))
    has_garage = params.get("has_garage", False)

    rooms: List[RoomData] = []

    border_w_val = round(pw * rng.uniform(0.22, 0.30))
    border_h_val = round(ph * rng.uniform(0.22, 0.30))

    all_names: List[str] = ["Living Room", "Kitchen", "Dining"]
    for i in range(1, bedrooms + 1):
        all_names.append("Master Bedroom" if i == 1 else f"Bedroom {i}")
    for i in range(1, bathrooms + 1):
        all_names.append("Bathroom" if i == 1 else f"Bathroom {i}")
    if has_garage:
        all_names.append("Garage")
    rng.shuffle(all_names)

    per_side = math.ceil(len(all_names) / 4)
    top_names = all_names[:per_side]
    bottom_names = all_names[per_side:per_side * 2] if per_side * 2 <= len(all_names) else []
    left_names = all_names[per_side * 2:per_side * 3] if per_side * 3 <= len(all_names) else []
    right_names = all_names[per_side * 3:] if per_side * 4 <= len(all_names) else []

    if top_names:
        top_cw = [rng.uniform(0.8, 1.2) for _ in top_names]
        top_tot = sum(top_cw)
        tx = 0
        for idx, name in enumerate(top_names):
            w = pw - tx if idx == len(top_names) - 1 else round((top_cw[idx] / top_tot) * pw)
            rooms.append(RoomData(id=ids.next("r"), name=name, room_type=_infer_room_type(name), x=tx, y=0, width=w, length=border_h_val))
            tx += w

    if bottom_names:
        bot_cw = [rng.uniform(0.8, 1.2) for _ in bottom_names]
        bot_tot = sum(bot_cw)
        bx = 0
        for idx, name in enumerate(bottom_names):
            w = pw - bx if idx == len(bottom_names) - 1 else round((bot_cw[idx] / bot_tot) * pw)
            rooms.append(RoomData(id=ids.next("r"), name=name, room_type=_infer_room_type(name), x=bx, y=ph - border_h_val, width=w, length=border_h_val))
            bx += w

    inner_h = ph - border_h_val * 2
    if left_names and inner_h > 5:
        l_weights = [rng.uniform(0.7, 1.3) for _ in left_names]
        l_tot = sum(l_weights)
        lly = float(border_h_val)
        for idx, name in enumerate(left_names):
            h = ph - border_h_val - lly if idx == len(left_names) - 1 else round((l_weights[idx] / l_tot) * inner_h)
            rooms.append(RoomData(id=ids.next("r"), name=name, room_type=_infer_room_type(name), x=0, y=lly, width=border_w_val, length=h))
            lly += h

    if right_names and inner_h > 5:
        r_weights = [rng.uniform(0.7, 1.3) for _ in right_names]
        r_tot = sum(r_weights)
        rry = float(border_h_val)
        for idx, name in enumerate(right_names):
            h = ph - border_h_val - rry if idx == len(right_names) - 1 else round((r_weights[idx] / r_tot) * inner_h)
            rooms.append(RoomData(id=ids.next("r"), name=name, room_type=_infer_room_type(name), x=pw - border_w_val, y=rry, width=border_w_val, length=h))
            rry += h

    return rooms


@register_template("split_level")
def template_split_level(params: Dict[str, Any], ids: IdGen, seed: int) -> List[RoomData]:
    rng = random.Random(seed)
    pw = params["plot_width"]
    ph = params["plot_height"]
    bedrooms = params["bedrooms"]
    bathrooms = params.get("bathrooms", max(1, bedrooms // 2))
    has_garage = params.get("has_garage", False)

    rooms: List[RoomData] = []

    split_y = round(ph * rng.uniform(0.4, 0.6))
    split_w = round(pw * rng.uniform(0.4, 0.6))

    rooms.append(RoomData(id=ids.next("r"), name="Living Room", room_type="living", x=0, y=0, width=split_w, length=split_y))
    rooms.append(RoomData(id=ids.next("r"), name="Kitchen", room_type="kitchen", x=split_w, y=0, width=pw - split_w, length=split_y))
    rooms.append(RoomData(id=ids.next("r"), name="Dining", room_type="dining", x=0, y=split_y, width=split_w, length=ph - split_y))

    stair_w = max(6, round(pw * rng.uniform(0.05, 0.08)))
    stair_x = pw - stair_w
    rooms.append(RoomData(id=ids.next("r"), name="Staircase", room_type="staircase", x=stair_x, y=split_y, width=stair_w, length=ph - split_y))

    right_x = stair_x
    right_w_cl = stair_w

    bedrooms_per_row = max(1, bedrooms // 2 + bedrooms % 2)
    remaining_h = ph - split_y
    room_h = remaining_h / max(1, bedrooms_per_row + bathrooms)
    cx = 0.0
    cy = split_y
    for i in range(1, bedrooms + 1):
        name = "Master Bedroom" if i == 1 else f"Bedroom {i}"
        w = right_w_cl if i % 2 == 0 else (pw - right_w_cl - split_w)
        if cy >= ph:
            cy = split_y
            cx += w if cx == 0 else 0
        rooms.append(RoomData(id=ids.next("r"), name=name, room_type="bedroom", x=split_w + cx, y=cy, width=w, length=room_h))
        cy += room_h

    return rooms


VARIANT_MAP: Dict[str, List[str]] = {
    "A": ["l_shape", "h_layout"],
    "B": ["corridor", "courtyard"],
    "C": ["open_plan", "h_layout", "courtyard"],
    "D": ["split_level", "l_shape"],
    "E": ["courtyard", "open_plan"],
}


def _infer_room_type(name: str) -> str:
    nl = name.lower()
    if "bedroom" in nl or "master" in nl:
        return "bedroom"
    if "bathroom" in nl or "bath" in nl:
        return "bathroom"
    if "kitchen" in nl:
        return "kitchen"
    if "living" in nl:
        return "living"
    if "dining" in nl:
        return "dining"
    if "hallway" in nl or "corridor" in nl:
        return "hallway"
    if "garage" in nl:
        return "garage"
    if "garden" in nl or "yard" in nl:
        return "garden"
    if "stair" in nl:
        return "staircase"
    if "office" in nl or "study" in nl:
        return "office"
    if "pool" in nl:
        return "pool"
    if "storage" in nl or "utility" in nl:
        return "storage"
    return "generic"


def _compute_room_colors(rooms: List[RoomData]) -> None:
    palette = {
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
    for room in rooms:
        room.color_hex = palette.get(room.room_type, palette["generic"])


def build_walls(rooms: List[RoomData], pw: float, ph: float, ids: IdGen) -> List[WallData]:
    wall_map: Dict[str, WallData] = {}
    wid = 0

    def add(x1: float, y1: float, x2: float, y2: float, wtype: WallType = WallType.INTERIOR) -> None:
        nonlocal wid
        x1, y1, x2, y2 = round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)
        key = f"{min(x1,x2)},{min(y1,y2)}-{max(x1,x2)},{max(y1,y2)}" if x1 == x2 or y1 == y2 else f"{x1},{y1}-{x2},{y2}"
        if key not in wall_map:
            wid += 1
            wall_map[key] = WallData(
                id=f"w{wid}", x1=x1, y1=y1, x2=x2, y2=y2,
                thickness=0.5 if wtype == WallType.INTERIOR else 0.75,
                wall_type=wtype,
            )

    add(0, 0, pw, 0, WallType.EXTERIOR)
    add(pw, 0, pw, ph, WallType.EXTERIOR)
    add(pw, ph, 0, ph, WallType.EXTERIOR)
    add(0, ph, 0, 0, WallType.EXTERIOR)

    for room in rooms:
        add(room.x, room.y, room.x + room.width, room.y)
        add(room.x + room.width, room.y, room.x + room.width, room.y + room.length)
        add(room.x + room.width, room.y + room.length, room.x, room.y + room.length)
        add(room.x, room.y + room.length, room.x, room.y)

    return list(wall_map.values())


def place_doors(rooms: List[RoomData], ids: IdGen, door_width: float = 3.0) -> List[DoorData]:
    doors: List[DoorData] = []
    placed_pairs: set = set()

    for i in range(len(rooms)):
        for j in range(i + 1, len(rooms)):
            pair = (min(i, j), max(i, j))
            if pair in placed_pairs:
                continue

            a, b = rooms[i], rooms[j]
            tol = 0.5

            shared_horiz = None
            if abs(a.y + a.length - b.y) < tol:
                shared_horiz = a.y + a.length
            elif abs(b.y + b.length - a.y) < tol:
                shared_horiz = b.y + b.length

            if shared_horiz is not None:
                o_start = max(a.x, b.x)
                o_end = min(a.x + a.width, b.x + b.width)
                if o_end - o_start >= door_width + 2:
                    margin = 1
                    door_x = o_start + margin + (o_end - o_start - 2 * margin) / 2 + random.uniform(-1, 1)
                    door_x = clamp(door_x, o_start + door_width / 2 + 0.5, o_end - door_width / 2 - 0.5)
                    doors.append(DoorData(
                        id=ids.next("d"), x=round(door_x, 1), y=shared_horiz, width=door_width,
                    ))
                    placed_pairs.add(pair)
                    continue

            shared_vert = None
            if abs(a.x + a.width - b.x) < tol:
                shared_vert = a.x + a.width
            elif abs(b.x + b.width - a.x) < tol:
                shared_vert = b.x + b.width

            if shared_vert is not None:
                o_start = max(a.y, b.y)
                o_end = min(a.y + a.length, b.y + b.length)
                if o_end - o_start >= door_width + 2:
                    margin = 1
                    door_y = o_start + margin + (o_end - o_start - 2 * margin) / 2 + random.uniform(-1, 1)
                    door_y = clamp(door_y, o_start + door_width / 2 + 0.5, o_end - door_width / 2 - 0.5)
                    doors.append(DoorData(
                        id=ids.next("d"), x=shared_vert, y=round(door_y, 1), width=door_width,
                    ))
                    placed_pairs.add(pair)

    return doors


def place_windows(rooms: List[RoomData], pw: float, ph: float, ids: IdGen, win_width: float = 4.0) -> List[WindowData]:
    wins: List[WindowData] = []
    for room in rooms:
        if room.room_type in ("hallway", "staircase", "storage"):
            continue

        if room.y == 0 and room.width >= win_width + 4:
            cx = room.x + random.uniform(win_width / 2 + 1, room.width - win_width / 2 - 1)
            wins.append(WindowData(id=ids.next("w"), x=round(cx, 1), y=0, width=win_width))
        if abs(room.y + room.length - ph) < 0.5 and room.width >= win_width + 4:
            cx = room.x + random.uniform(win_width / 2 + 1, room.width - win_width / 2 - 1)
            wins.append(WindowData(id=ids.next("w"), x=round(cx, 1), y=ph, width=win_width))
        if room.x == 0 and room.length >= win_width + 4:
            cy = room.y + random.uniform(win_width / 2 + 1, room.length - win_width / 2 - 1)
            wins.append(WindowData(id=ids.next("w"), x=0, y=round(cy, 1), width=win_width))
        if abs(room.x + room.width - pw) < 0.5 and room.length >= win_width + 4:
            cy = room.y + random.uniform(win_width / 2 + 1, room.length - win_width / 2 - 1)
            wins.append(WindowData(id=ids.next("w"), x=pw, y=round(cy, 1), width=win_width))

    return wins


def generate_stairs(rooms: List[RoomData], floor_count: int, ids: IdGen) -> List[StairData]:
    stairs: List[StairData] = []
    if floor_count <= 1:
        return stairs

    candidate = [r for r in rooms if r.room_type == "hallway" or r.room_type == "staircase"]
    if not candidate:
        candidate = rooms

    for r in candidate:
        stair_w = min(4, r.width * 0.5)
        stair_l = min(10, r.length * 0.5)
        if stair_w >= 3 and stair_l >= 6:
            stairs.append(StairData(
                id=ids.next("s"), x=r.x + r.width / 2, y=r.y + r.length / 2,
                width=stair_w, length=stair_l, run_count=12, stair_type=StairType.STRAIGHT,
            ))
            break

    return stairs


def clamp_rooms(rooms: List[RoomData], pw: float, ph: float) -> List[RoomData]:
    return [
        RoomData(
            id=r.id, name=r.name, room_type=r.room_type,
            x=clamp(r.x, 0, pw - 3),
            y=clamp(r.y, 0, ph - 3),
            width=clamp(r.width, 3, pw - r.x),
            length=clamp(r.length, 3, ph - r.y),
            level=r.level, height_ft=r.height_ft,
            is_habitable=r.is_habitable, color_hex=r.color_hex,
            area_sqft=r.width * r.length,
        )
        for r in rooms
    ]


def generate_blueprint(
    plot_width: float,
    plot_length: float,
    bedrooms: int = 3,
    bathrooms: int = 2,
    floors: int = 1,
    building_type: str = "residential",
    style: str = "modern",
    has_garage: bool = False,
    has_garden: bool = False,
    has_pool: bool = False,
    variant: Optional[str] = None,
    seed: Optional[int] = None,
) -> BlueprintSchema:
    if seed is None:
        seed = random.randint(1, 2 ** 31)

    rng = random.Random(seed)

    pw_val = max(20, plot_width)
    ph_val = max(20, plot_length)

    params: Dict[str, Any] = {
        "plot_width": pw_val,
        "plot_height": ph_val,
        "plot_length": ph_val,
        "bedrooms": max(1, bedrooms),
        "bathrooms": max(1, bathrooms),
        "floors": max(1, floors),
        "has_garage": has_garage,
        "has_garden": has_garden,
        "has_pool": has_pool,
        "building_type": building_type,
        "style": style,
    }

    ids = IdGen()
    pw = params["plot_width"]
    ph = params["plot_length"]

    if variant and variant in VARIANT_MAP:
        template_pool = VARIANT_MAP[variant]
    else:
        template_pool = list(TEMPLATE_REGISTRY.keys())
        rng.shuffle(template_pool)

    template_name = rng.choice(template_pool) if template_pool else "l_shape"
    generator = TEMPLATE_REGISTRY.get(template_name, template_l_shape)

    rooms = generator(params, ids, rng.randint(0, 2 ** 31))
    rooms = clamp_rooms(rooms, pw, ph)
    _compute_room_colors(rooms)

    walls = build_walls(rooms, pw, ph, ids)
    doors = place_doors(rooms, ids)
    windows = place_windows(rooms, pw, ph, ids)
    stairs = generate_stairs(rooms, floors, ids)

    roof_style_map = {
        "modern": RoofType.FLAT,
        "minimalist": RoofType.SHED,
        "industrial": RoofType.FLAT,
        "contemporary": RoofType.GABLE,
        "traditional": RoofType.HIP,
        "mediterranean": RoofType.DOME,
        "victorian": RoofType.MANSARD,
    }

    bt = params["building_type"]
    st = params["style"]

    total_area = sum(r.width * r.length for r in rooms)

    blueprint = BlueprintSchema(
        project=ProjectInfo(
            building_type=_parse_building_type(bt),
            style=_parse_style(st),
        ),
        plot=PlotInfo(width=plot_width, length=plot_length),
        floors=[FloorInfo(level=i, name=f"Floor {i+1}") for i in range(floors)],
        rooms=rooms,
        walls=walls,
        doors=doors,
        windows=windows,
        stairs=stairs,
        roof=RoofData(
            roof_type=roof_style_map.get(st, RoofType.FLAT),
            pitch=15.0 if st in ("traditional", "victorian") else 0.0,
        ),
        measurements=MeasurementInfo(
            total_area_sqft=plot_width * plot_length,
            footprint_sqft=total_area,
            door_count=len(doors),
            window_count=len(windows),
        ),
        metadata=BlueprintMetadata(
            variant=variant or template_name,
            seed=seed,
        ),
    )

    return blueprint


def _parse_building_type(bt: str) -> BuildingType:
    mapping = {
        "villa": BuildingType.VILLA,
        "house": BuildingType.RESIDENTIAL,
        "residential": BuildingType.RESIDENTIAL,
        "apartment": BuildingType.APARTMENT,
        "commercial": BuildingType.COMMERCIAL,
        "office": BuildingType.OFFICE,
        "shop": BuildingType.SHOP,
        "industrial": BuildingType.INDUSTRIAL,
        "mixed": BuildingType.MIXED_USE,
    }
    return mapping.get(bt.lower(), BuildingType.RESIDENTIAL)


def _parse_style(st: str) -> ArchitecturalStyle:
    mapping = {
        "modern": ArchitecturalStyle.MODERN,
        "minimalist": ArchitecturalStyle.MINIMALIST,
        "industrial": ArchitecturalStyle.INDUSTRIAL,
        "contemporary": ArchitecturalStyle.CONTEMPORARY,
        "traditional": ArchitecturalStyle.TRADITIONAL,
        "mediterranean": ArchitecturalStyle.MEDITERRANEAN,
        "victorian": ArchitecturalStyle.VICTORIAN,
    }
    return mapping.get(st.lower(), ArchitecturalStyle.MODERN)
