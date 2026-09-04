from pydantic import BaseModel
from typing import List, Optional

class QualitySummaryResponse(BaseModel):
    overall_quality_score: float
    valid_records: int
    invalid_records: int
    missing_values: int
    duplicate_records: int
    invalid_dates: int
    invalid_numeric_values: int

class QualityCheckItem(BaseModel):
    id: Optional[int] = None
    check: str
    column: str
    issues: int
    status: str
    tableName: Optional[str] = None
    qualityScore: Optional[float] = None
    createdAt: Optional[str] = None
