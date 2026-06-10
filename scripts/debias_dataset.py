import json
import os
import glob
from collections import Counter


def extract_building_type(sample: dict) -> str:
    instruction = sample.get("instruction", "").lower()
    for btype in ["villa", "house", "duplex", "apartment", "office", "commercial"]:
        if btype in instruction:
            return btype

    output = sample.get("output", "")
    try:
        blueprint = json.loads(output) if isinstance(output, str) else output
    except (json.JSONDecodeError, TypeError):
        return "unknown"

    rooms = blueprint.get("rooms", [])
    room_names = [r.get("name", "").lower() for r in rooms]

    has_garage = any("garage" in n for n in room_names)
    has_reception = any("reception" in n for n in room_names)
    bedroom_count = sum(1 for n in room_names if "bedroom" in n)

    if has_reception:
        return "office"
    if has_garage and bedroom_count >= 3:
        return "villa"
    if bedroom_count <= 2:
        return "apartment"
    if bedroom_count >= 4:
        return "house"
    return "house"


def load_samples(filepath: str) -> list:
    samples = []
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                samples.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return samples


def balance_dataset(samples: list) -> list:
    by_type = {}
    for sample in samples:
        btype = extract_building_type(sample)
        if btype not in by_type:
            by_type[btype] = []
        by_type[btype].append(sample)

    target_count = min(len(v) for v in by_type.values())

    balanced = []
    for btype, type_samples in by_type.items():
        if len(type_samples) > target_count:
            balanced.extend(type_samples[:target_count])
        else:
            balanced.extend(type_samples)

    return balanced


def main():
    dataset_dir = os.path.join(os.path.dirname(__file__), "../dataset")
    files = glob.glob(os.path.join(dataset_dir, "processed/all.jsonl"))

    if not files:
        print("No processed dataset found")
        return

    samples = load_samples(files[0])
    print(f"Original: {len(samples)} samples")

    before_dist = Counter(extract_building_type(s) for s in samples)
    print("\nBefore balancing:")
    for btype, count in sorted(before_dist.items()):
        pct = count / len(samples) * 100
        print(f"  {btype}: {count} ({pct:.1f}%)")

    balanced = balance_dataset(samples)
    print(f"\nBalanced: {len(balanced)} samples")

    after_dist = Counter(extract_building_type(s) for s in balanced)
    print("\nAfter balancing:")
    for btype, count in sorted(after_dist.items()):
        pct = count / len(balanced) * 100
        print(f"  {btype}: {count} ({pct:.1f}%)")

    output_path = os.path.join(dataset_dir, "processed/balanced.jsonl")
    with open(output_path, "w") as f:
        for sample in balanced:
            f.write(json.dumps(sample) + "\n")

    print(f"\nSaved to: {output_path}")


if __name__ == "__main__":
    main()
