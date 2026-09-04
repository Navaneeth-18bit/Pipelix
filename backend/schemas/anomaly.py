from pydantic import BaseModel
from typing import List, Optional

class AnomalyResponse(BaseModel):
    anomalyId: int
    transactionId: str
    amount: float
    score: float
    model: str
    version: str
    detectedAt: str
    status: str
    customer: str
    product: str
    date: str
    quantity: int
    unitPrice: float
    paymentMethod: str
    location: str

class PaginatedAnomalies(BaseModel):
    data: List[AnomalyResponse]
    page: int
    limit: int
    total: int
