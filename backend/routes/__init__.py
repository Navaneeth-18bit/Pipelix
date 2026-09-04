from backend.routes.health import router as health_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.transactions import router as transactions_router
from backend.routes.anomalies import router as anomalies_router
from backend.routes.quality import router as quality_router
from backend.routes.pipelines import router as pipelines_router
from backend.routes.database import router as database_router

__all__ = [
    "health_router",
    "dashboard_router",
    "transactions_router",
    "anomalies_router",
    "quality_router",
    "pipelines_router",
    "database_router",
]
