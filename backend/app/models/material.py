from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base

class Material(Base):
    """
    Material is a raw material, a component, or a finished product.
    category: raw material, component, finished product
    """
    __tablename__ = "material"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)
    business_id = Column(Integer, ForeignKey("business.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    