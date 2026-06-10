import json
import os
import glob
from collections import Counter


def analyze_file(filepath: str) -> dict:
    stats = {
        "total": 0,
        "room_counts": [],
        "bedroom_counts": [],
        "bathroom_counts": [],
        "plot_widths": [],
        "plot_heights": [],
        "instructions": [],
    }

    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            try:
                sample = json.loads(line)
            except json.JSONDecodeError:
                continue

            stats["total"] += 1

            instruction = sample.get("instruction", "")
            stats["instructions"].append(instruction)

            output = sample.get("output", "")
            try:
                blueprint = json.loads(output) if isinstance(output, str) else output
            except json.JSONDecodeError:
                continue

            rooms = blueprint.get("rooms", [])
            stats["room_counts"].append(len(rooms))

            bedroom_count = sum(1 for r in rooms if "bedroom" in r.get("name", "").lower())
            bathroom_count = sum(1 for r in rooms if "bathroom" in r.get("name", "").lower())
            stats["bedroom_counts"].append(bedroom_count)
            stats["bathroom_counts"].append(bathroom_count)

            plot = blueprint.get("plot", {})
            stats["plot_widths"].append(plot.get("width", 0))
            stats["plot_heights"].append(plot.get("height", 0))

    return stats


def main():
    dataset_dir = os.path.join(os.path.dirname(__file__), "../dataset")
    files = glob.glob(os.path.join(dataset_dir, "**/*.jsonl"), recursive=True)

    if not files:
        print("No JSONL files found")
        return

    total_stats = {
        "total": 0,
        "room_counts": [],
        "bedroom_counts": [],
        "bathroom_counts": [],
        "plot_widths": [],
        "plot_heights": [],
        "instructions": [],
    }

    for filepath in files:
        rel_path = os.path.relpath(filepath, dataset_dir)
        stats = analyze_file(filepath)
        total_stats["total"] += stats["total"]
        total_stats["room_counts"].extend(stats["room_counts"])
        total_stats["bedroom_counts"].extend(stats["bedroom_counts"])
        total_stats["bathroom_counts"].extend(stats["bathroom_counts"])
        total_stats["plot_widths"].extend(stats["plot_widths"])
        total_stats["plot_heights"].extend(stats["plot_heights"])
        total_stats["instructions"].extend(stats["instructions"])

    print("=" * 50)
    print("DATASET STATISTICS")
    print("=" * 50)

    print(f"\nTotal Samples: {total_stats['total']}")

    if total_stats["room_counts"]:
        avg_rooms = sum(total_stats["room_counts"]) / len(total_stats["room_counts"])
        print(f"\nAverage Rooms: {avg_rooms:.1f}")

    if total_stats["bedroom_counts"]:
        bedroom_dist = Counter(total_stats["bedroom_counts"])
        print("\nBedroom Distribution:")
        for count in sorted(bedroom_dist.keys()):
            pct = bedroom_dist[count] / len(total_stats["bedroom_counts"]) * 100
            print(f"  {count} bedrooms: {bedroom_dist[count]} ({pct:.1f}%)")

    if total_stats["bathroom_counts"]:
        bathroom_dist = Counter(total_stats["bathroom_counts"])
        print("\nBathroom Distribution:")
        for count in sorted(bathroom_dist.keys()):
            pct = bathroom_dist[count] / len(total_stats["bathroom_counts"]) * 100
            print(f"  {count} bathrooms: {bathroom_dist[count]} ({pct:.1f}%)")

    if total_stats["plot_widths"]:
        avg_w = sum(total_stats["plot_widths"]) / len(total_stats["plot_widths"])
        avg_h = sum(total_stats["plot_heights"]) / len(total_stats["plot_heights"])
        min_w = min(total_stats["plot_widths"])
        max_w = max(total_stats["plot_widths"])
        min_h = min(total_stats["plot_heights"])
        max_h = max(total_stats["plot_heights"])
        print(f"\nPlot Sizes:")
        print(f"  Width:  {min_w} - {max_w} (avg {avg_w:.0f})")
        print(f"  Height: {min_h} - {max_h} (avg {avg_h:.0f})")

    if total_stats["instructions"]:
        keywords = []
        for inst in total_stats["instructions"]:
            lower = inst.lower()
            for word in ["villa", "house", "duplex", "apartment", "office", "modern", "traditional", "minimalist", "industrial"]:
                if word in lower:
                    keywords.append(word)
        keyword_dist = Counter(keywords)
        print("\nKeyword Distribution:")
        for word, count in keyword_dist.most_common(15):
            print(f"  {word}: {count}")

    print("\n" + "=" * 50)


if __name__ == "__main__":
    main()
