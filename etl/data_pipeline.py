import os
import csv
from datetime import datetime
from dotenv import load_dotenv
import psycopg

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgresql@127.0.0.1:5432/pipelix_db")
RAW_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "raw")
conn_str = DATABASE_URL.replace("postgresql+psycopg://", "postgresql://")

def run_etl_pipeline():
    """Executes the data pipeline: Ingestion -> Validation -> Storage -> Quality Logging."""
    start_time = datetime.now()
    print(f"[{start_time.strftime('%Y-%m-%d %H:%M:%S')}] Starting Pipelix ETL Pipeline...")

    with psycopg.connect(conn_str) as conn:
        with conn.cursor() as cur:
            # 1. Create pipeline_run entry
            cur.execute(
                """
                INSERT INTO pipeline_runs (pipeline_name, start_time, status, records_ingested, records_processed, records_failed, records_anomalous)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING pipeline_run_id;
                """,
                ("pipelix_automated_etl", start_time, "RUNNING", 0, 0, 0, 0)
            )
            run_id = cur.fetchone()[0]
            conn.commit()

            # 2. Ingest transactions from CSV
            txn_csv = os.path.join(RAW_DATA_DIR, "fluxora_transactions.csv")
            ingested_count = 0
            processed_count = 0
            failed_count = 0

            if os.path.exists(txn_csv):
                with open(txn_csv, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        ingested_count += 1
                        try:
                            qty = int(row["quantity"])
                            price = float(row["unit_price"])
                            if qty <= 0 or price <= 0:
                                failed_count += 1
                                continue

                            cur.execute(
                                """
                                INSERT INTO transactions (transaction_id, customer_id, product_id, transaction_date, quantity, unit_price, payment_method, location, created_at)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                                ON CONFLICT (transaction_id) DO UPDATE 
                                SET quantity = EXCLUDED.quantity, unit_price = EXCLUDED.unit_price;
                                """,
                                (
                                    row["transaction_id"], row["customer_id"], row["product_id"],
                                    row["transaction_date"], qty, price,
                                    row["payment_method"], row["location"], row["created_at"]
                                )
                            )
                            processed_count += 1
                        except Exception as e:
                            failed_count += 1

            # 3. Log Data Quality check
            quality_score = round(((ingested_count - failed_count) / ingested_count * 100), 2) if ingested_count > 0 else 100.0
            dq_status = "PASS" if failed_count == 0 else ("WARNING" if quality_score >= 90 else "FAIL")

            cur.execute(
                """
                INSERT INTO data_quality_logs (pipeline_run_id, table_name, check_type, column_name, invalid_record_count, total_record_count, quality_score, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (run_id, "transactions", "validation_check", "all_columns", failed_count, ingested_count, quality_score, dq_status, datetime.now())
            )

            # 4. Finish pipeline run
            end_time = datetime.now()
            cur.execute(
                """
                UPDATE pipeline_runs
                SET end_time = %s, status = %s, records_ingested = %s, records_processed = %s, records_failed = %s
                WHERE pipeline_run_id = %s;
                """,
                (end_time, "SUCCESS" if failed_count == 0 else "WARNING", ingested_count, processed_count, failed_count, run_id)
            )
            conn.commit()

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ETL Pipeline #{run_id} completed. Processed: {processed_count}, Failed: {failed_count}.")

if __name__ == "__main__":
    run_etl_pipeline()
