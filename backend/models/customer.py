from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.database import Base

class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(String(50), primary_key=True)
    customer_name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False, unique=True)
    city = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    transactions = relationship("Transaction", back_populates="customer", cascade="all, delete-orphan")
