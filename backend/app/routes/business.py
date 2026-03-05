from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.entity import Entity
from models.route import Route
from models.business import Business
import schemas.business as business_schemas

router = APIRouter(prefix="/api/business", tags=["Business"])

@router.get("/{business_id}/graph", response_model=business_schemas.GraphResponse)
def get_business_graph(business_id: int, db: Session = Depends(get_db)):
    """
    Returns the dependency graph for a specific business.
    The graph consists of entities (nodes) and routes (edges).
    """
    # Check if business exists
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Fetch nodes (entities)
    entities = db.query(Entity).filter(Entity.business_id == business_id).all()
    
    # Fetch edges (routes)
    routes = db.query(Route).filter(Route.business_id == business_id).all()

    return {
        "business_id": business_id,
        "nodes": entities,
        "edges": routes
    }
