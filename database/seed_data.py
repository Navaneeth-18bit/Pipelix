import os
import csv
from datetime import datetime
from dotenv import load_dotenv
import psycopg

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgresql@127.0.0.1:5432/pipelix_db")
RAW_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "raw")

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

            # 4. Pipeline Runs
            pipeline_csv = os.path.join(RAW_DATA_DIR, "fluxora_pipeline_runs.csv")
            if os.path.exists(pipeline_csv):
                with open(pipeline_csv, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        end_time = row["end_time"] if row["end_time"] else None
                        cur.execute(
                            """
                            INSERT INTO pipeline_runs (pipeline_run_id, pipeline_name, start_time, end_time, status, records_ingested, records_processed, records_failed, records_anomalous, error_message)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (pipeline_run_id) DO NOTHING;
                            """,
                            (
                                int(row["pipeline_run_id"]), row["pipeline_name"], row["start_time"],
                                end_time, row["status"], int(row["records_ingested"]),
                                int(row["records_processed"]), int(row["records_failed"]),
                                int(row["records_anomalous"]), row.get("error_message") or None
                            )
                        )
                print("Pipeline runs seeded.")

            # 5. Data Quality Logs
            dq_csv = os.path.join(RAW_DATA_DIR, "fluxora_data_quality_logs.csv")
            if os.path.exists(dq_csv):
                with open(dq_csv, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        cur.execute(
                            """
                            INSERT INTO data_quality_logs (quality_log_id, pipeline_run_id, table_name, check_type, column_name, invalid_record_count, total_record_count, quality_score, status, error_message, created_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (quality_log_id) DO NOTHING;
                            """,
                            (
                                int(row["quality_log_id"]), int(row["pipeline_run_id"]), row["table_name"],
                                row["check_type"], row["column_name"], int(row["invalid_record_count"]),
                                int(row["total_record_count"]), float(row["quality_score"]),
                                row["status"], row.get("error_message") or None, row["created_at"]
                            )
                        )
                print("Data quality logs seeded.")

            # 6. Anomalies
            anomaly_csv = os.path.join(RAW_DATA_DIR, "fluxora_anomalies.csv")
            if os.path.exists(anomaly_csv):
                with open(anomaly_csv, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        cur.execute(
                            """
                            INSERT INTO anomalies (anomaly_id, transaction_id, anomaly_score, is_anomaly, model_name, model_version, detected_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (anomaly_id) DO NOTHING;
                            """,
                            (
                                int(row["anomaly_id"]), row["transaction_id"], float(row["anomaly_score"]),
                                row["is_anomaly"].lower() == "true", row["model_name"], row["model_version"], row["detected_at"]
                            )
                        )
                print("Anomalies seeded.")

        conn.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed()
