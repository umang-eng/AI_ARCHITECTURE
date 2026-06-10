import json
import os


def convert_to_chat_format(sample: dict) -> dict:
    instruction = sample.get("instruction", "")
    output = sample.get("output", "")

    return {
        "messages": [
            {
                "role": "user",
                "content": instruction,
            },
            {
                "role": "assistant",
                "content": output if isinstance(output, str) else json.dumps(output),
            },
        ]
    }


def convert_file(input_path: str, output_path: str):
    count = 0
    with open(input_path, "r") as fin, open(output_path, "w") as fout:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            try:
                sample = json.loads(line)
                chat_sample = convert_to_chat_format(sample)
                fout.write(json.dumps(chat_sample) + "\n")
                count += 1
            except json.JSONDecodeError:
                continue
    return count


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    v1_dir = os.path.join(script_dir, "../../dataset_v1")
    output_dir = os.path.join(script_dir, "../dataset")

    os.makedirs(output_dir, exist_ok=True)

    splits = [
        ("train/train.jsonl", "train.jsonl"),
        ("validation/val.jsonl", "validation.jsonl"),
        ("test/test.jsonl", "test.jsonl"),
    ]

    for input_rel, output_name in splits:
        input_path = os.path.join(v1_dir, input_rel)
        output_path = os.path.join(output_dir, output_name)

        if not os.path.exists(input_path):
            print(f"Skipping {input_rel} (not found at {input_path})")
            continue

        count = convert_file(input_path, output_path)
        print(f"{output_name}: {count} samples")


if __name__ == "__main__":
    main()
