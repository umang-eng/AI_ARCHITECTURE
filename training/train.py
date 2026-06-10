import os
import yaml
import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer


def load_config(config_path: str) -> dict:
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def main():
    config = load_config(os.path.join(os.path.dirname(__file__), "config.yaml"))

    model_name = config["model"]["name"]
    max_length = config["model"]["max_length"]

    print(f"Loading model: {model_name}")

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True,
    )

    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    model = prepare_model_for_kbit_training(model)

    lora_config = LoraConfig(
        r=config["qlora"]["r"],
        lora_alpha=config["qlora"]["lora_alpha"],
        lora_dropout=config["qlora"]["lora_dropout"],
        target_modules=config["qlora"]["target_modules"],
        bias="none",
        task_type="CAUSAL_LM",
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    dataset = load_dataset(
        "json",
        data_files={
            "train": config["dataset"]["train_file"],
            "validation": config["dataset"]["validation_file"],
        },
    )

    def format_messages(example):
        messages = example["messages"]
        text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)
        return {"text": text}

    dataset = dataset.map(format_messages)

    training_config = config["training"]
    output_dir = training_config["output_dir"]
    os.makedirs(output_dir, exist_ok=True)

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=training_config["num_train_epochs"],
        per_device_train_batch_size=training_config["per_device_train_batch_size"],
        gradient_accumulation_steps=training_config["gradient_accumulation_steps"],
        learning_rate=training_config["learning_rate"],
        warmup_steps=training_config["warmup_steps"],
        logging_steps=training_config["logging_steps"],
        save_steps=training_config["save_steps"],
        evaluation_strategy=training_config["evaluation_strategy"],
        eval_steps=training_config["eval_steps"],
        fp16=training_config["fp16"],
        bf16=training_config["bf16"],
        optim=training_config["optim"],
        lr_scheduler_type=training_config["lr_scheduler_type"],
        max_grad_norm=training_config["max_grad_norm"],
        weight_decay=training_config["weight_decay"],
        report_to="none",
    )

    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset["train"],
        eval_dataset=dataset["validation"],
        tokenizer=tokenizer,
        max_seq_length=max_length,
    )

    print("Starting training...")
    trainer.train()

    trainer.save_model(os.path.join(output_dir, "final"))
    tokenizer.save_pretrained(os.path.join(output_dir, "final"))

    print(f"Model saved to {output_dir}/final")


if __name__ == "__main__":
    main()
