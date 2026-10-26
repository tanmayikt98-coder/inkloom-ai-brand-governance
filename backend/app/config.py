import os

class Settings:
    PROJECT_NAME: str = "Inkloom AI — Evidence-Driven Brand Governance"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
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
