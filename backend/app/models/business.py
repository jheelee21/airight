from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class Business(Base):
    """
    Business is a company that owns one or more nodes.
    It has its own supply chain made out of nodes.
    """
    __tablename__ = "business"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    product_lines = Column(String, nullable=True) # Comma separated for now
    competitors = Column(String, nullable=True)
    regional_focus = Column(String, nullable=True)
