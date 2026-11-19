from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends
from supabase import Client

from backend.database import get_db
from backend.schemas.dashboard import DashboardSummaryResponse, ThroughputItem, QualityTrendItem

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Client = Depends(get_db)):
    transactions = db.table("transactions").select("transaction_id", count="exact").execute()
    quality = db.table("data_quality_logs").select("quality_score").execute()
    anomalies = db.table("anomalies").select("anomaly_id", count="exact").eq("is_anomaly", True).execute()
    runs = db.table("pipeline_runs").select("pipeline_run_id,status,records_failed").execute()

    dq_scores = [float(row["quality_score"]) for row in quality.data if row.get("quality_score") is not None]
    dq_score = round(sum(dq_scores) / len(dq_scores), 1) if dq_scores else 100.0
    failed_records = sum(int(row.get("records_failed") or 0) for row in runs.data)
    total_runs = len(runs.data)
    success_runs = sum(row.get("status") == "SUCCESS" for row in runs.data)

    return DashboardSummaryResponse(
        total_transactions=transactions.count or len(transactions.data),
        data_quality_score=dq_score,
        anomalies=anomalies.count or len(anomalies.data),
        failed_records=failed_records,
        pipeline_runs=total_runs,
        pipeline_success_rate=round(success_runs / total_runs * 100, 1) if total_runs else 100.0,
    )


@router.get("/dashboard/throughput", response_model=List[ThroughputItem])
def get_dashboard_throughput(db: Client = Depends(get_db)):
    response = db.table("pipeline_runs").select(
        "pipeline_run_id,start_time,records_ingested,records_anomalous"
    ).order("start_time", desc=False).limit(10).execute()

    items = []
    for row in response.data:
        start_time = row.get("start_time")
        if start_time:
            time = datetime.fromisoformat(start_time.replace("Z", "+00:00")).strftime("%H:%M")
        else:
            time = "00:00"
        items.append(ThroughputItem(
            time=time,
            records=int(row.get("records_ingested") or 0),
            anomalies=int(row.get("records_anomalous") or 0),
        ))
    return items


@router.get("/dashboard/trends", response_model=List[QualityTrendItem])
def get_dashboard_trends(db: Client = Depends(get_db)):
    runs = db.table("pipeline_runs").select(
        "pipeline_run_id"
    ).order("pipeline_run_id", desc=False).limit(10).execute()

    items = []
    for run in runs.data:
        run_id = run["pipeline_run_id"]
        logs = db.table("data_quality_logs").select("quality_score").eq(
            "pipeline_run_id", run_id
        ).execute()
        scores = [float(row["quality_score"]) for row in logs.data if row.get("quality_score") is not None]
        quality = round(sum(scores) / len(scores), 1) if scores else 100.0
        items.append(QualityTrendItem(run=f"Run #{run_id}", quality=quality))
    return items
