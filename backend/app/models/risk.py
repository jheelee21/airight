from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Risk(Base):
    """
    Risk represents a potential threat to a node or route.
    Categories: geological, political, physical, economic
    """
    __tablename__ = "risk"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("business.id"), nullable=False)
    
    # Target can be a 'node' or a 'route'
    target_type = Column(String, nullable=False) 
    target_id = Column(Integer, nullable=False)  # ID of the node or route
    
    category = Column(String, nullable=False)
    severity = Column(Float, nullable=False)     # 0.0 to 1.0
    probability = Column(Float, nullable=False)  # 0.0 to 1.0
    description = Column(String, nullable=False)
    
    actions = relationship("Action", back_populates="risk", cascade="all, delete-orphan")
