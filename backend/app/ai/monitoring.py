import contextvars
import logging
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("app.ai.monitoring")

# Context variable to hold raw API response metadata (e.g., usage blocks) in the current async context
ai_call_context: contextvars.ContextVar[Optional[Dict[str, Any]]] = contextvars.ContextVar("ai_call_context", default=None)

# Model pricing registry: Input/Output cost per token in USD
# Pricing reflects standard public prices as of 2026/mid-2025
MODEL_PRICING: Dict[str, Dict[str, float]] = {
    "deepseek-chat": {"input": 0.00000014, "output": 0.00000028},
    "deepseek-reasoner": {"input": 0.00000055, "output": 0.00000219},
    "gpt-4-turbo": {"input": 0.00001000, "output": 0.00003000},
    "gpt-4o": {"input": 0.00000500, "output": 0.00001500},
    "gpt-4": {"input": 0.00003000, "output": 0.00006000},
    "gpt-3.5-turbo": {"input": 0.00000050, "output": 0.00000150},
    "claude-3-5-sonnet-20240620": {"input": 0.00000300, "output": 0.00001500},
    "claude-3-opus-20240229": {"input": 0.00001500, "output": 0.00007500},
    "claude-3-haiku-20240307": {"input": 0.00000025, "output": 0.00000125},
    "gemini-1.5-pro": {"input": 0.00000125, "output": 0.00000500},
    "gemini-1.5-flash": {"input": 0.000000075, "output": 0.0000003},
}

DEFAULT_INPUT_COST = 0.00000200   # $2.00 per 1M tokens
DEFAULT_OUTPUT_COST = 0.00000600  # $6.00 per 1M tokens


class AICallMetrics(BaseModel):
    """Data transfer object holding rich telemetry metrics for an AI call."""
    provider: str
    model: str
    operation: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    elapsed_ms: float = 0.0
    success: bool = True
    error: Optional[str] = None
    request_id: Optional[str] = None


def estimate_tokens(text: str) -> int:
    """Fallback character/word based token estimation if token count is not provided.
    Roughly 4 characters per token or 3/4 words per token.
    """
    if not text:
        return 0
    char_estimate = len(text) // 4
    word_estimate = len(text.split()) * 4 // 3
    # Average the char-based and word-based estimation for a robust blend
    return max(1, (char_estimate + word_estimate) // 2)


def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Calculate the estimated cost of an LLM call in USD."""
    rates = MODEL_PRICING.get(model.lower())
    if rates:
        input_rate = rates["input"]
        output_rate = rates["output"]
    else:
        # Fallback to defaults
        input_rate = DEFAULT_INPUT_COST
        output_rate = DEFAULT_OUTPUT_COST
    
    return (prompt_tokens * input_rate) + (completion_tokens * output_rate)


def log_ai_call_start(provider: str, model: str, operation: str, prompt_preview: str, temperature: Optional[float] = None) -> None:
    """Log when an AI call is started, with key parameters."""
    extra_data = {
        "ai_provider": provider,
        "ai_model": model,
        "ai_operation": operation,
        "ai_prompt_preview": prompt_preview[:200],
    }
    if temperature is not None:
        extra_data["ai_temperature"] = temperature
        
    logger.info(
        f"AI call request started to {provider}/{model} ({operation})",
        extra=extra_data
    )


def log_ai_call_completion(metrics: AICallMetrics) -> None:
    """Log the AI call details in a structured way."""
    extra_data = {
        "ai_provider": metrics.provider,
        "ai_model": metrics.model,
        "ai_operation": metrics.operation,
        "ai_prompt_tokens": metrics.prompt_tokens,
        "ai_completion_tokens": metrics.completion_tokens,
        "ai_total_tokens": metrics.total_tokens,
        "ai_cost_usd": metrics.cost_usd,
        "ai_duration_ms": metrics.elapsed_ms,
        "ai_success": metrics.success,
    }
    if metrics.error:
        extra_data["ai_error"] = metrics.error
    if metrics.request_id:
        extra_data["request_id"] = metrics.request_id

    log_msg = (
        f"AI call to {metrics.provider}/{metrics.model} {metrics.operation} finished - "
        f"Success: {metrics.success} | Tokens: {metrics.total_tokens} | Cost: ${metrics.cost_usd:.6f} | "
        f"Duration: {metrics.elapsed_ms:.2f}ms"
    )
    if not metrics.success and metrics.error:
        log_msg += f" | Error: {metrics.error}"

    if metrics.success:
        logger.info(log_msg, extra=extra_data)
    else:
        logger.error(log_msg, extra=extra_data)
