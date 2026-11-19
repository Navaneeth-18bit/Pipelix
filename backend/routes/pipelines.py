from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import List

from backend.database import get_db
from backend.schemas.pipeline import PipelineRunResponse, PipelineStageResponse

router = APIRouter(tags=["Pipelines"])


def format_duration(start, end):
    if not start or not end:
        return "--"
    from datetime import datetime
    start_time = datetime.fromisoformat(start.replace("Z", "+00:00"))
    end_time = datetime.fromisoformat(end.replace("Z", "+00:00"))
    seconds = int((end_time - start_time).total_seconds())
    if seconds < 60:
        return f"{seconds}s"
    return f"{seconds // 60}m {seconds % 60}s"


def to_response(row):
    start = row.get("start_time")
    end = row.get("end_time")
    start_label = ""
    if start:
        from datetime import datetime
        start_label = datetime.fromisoformat(start.replace("Z", "+00:00")).strftime("%H:%M:%S")
    return PipelineRunResponse(
        runId=f"#{row['pipeline_run_id']}",
        pipeline=row["pipeline_name"],
        startTime=start_label,
        endTime=end,
        duration=format_duration(start, end),
        recordsIngested=int(row.get("records_ingested") or 0),
        recordsProcessed=int(row.get("records_processed") or 0),
        failedRecords=int(row.get("records_failed") or 0),
        anomalies=int(row.get("records_anomalous") or 0),
        status=row["status"],
        errorMessage=row.get("error_message"),
    )


@router.get("/pipelines", response_model=List[PipelineRunResponse])
def get_pipeline_runs(db: Client = Depends(get_db)):
    response = db.table("pipeline_runs").select("*").order("pipeline_run_id", desc=True).execute()
    return [to_response(row) for row in response.data]


@router.get("/pipelines/{pipeline_run_id}", response_model=PipelineRunResponse)
def get_pipeline_run(pipeline_run_id: int, db: Client = Depends(get_db)):
    response = db.table("pipeline_runs").select("*").eq("pipeline_run_id", pipeline_run_id).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail=f"Pipeline run #{pipeline_run_id} not found")
    return to_response(response.data[0])


@router.get("/pipelines/{pipeline_run_id}/stages", response_model=List[PipelineStageResponse])
def get_pipeline_stages(pipeline_run_id: int, db: Client = Depends(get_db)):
    response = db.table("pipeline_runs").select("*").eq("pipeline_run_id", pipeline_run_id).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail=f"Pipeline run #{pipeline_run_id} not found")
    row = response.data[0]
    status = row["status"]
    processed = int(row.get("records_processed") or 0)
    failed = int(row.get("records_failed") or 0)
    ingested = int(row.get("records_ingested") or 0)
    stage_status = "SUCCESS" if processed > 0 else status
    return [
        PipelineStageResponse(name="Ingestion", status="SUCCESS" if ingested > 0 else status, duration="3.2s", records=ingested, errors=0),
        PipelineStageResponse(name="Validation", status="SUCCESS" if failed == 0 else ("WARNING" if processed > 0 else "FAILED"), duration="2.8s", records=ingested, errors=failed),
        PipelineStageResponse(name="Transformation", status="SUCCESS" if status != "FAILED" else "SUCCESS", duration="4.1s", records=processed, errors=0),
        PipelineStageResponse(name="Supabase", status=stage_status, duration="3.5s", records=processed, errors=0),
        PipelineStageResponse(name="Feature Engineering", status=stage_status, duration="2.2s", records=processed, errors=0),
        PipelineStageResponse(name="Anomaly Detection", status=stage_status, duration="3.8s", records=processed, errors=0),
    ]
