import csv
import io
import os
import tempfile
from decimal import Decimal, InvalidOperation
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
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

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TRANSACTIONS_CSV_PATH = os.path.join(PROJECT_ROOT, "data", "raw", "fluxora_transactions.csv")

REQUIRED_IMPORT_COLUMNS = {
    "transaction_id",
    "customer_id",
    "product_id",
    "transaction_date",
    "quantity",
    "unit_price",
    "payment_method",
}


@router.post("/transactions/import", summary="Import Transactions CSV")
async def import_transactions(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Validate and atomically import transaction rows from a CSV file."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    try:
        contents = await file.read()
        reader = csv.DictReader(io.StringIO(contents.decode("utf-8-sig")))
    except (UnicodeDecodeError, csv.Error) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {exc}") from exc

    headers = set(reader.fieldnames or [])
    missing_columns = sorted(REQUIRED_IMPORT_COLUMNS - headers)
    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "CSV is missing required columns",
                "missing_columns": missing_columns,
                "required_columns": sorted(REQUIRED_IMPORT_COLUMNS),
            },
        )

    rows = list(reader)
    errors = []
    prepared_rows = []
    seen_ids = set()

    for row_number, row in enumerate(rows, start=2):
        transaction_id = (row.get("transaction_id") or "").strip()
        customer_id = (row.get("customer_id") or "").strip()
        product_id = (row.get("product_id") or "").strip()
        payment_method = (row.get("payment_method") or "").strip()
        try:
            quantity = int(row.get("quantity", ""))
            unit_price = Decimal(row.get("unit_price", ""))
            transaction_date = datetime.fromisoformat((row.get("transaction_date") or "").strip())
        except (ValueError, InvalidOperation):
            errors.append({"row": row_number, "message": "Invalid date, quantity, or unit_price"})
            continue

        if not transaction_id or not customer_id or not product_id or not payment_method:
            errors.append({"row": row_number, "message": "Required text fields cannot be empty"})
        elif transaction_id in seen_ids:
            errors.append({"row": row_number, "message": f"Duplicate transaction_id: {transaction_id}"})
        elif quantity <= 0 or unit_price <= 0:
            errors.append({"row": row_number, "message": "quantity and unit_price must be greater than zero"})
        else:
            seen_ids.add(transaction_id)
            prepared_rows.append(
                Transaction(
                    transaction_id=transaction_id,
                    customer_id=customer_id,
                    product_id=product_id,
                    transaction_date=transaction_date,
                    quantity=quantity,
                    unit_price=unit_price,
                    payment_method=payment_method,
                    location=(row.get("location") or "").strip() or None,
                )
            )

    if errors:
        return {
            "status": "rejected",
            "filename": file.filename,
            "total_rows": len(rows),
            "imported_rows": 0,
            "rejected_rows": len(errors),
            "errors": errors[:50],
        }

    if prepared_rows:
        customer_ids = {row.customer_id for row in prepared_rows}
        product_ids = {row.product_id for row in prepared_rows}
        existing_customers = {
            value for (value,) in db.query(Customer.customer_id).filter(Customer.customer_id.in_(customer_ids)).all()
        }
        existing_products = {
            value for (value,) in db.query(Product.product_id).filter(Product.product_id.in_(product_ids)).all()
        }
        reference_errors = []
        for row in prepared_rows:
            if row.customer_id not in existing_customers:
                reference_errors.append({"message": f"Unknown customer_id: {row.customer_id}"})
            if row.product_id not in existing_products:
                reference_errors.append({"message": f"Unknown product_id: {row.product_id}"})
        if reference_errors:
            return {
                "status": "rejected",
                "filename": file.filename,
                "total_rows": len(rows),
                "imported_rows": 0,
                "rejected_rows": len(reference_errors),
                "errors": reference_errors[:50],
            }

        existing_ids = {
            value for (value,) in db.query(Transaction.transaction_id).filter(Transaction.transaction_id.in_(seen_ids)).all()
        }
        duplicate_ids = sorted(existing_ids)
        if duplicate_ids:
            return {
                "status": "rejected",
                "filename": file.filename,
                "total_rows": len(rows),
                "imported_rows": 0,
                "rejected_rows": len(duplicate_ids),
                "errors": [{"message": f"Transaction already exists: {value}"} for value in duplicate_ids[:50]],
            }

        os.makedirs(os.path.dirname(TRANSACTIONS_CSV_PATH), exist_ok=True)
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(
                mode="wb",
                suffix=".csv",
                dir=os.path.dirname(TRANSACTIONS_CSV_PATH),
                delete=False,
            ) as temp_file:
                temp_file.write(contents)
                temp_path = temp_file.name
        except OSError as exc:
            raise HTTPException(status_code=500, detail=f"Could not save CSV file: {exc}") from exc

        db.add_all(prepared_rows)
        try:
            db.commit()
            os.replace(temp_path, TRANSACTIONS_CSV_PATH)
        except (OSError, Exception) as exc:
            db.rollback()
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(status_code=500, detail=f"Could not complete transaction import: {exc}") from exc

    processing_error = None
    try:
        from etl.data_pipeline import run_etl_pipeline
        from ml.anomaly_detection import run_anomaly_detection

        run_etl_pipeline()
        run_anomaly_detection()
    except Exception as exc:
        processing_error = str(exc)

    return {
        "status": "imported",
        "filename": file.filename,
        "total_rows": len(rows),
        "imported_rows": len(prepared_rows),
        "rejected_rows": 0,
        "csv_saved_as": "data/raw/fluxora_transactions.csv",
        "processing_status": "completed" if processing_error is None else "failed",
        "processing_error": processing_error,
        "errors": [],
    }

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
