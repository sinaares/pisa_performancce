import os
from pathlib import Path

from pydantic_settings import BaseSettings
from functools import lru_cache

# Resolve to backend/.env regardless of CWD
_env_path = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""              # service-role key (full backend access)
    supabase_jwt_secret: str = ""       # JWT secret for verifying auth tokens

    # LLM
    groq_api_key: str = ""              # Groq API key for chat completions

    # ML
    ml_model_version: str = "v1"        # tracked in the predictions table

    # CORS
    frontend_url: str = "http://localhost:3000"

    # App
    debug: bool = False

    model_config = {"env_file": str(_env_path), "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
