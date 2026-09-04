from sqlalchemy import Column, BigInteger, String, Integer, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.database import Base

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    pipeline_run_id = Column(BigInteger, primary_key=True, autoincrement=True)
    pipeline_name = Column(String(100), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), nullable=False, default="RUNNING")
    records_ingested = Column(Integer, nullable=False, default=0)
    records_processed = Column(Integer, nullable=False, default=0)
    records_failed = Column(Integer, nullable=False, default=0)
    records_anomalous = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)

    quality_logs = relationship("DataQualityLog", back_populates="pipeline_run", cascade="all, delete-orphan")
