from sqlalchemy import Column, String, Numeric, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.database import Base

class Product(Base):
    __tablename__ = "products"

    product_id = Column(String(50), primary_key=True)
    product_name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    transactions = relationship("Transaction", back_populates="product", cascade="all, delete-orphan")
