import os
import json
import yaml
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import PeftModel


def load_config(config_path: str) -> dict:
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


class BlueprintInference:
    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = os.path.join(os.path.dirname(__file__), "config.yaml")
        config = load_config(config_path)

        base_model_name = config["model"]["name"]
        adapter_path = os.path.join(config["training"]["output_dir"], "final")

        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
            bnb_4bit_use_double_quant=True,
        )

        self.tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
        self.model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
        )

        if os.path.exists(adapter_path):
            self.model = PeftModel.from_pretrained(self.model, adapter_path)

    def generate(self, prompt: str) -> dict:
        messages = [{"role": "user", "content": prompt}]
        input_text = self.tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )

        inputs = self.tokenizer(input_text, return_tensors="pt").to(self.model.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=2048,
                temperature=0.1,
                do_sample=False,
            )

        generated = self.tokenizer.decode(
            outputs[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True
        )

        try:
            return json.loads(generated)
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON", "raw": generated}


def main():
    engine = BlueprintInference()

    prompts = [
        "Modern villa on 60x80 plot with 4 bedrooms and 2 bathrooms",
        "Traditional house on 50x60 plot with 3 bedrooms",
        "Minimalist apartment on 40x50 plot with 2 bedrooms and 1 bathroom",
    ]

    for prompt in prompts:
        print(f"\nPrompt: {prompt}")
        result = engine.generate(prompt)
        print(f"Rooms: {len(result.get('rooms', []))}")
        print(json.dumps(result, indent=2)[:500])


if __name__ == "__main__":
    main()
