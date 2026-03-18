from supabase import create_client, Client
from .config import get_settings


def get_supabase() -> Client:
    """Return a Supabase client using the service-role key (full access)."""
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_key)


def safe_data(result):
    """Safely extract .data from a maybe_single() result that can be None."""
    if result is None:
        return None
    return result.data
