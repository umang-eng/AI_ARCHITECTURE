import json
import os
import glob

RAW_DIR = os.path.join(os.path.dirname(__file__), "../dataset/raw")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "../dataset/processed")
TRAIN_DIR = os.path.join(os.path.dirname(__file__), "../dataset/train")
VAL_DIR = os.path.join(os.path.dirname(__file__), "../dataset/validation")
TEST_DIR = os.path.join(os.path.dirname(__file__), "../dataset/test")


def convert_sample(blueprint: dict) -> dict:
    rooms = blueprint.get("rooms", [])
    room_count = len(rooms)
    bedroom_count = sum(1 for r in rooms if "bedroom" in r.get("name", "").lower())
    bathroom_count = sum(1 for r in rooms if "bathroom" in r.get("name", "").lower())

    plot = blueprint.get("plot", {})
    plot_width = plot.get("width", 0)
    plot_height = plot.get("height", 0)

    instruction = f"Generate a floor plan on a {plot_width}x{plot_height} plot with {bedroom_count} bedrooms and {bathroom_count} bathrooms"

    return {
        "instruction": instruction,
        "input": "",
        "output": json.dumps(blueprint),
    }


def process_file(filepath: str) -> list:
    samples = []
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                blueprint = entry.get("output") or entry.get("blueprint")
                if blueprint:
                    samples.append(convert_sample(blueprint))
            except json.JSONDecodeError:
                continue
    return samples


def split_data(samples: list):
    total = len(samples)
    train_end = int(total * 0.8)
    val_end = int(total * 0.9)

    return samples[:train_end], samples[train_end:val_end], samples[val_end:]


def write_jsonl(samples: list, filepath: str):
    with open(filepath, "w") as f:
        for sample in samples:
            f.write(json.dumps(sample) + "\n")


def main():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    os.makedirs(TRAIN_DIR, exist_ok=True)
    os.makedirs(VAL_DIR, exist_ok=True)
    os.makedirs(TEST_DIR, exist_ok=True)

    all_samples = []

    raw_files = glob.glob(os.path.join(RAW_DIR, "*.jsonl"))
    if not raw_files:
        dataset_dir = os.path.join(os.path.dirname(__file__), "../dataset")
        raw_files = glob.glob(os.path.join(dataset_dir, "batch-*.jsonl"))

    for filepath in raw_files:
        print(f"Processing: {os.path.basename(filepath)}")
        samples = process_file(filepath)
        all_samples.extend(samples)

    print(f"Total samples: {len(all_samples)}")

    write_jsonl(all_samples, os.path.join(PROCESSED_DIR, "all.jsonl"))

    train, val, test = split_data(all_samples)

    write_jsonl(train, os.path.join(TRAIN_DIR, "train.jsonl"))
    write_jsonl(val, os.path.join(VAL_DIR, "val.jsonl"))
    write_jsonl(test, os.path.join(TEST_DIR, "test.jsonl"))

    metadata = {
        "total": len(all_samples),
        "train": len(train),
        "validation": len(val),
        "test": len(test),
    }

    with open(os.path.join(os.path.dirname(__file__), "../dataset/metadata/split.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Train: {len(train)}")
    print(f"Validation: {len(val)}")
    print(f"Test: {len(test)}")
    print("Done!")


if __name__ == "__main__":
    main()
