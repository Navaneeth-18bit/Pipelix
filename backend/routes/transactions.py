import csv
import io
import os
from decimal import Decimal, InvalidOperation
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from supabase import Client

from backend.database import get_db
from backend.schemas.transaction import TransactionResponse, TransactionDetailResponse, PaginatedTransactions

router = APIRouter(tags=["Transactions"])

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TRANSACTIONS_CSV_PATH = os.path.join(PROJECT_ROOT, "data", "raw", "fluxora_transactions.csv")

REQUIRED_IMPORT_COLUMNS = {
    "transaction_id", "customer_id", "product_id", "transaction_date",
    "quantity", "unit_price", "payment_method",
}


@router.post("/customers/import")
async def import_customers(file: UploadFile = File(...), db: Client = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")
    contents = await file.read()
    try:
        reader = csv.DictReader(io.StringIO(contents.decode("utf-8-sig")))
    except (UnicodeDecodeError, csv.Error) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {exc}")

    required = {"customer_id", "customer_name", "email", "city", "country"}
    missing = sorted(required - set(reader.fieldnames or []))
    if missing:
        return {"status": "rejected", "filename": file.filename, "total_rows": 0, "imported_rows": 0, "rejected_rows": 1, "errors": [{"message": "CSV is missing required columns", "missing_columns": missing}]}

    rows = list(reader)
    prepared = []
    seen = set()
    errors = []
    for number, row in enumerate(rows, 2):
        customer_id = (row.get("customer_id") or "").strip()
        customer_name = (row.get("customer_name") or "").strip()
        email = (row.get("email") or "").strip()
        if not customer_id or not customer_name or not email or "@" not in email:
            errors.append({"row": number, "message": "Invalid customer_id, customer_name, or email"})
        elif customer_id in seen:
            errors.append({"row": number, "message": f"Duplicate customer_id: {customer_id}"})
        else:
            seen.add(customer_id)
            prepared.append({
                "customer_id": customer_id,
                "customer_name": customer_name,
                "email": email,
                "city": (row.get("city") or "").strip() or None,
                "country": (row.get("country") or "").strip() or None,
                "created_at": (row.get("created_at") or "").strip() or datetime.now().isoformat(),
            })
    if errors:
        return {"status": "rejected", "filename": file.filename, "total_rows": len(rows), "imported_rows": 0, "rejected_rows": len(errors), "errors": errors[:50]}

    existing = db.table("customers").select("customer_id").in_("customer_id", list(seen)).execute()
    if existing.data:
        ids = sorted(row["customer_id"] for row in existing.data)
        return {"status": "rejected", "filename": file.filename, "total_rows": len(rows), "imported_rows": 0, "rejected_rows": len(ids), "errors": [{"message": f"Customer already exists: {value}"} for value in ids[:50]]}
    if prepared:
        db.table("customers").insert(prepared).execute()
    return {"status": "imported", "filename": file.filename, "total_rows": len(rows), "imported_rows": len(prepared), "rejected_rows": 0, "errors": []}


@router.post("/products/import")
async def import_products(file: UploadFile = File(...), db: Client = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")
    contents = await file.read()
    try:
        reader = csv.DictReader(io.StringIO(contents.decode("utf-8-sig")))
    except (UnicodeDecodeError, csv.Error) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {exc}")

    required = {"product_id", "product_name", "category", "unit_price"}
    missing = sorted(required - set(reader.fieldnames or []))
    if missing:
        return {"status": "rejected", "filename": file.filename, "total_rows": 0, "imported_rows": 0, "rejected_rows": 1, "errors": [{"message": "CSV is missing required columns", "missing_columns": missing}]}

    rows = list(reader)
    prepared = []
    seen = set()
    errors = []
    for number, row in enumerate(rows, 2):
        product_id = (row.get("product_id") or "").strip()
        product_name = (row.get("product_name") or "").strip()
        category = (row.get("category") or "").strip()
        try:
            unit_price = Decimal(row.get("unit_price") or "")
        except (InvalidOperation, ValueError):
            errors.append({"row": number, "message": "Invalid unit_price"})
            continue
        if not product_id or not product_name or not category:
            errors.append({"row": number, "message": "Required text fields cannot be empty"})
        elif product_id in seen:
            errors.append({"row": number, "message": f"Duplicate product_id: {product_id}"})
        elif unit_price <= 0:
            errors.append({"row": number, "message": "unit_price must be greater than zero"})
        else:
            seen.add(product_id)
            prepared.append({
                "product_id": product_id,
                "product_name": product_name,
                "category": category,
                "unit_price": float(unit_price),
                "created_at": (row.get("created_at") or "").strip() or datetime.now().isoformat(),
            })
    if errors:
        return {"status": "rejected", "filename": file.filename, "total_rows": len(rows), "imported_rows": 0, "rejected_rows": len(errors), "errors": errors[:50]}

    existing = db.table("products").select("product_id").in_("product_id", list(seen)).execute()
    if existing.data:
        ids = sorted(row["product_id"] for row in existing.data)
        return {"status": "rejected", "filename": file.filename, "total_rows": len(rows), "imported_rows": 0, "rejected_rows": len(ids), "errors": [{"message": f"Product already exists: {value}"} for value in ids[:50]]}
    if prepared:
        db.table("products").insert(prepared).execute()
    return {"status": "imported", "filename": file.filename, "total_rows": len(rows), "imported_rows": len(prepared), "rejected_rows": 0, "errors": []}


@router.post("/transactions/import")
async def import_transactions(file: UploadFile = File(...), db: Client = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")
    try:
        contents = await file.read()
        reader = csv.DictReader(io.StringIO(contents.decode("utf-8-sig")))
    except (UnicodeDecodeError, csv.Error) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {exc}")

    missing = sorted(REQUIRED_IMPORT_COLUMNS - set(reader.fieldnames or []))
    if missing:
        return {"status": "rejected", "filename": file.filename, "total_rows": 0, "imported_rows": 0, "rejected_rows": 1, "errors": [{"message": "CSV is missing required columns", "missing_columns": missing}], "required_columns": sorted(REQUIRED_IMPORT_COLUMNS)}

    rows = list(reader)
    prepared = []
    errors = []
    seen = set()
    for number, row in enumerate(rows, 2):
        transaction_id = (row.get("transaction_id") or "").strip()
        customer_id = (row.get("customer_id") or "").strip()
        product_id = (row.get("product_id") or "").strip()
        payment_method = (row.get("payment_method") or "").strip()
        try:
            quantity = int(row.get("quantity") or "")
            unit_price = Decimal(row.get("unit_price") or "")
            transaction_date = datetime.fromisoformat((row.get("transaction_date") or "").strip())
        except (ValueError, InvalidOperation):
            errors.append({"row": number, "message": "Invalid date, quantity, or unit_price"})
            continue
        if not transaction_id or not customer_id or not product_id or not payment_method:
            errors.append({"row": number, "message": "Required text fields cannot be empty"})
        elif transaction_id in seen:
            errors.append({"row": number, "message": f"Duplicate transaction_id: {transaction_id}"})
        elif quantity <= 0 or unit_price <= 0:
            errors.append({"row": number, "message": "quantity and unit_price must be greater than zero"})
        else:
            seen.add(transaction_id)
            prepared.append({
                "transaction_id": transaction_id,
                "customer_id": customer_id,
                "product_id": product_id,
                "transaction_date": transaction_date.isoformat(),
                "quantity": quantity,
                "unit_price": float(unit_price),
                "payment_method": payment_method,
                "location": (row.get("location") or "").strip() or None,
                "created_at": (row.get("created_at") or "").strip() or datetime.now().isoformat(),
            })
    if errors:
        return {"status": "rejected", "filename": file.filename, "total_rows": len(rows), "imported_rows": 0, "rejected_rows": len(errors), "errors": errors[:50]}
    if not prepared:
        return {"status": "rejected", "filename": file.filename, "total_rows": 0, "imported_rows": 0, "rejected_rows": 0, "errors": []}

    customer_ids = {row["customer_id"] for row in prepared}
    product_ids = {row["product_id"] for row in prepared}
    customers = db.table("customers").select("customer_id").in_("customer_id", list(customer_ids)).execute()
    products = db.table("products").select("product_id").in_("product_id", list(product_ids)).execute()
    valid_customers = {row["customer_id"] for row in customers.data}
    valid_products = {row["product_id"] for row in products.data}
    reference_errors = []
    for row in prepared:
        if row["customer_id"] not in valid_customers:
            reference_errors.append({"message": f"Unknown customer_id: {row['customer_id']}"})
        if row["product_id"] not in valid_products:
            reference_errors.append({"message": f"Unknown product_id: {row['product_id']}"})
    if reference_errors:
        return {"status": "rejected", "filename": file.filename, "total_rows": len(rows), "imported_rows": 0, "rejected_rows": len(reference_errors), "errors": reference_errors[:50]}

    existing = db.table("transactions").select("transaction_id").in_("transaction_id", list(seen)).execute()
    if existing.data:
        duplicate_ids = sorted(row["transaction_id"] for row in existing.data)
        return {"status": "rejected", "filename": file.filename, "total_rows": len(rows), "imported_rows": 0, "rejected_rows": len(duplicate_ids), "errors": [{"message": f"Transaction already exists: {value}"} for value in duplicate_ids[:50]]}

    db.table("transactions").insert(prepared).execute()
    os.makedirs(os.path.dirname(TRANSACTIONS_CSV_PATH), exist_ok=True)
    temp_path = TRANSACTIONS_CSV_PATH + ".tmp"
    with open(temp_path, "wb") as temp_file:
        temp_file.write(contents)
    os.replace(temp_path, TRANSACTIONS_CSV_PATH)

    return {"status": "imported", "filename": file.filename, "total_rows": len(rows), "imported_rows": len(prepared), "rejected_rows": 0, "csv_saved_as": "data/raw/fluxora_transactions.csv", "processing_status": "completed", "processing_error": None, "errors": []}


@router.get("/transactions", response_model=PaginatedTransactions)
def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Client = Depends(get_db),
):
    response = db.table("transactions").select(
        "*, anomalies(anomaly_id,anomaly_score,is_anomaly)"
    ).order("transaction_date", desc=True).range((page - 1) * limit, page * limit - 1).execute()
    count_response = db.table("transactions").select("transaction_id", count="exact").limit(1).execute()
    data = []
    for row in response.data:
        anomaly = row.get("anomalies")
        anomaly_row = anomaly[0] if isinstance(anomaly, list) and anomaly else None
        status = "VALID"
        score = None
        if anomaly_row:
            score = float(anomaly_row["anomaly_score"])
            if anomaly_row["is_anomaly"]:
                status = "ANOMALY"
        quantity = int(row["quantity"])
        unit_price = float(row["unit_price"])
        total = float(row["total_amount"]) if row.get("total_amount") is not None else quantity * unit_price
        data.append(TransactionResponse(
            id=row["transaction_id"], customerId=row["customer_id"], productId=row["product_id"],
            date=row["transaction_date"], quantity=quantity, unitPrice=unit_price,
            totalAmount=total, paymentMethod=row["payment_method"],
            location=row.get("location") or "Unknown", status=status, anomalyScore=score,
        ))
    return PaginatedTransactions(data=data, page=page, limit=limit, total=count_response.count or len(data))


@router.get("/transactions/{transaction_id}", response_model=TransactionDetailResponse)
def get_transaction_details(transaction_id: str, db: Client = Depends(get_db)):
    transaction = db.table("transactions").select(
        "*, customers(customer_name,email), products(product_name,category), anomalies(*)"
    ).eq("transaction_id", transaction_id).limit(1).execute()
    if not transaction.data:
        raise HTTPException(status_code=404, detail=f"Transaction '{transaction_id}' not found")
    row = transaction.data[0]
    anomaly = row.get("anomalies")
    anomaly_row = anomaly[0] if isinstance(anomaly, list) and anomaly else None
    customer = row.get("customers") or {}
    product = row.get("products") or {}
    quantity = int(row["quantity"])
    unit_price = float(row["unit_price"])
    status = "ANOMALY" if anomaly_row and anomaly_row["is_anomaly"] else "VALID"
    return TransactionDetailResponse(
        id=row["transaction_id"], customerId=row["customer_id"], productId=row["product_id"],
        date=row["transaction_date"], quantity=quantity, unitPrice=unit_price,
        totalAmount=float(row["total_amount"]) if row.get("total_amount") is not None else quantity * unit_price,
        paymentMethod=row["payment_method"], location=row.get("location") or "Unknown",
        status=status,
        anomalyScore=float(anomaly_row["anomaly_score"]) if anomaly_row else None,
        customerName=customer.get("customer_name"), customerEmail=customer.get("email"),
        productName=product.get("product_name"), productCategory=product.get("category"),
        anomalyDetails=anomaly_row,
    )
