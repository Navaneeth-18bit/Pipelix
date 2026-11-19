from datetime import datetime

import numpy as np
from sklearn.ensemble import IsolationForest
from dotenv import load_dotenv

from backend.database import get_supabase

load_dotenv()


def run_anomaly_detection():
    db = get_supabase()
    response = db.table("transactions").select(
        "transaction_id,quantity,unit_price,total_amount"
    ).execute()
    rows = response.data
    if not rows:
        print("No transactions found for anomaly detection.")
        return

    features = []
    transaction_ids = []
    for row in rows:
        quantity = float(row["quantity"])
        unit_price = float(row["unit_price"])
        total = float(row["total_amount"]) if row.get("total_amount") is not None else quantity * unit_price
        transaction_ids.append(row["transaction_id"])
        features.append([quantity, unit_price, total])

    model = IsolationForest(contamination=0.2, random_state=42)
    predictions = model.fit_predict(np.array(features))
    scores = model.decision_function(np.array(features))

    db.table("anomalies").delete().neq("anomaly_id", -1).execute()
    anomaly_records = []
    for transaction_id, prediction, score in zip(transaction_ids, predictions, scores):
        is_anomaly = prediction == -1
        anomaly_records.append({
            "transaction_id": transaction_id,
            "anomaly_score": round(float(score), 5),
            "is_anomaly": bool(is_anomaly),
            "model_name": "IsolationForest",
            "model_version": "v1.0",
            "detected_at": datetime.now().isoformat(),
        })
    db.table("anomalies").insert(anomaly_records).execute()

    detected = sum(record["is_anomaly"] for record in anomaly_records)
    latest = db.table("pipeline_runs").select("pipeline_run_id").order(
        "pipeline_run_id", desc=True
    ).limit(1).execute()
    if latest.data:
        db.table("pipeline_runs").update({
            "records_anomalous": detected,
        }).eq("pipeline_run_id", latest.data[0]["pipeline_run_id"]).execute()

    print(f"Detection complete. Anomalies detected: {detected} of {len(rows)} transactions.")


if __name__ == "__main__":
    run_anomaly_detection()
