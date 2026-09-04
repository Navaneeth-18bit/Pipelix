from sqlalchemy import Column, BigInteger, String, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.database import Base

class Anomaly(Base):
    __tablename__ = "anomalies"

    anomaly_id = Column(BigInteger, primary_key=True, autoincrement=True)
    transaction_id = Column(String(50), ForeignKey("transactions.transaction_id", ondelete="CASCADE"), nullable=False, index=True)
    anomaly_score = Column(Numeric(6, 5), nullable=False)
    is_anomaly = Column(Boolean, nullable=False, index=True)
    model_name = Column(String(100), nullable=False, default="IsolationForest")
    model_version = Column(String(50), nullable=False, default="v1.0")
    detected_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    transaction = relationship("Transaction", back_populates="anomaly")
