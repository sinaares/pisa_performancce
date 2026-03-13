from supabase import create_client, Client
from .config import get_settings


def get_supabase() -> Client:
    """Return a Supabase client using the service-role key (full access)."""
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_key)
