import os
from datetime import datetime
import numpy as np
from sklearn.ensemble import IsolationForest
from dotenv import load_dotenv
import psycopg

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgresql@127.0.0.1:5432/pipelix_db")
conn_str = DATABASE_URL.replace("postgresql+psycopg://", "postgresql://")

def run_anomaly_detection():
    """Detect unusual transactions using Isolation Forest ML model."""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Running ML Anomaly Detection...")

    with psycopg.connect(conn_str) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT transaction_id, quantity, unit_price, total_amount FROM transactions;")
            rows = cur.fetchall()

            if not rows:
                print("No transactions found for anomaly detection.")
                return

            txn_ids = [r[0] for r in rows]
            # Convert to float features: quantity, unit_price, total_amount
            features = []
            for r in rows:
                qty = float(r[1])
                price = float(r[2])
                total = float(r[3]) if r[3] is not None else (qty * price)
                features.append([qty, price, total])

            X = np.array(features)

            # Fit Isolation Forest
            model = IsolationForest(contamination=0.2, random_state=42)
            preds = model.fit_predict(X)  # -1 for anomaly, 1 for normal
            scores = model.decision_function(X)  # lower = more abnormal

            # Anomaly results are derived data, so recompute them for the current transactions.
            cur.execute("DELETE FROM anomalies;")

            anomalies_detected = 0
            for txn_id, pred, score in zip(txn_ids, preds, scores):
                is_anomaly = bool(pred == -1)
                anomaly_score = round(float(score), 5)
                if is_anomaly:
                    anomalies_detected += 1

                cur.execute(
                    """
                    INSERT INTO anomalies (transaction_id, anomaly_score, is_anomaly, model_name, model_version, detected_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (anomaly_id) DO NOTHING;
                    """,
                    (txn_id, anomaly_score, is_anomaly, "IsolationForest", "v1.0", datetime.now())
                )

            cur.execute(
                """
                UPDATE pipeline_runs
                SET records_anomalous = %s
                WHERE pipeline_run_id = (
                    SELECT pipeline_run_id
                    FROM pipeline_runs
                    ORDER BY pipeline_run_id DESC
                    LIMIT 1
                );
                """,
                (anomalies_detected,),
            )
            conn.commit()
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Detection complete. Anomalies detected: {anomalies_detected} of {len(txn_ids)} transactions.")

if __name__ == "__main__":
    run_anomaly_detection()
