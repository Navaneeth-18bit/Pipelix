from pydantic import BaseModel
from typing import List, Optional

class PipelineRunResponse(BaseModel):
    runId: str
    pipeline: str
    startTime: str
    endTime: Optional[str] = None
    duration: str
    recordsIngested: int
    recordsProcessed: int
    failedRecords: int
    anomalies: int
    status: str
    errorMessage: Optional[str] = None

class PipelineStageResponse(BaseModel):
    name: str
    status: str
    duration: str
    records: int
    errors: int
