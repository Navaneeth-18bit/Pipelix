import os
import csv
import sys
from datetime import datetime
from dotenv import load_dotenv
import psycopg

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgresql@127.0.0.1:5432/pipelix_db")
RAW_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "raw")
PROJECT_ROOT = os.path.dirname(os.path.dirname(RAW_DATA_DIR))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Normalize SQLAlchemy URL to psycopg connection string
conn_str = DATABASE_URL.replace("postgresql+psycopg://", "postgresql://")

def seed():
    print(f"Connecting to database: {conn_str}")
    with psycopg.connect(conn_str) as conn:
        with conn.cursor() as cur:
            # 1. Customers
            cust_csv = os.path.join(RAW_DATA_DIR, "fluxora_customers.csv")
            if os.path.exists(cust_csv):
                with open(cust_csv, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        cur.execute(
                            """
                            INSERT INTO customers (customer_id, customer_name, email, city, country, created_at)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            ON CONFLICT (customer_id) DO NOTHING;
                            """,
                            (row["customer_id"], row["customer_name"], row["email"], row["city"], row["country"], row["created_at"])
                        )
                print("Customers seeded.")

            # 2. Products
            prod_csv = os.path.join(RAW_DATA_DIR, "fluxora_products.csv")
            if os.path.exists(prod_csv):
                with open(prod_csv, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        cur.execute(
                            """
                            INSERT INTO products (product_id, product_name, category, unit_price, created_at)
                            VALUES (%s, %s, %s, %s, %s)
                            ON CONFLICT (product_id) DO NOTHING;
                            """,
                            (row["product_id"], row["product_name"], row["category"], float(row["unit_price"]), row["created_at"])
                        )
                print("Products seeded.")

            # 3. Transactions
            txn_csv = os.path.join(RAW_DATA_DIR, "fluxora_transactions.csv")
            if os.path.exists(txn_csv):
                with open(txn_csv, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        cur.execute(
                            """
                            INSERT INTO transactions (transaction_id, customer_id, product_id, transaction_date, quantity, unit_price, payment_method, location, created_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (transaction_id) DO NOTHING;
                            """,
                            (
                                row["transaction_id"], row["customer_id"], row["product_id"],
                                row["transaction_date"], int(row["quantity"]), float(row["unit_price"]),
                                row["payment_method"], row["location"], row["created_at"]
                            )
                        )
                print("Transactions seeded.")

        conn.commit()
    print("Database seeding completed successfully.")

    # Derive operational results from the three source tables.
    from etl.data_pipeline import run_etl_pipeline
    from ml.anomaly_detection import run_anomaly_detection

    run_etl_pipeline()
    run_anomaly_detection()

if __name__ == "__main__":
    seed()
