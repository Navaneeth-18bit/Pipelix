from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from backend.config import settings
from backend.routes.health import router as health_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.transactions import router as transactions_router
from backend.routes.anomalies import router as anomalies_router
from backend.routes.quality import router as quality_router
from backend.routes.pipelines import router as pipelines_router
from backend.routes.database import router as database_router

logger = logging.getLogger("pipelix")
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Pipelix API",
    description="Intelligent Data Pipeline & Anomaly Detection Platform REST API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error occurred. Please verify backend and database connectivity.",
            "status": "error",
        },
    )

# Include Routers under /api
app.include_router(health_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(transactions_router, prefix="/api")
app.include_router(anomalies_router, prefix="/api")
app.include_router(quality_router, prefix="/api")
app.include_router(pipelines_router, prefix="/api")
app.include_router(database_router, prefix="/api")

@app.get("/")
def root():
    return {
        "platform": "Pipelix",
        "description": "Intelligent Data Pipeline & Anomaly Detection Platform",
        "status": "operational",
        "docs": "/docs",
        "redoc": "/redoc",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
