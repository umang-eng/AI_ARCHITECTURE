import pytest
import logging
from typing import Any, Dict, Optional

from app.ai.monitoring import (
    estimate_tokens,
    calculate_cost,
    ai_call_context,
    AICallMetrics,
    log_ai_call_completion,
    log_ai_call_start,
)
from app.ai.middleware import track_ai_call
from app.ai.providers.base_provider import BaseAIProvider


# Define a Mock Provider to test decorator integration
class MockTrackingProvider(BaseAIProvider):
    def __init__(self, model_name: str = "deepseek-chat", simulate_usage: bool = True):
        self.default_model_name = model_name
        self.simulate_usage = simulate_usage

    async def get_model_info(self) -> Dict[str, Any]:
        return {"provider": "mock-tracker", "model": self.default_model_name}

    @track_ai_call
    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs: Any,
    ) -> str:
        if self.simulate_usage:
            # Simulate low-level request populating the token usage context
            ai_call_context.set({
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 20,
                    "total_tokens": 30,
                }
            })
        return "Mock response generated"

    @track_ai_call
    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        schema: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        if prompt == "trigger-error":
            raise RuntimeError("API connection failure")
        
        if self.simulate_usage:
            ai_call_context.set({
                "usage": {
                    "prompt_tokens": 12,
                    "completion_tokens": 18,
                    "total_tokens": 30,
                }
            })
        return {"result": "success", "data": "mock-json-data"}


# 1. Test Token Estimation Utility
def test_estimate_tokens():
    assert estimate_tokens("") == 0
    assert estimate_tokens(None) == 0
    
    # Text string estimation checks
    short_text = "Hello world"
    # Should estimate a small token count > 0
    assert estimate_tokens(short_text) > 0
    
    long_text = "This is a much longer sentence designed to test the robustness of the character-to-token count logic."
    assert estimate_tokens(long_text) > estimate_tokens(short_text)


# 2. Test Cost Calculations
def test_calculate_cost():
    # Test configured deepseek model
    # Input: 0.00000014, Output: 0.00000028
    cost_ds = calculate_cost("deepseek-chat", 1000, 2000)
    expected_ds = (1000 * 0.00000014) + (2000 * 0.00000028)
    assert pytest.approx(cost_ds) == expected_ds

    # Test configured gpt-4o model
    cost_gpt = calculate_cost("gpt-4o", 1000, 2000)
    expected_gpt = (1000 * 0.000005) + (2000 * 0.000015)
    assert pytest.approx(cost_gpt) == expected_gpt

    # Test unknown model fallback (DEFAULT_INPUT_COST = 0.000002, DEFAULT_OUTPUT_COST = 0.000006)
    cost_fallback = calculate_cost("unknown-mega-model-v99", 1000, 2000)
    expected_fallback = (1000 * 0.000002) + (2000 * 0.000006)
    assert pytest.approx(cost_fallback) == expected_fallback


# 3. Test Structured Logging Outputs for Metrics Completion
def test_log_ai_call_completion(caplog):
    caplog.set_level(logging.INFO)
    
    metrics = AICallMetrics(
        provider="test-prov",
        model="test-mod",
        operation="test_op",
        prompt_tokens=100,
        completion_tokens=200,
        total_tokens=300,
        cost_usd=0.00045,
        elapsed_ms=123.45,
        success=True,
        request_id="req-123",
    )
    
    log_ai_call_completion(metrics)
    
    assert len(caplog.records) == 1
    record = caplog.records[0]
    assert record.levelname == "INFO"
    assert "test-prov/test-mod test_op finished" in record.message
    assert getattr(record, "ai_provider") == "test-prov"
    assert getattr(record, "ai_model") == "test-mod"
    assert getattr(record, "ai_prompt_tokens") == 100
    assert getattr(record, "ai_completion_tokens") == 200
    assert getattr(record, "ai_cost_usd") == 0.00045
    assert getattr(record, "ai_duration_ms") == 123.45
    assert getattr(record, "ai_success") is True
    assert getattr(record, "request_id") == "req-123"


# 4. Test Structured Logging for start and failure metrics
def test_log_ai_call_start_and_error(caplog):
    caplog.set_level(logging.INFO)
    
    log_ai_call_start("test-prov", "test-mod", "test_op", "prompt text sample", 0.5)
    
    assert len(caplog.records) == 1
    start_record = caplog.records[0]
    assert "started" in start_record.message
    assert getattr(start_record, "ai_temperature") == 0.5
    assert getattr(start_record, "ai_prompt_preview") == "prompt text sample"

    caplog.clear()
    
    metrics_err = AICallMetrics(
        provider="test-prov",
        model="test-mod",
        operation="test_op",
        prompt_tokens=50,
        completion_tokens=0,
        total_tokens=50,
        cost_usd=0.0001,
        elapsed_ms=50.0,
        success=False,
        error="Connection Timeout",
    )
    log_ai_call_completion(metrics_err)
    
    assert len(caplog.records) == 1
    err_record = caplog.records[0]
    assert err_record.levelname == "ERROR"
    assert "Connection Timeout" in err_record.message
    assert getattr(err_record, "ai_success") is False
    assert getattr(err_record, "ai_error") == "Connection Timeout"


# 5. Test Decorator @track_ai_call under Successful Execution (with real API tokens simulated)
@pytest.mark.asyncio
async def test_decorator_success_with_tokens(caplog):
    caplog.set_level(logging.INFO)
    provider = MockTrackingProvider(model_name="deepseek-chat", simulate_usage=True)
    
    result = await provider.generate_text(
        prompt="Build a beautiful room",
        system_prompt="You are an architect",
        temperature=0.2,
    )
    
    assert result == "Mock response generated"
    
    # We should have 2 log records (1 for start, 1 for completion)
    assert len(caplog.records) == 2
    
    start_rec = caplog.records[0]
    completion_rec = caplog.records[1]
    
    assert "started" in start_rec.message
    assert getattr(start_rec, "ai_model") == "deepseek-chat"
    
    assert "finished" in completion_rec.message
    assert getattr(completion_rec, "ai_success") is True
    # The actual usage parameters should be captured from context variable
    assert getattr(completion_rec, "ai_prompt_tokens") == 10
    assert getattr(completion_rec, "ai_completion_tokens") == 20
    assert getattr(completion_rec, "ai_total_tokens") == 30
    assert getattr(completion_rec, "ai_cost_usd") > 0.0


# 6. Test Decorator under Success but WITHOUT API Usage returned (Fallback estimation validation)
@pytest.mark.asyncio
async def test_decorator_fallback_estimation(caplog):
    caplog.set_level(logging.INFO)
    # Turn off usage simulation
    provider = MockTrackingProvider(model_name="deepseek-chat", simulate_usage=False)
    
    prompt = "Create a standard house plan"
    result = await provider.generate_text(prompt=prompt, system_prompt="architect")
    
    assert result == "Mock response generated"
    
    # Verify fallback estimated token counts are strictly positive integers
    completion_rec = caplog.records[1]
    assert getattr(completion_rec, "ai_prompt_tokens") > 0
    assert getattr(completion_rec, "ai_completion_tokens") > 0
    assert getattr(completion_rec, "ai_total_tokens") > 0
    assert getattr(completion_rec, "ai_cost_usd") > 0.0


# 7. Test Decorator under Failure/Error conditions
@pytest.mark.asyncio
async def test_decorator_error_handling(caplog):
    caplog.set_level(logging.INFO)
    provider = MockTrackingProvider(model_name="gpt-4o")
    
    with pytest.raises(RuntimeError) as exc_info:
        await provider.generate_json(prompt="trigger-error")
        
    assert "API connection failure" in str(exc_info.value)
    
    # Validate error log presence
    err_rec = caplog.records[1]
    assert err_rec.levelname == "ERROR"
    assert getattr(err_rec, "ai_success") is False
    assert "API connection failure" in getattr(err_rec, "ai_error")
    assert getattr(err_rec, "ai_prompt_tokens") > 0
    assert getattr(err_rec, "ai_completion_tokens") == 0
    assert getattr(err_rec, "ai_cost_usd") > 0.0
