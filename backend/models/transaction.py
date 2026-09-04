from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey, FetchedValue
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String(50), primary_key=True)
    customer_id = Column(String(50), ForeignKey("customers.customer_id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(50), ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_date = Column(DateTime(timezone=True), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_amount = Column(Numeric(12, 2), server_default=FetchedValue())
    payment_method = Column(String(50), nullable=False)
    location = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    customer = relationship("Customer", back_populates="transactions")
    product = relationship("Product", back_populates="transactions")
    anomaly = relationship("Anomaly", back_populates="transaction", uselist=False, cascade="all, delete-orphan")
