import csv
import os
from datetime import datetime
from dotenv import load_dotenv

from backend.database import get_supabase

load_dotenv()

RAW_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "raw")


def run_etl_pipeline():
    start_time = datetime.now()
    db = get_supabase()
    print(f"[{start_time.strftime('%Y-%m-%d %H:%M:%S')}] Starting Pipelix ETL Pipeline...")

    run_response = db.table("pipeline_runs").insert({
        "pipeline_name": "pipelix_automated_etl",
        "start_time": start_time.isoformat(),
        "status": "RUNNING",
        "records_ingested": 0,
        "records_processed": 0,
        "records_failed": 0,
        "records_anomalous": 0,
    }).execute()
    run_id = run_response.data[0]["pipeline_run_id"]

    txn_csv = os.path.join(RAW_DATA_DIR, "fluxora_transactions.csv")
    ingested_count = 0
    processed_count = 0
    failed_count = 0

    if os.path.exists(txn_csv):
        with open(txn_csv, "r", encoding="utf-8-sig", newline="") as file:
            reader = csv.DictReader(file)
            for row in reader:
                ingested_count += 1
                try:
                    quantity = int(row["quantity"])
                    unit_price = float(row["unit_price"])
                    if quantity <= 0 or unit_price <= 0:
                        failed_count += 1
                        continue
                    payload = {
                        "transaction_id": row["transaction_id"].strip(),
                        "customer_id": row["customer_id"].strip(),
                        "product_id": row["product_id"].strip(),
                        "transaction_date": row["transaction_date"].strip(),
                        "quantity": quantity,
                        "unit_price": unit_price,
                        "payment_method": row["payment_method"].strip(),
                        "location": (row.get("location") or "").strip() or None,
                        "created_at": (row.get("created_at") or "").strip() or start_time.isoformat(),
                    }
                    db.table("transactions").upsert(payload, on_conflict="transaction_id").execute()
                    processed_count += 1
                except Exception:
                    failed_count += 1

    quality_score = round((ingested_count - failed_count) / ingested_count * 100, 2) if ingested_count else 100.0
    dq_status = "PASS" if failed_count == 0 else ("WARNING" if quality_score >= 90 else "FAIL")
    db.table("data_quality_logs").insert({
        "pipeline_run_id": run_id,
        "table_name": "transactions",
        "check_type": "validation_check",
        "column_name": "all_columns",
        "invalid_record_count": failed_count,
        "total_record_count": ingested_count,
        "quality_score": quality_score,
        "status": dq_status,
        "created_at": datetime.now().isoformat(),
    }).execute()

    end_time = datetime.now()
    db.table("pipeline_runs").update({
        "end_time": end_time.isoformat(),
        "status": "SUCCESS" if failed_count == 0 else "WARNING",
        "records_ingested": ingested_count,
        "records_processed": processed_count,
        "records_failed": failed_count,
    }).eq("pipeline_run_id", run_id).execute()

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ETL Pipeline #{run_id} completed.")


if __name__ == "__main__":
    run_etl_pipeline()
