from pydantic import BaseModel
from typing import List, Optional

class DashboardSummaryResponse(BaseModel):
    total_transactions: int
    data_quality_score: float
    anomalies: int
    failed_records: int
    pipeline_runs: int
    pipeline_success_rate: float

class ThroughputItem(BaseModel):
    time: str
    records: int
    anomalies: int

class QualityTrendItem(BaseModel):
    run: str
    quality: float
