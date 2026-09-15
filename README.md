-- Active: 1788499838907@@127.0.0.1@5432@pipelix_db
# Pipelix

### Intelligent Data Pipeline & Anomaly Detection Platform

Pipelix is an end-to-end data engineering and machine learning platform designed to automate **data ingestion, data quality validation, transformation, storage, monitoring, and anomaly detection**.

The project demonstrates how modern data engineering pipelines can integrate machine learning to identify unusual data patterns and potential data-quality issues.

---

## 🚀 Features

* Automated data ingestion from CSV files and REST APIs
* Data cleaning and preprocessing
* Duplicate and missing-value detection
* Data type and schema validation
* ETL pipeline for transforming raw data
* PostgreSQL-based data storage
* Apache Airflow pipeline orchestration
* PySpark-based distributed data processing
* Machine learning-based anomaly detection
* Data quality monitoring
* Interactive Streamlit dashboard
* Docker-based development environment
* Pipeline logging and failure tracking

---

## 🏗️ System Architecture

```text
                         DATA SOURCES
                     ┌───────┼────────┐
                     ↓       ↓        ↓
                   CSV     REST API  Database
                     └───────┼────────┘
                             ↓
                       DATA INGESTION
                             ↓
                    DATA VALIDATION
                             ↓
                    DATA TRANSFORMATION
                     ┌───────┴────────┐
                     ↓                ↓
                  Pandas           PySpark
                     └───────┬────────┘
                             ↓
                        PostgreSQL
                             ↓
                    FEATURE ENGINEERING
                             ↓
                    ML ANOMALY DETECTION
                             ↓
                 ┌───────────┴───────────┐
                 ↓                       ↓
          Data Quality              Anomaly Results
                 └───────────┬───────────┘
                             ↓
                     STREAMLIT DASHBOARD
                             ↓
                    Reports / Monitoring
```

---

## 🧰 Tech Stack

### Programming & Data Processing

* Python
* Pandas
* NumPy
* PySpark

### Database

* PostgreSQL
* SQL
* SQLAlchemy

### Data Engineering

* ETL / ELT
* Apache Airflow
* REST APIs
* Data validation
* Data quality monitoring

### Machine Learning

* Scikit-learn
* Isolation Forest
* Feature Engineering
* Anomaly Detection

### Application & DevOps

* Streamlit
* Docker
* Docker Compose
* Git
* GitHub

---

## 📂 Project Structure

```text
Pipelix/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── ingestion/
│   ├── csv_ingestion.py
│   └── api_ingestion.py
│
├── etl/
│   ├── cleaning.py
│   ├── validation.py
│   └── transformation.py
│
├── ml/
│   ├── feature_engineering.py
│   ├── anomaly_detection.py
│   └── model.py
│
├── airflow/
│   └── Pipelix_pipeline.py
│
├── database/
│   └── schema.sql
│
├── dashboard/
│   └── app.py
│
├── tests/
│
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🔄 Data Pipeline

Pipelix follows an automated ETL workflow:

### 1. Extract

Data is collected from different sources such as:

* CSV files
* REST APIs
* External databases

### 2. Validate

Incoming data is checked for:

* Missing values
* Duplicate records
* Invalid data types
* Invalid values
* Schema inconsistencies

### 3. Transform

The pipeline performs:

* Data cleaning
* Type conversion
* Feature creation
* Normalization
* Aggregation

### 4. Load

Cleaned data is stored in PostgreSQL for further analysis and machine learning.

### 5. Detect

The ML pipeline analyzes relevant numerical features and identifies unusual records using an anomaly detection model.

### 6. Monitor

Pipeline execution and data-quality metrics are displayed through the Pipelix dashboard.

---

## 🤖 Machine Learning

Pipelix uses **Isolation Forest** for unsupervised anomaly detection.

Isolation Forest is suitable for this project because anomaly detection does not always have labeled examples of what constitutes an abnormal record.

Example:

```text
Normal transactions

₹450
₹780
₹1,200
₹950
₹2,100

                    ↓

              ML Model

                    ↓

Potential anomaly

₹250,000
```

The model generates an anomaly score for each record, which is then stored alongside the processed data.

---

## 📊 Data Quality Monitoring

Pipelix tracks metrics such as:

```text
Total Records       : 1,250,000
Valid Records       : 1,214,000
Missing Values      : 1.8%
Duplicate Records   : 0.4%
Invalid Records     : 0.7%
Anomalies Detected  : 2,431
Pipeline Status     : SUCCESS
```

These values are examples and will be replaced with actual project results.

---

## 📈 Dashboard

The Streamlit dashboard will provide:

* Overall data quality score
* Record statistics
* Missing-value analysis
* Duplicate detection
* Anomaly distribution
* Anomaly records
* Pipeline execution status
* Historical data-quality trends

---

## 🗄️ Database Design

The PostgreSQL database will contain tables such as:

```text
customers
    │
    └──────< transactions >────── products

data_quality_logs

anomalies

pipeline_runs
```

Example anomaly record:

```text
id
transaction_id
anomaly_score
anomaly_status
detected_at
```

---

## ⚙️ Installation

### Prerequisites

Make sure the following are installed:

* Python 3.11+
* Git
* Docker Desktop
* PostgreSQL
* VS Code

### Clone the repository

```bash
git clone <repository-url>

cd Pipelix
```

### Create a virtual environment

Windows:

```powershell
python -m venv .venv

.venv\Scripts\activate
```

Linux/macOS:

```bash
python3 -m venv .venv

source .venv/bin/activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

---

## 🔐 Environment Variables

Create a `.env` file:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=Pipelix
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

Never commit the `.env` file to GitHub.

---

## ▶️ Running the Project

Start the required services:

```bash
docker compose up -d
```

Run the data pipeline:

```bash
python ingestion/csv_ingestion.py
```

Run the ML pipeline:

```bash
python ml/anomaly_detection.py
```

Start the dashboard:

```bash
streamlit run dashboard/app.py
```

---

## 🧪 Testing

Run the test suite:

```bash
pytest
```

Tests will cover:

* Data validation
* ETL transformations
* Database operations
* ML preprocessing
* Anomaly detection

---

## 📌 Future Improvements

* Add Apache Kafka for real-time data ingestion
* Add AWS S3 for cloud-based data storage
* Add a cloud data warehouse
* Implement real-time anomaly detection
* Add automated email/Slack alerts
* Add data lineage tracking
* Implement model monitoring
* Add CI/CD using GitHub Actions
* Improve pipeline scalability
* Add role-based dashboard access

---

## 🎯 Learning Objectives

This project is designed to demonstrate practical knowledge of:

* Data Engineering
* ETL pipelines
* SQL and relational databases
* Data quality engineering
* Distributed data processing
* Machine Learning
* Workflow orchestration
* Containerization
* Data visualization
* Software engineering practices

---

## 👨‍💻 Author

**Navaneeth Raj**

Computer Science & Engineering Student

GitHub: `https://github.com/Navaneeth-18bit`

LinkedIn: `https://www.linkedin.com/in/navaneeth-raj-a68703292/`

---

## 📄 License

This project is licensed under the MIT License.
