from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Action(Base):
    """
    Action represents a mitigation strategy or response plan for a RiskFactor.
    Types: Avoidance, Mitigation, Transfer, Acceptance
    """
    __tablename__ = "action"

    id = Column(Integer, primary_key=True, index=True)
    risk_id = Column(Integer, ForeignKey("risk.id"), nullable=False)

    action_type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    estimated_cost = Column(Float, nullable=True)
    expected_impact = Column(Float, nullable=True)  # 0.0 to 1.0 improvement
    implementation_status = Column(String, nullable=False)

    risk = relationship("Risk", back_populates="actions")
