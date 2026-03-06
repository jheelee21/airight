from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class Entity(Base):
    """
    Entity is a physical location that is part of a business's supply chain.
    E.g. factory, warehouse, distribution center, supplier, oem, etc.

    Not necessarily owned by the business. It can be a third party.
    """
    __tablename__ = "entity"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("business.id"), nullable=False)
    category = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    location = Column(String, nullable=False)
    # TODO: add more ... domain related columns
