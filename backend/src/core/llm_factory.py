"""
src/core/llm_factory.py — Multi-LLM Provider Factory
=====================================================
Returns the appropriate LangChain chat model based on provider string.
Supports: openai, anthropic, google, groq, mistral, ollama, deepseek
"""
from functools import lru_cache
from typing import Optional

from langchain_core.language_models.chat_models import BaseChatModel
from src.core.config import settings
from src.core.logger import get_logger

logger = get_logger(__name__)


PROVIDER_MODEL_MAP = {
    "openai":     ("OPENAI_API_KEY",     settings.OPENAI_CHAT_MODEL),
    "anthropic":  ("ANTHROPIC_API_KEY",  settings.ANTHROPIC_CHAT_MODEL),
    "google":     ("GOOGLE_API_KEY",     settings.GEMINI_MODEL),
    "groq":       ("GROQ_API_KEY",      settings.GROQ_CHAT_MODEL),
    "mistral":    ("MISTRAL_API_KEY",   settings.MISTRAL_CHAT_MODEL),
    "ollama":     (None,                settings.OLLAMA_CHAT_MODEL),
    "deepseek":   ("DEEPSEEK_API_KEY",  settings.DEEPSEEK_CHAT_MODEL),
}


def get_llm(
    provider: str = "",
    model_name: str = "",
    temperature: float = 0.2,
    streaming: bool = True,
) -> BaseChatModel:
    """
    Factory: returns a LangChain chat model for the given provider.

    Args:
        provider:  'openai' | 'anthropic' | 'google' | 'groq' | 'mistral' | 'ollama' | 'deepseek'
        model_name: Override the default model for the provider.
        temperature: LLM temperature (0.0 - 1.0).
        streaming: Enable token-level streaming.

    Returns:
        A BaseChatModel instance.

    Raises:
        ValueError: If the provider is unknown.
        RuntimeError: If the required API key is missing.
    """
    provider = (provider or settings.DEFAULT_LLM_PROVIDER).lower().strip()
    model = model_name or ""
    provider = _resolve_provider(provider, model)

    logger.info(f"LLM Factory: provider={provider}, model={model or 'default'}, temp={temperature}")

    if provider == "openai":
        return _build_openai(model, temperature, streaming)
    elif provider == "anthropic":
        return _build_anthropic(model, temperature, streaming)
    elif provider == "google":
        return _build_google(model, temperature, streaming)
    elif provider == "groq":
        return _build_groq(model, temperature, streaming)
    elif provider == "mistral":
        return _build_mistral(model, temperature, streaming)
    elif provider == "ollama":
        return _build_ollama(model, temperature, streaming)
    elif provider == "deepseek":
        return _build_deepseek(model, temperature, streaming)
    else:
        raise ValueError(f"Unknown LLM provider: '{provider}'. "
                         f"Supported: {', '.join(PROVIDER_MODEL_MAP)}")


def _resolve_provider(provider: str, model: str) -> str:
    """Auto-detect provider from model name if provider is not explicitly set."""
    if provider and provider != "default":
        return provider
    if not model:
        return settings.DEFAULT_LLM_PROVIDER
    model_lower = model.lower()
    if model_lower.startswith("gpt") or model_lower.startswith("o1") or model_lower.startswith("o3"):
        return "openai"
    if model_lower.startswith("claude"):
        return "anthropic"
    if model_lower.startswith("gemini"):
        return "google"
    if model_lower.startswith("llama") or "mixtral" in model_lower:
        return "groq"
    if model_lower.startswith("mistral"):
        return "mistral"
    if model_lower.startswith("deepseek"):
        return "deepseek"
    return settings.DEFAULT_LLM_PROVIDER


def _require_api_key(env_var: str, provider_name: str) -> str:
    key = getattr(settings, env_var, "") or ""
    if not key:
        raise RuntimeError(
            f"{env_var} is not set. "
            f"Add it to your .env file to use {provider_name}."
        )
    return key


def _build_openai(model: str, temperature: float, streaming: bool) -> BaseChatModel:
    from langchain_openai import ChatOpenAI
    api_key = _require_api_key("OPENAI_API_KEY", "OpenAI")
    return ChatOpenAI(
        model=model or settings.OPENAI_CHAT_MODEL,
        temperature=temperature,
        streaming=streaming,
        api_key=api_key,
    )


def _build_anthropic(model: str, temperature: float, streaming: bool) -> BaseChatModel:
    from langchain_anthropic import ChatAnthropic
    api_key = _require_api_key("ANTHROPIC_API_KEY", "Anthropic")
    return ChatAnthropic(
        model=model or settings.ANTHROPIC_CHAT_MODEL,
        temperature=temperature,
        streaming=streaming,
        api_key=api_key,
    )


def _build_google(model: str, temperature: float, streaming: bool) -> BaseChatModel:
    from langchain_google_genai import ChatGoogleGenerativeAI
    api_key = _require_api_key("GOOGLE_API_KEY", "Google Gemini")
    return ChatGoogleGenerativeAI(
        model=model or settings.GEMINI_MODEL,
        temperature=temperature,
        streaming=streaming,
        google_api_key=api_key,
        max_output_tokens=8192,
        max_retries=3,
    )


def _build_groq(model: str, temperature: float, streaming: bool) -> BaseChatModel:
    from langchain_groq import ChatGroq
    api_key = _require_api_key("GROQ_API_KEY", "Groq")
    return ChatGroq(
        model=model or settings.GROQ_CHAT_MODEL,
        temperature=temperature,
        streaming=streaming,
        api_key=api_key,
    )


def _build_mistral(model: str, temperature: float, streaming: bool) -> BaseChatModel:
    from langchain_mistralai import ChatMistralAI
    api_key = _require_api_key("MISTRAL_API_KEY", "Mistral")
    return ChatMistralAI(
        model=model or settings.MISTRAL_CHAT_MODEL,
        temperature=temperature,
        streaming=streaming,
        api_key=api_key,
    )


def _build_ollama(model: str, temperature: float, streaming: bool) -> BaseChatModel:
    from langchain_ollama import ChatOllama
    return ChatOllama(
        model=model or settings.OLLAMA_CHAT_MODEL,
        temperature=temperature,
        base_url=settings.OLLAMA_BASE_URL,
        streaming=streaming,
    )


def _build_deepseek(model: str, temperature: float, streaming: bool) -> BaseChatModel:
    from langchain_openai import ChatOpenAI
    api_key = _require_api_key("DEEPSEEK_API_KEY", "DeepSeek")
    return ChatOpenAI(
        model=model or settings.DEEPSEEK_CHAT_MODEL,
        temperature=temperature,
        streaming=streaming,
        api_key=api_key,
        base_url="https://api.deepseek.com/v1",
    )


def get_available_providers() -> dict:
    """Return which providers are configured (have API keys set)."""
    return {
        "openai":    bool(settings.OPENAI_API_KEY),
        "anthropic": bool(settings.ANTHROPIC_API_KEY),
        "google":    bool(settings.GOOGLE_API_KEY),
        "groq":      bool(settings.GROQ_API_KEY),
        "mistral":   bool(settings.MISTRAL_API_KEY),
        "ollama":    True,
        "deepseek":  bool(settings.DEEPSEEK_API_KEY),
    }
