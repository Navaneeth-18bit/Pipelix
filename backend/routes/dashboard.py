from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List

from backend.database import get_db
from backend.models.transaction import Transaction
from backend.models.anomaly import Anomaly
from backend.models.pipeline import PipelineRun
from backend.models.quality import DataQualityLog
from backend.schemas.dashboard import DashboardSummaryResponse, ThroughputItem, QualityTrendItem

router = APIRouter(tags=["Dashboard"])

@router.get("/dashboard/summary", response_model=DashboardSummaryResponse, summary="Dashboard KPI Summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Return key metrics and aggregations from the PostgreSQL database."""
    total_txns = db.query(func.count(Transaction.transaction_id)).scalar() or 0
    
    # Calculate overall data quality score
    dq_score_avg = db.query(func.avg(DataQualityLog.quality_score)).scalar()
    dq_score = round(float(dq_score_avg), 1) if dq_score_avg is not None else 100.0

    # Anomalies count
    anomalies_count = db.query(func.count(Anomaly.anomaly_id)).filter(Anomaly.is_anomaly == True).scalar() or 0

    # Failed records across pipeline runs
    failed_recs = db.query(func.sum(PipelineRun.records_failed)).scalar() or 0

    # Pipeline runs total
    total_runs = db.query(func.count(PipelineRun.pipeline_run_id)).scalar() or 0

    # Pipeline success rate
    success_runs = db.query(func.count(PipelineRun.pipeline_run_id)).filter(PipelineRun.status == "SUCCESS").scalar() or 0
    success_rate = round((success_runs / total_runs) * 100, 1) if total_runs > 0 else 100.0

    return DashboardSummaryResponse(
        total_transactions=total_txns,
        data_quality_score=dq_score,
        anomalies=anomalies_count,
        failed_records=failed_recs,
        pipeline_runs=total_runs,
        pipeline_success_rate=success_rate,
    )

@router.get("/dashboard/throughput", response_model=List[ThroughputItem], summary="Pipeline Throughput Timeline")
def get_dashboard_throughput(db: Session = Depends(get_db)):
    """Return throughput history for charts."""
    runs = (
        db.query(PipelineRun)
        .order_by(PipelineRun.start_time.asc())
        .limit(10)
        .all()
    )
    res = []
    for r in runs:
        t_str = r.start_time.strftime("%H:%M") if r.start_time else "00:00"
        res.append(ThroughputItem(
            time=t_str,
            records=r.records_ingested,
            anomalies=r.records_anomalous,
        ))
    return res

@router.get("/dashboard/trends", response_model=List[QualityTrendItem], summary="Historical Quality Trends")
def get_dashboard_trends(db: Session = Depends(get_db)):
    """Return quality score trends across recent runs."""
    runs = (
        db.query(PipelineRun)
        .order_by(PipelineRun.pipeline_run_id.asc())
        .limit(10)
        .all()
    )
    res = []
    for r in runs:
        # compute avg quality score for run
        avg_q = db.query(func.avg(DataQualityLog.quality_score)).filter(DataQualityLog.pipeline_run_id == r.pipeline_run_id).scalar()
        q_val = round(float(avg_q), 1) if avg_q is not None else 100.0
        res.append(QualityTrendItem(
            run=f"Run #{r.pipeline_run_id}",
            quality=q_val,
        ))
    return res
