from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import List

from backend.database import get_db, check_db_connection
from backend.config import settings
from backend.schemas.database import DatabaseStatusResponse, DatabaseTableResponse

router = APIRouter(tags=["Database"])


@router.get("/database/status", response_model=DatabaseStatusResponse)
def get_database_status():
    connected = check_db_connection()
    return DatabaseStatusResponse(
        database="postgres",
        status="connected" if connected else "disconnected",
        host=settings.SUPABASE_URL.replace("https://", "").replace("http://", ""),
        port=443,
    )


@router.get("/database/tables", response_model=List[DatabaseTableResponse])
def get_database_tables(db: Client = Depends(get_db)):
    table_names = [
        "customers", "products", "transactions",
        "data_quality_logs", "anomalies", "pipeline_runs",
    ]
    result = []
    for name in table_names:
        try:
            response = db.table(name).select("*", count="exact").limit(1).execute()
            count = response.count if response.count is not None else len(response.data)
            result.append(DatabaseTableResponse(
                name=name,
                rowCount=f"{count:,}",
                lastUpdated="Just now",
                status="HEALTHY" if count > 0 else "EMPTY",
            ))
        except Exception:
            result.append(DatabaseTableResponse(
                name=name,
                rowCount="0",
                lastUpdated="Just now",
                status="ERROR",
            ))
    return result


@router.delete("/database/data")
def delete_all_database_data(confirmation: str, db: Client = Depends(get_db)):
    if confirmation != "DELETE":
        raise HTTPException(status_code=400, detail="Type DELETE to confirm this operation")

    db.table("anomalies").delete().neq("anomaly_id", -1).execute()
    db.table("data_quality_logs").delete().neq("quality_log_id", -1).execute()
    db.table("pipeline_runs").delete().neq("pipeline_run_id", -1).execute()
    db.table("transactions").delete().neq("transaction_id", "").execute()
    db.table("customers").delete().neq("customer_id", "").execute()
    db.table("products").delete().neq("product_id", "").execute()
    return {"message": "All database data deleted successfully"}
