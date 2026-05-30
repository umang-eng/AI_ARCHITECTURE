import functools
import inspect
import time
from typing import Any, Callable, Dict, TypeVar, cast

from app.ai.monitoring import (
    AICallMetrics,
    ai_call_context,
    calculate_cost,
    estimate_tokens,
    log_ai_call_completion,
    log_ai_call_start,
)

F = TypeVar("F", bound=Callable[..., Any])


def track_ai_call(func: F) -> F:
    """Async decorator to log and monitor AI provider requests, responses, and errors.
    
    Tracks:
    - Request payload start
    - Success/failure status
    - Precise execution duration
    - Actual or fallback prompt/completion token usage
    - Cost estimation
    """
    @functools.wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        # Resolve all arguments (positional + keyword) to inspect their values cleanly
        sig = inspect.signature(func)
        try:
            bound_args = sig.bind(*args, **kwargs)
            bound_args.apply_defaults()
            resolved_args = bound_args.arguments
        except Exception:
            # Fallback signature resolution if binding fails
            resolved_args = kwargs
            
        prompt = resolved_args.get("prompt", "")
        system_prompt = resolved_args.get("system_prompt", None)
        model = resolved_args.get("model", None)
        temperature = resolved_args.get("temperature", None)

        # Retrieve provider instance (self)
        provider_name = "unknown"
        model_name = "unknown"
        if args and hasattr(args[0], "get_model_info"):
            provider_inst = args[0]
            try:
                # Try getting provider model metadata sync or async safely
                model_info = await provider_inst.get_model_info()
                provider_name = model_info.get("provider", "unknown")
                model_name = model or model_info.get("model", "unknown")
            except Exception:
                # Fallback to direct attribute lookup
                provider_name = getattr(provider_inst, "__class__", "__class__").__name__.replace("Provider", "").lower()
                model_name = model or getattr(provider_inst, "default_model_name", "unknown")
        else:
            model_name = model or "unknown"

        # Log AI Call request start
        log_ai_call_start(
            provider=provider_name,
            model=model_name,
            operation=func.__name__,
            prompt_preview=str(prompt),
            temperature=temperature,
        )

        # Clear the current context variable before executing the call
        token_var_token = ai_call_context.set(None)
        start_time = time.perf_counter()

        try:
            result = await func(*args, **kwargs)
            
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            
            # Fetch token usage from the context variable set during the request
            prompt_tokens = 0
            completion_tokens = 0
            
            response_json = ai_call_context.get()
            if isinstance(response_json, dict):
                usage = response_json.get("usage")
                if isinstance(usage, dict):
                    prompt_tokens = usage.get("prompt_tokens", 0)
                    completion_tokens = usage.get("completion_tokens", 0)

            # Fallback: estimate prompt tokens if actuals are 0
            if prompt_tokens == 0:
                prompt_tokens = estimate_tokens(prompt)
                if system_prompt:
                    prompt_tokens += estimate_tokens(system_prompt)

            # Fallback: estimate completion tokens if actuals are 0
            if completion_tokens == 0:
                if isinstance(result, str):
                    completion_tokens = estimate_tokens(result)
                elif isinstance(result, dict):
                    import json
                    try:
                        # Estimate based on the structured JSON result
                        completion_tokens = estimate_tokens(json.dumps(result))
                    except Exception:
                        pass

            total_tokens = prompt_tokens + completion_tokens
            cost_usd = calculate_cost(model_name, prompt_tokens, completion_tokens)

            metrics = AICallMetrics(
                provider=provider_name,
                model=model_name,
                operation=func.__name__,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                cost_usd=cost_usd,
                elapsed_ms=elapsed_ms,
                success=True,
                error=None,
            )
            
            log_ai_call_completion(metrics)
            return result

        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            
            # Estimate prompt tokens for the failed call
            prompt_tokens = estimate_tokens(prompt)
            if system_prompt:
                prompt_tokens += estimate_tokens(system_prompt)

            metrics = AICallMetrics(
                provider=provider_name,
                model=model_name,
                operation=func.__name__,
                prompt_tokens=prompt_tokens,
                completion_tokens=0,
                total_tokens=prompt_tokens,
                cost_usd=calculate_cost(model_name, prompt_tokens, 0),
                elapsed_ms=elapsed_ms,
                success=False,
                error=str(exc),
            )
            
            log_ai_call_completion(metrics)
            raise exc

        finally:
            # Reset context variable to avoid leaking between requests
            ai_call_context.reset(token_var_token)

    return cast(F, wrapper)
