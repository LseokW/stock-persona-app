from polar_sdk import Polar

from app.config import settings

_client: Polar | None = None


def get_polar() -> Polar:
    global _client
    if _client is None:
        _client = Polar(
            access_token=settings.POLAR_ACCESS_TOKEN,
            server=settings.POLAR_SERVER,
        )
    return _client
