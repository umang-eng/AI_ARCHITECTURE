import json
import os
import sys
import glob


def validate_json(line: str) -> dict | None:
    try:
        return json.loads(line)
    except json.JSONDecodeError:
        return None


def validate_blueprint(blueprint: dict) -> list[str]:
    errors = []

    if "plot" not in blueprint:
        errors.append("Missing 'plot'")
    else:
        plot = blueprint["plot"]
        if "width" not in plot or "height" not in plot:
            errors.append("Plot missing width/height")
        elif plot["width"] <= 0 or plot["height"] <= 0:
            errors.append("Invalid plot dimensions")

    if "rooms" not in blueprint:
        errors.append("Missing 'rooms'")
    elif not isinstance(blueprint["rooms"], list):
        errors.append("'rooms' is not a list")
    elif len(blueprint["rooms"]) == 0:
        errors.append("No rooms")
    else:
        for room in blueprint["rooms"]:
            if "x" not in room or "y" not in room:
                errors.append(f"Room missing x/y: {room.get('name', 'unknown')}")
            if "width" not in room or "height" not in room:
                errors.append(f"Room missing width/height: {room.get('name', 'unknown')}")
            elif room["width"] <= 0 or room["height"] <= 0:
                errors.append(f"Invalid room dimensions: {room.get('name', 'unknown')}")

            plot = blueprint.get("plot", {})
            if room.get("x", 0) + room.get("width", 0) > plot.get("width", float("inf")):
                errors.append(f"Room '{room.get('name', 'unknown')}' extends beyond plot width")
            if room.get("y", 0) + room.get("height", 0) > plot.get("height", float("inf")):
                errors.append(f"Room '{room.get('name', 'unknown')}' extends beyond plot height")

        rooms = blueprint["rooms"]
        for i in range(len(rooms)):
            for j in range(i + 1, len(rooms)):
                a, b = rooms[i], rooms[j]
                overlap_x = a["x"] < b["x"] + b["width"] and a["x"] + a["width"] > b["x"]
                overlap_y = a["y"] < b["y"] + b["height"] and a["y"] + a["height"] > b["y"]
                if overlap_x and overlap_y:
                    errors.append(f"Overlap: {a.get('name', 'unknown')} and {b.get('name', 'unknown')}")

    return errors


def validate_file(filepath: str) -> dict:
    stats = {"total": 0, "valid": 0, "invalid": 0, "errors": []}

    with open(filepath, "r") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue

            stats["total"] += 1

            sample = validate_json(line)
            if not sample:
                stats["invalid"] += 1
                stats["errors"].append(f"Line {line_num}: Invalid JSON")
                continue

            blueprint_str = sample.get("output", "")
            try:
                blueprint = json.loads(blueprint_str) if isinstance(blueprint_str, str) else blueprint_str
            except json.JSONDecodeError:
                stats["invalid"] += 1
                stats["errors"].append(f"Line {line_num}: Invalid blueprint JSON")
                continue

            errors = validate_blueprint(blueprint)
            if errors:
                stats["invalid"] += 1
                for err in errors[:3]:
                    stats["errors"].append(f"Line {line_num}: {err}")
            else:
                stats["valid"] += 1

    return stats


def main():
    dataset_dir = os.path.join(os.path.dirname(__file__), "../dataset")
    files = glob.glob(os.path.join(dataset_dir, "**/*.jsonl"), recursive=True)

    if not files:
        print("No JSONL files found")
        sys.exit(1)

    total_stats = {"total": 0, "valid": 0, "invalid": 0, "errors": []}

    for filepath in files:
        rel_path = os.path.relpath(filepath, dataset_dir)
        print(f"Validating: {rel_path}")
        stats = validate_file(filepath)

        total_stats["total"] += stats["total"]
        total_stats["valid"] += stats["valid"]
        total_stats["invalid"] += stats["invalid"]
        total_stats["errors"].extend(stats["errors"])

        print(f"  Valid: {stats['valid']}, Invalid: {stats['invalid']}")

    print(f"\n{'='*50}")
    print(f"Total: {total_stats['total']}")
    print(f"Valid: {total_stats['valid']}")
    print(f"Invalid: {total_stats['invalid']}")
    print(f"Accuracy: {total_stats['valid']/max(1,total_stats['total'])*100:.1f}%")

    if total_stats["errors"]:
        print(f"\nFirst 10 errors:")
        for err in total_stats["errors"][:10]:
            print(f"  - {err}")


if __name__ == "__main__":
    main()
