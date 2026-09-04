from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from typing import Optional, List
from datetime import datetime

from backend.database import get_db
from backend.models.anomaly import Anomaly
from backend.models.transaction import Transaction
from backend.schemas.anomaly import AnomalyResponse, PaginatedAnomalies

router = APIRouter(tags=["Anomalies"])

@router.get("/anomalies", response_model=PaginatedAnomalies, summary="List Anomalies")
def get_anomalies(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search transaction, customer, or product ID"),
    min_score: Optional[float] = Query(None, description="Minimum anomaly score"),
    date_from: Optional[str] = Query(None, description="Filter date from"),
    date_to: Optional[str] = Query(None, description="Filter date to"),
    sort_by: Optional[str] = Query("detected_at", description="Field to sort by"),
    sort_dir: Optional[str] = Query("desc", description="Sort direction"),
    db: Session = Depends(get_db),
):
    """Retrieve paginated anomaly records with transaction context."""
    query = db.query(Anomaly).join(Transaction, Anomaly.transaction_id == Transaction.transaction_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Anomaly.transaction_id.ilike(s),
                Transaction.customer_id.ilike(s),
                Transaction.product_id.ilike(s),
            )
        )

    if min_score is not None:
        query = query.filter(Anomaly.anomaly_score >= min_score)

    if date_from:
        try:
            d_from = datetime.fromisoformat(date_from)
            query = query.filter(Anomaly.detected_at >= d_from)
        except ValueError:
            pass

    if date_to:
        try:
            d_to = datetime.fromisoformat(date_to)
            query = query.filter(Anomaly.detected_at <= d_to)
        except ValueError:
            pass

    total = query.count()

    sort_column = getattr(Anomaly, sort_by, Anomaly.detected_at)
    if sort_dir.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    items = query.offset((page - 1) * limit).limit(limit).all()

    data = []
    for a in items:
        t = a.transaction
        status_label = "ANOMALY" if a.is_anomaly else "RESOLVED"
        data.append(
            AnomalyResponse(
                anomalyId=a.anomaly_id,
                transactionId=a.transaction_id,
                amount=float(t.total_amount) if (t and t.total_amount is not None) else (float(t.quantity * t.unit_price) if t else 0.0),
                score=float(a.anomaly_score),
                model=a.model_name,
                version=a.model_version,
                detectedAt=a.detected_at.strftime("%I:%M %p") if a.detected_at else "",
                status=status_label,
                customer=t.customer_id if t else "Unknown",
                product=t.product_id if t else "Unknown",
                date=t.transaction_date.strftime("%Y-%m-%d") if (t and t.transaction_date) else "",
                quantity=t.quantity if t else 1,
                unitPrice=float(t.unit_price) if (t and t.unit_price is not None) else 0.0,
                paymentMethod=t.payment_method if t else "Unknown",
                location=t.location if (t and t.location) else "Unknown",
            )
        )

    return PaginatedAnomalies(
        data=data,
        page=page,
        limit=limit,
        total=total,
    )

@router.get("/anomalies/scatter", summary="Scatter Plot Data")
def get_anomaly_scatter(db: Session = Depends(get_db)):
    """Return transaction amount vs anomaly score for scatter plot visualization."""
    records = (
        db.query(Anomaly, Transaction)
        .join(Transaction, Anomaly.transaction_id == Transaction.transaction_id)
        .limit(100)
        .all()
    )
    result = []
    for a, t in records:
        amt = float(t.total_amount) if t.total_amount is not None else float(t.quantity * t.unit_price)
        result.append({
            "id": a.transaction_id,
            "amount": amt,
            "score": float(a.anomaly_score),
            "type": "anomaly" if a.is_anomaly else "normal",
        })
    return result

@router.get("/anomalies/{anomaly_id}", response_model=AnomalyResponse, summary="Get Anomaly Details")
def get_anomaly_details(anomaly_id: int, db: Session = Depends(get_db)):
    """Retrieve full details of a specific anomaly record."""
    a = db.query(Anomaly).filter(Anomaly.anomaly_id == anomaly_id).first()
    if not a:
        raise HTTPException(status_code=404, detail=f"Anomaly with ID {anomaly_id} not found")

    t = a.transaction
    status_label = "ANOMALY" if a.is_anomaly else "RESOLVED"
    return AnomalyResponse(
        anomalyId=a.anomaly_id,
        transactionId=a.transaction_id,
        amount=float(t.total_amount) if (t and t.total_amount is not None) else (float(t.quantity * t.unit_price) if t else 0.0),
        score=float(a.anomaly_score),
        model=a.model_name,
        version=a.model_version,
        detectedAt=a.detected_at.strftime("%I:%M %p") if a.detected_at else "",
        status=status_label,
        customer=t.customer_id if t else "Unknown",
        product=t.product_id if t else "Unknown",
        date=t.transaction_date.strftime("%Y-%m-%d") if (t and t.transaction_date) else "",
        quantity=t.quantity if t else 1,
        unitPrice=float(t.unit_price) if (t and t.unit_price is not None) else 0.0,
        paymentMethod=t.payment_method if t else "Unknown",
        location=t.location if (t and t.location) else "Unknown",
    )
