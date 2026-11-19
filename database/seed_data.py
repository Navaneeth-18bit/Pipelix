import csv
import os
from decimal import Decimal

from dotenv import load_dotenv

from backend.database import get_supabase

load_dotenv()

RAW_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "raw")


def read_rows(filename):
    with open(os.path.join(RAW_DATA_DIR, filename), "r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def seed():
    db = get_supabase()

    customers = read_rows("fluxora_customers.csv")
    db.table("customers").upsert([
        {
            "customer_id": row["customer_id"].strip(),
            "customer_name": row["customer_name"].strip(),
            "email": row["email"].strip(),
            "city": row["city"].strip(),
            "country": row["country"].strip(),
            "created_at": row["created_at"].strip(),
        }
        for row in customers
    ], on_conflict="customer_id").execute()

    products = read_rows("fluxora_products.csv")
    db.table("products").upsert([
        {
            "product_id": row["product_id"].strip(),
            "product_name": row["product_name"].strip(),
            "category": row["category"].strip(),
            "unit_price": float(Decimal(row["unit_price"])),
            "created_at": row["created_at"].strip(),
        }
        for row in products
    ], on_conflict="product_id").execute()

    transactions = read_rows("fluxora_transactions.csv")
    valid_transactions = []
    for row in transactions:
        quantity = int(row["quantity"])
        unit_price = float(Decimal(row["unit_price"]))
        if quantity <= 0 or unit_price <= 0:
            raise ValueError(f"Invalid quantity or unit_price for transaction {row['transaction_id']}")
        valid_transactions.append({
            "transaction_id": row["transaction_id"].strip(),
            "customer_id": row["customer_id"].strip(),
            "product_id": row["product_id"].strip(),
            "transaction_date": row["transaction_date"].strip(),
            "quantity": quantity,
            "unit_price": unit_price,
            "payment_method": row["payment_method"].strip(),
            "location": (row.get("location") or "").strip() or None,
            "created_at": row["created_at"].strip(),
        })
    db.table("transactions").upsert(valid_transactions, on_conflict="transaction_id").execute()
    print(f"Seeded {len(customers)} customers, {len(products)} products, and {len(valid_transactions)} transactions.")


if __name__ == "__main__":
    seed()
