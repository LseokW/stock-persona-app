from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, env_file_encoding="utf-8")

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"

    JWT_SECRET: str = "dev-secret-change-before-use"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080

    FRONTEND_URL: str = "http://localhost:5173"
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"

    POLAR_ACCESS_TOKEN: str = ""
    POLAR_SERVER: str = "sandbox"
    POLAR_PRODUCT_ID_COWARD: Optional[str] = None
    POLAR_PRODUCT_ID_BEAST: Optional[str] = None
    POLAR_PRODUCT_ID_CONTRARIAN: Optional[str] = None
    POLAR_PRODUCT_ID_AI: Optional[str] = None

    def get_polar_product_id(self, persona_key: str) -> Optional[str]:
        mapping = {
            "coward": self.POLAR_PRODUCT_ID_COWARD,
            "beast": self.POLAR_PRODUCT_ID_BEAST,
            "contrarian": self.POLAR_PRODUCT_ID_CONTRARIAN,
            "ai": self.POLAR_PRODUCT_ID_AI,
        }
        return mapping.get(persona_key)


settings = Settings()
