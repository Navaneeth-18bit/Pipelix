from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from backend.database import get_db
from backend.schemas.anomaly import AnomalyResponse, PaginatedAnomalies

router = APIRouter(tags=["Anomalies"])


def format_response(anomaly, transaction):
    quantity = int(transaction["quantity"]) if transaction else 1
    unit_price = float(transaction["unit_price"]) if transaction else 0.0
    total = float(transaction["total_amount"]) if transaction and transaction.get("total_amount") is not None else quantity * unit_price
    return AnomalyResponse(
        anomalyId=anomaly["anomaly_id"],
        transactionId=anomaly["transaction_id"],
        amount=total,
        score=float(anomaly["anomaly_score"]),
        model=anomaly["model_name"],
        version=anomaly["model_version"],
        detectedAt=(anomaly.get("detected_at") or ""),
        status="ANOMALY" if anomaly["is_anomaly"] else "RESOLVED",
        customer=transaction["customer_id"] if transaction else "Unknown",
        product=transaction["product_id"] if transaction else "Unknown",
        date=(transaction.get("transaction_date") or "")[:10] if transaction else "",
        quantity=quantity,
        unitPrice=unit_price,
        paymentMethod=transaction["payment_method"] if transaction else "Unknown",
        location=(transaction.get("location") or "Unknown") if transaction else "Unknown",
    )


@router.get("/anomalies", response_model=PaginatedAnomalies)
def get_anomalies(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    db: Client = Depends(get_db),
):
    query = db.table("anomalies").select("*, transactions(*)").order("detected_at", desc=True)
    if min_score is not None:
        query = query.gte("anomaly_score", min_score)
    response = query.range((page - 1) * limit, page * limit - 1).execute()
    count = db.table("anomalies").select("anomaly_id", count="exact").limit(1).execute()
    data = []
    for anomaly in response.data:
        transaction = anomaly.get("transactions")
        if isinstance(transaction, list):
            transaction = transaction[0] if transaction else None
        if search:
            needle = search.lower()
            values = [
                anomaly["transaction_id"],
                transaction.get("customer_id", "") if transaction else "",
                transaction.get("product_id", "") if transaction else "",
            ]
            if not any(needle in str(value).lower() for value in values):
                continue
        data.append(format_response(anomaly, transaction))
    return PaginatedAnomalies(data=data, page=page, limit=limit, total=count.count or len(data))


@router.get("/anomalies/scatter")
def get_anomaly_scatter(db: Client = Depends(get_db)):
    response = db.table("anomalies").select("transaction_id,anomaly_score,is_anomaly,transactions(total_amount,quantity,unit_price)").limit(100).execute()
    result = []
    for anomaly in response.data:
        transaction = anomaly.get("transactions")
        if isinstance(transaction, list):
            transaction = transaction[0] if transaction else None
        if not transaction:
            continue
        quantity = float(transaction["quantity"])
        unit_price = float(transaction["unit_price"])
        amount = float(transaction["total_amount"]) if transaction.get("total_amount") is not None else quantity * unit_price
        result.append({"id": anomaly["transaction_id"], "amount": amount, "score": float(anomaly["anomaly_score"]), "type": "anomaly" if anomaly["is_anomaly"] else "normal"})
    return result


@router.get("/anomalies/{anomaly_id}", response_model=AnomalyResponse)
def get_anomaly_details(anomaly_id: int, db: Client = Depends(get_db)):
    response = db.table("anomalies").select("*, transactions(*)").eq("anomaly_id", anomaly_id).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail=f"Anomaly with ID {anomaly_id} not found")
    anomaly = response.data[0]
    transaction = anomaly.get("transactions")
    if isinstance(transaction, list):
        transaction = transaction[0] if transaction else None
    return format_response(anomaly, transaction)
