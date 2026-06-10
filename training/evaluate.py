import os
import json
import yaml
import torch
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import PeftModel


def load_config(config_path: str) -> dict:
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def evaluate(model, tokenizer, dataset, max_length=2048):
    results = []
    correct = 0
    total = 0

    for sample in dataset:
        messages = sample["messages"]
        user_msg = messages[0]["content"]
        expected = messages[1]["content"]

        input_text = tokenizer.apply_chat_template(
            [{"role": "user", "content": user_msg}],
            tokenize=False,
            add_generation_prompt=True,
        )

        inputs = tokenizer(input_text, return_tensors="pt").to(model.device)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_length,
                temperature=0.1,
                do_sample=False,
            )

        generated = tokenizer.decode(outputs[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)

        try:
            gen_json = json.loads(generated)
            exp_json = json.loads(expected)
            rooms_match = len(gen_json.get("rooms", [])) == len(exp_json.get("rooms", []))
            if rooms_match:
                correct += 1
        except (json.JSONDecodeError, TypeError):
            pass

        total += 1
        results.append({
            "input": user_msg,
            "expected": expected[:200],
            "generated": generated[:200],
        })

    accuracy = correct / total * 100 if total > 0 else 0
    return accuracy, results


def main():
    config = load_config(os.path.join(os.path.dirname(__file__), "config.yaml"))

    base_model_name = config["model"]["name"]
    adapter_path = os.path.join(config["training"]["output_dir"], "final")

    print(f"Loading base model: {base_model_name}")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True,
    )

    tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )

    if os.path.exists(adapter_path):
        print(f"Loading adapter: {adapter_path}")
        model = PeftModel.from_pretrained(model, adapter_path)

    test_dataset = load_dataset("json", data_files=config["dataset"]["test_file"], split="train")

    print(f"Evaluating on {len(test_dataset)} samples...")
    accuracy, results = evaluate(model, tokenizer, test_dataset)

    print(f"\nAccuracy: {accuracy:.1f}%")

    output_path = os.path.join(config["training"]["output_dir"], "eval_results.json")
    with open(output_path, "w") as f:
        json.dump({"accuracy": accuracy, "samples": results[:20]}, f, indent=2)

    print(f"Results saved to {output_path}")


if __name__ == "__main__":
    main()
