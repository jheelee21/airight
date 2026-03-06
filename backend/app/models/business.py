from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Business(Base):
    """
    Business is a company that owns one or more nodes.
    It has its own supply chain made out of nodes.
    """
    __tablename__ = "business"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    news = relationship("News", back_populates="business")
    product_lines = Column(String, nullable=True) # Comma separated for now
    competitors = Column(String, nullable=True)
    regional_focus = Column(String, nullable=True)
