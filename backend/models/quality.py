from sqlalchemy import Column, BigInteger, String, Integer, Numeric, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.database import Base

class DataQualityLog(Base):
    __tablename__ = "data_quality_logs"

    quality_log_id = Column(BigInteger, primary_key=True, autoincrement=True)
    pipeline_run_id = Column(BigInteger, ForeignKey("pipeline_runs.pipeline_run_id", ondelete="CASCADE"), nullable=False, index=True)
    table_name = Column(String(100), nullable=False)
    check_type = Column(String(100), nullable=False)
    column_name = Column(String(100), nullable=True)
    invalid_record_count = Column(Integer, nullable=False, default=0)
    total_record_count = Column(Integer, nullable=False, default=0)
    quality_score = Column(Numeric(5, 2), nullable=False)
    status = Column(String(20), nullable=False, index=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    pipeline_run = relationship("PipelineRun", back_populates="quality_logs")
