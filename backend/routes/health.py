from fastapi import APIRouter
from backend.database import check_db_connection

router = APIRouter(tags=["Health"])

@router.get("/health", summary="Health Check")
def get_health():
    """Check the health status of the API and database connectivity."""
    db_connected = check_db_connection()
    return {
        "status": "healthy" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected",
    }
