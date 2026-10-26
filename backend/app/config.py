import os
from pathlib import Path

# Load local environment variables from .env if present
_env_candidates = [
    Path(".env"),
    Path("../.env"),
    Path(__file__).resolve().parent.parent / ".env",
    Path(__file__).resolve().parent.parent.parent / ".env",
]
for _candidate in _env_candidates:
    if _candidate.is_file():
        try:
            with open(_candidate, "r", encoding="utf-8") as _f:
                for _line in _f:
                    _line = _line.strip()
                    if _line and not _line.startswith("#") and "=" in _line:
                        _k, _v = _line.split("=", 1)
                        _k, _v = _k.strip(), _v.strip().strip("\"'")
                        if _k and _k not in os.environ:
                            os.environ[_k] = _v
            break
        except Exception:
            pass

class Settings:
    PROJECT_NAME: str = "Inkloom AI — Evidence-Driven Brand Governance"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Network Ports & Local Development
    HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    FRONTEND_PORT: int = int(os.getenv("FRONTEND_PORT", "5173"))
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./inkloom.db")
    DATABASE_SYNC_URL: str = os.getenv("DATABASE_SYNC_URL", "sqlite:///./inkloom.db")
    
    # Environment & Demo Mode
    ENV: str = os.getenv("INKLOOM_ENV", "development")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    
    # AI Engine Provider (Configurable, with deterministic fallback)
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "deterministic_fallback") # Options: gemini, openai, deterministic_fallback
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "inkloom-brandtrace-secret-key-development-only-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours

settings = Settings()
