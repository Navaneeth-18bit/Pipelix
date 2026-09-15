from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from backend.config import settings
from backend.database import get_db, check_db_connection
from backend.schemas.database import DatabaseStatusResponse, DatabaseTableResponse

router = APIRouter(tags=["Database"])

@router.get("/database/status", response_model=DatabaseStatusResponse, summary="Database Connection Status")
def get_database_status():
    """Return database connection parameters without exposing credentials."""
    is_connected = check_db_connection()
    return DatabaseStatusResponse(
        database=settings.POSTGRES_DB,
        status="connected" if is_connected else "disconnected",
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
    )

@router.get("/database/tables", response_model=List[DatabaseTableResponse], summary="Database Tables Overview")
def get_database_tables(db: Session = Depends(get_db)):
    """Return table metadata including live row counts and health status."""
    table_names = [
        "customers",
        "products",
        "transactions",
        "data_quality_logs",
        "anomalies",
        "pipeline_runs",
    ]

    result = []
    for tbl in table_names:
        try:
            row_count_res = db.execute(text(f"SELECT count(*) FROM {tbl}")).scalar()
            count_str = f"{row_count_res:,}"
            status = "HEALTHY" if row_count_res > 0 else "EMPTY"
        except Exception:
            count_str = "0"
            status = "ERROR"

        result.append(
            DatabaseTableResponse(
                name=tbl,
                rowCount=count_str,
                lastUpdated="Just now",
                status=status,
            )
        )

    return result


@router.delete("/database/data", summary="Delete All Database Data")
def delete_all_database_data(confirmation: str, db: Session = Depends(get_db)):
    """Delete all application data while preserving the database schema."""
    if confirmation != "DELETE":
        raise HTTPException(status_code=400, detail="Type DELETE to confirm this operation")

    db.execute(
        text(
            "TRUNCATE TABLE anomalies, data_quality_logs, pipeline_runs, "
            "transactions, customers, products RESTART IDENTITY CASCADE"
        )
    )
    db.commit()
    return {"message": "All database data deleted successfully"}
