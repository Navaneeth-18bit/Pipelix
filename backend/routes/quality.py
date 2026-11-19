from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from supabase import Client

from backend.database import get_db
from backend.schemas.quality import QualitySummaryResponse, QualityCheckItem

router = APIRouter(tags=["Data Quality"])


@router.get("/quality/summary", response_model=QualitySummaryResponse)
def get_quality_summary(db: Client = Depends(get_db)):
    logs = db.table("data_quality_logs").select(
        "quality_score,invalid_record_count,check_type"
    ).execute()
    transactions = db.table("transactions").select("transaction_id", count="exact").execute()

    scores = [float(row["quality_score"]) for row in logs.data if row.get("quality_score") is not None]
    overall_score = round(sum(scores) / len(scores), 1) if scores else 100.0

    missing = sum(int(row["invalid_record_count"]) for row in logs.data if row.get("check_type") == "missing_values")
    duplicate = sum(int(row["invalid_record_count"]) for row in logs.data if row.get("check_type") == "duplicate_records")
    invalid_dates = sum(int(row["invalid_record_count"]) for row in logs.data if row.get("check_type") == "invalid_dates")
    invalid_numeric = sum(
        int(row["invalid_record_count"]) for row in logs.data
        if row.get("check_type") in ("negative_or_zero_value", "invalid_numeric")
    )
    invalid_total = missing + duplicate + invalid_dates + invalid_numeric
    total_transactions = transactions.count or len(transactions.data)

    return QualitySummaryResponse(
        overall_quality_score=overall_score,
        valid_records=max(0, total_transactions - invalid_total),
        invalid_records=invalid_total,
        missing_values=missing,
        duplicate_records=duplicate,
        invalid_dates=invalid_dates,
        invalid_numeric_values=invalid_numeric,
    )


@router.get("/quality/checks", response_model=List[QualityCheckItem])
def get_quality_checks(
    status: Optional[str] = Query(None),
    table_name: Optional[str] = Query(None),
    db: Client = Depends(get_db),
):
    query = db.table("data_quality_logs").select(
        "quality_log_id,check_type,column_name,invalid_record_count,status,"
        "table_name,quality_score,created_at"
    )
    if status and status.upper() != "ALL":
        normalized = status.upper()
        if normalized == "PASSED":
            normalized = "PASS"
        elif normalized == "FAILED":
            normalized = "FAIL"
        query = query.eq("status", normalized)
    if table_name and table_name.lower() != "all":
        query = query.eq("table_name", table_name)

    records = query.order("created_at", desc=True).execute()
    result = []
    for row in records.data:
        ui_status = "PASSED" if row["status"] == "PASS" else ("FAILED" if row["status"] == "FAIL" else "WARNING")
        result.append(QualityCheckItem(
            id=row["quality_log_id"],
            check=row["check_type"].replace("_", " ").title(),
            column=row.get("column_name") or "all_columns",
            issues=int(row.get("invalid_record_count") or 0),
            status=ui_status,
            tableName=row.get("table_name"),
            qualityScore=float(row["quality_score"]) if row.get("quality_score") is not None else 100.0,
            createdAt=row.get("created_at"),
        ))
    return result
