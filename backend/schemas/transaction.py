from pydantic import BaseModel
from typing import List, Optional

class TransactionResponse(BaseModel):
    id: str
    customerId: str
    productId: str
    date: str
    quantity: int
    unitPrice: float
    totalAmount: float
    paymentMethod: str
    location: str
    status: str
    anomalyScore: Optional[float] = None

class TransactionDetailResponse(TransactionResponse):
    customerName: Optional[str] = None
    customerEmail: Optional[str] = None
    productName: Optional[str] = None
    productCategory: Optional[str] = None
    anomalyDetails: Optional[dict] = None

class PaginatedTransactions(BaseModel):
    data: List[TransactionResponse]
    page: int
    limit: int
    total: int
