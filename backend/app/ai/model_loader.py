"""Singleton model loader for PEFT/QLoRA adapters on top of base LLMs.

Architecture:
- ModelRegistry: reads model_registry.json, resolves adapter paths
- ModelLoader: singleton that loads base model + adapter once, serves inference
- All inference runs in a thread pool to avoid blocking the async event loop

Supports:
- Multiple adapter versions (blueprint_v1, blueprint_v2, etc.)
- Hot-swapping adapters without reloading the base model
- Future model upgrades (3B → 7B → VL)
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import PeftModel

logger = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────────
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_MODEL_REGISTRY_PATH = _PROJECT_ROOT / "models" / "registry" / "model_registry.json"
_MODELS_DIR = _PROJECT_ROOT / "models"


class ModelRegistry:
    """Reads and queries the model registry JSON."""

    def __init__(self, registry_path: Optional[Path] = None):
        self._path = registry_path or _MODEL_REGISTRY_PATH
        self._data: Dict[str, Any] = {}
        self._load()

    def _load(self) -> None:
        if not self._path.exists():
            logger.warning("model_registry_not_found", extra={"path": str(self._path)})
            self._data = {"base_models": {}, "adapters": {}, "active_adapter": None}
            return
        with open(self._path, "r") as f:
            self._data = json.load(f)
        logger.info(
            "model_registry_loaded",
            extra={
                "base_models": len(self._data.get("base_models", {})),
                "adapters": len(self._data.get("adapters", {})),
            },
        )

    @property
    def active_adapter_name(self) -> Optional[str]:
        return self._data.get("active_adapter")

    def get_adapter_config(self, adapter_name: str) -> Optional[Dict[str, Any]]:
        return self._data.get("adapters", {}).get(adapter_name)

    def get_base_model_config(self, base_model_key: str) -> Optional[Dict[str, Any]]:
        return self._data.get("base_models", {}).get(base_model_key)

    def resolve_adapter_path(self, adapter_name: str) -> Path:
        cfg = self.get_adapter_config(adapter_name)
        if not cfg:
            raise ValueError(f"Adapter '{adapter_name}' not found in registry")
        raw = cfg.get("path", "")
        path = Path(raw)
        if not path.is_absolute():
            path = _MODELS_DIR.parent / path
        if not path.exists():
            raise FileNotFoundError(f"Adapter path does not exist: {path}")
        return path

    def resolve_base_model_name(self, adapter_name: str) -> str:
        cfg = self.get_adapter_config(adapter_name)
        if not cfg:
            raise ValueError(f"Adapter '{adapter_name}' not found in registry")
        base_key = cfg.get("base_model", "")
        base_cfg = self.get_base_model_config(base_key)
        if not base_cfg:
            raise ValueError(f"Base model '{base_key}' not found in registry")
        return base_cfg["name"]

    def list_active_adapters(self) -> List[str]:
        return [
            name
            for name, cfg in self._data.get("adapters", {}).items()
            if cfg.get("active", False)
        ]


class ModelLoader:
    """Singleton that loads and serves the base model + active LoRA adapter.

    Thread-safety: Uses a threading.Lock for model swap operations.
    Async-safety: All torch inference runs via asyncio.to_thread().
    """

    _instance: Optional["ModelLoader"] = None
    _lock = threading.Lock()

    def __new__(cls, *args: Any, **kwargs: Any) -> "ModelLoader":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if hasattr(self, "_initialized") and self._initialized:
            return
        self._initialized = True

        self.registry = ModelRegistry()
        self._tokenizer: Optional[AutoTokenizer] = None
        self._base_model: Optional[AutoModelForCausalLM] = None
        self._active_model: Optional[PeftModel] = None
        self._active_adapter: Optional[str] = None
        self._model_lock = threading.Lock()
        self._loaded = False

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def active_adapter(self) -> Optional[str]:
        return self._active_adapter

    def load(
        self,
        adapter_name: Optional[str] = None,
        base_model_name: Optional[str] = None,
        load_in_4bit: bool = True,
    ) -> None:
        """Synchronous load — call from sync context or via asyncio.to_thread().

        If adapter_name is None, uses the active adapter from the registry.
        """
        target_adapter = adapter_name or self.registry.active_adapter_name
        if not target_adapter:
            raise ValueError("No adapter specified and no active adapter in registry")

        with self._model_lock:
            # If switching adapters, only swap the LoRA weights (not base model)
            if self._loaded and self._active_adapter == target_adapter:
                logger.info("adapter_already_loaded", extra={"adapter": target_adapter})
                return

            if self._loaded and self._active_adapter != target_adapter:
                logger.info(
                    "hot_swapping_adapter",
                    extra={"from": self._active_adapter, "to": target_adapter},
                )
                self._load_adapter(target_adapter)
                return

            # First-time full load
            resolved_base = base_model_name or self.registry.resolve_base_model_name(target_adapter)
            self._load_base(resolved_base, load_in_4bit)
            self._load_adapter(target_adapter)
            self._loaded = True

    def _load_base(self, model_name: str, load_in_4bit: bool) -> None:
        logger.info("loading_base_model", extra={"model": model_name, "4bit": load_in_4bit})

        bnb_config = None
        if load_in_4bit:
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_use_double_quant=True,
            )

        self._tokenizer = AutoTokenizer.from_pretrained(
            model_name, trust_remote_code=True
        )
        if self._tokenizer.pad_token is None:
            self._tokenizer.pad_token = self._tokenizer.eos_token

        model_kwargs: Dict[str, Any] = {}
        if bnb_config:
            model_kwargs["quantization_config"] = bnb_config

        self._base_model = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
        )

        logger.info("base_model_loaded", extra={"model": model_name})

    def _load_adapter(self, adapter_name: str) -> None:
        adapter_path = self.registry.resolve_adapter_path(adapter_name)
        logger.info("loading_adapter", extra={"adapter": adapter_name, "path": str(adapter_path)})

        self._active_model = PeftModel.from_pretrained(
            self._base_model, str(adapter_path)
        )
        self._active_model.eval()
        self._active_adapter = adapter_name

        logger.info("adapter_loaded", extra={"adapter": adapter_name})

    def generate(
        self,
        messages: List[Dict[str, str]],
        max_new_tokens: int = 2048,
        temperature: float = 0.1,
        do_sample: bool = False,
    ) -> str:
        """Synchronous generation — call from sync context or via asyncio.to_thread()."""
        if not self._loaded or self._active_model is None:
            raise RuntimeError("Model not loaded. Call load() first.")

        input_text = self._tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        inputs = self._tokenizer(input_text, return_tensors="pt").to(
            self._active_model.device
        )

        with torch.no_grad():
            outputs = self._active_model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                do_sample=do_sample,
            )

        generated = self._tokenizer.decode(
            outputs[0][inputs["input_ids"].shape[1] :], skip_special_tokens=True
        )
        return generated

    async def generate_async(
        self,
        messages: List[Dict[str, str]],
        max_new_tokens: int = 2048,
        temperature: float = 0.1,
        do_sample: bool = False,
    ) -> str:
        """Async generation — runs torch inference in a thread pool."""
        return await asyncio.to_thread(
            self.generate,
            messages=messages,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            do_sample=do_sample,
        )

    def swap_adapter(self, adapter_name: str) -> None:
        """Hot-swap to a different adapter without reloading the base model."""
        self.load(adapter_name=adapter_name)

    async def swap_adapter_async(self, adapter_name: str) -> None:
        """Async hot-swap."""
        await asyncio.to_thread(self.swap_adapter, adapter_name)

    def get_info(self) -> Dict[str, Any]:
        return {
            "loaded": self._loaded,
            "active_adapter": self._active_adapter,
            "device": str(self._active_model.device) if self._active_model else None,
            "available_adapters": self.registry.list_active_adapters(),
        }


# ── Module-level singleton accessor ───────────────────────────────────
_model_loader: Optional[ModelLoader] = None


def get_model_loader() -> ModelLoader:
    """Get or create the global ModelLoader singleton."""
    global _model_loader
    if _model_loader is None:
        _model_loader = ModelLoader()
    return _model_loader
