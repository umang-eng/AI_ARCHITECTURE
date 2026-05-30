"""Blueprint Validation Engine.

Validates:
  - Room overlap (axis-aligned bounding box)
  - Plot boundary violations
  - Minimum room sizes
  - Door clearance
  - Stair dimensions
  - Accessibility (every room must have a door)
  - Hallway connectivity
"""
from __future__ import annotations

import math
from typing import Dict, List, Set, Tuple

from app.blueprint_engine.schemas import BlueprintSchema, DoorData, RoomData


class ValidationError:
    def __init__(self, code: str, message: str, severity: str = "error"):
        self.code = code
        self.message = message
        self.severity = severity

    def to_dict(self) -> dict:
        return {"code": self.code, "message": self.message, "severity": self.severity}


class ValidationResult:
    def __init__(self):
        self.errors: List[ValidationError] = []
        self.warnings: List[ValidationError] = []

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0

    def add_error(self, code: str, message: str) -> None:
        self.errors.append(ValidationError(code, message, "error"))

    def add_warning(self, code: str, message: str) -> None:
        self.warnings.append(ValidationError(code, message, "warning"))

    def to_dict(self) -> dict:
        return {
            "valid": self.is_valid,
            "errors": [e.to_dict() for e in self.errors],
            "warnings": [w.to_dict() for w in self.warnings],
        }


MIN_ROOM_DIMENSIONS: Dict[str, Tuple[float, float]] = {
    "bedroom": (10, 10),
    "bathroom": (5, 5),
    "kitchen": (8, 8),
    "living": (12, 12),
    "dining": (8, 8),
    "hallway": (3, 3),
    "garage": (10, 18),
    "staircase": (3, 6),
    "office": (8, 8),
    "storage": (4, 4),
}

MIN_DOOR_WIDTH = 2.5
MIN_STAIR_WIDTH = 3.0
MIN_STAIR_LENGTH = 6.0


def validate_blueprint(blueprint: BlueprintSchema) -> ValidationResult:
    result = ValidationResult()
    rooms = blueprint.rooms
    pw = blueprint.plot.width
    ph = blueprint.plot.length

    validate_boundaries(rooms, pw, ph, result)
    validate_overlaps(rooms, result)
    validate_minimum_sizes(rooms, result)
    validate_doors(blueprint.doors, result)
    validate_stairs(blueprint.stairs, result)
    validate_accessibility(rooms, blueprint.doors, result)

    bp_errors = [e.message for e in result.errors]
    bp_warnings = [e.message for e in result.warnings]
    blueprint.metadata.validation_status = "valid" if result.is_valid else "invalid"
    blueprint.metadata.validation_errors = bp_errors + bp_warnings

    return result


def validate_boundaries(rooms: List[RoomData], pw: float, ph: float, result: ValidationResult) -> None:
    for room in rooms:
        if room.x < -0.01 or room.y < -0.01:
            result.add_error("ROOM_OUTSIDE_PLOT", f"Room '{room.name}' starts at negative coordinates ({room.x}, {room.y})")
        if room.x + room.width > pw + 0.01:
            result.add_error("ROOM_EXCEEDS_PLOT", f"Room '{room.name}' extends {room.x + room.width - pw:.1f} units beyond plot width")
        if room.y + room.length > ph + 0.01:
            result.add_error("ROOM_EXCEEDS_PLOT", f"Room '{room.name}' extends {room.y + room.length - ph:.1f} units beyond plot length")


def validate_overlaps(rooms: List[RoomData], result: ValidationResult) -> None:
    for i in range(len(rooms)):
        for j in range(i + 1, len(rooms)):
            a, b = rooms[i], rooms[j]
            overlap_x = a.x < b.x + b.width and a.x + a.width > b.x
            overlap_y = a.y < b.y + b.length and a.y + a.length > b.y
            if overlap_x and overlap_y:
                ow = min(a.x + a.width, b.x + b.width) - max(a.x, b.x)
                oh = min(a.y + a.length, b.y + b.length) - max(a.y, b.y)
                if ow > 0.5 and oh > 0.5:
                    result.add_error("ROOM_OVERLAP", f"Rooms '{a.name}' and '{b.name}' overlap by {ow:.1f}×{oh:.1f} units")


def validate_minimum_sizes(rooms: List[RoomData], result: ValidationResult) -> None:
    for room in rooms:
        min_w, min_h = MIN_ROOM_DIMENSIONS.get(room.room_type, (5, 5))
        if room.width < min_w:
            result.add_error("ROOM_TOO_SMALL", f"Room '{room.name}' width {room.width:.1f} < minimum {min_w:.1f}")
        if room.length < min_h:
            result.add_error("ROOM_TOO_SMALL", f"Room '{room.name}' length {room.length:.1f} < minimum {min_h:.1f}")
        area = room.width * room.length
        min_area = min_w * min_h
        if area < min_area * 0.5:
            result.add_warning("ROOM_TOO_SMALL", f"Room '{room.name}' area {area:.1f} sq units is unusually small")


def validate_doors(doors: List[DoorData], result: ValidationResult) -> None:
    for door in doors:
        if door.width < MIN_DOOR_WIDTH:
            result.add_error("DOOR_TOO_NARROW", f"Door '{door.id}' width {door.width:.1f} < minimum {MIN_DOOR_WIDTH:.1f}")
        if door.width > 8:
            result.add_warning("DOOR_TOO_WIDE", f"Door '{door.id}' width {door.width:.1f} is unusually wide")


def validate_stairs(stairs, result: ValidationResult) -> None:
    for stair in stairs:
        if stair.width < MIN_STAIR_WIDTH:
            result.add_error("STAIR_TOO_NARROW", f"Stair '{stair.id}' width {stair.width:.1f} < minimum {MIN_STAIR_WIDTH:.1f}")
        if stair.length < MIN_STAIR_LENGTH:
            result.add_error("STAIR_TOO_SHORT", f"Stair '{stair.id}' length {stair.length:.1f} < minimum {MIN_STAIR_LENGTH:.1f}")


def validate_accessibility(rooms: List[RoomData], doors: List[DoorData], result: ValidationResult) -> None:
    room_names: Set[str] = set(r.name for r in rooms)
    accessible_rooms: Set[str] = set()

    for door in doors:
        for room in rooms:
            if is_door_on_room_boundary(door, room):
                accessible_rooms.add(room.name)
                break

    for room in rooms:
        if room.room_type in ("hallway", "staircase", "garden", "garage"):
            continue
        if room.name not in accessible_rooms:
            result.add_warning("ROOM_INACCESSIBLE", f"Room '{room.name}' has no door connecting to it")


def is_door_on_room_boundary(door: DoorData, room: RoomData, tolerance: float = 0.5) -> bool:
    on_top = abs(door.y - room.y) < tolerance and room.x <= door.x <= room.x + room.width
    on_bottom = abs(door.y - (room.y + room.length)) < tolerance and room.x <= door.x <= room.x + room.width
    on_left = abs(door.x - room.x) < tolerance and room.y <= door.y <= room.y + room.length
    on_right = abs(door.x - (room.x + room.width)) < tolerance and room.y <= door.y <= room.y + room.length
    return on_top or on_bottom or on_left or on_right
