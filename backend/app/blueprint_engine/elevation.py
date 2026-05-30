"""Elevation Data Generator.

Generates front, rear, left, and right elevation data from a BlueprintSchema.
The elevation data is used by SVG renderers on the frontend to draw
architectural elevations.
"""
from __future__ import annotations

import math
from typing import Any, Dict, List, Optional

from app.blueprint_engine.schemas import (
    BlueprintSchema,
    ElevationData,
    ElevationFace,
    RoomData,
    RoofType,
)


def generate_elevations(blueprint: BlueprintSchema) -> ElevationData:
    rooms = blueprint.rooms
    floors = blueprint.floors
    floor_count = max(1, len(floors))
    plot_w = blueprint.plot.width
    plot_l = blueprint.plot.length
    roof = blueprint.roof
    style = str(blueprint.project.style.value)

    total_height = _compute_building_height(rooms, floor_count)

    front_windows = _collect_windows_for_face(rooms, "front", plot_l)
    front_doors = _collect_doors_for_face(rooms, "front", plot_l)
    rear_windows = _collect_windows_for_face(rooms, "rear", plot_l)
    rear_doors = _collect_doors_for_face(rooms, "rear", plot_l)
    left_windows = _collect_windows_for_face(rooms, "left", plot_w)
    left_doors = _collect_doors_for_face(rooms, "left", plot_w)
    right_windows = _collect_windows_for_face(rooms, "right", plot_w)
    right_doors = _collect_doors_for_face(rooms, "right", plot_w)

    floor_height = total_height / floor_count if floor_count > 0 else 10

    def _make_face(
        face: str,
        face_width: float,
        wins: List[dict],
        drs: List[dict],
    ) -> ElevationFace:
        return ElevationFace(
            face=face,
            total_height_ft=total_height,
            floor_count=floor_count,
            floor_heights=[floor_height] * floor_count,
            windows=wins,
            doors=drs,
            roof_shape_svg=_get_roof_svg_shape(roof.roof_type, face_width, roof.height_ft, roof.pitch),
            balcony_positions=_get_balcony_positions(rooms, face, plot_w, plot_l),
        )

    return ElevationData(
        front=_make_face("front", plot_w, front_windows, front_doors),
        rear=_make_face("rear", plot_w, rear_windows, rear_doors),
        left=_make_face("left", plot_l, left_windows, left_doors),
        right=_make_face("right", plot_l, right_windows, right_doors),
    )


def _compute_building_height(rooms: List[RoomData], floor_count: int) -> float:
    if rooms:
        avg_height = sum(r.height_ft for r in rooms) / len(rooms)
        return avg_height * floor_count
    return 10 * floor_count


def _collect_windows_for_face(
    rooms: List[RoomData], face: str, face_length: float
) -> List[Dict[str, Any]]:
    wins: List[Dict[str, Any]] = []
    tolerance = 1.0
    y_levels = _get_face_y_coordinates(rooms, face)

    for room in rooms:
        if room.room_type in ("hallway", "storage", "staircase"):
            continue
        room_on_face = _is_room_on_face(room, face, face_length, tolerance)
        if room_on_face:
            if face in ("front", "rear"):
                win_count = max(1, int(room.width / 8))
                for wi in range(win_count):
                    wins.append({
                        "x": room.x + (room.width / (win_count + 1)) * (wi + 1),
                        "width": min(4, room.width / win_count * 0.6),
                        "height": 4,
                        "sill_height": 3,
                        "level": room.level,
                    })
            else:
                win_count = max(1, int(room.length / 8))
                for wi in range(win_count):
                    wins.append({
                        "x": room.y + (room.length / (win_count + 1)) * (wi + 1),
                        "width": min(4, room.length / win_count * 0.6),
                        "height": 4,
                        "sill_height": 3,
                        "level": room.level,
                    })

    return wins


def _collect_doors_for_face(
    rooms: List[RoomData], face: str, face_length: float
) -> List[Dict[str, Any]]:
    doors: List[Dict[str, Any]] = []
    tolerance = 1.0

    for room in rooms:
        room_on_face = _is_room_on_face(room, face, face_length, tolerance)
        if room_on_face and room.room_type not in ("hallway", "staircase", "storage"):
            if face in ("front", "rear"):
                if room.room_type == "living":
                    doors.append({
                        "x": room.x + room.width / 2,
                        "width": 4,
                        "height": 7,
                        "is_main": True,
                        "level": room.level,
                    })
            else:
                if room.room_type in ("garage",):
                    doors.append({
                        "x": room.y + room.length / 2,
                        "width": 8,
                        "height": 7,
                        "is_main": False,
                        "level": room.level,
                    })

    return doors


def _is_room_on_face(room: RoomData, face: str, face_length: float, tolerance: float = 0.5) -> bool:
    if face == "front":
        return room.y <= tolerance
    elif face == "rear":
        return abs(room.y + room.length - face_length) <= tolerance
    elif face == "left":
        return room.x <= tolerance
    elif face == "right":
        return abs(room.x + room.width - face_length) <= tolerance
    return False


def _get_face_y_coordinates(rooms: List[RoomData], face: str) -> List[float]:
    ys: set = set()
    for r in rooms:
        ys.add(r.y)
        ys.add(r.y + r.length)
    return sorted(ys)


def _get_roof_svg_shape(roof_type: RoofType, width: float, height: float, pitch: float) -> str:
    if roof_type == RoofType.FLAT:
        return f"M0,0 L{width},0 L{width},{height} L0,{height} Z"
    elif roof_type == RoofType.GABLE:
        mid = width / 2
        ridge = height + 12
        return f"M0,{height} L{mid},0 L{width},{height} Z"
    elif roof_type == RoofType.SHED:
        return f"M0,{height} L{width},{height - 8} L{width},{height} Z"
    elif roof_type == RoofType.HIP:
        mid = width / 2
        ridge = height + 10
        inset = width * 0.15
        return f"M0,{height} L{inset},{height} L{mid},0 L{width - inset},{height} L{width},{height} Z"
    elif roof_type == RoofType.DOME:
        mid_x = width / 2
        r = max(width, height * 2) / 2
        return f"M0,{height} Q{mid_x},{height - r * 2} {width},{height} Z"
    elif roof_type == RoofType.MANSARD:
        inset = width * 0.1
        mid = width / 2
        ridge_h = height + 14
        return f"M0,{height} L{inset},{height - 6} L{mid},{ridge_h - 10} L{width - inset},{height - 6} L{width},{height} Z"
    return f"M0,{height} L{width},{height}"


def _get_balcony_positions(
    rooms: List[RoomData], face: str, plot_w: float, plot_l: float
) -> List[Dict[str, float]]:
    balconies: List[Dict[str, float]] = []
    for room in rooms:
        if room.room_type == "bedroom" and room.level > 0:
            if face == "front" and room.y <= 0.5:
                balconies.append({
                    "x": room.x + 2,
                    "width": room.width - 4,
                    "level": room.level,
                    "depth": 4,
                })
            elif face == "rear" and abs(room.y + room.length - plot_l) <= 0.5:
                balconies.append({
                    "x": room.x + 2,
                    "width": room.width - 4,
                    "level": room.level,
                    "depth": 4,
                })
    return balconies
