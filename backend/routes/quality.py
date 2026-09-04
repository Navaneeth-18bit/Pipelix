from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List

from backend.database import get_db
from backend.models.quality import DataQualityLog
from backend.models.transaction import Transaction
from backend.schemas.quality import QualitySummaryResponse, QualityCheckItem

router = APIRouter(tags=["Data Quality"])

@router.get("/quality/summary", response_model=QualitySummaryResponse, summary="Data Quality Summary")
def get_quality_summary(db: Session = Depends(get_db)):
    """Return overall data quality score and metric breakdown."""
    avg_score = db.query(func.avg(DataQualityLog.quality_score)).scalar()
    overall_score = round(float(avg_score), 1) if avg_score is not None else 100.0

    total_txns = db.query(func.count(Transaction.transaction_id)).scalar() or 0
    
    # Calculate counts from data quality checks
    missing_vals = (
        db.query(func.sum(DataQualityLog.invalid_record_count))
        .filter(DataQualityLog.check_type == "missing_values")
        .scalar()
        or 0
    )
    duplicate_recs = (
        db.query(func.sum(DataQualityLog.invalid_record_count))
        .filter(DataQualityLog.check_type == "duplicate_records")
        .scalar()
        or 0
    )
    invalid_dates = (
        db.query(func.sum(DataQualityLog.invalid_record_count))
        .filter(DataQualityLog.check_type == "invalid_dates")
        .scalar()
        or 0
    )
    invalid_numeric = (
        db.query(func.sum(DataQualityLog.invalid_record_count))
        .filter(DataQualityLog.check_type.in_(["negative_or_zero_value", "invalid_numeric"]))
        .scalar()
        or 0
    )

    invalid_total = missing_vals + duplicate_recs + invalid_dates + invalid_numeric
    valid_total = max(0, total_txns - invalid_total)

    return QualitySummaryResponse(
        overall_quality_score=overall_score,
        valid_records=valid_total,
        invalid_records=invalid_total,
        missing_values=missing_vals,
        duplicate_records=duplicate_recs,
        invalid_dates=invalid_dates,
        invalid_numeric_values=invalid_numeric,
    )

@router.get("/quality/checks", response_model=List[QualityCheckItem], summary="Data Quality Checks Log")
def get_quality_checks(
    status: Optional[str] = Query(None, description="Filter by status (PASS, WARNING, FAIL)"),
    table_name: Optional[str] = Query(None, description="Filter by table name"),
    db: Session = Depends(get_db),
):
    """Retrieve validation checks from data_quality_logs."""
    query = db.query(DataQualityLog)

    if status and status.upper() != "ALL":
        # Normalize status
        s = status.upper()
        if s == "PASSED":
            s = "PASS"
        elif s == "FAILED":
            s = "FAIL"
        query = query.filter(DataQualityLog.status == s)

    if table_name and table_name.lower() != "all":
        query = query.filter(DataQualityLog.table_name == table_name)

    records = query.order_by(DataQualityLog.created_at.desc()).all()

    result = []
    for r in records:
        # map check_type to human readable check title
        check_title = r.check_type.replace("_", " ").title()
        # map status to UI style: PASS -> PASSED, FAIL -> FAILED, WARNING -> WARNING
        ui_status = "PASSED" if r.status == "PASS" else ("FAILED" if r.status == "FAIL" else "WARNING")
        result.append(
            QualityCheckItem(
                id=r.quality_log_id,
                check=check_title,
                column=r.column_name or "all_columns",
                issues=r.invalid_record_count,
                status=ui_status,
                tableName=r.table_name,
                qualityScore=float(r.quality_score) if r.quality_score is not None else 100.0,
                createdAt=r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else None,
            )
        )

    return result
