from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from typing import Optional
from datetime import datetime

from backend.database import get_db
from backend.models.transaction import Transaction
from backend.models.customer import Customer
from backend.models.product import Product
from backend.models.anomaly import Anomaly
from backend.schemas.transaction import TransactionResponse, TransactionDetailResponse, PaginatedTransactions

router = APIRouter(tags=["Transactions"])

@router.get("/transactions", response_model=PaginatedTransactions, summary="List Transactions")
def get_transactions(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search transaction, customer, or product ID"),
    date_from: Optional[str] = Query(None, description="Filter date from (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter date to (YYYY-MM-DD)"),
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    product_id: Optional[str] = Query(None, description="Filter by product ID"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method"),
    location: Optional[str] = Query(None, description="Filter by location"),
    sort_by: Optional[str] = Query("transaction_date", description="Field to sort by"),
    sort_dir: Optional[str] = Query("desc", description="Sort direction: asc or desc"),
    db: Session = Depends(get_db),
):
    """Retrieve paginated transactions with flexible filtering and sorting."""
    query = db.query(Transaction).outerjoin(Anomaly, Transaction.transaction_id == Anomaly.transaction_id)

    # Search filter
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.transaction_id.ilike(s),
                Transaction.customer_id.ilike(s),
                Transaction.product_id.ilike(s),
                Transaction.location.ilike(s),
            )
        )

    # Date filters
    if date_from:
        try:
            d_from = datetime.fromisoformat(date_from)
            query = query.filter(Transaction.transaction_date >= d_from)
        except ValueError:
            pass

    if date_to:
        try:
            d_to = datetime.fromisoformat(date_to)
            query = query.filter(Transaction.transaction_date <= d_to)
        except ValueError:
            pass

    # Exact filters
    if customer_id and customer_id != "All":
        query = query.filter(Transaction.customer_id == customer_id)
    if product_id and product_id != "All":
        query = query.filter(Transaction.product_id == product_id)
    if payment_method and payment_method != "All":
        query = query.filter(Transaction.payment_method == payment_method)
    if location and location != "All":
        query = query.filter(Transaction.location == location)

    # Count total matching
    total = query.count()

    # Sorting
    sort_column = getattr(Transaction, sort_by, Transaction.transaction_date)
    if sort_dir.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Pagination
    items = query.offset((page - 1) * limit).limit(limit).all()

    data = []
    for t in items:
        status = "VALID"
        anomaly_score = None
        if t.anomaly:
            anomaly_score = float(t.anomaly.anomaly_score)
            if t.anomaly.is_anomaly:
                status = "ANOMALY"
        if t.quantity <= 0 or (t.unit_price is not None and t.unit_price <= 0):
            status = "INVALID"

        data.append(
            TransactionResponse(
                id=t.transaction_id,
                customerId=t.customer_id,
                productId=t.product_id,
                date=t.transaction_date.strftime("%Y-%m-%d %H:%M:%S") if t.transaction_date else "",
                quantity=t.quantity,
                unitPrice=float(t.unit_price) if t.unit_price is not None else 0.0,
                totalAmount=float(t.total_amount) if t.total_amount is not None else float(t.quantity * t.unit_price),
                paymentMethod=t.payment_method,
                location=t.location or "Unknown",
                status=status,
                anomalyScore=anomaly_score,
            )
        )

    return PaginatedTransactions(
        data=data,
        page=page,
        limit=limit,
        total=total,
    )

@router.get("/transactions/{transaction_id}", response_model=TransactionDetailResponse, summary="Get Transaction Details")
def get_transaction_details(transaction_id: str, db: Session = Depends(get_db)):
    """Retrieve full details of a specific transaction including associated customer, product, and anomaly data."""
    t = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not t:
        raise HTTPException(status_code=404, detail=f"Transaction '{transaction_id}' not found")

    status = "VALID"
    anomaly_score = None
    anomaly_details = None
    if t.anomaly:
        anomaly_score = float(t.anomaly.anomaly_score)
        if t.anomaly.is_anomaly:
            status = "ANOMALY"
        anomaly_details = {
            "anomaly_id": t.anomaly.anomaly_id,
            "anomaly_score": float(t.anomaly.anomaly_score),
            "is_anomaly": t.anomaly.is_anomaly,
            "model_name": t.anomaly.model_name,
            "model_version": t.anomaly.model_version,
            "detected_at": t.anomaly.detected_at.strftime("%Y-%m-%d %H:%M:%S") if t.anomaly.detected_at else "",
        }

    if t.quantity <= 0 or (t.unit_price is not None and t.unit_price <= 0):
        status = "INVALID"

    return TransactionDetailResponse(
        id=t.transaction_id,
        customerId=t.customer_id,
        productId=t.product_id,
        date=t.transaction_date.strftime("%Y-%m-%d %H:%M:%S") if t.transaction_date else "",
        quantity=t.quantity,
        unitPrice=float(t.unit_price) if t.unit_price is not None else 0.0,
        totalAmount=float(t.total_amount) if t.total_amount is not None else float(t.quantity * t.unit_price),
        paymentMethod=t.payment_method,
        location=t.location or "Unknown",
        status=status,
        anomalyScore=anomaly_score,
        customerName=t.customer.customer_name if t.customer else None,
        customerEmail=t.customer.email if t.customer else None,
        productName=t.product.product_name if t.product else None,
        productCategory=t.product.category if t.product else None,
        anomalyDetails=anomaly_details,
    )
