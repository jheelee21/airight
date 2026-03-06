from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import datetime

class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("business.id"))
    risk_id = Column(Integer, ForeignKey("risk.id"), nullable=True)
    
    title = Column(String, index=True)
    content = Column(Text)
    source = Column(String)
    url = Column(String, nullable=True)
    published_at = Column(DateTime, default=datetime.datetime.utcnow)

    business = relationship("Business", back_populates="news")
    risk = relationship("Risk", back_populates="news")
