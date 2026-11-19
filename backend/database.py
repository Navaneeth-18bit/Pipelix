from supabase import Client, create_client
from backend.config import settings

_supabase: Client | None = None


def get_supabase() -> Client:
    global _supabase
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured"
        )
    if _supabase is None:
        _supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
    return _supabase


def get_db():
    return get_supabase()


def check_db_connection() -> bool:
    try:
        get_supabase().table("pipeline_runs").select("pipeline_run_id").limit(1).execute()
        return True
    except Exception:
        return False
