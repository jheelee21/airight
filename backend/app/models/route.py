from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class Route(Base):
    """
    Route is a connection between two nodes.
    E.g. factory to warehouse, warehouse to distribution center.
    Contains information about transportation, lead time, cost,
    starting / destination nodes, and the material that is transported.
    """
    __tablename__ = "route"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("business.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    start_entity_id = Column(Integer, ForeignKey("entity.id"), nullable=False)
    end_entity_id = Column(Integer, ForeignKey("entity.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("item.id"), nullable=False)
    transportation_mode = Column(String, nullable=False)
    lead_time = Column(Integer, nullable=False)
    cost = Column(Integer, nullable=False)
    # TODO: add more ... domain related columns